import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from './AuthContext'
import { AccountPage } from './AccountPage'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('account settings', () => {
  it('keeps identity and password security separate from the signed-in dashboard', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        user: {
          id: 'member-1',
          username: 'roadtripper',
          role: 'member',
          mustChangePassword: false,
          createdAt: '2026-08-01T12:00:00.000Z',
        },
      }),
    }))

    render(
      <MemoryRouter>
        <AuthProvider>
          <AccountPage />
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', { name: 'Account settings' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: '@roadtripper' })).toBeTruthy()
    expect(screen.getByText('August 1, 2026')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Change password' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Back to dashboard' }).getAttribute('href')).toBe('/dashboard')
    expect(screen.getByRole('link', { name: 'Open CORE' }).getAttribute('href')).toBe('/planner')
    expect(screen.queryByText('Ideas and invitations')).toBeNull()
    expect(screen.queryByText('Saved routes')).toBeNull()
  })
})
