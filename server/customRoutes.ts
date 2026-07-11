import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { Express } from 'express'
import { z } from 'zod'
import type { RouteWaypoint, SavedCustomRoute } from '../src/domain/types'

const DATA_DIR = process.env.DATA_DIR ?? (process.env.RENDER ? '/data' : path.resolve(process.cwd(), '.data'))
const CUSTOM_ROUTES_PATH =
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
})

const updateRouteSchema = createRouteSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, 'At least one route field is required.')

const routeListSchema = z.array(savedRouteSchema).max(100)

export async function readSavedCustomRoutes(): Promise<SavedCustomRoute[]> {
  try {
    const raw = await readFile(CUSTOM_ROUTES_PATH, 'utf8')
    return routeListSchema.parse(JSON.parse(raw))
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []
    throw error
  }
}

export async function writeSavedCustomRoutes(routes: SavedCustomRoute[]) {
  await mkdir(path.dirname(CUSTOM_ROUTES_PATH), { recursive: true })
  const tempPath = `${CUSTOM_ROUTES_PATH}.${process.pid}.tmp`
  await writeFile(tempPath, `${JSON.stringify(routeListSchema.parse(routes), null, 2)}\n`)
  await rename(tempPath, CUSTOM_ROUTES_PATH)
}

export async function updateSavedCustomRoute(
  id: string,
  changes: z.input<typeof updateRouteSchema>,
) {
  const parsed = updateRouteSchema.parse(changes)
  const existing = await readSavedCustomRoutes()
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
    updatedAt: new Date().toISOString(),
  }
  const routes = existing.slice()
  routes[routeIndex] = route
  await writeSavedCustomRoutes(routes)
  return { route, routes }
}

export function registerCustomRouteRoutes(app: Express) {
  app.get('/api/custom-routes', async (_request, response) => {
    try {
      response.json({
        storagePath: CUSTOM_ROUTES_PATH,
        routes: await readSavedCustomRoutes(),
      })
    } catch (error) {
      response.status(500).json({
        error: 'custom_routes_read_failed',
        message:
          error instanceof Error ? error.message : 'Unable to read saved custom routes.',
      })
    }
  })

  app.post('/api/custom-routes', async (request, response) => {
    try {
      const parsed = createRouteSchema.parse(request.body)
      const existing = await readSavedCustomRoutes()
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
        createdAt: now,
        updatedAt: now,
      }

      await writeSavedCustomRoutes([...existing, route])
      response.status(201).json({ route, storagePath: CUSTOM_ROUTES_PATH })
    } catch (error) {
      response.status(error instanceof z.ZodError ? 400 : 500).json({
        error: 'custom_route_create_failed',
        message:
          error instanceof Error ? error.message : 'Unable to save the custom route.',
      })
    }
  })

  app.patch('/api/custom-routes/:id', async (request, response) => {
    try {
      const updated = await updateSavedCustomRoute(request.params.id, request.body)
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
        storagePath: CUSTOM_ROUTES_PATH,
      })
    } catch (error) {
      response.status(error instanceof z.ZodError ? 400 : 500).json({
        error: 'custom_route_update_failed',
        message:
          error instanceof Error ? error.message : 'Unable to update the custom route.',
      })
    }
  })

  app.delete('/api/custom-routes/:id', async (request, response) => {
    try {
      const existing = await readSavedCustomRoutes()
      const next = existing.filter((route) => route.id !== request.params.id)
      if (next.length === existing.length) {
        response.status(404).json({
          error: 'custom_route_not_found',
          message: 'Saved route not found.',
        })
        return
      }

      await writeSavedCustomRoutes(next)
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
