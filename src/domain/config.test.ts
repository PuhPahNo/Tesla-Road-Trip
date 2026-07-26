import { describe, expect, it } from 'vitest'
import {
  MAX_SAVED_ROUTE_WAYPOINTS,
  defaultPlannerConfig,
  sanitizePlannerConfig,
} from './config'
import type { SavedCustomRoute } from './types'

function savedRoute(waypointCount: number): SavedCustomRoute {
  const now = '2026-07-26T12:00:00.000Z'
  return {
    id: 'saved-large-route',
    name: 'Large route',
    color: '#7c3aed',
    waypoints: Array.from({ length: waypointCount }, (_, index) => ({
      id: `waypoint-${index + 1}`,
      label: `Waypoint ${index + 1}`,
      position: { lat: 30 + index / 100, lon: -100 - index / 100 },
      radiusMiles: 50,
    })),
    createdAt: now,
    updatedAt: now,
  }
}

describe('saved custom route limits', () => {
  it('accepts the shared destination ceiling and rejects larger route payloads', () => {
    expect(
      sanitizePlannerConfig({
        ...defaultPlannerConfig,
        savedCustomRoutes: [savedRoute(MAX_SAVED_ROUTE_WAYPOINTS)],
      }).savedCustomRoutes[0].waypoints,
    ).toHaveLength(MAX_SAVED_ROUTE_WAYPOINTS)

    expect(() =>
      sanitizePlannerConfig({
        ...defaultPlannerConfig,
        savedCustomRoutes: [savedRoute(MAX_SAVED_ROUTE_WAYPOINTS + 1)],
      }),
    ).toThrow()
  })
})
