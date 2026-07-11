import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { Express } from 'express'
import { z } from 'zod'
import { PLANNER_NUMERIC_LIMITS } from '../src/domain/config'
import type { RouteWaypoint, SavedCustomRoute } from '../src/domain/types'
import { VEHICLE_PROFILE_IDS } from '../src/domain/vehicleProfiles'
import { requireUser } from './auth'
import { db, transaction } from './database'

const DATA_DIR =
  process.env.DATA_DIR ??
  (process.env.RENDER ? '/data' : path.resolve(process.cwd(), '.data'))
const LEGACY_CUSTOM_ROUTES_PATH =
  process.env.CUSTOM_ROUTES_PATH ?? path.join(DATA_DIR, 'custom-routes.json')

const COLORS = [
  '#7c3aed',
  '#0891b2',
  '#16a34a',
  '#ea580c',
  '#db2777',
  '#2563eb',
  '#be123c',
]

const waypointSchema = z.object({
  id: z.string().min(1).max(96),
  label: z.string().min(1).max(80),
  position: z.object({
    lat: z.coerce.number().min(-90).max(90),
    lon: z.coerce.number().min(-180).max(180),
  }),
  radiusMiles: z.coerce.number().min(5).max(250),
  reason: z.string().max(240).optional(),
})

const travelPreferencesSchema = z
  .object({
    vehicleProfileId: z.enum(VEHICLE_PROFILE_IDS),
    practicalRangeMiles: z.coerce
      .number()
      .min(PLANNER_NUMERIC_LIMITS.practicalRangeMiles.min)
      .max(PLANNER_NUMERIC_LIMITS.practicalRangeMiles.max),
    manualPracticalRange: z.boolean(),
    tripPace: z.enum(['sprint', 'balanced', 'savor']),
    dailyDriveTargetHours: z.coerce
      .number()
      .min(PLANNER_NUMERIC_LIMITS.dailyDriveTargetHours.min)
      .max(PLANNER_NUMERIC_LIMITS.dailyDriveTargetHours.max),
    dailyDriveMaxHours: z.coerce
      .number()
      .min(PLANNER_NUMERIC_LIMITS.dailyDriveMaxHours.min)
      .max(PLANNER_NUMERIC_LIMITS.dailyDriveMaxHours.max),
  })
  .refine(
    (value) => value.dailyDriveMaxHours >= value.dailyDriveTargetHours,
    'Daily maximum must be at least the comfortable drive target.',
  )

const savedRouteSchema = z.object({
  id: z.string().min(1).max(96),
  name: z.string().min(1).max(80),
  color: z.string().min(1).max(32),
  waypoints: z.array(waypointSchema).min(1).max(16),
  targetDays: z.coerce.number().int().min(1).max(365).optional(),
  keepOrder: z.boolean().optional(),
  startMonth: z.coerce.number().int().min(1).max(12).optional(),
  directionPreference: z
    .enum(['seasonal', 'north', 'south', 'east', 'west'])
    .optional(),
  travelPreferences: travelPreferencesSchema.optional(),
  createdAt: z.string().min(1).max(48),
  updatedAt: z.string().min(1).max(48),
})

const createRouteSchema = z.object({
  name: z.string().min(1).max(80),
  color: z.string().min(1).max(32).optional(),
  waypoints: z.array(waypointSchema).min(1).max(16),
  targetDays: z.coerce.number().int().min(1).max(365).optional(),
  keepOrder: z.boolean().optional(),
  startMonth: z.coerce.number().int().min(1).max(12).optional(),
  directionPreference: z
    .enum(['seasonal', 'north', 'south', 'east', 'west'])
    .optional(),
  travelPreferences: travelPreferencesSchema.nullable().optional(),
})

const updateRouteSchema = createRouteSchema
  .partial()
  .refine(
    (value) => Object.keys(value).length > 0,
    'At least one route field is required.',
  )

const routeListSchema = z.array(savedRouteSchema).max(24)

export function readSavedCustomRoutes(userId?: string): SavedCustomRoute[] {
  if (!userId) return []
  const rows = db.prepare(`
    SELECT route_json FROM custom_routes
    WHERE user_id = ? ORDER BY updated_at ASC
  `).all(userId) as unknown as Array<{ route_json: string }>
  return routeListSchema.parse(rows.map((row) => JSON.parse(row.route_json)))
}

export function writeSavedCustomRoutes(
  userId: string,
  routes: SavedCustomRoute[],
) {
  const parsed = routeListSchema.parse(routes)
  transaction(() => {
    db.prepare('DELETE FROM custom_routes WHERE user_id = ?').run(userId)
    const insert = db.prepare(`
      INSERT INTO custom_routes (
        id, user_id, route_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?)
    `)
    parsed.forEach((route) => {
      insert.run(
        route.id,
        userId,
        JSON.stringify(route),
        route.createdAt,
        route.updatedAt,
      )
    })
  })
}

