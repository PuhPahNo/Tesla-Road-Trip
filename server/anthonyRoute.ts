import { sanitizePlannerConfig } from '../src/domain/config'
import { optimizeRoutes } from '../src/domain/optimizer'
import type { RoutePlan, Station } from '../src/domain/types'
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
}

const routeCache = new Map<string, PublishedAnthonyRoute>()

export async function buildAnthonyRoute(
  userId: string,
  routeId: string,
  loadStations: () => Promise<StationSnapshot>,
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
  ].join(':')
  const cached = routeCache.get(cacheKey)
  if (cached) return cached

  const config = sanitizePlannerConfig({
    ...preferences,
    savedCustomRoutes: savedRoutes,
  })
  const result = optimizeRoutes(
    stationSnapshot.stations,
    config,
    stationSnapshot.fetchedAt,
  )
  const route = result.routes.find((candidate) => candidate.id === routeId)
  if (!route) return undefined

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
  }

  if (routeCache.size >= 12) routeCache.clear()
  routeCache.set(cacheKey, published)
  return published
}
