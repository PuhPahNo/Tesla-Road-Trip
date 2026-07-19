import {
  SEO_PAGES,
  SEO_UPDATED_AT,
  SITE_ORIGIN,
  getRelatedSeoPages,
  getSeoPageByPath,
  seoPageStructuredData,
  type SeoPage,
} from '../src/seo/seoPages'

interface PageMetadata {
  title: string
  description: string
  path: string
  robots?: 'index,follow' | 'noindex,nofollow'
  type?: 'website' | 'article'
  structuredData?: Record<string, unknown>
  fallback?: string
}

export interface RenderedDocument {
  status: 200 | 404
  html: string
}

const publicPages = new Map<string, PageMetadata>([
  ['/', {
    title: 'ChargeQuest CORE | Tesla Supercharger Route Planner for 2026',
    description: 'Meet ChargeQuest CORE, the Charging Optimization & Route Engine for building and saving Tesla Supercharger routes around your vehicle, pace, badge targets, landmarks, and daily limits.',
    path: '/',
    fallback: renderBasicFallback(
      'Tesla Supercharger route planning for a road worth remembering',
      'Build a route around your Tesla, practical range, Iconic Charger badges, landmarks, and daily driving limits.',
      [
        ['/2026-tesla-supercharging-competition', 'Read the 2026 competition guide'],
        ['/tesla-iconic-charger-badges', 'Explore Iconic Charger badges'],
        ['/tesla-road-trip-routes', 'Browse road trip ideas'],
      ],
    ),
  }],
  ['/community', {
    title: 'ChargeQuest Community | Tesla Route Ideas and 2026 Trip Updates',
    description: 'Vote on states, suggest meaningful stops, offer meetup ideas, and help shape Anthony’s 2026 Tesla Supercharging Competition route.',
    path: '/community',
    fallback: renderBasicFallback(
      'Help shape the first ChargeQuest',
      'Vote for states, suggest stops worth taking, and share meetup ideas for Anthony’s 2026 route.',
    ),
  }],
  ['/track-anthony', {
    title: 'Track Anthony’s ChargeQuest | Live Tesla Road Trip Updates',
    description: 'Follow Anthony’s ChargeQuest route, latest location, road notes, competition progress, and community-supported Tesla road trip updates.',
    path: '/track-anthony',
    fallback: renderBasicFallback(
      'Follow Anthony’s ChargeQuest',
      'The live trip tracker will carry the route, road notes, detours, and competition progress when the journey begins.',
    ),
  }],
])

const privatePaths = new Set([
  '/login',
  '/signup',
  '/change-password',
  '/account',
  '/admin',
  '/planner',
])

export function renderClientDocument(indexHtml: string, pathname: string): RenderedDocument {
  const normalizedPath = normalizePath(pathname)
  const seoPage = getSeoPageByPath(normalizedPath)
  if (seoPage) {
    return {
      status: 200,
      html: applyMetadata(indexHtml, {
        title: seoPage.title,
        description: seoPage.description,
        path: seoPage.path,
        type: seoPage.kind === 'hub' ? 'website' : 'article',
        structuredData: seoPageStructuredData(seoPage),
        fallback: renderSeoFallback(seoPage),
      }),
    }
  }

  const publicPage = publicPages.get(normalizedPath)
  if (publicPage) {
    return { status: 200, html: applyMetadata(indexHtml, publicPage) }
  }

  if (privatePaths.has(normalizedPath)) {
    return {
      status: 200,
      html: applyMetadata(indexHtml, {
        title: 'Private ChargeQuest Page',
        description: 'A private ChargeQuest account and route-planning page.',
        path: normalizedPath,
        robots: 'noindex,nofollow',
      }),
    }
  }

  return {
    status: 404,
    html: applyMetadata(indexHtml, {
      title: 'Page Not Found | ChargeQuest',
      description: 'That ChargeQuest page could not be found.',
      path: normalizedPath,
      robots: 'noindex,nofollow',
      fallback: renderBasicFallback(
        'This road ends here.',
        'The page may have moved, or the address may be off. Head back to ChargeQuest and choose another direction.',
        [['/', 'Return home']],
      ),
    }),
  }
}

export function buildSitemapXml() {
  const entries = [
    { path: '/', lastmod: SEO_UPDATED_AT },
    { path: '/community', lastmod: SEO_UPDATED_AT },
    { path: '/track-anthony', lastmod: SEO_UPDATED_AT },
    ...SEO_PAGES.map((page) => ({ path: page.path, lastmod: page.updatedAt })),
  ]

  const urls = entries.map(({ path, lastmod }) => [
    '  <url>',
    `    <loc>${escapeXml(`${SITE_ORIGIN}${path}`)}</loc>`,
    `    <lastmod>${lastmod}</lastmod>`,
    '  </url>',
  ].join('\n')).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}

