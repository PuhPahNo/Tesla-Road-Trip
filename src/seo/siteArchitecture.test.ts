import { describe, expect, it } from 'vitest'
import { SEO_PAGES, SITE_ORIGIN } from './seoPages'
import {
  CUSTOM_PUBLIC_PAGES,
  PUBLIC_INDEXABLE_PATHS,
  buildCustomPublicStructuredData,
  buildSeoPageStructuredData,
  getContextualPublicLinks,
  getSeoBreadcrumbs,
  getSeoPagePresentation,
} from './siteArchitecture'

describe('public site architecture', () => {
  it('uses only real public pages for every editorial breadcrumb', () => {
    const publicPaths = new Set<string>(PUBLIC_INDEXABLE_PATHS)

    for (const page of SEO_PAGES) {
      const breadcrumbs = getSeoBreadcrumbs(page)
      expect(breadcrumbs[0], page.path).toEqual({ path: '/', name: 'ChargeQuest' })
      expect(breadcrumbs.at(-1)?.path, page.path).toBe(page.path)

      for (const breadcrumb of breadcrumbs) {
        expect(publicPaths.has(breadcrumb.path), `${page.path} -> ${breadcrumb.path}`).toBe(true)
      }
    }

    const allBreadcrumbPaths = SEO_PAGES.flatMap((page) =>
      getSeoBreadcrumbs(page).map((breadcrumb) => breadcrumb.path),
    )
    expect(allBreadcrumbPaths).not.toContain('/competition')
    expect(allBreadcrumbPaths).not.toContain('/badges')
    expect(allBreadcrumbPaths).not.toContain('/routes')
  })

  it('maps each leaf family to its real canonical hub', () => {
    for (const page of SEO_PAGES.filter((candidate) => candidate.kind === 'guide')) {
      expect(getSeoBreadcrumbs(page)[1].path).toBe('/2026-tesla-supercharging-competition')
    }
    for (const page of SEO_PAGES.filter((candidate) => candidate.kind === 'badge')) {
      expect(getSeoBreadcrumbs(page)[1].path).toBe('/tesla-iconic-charger-badges')
    }
    for (const page of SEO_PAGES.filter((candidate) => candidate.kind === 'route')) {
      expect(getSeoBreadcrumbs(page)[1].path).toBe('/tesla-road-trip-routes')
    }
  })

  it('publishes linked article, image, and breadcrumb schema from truthful dates', () => {
    const page = SEO_PAGES.find((candidate) => candidate.path === '/badges/grand-canyon')!
    const structuredData = buildSeoPageStructuredData(page)
    const graph = structuredData['@graph'] as Array<Record<string, unknown>>
    const article = graph[0]
    const breadcrumbList = graph[1]

    expect(article).toMatchObject({
      '@type': 'Article',
      '@id': `${SITE_ORIGIN}${page.path}#article`,
      datePublished: '2026-07-19',
      dateModified: page.updatedAt,
      image: { '@id': `${SITE_ORIGIN}${page.path}#primaryimage` },
      author: { '@id': `${SITE_ORIGIN}/about-anthony#person` },
      publisher: { '@id': `${SITE_ORIGIN}/#organization` },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `${SITE_ORIGIN}${page.path}`,
      },
    })
    expect(breadcrumbList).toMatchObject({ '@type': 'BreadcrumbList' })
    expect(breadcrumbList.itemListElement).toEqual(
      getSeoBreadcrumbs(page).map((breadcrumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: breadcrumb.name,
        item: `${SITE_ORIGIN}${breadcrumb.path}`,
      })),
    )
    expect(graph[2]).toMatchObject({
      '@type': 'ImageObject',
      '@id': `${SITE_ORIGIN}${page.path}#primaryimage`,
      url: `${SITE_ORIGIN}/editorial/grand-canyon-south-rim.jpg`,
      width: 1600,
      height: 1000,
    })
  })

  it('assigns every published editorial page a distinct cover outside the landing-page image system', () => {
    const presentations = SEO_PAGES.map(getSeoPagePresentation)
    const socialImages = presentations.map((presentation) => presentation.socialImage)

    expect(new Set(socialImages).size).toBe(SEO_PAGES.length)
    expect(socialImages.every((image) => image.startsWith('/editorial/'))).toBe(true)
    expect(presentations.every((presentation) => presentation.photoCredit?.sourceUrl.startsWith('https://unsplash.com/photos/'))).toBe(true)
  })

  it('builds custom-page schema and cluster-specific social metadata from the same records', () => {
    for (const page of CUSTOM_PUBLIC_PAGES) {
      const graph = buildCustomPublicStructuredData(page)['@graph']
      expect(graph[0]).toMatchObject({
        '@type': 'WebPage',
        url: `${SITE_ORIGIN}${page.path}`,
        name: page.title,
        dateModified: page.updatedAt,
      })
      expect(graph[1]).toMatchObject({ '@type': 'BreadcrumbList' })
      expect(graph[2]).toMatchObject({
        '@type': 'ImageObject',
        url: `${SITE_ORIGIN}${page.socialImage}`,
        width: 1200,
        height: 630,
      })
    }
  })

  it('publishes the dated Track field note as an Article inside the Track page schema', () => {
    const track = CUSTOM_PUBLIC_PAGES.find((page) => page.path === '/track-anthony')!
    const graph = buildCustomPublicStructuredData(track)['@graph'] as Array<Record<string, unknown>>
    const webPage = graph.find((item) => item['@type'] === 'WebPage')!
    const fieldNote = graph.find((item) => item['@type'] === 'Article')!

    expect(webPage.hasPart).toEqual([
      { '@id': `${SITE_ORIGIN}/track-anthony#journal-73-day-route-not-finished` },
    ])
    expect(fieldNote).toMatchObject({
      '@id': `${SITE_ORIGIN}/track-anthony#journal-73-day-route-not-finished`,
      headline: 'The route is 73 days long. I’m still not calling it finished.',
      datePublished: '2026-08-10',
      dateModified: '2026-08-10',
      mainEntityOfPage: { '@id': `${SITE_ORIGIN}/track-anthony#webpage` },
    })
    expect(fieldNote.articleBody).toContain('10,107.8 road-routed miles')
  })

  it('keeps custom-page metadata and contextual links in one public contract', () => {
    const community = CUSTOM_PUBLIC_PAGES.find((page) => page.path === '/community')!
    const track = CUSTOM_PUBLIC_PAGES.find((page) => page.path === '/track-anthony')!
    expect(community.title).toBe('Send Anthony a Route Idea | ChargeQuest Community')
    expect(track.description).toContain('actual 2026 Tesla Supercharging Competition route plan')

    const publicPaths = new Set<string>(PUBLIC_INDEXABLE_PATHS)
    for (const path of PUBLIC_INDEXABLE_PATHS) {
      for (const link of getContextualPublicLinks(path)) {
        expect(link.path, `${path} -> ${link.path}`).not.toBe(path)
        expect(publicPaths.has(link.path), `${path} -> ${link.path}`).toBe(true)
      }
    }

    for (const page of SEO_PAGES.filter((candidate) =>
      ['guide', 'badge', 'route'].includes(candidate.kind),
    )) {
      expect(getContextualPublicLinks(page.path)).toContainEqual({
        path: '/track-anthony',
        label: 'Anthony’s 73-day competition route and field notes',
      })
    }
  })
})
