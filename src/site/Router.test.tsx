import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { RouteLoadingFallback } from './Router'
import { legacyRedirectTarget } from './sitePages'

afterEach(() => {
  cleanup()
})

describe('ChargeQuest router', () => {
  it('announces route-level lazy loading', () => {
    render(<RouteLoadingFallback label="Loading the route…" />)

    const status = screen.getByRole('status')
    expect(status.textContent).toBe('Loading the route…')
    expect(status.getAttribute('aria-live')).toBe('polite')
  })

  it('sends retired SEO and member URLs to the closest tracker page', () => {
    expect(legacyRedirectTarget('/track-anthony')).toBe('/')
    expect(legacyRedirectTarget('/about-anthony')).toBe('/about')
    expect(legacyRedirectTarget('/competition/longest-trip-strategy')).toBe('/')
    expect(legacyRedirectTarget('/routes/tesla-route-66-supercharger-road-trip')).toBe('/route')
    expect(legacyRedirectTarget('/badges/yosemite')).toBe('/')
    expect(legacyRedirectTarget('/signup')).toBe('/')
    expect(legacyRedirectTarget('/dashboard')).toBe('/admin')
    expect(legacyRedirectTarget('/community/')).toBe('/')
  })

  it('leaves live pages alone', () => {
    for (const path of ['/', '/route', '/journal', '/journal/abc', '/about', '/admin', '/planner', '/login']) {
      expect(legacyRedirectTarget(path)).toBeUndefined()
    }
  })
})