function applyMetadata(indexHtml: string, metadata: PageMetadata) {
  const canonical = `${SITE_ORIGIN}${metadata.path}`
  let html = indexHtml
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(metadata.title)}</title>`)
    .replace(/<meta\s+name="description"[\s\S]*?>/i, `<meta name="description" content="${escapeAttribute(metadata.description)}" />`)
    .replace(/<link\s+rel="canonical"[\s\S]*?>/i, `<link rel="canonical" href="${escapeAttribute(canonical)}" />`)
    .replace(/<meta\s+property="og:url"[\s\S]*?>/i, `<meta property="og:url" content="${escapeAttribute(canonical)}" />`)
    .replace(/<meta\s+property="og:title"[\s\S]*?>/i, `<meta property="og:title" content="${escapeAttribute(metadata.title)}" />`)
    .replace(/<meta\s+property="og:description"[\s\S]*?>/i, `<meta property="og:description" content="${escapeAttribute(metadata.description)}" />`)
    .replace(/<meta\s+property="og:type"[\s\S]*?>/i, `<meta property="og:type" content="${metadata.type ?? 'website'}" />`)

  const robots = metadata.robots ?? 'index,follow'
  html = insertBeforeHeadEnd(
    html,
    `<meta name="robots" content="${robots}" />\n<meta name="twitter:title" content="${escapeAttribute(metadata.title)}" />\n<meta name="twitter:description" content="${escapeAttribute(metadata.description)}" />`,
  )

  if (metadata.structuredData) {
    const json = JSON.stringify(metadata.structuredData).replace(/</g, '\\u003c')
    html = insertBeforeHeadEnd(html, `<script type="application/ld+json" data-page-schema>${json}</script>`)
  }

  if (metadata.fallback) {
    html = html.replace('<div id="root"></div>', `${metadata.fallback}\n    <div id="root"></div>`)
  }
  return html
}

function renderSeoFallback(page: SeoPage) {
  const sections = page.sections.map((section) => {
    const paragraphs = section.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('\n')
    const bullets = section.bullets?.length
      ? `<ul>${section.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join('')}</ul>`
      : ''
    return `<section><h2>${escapeHtml(section.heading)}</h2>${paragraphs}${bullets}</section>`
  }).join('\n')
  const facts = page.facts.map((fact) => `<li><strong>${escapeHtml(fact.label)}:</strong> ${escapeHtml(fact.value)}</li>`).join('')
  const sources = page.sources.length
    ? `<section><h2>Official sources</h2><ul>${page.sources.map((source) => `<li><a href="${escapeAttribute(source.url)}">${escapeHtml(source.label)}</a></li>`).join('')}</ul></section>`
    : ''
  const related = getRelatedSeoPages(page)
    .map((item) => `<li><a href="${escapeAttribute(item.path)}">${escapeHtml(item.headline)}</a></li>`)
    .join('')

  return `<main class="seo-static-fallback"><article>
    <nav><a href="/">ChargeQuest</a> / ${escapeHtml(page.eyebrow)}</nav>
    <p>${escapeHtml(page.eyebrow)}</p>
    <h1>${escapeHtml(page.headline)}</h1>
    <p>${escapeHtml(page.intro)}</p>
    <ul>${facts}</ul>
    ${sections}
    ${page.note ? `<aside><strong>Important context:</strong> ${escapeHtml(page.note)}</aside>` : ''}
    ${sources}
    <section><h2>Keep exploring</h2><ul>${related}</ul></section>
    <p><a href="${escapeAttribute(page.cta.path)}">${escapeHtml(page.cta.label)}</a></p>
  </article></main>`
}

function renderBasicFallback(heading: string, body: string, links: Array<[string, string]> = []) {
  const linkList = links.length
    ? `<ul>${links.map(([href, label]) => `<li><a href="${escapeAttribute(href)}">${escapeHtml(label)}</a></li>`).join('')}</ul>`
    : ''
  return `<main class="seo-static-fallback"><article><h1>${escapeHtml(heading)}</h1><p>${escapeHtml(body)}</p>${linkList}</article></main>`
}

function insertBeforeHeadEnd(html: string, content: string) {
  return html.replace('</head>', `    ${content}\n  </head>`)
}

function normalizePath(pathname: string) {
  if (pathname === '/') return pathname
  return pathname.replace(/\/$/, '')
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function escapeAttribute(value: string) {
  return escapeHtml(value)
}

function escapeXml(value: string) {
  return escapeHtml(value)
}
