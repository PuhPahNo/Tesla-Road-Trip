import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AdminHotelsPage } from './AdminHotelsPage'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('admin hotel planner', () => {
  it('loads the saved route, shows booking details, and filters EV options', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async (input: string) => ({
        ok: true,
        json: async () =>
          input === '/api/admin/community'
            ? {
                community: {
                  trip: { selectedRouteId: 'route-2026' },
                  updates: [],
                  stateVotes: [],
                  meetups: [],
                  suggestions: [],
                  achievements: [],
                },
                savedRoutes: [
                  {
                    id: 'route-2026',
                    name: '2026 Competition',
                    color: '#e82127',
                    waypoints: [],
                    targetDays: 73,
                    startDate: '2026-09-27',
                    createdAt: '2026-07-01T00:00:00.000Z',
                    updatedAt: '2026-08-01T00:00:00.000Z',
                  },
                ],
                pendingMeetups: [],
                suggestionInbox: [],
              }
            : {
                route: {
                  id: 'route-2026',
                  name: '2026 Competition',
                  startDate: '2026-09-27',
                  totalDays: 73,
                  uniqueStations: 73,
                },
                research: {
                  routeName: '2026 Competition',
                  capturedAt: '2026-08-10T00:00:00.000Z',
                  researchedAt: '2026-08-10T01:00:00.000Z',
                  bookingResearchedAt: '2026-08-09T19:30:00.000Z',
                  sources: {},
                },
                stats: {
                  researchedDays: 73,
                  totalRecommendations: 361,
                  pricedOptions: 300,
                  withPhotos: 300,
                  nearbyCharging: 232,
                  higherEnd: 81,
                  uniqueStays: 124,
                },
                days: [
                  {
                    day: 1,
                    date: '2026-09-27',
                    checkOut: '2026-09-28',
                    station: {
                      sourceId: '9531',
                      name: 'Cleveland, TN',
                      address: {
                        street: '4570 Frontage Rd NW',
                        city: 'Cleveland',
                        state: 'TN',
                        zip: '37312',
                        country: 'USA',
                      },
                      position: { lat: 35.217, lon: -84.867 },
                    },
                    nextStation: {
                      name: 'Bowling Green, KY',
                      city: 'Bowling Green',
                      state: 'KY',
                      position: { lat: 36.9, lon: -86.4 },
                    },
                    researchStatus: 'current',
                    recommendations: [
                      {
                        sourceKey: 'hyatt-cleveland',
                        name: 'Hyatt Regency Cleveland',
                        tier: 'upscale',
                        tierLabel: 'Higher end',
                        isUnique: false,
                        position: { lat: 35.21, lon: -84.87 },
                        address: '100 Main St Cleveland TN',
                        distanceFromSuperchargerMiles: 0.8,
                        routeDetourMiles: 0.4,
                        evCharging: {
                          status: 'nearby',
                          distanceMiles: 0.05,
                          label: 'ChargePoint',
                        },
                        bookingUrl:
                          'https://www.booking.com/searchresults.html?checkin=2026-09-27&checkout=2026-09-28',
                        mapsUrl: 'https://www.google.com/maps/search/?api=1',
                        photoUrl: 'https://cf.bstatic.com/hyatt.webp',
                        photoSource: 'Booking.com',
                        rateSnapshot: {
                          provider: 'Booking.com',
                          availability: 'available',
                          nightlyUsd: 114,
                          observedAt: '2026-08-09T19:30:00.000Z',
                        },
                      },
                      {
                        sourceKey: 'historic-cleveland',
                        name: 'Historic Cleveland Inn',
                        tier: 'unique',
                        tierLabel: 'Unique stay',
                        isUnique: true,
                        position: { lat: 35.2, lon: -84.88 },
                        address: '200 Main St Cleveland TN',
                        distanceFromSuperchargerMiles: 1.2,
                        routeDetourMiles: 0.9,
                        evCharging: { status: 'unverified' },
                        bookingUrl:
                          'https://www.booking.com/searchresults.html?checkin=2026-09-27&checkout=2026-09-28',
                        mapsUrl: 'https://www.google.com/maps/search/?api=1',
                        rateSnapshot: {
                          provider: 'Booking.com',
                          availability: 'not_found',
                          nightlyUsd: null,
                          observedAt: '2026-08-09T19:30:00.000Z',
                        },
                      },
                    ],
                  },
                ],
              },
      })),
    )

    render(
      <MemoryRouter>
        <AdminHotelsPage />
      </MemoryRouter>,
    )

    expect(
      await screen.findByRole('heading', { name: 'Hotels for every night' }),
    ).toBeTruthy()
    expect(await screen.findByText('Hyatt Regency Cleveland')).toBeTruthy()
    expect(screen.getByText('Historic Cleveland Inn')).toBeTruthy()
    expect(screen.getByText('73/73')).toBeTruthy()
    expect(screen.getByText('$114')).toBeTruthy()
    expect(screen.getByText('No dated rate')).toBeTruthy()
    expect(screen.queryByText('$230–$430')).toBeNull()
    expect(
      screen.getByRole('img', { name: 'Hyatt Regency Cleveland property' }).getAttribute('src'),
    ).toBe(
      'https://cf.bstatic.com/hyatt.webp',
    )
    expect(
      screen
        .getByRole('link', { name: /check current rate/i })
        .getAttribute('href'),
    ).toContain('checkin=2026-09-27')

    await userEvent.click(screen.getByRole('button', { name: /ev nearby/i }))
    expect(screen.getByText('Hyatt Regency Cleveland')).toBeTruthy()
    expect(screen.queryByText('Historic Cleveland Inn')).toBeNull()
  })
})
