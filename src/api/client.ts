import type {
  Coordinate,
  OptimizeResponse,
  PlannerConfig,
  RoadRouteResponse,
  Station,
} from '../domain/types'

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
