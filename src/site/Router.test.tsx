import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from './AuthContext'
import { HomeRoute } from './Router'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('ChargeQuest home route', () => {
  it('redirects signed-in members from the landing page to the planner', async () => {
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
            <Route path="planner" element={<div>Private planner</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(await screen.findByText('Private planner')).toBeTruthy()
    expect(screen.queryByRole('heading', { name: 'I’m building a route. Want to beat it?' })).toBeNull()
  })
})
