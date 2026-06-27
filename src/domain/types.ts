export type CountryName = 'USA' | 'Canada' | 'Mexico' | string

export interface Coordinate {
  lat: number
  lon: number
}

export interface StationAddress {
  street?: string
  city: string
  state: string
  zip?: string
  country: CountryName
  region?: string
}

export interface Station {
  id: string
  sourceId: string
  source: 'supercharge.info'
  name: string
  status: string
  position: Coordinate
  address: StationAddress
  stallCount: number | null
  powerKw: number | null
  counted: boolean | null
  otherEvs: boolean | null
  teslaLocationId?: string
  plugshareId?: string
  osmNodeId?: string
}

export interface PlannerConfig {
  targetStations: number
  tripWeeks: number
  dailyDriveTargetHours: number
  dailyDriveMaxHours: number
  longDayOptimization: boolean
  longDayMaxHours: number
  longDayMinSitesPerExtraHour: number
  averageMph: number
  practicalRangeMiles: number
  closeStationRadiusMiles: number
  closeStationStopMinutes: number
  distanceChargeStopMinutes: number
  includeCanada: boolean
  includeMexico: boolean
  showAllStations: boolean
  roadDistanceFactor: number
  requiredWaypoints: RouteWaypoint[]
  customRouteWaypoints: RouteWaypoint[]
  start: Coordinate
}

export interface RouteWaypoint {
  id: string
  label: string
  position: Coordinate
  radiusMiles: number
  reason?: string
}

export interface RouteStationVisit {
  sequence: number
  day: number
  station: Station
  legMiles: number
  driveHours: number
  stopMinutes: number
  rangeWarning: boolean
  connectorStop?: boolean
}

export type AdvisorySeverity = 'info' | 'medium' | 'high'

export interface PlannerAdvisory {
  severity: AdvisorySeverity
  message: string
}

export interface DayPlan {
  day: number
  miles: number
  driveHours: number
  stopMinutes: number
  uniqueStations: number
  averageDistanceBetweenSuperchargers: number
  visits: RouteStationVisit[]
  warnings: string[]
  advisories: PlannerAdvisory[]
  longDayOptimized: boolean
  longDayReason?: string
}

export interface RoutePlan {
  id: string
  name: string
  strategy: string
  color: string
  uniqueStations: number
  totalMiles: number
  totalDriveHours: number
  totalStopHours: number
  totalDays: number
  averageMilesPerDay: number
  averageDriveHoursPerDay: number
  averageStopHoursPerDay: number
  averageDistanceBetweenSuperchargers: number
  stationsPerDay: number
  days: DayPlan[]
  visits: RouteStationVisit[]
  warnings: string[]
  advisories: PlannerAdvisory[]
  longDays: number
  routeLine: Coordinate[]
}

export interface StationUniverseStats {
  totalOpenStations: number
  filteredStations: number
  countryCounts: Record<string, number>
  allSitesFeasibility: {
    totalStations: number
    availableDays: number
    requiredStationsPerDay: number
    minimumStopHours: number
    distanceStopHours: number
    verdict: 'not_plausible' | 'aggressive' | 'plausible'
    explanation: string
  }
}

export interface OptimizeResponse {
  generatedAt: string
  source: {
    name: string
    url: string
    fetchedAt: string
  }
  config: PlannerConfig
  universe: StationUniverseStats
  routes: RoutePlan[]
  stations: Station[]
}

export interface RoadRouteResponse {
  generatedAt: string
  source: {
    name: string
    url: string
  }
  coordinateCount: number
  requestCount: number
  roadLine: Coordinate[]
  warnings: string[]
}
