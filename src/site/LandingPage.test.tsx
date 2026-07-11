import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LandingPage } from './LandingPage'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('Charge Quest landing page', () => {
  it('leads with Anthony and turns live community data into a quest board', async () => {
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

    expect(screen.getByText('Anthony’s 2026 Quest HQ')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'I’m building my Tesla quest in public.' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Build your quest' }).getAttribute('href')).toBe('/planner')
    expect(screen.getByRole('link', { name: 'Challenge my route' }).getAttribute('href')).toBe('/community')
    expect(await screen.findByText('The Long Way Home')).toBeTruthy()
    expect(screen.getByText('64 days')).toBeTruthy()
    expect(screen.getByText('5')).toBeTruthy()
    expect(screen.getByText('Still building in public')).toBeTruthy()
  })
})
