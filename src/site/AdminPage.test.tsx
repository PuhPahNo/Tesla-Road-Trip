import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AdminPage } from './AdminPage'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('Anthony admin workspace', () => {
  it('groups tracker controls, field publishing, and meetup moderation clearly', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          community: {
            trip: {
              active: false,
              title: "Anthony's Charge Quest",
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
        }),
      }),
    )

    render(<AdminPage />)

    expect(screen.getByRole('heading', { name: 'Run the public quest from one place' })).toBeTruthy()
    expect(await screen.findByRole('heading', { name: 'Public trip profile' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Publish what’s happening now' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Pending coffee invites' })).toBeTruthy()
    expect(screen.getByText('Denver, CO')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Approve' })).toBeTruthy()
    expect(screen.getByLabelText('Tracker active')).toBeTruthy()
  })
})
