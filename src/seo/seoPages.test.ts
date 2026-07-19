import { describe, expect, it } from 'vitest'
import { SEO_PAGES, getRelatedSeoPages, seoPageStructuredData } from './seoPages'

describe('public SEO content registry', () => {
  it('contains a focused set of unique, substantial pages', () => {
    expect(SEO_PAGES).toHaveLength(13)
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
    })
    expect(schema['@graph'][1]).toMatchObject({ '@type': 'BreadcrumbList' })
  })
})
