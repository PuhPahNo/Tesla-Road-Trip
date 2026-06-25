import type {
  Coordinate,
  OptimizeResponse,
  PlannerConfig,
  RoadRouteResponse,
  RoutePlan,
  Station,
} from '../domain/types'

export interface RefineRouteResponse {
  generatedAt: string
  source: { name: string; url: string }
  requestCount: number
  route: RoutePlan
  roadLine: Coordinate[]
  warnings: string[]
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
