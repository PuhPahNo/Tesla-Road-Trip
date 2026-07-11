import type {
  Coordinate,
  OptimizeResponse,
  PlannerConfig,
  RoadRouteResponse,
  RoutePlan,
  RouteWaypoint,
  SavedCustomRoute,
  Station,
} from '../domain/types'

export interface RefineRouteResponse {
  generatedAt: string
  source: { name: string; url: string }
  requestCount: number
  route: RoutePlan
  roadLine: Coordinate[]
  warnings: string[]
  /** True when the engine was rejected and these legs are straight-line estimates. */
  degraded?: boolean
}

export interface StationsResponse {
  source: {
    name: string
    url: string
    fetchedAt: string
  }
  totalNormalized: number
  totalOpen: number
  filteredStations: number
  stations: Station[]
}

export interface PlannerAgentRequest {
  message: string
  config: PlannerConfig
  selectedRouteId?: string
}

export interface PlannerAgentResponse {
  message: string
  actions: string[]
  config: PlannerConfig
  result?: OptimizeResponse
  selectedRouteId?: string
  usage: {
    enabled: boolean
    dailyLimitUsd: number
    estimatedDailySpendUsd: number
    estimatedRequestSpendUsd: number
  }
}

export interface HealthResponse {
  ok: boolean
  service: string
  time: string
  roadRouting?: { enabled: boolean }
}

export interface SavedCustomRoutesResponse {
  storage?: string
  routes: SavedCustomRoute[]
}

export interface CreateCustomRouteRequest {
  name: string
  color?: string
  waypoints: RouteWaypoint[]
  targetDays?: number
  keepOrder?: boolean
  startMonth?: number
  directionPreference?: SavedCustomRoute['directionPreference']
  travelPreferences?: SavedCustomRoute['travelPreferences'] | null
}

export interface CreateCustomRouteResponse {
  storage?: string
  route: SavedCustomRoute
}

export async function fetchHealth() {
  const response = await fetch('/api/health')
  return parseJsonResponse<HealthResponse>(response)
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const payload = await response.json()

  if (!response.ok) {
    throw new Error(payload?.message ?? 'Request failed')
  }

  return payload as T
}

export async function fetchStations(config: Pick<PlannerConfig, 'includeCanada' | 'includeMexico'>) {
  const params = new URLSearchParams({
    includeCanada: String(config.includeCanada),
    includeMexico: String(config.includeMexico),
  })
  const response = await fetch(`/api/stations?${params.toString()}`)
  return parseJsonResponse<StationsResponse>(response)
}

export async function optimizeRoutes(config: PlannerConfig) {
  const response = await fetch('/api/optimize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(config),
  })

  return parseJsonResponse<OptimizeResponse>(response)
}

export async function fetchCustomRoutes() {
  const response = await fetch('/api/custom-routes')
  return parseJsonResponse<SavedCustomRoutesResponse>(response)
}

export async function createCustomRoute(request: CreateCustomRouteRequest) {
  const response = await fetch('/api/custom-routes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  return parseJsonResponse<CreateCustomRouteResponse>(response)
}

export async function updateCustomRoute(
  id: string,
  request: Partial<CreateCustomRouteRequest>,
) {
  const response = await fetch(`/api/custom-routes/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  return parseJsonResponse<CreateCustomRouteResponse & { routes: SavedCustomRoute[] }>(
    response,
  )
}

export async function deleteCustomRoute(id: string) {
  const response = await fetch(`/api/custom-routes/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })

  return parseJsonResponse<{ ok: boolean; routes: SavedCustomRoute[] }>(response)
}

export async function fetchRoadRoute(coordinates: Coordinate[]) {
  const response = await fetch('/api/road-route', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ coordinates }),
  })

  return parseJsonResponse<RoadRouteResponse>(response)
}

/** Recompute a route's mileage + day plan from real OSRM road distances. */
export async function refineRoute(
  config: PlannerConfig,
  route: { id: string; name: string; strategy: string; color: string },
  stations: Station[],
) {
  const response = await fetch('/api/refine-route', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ config, route, stations }),
  })

  return parseJsonResponse<RefineRouteResponse>(response)
}

export async function sendPlannerAgentMessage(request: PlannerAgentRequest) {
  const response = await fetch('/api/agent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  return parseJsonResponse<PlannerAgentResponse>(response)
}
