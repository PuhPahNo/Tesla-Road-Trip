import { sanitizePlannerConfig } from '../src/domain/config'
import { haversineMiles, simplifyPolyline } from '../src/domain/geo'
import {
  optimizeRoutes,
  refineRouteWithRoadLegs,
} from '../src/domain/optimizer'
import type {
  Coordinate,
  RoutePlan,
  Station,
} from '../src/domain/types'
import { db } from './database'
import { readSavedCustomRoutes } from './customRoutes'

export interface StationSnapshot {
  stations: Station[]
  fetchedAt: string
}

export interface PublishedAnthonyRoute {
  savedRoute: {
    id: string
    name: string
    color: string
    startDate?: string
    targetDays?: number
    waypointCount: number
    updatedAt: string
  }
  route: RoutePlan
  road: {
    provider: string
    line: Coordinate[]
    degraded: boolean
    warnings: string[]
    requestCount: number
  } | null
}

const routeCache = new Map<string, PublishedAnthonyRoute>()
const routeBuilds = new Map<string, Promise<PublishedAnthonyRoute | undefined>>()

export interface RoadRouteResult {
  provider: string
  roadLine: Coordinate[]
  legMiles: number[]
  legDriveHours: number[]
  warnings: string[]
  requestCount: number
  degraded?: boolean
}

export async function buildAnthonyRoute(
  userId: string,
  routeId: string,
  loadStations: () => Promise<StationSnapshot>,
  loadRoadRoute?: (coordinates: Coordinate[]) => Promise<RoadRouteResult>,
): Promise<PublishedAnthonyRoute | undefined> {
  const savedRoutes = readSavedCustomRoutes(userId)
  const savedRoute = savedRoutes.find((route) => route.id === routeId)
  if (!savedRoute) return undefined

  const preferenceRow = db.prepare(`
    SELECT config_json, updated_at
    FROM user_preferences
    WHERE user_id = ?
  `).get(userId) as unknown as
    | { config_json: string; updated_at: string }
    | undefined
  const preferences = preferenceRow
    ? JSON.parse(preferenceRow.config_json) as Record<string, unknown>
    : {}
  const stationSnapshot = await loadStations()
  const cacheKey = [
    userId,
    savedRoute.id,
    savedRoute.updatedAt,
    preferenceRow?.updated_at ?? 'default-preferences',
    stationSnapshot.fetchedAt,
    loadRoadRoute ? 'road-routed' : 'estimate-only',
  ].join(':')
  const cached = routeCache.get(cacheKey)
  if (cached) return cached
  const activeBuild = routeBuilds.get(cacheKey)
  if (activeBuild) return activeBuild

  const build = (async () => {
    const config = sanitizePlannerConfig({
      ...preferences,
      savedCustomRoutes: savedRoutes,
    })
    const result = optimizeRoutes(
      stationSnapshot.stations,
      config,
      stationSnapshot.fetchedAt,
    )
    const estimatedRoute = result.routes.find(
      (candidate) => candidate.id === routeId,
    )
    if (!estimatedRoute) return undefined

    let route = estimatedRoute
    let road: PublishedAnthonyRoute['road'] = null
    if (loadRoadRoute) {
      const orderedStations = estimatedRoute.visits.map((visit) => visit.station)
      const coordinates = [
        config.start,
        ...orderedStations.map((station) => station.position),
        config.start,
      ]
      try {
        const routed = await loadRoadRoute(coordinates)
        const expectedLegs = Math.max(0, coordinates.length - 1)
        const legMiles = Array.from(
          { length: expectedLegs },
          (_, index) =>
            routed.legMiles[index] ??
            haversineMiles(coordinates[index], coordinates[index + 1]),
        )
        const driveHours = Array.from(
          { length: expectedLegs },
          (_, index) =>
            routed.legDriveHours[index] ?? legMiles[index] / 60,
        )
        route = refineRouteWithRoadLegs(
          orderedStations,
          config,
          {
            id: estimatedRoute.id,
            name: estimatedRoute.name,
            strategy: estimatedRoute.strategy,
            color: estimatedRoute.color,
          },
          legMiles,
          driveHours,
        )
        road = {
          provider: routed.provider.toUpperCase(),
          // The provider can return tens of thousands of GPS points for a
          // national route. Preserve road bends to roughly 250 feet while
          // keeping the public payload and browser day-highlighting responsive.
          line: simplifyPolyline(routed.roadLine, 0.05),
          degraded: routed.degraded ?? false,
          warnings: routed.warnings,
          requestCount: routed.requestCount,
        }
      } catch (error) {
        road = {
          provider: 'Unavailable',
          line: estimatedRoute.routeLine,
          degraded: true,
          warnings: [
            error instanceof Error
              ? error.message
              : 'Road routing was unavailable for this trip.',
          ],
          requestCount: 0,
        }
      }
    }

    const published = {
      savedRoute: {
        id: savedRoute.id,
        name: savedRoute.name,
        color: savedRoute.color,
        startDate: savedRoute.startDate,
        targetDays: savedRoute.targetDays,
        waypointCount: savedRoute.waypoints.length,
        updatedAt: savedRoute.updatedAt,
      },
      route,
      road,
    }

    if (routeCache.size >= 12) routeCache.clear()
    routeCache.set(cacheKey, published)
    return published
  })()

  routeBuilds.set(cacheKey, build)
  try {
    return await build
  } finally {
    routeBuilds.delete(cacheKey)
  }
}
