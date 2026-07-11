import { z } from 'zod'
import { PLACE_CATEGORY_LABELS, type PlaceCategory } from './placeCatalog'
import type { PlannerConfig } from './types'

const PLACE_CATEGORY_VALUES = Object.keys(PLACE_CATEGORY_LABELS) as [
  PlaceCategory,
  ...PlaceCategory[],
]

export const CHATTANOOGA_37405_START = {
  lat: 35.0795399,
  lon: -85.3082738,
}

export const defaultPlannerConfig: PlannerConfig = {
  plannerMode: 'longest_trip',
  longestTripDays: 60,
  tripPace: 'balanced',
  autoStays: true,
  favoriteCategories: [],
  mutedCategories: [],
  targetStations: 650,
  tripWeeks: 9,
  dailyDriveTargetHours: 5,
  dailyDriveMaxHours: 6.5,
  longDayOptimization: false,
  longDayMaxHours: 9,
  longDayMinSitesPerExtraHour: 2.5,
  averageMph: 60,
  practicalRangeMiles: 220,
  closeStationRadiusMiles: 5,
  closeStationStopMinutes: 2,
  distanceChargeStopMinutes: 18,
  includeCanada: false,
  includeMexico: false,
  showAllStations: false,
  roadDistanceFactor: 1.18,
  requiredWaypoints: [],
  customRouteWaypoints: [],
  savedCustomRoutes: [],
  longestTripTargets: [],
  start: CHATTANOOGA_37405_START,
}

/**
 * Single source of truth for numeric planner-setting bounds — the zod
 * schema below and the copilot's set_trip_settings validation both
 * derive from this table.
 */
export const PLANNER_NUMERIC_LIMITS = {
  longestTripDays: { min: 1, max: 365, integer: true },
  targetStations: { min: 25, max: 5000, integer: true },
  tripWeeks: { min: 1, max: 52 },
  dailyDriveTargetHours: { min: 1, max: 14 },
  dailyDriveMaxHours: { min: 1, max: 16 },
  longDayMaxHours: { min: 2, max: 14 },
  longDayMinSitesPerExtraHour: { min: 0.1, max: 30 },
  averageMph: { min: 25, max: 85 },
  practicalRangeMiles: { min: 80, max: 350 },
  closeStationRadiusMiles: { min: 0.5, max: 25 },
  closeStationStopMinutes: { min: 1, max: 60 },
  distanceChargeStopMinutes: { min: 2, max: 90 },
  roadDistanceFactor: { min: 1, max: 1.8 },
} as const

export type PlannerNumericSettingKey = keyof typeof PLANNER_NUMERIC_LIMITS

function limitedNumber(key: PlannerNumericSettingKey) {
  const limit = PLANNER_NUMERIC_LIMITS[key]
  const base = z.coerce.number()
  const withInt = 'integer' in limit && limit.integer ? base.int() : base
  return withInt.min(limit.min).max(limit.max)
}

const routeWaypointSchema = z.object({
  id: z.string().min(1).max(64),
  label: z.string().min(1).max(80),
  position: z.object({
    lat: z.coerce.number().min(-90).max(90),
    lon: z.coerce.number().min(-180).max(180),
  }),
  radiusMiles: z.coerce.number().min(5).max(250),
  reason: z.string().max(240).optional(),
})

const savedCustomRouteSchema = z.object({
  id: z.string().min(1).max(96),
  name: z.string().min(1).max(80),
  color: z.string().min(1).max(32),
  waypoints: z.array(routeWaypointSchema).min(1).max(16),
  targetDays: limitedNumber('longestTripDays').optional(),
  keepOrder: z.boolean().optional(),
  startMonth: z.coerce.number().int().min(1).max(12).optional(),
  directionPreference: z
    .enum(['seasonal', 'north', 'south', 'east', 'west'])
    .optional(),
  createdAt: z.string().min(1).max(48),
  updatedAt: z.string().min(1).max(48),
})

