import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from './AuthContext'
import { SiteShell } from './SiteShell'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('public site navigation', () => {
  it('uses the competition header and funnels guests to signup for planner access', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }),
    )

    render(
      <MemoryRouter initialEntries={['/']}>
        <AuthProvider>
          <Routes>
            <Route element={<SiteShell />}>
              <Route index element={<div>Public homepage</div>} />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(screen.getByText('2026 competition')).toBeTruthy()
    expect(screen.getByText('ChargeQuest')).toBeTruthy()
    expect(await screen.findByRole('link', { name: 'Join the challenge' })).toBeTruthy()
    const plannerLinks = screen.getAllByRole('link', { name: 'Get the planner' })
    expect(plannerLinks[0].getAttribute('href')).toBe('/signup?returnTo=%2Fplanner')
    expect(screen.getByText('Public homepage')).toBeTruthy()
  })
})
