import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
      <AuthProvider>
        <AdminPage />
      </AuthProvider>,
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
  })
})
