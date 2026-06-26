import 'dotenv/config'
import cors from 'cors'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import { registerAgentRoutes } from './agent'
import {
  defaultPlannerConfig,
  plannerConfigSchema,
} from '../src/domain/config'
import {
  optimizeRoutes,
  refineRouteWithRoadLegs,
} from '../src/domain/optimizer'
import { haversineMiles } from '../src/domain/geo'
import {
  filterOpenStations,
  filterStationsForConfig,
  normalizeSuperchargeSites,
} from '../src/domain/stations'
import type { PlannerConfig, Station } from '../src/domain/types'
import { z } from 'zod'

const METERS_PER_MILE = 1609.344

const SUPERCHARGE_INFO_URL =
  'https://supercharge.info/service/supercharge/allSites'
const OSRM_DEMO_URL = 'https://router.project-osrm.org'
const OSRM_BASE_URL = process.env.OSRM_BASE_URL ?? OSRM_DEMO_URL
const OSRM_REAL = OSRM_BASE_URL.length > 0 && OSRM_BASE_URL !== OSRM_DEMO_URL

const ORS_API_KEY = process.env.ORS_API_KEY ?? ''
const ORS_BASE_URL = process.env.ORS_BASE_URL ?? 'https://api.openrouteservice.org'
const MAX_ORS_COORDINATES = 48 // ORS free directions waypoint cap is ~50
// ORS free caps each request's route distance at 6,000 km; chunk well under that
// (straight-line, since the actual road route runs ~20-40% longer).
const MAX_ORS_CHUNK_METERS = 4_000_000

// Road-accurate distances/times are only fetched when a real engine is set:
// OpenRouteService (preferred — true speed-limit durations) or a real OSRM.
// Otherwise the app uses fast, free estimates.
const ROAD_PROVIDER: 'ors' | 'osrm' | 'none' = ORS_API_KEY
  ? 'ors'
  : OSRM_REAL
    ? 'osrm'
    : 'none'
// ORS health: the UI should treat road routing as "on" only when the key actually
// works. A present-but-invalid or quota-exhausted ORS key must flip the site back
// to estimate mode (which brings back the manual Average-speed control), so we
// validate the key with a cheap cached probe and also mark it unhealthy whenever a
// real routing call is rejected.
const ORS_HEALTH_TTL_MS = 1000 * 60 * 5
// Two close, reliably-routable points (downtown SF -> Oakland) used only to probe
// whether the ORS key authenticates and still has quota.
const ORS_PROBE_COORDS: LatLon[] = [
  { lat: 37.7749, lon: -122.4194 },
  { lat: 37.8044, lon: -122.2712 },
]
let orsHealth = { ok: true, checkedAt: 0, reason: '' }

function markOrsHealth(ok: boolean, reason = ''): void {
  orsHealth = { ok, checkedAt: Date.now(), reason }
}

/** One cheap ORS request to confirm the key authenticates and has quota. */
async function probeOrsKey(): Promise<boolean> {
  try {
    await requestOrsChunk(ORS_PROBE_COORDS, () => {}, 1)
    markOrsHealth(true)
    return true
  } catch (error) {
    markOrsHealth(false, error instanceof Error ? error.message : 'ORS probe failed')
    return false
  }
}

/** Whether road routing is actually usable right now (presence AND validity). */
async function isRoadRoutingHealthy(): Promise<boolean> {
  if (ROAD_PROVIDER === 'none') return false
  if (ROAD_PROVIDER === 'osrm') return true
  // ORS: serve cached health, refreshing with a cheap probe when stale.
  if (Date.now() - orsHealth.checkedAt < ORS_HEALTH_TTL_MS) return orsHealth.ok
  return probeOrsKey()
}

const CACHE_TTL_MS = 1000 * 60 * 60
const MAX_OSRM_COORDINATES = 32
const PORT = Number(process.env.PORT ?? 4177)

interface StationCache {
  fetchedAt: string
  stations: Station[]
}

let stationCache: StationCache | null = null
const roadRouteCache = new Map<string, unknown>()

const roadRouteSchema = z.object({
  coordinates: z
    .array(
      z.object({
        lat: z.coerce.number().min(-90).max(90),
        lon: z.coerce.number().min(-180).max(180),
      }),
    )
    .min(2)
    .max(2000),
})

