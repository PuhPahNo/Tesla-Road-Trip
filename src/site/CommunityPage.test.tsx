import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from './AuthContext'
import { CommunityPage } from './CommunityPage'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('Charge Quest community page', () => {
  it('uses the cinematic community funnel and asks guests to create an account', async () => {
    const community = {
      trip: { active: false, title: "Anthony's Charge Quest", updatedAt: '2026-07-11T00:00:00.000Z' },
      updates: [],
      stateVotes: [{ state_code: 'CO', votes: 4 }],
      meetups: [],
      suggestions: [
        {
          id: 'suggestion-1',
          category: 'scenery',
          title: 'Take the Million Dollar Highway',
          body: 'The San Juan mountain views are worth the extra time.',
          state_code: 'CO',
          display_name: 'mountainlocal',
          votes: 3,
          viewer_voted: 0,
          created_at: '2026-07-11T00:00:00.000Z',
        },
      ],
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
          <CommunityPage />
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Make Anthony’s route harder to beat' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Create an account and join in' }).getAttribute('href')).toBe('/signup?returnTo=%2Fcommunity')
    expect((await screen.findAllByText('Colorado')).length).toBeGreaterThan(0)
    expect(screen.getByText('Take the Million Dollar Highway')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Routes worth talking about' })).toBeTruthy()
    expect(document.title).toBe('Charge Quest Community | Tesla Route Ideas and 2026 Trip Updates')
  })
})
