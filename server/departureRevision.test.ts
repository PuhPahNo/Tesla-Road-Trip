// @vitest-environment node
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { SavedCustomRoute } from '../src/domain/types'
import { tripDateForDay } from '../src/domain/teslaBadges'
import { legacyRedirectTarget } from '../src/site/sitePages'

const directory = mkdtempSync(path.join(os.tmpdir(), 'cq-departure-'))
const previousPath = process.env.CHARGE_QUEST_DB_PATH
let database: typeof import('./database')
let revision: typeof import('./departureRevision')
const consolidation = JSON.parse(readFileSync(new URL('../scripts/data/2026-competition-consolidation.json', import.meta.url), 'utf8')) as { beforeDailyStationIds: string[] }
const reviewed = { dailyStationIds: consolidation.beforeDailyStationIds }
const oldIds = ['sci-5990', 'sci-4039', 'sci-6051', 'sci-657', 'sci-3382', 'sci-1734', 'sci-4033', ...reviewed.dailyStationIds.slice(6)]
const oldRoute: SavedCustomRoute = {
  id: 'saved-2026-competition', name: '2026 Competition', color: '#e82127',
  startDate: '2026-10-03', targetDays: 70, dailyStationIds: oldIds,
  waypoints: ['Nashville', 'St. Louis', 'Omaha', ...Array.from({ length: 27 }, (_, index) => `Later destination ${index}`), 'Norfolk', 'Nashville later'].map((label) => ({
    id: label, label, position: { lat: 35, lon: -85 }, radiusMiles: 35,
  })),
  createdAt: '2026-08-01', updatedAt: '2026-10-01',
}

beforeAll(async () => {
  process.env.CHARGE_QUEST_DB_PATH = path.join(directory, 'test.sqlite')
  database = await import('./database')
  revision = await import('./departureRevision')
  database.db.prepare("INSERT INTO users (id,username,password_hash,role,created_at,updated_at) VALUES ('owner','owner','unused','admin','2026-09-20','2026-09-20')").run()
  revision.applyDepartureRevision() // Prepare the revision ledger on the empty installation.
})
beforeEach(() => {
  database.db.exec('DELETE FROM data_revisions; DELETE FROM custom_routes; DELETE FROM trip_day_log;')
  database.db.prepare(`UPDATE anthony_trip SET selected_route_id = ?, selected_route_user_id = 'owner',
    departure_date = '2026-10-03', total_days = 70, day_number = 1, active = 1 WHERE id = 1`).run(oldRoute.id)
  database.db.prepare('INSERT INTO custom_routes (id,user_id,route_json,created_at,updated_at) VALUES (?, ?, ?, ?, ?)')
    .run(oldRoute.id, 'owner', JSON.stringify(oldRoute), oldRoute.createdAt, oldRoute.updatedAt)
})
afterAll(() => {
  database.db.close()
  if (previousPath === undefined) delete process.env.CHARGE_QUEST_DB_PATH
  else process.env.CHARGE_QUEST_DB_PATH = previousPath
  rmSync(directory, { recursive: true, force: true })
})

describe('October departure revision', () => {
  it('pins Omaha to October 9, preserves later stops and dates, and saves an undo snapshot', () => {
    expect(revision.applyDepartureRevision()).toBe(true)
    const row = database.db.prepare('SELECT route_json FROM custom_routes').get() as { route_json: string }
    const route = JSON.parse(row.route_json) as SavedCustomRoute
    expect(route.dailyStationIds).toEqual(reviewed.dailyStationIds)
    expect(route.targetDays).toBe(69)
    expect(new Set(route.dailyStationIds).size).toBe(69)
    expect(tripDateForDay(route.startDate!, 6)).toBe('2026-10-09')
    expect(tripDateForDay(route.startDate!, 7)).toBe(tripDateForDay(oldRoute.startDate!, 8))
    expect(route.waypoints.slice(-2)).toEqual(oldRoute.waypoints.slice(-2))
    const trip = database.db.prepare('SELECT departure_date, current_location, total_days FROM anthony_trip').get()
    expect(trip).toMatchObject({ departure_date: '2026-10-04', current_location: 'Cave City, KY', total_days: 69 })
    const backup = database.db.prepare('SELECT before_json FROM data_revisions').get() as { before_json: string }
    expect(JSON.parse(backup.before_json).route).toEqual(oldRoute)
    // A later edit must survive both a redeploy and a service restart.
    database.db.prepare("UPDATE anthony_trip SET current_location = 'Louisville, KY' WHERE id = 1").run()
    expect(revision.applyDepartureRevision()).toBe(false)
    expect(database.db.prepare('SELECT current_location FROM anthony_trip').get()).toMatchObject({ current_location: 'Louisville, KY' })
  })

  it.each(['replanned', 'logged', 'other-route'])('leaves %s data untouched', (scenario) => {
    if (scenario === 'replanned') {
      database.db.prepare('UPDATE custom_routes SET route_json = ?').run(JSON.stringify({ ...oldRoute, startDate: '2026-10-05' }))
    } else if (scenario === 'logged') {
      database.db.prepare("INSERT INTO trip_day_log (day_number,completed,updated_at) VALUES (1,1,'2026-10-04')").run()
    } else {
      database.db.prepare("UPDATE anthony_trip SET selected_route_id = 'another-route'").run()
    }
    const before = database.db.prepare('SELECT route_json FROM custom_routes').get()
    expect(revision.applyDepartureRevision()).toBe(false)
    expect(database.db.prepare('SELECT route_json FROM custom_routes').get()).toEqual(before)
    expect(database.db.prepare('SELECT id FROM data_revisions').all()).toHaveLength(0)
  })

  it('keeps old article links working', () => {
    expect(legacyRedirectTarget('/journal/73-day-route-not-finished')).toBe('/journal/route-audible-october-2026')
  })
})
