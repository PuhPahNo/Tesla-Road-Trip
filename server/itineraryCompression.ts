import { readFileSync } from 'node:fs'
import { sanitizePlannerConfig } from '../src/domain/config'
import type { ReviewedDayDetail, RouteStayDayCap, SavedCustomRoute } from '../src/domain/types'
import { db, transaction } from './database'
import { savedRouteSchema } from './customRoutes'

export const CONSOLIDATION_REVISION_ID = '2026-10-04-reviewed-59-day-schedule'
interface ReviewedRevisionPlan {
  routeId: string
  startDate: string
  beforeDailyStationIds: string[]
  beforeReviewedDayStopCounts?: number[]
  dailyStationIds: string[]
  reviewedDayStopCounts: number[]
  reviewedDayDetails?: ReviewedDayDetail[]
  stayDayCaps?: RouteStayDayCap[]
  driveLimits?: { dailyDriveTargetHours: number; dailyDriveMaxHours: number }
}
const plan = JSON.parse(readFileSync(new URL('../scripts/data/2026-competition-consolidation.json', import.meta.url), 'utf8')) as ReviewedRevisionPlan
export const NOVEMBER_REVISION_ID = '2026-10-04-november-25-return'
export const NOVEMBER_DRIVE_CAP_REVISION_ID = '2026-10-04-reviewed-five-hour-drive-cap'
const novemberPlan = JSON.parse(readFileSync(new URL('../scripts/data/2026-competition-november-return.json', import.meta.url), 'utf8')) as ReviewedRevisionPlan
export const FLEXIBLE_REVISION_ID = '2026-10-04-flexible-49-day-overnights'
const flexiblePlan = JSON.parse(readFileSync(new URL('../scripts/data/2026-competition-flexible-return.json', import.meta.url), 'utf8')) as ReviewedRevisionPlan
export const NOVEMBER_RETURN_IDS = novemberPlan.dailyStationIds
export const NOVEMBER_DAY_COUNTS = novemberPlan.reviewedDayStopCounts
export const BEFORE_CONSOLIDATION_IDS = plan.beforeDailyStationIds
export const CONSOLIDATED_IDS = plan.dailyStationIds
export const CONSOLIDATED_DAY_COUNTS = plan.reviewedDayStopCounts

/** Only shorten the exact reviewed future itinerary; never renumber trip history. */
function applyReviewedRevision(revisionId: string, plan: ReviewedRevisionPlan, firstChangedDay: number): boolean {
  return transaction(() => {
    if (db.prepare('SELECT id FROM data_revisions WHERE id = ?').get(revisionId)) return false
    const trip = db.prepare('SELECT * FROM anthony_trip WHERE id = 1').get() as
      | { selected_route_id: string | null; selected_route_user_id: string | null; day_number: number | null }
      | undefined
    if (trip?.selected_route_id !== plan.routeId || !trip.selected_route_user_id) return false
    const row = db.prepare('SELECT route_json FROM custom_routes WHERE user_id = ? AND id = ?')
      .get(trip.selected_route_user_id, plan.routeId) as { route_json: string } | undefined
    if (!row) return false
    const current = JSON.parse(row.route_json) as SavedCustomRoute
    if (current.name !== '2026 Competition' || current.startDate !== plan.startDate ||
      JSON.stringify(current.reviewedDayStopCounts) !== JSON.stringify(plan.beforeReviewedDayStopCounts) ||
      current.dailyStationIds?.length !== plan.beforeDailyStationIds.length ||
      !plan.beforeDailyStationIds.every((id, index) => current.dailyStationIds?.[index] === id) ||
      (plan.reviewedDayDetails && current.reviewedDayDetails) ||
      (trip.day_number ?? 1) >= firstChangedDay ||
      db.prepare('SELECT day_number FROM trip_day_log WHERE day_number >= ? LIMIT 1').get(firstChangedDay) ||
      db.prepare('SELECT id FROM trip_updates WHERE day_number >= ? LIMIT 1').get(firstChangedDay)) return false

    const now = new Date().toISOString()
    let travelPreferences = current.travelPreferences
    if (plan.driveLimits) {
      const row = db.prepare('SELECT config_json FROM user_preferences WHERE user_id = ?')
        .get(trip.selected_route_user_id) as { config_json: string } | undefined
      const config = sanitizePlannerConfig(row ? JSON.parse(row.config_json) : {})
      travelPreferences = {
        vehicleProfileId: config.vehicleProfileId,
        practicalRangeMiles: config.practicalRangeMiles,
        manualPracticalRange: config.manualPracticalRange,
        tripPace: config.tripPace,
        ...current.travelPreferences,
        ...plan.driveLimits,
      }
    }
    // Retain every waypoint, unrelated preference, and already-travelled opening day.
    const revised = savedRouteSchema.parse({
      ...current, dailyStationIds: plan.dailyStationIds, reviewedDayStopCounts: plan.reviewedDayStopCounts,
      ...(plan.reviewedDayDetails ? {reviewedDayDetails: plan.reviewedDayDetails} : {}),
      ...(plan.stayDayCaps ? {stayDayCaps: [
        ...(current.stayDayCaps ?? []).filter((cap) => !plan.stayDayCaps!.some((update) => update.placeId === cap.placeId)),
        ...plan.stayDayCaps,
      ]} : {}),
      targetDays: plan.reviewedDayStopCounts.length, updatedAt: now,
      ...(plan.driveLimits ? {travelPreferences} : {}),
    })
    db.prepare('INSERT INTO data_revisions (id, applied_at, before_json) VALUES (?, ?, ?)')
      .run(revisionId, now, JSON.stringify({ trip, route: current }))
    db.prepare('UPDATE custom_routes SET route_json = ?, updated_at = ? WHERE user_id = ? AND id = ?')
      .run(JSON.stringify(revised), now, trip.selected_route_user_id, plan.routeId)
    db.prepare('UPDATE anthony_trip SET total_days = ?, updated_at = ? WHERE id = 1')
      .run(plan.reviewedDayStopCounts.length, now)
    return true
  })
}

export function applyItineraryCompression(): boolean {
  return applyReviewedRevision(CONSOLIDATION_REVISION_ID, plan, 7)
}

export function applyNovemberReturnRevision(): boolean {
  return applyReviewedRevision(NOVEMBER_REVISION_ID, novemberPlan, 12)
}

export function applyFlexibleItineraryRevision(): boolean {
  return applyReviewedRevision(FLEXIBLE_REVISION_ID, flexiblePlan, 11)
}

/** Align this reviewed route's warning threshold with the authorized return pace. */
export function applyNovemberDriveCapRevision(): boolean {
  return applyReviewedRevision(NOVEMBER_DRIVE_CAP_REVISION_ID, {
    ...novemberPlan,
    beforeDailyStationIds: novemberPlan.dailyStationIds,
    beforeReviewedDayStopCounts: novemberPlan.reviewedDayStopCounts,
    stayDayCaps: undefined,
    driveLimits: {dailyDriveTargetHours: 4, dailyDriveMaxHours: 5},
  }, 12)
}
