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

    expect(await screen.findByRole('link', { name: 'ChargeQuest' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'ChargeQuest' }).getAttribute('href')).toBe('/')
    expect(screen.getByRole('link', { name: 'Start planning' })).toBeTruthy()
    const plannerLinks = screen.getAllByRole('link', { name: 'Get the planner' })
    expect(plannerLinks[0].getAttribute('href')).toBe('/signup?returnTo=%2Fplanner')
    expect(screen.getByText('Public homepage')).toBeTruthy()
  })

  it('removes Home and sends the brand to the planner for signed-in members', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          user: {
            id: 'member-1',
            username: 'roadtripper',
            role: 'member',
            mustChangePassword: false,
          },
        }),
      }),
    )

    render(
      <MemoryRouter initialEntries={['/community']}>
        <AuthProvider>
          <Routes>
            <Route element={<SiteShell />}>
              <Route path="community" element={<div>Community workspace</div>} />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(await screen.findByRole('link', { name: 'roadtripper' })).toBeTruthy()
    expect(screen.queryByRole('link', { name: 'Home' })).toBeNull()
    expect(screen.getByRole('link', { name: 'ChargeQuest' }).getAttribute('href')).toBe('/planner')
    expect(screen.getAllByRole('link', { name: 'Plan a trip' })).toHaveLength(2)
    expect(screen.getByRole('navigation', { name: 'Mobile navigation' }).className).toContain('grid-cols-3')
  })
})
