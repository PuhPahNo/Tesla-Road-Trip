import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from './AuthContext'
import { AdminPage } from './AdminPage'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('Anthony admin workspace', () => {
  it('groups tracker controls, field publishing, and meetup moderation clearly', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async (input: string) => ({
        ok: true,
        json: async () => input === '/api/admin/accounts'
          ? {
              viewerId: 'admin-1',
              accounts: [
                {
                  id: 'admin-1',
                  username: 'anthony',
                  role: 'admin',
                  mustChangePassword: false,
                  createdAt: '2026-07-11T00:00:00.000Z',
                  updatedAt: '2026-07-11T00:00:00.000Z',
                  lastLoginAt: '2026-07-11T01:00:00.000Z',
                  activeSessions: 1,
                  routeCount: 2,
                  suggestionCount: 0,
                  meetupCount: 0,
                  stateVoteCount: 0,
                  achievementCount: 0,
                },
                {
                  id: 'member-1',
                  username: 'roadtripper',
                  role: 'member',
                  mustChangePassword: true,
                  createdAt: '2026-07-11T00:00:00.000Z',
                  updatedAt: '2026-07-11T00:00:00.000Z',
                  lastLoginAt: null,
                  activeSessions: 0,
                  routeCount: 1,
                  suggestionCount: 1,
                  meetupCount: 0,
                  stateVoteCount: 2,
                  achievementCount: 1,
                },
              ],
              activity: [
                {
                  id: 'activity-1',
                  actorUserId: 'admin-1',
                  actorUsername: 'anthony',
                  targetUserId: 'member-1',
                  targetUsername: 'roadtripper',
                  action: 'admin.account_created',
                  details: { role: 'member' },
                  createdAt: '2026-07-11T00:00:00.000Z',
                },
              ],
            }
          : input === '/api/admin/accounts/member-1'
            ? {
                account: {
                  id: 'member-1',
                  username: 'roadtripper',
                  role: 'member',
                  mustChangePassword: true,
                  createdAt: '2026-07-11T00:00:00.000Z',
                  updatedAt: '2026-07-11T00:00:00.000Z',
                  lastLoginAt: null,
                  activeSessions: 0,
                  routeCount: 1,
                  suggestionCount: 1,
                  meetupCount: 0,
                  stateVoteCount: 2,
                  achievementCount: 1,
                },
                routes: [{
                  id: 'route-1',
                  name: 'Western Parks Loop',
                  color: '#e82127',
                  waypoints: [{ id: 'wp-1', label: 'Grand Canyon', radiusMiles: 40 }],
                  keepOrder: false,
                  createdAt: '2026-07-11T00:00:00.000Z',
                  updatedAt: '2026-07-11T00:00:00.000Z',
                }],
                preferences: null,
                suggestions: [],
                meetups: [],
                stateVotes: [],
                achievements: [],
                activity: [],
              }
          : input === '/api/admin/trip-route/saved-2026-competition'
            ? {
                selectedRouteId: 'saved-2026-competition',
                route: {
                  savedRoute: {
                    id: 'saved-2026-competition',
                    name: '2026 Competition',
                    color: '#e82127',
                    startDate: '2026-08-03',
                    targetDays: 70,
                    waypointCount: 29,
                    updatedAt: '2026-07-26T00:00:00.000Z',
                  },
                  route: {
                    id: 'saved-2026-competition',
                    plannerMode: 'longest_trip',
                    tripStartDate: '2026-08-03',
                    name: '2026 Competition',
                    strategy: 'Saved route',
                    color: '#e82127',
                    uniqueStations: 410,
                    totalMiles: 10328,
                    totalDriveHours: 191,
                    totalStopHours: 80,
                    totalDays: 70,
                    averageMilesPerDay: 148,
                    averageDriveHoursPerDay: 2.73,
                    averageStopHoursPerDay: 1.1,
                    averageDistanceBetweenSuperchargers: 25,
                    stationsPerDay: 5.8,
                    days: [{
                      day: 1,
                      miles: 185,
                      driveHours: 3.2,
                      stopMinutes: 50,
                      uniqueStations: 5,
                      averageDistanceBetweenSuperchargers: 37,
                      visits: [{
                        sequence: 1,
                        day: 1,
                        station: {
                          id: 'station-1',
                          sourceId: 'station-1',
                          source: 'supercharge.info',
                          name: 'Knoxville Supercharger',
                          status: 'OPEN',
                          position: { lat: 35.96, lon: -83.92 },
                          address: { city: 'Knoxville', state: 'TN', country: 'USA' },
                          stallCount: 12,
                          powerKw: 250,
                          counted: true,
                          otherEvs: false,
                        },
                        legMiles: 185,
                        driveHours: 3.2,
                        stopMinutes: 20,
                        rangeWarning: false,
                      }],
                      warnings: [],
                      advisories: [],
                      longDayOptimized: false,
                      rating: {
                        score: 80,
                        sceneryScore: 70,
                        cityScore: 80,
                        landmarkScore: 70,
                        places: [],
                        summary: 'Opening day',
                      },
                    }],
                    visits: [],
                    warnings: [],
                    advisories: [],
                    longDays: 0,
                    routeLine: [],
                    rating: {
                      score: 80,
                      sceneryScore: 70,
                      cityScore: 80,
                      landmarkScore: 70,
                      places: [],
                      summary: 'Competition route',
                    },
                  },
                  road: {
                    provider: 'ORS',
                    line: [
                      { lat: 35.1, lon: -85.3 },
                      { lat: 35.96, lon: -83.92 },
                    ],
                    degraded: false,
                    warnings: [],
                    requestCount: 1,
                  },
                },
              }
          : {
              community: {
                trip: {
                  active: false,
                  title: "Anthony's ChargeQuest",
                  totalDays: 60,
                  updatedAt: '2026-07-11T00:00:00.000Z',
                },
                updates: [],
                stateVotes: [],
                suggestions: [],
                meetups: [],
                achievements: [],
              },
              savedRoutes: [{
                id: 'saved-2026-competition',
                name: '2026 Competition',
                color: '#e82127',
                waypoints: [{
                  id: 'grand-canyon',
                  label: 'Grand Canyon',
                  position: { lat: 36.1, lon: -112.1 },
                  radiusMiles: 40,
                }],
                targetDays: 70,
                startDate: '2026-08-03',
                createdAt: '2026-07-26T00:00:00.000Z',
                updatedAt: '2026-07-26T00:00:00.000Z',
              }],
              pendingMeetups: [
                {
                  id: 'meetup-1',
                  state_code: 'CO',
                  city: 'Denver',
                  proposed_day: 47,
                  message: 'Coffee near the Supercharger when you come through town.',
                  display_name: 'coloradolocal',
                  created_at: '2026-07-11T00:00:00.000Z',
                },
              ],
              suggestionInbox: [
                {
                  id: 'suggestion-1',
                  category: 'route',
                  title: 'Compare the northern route',
                  body: 'The northern option may create a better summer drive.',
                  state_code: 'MT',
                  review_status: 'pending',
                  display_name: 'roadtripper',
                  created_at: '2026-07-11T00:00:00.000Z',
                  updated_at: '2026-07-11T00:00:00.000Z',
                },
              ],
            },
      })),
    )

    render(
      <MemoryRouter>
        <AuthProvider>
          <AdminPage />
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'ChargeQuest admin' })).toBeTruthy()
    expect(await screen.findByRole('heading', { name: 'Users' })).toBeTruthy()
    expect(screen.getByRole('columnheader', { name: 'User' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Add user' })).toBeTruthy()
    expect(screen.getAllByRole('button', { name: 'Open anthony' }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('button', { name: 'Open roadtripper' }).length).toBeGreaterThan(0)
    expect(screen.getByRole('heading', { name: 'Recent account activity' })).toBeTruthy()
    await userEvent.click(screen.getAllByRole('button', { name: 'Open roadtripper' })[0])
    expect(await screen.findByRole('heading', { name: '@roadtripper' })).toBeTruthy()
    expect(screen.getByLabelText('Username for roadtripper')).toBeTruthy()
    expect(await screen.findByText('Western Parks Loop')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Security' })).toBeTruthy()
    expect(await screen.findByRole('heading', { name: 'Public trip profile' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Publish progress' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Manage the Track Anthony timeline' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Route ideas sent to you' })).toBeTruthy()
    expect(screen.getByText('Compare the northern route')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Pending coffee invites' })).toBeTruthy()
    expect(screen.getByText('Denver, CO')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Approve' })).toBeTruthy()
    expect(screen.getByLabelText('Tracker active')).toBeTruthy()
    await userEvent.selectOptions(
      screen.getByLabelText('Route shown on Track Anthony'),
      'saved-2026-competition',
    )
    expect(await screen.findByText('Ready to publish')).toBeTruthy()
    expect(screen.getByText('Road mapped via ORS')).toBeTruthy()
    expect(screen.getByText('2026 Competition')).toBeTruthy()
    expect(screen.getByLabelText('Trip day for journal entry')).toBeTruthy()
  })
})
