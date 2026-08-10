import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { SEO_PAGES, SITE_ORIGIN } from '../src/seo/seoPages'
import {
  CUSTOM_PUBLIC_PAGES,
  PUBLIC_INDEXABLE_PATHS,
  getSeoBreadcrumbs,
} from '../src/seo/siteArchitecture'
import { buildSitemapXml, renderClientDocument } from './seo'

const indexHtml = readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf8')
const routeSnapshot = JSON.parse(
  readFileSync(path.resolve(process.cwd(), 'scripts/data/2026-competition-stops.json'), 'utf8'),
) as {
  routeName: string
  capturedAt: string
  stops: Array<{ date: string; day: number; stationName: string }>
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

describe('server SEO rendering', () => {
  it('keeps browser zoom available in the shared viewport settings', () => {
    expect(indexHtml).toContain('width=device-width, initial-scale=1.0, viewport-fit=cover')
    expect(indexHtml).not.toContain('maximum-scale=1')
  })

  it('renders every content route with unique metadata and crawlable body copy', () => {
    for (const page of SEO_PAGES) {
      const rendered = renderClientDocument(indexHtml, page.path)
      expect(rendered.status, page.path).toBe(200)
      expect(rendered.html).toContain(`<title>${escapeHtml(page.title)}</title>`)
      expect(rendered.html).toContain(`href="${SITE_ORIGIN}${page.path}"`)
      expect(rendered.html).toContain(page.headline)
      expect(rendered.html).toContain('content="index,follow"')
      expect(rendered.html).toContain('data-page-schema')
      expect(rendered.html).toContain(`datetime="${page.updatedAt}"`)
      const structuredData = readPageStructuredData(rendered.html)
      const graph = structuredData['@graph'] as Array<Record<string, unknown>>
      const breadcrumbList = graph.find((item) => item['@type'] === 'BreadcrumbList')!
      const breadcrumbItems = breadcrumbList.itemListElement as Array<{ item: string }>
      expect(breadcrumbItems.map((item) => item.item)).toEqual(
        getSeoBreadcrumbs(page).map((breadcrumb) => `${SITE_ORIGIN}${breadcrumb.path}`),
      )

      for (const item of breadcrumbItems) {
        const breadcrumbPath = new URL(item.item).pathname
        expect(renderClientDocument(indexHtml, breadcrumbPath).status, `${page.path} -> ${breadcrumbPath}`).toBe(200)
      }
      if (page.kind !== 'about') {
        expect(rendered.html).toContain('Written by <a href="/about-anthony">Anthony Pappano</a>')
      }
    }
  })

  it('sets private routes to noindex and returns a real 404 for unknown paths', () => {
    const planner = renderClientDocument(indexHtml, '/planner')
    expect(planner.status).toBe(200)
    expect(planner.html).toContain('content="noindex,nofollow"')

    const adminHotels = renderClientDocument(indexHtml, '/admin/hotels')
    expect(adminHotels.status).toBe(200)
    expect(adminHotels.html).toContain('content="noindex,nofollow"')

    const unknown = renderClientDocument(indexHtml, '/a-road-that-does-not-exist')
    expect(unknown.status).toBe(404)
    expect(unknown.html).toContain('<title>Page Not Found | ChargeQuest</title>')
    expect(unknown.html).toContain('This road ends here.')
    expect(unknown.html).toContain('content="noindex,nofollow"')
  })

  it('lists only public indexable routes in the generated sitemap', () => {
    const sitemap = buildSitemapXml()
    expect(sitemap.match(/<url>/g)).toHaveLength(SEO_PAGES.length + 3)
    expect(sitemap).toContain(`${SITE_ORIGIN}/2026-tesla-supercharging-competition`)
    expect(sitemap).toContain(`${SITE_ORIGIN}/routes/tesla-national-parks-road-trip`)
    expect(sitemap).not.toContain(`${SITE_ORIGIN}/planner`)
    expect(sitemap).not.toContain(`${SITE_ORIGIN}/signup`)
  })

  it('keeps raw Community and Track Anthony metadata aligned with the client contract', () => {
    for (const page of CUSTOM_PUBLIC_PAGES.filter((candidate) => candidate.path !== '/')) {
      const rendered = renderClientDocument(indexHtml, page.path)
      expect(rendered.html).toContain(`<title>${escapeHtml(page.title)}</title>`)
      expect(rendered.html).toContain(`name="description" content="${escapeHtml(page.description)}"`)
      expect(rendered.html).toContain(`property="og:title" content="${escapeHtml(page.title)}"`)
      expect(rendered.html).toContain(`name="twitter:title" content="${escapeHtml(page.title)}"`)
      expect(rendered.html).toContain(`property="og:image" content="${SITE_ORIGIN}${page.socialImage}"`)
      expect(rendered.html).toContain('property="og:image:width" content="1200"')
      expect(rendered.html).toContain('property="og:image:height" content="630"')
      expect(rendered.html).toContain('data-page-schema')
    }
  })

  it('preloads the responsive LCP image on home only and uses cluster social images', () => {
    const home = renderClientDocument(indexHtml, '/')
    const competition = renderClientDocument(indexHtml, '/2026-tesla-supercharging-competition')
    const competitionArticle = renderClientDocument(indexHtml, '/competition/longest-trip-strategy')
    const badges = renderClientDocument(indexHtml, '/tesla-iconic-charger-badges')
    const routes = renderClientDocument(indexHtml, '/tesla-road-trip-routes')

    expect(home.html).toContain('data-page-preload')
    expect(home.html).toContain('imagesrcset="/landing/desert-road-640.avif 640w')
    expect(competition.html).not.toContain('data-page-preload')
    expect(competition.html).toContain('/social/chargequest-competition.jpg')
    expect(badges.html).toContain('/social/chargequest-badges.jpg')
    expect(routes.html).toContain('/social/chargequest-routes.jpg')
    expect(competitionArticle.html).toContain('property="article:modified_time"')
  })

  it('renders a bounded, truthful Track Anthony route summary without the route API', () => {
    const rendered = renderClientDocument(indexHtml, '/track-anthony')
    const firstStop = routeSnapshot.stops[0]
    const lastStop = routeSnapshot.stops.at(-1)!

    expect(rendered.status).toBe(200)
    expect(rendered.html).toContain('data-track-route-summary')
    expect(rendered.html).toContain(routeSnapshot.routeName)
    expect(rendered.html).toContain(`${routeSnapshot.stops.length} dated Supercharger stops`)
    expect(rendered.html).toContain(`across ${lastStop.day} planned days`)
    expect(rendered.html).toContain(firstStop.stationName)
    expect(rendered.html).toContain(lastStop.stationName)
    expect(rendered.html).toContain(`datetime="${firstStop.date}"`)
    expect(rendered.html).toContain(`datetime="${lastStop.date}"`)
    expect(rendered.html).toContain(`datetime="${routeSnapshot.capturedAt.slice(0, 10)}"`)
    expect(rendered.html).toContain('not live trip status or an official Tesla competition score')
    const snapshotSection = rendered.html.match(
      /<section>\s*<h2>The checked-in route snapshot<\/h2>([\s\S]*?)<\/section>/,
    )?.[1] ?? ''
    expect(snapshotSection).not.toMatch(/\d[\d,]*\s+miles/)

    const representativeList = rendered.html.match(/<ol data-route-summary-stops>([\s\S]*?)<\/ol>/)?.[1] ?? ''
    expect(representativeList.match(/<li>/g)).toHaveLength(8)
    expect(rendered.html).toContain('href="/2026-tesla-supercharging-competition"')
    expect(rendered.html).toContain('href="/tesla-road-trip-routes"')
    expect(rendered.html).toContain('href="/tesla-iconic-charger-badges"')
    expect(rendered.html).toContain('data-published-field-note="73-day-route-not-finished"')
    expect(rendered.html).toContain('The route is 73 days long. I’m still not calling it finished.')
    expect(rendered.html).toContain('datetime="2026-08-10"')
    expect(rendered.html).toContain('10,107.8 road-routed miles')
    expect(rendered.html).toContain('href="/competition/longest-trip-strategy"')
    expect(rendered.html).toContain('href="/signup?returnTo=%2Fplanner"')
    expect(rendered.html).toContain('href="/community"')

    const graph = readPageStructuredData(rendered.html)['@graph'] as Array<Record<string, unknown>>
    expect(graph.find((item) => item['@type'] === 'Article')).toMatchObject({
      headline: 'The route is 73 days long. I’m still not calling it finished.',
      datePublished: '2026-08-10',
    })
  })

  it('keeps every public page reachable through raw HTML fallback links', () => {
    const publicPaths = new Set<string>(PUBLIC_INDEXABLE_PATHS)
    const visited = new Set<string>()
    const queue = ['/']

    while (queue.length) {
      const pathToVisit = queue.shift()!
      if (visited.has(pathToVisit)) continue
      visited.add(pathToVisit)
      const rendered = renderClientDocument(indexHtml, pathToVisit)
      expect(rendered.status, pathToVisit).toBe(200)

      for (const href of readInternalLinks(rendered.html)) {
        const linkedPath = href.split(/[?#]/)[0] || '/'
        const target = renderClientDocument(indexHtml, linkedPath)
        expect(target.status, `${pathToVisit} -> ${linkedPath}`).toBe(200)
        if (publicPaths.has(linkedPath) && !visited.has(linkedPath)) queue.push(linkedPath)
      }
    }

    expect(visited).toEqual(publicPaths)
  })
})

function readPageStructuredData(html: string) {
  const json = html.match(/<script type="application\/ld\+json" data-page-schema>([\s\S]*?)<\/script>/)?.[1]
  expect(json).toBeTruthy()
  return JSON.parse(json!) as Record<string, unknown>
}

function readInternalLinks(html: string) {
  return [...html.matchAll(/<a href="(\/[^"#]*)"/g)].map((match) => match[1])
}
