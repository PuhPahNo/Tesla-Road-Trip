import 'dotenv/config'
import cors from 'cors'
import { createHash } from 'node:crypto'
import express from 'express'
import { registerAgentRoutes } from './agent'
import { defaultPlannerConfig, plannerConfigSchema } from '../src/domain/config'
import { optimizeRoutes } from '../src/domain/optimizer'
import {
  filterOpenStations,
  filterStationsForConfig,
  normalizeSuperchargeSites,
} from '../src/domain/stations'
import type { Station } from '../src/domain/types'
import { z } from 'zod'

const SUPERCHARGE_INFO_URL =
  'https://supercharge.info/service/supercharge/allSites'
const OSRM_BASE_URL =
  process.env.OSRM_BASE_URL ?? 'https://router.project-osrm.org'
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

app.get('/api/health', (_request, response) => {
  response.json({
    ok: true,
    service: 'tesla-supercharger-quest',
    time: new Date().toISOString(),
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

    const roadRoute = await fetchOsrmRoadLine(coordinates)
    const payload = {
      generatedAt: new Date().toISOString(),
      source: {
        name: 'OSRM',
        url: OSRM_BASE_URL,
      },
      coordinateCount: coordinates.length,
      requestCount: roadRoute.requestCount,
      roadLine: roadRoute.roadLine,
      warnings: [
        ...(OSRM_BASE_URL === 'https://router.project-osrm.org'
          ? [
              'Using the public OSRM demo server. For heavy planning, point OSRM_BASE_URL at a local OSRM instance.',
            ]
          : []),
        ...roadRoute.warnings,
      ],
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

registerAgentRoutes(app, () => loadStations())

async function fetchOsrmRoadLine(coordinates: Array<{ lat: number; lon: number }>) {
  const chunks = chunkCoordinates(coordinates, MAX_OSRM_COORDINATES)
  const roadLine: Array<{ lat: number; lon: number }> = []
  const warnings: string[] = []
  let requestCount = 0

  for (const chunk of chunks) {
    const segment = await fetchOsrmChunk(chunk, warnings, () => {
      requestCount += 1
    })

    if (roadLine.length > 0) segment.shift()
    roadLine.push(...segment)
  }

  return { roadLine, warnings, requestCount }
}

async function fetchOsrmChunk(
  coordinates: Array<{ lat: number; lon: number }>,
  warnings: string[],
  countRequest: () => void,
): Promise<Array<{ lat: number; lon: number }>> {
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
      second.shift()
      return [...first, ...second]
    }

    warnings.push(
      `OSRM could not route one short segment near ${coordinates[0].lat.toFixed(3)}, ${coordinates[0].lon.toFixed(3)}; displayed a direct fallback for that segment.`,
    )
    return coordinates
  }
}

async function requestOsrmChunk(
  coordinates: Array<{ lat: number; lon: number }>,
  countRequest: () => void,
) {
  const encoded = coordinates
    .map((coordinate) => `${coordinate.lon},${coordinate.lat}`)
    .join(';')
  const routeUrl = `${OSRM_BASE_URL.replace(/\/$/, '')}/route/v1/driving/${encoded}?overview=full&geometries=geojson&steps=false`
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
      geometry?: {
        coordinates?: Array<[number, number]>
      }
    }>
  }

  if (payload.code !== 'Ok' || !payload.routes?.[0]?.geometry?.coordinates) {
    throw new Error(payload.message ?? `OSRM route failed with ${payload.code}`)
  }

  return payload.routes[0].geometry.coordinates.map(([lon, lat]) => ({
    lat,
    lon,
  }))
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

app.listen(PORT, () => {
  console.log(`Tesla Supercharger Quest API listening on http://localhost:${PORT}`)
})
