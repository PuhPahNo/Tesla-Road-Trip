import { describe, expect, it } from 'vitest'
import { TESLA_ICONIC_BADGES } from '../domain/teslaBadges'
import { SEO_PAGES, getRelatedSeoPages, seoPageStructuredData } from './seoPages'

describe('public SEO content registry', () => {
  it('contains a focused set of unique, substantial pages', () => {
    expect(SEO_PAGES).toHaveLength(14)
    expect(new Set(SEO_PAGES.map((page) => page.path)).size).toBe(SEO_PAGES.length)
    expect(new Set(SEO_PAGES.map((page) => page.title)).size).toBe(SEO_PAGES.length)

    for (const page of SEO_PAGES) {
      const copy = [
        page.headline,
        page.intro,
        ...page.sections.flatMap((section) => [
          section.heading,
          ...section.paragraphs,
          ...(section.bullets ?? []),
          ...(section.table?.columns ?? []),
          ...(section.table?.rows.flatMap((row) => row.map((cell) =>
            typeof cell === 'string' ? cell : cell.text,
          )) ?? []),
        ]),
        page.note ?? '',
      ].join(' ')
      const words = copy.trim().split(/\s+/)
      expect(words.length, `${page.path} should not be thin content`).toBeGreaterThanOrEqual(250)
      expect(page.description.length, `${page.path} description`).toBeGreaterThanOrEqual(110)
      expect(page.description.length, `${page.path} description`).toBeLessThanOrEqual(170)
      expect(getRelatedSeoPages(page).length, `${page.path} internal links`).toBeGreaterThanOrEqual(3)
    }
  })

  it('avoids generic AI marketing phrases and gives sourced topics official links', () => {
    const copy = JSON.stringify(SEO_PAGES).toLowerCase()
    for (const phrase of ['game-changer', 'revolutionary', 'seamless', 'delve into', 'unlock your']) {
      expect(copy).not.toContain(phrase)
    }

    for (const page of SEO_PAGES.filter((candidate) => candidate.kind === 'guide' || candidate.kind === 'badge')) {
      expect(page.sources.some((source) => source.url.startsWith('https://www.tesla.com/'))).toBe(true)
    }
  })

  it('builds article and breadcrumb structured data from the same page source', () => {
    const page = SEO_PAGES.find((candidate) => candidate.path === '/badges/grand-canyon')
    expect(page).toBeTruthy()
    const schema = seoPageStructuredData(page!)
    expect(schema['@graph'][0]).toMatchObject({
      '@type': 'Article',
      headline: page!.headline,
      author: { '@type': 'Person', name: 'Anthony Pappano' },
      publisher: {
        '@type': 'Organization',
        name: 'Antelligence LLC',
        brand: { '@type': 'Brand', name: 'ChargeQuest' },
      },
    })
    expect(schema['@graph'][1]).toMatchObject({ '@type': 'BreadcrumbList' })
  })

  it('publishes the comparison, complete badge reference, and fixed route examples', () => {
    const competition = SEO_PAGES.find((page) => page.path === '/2026-tesla-supercharging-competition')
    const badges = SEO_PAGES.find((page) => page.path === '/tesla-iconic-charger-badges')
    expect(competition?.sections.flatMap((section) => section.table?.rows ?? [])).toHaveLength(3)
    const badgeRows = badges?.sections.flatMap((section) => section.table?.rows ?? []) ?? []
    expect(badgeRows).toHaveLength(17)
    const officialLinks = badgeRows.flatMap((row) => row.flatMap((cell) => {
      if (typeof cell === 'string') return []
      return cell.links ?? (cell.href ? [{ text: cell.text, href: cell.href }] : [])
    }))
    expect(officialLinks).toHaveLength(
      TESLA_ICONIC_BADGES.reduce((total, badge) => total + badge.officialLocationUrls.length, 0),
    )

    for (const path of [
      '/routes/tesla-route-66-supercharger-road-trip',
      '/routes/tesla-national-parks-road-trip',
      '/routes/great-american-icons',
    ]) {
      const route = SEO_PAGES.find((page) => page.path === path)
      const example = route?.sections.find((section) => section.heading.includes('fixed CORE example'))
      expect(example?.paragraphs.join(' '), path).toContain('3,146 eligible stations')
      expect(example?.table?.rows, path).toHaveLength(5)
    }
  })

  it('uses a ProfilePage for the visible Anthony author page', () => {
    const about = SEO_PAGES.find((page) => page.path === '/about-anthony')
    expect(about).toBeTruthy()
    expect(seoPageStructuredData(about!)['@graph'][0]).toMatchObject({
      '@type': 'ProfilePage',
      mainEntity: {
        '@type': 'Person',
        name: 'Anthony Pappano',
        url: 'https://www.teslachargequest.com/about-anthony',
      },
    })
  })
})
