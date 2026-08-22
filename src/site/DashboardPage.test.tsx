import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from './AuthContext'
import { DashboardPage } from './DashboardPage'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('signed-in dashboard', () => {
  it('makes saved routes primary and connects members to Anthony and recent field guides', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (input: string) => ({
      ok: true,
      json: async () => input === '/api/auth/session'
        ? {
            user: {
              id: 'member-1',
              username: 'roadtripper',
              role: 'member',
              mustChangePassword: false,
              createdAt: '2026-08-01T12:00:00.000Z',
            },
          }
        : {
            user: {
              id: 'member-1',
              username: 'roadtripper',
              role: 'member',
              mustChangePassword: false,
              createdAt: '2026-08-01T12:00:00.000Z',
            },
            routes: [{
              id: 'national-parks-loop',
              name: 'National Parks Loop',
              color: '#e82127',
              waypoints: [
                { id: 'start', label: 'Chattanooga', position: { lat: 35, lon: -85 }, radiusMiles: 20 },
                { id: 'glacier', label: 'Glacier National Park', position: { lat: 48.7, lon: -113.7 }, radiusMiles: 20 },
              ],
              startDate: '2026-09-27',
              targetDays: 73,
              createdAt: '2026-07-01T12:00:00.000Z',
              updatedAt: '2026-08-10T12:00:00.000Z',
            }],
            routeCount: 1,
            achievements: [],
            suggestions: [{ id: 'idea-1' }],
            meetups: [],
            stateVotes: [],
          },
    })))

    render(
      <MemoryRouter>
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', { name: 'Welcome back, roadtripper.' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'National Parks Loop' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Continue National Parks Loop' }).getAttribute('href')).toBe(
      '/planner?route=national-parks-loop',
    )
    expect(screen.getByRole('link', { name: 'Open in CORE' }).getAttribute('href')).toBe(
      '/planner?route=national-parks-loop',
    )
    expect(screen.getByText('Chattanooga → Glacier National Park')).toBeTruthy()
    expect(screen.getByRole('heading', {
      name: 'The route is 73 days long. I’m still not calling it finished.',
    })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Challenge the route' }).getAttribute('href')).toBe('/community')
    expect(screen.getAllByRole('link', { name: /^Read (?!the field note)/ })).toHaveLength(3)
    expect(screen.getByRole('link', { name: 'Account settings' }).getAttribute('href')).toBe('/account')
    expect(screen.getByText('route suggestions for Anthony')).toBeTruthy()
    expect(screen.getAllByRole('img', { name: 'Tesla Superchargers illuminated at night' })).toHaveLength(1)
    expect(screen.getByRole('img', { name: 'A car traveling a dark highway at night' })).toBeTruthy()
    expect(screen.getByRole('img', { name: 'A vintage Route 66 motel sign shining at night' })).toBeTruthy()
    expect(screen.getByRole('img', { name: 'The Grand Canyon stretching into the distance from the South Rim' })).toBeTruthy()
    expect(screen.queryByRole('heading', { name: 'Change password' })).toBeNull()
  })

  it('gives a new member one clear first-route action', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (input: string) => ({
      ok: true,
      json: async () => input === '/api/auth/session'
        ? {
            user: {
              id: 'member-2',
              username: 'newdriver',
              role: 'member',
              mustChangePassword: false,
              createdAt: '2026-08-10T12:00:00.000Z',
            },
          }
        : {
            routes: [],
            routeCount: 0,
            achievements: [],
            suggestions: [],
            meetups: [],
            stateVotes: [],
          },
    })))

    render(
      <MemoryRouter>
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', { name: 'Your first route starts in CORE.' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Build your first route' }).getAttribute('href')).toBe('/planner')
  })

  it('does not report zero routes when account data fails to load', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (input: string) => {
      if (input === '/api/auth/session') {
        return {
          ok: true,
          json: async () => ({
            user: {
              id: 'member-3',
              username: 'temporarilyoffline',
              role: 'member',
              mustChangePassword: false,
              createdAt: '2026-08-10T12:00:00.000Z',
            },
          }),
        }
      }

      return {
        ok: false,
        json: async () => ({ error: 'Dashboard data is temporarily unavailable.' }),
      }
    }))

    render(
      <MemoryRouter>
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', {
      name: 'Your routes could not load right now.',
    })).toBeTruthy()
    expect(screen.queryByRole('heading', { name: 'Your first route starts in CORE.' })).toBeNull()
    expect(screen.queryByText('0 route suggestions for Anthony')).toBeNull()
  })
})
