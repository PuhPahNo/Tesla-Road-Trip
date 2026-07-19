import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from './AuthContext'
import { TrackAnthonyPage } from './TrackAnthonyPage'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('Track Anthony', () => {
  it('shows the pre-trip build as a chronological public story without claiming the trip is live', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (input: string) => ({
      ok: true,
      json: async () => input === '/api/auth/session' ? {} : {
        trip: {
          active: false,
          title: "Anthony's ChargeQuest",
          routeName: 'Three routes remain',
          departureDate: '2026-09-01',
          updatedAt: '2026-07-19T12:00:00.000Z',
        },
        updates: [{
          id: 'update-1',
          phase: 'route-decision',
          location: 'Pre-trip',
          title: 'Route 66 made the final three',
          body: 'I kept it because the road has a story beyond the charger count.',
          artifact_url: 'https://example.com/route-map',
          artifact_label: 'Open the route comparison',
          artifact_type: 'link',
          created_at: '2026-07-19T12:00:00.000Z',
          updated_at: '2026-07-19T12:00:00.000Z',
        }],
        stateVotes: [],
        meetups: [],
        suggestions: [],
        achievements: [],
      },
    })))

    render(<MemoryRouter><AuthProvider><TrackAnthonyPage /></AuthProvider></MemoryRouter>)

    expect(await screen.findByRole('heading', { name: 'I’m building the route in public' })).toBeTruthy()
    expect(screen.getByText('Route 66 made the final three')).toBeTruthy()
    expect(screen.getByRole('link', { name: /Open the route comparison/ }).getAttribute('href')).toBe('https://example.com/route-map')
    expect(screen.getByText('September 1, 2026')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Send invite to Anthony' })).toBeNull()
  })
})
