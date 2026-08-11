import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  PUBLISHED_ANTHONY_FIELD_NOTES,
  type AnthonyFieldNote,
  type AnthonyFieldNoteInline,
} from '../src/content/anthonyFieldNotes'
import {
  SEO_PAGES,
  SEO_AUTHOR,
  SITE_ORIGIN,
  formatSeoDate,
  getRelatedSeoPages,
  getSeoPageByPath,
  type SeoPage,
  type SeoTable,
} from '../src/seo/seoPages'
import {
  CUSTOM_PUBLIC_PAGES,
  buildCustomPublicStructuredData,
  buildSeoPageStructuredData,
  getContextualPublicLinks,
  getSeoBreadcrumbs,
  getSeoPagePresentation,
  type CustomPublicPageMetadata,
  type PublicArchitectureLink,
} from '../src/seo/siteArchitecture'

interface PageMetadata {
  title: string
  description: string
  path: string
  robots?: 'index,follow' | 'noindex,nofollow'
  type?: 'website' | 'article' | 'profile'
  socialImage?: string
  socialImageAlt?: string
  updatedAt?: string
  preloadHomepageHero?: boolean
  structuredData?: Record<string, unknown>
  fallback?: string
}

interface CompetitionRouteStop {
  address: string
  date: string
  day: number
  stationName: string
}

interface CompetitionRouteSnapshot {
  routeName: string
  capturedAt: string
  stops: CompetitionRouteStop[]
}

export interface RenderedDocument {
  status: 200 | 404
  html: string
}

const competitionRouteSnapshot = loadCompetitionRouteSnapshot()
const publicPages = new Map<string, PageMetadata>(CUSTOM_PUBLIC_PAGES.map((page) => [
  page.path,
  {
    title: page.title,
    description: page.description,
    path: page.path,
    type: page.type,
    socialImage: page.socialImage,
    socialImageAlt: page.socialImageAlt,
    updatedAt: page.updatedAt,
    preloadHomepageHero: page.path === '/',
    structuredData: buildCustomPublicStructuredData(page),
    fallback: renderCustomPublicFallback(page),
  },
]))

const privatePaths = new Set([
  '/login',
  '/signup',
  '/change-password',
  '/dashboard',
  '/account',
  '/admin',
  '/admin/hotels',
  '/planner',
])

export function renderClientDocument(indexHtml: string, pathname: string): RenderedDocument {
  const normalizedPath = normalizePath(pathname)
  const seoPage = getSeoPageByPath(normalizedPath)
  if (seoPage) {
    return {
      status: 200,
      html: applyMetadata(indexHtml, {
        ...getSeoPagePresentation(seoPage),
        structuredData: buildSeoPageStructuredData(seoPage),
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
        [{ path: '/', label: 'Return home' }],
      ),
    }),
  }
}

