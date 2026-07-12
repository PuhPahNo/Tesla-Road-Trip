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

describe('ChargeQuest landing page', () => {
  it('invites visitors into the first quest, previews the real planner flow, and uses live community data', async () => {
    const community = {
      trip: {
        active: false,
        title: "Anthony's ChargeQuest",
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

    expect(screen.getByRole('heading', { name: 'I’m building a route. Think you can build a better one?' })).toBeTruthy()
    expect(screen.getByText('One shared challenge. Countless possible journeys.')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Build Your Route' }).getAttribute('href')).toBe('/signup?returnTo=%2Fplanner')
    expect(screen.queryByRole('link', { name: 'Follow the quest' })).toBeNull()
    expect(screen.getByText('Map the stops that matter')).toBeTruthy()
    expect(screen.getByText('Save multiple route ideas')).toBeTruthy()
    expect(screen.getByText('Shape the quest together')).toBeTruthy()
    expect(screen.getByText('Tesla Iconic Charger badge locations mapped')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'The challenge started the journey. The road became the reward.' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'The road is the reward.' })).toBeTruthy()
    expect(screen.getByText('Create a custom route')).toBeTruthy()
    expect(screen.getByText('Step 2 of 3')).toBeTruthy()
    expect(await screen.findByText('5')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Meet CORE.' })).toBeTruthy()
    expect(screen.getByText('Charging Optimization & Route Engine')).toBeTruthy()
    expect(screen.getByText('Tell CORE what matters')).toBeTruthy()
    expect(screen.getByText('CORE connects the journey')).toBeTruthy()
    expect(document.title).toBe('ChargeQuest CORE | Tesla Supercharger Route Planner for 2026')
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
            <Route path="signup" element={<div>Create your ChargeQuest account</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(await screen.findByText('Create your ChargeQuest account')).toBeTruthy()
    expect(screen.queryByText('Private planner')).toBeNull()
  })
})
