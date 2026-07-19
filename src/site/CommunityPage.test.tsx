import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from './AuthContext'
import { CommunityPage } from './CommunityPage'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('ChargeQuest community page', () => {
  it('asks guests for private route ideas without pretending a public feed exists', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }),
    )

    render(
      <MemoryRouter>
        <AuthProvider>
          <CommunityPage />
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Tell me what the map is missing' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Create an account and send an idea' }).getAttribute('href')).toBe('/signup?returnTo=%2Fcommunity')
    expect(screen.getByRole('heading', { name: 'Three ways you can genuinely change the trip' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Make the case' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Email me' }).getAttribute('href')).toBe('mailto:anthony@antelligentprojects.dev')
    expect(screen.queryByText('Take the Million Dollar Highway')).toBeNull()
    expect(screen.getByText(/Suggestions go to a private admin inbox/)).toBeTruthy()
    expect(document.title).toBe('Send Anthony a Route Idea | ChargeQuest Community')
  })
})
