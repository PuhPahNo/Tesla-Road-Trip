import { cleanup, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { SEO_PAGES } from '../seo/seoPages'
import { SeoPage } from './SeoPage'

afterEach(() => {
  cleanup()
  document.querySelector('script[data-page-schema]')?.remove()
})

describe('editorial page architecture', () => {
  it('renders the same truthful hub hierarchy used by structured data', () => {
    const page = SEO_PAGES.find((candidate) => candidate.path === '/badges/grand-canyon')!
    render(
      <MemoryRouter initialEntries={[page.path]}>
        <SeoPage page={page} />
      </MemoryRouter>,
    )

    const breadcrumb = screen.getByRole('navigation', { name: 'Breadcrumb' })
    expect(within(breadcrumb).getByRole('link', { name: 'ChargeQuest' }).getAttribute('href')).toBe('/')
    expect(
      within(breadcrumb).getByRole('link', { name: 'Tesla Iconic Charger Badges and Road Trip Planning' }).getAttribute('href'),
    ).toBe('/tesla-iconic-charger-badges')
    expect(within(breadcrumb).getByText('Grand Canyon Tesla Iconic Charger Badge Guide').getAttribute('aria-current')).toBe('page')
    expect(within(breadcrumb).queryByText('Badges')).toBeNull()
    expect(screen.getByRole('img', {
      name: 'The Golden Gate Bridge on a Tesla Iconic Charger road trip',
    })).toBeTruthy()
  })

  it('adds useful public planning bridges without duplicating curated related links', () => {
    const page = SEO_PAGES.find((candidate) => candidate.path === '/2026-tesla-supercharging-competition')!
    render(
      <MemoryRouter initialEntries={[page.path]}>
        <SeoPage page={page} />
      </MemoryRouter>,
    )

    const section = screen.getByRole('heading', { name: 'Connect the planning' }).closest('section')!
    expect(within(section).getByRole('link', { name: 'Anthony’s 73-day competition route and field notes' }).getAttribute('href')).toBe('/track-anthony')
    expect(within(section).getByRole('link', { name: 'Tesla Iconic Charger badge guides' }).getAttribute('href')).toBe('/tesla-iconic-charger-badges')
    expect(within(section).getByRole('link', { name: 'Send Anthony a route idea' }).getAttribute('href')).toBe('/community')
    expect(within(section).queryByRole('link', { name: 'Tesla Supercharger road-trip routes' })).toBeNull()
  })

  it('presents independent coverage as further reading, not official verification', () => {
    const page = SEO_PAGES.find((candidate) => candidate.path === '/2026-tesla-supercharging-competition')!
    render(
      <MemoryRouter initialEntries={[page.path]}>
        <SeoPage page={page} />
      </MemoryRouter>,
    )

    const section = screen.getByRole('heading', { name: 'Further reading' }).closest('section')!
    expect(within(section).getByText('Good reporting and different perspectives on the 2026 competition.')).toBeTruthy()
    expect(within(section).getAllByRole('link')).toHaveLength(4)
    expect(within(section).getByRole('link', { name: /InsideEVs/i }).getAttribute('href'))
      .toBe('https://insideevs.com/news/799674/tesla-free-supercharging-competition-2026/')
  })
})
