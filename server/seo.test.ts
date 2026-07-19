import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { SEO_PAGES, SITE_ORIGIN } from '../src/seo/seoPages'
import { buildSitemapXml, renderClientDocument } from './seo'

const indexHtml = readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf8')

describe('server SEO rendering', () => {
  it('renders every content route with unique metadata and crawlable body copy', () => {
    for (const page of SEO_PAGES) {
      const rendered = renderClientDocument(indexHtml, page.path)
      expect(rendered.status, page.path).toBe(200)
      expect(rendered.html).toContain(`<title>${page.title}</title>`)
      expect(rendered.html).toContain(`href="${SITE_ORIGIN}${page.path}"`)
      expect(rendered.html).toContain(page.headline)
      expect(rendered.html).toContain('content="index,follow"')
      expect(rendered.html).toContain('data-page-schema')
      expect(rendered.html).toContain(`datetime="${page.updatedAt}"`)
      if (page.kind !== 'about') {
        expect(rendered.html).toContain('Written by <a href="/about-anthony">Anthony Pappano</a>')
      }
    }
  })

  it('sets private routes to noindex and returns a real 404 for unknown paths', () => {
    const planner = renderClientDocument(indexHtml, '/planner')
    expect(planner.status).toBe(200)
    expect(planner.html).toContain('content="noindex,nofollow"')

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
})
