import { z } from 'zod'
import type { PlannerConfig } from './types'

export const CHATTANOOGA_37405_START = {
  lat: 35.0795399,
  lon: -85.3082738,
}

export const defaultPlannerConfig: PlannerConfig = {
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
  start: CHATTANOOGA_37405_START,
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

export const plannerConfigSchema = z.object({
  targetStations: z.coerce.number().int().min(25).max(5000),
  tripWeeks: z.coerce.number().min(1).max(52),
  dailyDriveTargetHours: z.coerce.number().min(1).max(14),
  dailyDriveMaxHours: z.coerce.number().min(1).max(16),
  longDayOptimization: z.boolean(),
  longDayMaxHours: z.coerce.number().min(2).max(14),
  longDayMinSitesPerExtraHour: z.coerce.number().min(0.1).max(30),
  averageMph: z.coerce.number().min(25).max(85),
  practicalRangeMiles: z.coerce.number().min(80).max(350),
  closeStationRadiusMiles: z.coerce.number().min(0.5).max(25),
  closeStationStopMinutes: z.coerce.number().min(1).max(60),
  distanceChargeStopMinutes: z.coerce.number().min(2).max(90),
  includeCanada: z.boolean(),
  includeMexico: z.boolean(),
  showAllStations: z.boolean(),
  roadDistanceFactor: z.coerce.number().min(1).max(1.8),
  requiredWaypoints: z.array(routeWaypointSchema).max(8),
  customRouteWaypoints: z.array(routeWaypointSchema).max(12),
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
