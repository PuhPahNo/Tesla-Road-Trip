// @vitest-environment node
import { mkdtempSync, rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { SavedCustomRoute } from '../src/domain/types'

const dir = mkdtempSync(path.join(os.tmpdir(), 'cq-reviewed-routes-'))
const previousPath = process.env.CHARGE_QUEST_DB_PATH
let routes: typeof import('./customRoutes')
let database: typeof import('./database')

beforeAll(async () => {
  process.env.CHARGE_QUEST_DB_PATH = path.join(dir, 'test.sqlite')
  database = await import('./database')
  routes = await import('./customRoutes')
  database.db.prepare("INSERT INTO users (id,username,password_hash,role,created_at,updated_at) VALUES ('owner','owner','unused','admin','2026-09-20','2026-09-20')").run()
})
afterAll(() => {
  database?.db.close()
  if (previousPath === undefined) delete process.env.CHARGE_QUEST_DB_PATH
  else process.env.CHARGE_QUEST_DB_PATH = previousPath
  rmSync(dir, { recursive: true, force: true })
})

describe('reviewed route persistence', () => {
  it('round-trips the sequence, protects it from implicit replanning, and allows explicit rebuilding', () => {
    const route: SavedCustomRoute = {
      id: 'reviewed', name: 'Reviewed', color: '#e82127',
      waypoints: [{ id: 'anchor', label: 'Anchor', position: { lat: 35, lon: -85 }, radiusMiles: 50 }],
      targetDays: 2, dailyStationIds: ['sci-2', 'sci-1'],
      createdAt: '2026-09-20', updatedAt: '2026-09-20',
    }
    routes.writeSavedCustomRoutes('owner', [route])
    expect(routes.readSavedCustomRoutes('owner')[0].dailyStationIds).toEqual(route.dailyStationIds)
    expect(routes.readSavedCustomRoutes('someone-else')).toEqual([])
    expect(routes.updateSavedCustomRoute(route.id, { name: 'Renamed' }, 'owner')?.route.dailyStationIds).toEqual(route.dailyStationIds)
    expect(() => routes.updateSavedCustomRoute(route.id, { targetDays: 3 }, 'owner')).toThrow('Rebuild from destinations')
    expect(() => routes.updateSavedCustomRoute(route.id, { dailyStationIds: ['sci-1', 'sci-1'] }, 'owner')).toThrow()
    const changed = routes.updateSavedCustomRoute(route.id, { dailyStationIds: ['sci-3', 'sci-2', 'sci-1'] }, 'owner')!
    expect(changed.route.targetDays).toBe(3)
    const released = routes.updateSavedCustomRoute(route.id, { dailyStationIds: [], targetDays: 4 }, 'owner')!
    expect(released.route.dailyStationIds).toEqual([])
    expect(released.route.targetDays).toBe(4)
  })
})