const longestTripVisitTargetSchema = z.object({
  id: z.string().min(1).max(80),
  type: z.enum(['state', 'city', 'landmark']),
  label: z.string().min(1).max(96),
  stayDays: z.coerce.number().int().min(1).max(21),
  state: z.string().min(2).max(3).optional(),
  position: z
    .object({
      lat: z.coerce.number().min(-90).max(90),
      lon: z.coerce.number().min(-180).max(180),
    })
    .optional(),
  radiusMiles: z.coerce.number().min(5).max(250).optional(),
})

export const plannerConfigSchema = z.object({
  plannerMode: z.enum(['longest_trip', 'most_unique_sites']).default('longest_trip'),
  longestTripDays: limitedNumber('longestTripDays'),
  tripPace: z.enum(['sprint', 'balanced', 'savor']).default('balanced'),
  autoStays: z.boolean().default(true),
  favoriteCategories: z.array(z.enum(PLACE_CATEGORY_VALUES)).max(16).default([]),
  mutedCategories: z.array(z.enum(PLACE_CATEGORY_VALUES)).max(16).default([]),
  targetStations: limitedNumber('targetStations'),
  tripWeeks: limitedNumber('tripWeeks'),
  dailyDriveTargetHours: limitedNumber('dailyDriveTargetHours'),
  dailyDriveMaxHours: limitedNumber('dailyDriveMaxHours'),
  longDayOptimization: z.boolean(),
  longDayMaxHours: limitedNumber('longDayMaxHours'),
  longDayMinSitesPerExtraHour: limitedNumber('longDayMinSitesPerExtraHour'),
  averageMph: limitedNumber('averageMph'),
  practicalRangeMiles: limitedNumber('practicalRangeMiles'),
  closeStationRadiusMiles: limitedNumber('closeStationRadiusMiles'),
  closeStationStopMinutes: limitedNumber('closeStationStopMinutes'),
  distanceChargeStopMinutes: limitedNumber('distanceChargeStopMinutes'),
  includeCanada: z.boolean(),
  includeMexico: z.boolean(),
  showAllStations: z.boolean(),
  roadDistanceFactor: limitedNumber('roadDistanceFactor'),
  requiredWaypoints: z.array(routeWaypointSchema).max(8),
  customRouteWaypoints: z.array(routeWaypointSchema).max(12),
  savedCustomRoutes: z.array(savedCustomRouteSchema).max(24),
  longestTripTargets: z.array(longestTripVisitTargetSchema).max(16),
  start: z.object({
    lat: z.coerce.number().min(-90).max(90),
    lon: z.coerce.number().min(-180).max(180),
  }),
})

export function sanitizePlannerConfig(config: Partial<PlannerConfig>): PlannerConfig {
  const merged = {
    ...defaultPlannerConfig,
    ...config,
    requiredWaypoints: config.requiredWaypoints ?? defaultPlannerConfig.requiredWaypoints,
    customRouteWaypoints:
      config.customRouteWaypoints ?? defaultPlannerConfig.customRouteWaypoints,
    savedCustomRoutes:
      config.savedCustomRoutes ?? defaultPlannerConfig.savedCustomRoutes,
    longestTripTargets:
      config.longestTripTargets ?? defaultPlannerConfig.longestTripTargets,
    favoriteCategories:
      config.favoriteCategories ?? defaultPlannerConfig.favoriteCategories,
    mutedCategories:
      config.mutedCategories ?? defaultPlannerConfig.mutedCategories,
    start: {
      ...defaultPlannerConfig.start,
      ...config.start,
    },
  }
  const parsed = plannerConfigSchema.parse(merged)

  if (parsed.dailyDriveMaxHours < parsed.dailyDriveTargetHours) {
    return {
      ...parsed,
      dailyDriveMaxHours: parsed.dailyDriveTargetHours,
      longDayMaxHours: Math.max(
        parsed.longDayMaxHours,
        parsed.dailyDriveTargetHours,
      ),
    }
  }

  if (parsed.longDayMaxHours < parsed.dailyDriveMaxHours) {
    return {
      ...parsed,
      longDayMaxHours: parsed.dailyDriveMaxHours,
    }
  }

  return parsed
}
