import type { PlaceCategory } from './placeCatalog'
import type { VehicleProfileId } from './vehicleProfiles'

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

export type PlannerMode = 'longest_trip' | 'most_unique_sites'
export type LongestTripVisitTargetType = 'state' | 'city' | 'landmark'
export type TripPace = 'sprint' | 'balanced' | 'savor'
export type CompassDirection = 'north' | 'south' | 'east' | 'west'
export type RouteDirectionPreference = 'seasonal' | CompassDirection

export interface PlannerConfig {
  plannerMode: PlannerMode
  longestTripDays: number
  tripPace: TripPace
  autoStays: boolean
  favoriteCategories: PlaceCategory[]
  mutedCategories: PlaceCategory[]
  targetStations: number
  tripWeeks: number
  dailyDriveTargetHours: number
  dailyDriveMaxHours: number
  longDayOptimization: boolean
  longDayMaxHours: number
  longDayMinSitesPerExtraHour: number
  averageMph: number
  vehicleProfileId: VehicleProfileId
  practicalRangeMiles: number
  manualPracticalRange: boolean
  closeStationRadiusMiles: number
  closeStationStopMinutes: number
  distanceChargeStopMinutes: number
  includeCanada: boolean
  includeMexico: boolean
  showAllStations: boolean
  roadDistanceFactor: number
  requiredWaypoints: RouteWaypoint[]
  customRouteWaypoints: RouteWaypoint[]
  savedCustomRoutes: SavedCustomRoute[]
  longestTripTargets: LongestTripVisitTarget[]
  start: Coordinate
}

export interface RouteWaypoint {
  id: string
  label: string
  position: Coordinate
  radiusMiles: number
  reason?: string
}

export interface SavedCustomRoute {
  id: string
  name: string
  color: string
  waypoints: RouteWaypoint[]
  /** Streak-day target for this route only; does not change the global planner setting. */
  targetDays?: number
  /** Visit stops exactly in the saved order instead of letting the optimizer reorder them. */
  keepOrder?: boolean
  /** Calendar month (1-12) used by the season-aware starting direction. */
  startMonth?: number
  /** Preferred first heading for the optimized loop. */
  directionPreference?: RouteDirectionPreference
  /** Optional route-specific snapshot that overrides the global travel presets. */
  travelPreferences?: RouteTravelPreferences
  createdAt: string
  updatedAt: string
}

export interface RouteTravelPreferences {
  vehicleProfileId: VehicleProfileId
  practicalRangeMiles: number
  manualPracticalRange: boolean
  tripPace: TripPace
  dailyDriveTargetHours: number
  dailyDriveMaxHours: number
}

export interface LongestTripVisitTarget {
  id: string
  type: LongestTripVisitTargetType
  label: string
  stayDays: number
  state?: string
  position?: Coordinate
  radiusMiles?: number
  /** Synthetic rating-driven stay target (never persisted in config). */
  auto?: boolean
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

export type PlaceRatingType = 'city' | 'landmark'

export interface PlaceRating {
  id: string
  type: PlaceRatingType
  label: string
  rating: number
  sceneryScore: number
  visits: number
  summary: string
}

export interface SegmentRating {
  score: number
  sceneryScore: number
  cityScore: number
  landmarkScore: number
  places: PlaceRating[]
  summary: string
}

export type AdvisorySeverity = 'info' | 'medium' | 'high'

export interface PlannerAdvisory {
  severity: AdvisorySeverity
  message: string
}

export interface DayStay {
  placeId: string
  label: string
  rating: number
  night: number
  totalNights: number
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
  rating: SegmentRating
  stay?: DayStay
}

export interface RoutePlan {
  id: string
  plannerMode: PlannerMode
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
  rating: SegmentRating
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
