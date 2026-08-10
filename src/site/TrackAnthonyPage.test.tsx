import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from './AuthContext'
import { TrackAnthonyPage } from './TrackAnthonyPage'

vi.mock('../components/MapView', () => ({
  MapView: ({
    highlightedDayIndex,
    activeDayIndex,
    zoomFocusDayIndex,
    roadLine,
    scrollWheelZoom,
    pageScrollOnMobile,
  }: {
    highlightedDayIndex?: number
    activeDayIndex?: number
    zoomFocusDayIndex?: number
    roadLine?: Array<{ lat: number; lon: number }>
    scrollWheelZoom?: boolean
    pageScrollOnMobile?: boolean
  }) => (
    <div>
      Map highlighting day {(highlightedDayIndex ?? 0) + 1}. Road points{' '}
      {roadLine?.length ?? 0}. Active day{' '}
      {activeDayIndex == null ? 'none' : activeDayIndex + 1}. Wheel zoom{' '}
      {scrollWheelZoom === false ? 'off' : 'on'}. Zoom focus day{' '}
      {zoomFocusDayIndex == null ? 'none' : zoomFocusDayIndex + 1}. Mobile page
      scroll {pageScrollOnMobile ? 'on' : 'off'}.
    </div>
  ),
}))

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('Track Anthony', () => {
  it('shows the pre-trip build as a chronological public story without claiming the trip is live', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (input: string) => ({
      ok: true,
      json: async () => input === '/api/auth/session' ? {} : {
        trip: {
          active: false,
          title: "Anthony's ChargeQuest",
          routeName: 'Three routes remain',
          departureDate: '2026-09-01',
          updatedAt: '2026-07-19T12:00:00.000Z',
        },
        updates: [{
          id: 'update-1',
          phase: 'route-decision',
          location: 'Pre-trip',
          title: 'Route 66 made the final three',
          body: 'I kept it because the road has a story beyond the charger count.',
          artifact_url: 'https://example.com/route-map',
          artifact_label: 'Open the route comparison',
          artifact_type: 'link',
          created_at: '2026-07-19T12:00:00.000Z',
          updated_at: '2026-07-19T12:00:00.000Z',
        }],
        stateVotes: [],
        meetups: [],
        suggestions: [],
        achievements: [],
      },
    })))

    render(<MemoryRouter><AuthProvider><TrackAnthonyPage /></AuthProvider></MemoryRouter>)

    expect(await screen.findByRole('heading', { name: 'I’m building my 2026 Tesla Supercharging Competition route in public' })).toBeTruthy()
    expect(screen.getByText('Route 66 made the final three')).toBeTruthy()
    expect(screen.getByRole('link', { name: /Open the route comparison/ }).getAttribute('href')).toBe('https://example.com/route-map')
    expect(screen.getByText('September 1, 2026')).toBeTruthy()
    expect(screen.getByRole('heading', {
      name: 'The route is 73 days long. I’m still not calling it finished.',
    })).toBeTruthy()
    for (const [name, href] of [
      ['Understand the 2026 competition rules', '/2026-tesla-supercharging-competition'],
      ['Read the Longest Trip strategy', '/competition/longest-trip-strategy'],
      ['Compare other Tesla route ideas', '/tesla-road-trip-routes'],
      ['Build your own route with CORE', '/signup?returnTo=%2Fplanner'],
      ['Send me a route problem', '/community'],
    ]) {
      expect(screen.getByRole('link', { name }).getAttribute('href')).toBe(href)
    }
    expect(screen.getByRole('link', {
      name: 'Tesla — 2026 Free Supercharging Competition rules',
    }).getAttribute('href')).toBe(
      'https://www.tesla.com/support/tesla-app/charging-badges/contest',
    )
    expect(screen.queryByRole('button', { name: 'Send invite to Anthony' })).toBeNull()
  })

  it('lays out the published saved route by day and opens writing attached to a location', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const station = {
      id: 'station-1',
      sourceId: 'station-1',
      source: 'supercharge.info',
      name: 'Grand Canyon Supercharger',
      status: 'OPEN',
      position: { lat: 35.2, lon: -111.6 },
      address: {
        city: 'Grand Canyon Village',
        state: 'AZ',
        country: 'USA',
      },
      stallCount: 12,
      powerKw: 250,
      counted: true,
      otherEvs: false,
    }
    const day = (number: number, landmark: string) => ({
      day: number,
      miles: number * 120,
      driveHours: number * 2,
      stopMinutes: 30,
      uniqueStations: 1,
      averageDistanceBetweenSuperchargers: 120,
      visits: [{ sequence: number, day: number, station, legMiles: 120, driveHours: 2, stopMinutes: 20, rangeWarning: false }],
      warnings: [],
      advisories: [],
      longDayOptimized: false,
      rating: {
        score: 90,
        sceneryScore: 90,
        cityScore: 80,
        landmarkScore: 95,
        places: [{
          id: `landmark-${number}`,
          type: 'landmark',
          label: landmark,
          rating: 95,
          sceneryScore: 95,
          visits: 1,
          summary: 'Planned landmark',
        }],
        summary: 'Scenic day',
      },
      ...(number === 2
        ? { stay: { placeId: 'grand-canyon', label: 'Grand Canyon', rating: 95, night: 1, totalNights: 1 } }
        : {}),
    })
    const days = [day(1, 'Cadillac Ranch'), day(2, 'Grand Canyon')]
    const route = {
      id: 'saved-2026-competition',
      plannerMode: 'longest_trip',
      tripStartDate: '2026-08-03',
      name: '2026 Competition',
      strategy: 'Saved route',
      color: '#e82127',
      uniqueStations: 2,
      totalMiles: 360,
      totalDriveHours: 6,
      totalStopHours: 1,
      totalDays: 2,
      averageMilesPerDay: 180,
      averageDriveHoursPerDay: 3,
      averageStopHoursPerDay: 0.5,
      averageDistanceBetweenSuperchargers: 120,
      stationsPerDay: 1,
      days,
      visits: days.flatMap((item) => item.visits),
      warnings: [],
      advisories: [],
      longDays: 0,
      routeLine: [station.position],
      rating: days[0].rating,
    }

    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (input: string) => ({
      ok: true,
      json: async () => {
        if (input === '/api/auth/session') return {}
        if (input === '/api/community/anthony-route') {
          return {
            selectedRouteId: route.id,
            route: {
              savedRoute: {
                id: route.id,
                name: route.name,
                color: route.color,
                startDate: route.tripStartDate,
                targetDays: 2,
                waypointCount: 2,
                updatedAt: '2026-07-26T12:00:00.000Z',
              },
              route,
              road: {
                provider: 'ORS',
                line: [
                  { lat: 35.1, lon: -85.3 },
                  { lat: 35.2, lon: -100.4 },
                  station.position,
                ],
                degraded: false,
                warnings: [],
                requestCount: 1,
              },
            },
          }
        }
        return {
          trip: {
            active: true,
            dayNumber: 1,
            currentLocation: '',
            title: "Anthony's ChargeQuest",
            selectedRouteId: route.id,
            routeName: route.name,
            totalDays: 2,
            departureDate: route.tripStartDate,
            updatedAt: '2026-07-26T12:00:00.000Z',
          },
          updates: [{
            id: 'grand-canyon-blog',
            phase: 'on-the-road',
            day_number: 2,
            location: 'Grand Canyon',
            title: 'What sunrise looked like from the rim',
            body: 'A field note attached to the second day of the route.',
            created_at: '2026-08-04T12:00:00.000Z',
          }],
          stateVotes: [],
          meetups: [],
          suggestions: [],
          achievements: [],
        }
      },
    })))

    vi.setSystemTime(new Date(2026, 7, 1, 12))
    render(<MemoryRouter><AuthProvider><TrackAnthonyPage /></AuthProvider></MemoryRouter>)

    expect(await screen.findByText('2026 competition route · pre-trip plan')).toBeTruthy()
    expect(screen.getByRole('heading', {
      level: 1,
      name: 'My 2026 Tesla Supercharging Competition route, day by day',
    })).toBeTruthy()
    expect(screen.queryByRole('region', { name: /Live 2026 Tesla/ })).toBeNull()

    cleanup()
    vi.setSystemTime(new Date(2026, 7, 3, 12))
    render(<MemoryRouter><AuthProvider><TrackAnthonyPage /></AuthProvider></MemoryRouter>)

    expect(await screen.findByRole('region', { name: 'Live 2026 Tesla Supercharging Competition route map' })).toBeTruthy()
    expect(screen.getByRole('heading', {
      level: 1,
      name: 'My 2026 Tesla Supercharging Competition route: Day 1 — Grand Canyon Village, AZ',
    })).toBeTruthy()
    expect(screen.getAllByText(/Map highlighting day 1\. Road points 3/)).toHaveLength(1)
    expect(screen.getByText(/Active day 1\. Wheel zoom off/)).toBeTruthy()
    expect(screen.getByText(/Mobile page scroll on/)).toBeTruthy()
    expect(screen.getByText('One finger scrolls · two fingers move or zoom')).toBeTruthy()
    expect(screen.getByText(/Zoom focus day 1/)).toBeTruthy()
    expect(screen.getByText('Current day 1')).toBeTruthy()
    expect(screen.getAllByText('ORS road-accurate route').length).toBeGreaterThan(0)
    expect(screen.getByRole('heading', { name: 'The complete 2026 competition route and day-by-day itinerary' })).toBeTruthy()
    await userEvent.click(screen.getByRole('button', { name: 'Open day 2, Grand Canyon' }))
    expect(screen.getByText(/Map highlighting day 2\. Road points 3/)).toBeTruthy()
    expect(screen.getByText(/Active day 1\. Wheel zoom off/)).toBeTruthy()
    expect(screen.getByText(/Zoom focus day 2/)).toBeTruthy()
    expect(screen.getByText('Preview day 2')).toBeTruthy()
    expect(screen.getByRole('heading', {
      level: 1,
      name: 'My 2026 Tesla Supercharging Competition route: Day 2 — Grand Canyon',
    })).toBeTruthy()
    expect(screen.getAllByText('What sunrise looked like from the rim').length).toBeGreaterThan(0)

    cleanup()
    vi.setSystemTime(new Date(2026, 7, 5, 12))
    render(<MemoryRouter><AuthProvider><TrackAnthonyPage /></AuthProvider></MemoryRouter>)

    expect(await screen.findByText('2026 competition route · planned itinerary archive')).toBeTruthy()
    expect(screen.getByRole('heading', {
      level: 1,
      name: 'My planned 2026 Tesla Supercharging Competition route, preserved day by day',
    })).toBeTruthy()
    expect(screen.queryByRole('region', { name: /Live 2026 Tesla/ })).toBeNull()
  })
})