const refineRouteSchema = z.object({
  config: z.record(z.string(), z.unknown()).optional(),
  route: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    strategy: z.string().default(''),
    color: z.string().default('#e82127'),
  }),
  stations: z
    .array(
      z
        .object({
          position: z.object({
            lat: z.coerce.number().min(-90).max(90),
            lon: z.coerce.number().min(-180).max(180),
          }),
        })
        .passthrough(),
    )
    .min(1)
    .max(5000),
})

async function loadStations(force = false): Promise<StationCache> {
  if (
    !force &&
    stationCache &&
    Date.now() - new Date(stationCache.fetchedAt).getTime() < CACHE_TTL_MS
  ) {
    return stationCache
  }

  const response = await fetch(SUPERCHARGE_INFO_URL, {
    headers: {
      'User-Agent':
        'TeslaSuperchargerQuestPlanner/1.0 (+local route planning app)',
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(
      `Supercharge.info responded with ${response.status} ${response.statusText}`,
    )
  }

  const payload = (await response.json()) as unknown[]
  const nextCache: StationCache = {
    fetchedAt: new Date().toISOString(),
    stations: normalizeSuperchargeSites(payload),
  }
  stationCache = nextCache
  return nextCache
}

const app = express()
app.use(cors())
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', async (_request, response) => {
  const enabled = await isRoadRoutingHealthy()
  response.json({
    ok: true,
    service: 'tesla-supercharger-quest',
    time: new Date().toISOString(),
    roadRouting: { enabled, provider: ROAD_PROVIDER },
  })
})

app.get('/api/stations', async (request, response) => {
  try {
    const cache = await loadStations(request.query.refresh === 'true')
    const config = plannerConfigSchema.parse({
      ...defaultPlannerConfig,
      includeCanada: request.query.includeCanada === 'true',
      includeMexico: request.query.includeMexico === 'true',
    })
    const openStations = filterOpenStations(cache.stations)
    const stations = filterStationsForConfig(cache.stations, config)

    response.json({
      source: {
        name: 'Supercharge.info',
        url: SUPERCHARGE_INFO_URL,
        fetchedAt: cache.fetchedAt,
      },
      totalNormalized: cache.stations.length,
      totalOpen: openStations.length,
      filteredStations: stations.length,
      stations,
    })
  } catch (error) {
    response.status(502).json({
      error: 'station_feed_failed',
      message:
        error instanceof Error
          ? error.message
          : 'Unable to load station feed from Supercharge.info.',
    })
  }
})

app.post('/api/optimize', async (request, response) => {
  try {
    const cache = await loadStations()
    const config = plannerConfigSchema.parse({
      ...defaultPlannerConfig,
      ...request.body,
      start: {
        ...defaultPlannerConfig.start,
        ...request.body?.start,
      },
    })
    const result = optimizeRoutes(cache.stations, config, cache.fetchedAt)

    response.json(result)
  } catch (error) {
    response.status(400).json({
      error: 'optimization_failed',
      message:
        error instanceof Error
          ? error.message
          : 'Unable to generate optimized routes.',
    })
  }
})

app.post('/api/road-route', async (request, response) => {
  try {
    const { coordinates } = roadRouteSchema.parse(request.body)
    const cacheKey = createHash('sha256')
      .update(JSON.stringify({ coordinates, osrm: OSRM_BASE_URL }))
      .digest('hex')
    const cached = roadRouteCache.get(cacheKey)

    if (cached) {
      response.json(cached)
      return
    }

    const roadRoute = await fetchOsrmRoute(coordinates)
    const payload = {
      generatedAt: new Date().toISOString(),
      source: {
        name: 'OSRM',
        url: OSRM_BASE_URL,
      },
      coordinateCount: coordinates.length,
      requestCount: roadRoute.requestCount,
      roadLine: roadRoute.roadLine,
      warnings: [...demoWarning(), ...roadRoute.warnings],
    }

    roadRouteCache.set(cacheKey, payload)
    response.json(payload)
  } catch (error) {
    response.status(502).json({
      error: 'road_route_failed',
      message:
        error instanceof Error
          ? error.message
          : 'Unable to generate road geometry.',
    })
  }
})