export function buildSitemapXml() {
  const entries = [
    ...CUSTOM_PUBLIC_PAGES.map((page) => ({ path: page.path, lastmod: page.updatedAt })),
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
  const socialImage = `${SITE_ORIGIN}${metadata.socialImage ?? '/social/chargequest-home.jpg'}`
  const socialImageAlt = metadata.socialImageAlt ?? 'An open highway crossing the painted desert'
  let html = indexHtml
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(metadata.title)}</title>`)
    .replace(/<link\s+rel="canonical"[\s\S]*?>/i, `<link rel="canonical" href="${escapeAttribute(canonical)}" />`)

  const robots = metadata.robots ?? 'index,follow'
  const tags: Array<['name' | 'property', string, string]> = [
    ['name', 'description', metadata.description],
    ['name', 'robots', robots],
    ['property', 'og:url', canonical],
    ['property', 'og:title', metadata.title],
    ['property', 'og:description', metadata.description],
    ['property', 'og:type', metadata.type === 'profile' ? 'profile' : metadata.type ?? 'website'],
    ['property', 'og:image', socialImage],
    ['property', 'og:image:alt', socialImageAlt],
    ['property', 'og:image:width', '1200'],
    ['property', 'og:image:height', '630'],
    ['property', 'og:image:type', 'image/jpeg'],
    ['property', 'og:locale', 'en_US'],
    ['name', 'twitter:card', 'summary_large_image'],
    ['name', 'twitter:title', metadata.title],
    ['name', 'twitter:description', metadata.description],
    ['name', 'twitter:image', socialImage],
    ['name', 'twitter:image:alt', socialImageAlt],
  ]
  if (metadata.type === 'article' && metadata.updatedAt) {
    tags.push(['property', 'article:modified_time', metadata.updatedAt])
  }
  for (const [attribute, key, value] of tags) {
    html = setMetaInHtml(html, attribute, key, value)
  }

  if (metadata.preloadHomepageHero) {
    html = insertBeforeHeadEnd(
      html,
      '<link rel="preload" as="image" href="/landing/desert-road-960.avif" imagesrcset="/landing/desert-road-640.avif 640w, /landing/desert-road-960.avif 960w, /landing/desert-road-1280.avif 1280w, /landing/desert-road-1920.avif 1920w" imagesizes="100vw" type="image/avif" fetchpriority="high" data-page-preload />',
    )
  }

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
    const table = section.table ? renderSeoTable(section.table) : ''
    return `<section><h2>${escapeHtml(section.heading)}</h2>${paragraphs}${bullets}${table}</section>`
  }).join('\n')
  const facts = page.facts.map((fact) => `<li><strong>${escapeHtml(fact.label)}:</strong> ${escapeHtml(fact.value)}</li>`).join('')
  const sources = page.sources.length
    ? `<section><h2>Sources and verification</h2><ul>${page.sources.map((source) => `<li><a href="${escapeAttribute(source.url)}">${escapeHtml(source.label)}</a></li>`).join('')}</ul></section>`
    : ''
  const related = getRelatedSeoPages(page)
    .map((item) => `<li><a href="${escapeAttribute(item.path)}">${escapeHtml(item.headline)}</a></li>`)
    .join('')
  const breadcrumbs = getSeoBreadcrumbs(page)
    .map((breadcrumb, index, items) => index === items.length - 1
      ? `<span aria-current="page">${escapeHtml(breadcrumb.name)}</span>`
      : `<a href="${escapeAttribute(breadcrumb.path)}">${escapeHtml(breadcrumb.name)}</a>`)
    .join(' / ')
  const contextualLinks = getContextualPublicLinks(page.path).filter(
    (link) => !page.relatedPaths.includes(link.path),
  )
  const contextual = contextualLinks.length
    ? `<section><h2>Connect the planning</h2>${renderLinkList(contextualLinks)}</section>`
    : ''

  return `<main class="seo-static-fallback"><article>
    <nav aria-label="Breadcrumb">${breadcrumbs}</nav>
    <p>${escapeHtml(page.eyebrow)}</p>
    <h1>${escapeHtml(page.headline)}</h1>
    <p>${escapeHtml(page.intro)}</p>
    <p>${page.kind === 'about'
      ? escapeHtml(SEO_AUTHOR.name)
      : `Written by <a href="${escapeAttribute(SEO_AUTHOR.path)}">${escapeHtml(SEO_AUTHOR.name)}</a>`} · <time datetime="${escapeAttribute(page.updatedAt)}">Updated ${escapeHtml(formatSeoDate(page.updatedAt))}</time></p>
    <ul>${facts}</ul>
    ${sections}
    ${page.note ? `<aside><strong>Important context:</strong> ${escapeHtml(page.note)}</aside>` : ''}
    ${sources}
    <section><h2>Keep exploring</h2><ul>${related}</ul></section>
    ${contextual}
    <p><a href="${escapeAttribute(page.cta.path)}">${escapeHtml(page.cta.label)}</a></p>
  </article></main>`
}

function renderSeoTable(table: SeoTable) {
  const headings = table.columns
    .map((column) => `<th scope="col">${escapeHtml(column)}</th>`)
    .join('')
  const rows = table.rows.map((row) => `<tr>${row.map((cell) => {
    if (typeof cell === 'string') return `<td>${escapeHtml(cell)}</td>`
    const value = cell.links?.length
      ? cell.links.map((link) => `<a href="${escapeAttribute(link.href)}">${escapeHtml(link.text)}</a>`).join(' · ')
      : cell.href
        ? `<a href="${escapeAttribute(cell.href)}">${escapeHtml(cell.text)}</a>`
        : escapeHtml(cell.text)
    return `<td>${value}</td>`
  }).join('')}</tr>`).join('')
  return `<table><caption>${escapeHtml(table.caption)}</caption><thead><tr>${headings}</tr></thead><tbody>${rows}</tbody></table>`
}

function renderCustomPublicFallback(page: CustomPublicPageMetadata) {
  if (page.path === '/track-anthony') {
    return renderTrackAnthonyFallback(page, competitionRouteSnapshot)
  }

  return renderBasicFallback(
    page.fallbackHeading,
    page.fallbackBody,
    getContextualPublicLinks(page.path),
  )
}

function renderTrackAnthonyFallback(
  page: CustomPublicPageMetadata,
  snapshot: CompetitionRouteSnapshot | undefined,
) {
  const links = getContextualPublicLinks(page.path)
  if (!snapshot?.stops.length) {
    return renderBasicFallback(page.fallbackHeading, page.fallbackBody, links)
  }

  const orderedStops = [...snapshot.stops].sort((left, right) => left.day - right.day)
  const firstStop = orderedStops[0]
  const lastStop = orderedStops[orderedStops.length - 1]
  const plannedDays = Math.max(...orderedStops.map((stop) => stop.day))
  const stateCodes = new Set(orderedStops.flatMap((stop) => {
    const stateCode = stop.stationName.match(/,\s*([A-Z]{2})(?:\s+-.*)?$/)?.[1]
    return stateCode ? [stateCode] : []
  }))
  const representativeStops = selectRepresentativeStops(orderedStops)
    .map((stop) => `<li><time datetime="${escapeAttribute(stop.date)}">${escapeHtml(formatSeoDate(stop.date))}</time> · Day ${stop.day} · ${escapeHtml(stop.stationName)}</li>`)
    .join('')
  const capturedDate = snapshot.capturedAt.slice(0, 10)

  return `<main class="seo-static-fallback"><article data-track-route-summary>
    <nav aria-label="Breadcrumb"><a href="/">ChargeQuest</a> / <span aria-current="page">Track Anthony</span></nav>
    <h1>${escapeHtml(page.fallbackHeading)}</h1>
    <p>${escapeHtml(page.fallbackBody)}</p>
    <section>
      <h2>The checked-in route snapshot</h2>
      <p><strong>${escapeHtml(snapshot.routeName)}</strong> currently contains ${orderedStops.length} dated Supercharger stops across ${plannedDays} planned days, from <time datetime="${escapeAttribute(firstStop.date)}">${escapeHtml(formatSeoDate(firstStop.date))}</time> through <time datetime="${escapeAttribute(lastStop.date)}">${escapeHtml(formatSeoDate(lastStop.date))}</time>. It starts at ${escapeHtml(firstStop.stationName)}, ends at ${escapeHtml(lastStop.stationName)}, and passes through ${stateCodes.size} states.</p>
      <p>This is a planning snapshot captured <time datetime="${escapeAttribute(capturedDate)}">${escapeHtml(formatSeoDate(capturedDate))}</time>, not live trip status or an official Tesla competition score. The snapshot does not contain verified route mileage, so no mileage is claimed here.</p>
    </section>
    <section>
      <h2>Representative dated stops</h2>
      <ol data-route-summary-stops>${representativeStops}</ol>
    </section>
    ${renderPublishedFieldNotes(PUBLISHED_ANTHONY_FIELD_NOTES)}
    <section><h2>Plan and follow the quest</h2>${renderLinkList(links)}</section>
  </article></main>`
}

function renderPublishedFieldNotes(notes: readonly AnthonyFieldNote[]) {
  if (!notes.length) return ''
  const entries = notes.map((note) => {
    const lede = note.lede.map((paragraph) => `<p>${renderFieldNoteInline(paragraph)}</p>`).join('')
    const sections = note.sections.map((section) => {
      const paragraphs = section.paragraphs
        .map((paragraph) => `<p>${renderFieldNoteInline(paragraph)}</p>`)
        .join('')
      const bullets = section.bullets?.length
        ? `<ul>${section.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join('')}</ul>`
        : ''
      const afterBullets = section.afterBullets
        ?.map((paragraph) => `<p>${renderFieldNoteInline(paragraph)}</p>`)
        .join('') ?? ''
      return `<section><h4>${escapeHtml(section.heading)}</h4>${paragraphs}${bullets}${afterBullets}</section>`
    }).join('')
    const closingLinks = renderLinkList(note.closingLinks.map((link) => ({
      path: link.href,
      label: link.label,
    })))
    const sources = note.sources.map((source) => (
      `<li><a href="${escapeAttribute(source.href)}" rel="noreferrer">${escapeHtml(source.label)}</a></li>`
    )).join('')

    return `<article id="journal-${escapeAttribute(note.id)}" data-published-field-note="${escapeAttribute(note.id)}">
      <p>${escapeHtml(note.phaseLabel)} · <time datetime="${escapeAttribute(note.publishedAt)}">${escapeHtml(formatSeoDate(note.publishedAt))}</time></p>
      <h3>${escapeHtml(note.title)}</h3>
      <p><strong>${escapeHtml(note.excerpt)}</strong></p>
      ${lede}
      ${sections}
      <nav aria-label="Continue reading after ${escapeAttribute(note.title)}"><h4>Continue through ChargeQuest</h4>${closingLinks}</nav>
      <section><h4>Source checked for this note</h4><ul>${sources}</ul></section>
    </article>`
  }).join('')

  return `<section id="journey-log"><h2>Trip journal</h2>${entries}</section>`
}

function renderFieldNoteInline(content: AnthonyFieldNoteInline[]) {
  return content.map((part) => typeof part === 'string'
    ? escapeHtml(part)
    : `<a href="${escapeAttribute(part.href)}"${part.external ? ' rel="noreferrer"' : ''}>${escapeHtml(part.label)}</a>`)
    .join('')
}

function renderBasicFallback(
  heading: string,
  body: string,
  links: readonly PublicArchitectureLink[] = [],
) {
  return `<main class="seo-static-fallback"><article><h1>${escapeHtml(heading)}</h1><p>${escapeHtml(body)}</p>${renderLinkList(links)}</article></main>`
}

function renderLinkList(links: readonly PublicArchitectureLink[]) {
  if (!links.length) return ''
  return `<ul>${links.map((link) => `<li><a href="${escapeAttribute(link.path)}">${escapeHtml(link.label)}</a></li>`).join('')}</ul>`
}

function selectRepresentativeStops(stops: CompetitionRouteStop[], maximum = 8) {
  if (stops.length <= maximum) return stops
  const indexes = new Set<number>()
  for (let index = 0; index < maximum; index += 1) {
    indexes.add(Math.round((index * (stops.length - 1)) / (maximum - 1)))
  }
  return [...indexes].map((index) => stops[index])
}

function loadCompetitionRouteSnapshot(): CompetitionRouteSnapshot | undefined {
  try {
    const raw = readFileSync(
      path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        '../scripts/data/2026-competition-stops.json',
      ),
      'utf8',
    )
    const parsed = JSON.parse(raw) as Partial<CompetitionRouteSnapshot>
    if (
      typeof parsed.routeName !== 'string'
      || typeof parsed.capturedAt !== 'string'
      || !Array.isArray(parsed.stops)
    ) {
      return undefined
    }
    const stops = parsed.stops.filter(isCompetitionRouteStop)
    return stops.length ? { routeName: parsed.routeName, capturedAt: parsed.capturedAt, stops } : undefined
  } catch {
    return undefined
  }
}

function isCompetitionRouteStop(value: unknown): value is CompetitionRouteStop {
  if (!value || typeof value !== 'object') return false
  const stop = value as Partial<CompetitionRouteStop>
  return typeof stop.address === 'string'
    && typeof stop.date === 'string'
    && /^\d{4}-\d{2}-\d{2}$/.test(stop.date)
    && typeof stop.day === 'number'
    && Number.isInteger(stop.day)
    && stop.day > 0
    && typeof stop.stationName === 'string'
}

function insertBeforeHeadEnd(html: string, content: string) {
  return html.replace('</head>', `    ${content}\n  </head>`)
}

function setMetaInHtml(
  html: string,
  attribute: 'name' | 'property',
  key: string,
  content: string,
) {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(`<meta\\s+[^>]*${attribute}=["']${escapedKey}["'][^>]*>`, 'i')
  const tag = `<meta ${attribute}="${escapeAttribute(key)}" content="${escapeAttribute(content)}" />`
  return pattern.test(html) ? html.replace(pattern, tag) : insertBeforeHeadEnd(html, tag)
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
