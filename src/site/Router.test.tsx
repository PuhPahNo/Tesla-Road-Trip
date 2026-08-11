import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from './AuthContext'
import { HomeRoute, RouteLoadingFallback } from './Router'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('ChargeQuest home route', () => {
  it('announces route-level lazy loading without collapsing the page', () => {
    render(<RouteLoadingFallback label="Loading the public route…" />)

    const status = screen.getByRole('status')
    expect(status.textContent).toBe('Loading the public route…')
    expect(status.getAttribute('aria-live')).toBe('polite')
    expect(status.className).toContain('min-h-[calc(100svh-117px)]')
  })

  it('redirects signed-in members from the landing page to their dashboard', async () => {
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
      <MemoryRouter initialEntries={['/']}>
        <AuthProvider>
          <Routes>
            <Route index element={<HomeRoute />} />
            <Route path="dashboard" element={<div>Signed-in dashboard</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(await screen.findByText('Signed-in dashboard')).toBeTruthy()
    expect(screen.queryByRole('heading', { name: 'I’m building a route. Want to beat it?' })).toBeNull()
  })
})