app.post('/api/refine-route', async (request, response) => {
  try {
    const { config, route, stations } = refineRouteSchema.parse(request.body)
    const partialConfig = (config ?? {}) as Partial<PlannerConfig>
    const sanitized = plannerConfigSchema.parse({
      ...defaultPlannerConfig,
      ...partialConfig,
      start: { ...defaultPlannerConfig.start, ...(partialConfig.start ?? {}) },
    })
    const orderedStations = stations as unknown as Station[]

    // start -> every stop -> back to start
    const coordinates = [
      sanitized.start,
      ...orderedStations.map((station) => station.position),
      sanitized.start,
    ]
    const road = await fetchRoadProvider(coordinates)

    // One value per leg (orderedStations.length + 1). If the engine came up short
    // (a failed segment), pad miles with straight-line and let drive time fall back.
    const expectedLegs = orderedStations.length + 1
    const legMiles = Array.from({ length: expectedLegs }, (_, i) =>
      road.legMiles[i] ?? haversineMiles(coordinates[i], coordinates[i + 1]),
    )
    const driveHours = Array.from(
      { length: expectedLegs },
      (_, i) => road.legDriveHours[i] ?? legMiles[i] / 60,
    )

    const refined = refineRouteWithRoadLegs(
      orderedStations,
      sanitized,
      route,
      legMiles,
      driveHours,
    )

    response.json({
      generatedAt: new Date().toISOString(),
      source: { name: road.provider.toUpperCase(), url: road.provider === 'ors' ? ORS_BASE_URL : OSRM_BASE_URL },
      requestCount: road.requestCount,
      route: refined,
      roadLine: road.roadLine,
      warnings: road.warnings,
      // True when the engine was rejected (bad key / exhausted quota) and these
      // are straight-line estimates — the client uses this to drop back to
      // estimate mode and restore the manual Average-speed control.
      degraded: road.degraded ?? false,
    })
  } catch (error) {
    response.status(502).json({
      error: 'refine_route_failed',
      message:
        error instanceof Error
          ? error.message
          : 'Unable to compute road-accurate route.',
    })
  }
})

function demoWarning(): string[] {
  return OSRM_BASE_URL === 'https://router.project-osrm.org'
    ? [
        'Using the public OSRM demo server, which is unreliable for long routes. Point OSRM_BASE_URL at a local OSRM instance for accurate road distances.',
      ]
    : []
}

registerAgentRoutes(app, () => loadStations())

type LatLon = { lat: number; lon: number }

interface RoadSegment {
  geometry: LatLon[]
  /** Miles per leg, length = coordinates.length - 1. */
  legMiles: number[]
  /** Real drive hours per leg (speed-limit aware), same length as legMiles. */
  legDriveHours: number[]
}

interface RoadResult {
  roadLine: LatLon[]
  legMiles: number[]
  legDriveHours: number[]
  warnings: string[]
  requestCount: number
  /** True when the engine failed and the result is a straight-line estimate. */
  degraded?: boolean
}

/** Dispatch to the configured engine: OpenRouteService (preferred) or OSRM. */
async function fetchRoadProvider(coordinates: LatLon[]) {
  if (ROAD_PROVIDER === 'ors') {
    return { provider: 'ors' as const, ...(await fetchOrsRoute(coordinates)) }
  }
  return { provider: 'osrm' as const, ...(await fetchOsrmRoute(coordinates)) }
}

/* ---- OpenRouteService (true speed-limit durations) ---- */

/** Carries the HTTP status so callers can tell auth/quota failures apart. */
class OrsError extends Error {
  status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.status = status
  }
}

async function fetchOrsRoute(coordinates: LatLon[]): Promise<RoadResult> {
  const chunks = chunkByDistance(
    coordinates,
    MAX_ORS_COORDINATES,
    MAX_ORS_CHUNK_METERS,
  )
  const roadLine: LatLon[] = []
  const legMiles: number[] = []
  const legDriveHours: number[] = []
  let requestCount = 0

  try {
    for (const chunk of chunks) {
      const segment = await requestOrsChunk(chunk, () => {
        requestCount += 1
      })
      if (roadLine.length > 0) segment.geometry.shift()
      roadLine.push(...segment.geometry)
      legMiles.push(...segment.legMiles)
      legDriveHours.push(...segment.legDriveHours)
    }
    markOrsHealth(true)
    return { roadLine, legMiles, legDriveHours, warnings: [], requestCount }
  } catch (error) {
    // ORS failed — most often an expired key (401/403) or an exhausted free-tier
    // quota (429). Don't 502 the whole route: return straight-line geometry with
    // NO per-leg data so the caller fills every leg with the haversine estimate,
    // and flag the key unhealthy so /api/health flips the UI back to estimate mode.
    const status = error instanceof OrsError ? error.status : undefined
    markOrsHealth(false, error instanceof Error ? error.message : 'ORS request failed')
    const note =
      status === 429
        ? 'OpenRouteService quota is exhausted — showing straight-line estimates for this route.'
        : status === 401 || status === 403
          ? 'OpenRouteService rejected the API key — showing straight-line estimates for this route.'
          : 'OpenRouteService was unavailable — showing straight-line estimates for this route.'
    return {
      roadLine: coordinates,
      legMiles: [],
      legDriveHours: [],
      warnings: [note],
      requestCount,
      degraded: true,
    }
  }
}