export function updateSavedCustomRoute(
  id: string,
  changes: z.input<typeof updateRouteSchema>,
  userId: string,
) {
  const parsed = updateRouteSchema.parse(changes)
  const existing = readSavedCustomRoutes(userId)
  const routeIndex = existing.findIndex((route) => route.id === id)
  if (routeIndex < 0) return undefined

  const current = existing[routeIndex]
  const route: SavedCustomRoute = {
    ...current,
    ...(parsed.name !== undefined ? { name: parsed.name.trim() } : {}),
    ...(parsed.color !== undefined ? { color: parsed.color } : {}),
    ...(parsed.waypoints !== undefined
      ? { waypoints: normalizeWaypoints(parsed.waypoints) }
      : {}),
    ...(parsed.targetDays !== undefined ? { targetDays: parsed.targetDays } : {}),
    ...(parsed.keepOrder !== undefined ? { keepOrder: parsed.keepOrder } : {}),
    ...(parsed.startMonth !== undefined ? { startMonth: parsed.startMonth } : {}),
    ...(parsed.directionPreference !== undefined
      ? { directionPreference: parsed.directionPreference }
      : {}),
    ...(parsed.travelPreferences
      ? { travelPreferences: parsed.travelPreferences }
      : {}),
    updatedAt: new Date().toISOString(),
  }
  if (parsed.travelPreferences === null) delete route.travelPreferences
  const routes = existing.slice()
  routes[routeIndex] = route
  writeSavedCustomRoutes(userId, routes)
  return { route, routes }
}

export function registerCustomRouteRoutes(app: Express) {
  app.get('/api/custom-routes', (request, response) => {
    try {
      const user = requireUser(request, response)
      if (!user) return
      response.json({ storage: 'account', routes: readSavedCustomRoutes(user.id) })
    } catch (error) {
      response.status(500).json({
        error: 'custom_routes_read_failed',
        message:
          error instanceof Error ? error.message : 'Unable to read saved custom routes.',
      })
    }
  })

  app.post('/api/custom-routes', (request, response) => {
    try {
      const user = requireUser(request, response)
      if (!user) return
      const parsed = createRouteSchema.parse(request.body)
      const existing = readSavedCustomRoutes(user.id)
      const now = new Date().toISOString()
      const route: SavedCustomRoute = {
        id: uniqueRouteId(parsed.name, existing),
        name: parsed.name.trim(),
        color: parsed.color ?? COLORS[existing.length % COLORS.length],
        waypoints: normalizeWaypoints(parsed.waypoints),
        ...(parsed.targetDays !== undefined ? { targetDays: parsed.targetDays } : {}),
        ...(parsed.keepOrder ? { keepOrder: true } : {}),
        ...(parsed.startMonth !== undefined ? { startMonth: parsed.startMonth } : {}),
        ...(parsed.directionPreference !== undefined
          ? { directionPreference: parsed.directionPreference }
          : {}),
        ...(parsed.travelPreferences
          ? { travelPreferences: parsed.travelPreferences }
          : {}),
        createdAt: now,
        updatedAt: now,
      }

      writeSavedCustomRoutes(user.id, [...existing, route])
      response.status(201).json({ route, storage: 'account' })
    } catch (error) {
      response.status(error instanceof z.ZodError ? 400 : 500).json({
        error: 'custom_route_create_failed',
        message:
          error instanceof Error ? error.message : 'Unable to save the custom route.',
      })
    }
  })

  app.patch('/api/custom-routes/:id', (request, response) => {
    try {
      const user = requireUser(request, response)
      if (!user) return
      const updated = updateSavedCustomRoute(request.params.id, request.body, user.id)
      if (!updated) {
        response.status(404).json({
          error: 'custom_route_not_found',
          message: 'Saved route not found.',
        })
        return
      }

      response.json({
        route: updated.route,
        routes: updated.routes,
        storage: 'account',
      })
    } catch (error) {
      response.status(error instanceof z.ZodError ? 400 : 500).json({
        error: 'custom_route_update_failed',
        message:
          error instanceof Error ? error.message : 'Unable to update the custom route.',
      })
    }
  })

  app.delete('/api/custom-routes/:id', (request, response) => {
    try {
      const user = requireUser(request, response)
      if (!user) return
      const existing = readSavedCustomRoutes(user.id)
      const next = existing.filter((route) => route.id !== request.params.id)
      if (next.length === existing.length) {
        response.status(404).json({
          error: 'custom_route_not_found',
          message: 'Saved route not found.',
        })
        return
      }

      writeSavedCustomRoutes(user.id, next)
      response.json({ ok: true, routes: next })
    } catch (error) {
      response.status(500).json({
        error: 'custom_route_delete_failed',
        message:
          error instanceof Error ? error.message : 'Unable to delete the custom route.',
      })
    }
  })
}

export async function migrateLegacyCustomRoutesToUser(userId: string) {
  const existingCount = (
    db.prepare(`
      SELECT COUNT(*) AS count FROM custom_routes WHERE user_id = ?
    `).get(userId) as unknown as { count: number }
  ).count
  if (existingCount > 0) return 0

  try {
    const raw = await readFile(LEGACY_CUSTOM_ROUTES_PATH, 'utf8')
    const routes = routeListSchema.parse(JSON.parse(raw))
    if (routes.length === 0) return 0
    writeSavedCustomRoutes(userId, routes)
    return routes.length
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return 0
    throw error
  }
}

function normalizeWaypoints(waypoints: RouteWaypoint[]): RouteWaypoint[] {
  return waypoints.map((waypoint, index) => ({
    ...waypoint,
    id: waypoint.id || `custom-waypoint-${index + 1}`,
    label: waypoint.label.trim(),
    reason: waypoint.reason ?? 'Saved custom route waypoint.',
  }))
}

function uniqueRouteId(name: string, routes: SavedCustomRoute[]) {
  const used = new Set(routes.map((route) => route.id))
  const base = `saved-${slug(name) || 'custom-route'}`
  let id = base
  let suffix = 2
  while (used.has(id)) {
    id = `${base}-${suffix}`
    suffix += 1
  }
  return id
}

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 64)
}
