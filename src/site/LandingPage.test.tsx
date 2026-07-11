import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ProtectedRoute } from './AccountPage'
import { AuthProvider } from './AuthContext'
import { LandingPage } from './LandingPage'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('Charge Quest landing page', () => {
  it('challenges competitors, previews the real planner flow, and uses live community data', async () => {
    const community = {
      trip: {
        active: false,
        title: "Anthony's Charge Quest",
        routeName: 'The Long Way Home',
        totalDays: 64,
        updatedAt: '2026-07-11T00:00:00.000Z',
      },
      updates: [],
      stateVotes: [
        { state_code: 'CO', votes: 3 },
        { state_code: 'UT', votes: 2 },
      ],
      meetups: [],
      suggestions: [{ id: 'one' }],
      achievements: [],
    }
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async (input: string) => ({
        ok: true,
        json: async () => input === '/api/auth/session' ? {} : community,
      })),
    )

    render(
      <MemoryRouter>
        <AuthProvider>
          <LandingPage />
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Build a Tesla route that can beat mine' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Sign up and build your route' }).getAttribute('href')).toBe('/signup?returnTo=%2Fplanner')
    expect(screen.getByRole('link', { name: 'Follow mine' }).getAttribute('href')).toBe('/track-anthony')
    expect(screen.getByText('Create a custom route')).toBeTruthy()
    expect(screen.getByText('Step 2 of 3')).toBeTruthy()
    expect(await screen.findByText('5')).toBeTruthy()
    expect(document.title).toBe('Charge Quest | Tesla Supercharger Route Planner for 2026')
  })

  it('sends signed-out direct planner visits into the signup funnel', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }),
    )

    render(
      <MemoryRouter initialEntries={['/planner']}>
        <AuthProvider>
          <Routes>
            <Route
              path="planner"
              element={
                <ProtectedRoute unauthenticatedTo="signup">
                  <div>Private planner</div>
                </ProtectedRoute>
              }
            />
            <Route path="signup" element={<div>Create your Charge Quest account</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(await screen.findByText('Create your Charge Quest account')).toBeTruthy()
    expect(screen.queryByText('Private planner')).toBeNull()
  })
})
