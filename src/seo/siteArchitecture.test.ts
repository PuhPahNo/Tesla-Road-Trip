import { describe, expect, it } from 'vitest'
import { SEO_PAGES, SITE_ORIGIN } from './seoPages'
import {
  CUSTOM_PUBLIC_PAGES,
  PUBLIC_INDEXABLE_PATHS,
  buildCustomPublicStructuredData,
  buildSeoPageStructuredData,
  getContextualPublicLinks,
  getSeoBreadcrumbs,
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
      width: 1200,
      height: 630,
    })
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
  })
})