async function requestOrsChunk(
  coordinates: LatLon[],
  countRequest: () => void,
  maxAttempts = 2,
): Promise<RoadSegment> {
  const url = `${ORS_BASE_URL.replace(/\/$/, '')}/v2/directions/driving-car/geojson`
  let lastError: unknown
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    countRequest()
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: ORS_API_KEY,
          'Content-Type': 'application/json',
          Accept: 'application/geo+json',
        },
        body: JSON.stringify({
          coordinates: coordinates.map((c) => [c.lon, c.lat]),
        }),
      })
      if (!res.ok) {
        const body = await res.text()
        throw new OrsError(
          `ORS responded with ${res.status}: ${body.slice(0, 240)}`,
          res.status,
        )
      }
      const payload = (await res.json()) as {
        features?: Array<{
          geometry?: { coordinates?: Array<[number, number]> }
          properties?: { segments?: Array<{ distance?: number; duration?: number }> }
        }>
      }
      const feature = payload.features?.[0]
      const coords = feature?.geometry?.coordinates
      const segments = feature?.properties?.segments
      if (!coords || !segments) throw new Error('ORS returned no route')
      return {
        geometry: coords.map(([lon, lat]) => ({ lat, lon })),
        legMiles: segments.map((s) => (s.distance ?? 0) / METERS_PER_MILE),
        legDriveHours: segments.map((s) => (s.duration ?? 0) / 3600),
      }
    } catch (error) {
      lastError = error
      // A bad key (401/403) or exhausted quota (429) won't recover on retry —
      // don't burn a second billed call.
      if (
        error instanceof OrsError &&
        (error.status === 401 || error.status === 403 || error.status === 429)
      ) {
        break
      }
    }
  }
  throw lastError
}

/* ---- OSRM (also exposes durations) ---- */
async function fetchOsrmRoute(coordinates: LatLon[]): Promise<RoadResult> {
  const chunks = chunkCoordinates(coordinates, MAX_OSRM_COORDINATES)
  const roadLine: LatLon[] = []
  const legMiles: number[] = []
  const legDriveHours: number[] = []
  const warnings: string[] = []
  let requestCount = 0

  for (const chunk of chunks) {
    const segment = await fetchOsrmChunk(chunk, warnings, () => {
      requestCount += 1
    })
    // Chunks overlap by one coordinate; drop the duplicate geometry point.
    // Legs are contiguous across chunks, so they concatenate directly.
    if (roadLine.length > 0) segment.geometry.shift()
    roadLine.push(...segment.geometry)
    legMiles.push(...segment.legMiles)
    legDriveHours.push(...segment.legDriveHours)
  }

  return { roadLine, legMiles, legDriveHours, warnings, requestCount }
}

async function fetchOsrmChunk(
  coordinates: LatLon[],
  warnings: string[],
  countRequest: () => void,
): Promise<RoadSegment> {
  try {
    return await requestOsrmChunk(coordinates, countRequest)
  } catch {
    if (coordinates.length > 2) {
      const midpoint = Math.floor((coordinates.length - 1) / 2)
      const first = await fetchOsrmChunk(
        coordinates.slice(0, midpoint + 1),
        warnings,
        countRequest,
      )
      const second = await fetchOsrmChunk(
        coordinates.slice(midpoint),
        warnings,
        countRequest,
      )
      second.geometry.shift()
      return {
        geometry: [...first.geometry, ...second.geometry],
        legMiles: [...first.legMiles, ...second.legMiles],
        legDriveHours: [...first.legDriveHours, ...second.legDriveHours],
      }
    }

    warnings.push(
      `OSRM could not route one short segment near ${coordinates[0].lat.toFixed(3)}, ${coordinates[0].lon.toFixed(3)}; used a straight-line fallback for that leg.`,
    )
    const fallbackMiles =
      coordinates.length === 2
        ? haversineMiles(coordinates[0], coordinates[1])
        : 0
    return {
      geometry: coordinates,
      legMiles: coordinates.length === 2 ? [fallbackMiles] : [],
      legDriveHours: coordinates.length === 2 ? [fallbackMiles / 60] : [],
    }
  }
}

