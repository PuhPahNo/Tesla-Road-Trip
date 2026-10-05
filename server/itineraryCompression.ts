import { readFileSync } from 'node:fs'
import type { SavedCustomRoute } from '../src/domain/types'
import { db, transaction } from './database'
import { savedRouteSchema } from './customRoutes'

export const CONSOLIDATION_REVISION_ID = '2026-10-04-reviewed-59-day-schedule'
const plan = JSON.parse(readFileSync(new URL('../scripts/data/2026-competition-consolidation.json', import.meta.url), 'utf8')) as {
  routeId: string
  startDate: string
  beforeDailyStationIds: string[]
  dailyStationIds: string[]
  reviewedDayStopCounts: number[]
  consolidations: Array<{ removedId: string; removedOriginalDay: number }>
}
export const BEFORE_CONSOLIDATION_IDS = plan.beforeDailyStationIds
export const CONSOLIDATED_IDS = plan.dailyStationIds
export const CONSOLIDATED_DAY_COUNTS = plan.reviewedDayStopCounts

/** Only shorten the exact reviewed future itinerary; never renumber trip history. */
export function applyItineraryCompression(): boolean {
  return transaction(() => {
    if (db.prepare('SELECT id FROM data_revisions WHERE id = ?').get(CONSOLIDATION_REVISION_ID)) return false
    const trip = db.prepare('SELECT * FROM anthony_trip WHERE id = 1').get() as
      | { selected_route_id: string | null; selected_route_user_id: string | null; day_number: number | null }
      | undefined
    if (trip?.selected_route_id !== plan.routeId || !trip.selected_route_user_id) return false
    const row = db.prepare('SELECT route_json FROM custom_routes WHERE user_id = ? AND id = ?')
      .get(trip.selected_route_user_id, plan.routeId) as { route_json: string } | undefined
    if (!row) return false
    const current = JSON.parse(row.route_json) as SavedCustomRoute
    const firstChangedDay = Math.min(...plan.consolidations.map((stop) => stop.removedOriginalDay))
    if (current.name !== '2026 Competition' || current.startDate !== plan.startDate || current.reviewedDayStopCounts ||
      current.dailyStationIds?.length !== BEFORE_CONSOLIDATION_IDS.length ||
      !BEFORE_CONSOLIDATION_IDS.every((id, index) => current.dailyStationIds?.[index] === id) ||
      (trip.day_number ?? 1) >= firstChangedDay ||
      db.prepare('SELECT day_number FROM trip_day_log WHERE day_number >= ? LIMIT 1').get(firstChangedDay) ||
      db.prepare('SELECT id FROM trip_updates WHERE day_number >= ? LIMIT 1').get(firstChangedDay)) return false

    const now = new Date().toISOString()
    // Retain every waypoint, visit/stay preference, and already-travelled opening day.
    const revised = savedRouteSchema.parse({
      ...current, dailyStationIds: CONSOLIDATED_IDS, reviewedDayStopCounts: CONSOLIDATED_DAY_COUNTS,
      targetDays: CONSOLIDATED_DAY_COUNTS.length, updatedAt: now,
    })
    db.prepare('INSERT INTO data_revisions (id, applied_at, before_json) VALUES (?, ?, ?)')
      .run(CONSOLIDATION_REVISION_ID, now, JSON.stringify({ trip, route: current }))
    db.prepare('UPDATE custom_routes SET route_json = ?, updated_at = ? WHERE user_id = ? AND id = ?')
      .run(JSON.stringify(revised), now, trip.selected_route_user_id, plan.routeId)
    db.prepare('UPDATE anthony_trip SET total_days = ?, updated_at = ? WHERE id = 1')
      .run(CONSOLIDATED_DAY_COUNTS.length, now)
    return true
  })
}
