import {
  PRIVATE_PATHS,
  PUBLIC_PAGES,
  SITE_ORIGIN,
  isJournalPostPath,
} from '../src/site/sitePages'

interface PageMetadata {
  title: string
  description: string
  path: string
  robots?: 'index,follow' | 'noindex,nofollow'
  type?: 'website' | 'article'
}

export interface RenderedDocument {
  status: 200 | 404
  html: string
}

export interface JournalPostPreview {
  title: string
  body: string
}

const PUBLIC_BY_PATH = new Map<string, PageMetadata>(
  Object.values(PUBLIC_PAGES).map((page) => [page.path, page]),
)

/**
 * Fills the SPA shell's <head> with the right title and link-preview tags for
 * a path, so texts and social shares show a sensible card. Journal post links
 * get the post's own title when `findJournalPost` can resolve it.
 */
export function renderClientDocument(
  indexHtml: string,
  pathname: string,
  findJournalPost?: (id: string) => JournalPostPreview | undefined,
): RenderedDocument {
  const path = normalizePath(pathname)

  const page = PUBLIC_BY_PATH.get(path)
  if (page) return { status: 200, html: applyMetadata(indexHtml, page) }

  if (isJournalPostPath(path)) {
    const post = findJournalPost?.(path.slice('/journal/'.length))
    if (post) {
      return {
        status: 200,
        html: applyMetadata(indexHtml, {
          title: `${post.title} · ChargeQuest`,
          description: summarize(post.body) || PUBLIC_PAGES.journal.description,
          path,
          type: 'article',
        }),
      }
    }
  }

  if (PRIVATE_PATHS.has(path)) {
    return {
      status: 200,
      html: applyMetadata(indexHtml, {
        title: 'ChargeQuest',
        description: PUBLIC_PAGES.tracker.description,
        path,
        robots: 'noindex,nofollow',
      }),
    }
  }

  return {
    status: 404,
    html: applyMetadata(indexHtml, {
      title: 'Page not found · ChargeQuest',
      description: PUBLIC_PAGES.tracker.description,
      path,
      robots: 'noindex,nofollow',
    }),
  }
}

function applyMetadata(indexHtml: string, metadata: PageMetadata) {
  const canonical = `${SITE_ORIGIN}${metadata.path}`
  let html = indexHtml
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(metadata.title)}</title>`)
    .replace(/<link\s+rel="canonical"[\s\S]*?>/i, `<link rel="canonical" href="${escapeHtml(canonical)}" />`)

  const tags: Array<['name' | 'property', string, string]> = [
    ['name', 'description', metadata.description],
    ['name', 'robots', metadata.robots ?? 'index,follow'],
    ['property', 'og:url', canonical],
    ['property', 'og:title', metadata.title],
    ['property', 'og:description', metadata.description],
    ['property', 'og:type', metadata.type ?? 'website'],
    ['name', 'twitter:title', metadata.title],
    ['name', 'twitter:description', metadata.description],
  ]
  for (const [attribute, key, value] of tags) {
    html = setMetaInHtml(html, attribute, key, value)
  }
  return html
}

function summarize(body: string) {
  const text = body.replace(/\s+/g, ' ').trim()
  return text.length > 180 ? `${text.slice(0, 177).trimEnd()}…` : text
}

function setMetaInHtml(
  html: string,
  attribute: 'name' | 'property',
  key: string,
  content: string,
) {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(`<meta\\s+[^>]*${attribute}=["']${escapedKey}["'][^>]*>`, 'i')
  const tag = `<meta ${attribute}="${escapeHtml(key)}" content="${escapeHtml(content)}" />`
  return pattern.test(html) ? html.replace(pattern, tag) : html.replace('</head>', `    ${tag}\n  </head>`)
}

function normalizePath(pathname: string) {
  if (pathname === '/') return pathname
  return pathname.replace(/\/+$/, '')
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}
