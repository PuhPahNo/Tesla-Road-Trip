import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LandingPage } from './LandingPage'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('Charge Quest landing page', () => {
  it('challenges competitors, previews the real planner flow, and uses live community data', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
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
        }),
      }),
    )

    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('Built for the 2026 Tesla Supercharging Competition')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Think you can build a better quest than mine?' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Build your competition route' }).getAttribute('href')).toBe('/planner')
    expect(screen.getByRole('link', { name: 'Follow my quest' }).getAttribute('href')).toBe('/track-anthony')
    expect(screen.getByText('Create a custom route')).toBeTruthy()
    expect(screen.getByText('Step 2 of 3')).toBeTruthy()
    expect(await screen.findByText('5')).toBeTruthy()
    expect(screen.getByText('Planning the 2026 run')).toBeTruthy()
  })
})
