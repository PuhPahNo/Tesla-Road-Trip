import type { SavedCustomRoute } from '../src/domain/types'
import { db, transaction } from './database'
import { savedRouteSchema } from './customRoutes'

const REVISION_ID = '2026-10-04-departure'
const OLD_OPENING = ['sci-5990', 'sci-4039', 'sci-6051', 'sci-657', 'sci-3382', 'sci-1734', 'sci-4033']
const NEW_OPENING = [
  { id: 'sci-9323', label: 'Cave City, KY', position: { lat: 37.135673, lon: -85.973849 }, reason: 'Day 1 · October 4 · Mammoth Cave National Park' },
  { id: 'sci-748', label: 'Louisville, KY', position: { lat: 38.211846, lon: -85.673087 }, reason: 'Day 2 · October 5 · Kentucky Derby Museum at Churchill Downs' },
  { id: 'sci-4230', label: 'St. Louis, MO', position: { lat: 38.620184, lon: -90.260501 }, reason: 'Day 3 · October 6 · St. Louis' },
  { id: 'sci-1601', label: 'Kansas City, MO', position: { lat: 39.24629, lon: -94.644943 }, reason: 'Day 4 · October 7 · Kansas City' },
  { id: 'sci-1734', label: 'St. Joseph, MO', position: { lat: 39.76864, lon: -94.801978 }, reason: 'Day 5 · October 8 · Tentative stop: Pony Express National Museum' },
  { id: 'sci-4033', label: 'Omaha, NE', position: { lat: 41.233636, lon: -96.052428 }, reason: 'Day 6 · October 9 · Meet Dad' },
]

/** One-time correction of the published, reviewed itinerary, with a rollback snapshot. */
export function applyDepartureRevision(): boolean {
  db.exec(`CREATE TABLE IF NOT EXISTS data_revisions (
    id TEXT PRIMARY KEY, applied_at TEXT NOT NULL, before_json TEXT NOT NULL
  )`)
  return transaction(() => {
    if (db.prepare('SELECT id FROM data_revisions WHERE id = ?').get(REVISION_ID)) return false
    const trip = db.prepare('SELECT * FROM anthony_trip WHERE id = 1').get() as
      | { selected_route_id: string | null; selected_route_user_id: string | null; departure_date: string | null; day_number: number | null }
      | undefined
    if (trip?.selected_route_id !== 'saved-2026-competition' || !trip.selected_route_user_id) return false
    const row = db.prepare('SELECT route_json FROM custom_routes WHERE user_id = ? AND id = ?')
      .get(trip.selected_route_user_id, trip.selected_route_id) as { route_json: string } | undefined
    if (!row) return false
    const current = JSON.parse(row.route_json) as SavedCustomRoute
    // Never overwrite a subsequently replanned route or renumber an existing road log.
    if (current.name !== '2026 Competition' || current.startDate !== '2026-10-03' ||
      current.dailyStationIds?.length !== 70 || trip.day_number !== 1 ||
      !OLD_OPENING.every((id, index) => current.dailyStationIds?.[index] === id) ||
      db.prepare('SELECT day_number FROM trip_day_log LIMIT 1').get()) return false

    const dailyStationIds = [...NEW_OPENING.map((stop) => stop.id), ...current.dailyStationIds.slice(7)]
    const omahaIndex = current.waypoints.findIndex((point) => /omaha/i.test(point.label))
    const remainingWaypoints = omahaIndex >= 0
      ? current.waypoints.slice(omahaIndex + 1)
      : current.waypoints.filter((point) => !/nashville|marion|fenton|st\.? louis|columbia|concordia|st\.? joseph|omaha/i.test(point.label))
    const now = new Date().toISOString()
    const revised: SavedCustomRoute = {
      ...current,
      startDate: '2026-10-04', startMonth: 10,
      targetDays: dailyStationIds.length, dailyStationIds,
      waypoints: [
        ...NEW_OPENING.map((stop) => ({ ...stop, id: `departure-${stop.id}`, radiusMiles: 35 })),
        ...remainingWaypoints,
      ],
      updatedAt: now,
    }
    // Use the same persistence schema as admin edits before touching either record.
    const validated = savedRouteSchema.parse(revised)
    db.prepare('INSERT INTO data_revisions (id, applied_at, before_json) VALUES (?, ?, ?)')
      .run(REVISION_ID, now, JSON.stringify({ trip, route: current }))
    db.prepare('UPDATE custom_routes SET route_json = ?, updated_at = ? WHERE user_id = ? AND id = ?')
      .run(JSON.stringify(validated), now, trip.selected_route_user_id, trip.selected_route_id)
    db.prepare(`UPDATE anthony_trip SET departure_date = ?, total_days = ?, current_location = ?,
      latitude = ?, longitude = ?, updated_at = ? WHERE id = 1`)
      .run(revised.startDate!, dailyStationIds.length, NEW_OPENING[0].label,
        NEW_OPENING[0].position.lat, NEW_OPENING[0].position.lon, now)
    return true
  })
}
