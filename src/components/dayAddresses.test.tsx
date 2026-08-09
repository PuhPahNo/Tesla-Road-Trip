import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { RoutePlan, Station } from '../domain/types'
import { DaysSection, OverviewSection } from './GlassPanel'

afterEach(cleanup)

const station: Station = {
  id: 'station-1',
  sourceId: 'station-1',
  source: 'supercharge.info',
  name: 'Kalispell Supercharger',
  status: 'OPEN',
  position: { lat: 48.1958, lon: -114.3116 },
  address: {
    street: '2280 Highway 93 N',
    city: 'Kalispell',
    state: 'MT',
    zip: '59901',
    country: 'USA',
  },
  stallCount: 12,
  powerKw: 250,
  counted: true,
  otherEvs: false,
}

const route: RoutePlan = {
  id: 'route-1',
  plannerMode: 'longest_trip',
  tripStartDate: '2026-10-20',
  name: 'Address route',
  strategy: 'Test route',
  color: '#e82127',
  uniqueStations: 1,
  totalMiles: 120,
  totalDriveHours: 2,
  totalStopHours: 0.5,
  totalDays: 1,
  averageMilesPerDay: 120,
  averageDriveHoursPerDay: 2,
  averageStopHoursPerDay: 0.5,
  averageDistanceBetweenSuperchargers: 120,
  stationsPerDay: 1,
  days: [
    {
      day: 1,
      miles: 120,
      driveHours: 2,
      stopMinutes: 30,
      uniqueStations: 1,
      averageDistanceBetweenSuperchargers: 120,
      visits: [
        {
          sequence: 1,
          day: 1,
          station,
          legMiles: 120,
          driveHours: 2,
          stopMinutes: 30,
          rangeWarning: false,
        },
      ],
      warnings: [],
      advisories: [],
      longDayOptimized: false,
      rating: {
        score: 87,
        sceneryScore: 90,
        cityScore: 80,
        landmarkScore: 92,
        places: [],
        summary: 'Test day',
      },
    },
  ],
  visits: [
    {
      sequence: 1,
      day: 1,
      station,
      legMiles: 120,
      driveHours: 2,
      stopMinutes: 30,
      rangeWarning: false,
    },
  ],
  warnings: [],
  advisories: [],
  longDays: 0,
  routeLine: [],
  rating: {
    score: 87,
    sceneryScore: 90,
    cityScore: 80,
    landmarkScore: 92,
    places: [],
    summary: 'Test route',
  },
}

describe('daily station addresses', () => {
  it('shows the exact Supercharger name and address in the daily plan', () => {
    render(
      <DaysSection
        route={route}
        onOpenDay={vi.fn()}
      />,
    )

    expect(screen.getByText('Kalispell Supercharger')).toBeTruthy()
    expect(screen.getByText('2280 Highway 93 N, Kalispell, MT 59901')).toBeTruthy()
    expect(screen.getByText('Open')).toBeTruthy()
    expect(screen.getByLabelText('Supercharge.info status: Open')).toBeTruthy()
  })

  it('summarizes current availability across the route', () => {
    render(<OverviewSection route={route} />)

    expect(screen.getByText('1/1 route sites currently open')).toBeTruthy()
    expect(screen.getByText(/refresh before travel/i)).toBeTruthy()
  })
})
