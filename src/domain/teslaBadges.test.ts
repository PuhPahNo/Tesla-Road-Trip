import { describe, expect, it } from 'vitest'
import {
  TESLA_ICONIC_BADGES,
  badgeOpportunitiesForRoute,
  iconicBadgesForStation,
  specialEventBadgesInTripWindow,
} from './teslaBadges'
import type { RoutePlan, Station } from './types'

function station(overrides: Partial<Station> = {}): Station {
  return {
    id: 'sci-test',
    sourceId: 'test',
    source: 'supercharge.info',
    name: 'Test Supercharger',
    status: 'OPEN',
    position: { lat: 35, lon: -110 },
    address: { city: 'Test', state: 'AZ', country: 'USA' },
    stallCount: 8,
    powerKw: 250,
    counted: true,
    otherEvs: false,
    ...overrides,
  }
}

function route(): RoutePlan {
  const pitStopStation = station({
    name: 'Las Vegas, NV - High Roller at LINQ',
    teslaLocationId: 'lasvegaslinqsupercharger',
    position: { lat: 36.11671, lon: -115.168258 },
    address: { city: 'Las Vegas', state: 'NV', country: 'USA' },
  })
  const visit = {
    sequence: 1,
    day: 3,
    station: pitStopStation,
    legMiles: 120,
    driveHours: 2,
    stopMinutes: 8,
    rangeWarning: false,
  }
  return {
    id: 'badge-route',
    plannerMode: 'longest_trip',
    tripStartDate: '2026-04-20',
    name: 'Badge Route',
    strategy: 'Test',
    color: '#e82127',
    uniqueStations: 25,
    totalMiles: 2500,
    totalDriveHours: 50,
    totalStopHours: 4,
    totalDays: 25,
    averageMilesPerDay: 100,
    averageDriveHoursPerDay: 2,
    averageStopHoursPerDay: 0.16,
    averageDistanceBetweenSuperchargers: 100,
    stationsPerDay: 1,
    days: [],
    visits: [visit],
    warnings: [],
    advisories: [],
    longDays: 0,
    routeLine: [],
    rating: {
      score: 80,
      sceneryScore: 80,
      cityScore: 80,
      landmarkScore: 80,
      places: [],
      summary: 'Test',
    },
  }
}

describe('Tesla charging badge catalog', () => {
  it('contains the complete supplied North American iconic catalog', () => {
    expect(TESLA_ICONIC_BADGES.map((badge) => badge.label)).toEqual([
      'Arches',
      'Bryce Canyon',
      'Death Valley',
      'Golden Gate Bridge',
      'Grand Canyon',
      'Joshua Tree',
      'Las Vegas Strip',
      'Miami Beach',
      'Niagara Falls',
      'Oasis',
      'San Antonio River',
      'Santa Monica',
      'Tesla Diner',
      'Waikiki',
      'Whistler',
      'Yellowstone',
      'Yosemite',
    ])
  })

  it('matches exact qualifying sites without broad regional false positives', () => {
    const tusayan = station({
      teslaLocationId: 'tusayanazsupercharger',
      name: 'Tusayan, AZ',
      position: { lat: 35.969448, lon: -112.127675 },
      address: { city: 'Grand Canyon Village', state: 'AZ', country: 'USA' },
    })
    const flagstaff = station({
      teslaLocationId: 'flagstaffazsupercharger',
      name: 'Flagstaff, AZ',
      position: { lat: 35.174272, lon: -111.66328 },
      address: { city: 'Flagstaff', state: 'AZ', country: 'USA' },
    })

    expect(iconicBadgesForStation(tusayan).map((badge) => badge.label)).toEqual([
      'Grand Canyon',
    ])
    expect(iconicBadgesForStation(flagstaff)).toEqual([])
  })

  it('finds special events inside the exact trip window', () => {
    expect(specialEventBadgesInTripWindow('2026-04-20', 5)).toEqual([
      expect.objectContaining({ label: 'Earth Day 2026', day: 3 }),
    ])
    expect(specialEventBadgesInTripWindow('2026-07-05', 30)).toEqual([])
  })

  it('promotes route-aware special events and milestone opportunities', () => {
    expect(badgeOpportunitiesForRoute(route())).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Earth Day 2026', day: 3 }),
        expect.objectContaining({ label: 'Pit Stop', day: 3 }),
        expect.objectContaining({ label: 'Explorer', status: 'on-track' }),
        expect.objectContaining({ label: 'Charging Streak', status: 'on-track' }),
      ]),
    )
  })
})
