// @vitest-environment node
import { mkdtempSync, rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { SavedCustomRoute } from '../src/domain/types'
import { tripDateForDay } from '../src/domain/teslaBadges'

const directory = mkdtempSync(path.join(os.tmpdir(), 'cq-consolidation-'))
const previousPath = process.env.CHARGE_QUEST_DB_PATH
let database: typeof import('./database')
let revision: typeof import('./itineraryCompression')
let before: SavedCustomRoute

beforeAll(async () => {
  process.env.CHARGE_QUEST_DB_PATH = path.join(directory, 'test.sqlite')
  database = await import('./database')
  revision = await import('./itineraryCompression')
  database.db.prepare("INSERT INTO users (id,username,password_hash,role,created_at,updated_at) VALUES ('owner','owner','unused','admin','2026-10-01','2026-10-01')").run()
  before = {
    id: 'saved-2026-competition', name: '2026 Competition', color: '#e82127',
    startDate: '2026-10-04', targetDays: 69, dailyStationIds: revision.BEFORE_CONSOLIDATION_IDS,
    keepOrder: true,
    waypoints: Array.from({ length: 38 }, (_, i) => ({
      id: `park-${i}`, label: `Protected park ${i}`, position: { lat: 35, lon: -85 }, radiusMiles: 35,
    })),
    stayDayCaps: [{ placeId: 'landmark-ut-arches', maxDays: 3 }],
    createdAt: '2026-09-20', updatedAt: '2026-10-04',
  }
})
beforeEach(() => {
  database.db.exec('DELETE FROM data_revisions; DELETE FROM custom_routes; DELETE FROM trip_day_log; DELETE FROM trip_updates; DELETE FROM user_preferences;')
  database.db.prepare(`UPDATE anthony_trip SET selected_route_id = ?, selected_route_user_id = 'owner',
    departure_date = '2026-10-04', total_days = 69, day_number = 2,
    current_location = 'Louisville, KY', latitude = 38.2, longitude = -85.6 WHERE id = 1`).run(before.id)
  database.db.prepare('INSERT INTO custom_routes (id,user_id,route_json,created_at,updated_at) VALUES (?,?,?,?,?)')
    .run(before.id, 'owner', JSON.stringify(before), before.createdAt, before.updatedAt)
})
afterAll(() => {
  database.db.close()
  if (previousPath === undefined) delete process.env.CHARGE_QUEST_DB_PATH
  else process.env.CHARGE_QUEST_DB_PATH = previousPath
  rmSync(directory, { recursive: true, force: true })
})

describe('transfer-day consolidation', () => {
  it('consolidates future travel days, preserves priorities/progress/history, and saves a rollback', () => {
    database.db.prepare("INSERT INTO trip_day_log (day_number, completed, note, updated_at) VALUES (1,1,'Mammoth Cave','2026-10-04')").run()
    const tripBefore = database.db.prepare('SELECT day_number,current_location,latitude,longitude,departure_date FROM anthony_trip').get()
    expect(revision.applyItineraryCompression()).toBe(true)
    const row = database.db.prepare('SELECT route_json FROM custom_routes').get() as { route_json: string }
    const after = JSON.parse(row.route_json) as SavedCustomRoute
    expect(after.dailyStationIds).toEqual(revision.CONSOLIDATED_IDS)
    expect(after.reviewedDayStopCounts).toEqual(revision.CONSOLIDATED_DAY_COUNTS)
    expect(after.reviewedDayStopCounts!.reduce((sum, count) => sum + count, 0)).toBe(after.dailyStationIds!.length)
    expect(after.dailyStationIds!.filter((id) => !before.dailyStationIds!.includes(id))).toEqual(['sci-1209'])
    expect(before.dailyStationIds!.filter((id) => !after.dailyStationIds!.includes(id))).toEqual(['sci-7723', 'sci-1296', 'sci-9501'])
    expect(after.targetDays).toBe(59)
    expect(after.dailyStationIds!.slice(0, 6)).toEqual(before.dailyStationIds!.slice(0, 6))
    expect(after.waypoints).toEqual(before.waypoints)
    expect(after.stayDayCaps).toEqual(before.stayDayCaps)
    expect(tripDateForDay(after.startDate!, 6)).toBe('2026-10-09')
    expect(tripDateForDay(after.startDate!, 59)).toBe('2026-12-01')
    expect(database.db.prepare('SELECT day_number,current_location,latitude,longitude,departure_date FROM anthony_trip').get()).toEqual(tripBefore)
    expect(database.db.prepare('SELECT total_days FROM anthony_trip').get()).toMatchObject({ total_days: 59 })
    expect(database.db.prepare('SELECT note FROM trip_day_log').get()).toMatchObject({ note: 'Mammoth Cave' })
    const backup = database.db.prepare('SELECT before_json FROM data_revisions WHERE id = ?').get(revision.CONSOLIDATION_REVISION_ID) as { before_json: string }
    expect(JSON.parse(backup.before_json).route).toEqual(before)
    expect(revision.applyItineraryCompression()).toBe(false)
  })

  it.each(['replanned', 'regrouped', 'travelled', 'future-log', 'future-journal', 'other-route'])('does not overwrite %s data', (scenario) => {
    if (scenario === 'replanned') database.db.prepare('UPDATE custom_routes SET route_json = ?').run(JSON.stringify({ ...before, dailyStationIds: [...before.dailyStationIds!].reverse() }))
    if (scenario === 'regrouped') database.db.prepare('UPDATE custom_routes SET route_json = ?').run(JSON.stringify({...before, reviewedDayStopCounts: [2, ...Array(67).fill(1)]}))
    if (scenario === 'travelled') database.db.prepare('UPDATE anthony_trip SET day_number = 7').run()
    if (scenario === 'future-log') database.db.prepare("INSERT INTO trip_day_log (day_number,completed,updated_at) VALUES (61,1,'2026-12-01')").run()
    if (scenario === 'future-journal') database.db.prepare("INSERT INTO trip_updates (id,day_number,location,title,body,created_at,updated_at) VALUES ('future',30,'California','Journal','Keep day numbering','2026-10-04','2026-10-04')").run()
    if (scenario === 'other-route') database.db.prepare("UPDATE anthony_trip SET selected_route_id = 'another-route'").run()
    const unchanged = database.db.prepare('SELECT route_json FROM custom_routes').get()
    expect(revision.applyItineraryCompression()).toBe(false)
    expect(database.db.prepare('SELECT route_json FROM custom_routes').get()).toEqual(unchanged)
    expect(database.db.prepare('SELECT id FROM data_revisions').all()).toHaveLength(0)
  })
})

describe('November return revision', () => {
  function prepare59DayRoute() {
    expect(revision.applyItineraryCompression()).toBe(true)
    return JSON.parse((database.db.prepare('SELECT route_json FROM custom_routes').get() as {route_json: string}).route_json) as SavedCustomRoute
  }

  it('packs the route to November 25, retains priority stops and progress, and backs up the 59-day plan', () => {
    const baseline = prepare59DayRoute()
    database.db.prepare("INSERT INTO trip_day_log (day_number,completed,note,updated_at) VALUES (1,1,'Mammoth Cave','2026-10-04')").run()
    const progress = database.db.prepare('SELECT day_number,current_location,latitude,longitude,departure_date FROM anthony_trip').get()
    expect(revision.applyNovemberReturnRevision()).toBe(true)
    const after = JSON.parse((database.db.prepare('SELECT route_json FROM custom_routes').get() as {route_json: string}).route_json) as SavedCustomRoute
    expect(after.dailyStationIds).toEqual(revision.NOVEMBER_RETURN_IDS)
    expect(after.reviewedDayStopCounts).toEqual(revision.NOVEMBER_DAY_COUNTS)
    expect(after.targetDays).toBe(53)
    expect(after.dailyStationIds!.length).toBe(71)
    expect(after.reviewedDayStopCounts!.reduce((sum, count) => sum + count, 0)).toBe(71)
    expect(after.dailyStationIds!.slice(0, 6)).toEqual(baseline.dailyStationIds!.slice(0, 6))
    expect(after.waypoints).toEqual(baseline.waypoints)
    expect(baseline.dailyStationIds!.filter(id => !after.dailyStationIds!.includes(id))).toEqual(['sci-1081'])
    expect(after.stayDayCaps).toEqual(expect.arrayContaining([
      {placeId: 'landmark-co-rocky-mountain', maxDays: 2},
      {placeId: 'landmark-az-grand-canyon', maxDays: 2},
      {placeId: 'landmark-wy-yellowstone', maxDays: 2},
      {placeId: 'landmark-ut-arches', maxDays: 3},
    ]))
    expect(tripDateForDay(after.startDate!, 53)).toBe('2026-11-25')
    expect(tripDateForDay(after.startDate!, 6)).toBe('2026-10-09')
    expect(database.db.prepare('SELECT day_number,current_location,latitude,longitude,departure_date FROM anthony_trip').get()).toEqual(progress)
    expect(database.db.prepare('SELECT total_days FROM anthony_trip').get()).toMatchObject({total_days: 53})
    const backup = database.db.prepare('SELECT before_json FROM data_revisions WHERE id = ?').get(revision.NOVEMBER_REVISION_ID) as {before_json: string}
    expect(JSON.parse(backup.before_json).route).toEqual(baseline)
    expect(revision.applyNovemberReturnRevision()).toBe(false)
  })

  it.each(['regrouped', 'replanned', 'travelled', 'future-log', 'future-journal'])('protects %s itinerary/history from renumbering', scenario => {
    const baseline = prepare59DayRoute()
    if (scenario === 'regrouped') database.db.prepare('UPDATE custom_routes SET route_json = ?').run(JSON.stringify({...baseline, reviewedDayStopCounts: [2, ...Array(65).fill(1)]}))
    if (scenario === 'replanned') database.db.prepare('UPDATE custom_routes SET route_json = ?').run(JSON.stringify({...baseline, dailyStationIds: [...baseline.dailyStationIds!].reverse()}))
    if (scenario === 'travelled') database.db.prepare('UPDATE anthony_trip SET day_number = 12').run()
    if (scenario === 'future-log') database.db.prepare("INSERT INTO trip_day_log (day_number,completed,updated_at) VALUES (12,1,'2026-10-15')").run()
    if (scenario === 'future-journal') database.db.prepare("INSERT INTO trip_updates (id,day_number,location,title,body,created_at,updated_at) VALUES ('future',12,'Colorado','Journal','Keep numbering','2026-10-04','2026-10-04')").run()
    const unchanged = database.db.prepare('SELECT route_json FROM custom_routes').get()
    expect(revision.applyNovemberReturnRevision()).toBe(false)
    expect(database.db.prepare('SELECT route_json FROM custom_routes').get()).toEqual(unchanged)
    expect(database.db.prepare('SELECT id FROM data_revisions WHERE id = ?').get(revision.NOVEMBER_REVISION_ID)).toBeUndefined()
  })

  it('aligns the reviewed driving cap while preserving vehicle/range settings and global preferences', () => {
    prepare59DayRoute()
    expect(revision.applyNovemberDriveCapRevision()).toBe(false)
    expect(revision.applyNovemberReturnRevision()).toBe(true)
    const preferences = {vehicleProfileId: 'model-y-long-range-awd', practicalRangeMiles: 280, manualPracticalRange: true, tripPace: 'savor', dailyDriveTargetHours: 3, dailyDriveMaxHours: 4}
    database.db.prepare("INSERT INTO user_preferences (user_id,config_json,updated_at) VALUES ('owner',?,'2026-10-04')").run(JSON.stringify(preferences))
    const globalBefore = database.db.prepare('SELECT * FROM user_preferences').get()
    const routeBefore = JSON.parse((database.db.prepare('SELECT route_json FROM custom_routes').get() as {route_json: string}).route_json)
    const vehiclePreferences = {...preferences, practicalRangeMiles: 250}
    database.db.prepare('UPDATE custom_routes SET route_json = ?').run(JSON.stringify({...routeBefore,travelPreferences:vehiclePreferences}))
    expect(revision.applyNovemberDriveCapRevision()).toBe(true)
    const after = JSON.parse((database.db.prepare('SELECT route_json FROM custom_routes').get() as {route_json: string}).route_json)
    expect(after.travelPreferences).toEqual({...vehiclePreferences,dailyDriveTargetHours:4,dailyDriveMaxHours:5})
    expect(after.dailyStationIds).toEqual(routeBefore.dailyStationIds)
    expect(after.reviewedDayStopCounts).toEqual(routeBefore.reviewedDayStopCounts)
    expect(after.waypoints).toEqual(routeBefore.waypoints)
    expect(database.db.prepare('SELECT * FROM user_preferences').get()).toEqual(globalBefore)
    const backup = database.db.prepare('SELECT before_json FROM data_revisions WHERE id = ?').get(revision.NOVEMBER_DRIVE_CAP_REVISION_ID) as {before_json: string}
    expect(JSON.parse(backup.before_json).route.travelPreferences).toEqual(vehiclePreferences)
    expect(revision.applyNovemberDriveCapRevision()).toBe(false)
  })

  it('snapshots existing global vehicle preferences when the route has no travel override', () => {
    prepare59DayRoute()
    expect(revision.applyNovemberReturnRevision()).toBe(true)
    database.db.prepare("INSERT INTO user_preferences (user_id,config_json,updated_at) VALUES ('owner',?,'2026-10-04')")
      .run(JSON.stringify({vehicleProfileId:'model-s-awd',practicalRangeMiles:300,manualPracticalRange:true,tripPace:'savor'}))
    expect(revision.applyNovemberDriveCapRevision()).toBe(true)
    const after = JSON.parse((database.db.prepare('SELECT route_json FROM custom_routes').get() as {route_json: string}).route_json)
    expect(after.travelPreferences).toEqual({vehicleProfileId:'model-s-awd',practicalRangeMiles:300,manualPracticalRange:true,tripPace:'savor',dailyDriveTargetHours:4,dailyDriveMaxHours:5})
  })
})
