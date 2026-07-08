import { describe, expect, it } from 'vitest'
import { defaultPlannerConfig } from './config'
import { emptySegmentRating } from './ratings'
import { planAutoStays, suggestedStayDays, tagStayDays } from './stays'
import type { Coordinate, DayPlan, PlannerConfig, Station } from './types'

const GRAND_CANYON = { lat: 36.1069, lon: -112.1129 }
const CHATTANOOGA = defaultPlannerConfig.start

function configWith(overrides: Partial<PlannerConfig>): PlannerConfig {
  return { ...defaultPlannerConfig, ...overrides }
}

function stationAt(index: number, position: Coordinate, state = 'AZ'): Station {
  return {
    id: `stay-test-${index}`,
    sourceId: String(index),
    source: 'supercharge.info',
    name: `Stay Test Station ${index}`,
    status: 'OPEN',
    position,
    address: { city: `City ${index}`, state, country: 'USA' },
    stallCount: 8,
    powerKw: 250,
    counted: true,
    otherEvs: false,
  }
}

function singleVisitDay(day: number, position: Coordinate, state = 'AZ'): DayPlan {
  const station = stationAt(day, position, state)
  return {
    day,
    miles: 120,
    driveHours: 2,
    stopMinutes: 18,
    uniqueStations: 1,
    averageDistanceBetweenSuperchargers: 120,
    visits: [
      {
        sequence: day,
        day,
        station,
        legMiles: 120,
        driveHours: 2,
        stopMinutes: 18,
        rangeWarning: false,
      },
    ],
    warnings: [],
    advisories: [],
    longDayOptimized: false,
    rating: emptySegmentRating(),
  }
}

describe('suggestedStayDays', () => {
  it('never adds nights on sprint pace', () => {
    expect(suggestedStayDays(100, 'sprint')).toBe(1)
    expect(suggestedStayDays(60, 'sprint')).toBe(1)
  })

  it('scales balanced stays with rating', () => {
    expect(suggestedStayDays(84, 'balanced')).toBe(1)
    expect(suggestedStayDays(90, 'balanced')).toBe(2)
    expect(suggestedStayDays(95, 'balanced')).toBe(2)
    expect(suggestedStayDays(99, 'balanced')).toBe(3)
  })

  it('earns more nights on savor pace', () => {
    expect(suggestedStayDays(79, 'savor')).toBe(1)
    expect(suggestedStayDays(85, 'savor')).toBe(2)
    expect(suggestedStayDays(95, 'savor')).toBe(3)
    expect(suggestedStayDays(99, 'savor')).toBe(4)
  })
})

describe('planAutoStays', () => {
  const canyonCorridor = [CHATTANOOGA, GRAND_CANYON, CHATTANOOGA]

  it('reserves multi-day stays for high-rated places on the corridor', () => {
    const stays = planAutoStays(canyonCorridor, 120, configWith({}))
    const canyon = stays.find((stay) => stay.id === 'landmark-az-grand-canyon')

    expect(canyon).toBeDefined()
    expect(canyon!.stayDays).toBe(3)
    expect(canyon!.auto).toBe(true)
    stays.forEach((stay) => expect(stay.stayDays).toBeGreaterThanOrEqual(2))
  })

  it('returns nothing on sprint pace or when auto stays are off', () => {
    expect(
      planAutoStays(canyonCorridor, 120, configWith({ tripPace: 'sprint' })),
    ).toEqual([])
    expect(
      planAutoStays(canyonCorridor, 120, configWith({ autoStays: false })),
    ).toEqual([])
  })

  it('skips places already covered by a manual target', () => {
    const stays = planAutoStays(
      canyonCorridor,
      120,
      configWith({
        longestTripTargets: [
          {
            id: 'landmark-az-grand-canyon',
            type: 'landmark',
            label: 'Grand Canyon',
            stayDays: 5,
            position: GRAND_CANYON,
            radiusMiles: 95,
          },
        ],
      }),
    )

    expect(
      stays.some((stay) => stay.id === 'landmark-az-grand-canyon'),
    ).toBe(false)
    stays.forEach((stay) => {
      expect(stay.position).toBeDefined()
    })
  })

  it('caps total extra nights by the pace leisure share of the trip', () => {
    const shortTrip = planAutoStays(canyonCorridor, 120, configWith({
      longestTripDays: 8,
    }))
    const extraNights = shortTrip.reduce(
      (sum, stay) => sum + (stay.stayDays - 1),
      0,
    )

    expect(extraNights).toBeLessThanOrEqual(2)
  })
})

describe('tagStayDays', () => {
  it('tags consecutive days around one place as numbered nights', () => {
    const nearCanyon = (offset: number) => ({
      lat: GRAND_CANYON.lat + offset * 0.15,
      lon: GRAND_CANYON.lon + offset * 0.15,
    })
    const days = [
      singleVisitDay(1, { lat: 35.2, lon: -101.8, }, 'TX'),
      singleVisitDay(2, nearCanyon(0)),
      singleVisitDay(3, nearCanyon(1)),
      singleVisitDay(4, nearCanyon(2)),
      singleVisitDay(5, { lat: 39.7, lon: -105.0 }, 'CO'),
    ]

    const tagged = tagStayDays(days, configWith({}))

    expect(tagged[0].stay).toBeUndefined()
    expect(tagged[1].stay).toMatchObject({
      label: 'Grand Canyon',
      night: 1,
      totalNights: 3,
    })
    expect(tagged[2].stay?.night).toBe(2)
    expect(tagged[3].stay?.night).toBe(3)
    expect(tagged[4].stay).toBeUndefined()
  })

  it('leaves plans untouched outside longest trip mode', () => {
    const days = [
      singleVisitDay(1, GRAND_CANYON),
      singleVisitDay(2, GRAND_CANYON),
    ]
    const tagged = tagStayDays(
      days,
      configWith({ plannerMode: 'most_unique_sites' }),
    )

    expect(tagged.every((day) => day.stay === undefined)).toBe(true)
  })
})
