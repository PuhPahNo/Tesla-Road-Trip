import { describe, expect, it } from 'vitest'
import type { Coordinate, RoutePlan } from './types'
import { routeDayWindowPositions } from './routeViewport'

const start: Coordinate = { lat: 35, lon: -85 }
const route = {
  days: Array.from({ length: 49 }, (_, index) => ({
    day: index + 1,
    visits: [{ station: { position: { lat: 36 + index, lon: -86 } } }],
    overnight: { position: { lat: 36 + index, lon: -87 } },
  })),
} as RoutePlan

describe('route day viewport', () => {
  it('frames only the first five legs before departure, including the start and overnights', () => {
    const positions = routeDayWindowPositions(route, start, 0, 5)
    expect(positions).toHaveLength(11)
    expect(positions[0]).toEqual([35, -85])
    expect(positions.at(-1)).toEqual([40, -87])
  })

  it('centers the live day within five legs and includes the preceding overnight', () => {
    const positions = routeDayWindowPositions(route, start, 4, 5)
    expect(positions).toHaveLength(11)
    expect(positions[0]).toEqual([37, -87])
    expect(positions.at(-1)).toEqual([42, -87])
    expect(positions).not.toContainEqual([35, -85])
  })

  it('keeps five legs near the end and includes the return home', () => {
    const positions = routeDayWindowPositions(route, start, 48, 5)
    expect(positions).toHaveLength(12)
    expect(positions[0]).toEqual([79, -87])
    expect(positions.at(-1)).toEqual([35, -85])
  })

  it('fits a shorter route without padding it with unrelated locations', () => {
    const positions = routeDayWindowPositions({ ...route, days: route.days.slice(0, 2) }, start, 1, 5)
    expect(positions).toHaveLength(6)
    expect(positions[0]).toEqual(positions.at(-1))
    expect(routeDayWindowPositions({ ...route, days: [] }, start, 0, 5)).toEqual([])
  })

  it('focuses a day without visits using its overnight and the preceding final visit', () => {
    const restRoute = {
      ...route,
      days: [
        { ...route.days[0], overnight: undefined },
        { ...route.days[1], visits: [] },
        route.days[2],
      ],
    }
    expect(routeDayWindowPositions(restRoute, start, 1, 1)).toEqual([[36, -86], [37, -87]])
  })
})
