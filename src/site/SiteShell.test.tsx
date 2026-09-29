import { cleanup, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ThemeProvider } from '../theme/theme'
import { AuthProvider } from './AuthContext'
import { SiteShell } from './SiteShell'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

function renderShell(user: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: true, json: async () => ({ user }) }),
  )
  render(
    <ThemeProvider>
      <MemoryRouter initialEntries={['/']}>
        <AuthProvider>
          <Routes>
            <Route element={<SiteShell />}>
              <Route index element={<div>Tracker page</div>} />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </ThemeProvider>,
  )
}

describe('public site navigation', () => {
  it('gives visitors the tracker pages and nothing to sign up for', async () => {
    renderShell(null)

    expect(await screen.findByText('Tracker page')).toBeTruthy()
    const nav = screen.getByRole('navigation', { name: 'Main navigation' })
    expect(within(nav).getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual([
      '/',
      '/route',
      '/journal',
      '/about',
    ])
    expect(screen.queryByRole('link', { name: /sign up|start building|build a route|sign in/i })).toBeNull()
    expect(screen.queryByRole('link', { name: 'CORE' })).toBeNull()
    expect(screen.getByText(/ChargeQuest is a project of Antelligence LLC/)).toBeTruthy()
  })

  it('shows CORE and admin only to Anthony', async () => {
    renderShell({ id: 'admin-1', username: 'anthony', role: 'admin', mustChangePassword: false })

    expect((await screen.findByRole('link', { name: 'CORE' })).getAttribute('href')).toBe('/planner')
    expect(screen.getByRole('link', { name: 'Admin' }).getAttribute('href')).toBe('/admin')
  })
})
