import { describe, expect, it } from 'vitest'
import type { RoutePlan } from './types'
import { preferredRouteId, routeRangeReadiness } from './routeReadiness'

function route(
  id: string,
  options: {
    distanceSource?: RoutePlan['distanceSource']
    rangeGaps?: number
    warnings?: number
    rating?: number
  } = {},
): RoutePlan {
  const rangeGaps = options.rangeGaps ?? 0
  return {
    id,
    plannerMode: 'longest_trip',
    distanceSource: options.distanceSource,
    name: id,
    strategy: 'test',
    color: '#fff',
    uniqueStations: rangeGaps,
    totalMiles: 100,
    totalDriveHours: 2,
    totalStopHours: 1,
    totalDays: 1,
    averageMilesPerDay: 100,
    averageDriveHoursPerDay: 2,
    averageStopHoursPerDay: 1,
    averageDistanceBetweenSuperchargers: 100,
    stationsPerDay: 1,
    days: [],
    visits: Array.from({ length: rangeGaps }, (_, index) => ({
      sequence: index + 1,
      day: 1,
      station: { id: String(index), name: 'test' } as RoutePlan['visits'][number]['station'],
      legMiles: 100,
      driveHours: 2,
      stopMinutes: 15,
      rangeWarning: true,
    })),
    warnings: Array.from({ length: options.warnings ?? 0 }, () => 'warning'),
    advisories: [],
    longDays: 0,
    routeLine: [],
    rating: {
      score: options.rating ?? 80,
      sceneryScore: 80,
      cityScore: 80,
      landmarkScore: 80,
      places: [],
      summary: 'test',
    },
  }
}

describe('route range readiness', () => {
  it('does not call an estimate road-verified', () => {
    expect(routeRangeReadiness(route('estimate'))).toEqual({
      status: 'estimate_clear',
      distanceSource: 'estimate',
      rangeGapCount: 0,
      rangeChecked: false,
    })
  })

  it('marks road-distance gaps as unresolved', () => {
    expect(
      routeRangeReadiness(
        route('road', { distanceSource: 'road', rangeGaps: 2 }),
      ).status,
    ).toBe('road_gaps')
  })

  it('counts an over-range return to the starting point', () => {
    const value = route('return', { distanceSource: 'road' })
    value.days = [
      {
        warnings: ['Return leg is 400 miles, above configured practical range.'],
      } as RoutePlan['days'][number],
    ]

    expect(routeRangeReadiness(value).rangeGapCount).toBe(1)
  })

  it('prefers a zero-gap candidate over a higher-rated route with gaps', () => {
    expect(
      preferredRouteId([
        route('gaps', { rangeGaps: 2, rating: 99 }),
        route('clear', { rating: 70 }),
      ]),
    ).toBe('clear')
  })
})