async function requestOsrmChunk(
  coordinates: LatLon[],
  countRequest: () => void,
): Promise<RoadSegment> {
  const encoded = coordinates
    .map((coordinate) => `${coordinate.lon},${coordinate.lat}`)
    .join(';')
  const routeUrl = `${OSRM_BASE_URL.replace(/\/$/, '')}/route/v1/driving/${encoded}?overview=simplified&geometries=geojson&steps=false`
  countRequest()
  const routeResponse = await fetch(routeUrl, {
    headers: {
      'User-Agent':
        'TeslaSuperchargerQuestPlanner/1.0 (+local route planning app)',
      Accept: 'application/json',
    },
  })

  if (!routeResponse.ok) {
    const body = await routeResponse.text()
    throw new Error(
      `OSRM responded with ${routeResponse.status} ${routeResponse.statusText}: ${body.slice(0, 240)}`,
    )
  }

  const payload = (await routeResponse.json()) as {
    code?: string
    message?: string
    routes?: Array<{
      geometry?: { coordinates?: Array<[number, number]> }
      legs?: Array<{ distance?: number; duration?: number }>
    }>
  }

  if (payload.code !== 'Ok' || !payload.routes?.[0]?.geometry?.coordinates) {
    throw new Error(payload.message ?? `OSRM route failed with ${payload.code}`)
  }

  const legs = payload.routes[0].legs ?? []
  return {
    geometry: payload.routes[0].geometry.coordinates.map(([lon, lat]) => ({
      lat,
      lon,
    })),
    legMiles: legs.map((leg) => (leg.distance ?? 0) / METERS_PER_MILE),
    legDriveHours: legs.map((leg) => (leg.duration ?? 0) / 3600),
  }
}

function chunkCoordinates<T>(coordinates: T[], maxChunkSize: number) {
  const chunks: T[][] = []
  let index = 0

  while (index < coordinates.length - 1) {
    const end = Math.min(coordinates.length, index + maxChunkSize)
    chunks.push(coordinates.slice(index, end))
    index = end - 1
  }

  return chunks
}

/** Chunk by BOTH waypoint count and cumulative straight-line distance, so no
 *  single request exceeds the engine's per-route distance limit (ORS free). */
function chunkByDistance(
  coordinates: LatLon[],
  maxCount: number,
  maxMeters: number,
) {
  const chunks: LatLon[][] = []
  let start = 0

  while (start < coordinates.length - 1) {
    let end = start + 1
    let meters = 0
    while (end < coordinates.length && end - start < maxCount) {
      const leg =
        haversineMiles(coordinates[end - 1], coordinates[end]) * METERS_PER_MILE
      // Always include at least one leg, even if it alone exceeds the cap.
      if (meters + leg > maxMeters && end > start + 1) break
      meters += leg
      end += 1
    }
    chunks.push(coordinates.slice(start, end))
    start = end - 1 // overlap by one coordinate so legs stay contiguous
  }

  return chunks
}

// In production (single Render web service), serve the built frontend from this
// same server so the SPA and /api share one origin. SERVE_CLIENT gates it so the
// dev API server stays API-only (Vite serves the client in dev).
if (process.env.SERVE_CLIENT) {
  const clientDir = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../dist',
  )
  app.use(express.static(clientDir))
  app.use((request, response) => {
    if (request.method === 'GET' && !request.path.startsWith('/api')) {
      response.sendFile(path.join(clientDir, 'index.html'))
      return
    }
    response.status(404).json({ error: 'not_found' })
  })
}

app.listen(PORT, () => {
  console.log(`Tesla Supercharger Quest API listening on http://localhost:${PORT}`)
  // Warm the ORS health cache so the first /api/health reflects key validity
  // immediately (and the UI shows estimate mode right away if the key is bad).
  if (ROAD_PROVIDER === 'ors') void probeOrsKey()
})
