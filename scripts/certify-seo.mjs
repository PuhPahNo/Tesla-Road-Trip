#!/usr/bin/env node

const baseUrl = new URL(process.env.SEO_BASE_URL ?? 'http://127.0.0.1:4177')
const expectedOrigin = process.env.SEO_EXPECTED_ORIGIN ?? 'https://www.teslachargequest.com'
const privatePaths = [
  '/login',
  '/signup',
  '/change-password',
  '/dashboard',
  '/account',
  '/admin',
  '/admin/hotels',
  '/planner',
]

const failures = []
const checkedBreadcrumbs = new Set()

function record(condition, message) {
  if (!condition) failures.push(message)
}

function localUrl(pathname) {
  return new URL(pathname, baseUrl)
}

function expectedCanonical(pathname) {
  return `${expectedOrigin}${pathname === '/' ? '/' : pathname.replace(/\/$/, '')}`
}

async function fetchText(pathname, options = {}) {
  const response = await fetch(localUrl(pathname), options)
  return { response, body: await response.text() }
}

function firstMatch(body, pattern) {
  return body.match(pattern)?.[1]?.trim() ?? ''
}

function pageSchema(body) {
  const raw = firstMatch(
    body,
    /<script[^>]+data-page-schema[^>]*>([\s\S]*?)<\/script>/i,
  )
  if (!raw) return undefined
  try {
    return JSON.parse(raw)
  } catch {
    failures.push('A data-page-schema block was not valid JSON')
    return undefined
  }
}

function breadcrumbUrls(schema) {
  const graph = Array.isArray(schema?.['@graph']) ? schema['@graph'] : []
  const breadcrumb = graph.find((node) => node?.['@type'] === 'BreadcrumbList')
  return (breadcrumb?.itemListElement ?? [])
    .map((item) => item?.item)
    .filter((item) => typeof item === 'string')
}

async function sitemapPaths() {
  const { response, body } = await fetchText('/sitemap.xml')
  record(response.status === 200, `/sitemap.xml returned ${response.status}`)
  record(
    response.headers.get('content-type')?.includes('xml'),
    '/sitemap.xml did not use an XML content type',
  )
  const locations = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1])
  record(locations.length > 0, '/sitemap.xml did not contain any URLs')
  return locations.map((location) => {
    const url = new URL(location)
    record(url.origin === expectedOrigin, `Sitemap URL uses unexpected origin: ${location}`)
    return url.pathname
  })
}

async function checkPublicPage(pathname) {
  const { response, body } = await fetchText(pathname, {
    headers: { 'User-Agent': 'ChargeQuest-SEO-Certification/1.0' },
  })
  const canonical = firstMatch(body, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)/i)
  const robots = firstMatch(body, /<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)/i)
  const title = firstMatch(body, /<title>([\s\S]*?)<\/title>/i)
  const h1 = firstMatch(body, /<h1[^>]*>([\s\S]*?)<\/h1>/i).replace(/<[^>]+>/g, '').trim()
  const socialImage = firstMatch(body, /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)/i)
  const schema = pageSchema(body)

  record(response.status === 200, `${pathname} returned ${response.status}`)
  record(canonical === expectedCanonical(pathname), `${pathname} canonical was ${canonical || 'missing'}`)
  record(robots.toLowerCase() === 'index,follow', `${pathname} robots was ${robots || 'missing'}`)
  record(Boolean(title), `${pathname} did not contain a title`)
  record(Boolean(h1), `${pathname} did not contain a server-delivered H1`)
  record(socialImage.startsWith(`${expectedOrigin}/social/`), `${pathname} has an invalid social image: ${socialImage || 'missing'}`)
  record(Boolean(schema), `${pathname} did not contain valid page structured data`)
  if (pathname === '/track-anthony') {
    record(body.includes('data-track-route-summary'), '/track-anthony did not contain the static route summary')
    record(body.includes('dated Supercharger stops'), '/track-anthony did not contain dated stop evidence')
  }

  for (const item of breadcrumbUrls(schema)) {
    const url = new URL(item, expectedOrigin)
    record(url.origin === expectedOrigin, `${pathname} has an off-site breadcrumb item: ${item}`)
    checkedBreadcrumbs.add(url.pathname)
  }
}

async function checkRedirect(pathname, expectedPath) {
  const response = await fetch(localUrl(pathname), { redirect: 'manual' })
  const location = response.headers.get('location')
  record([301, 308].includes(response.status), `${pathname} returned ${response.status}, expected a permanent redirect`)
  if (location) {
    const redirected = new URL(location, baseUrl)
    record(
      `${redirected.pathname}${redirected.search}` === expectedPath,
      `${pathname} redirected to ${redirected.pathname}${redirected.search}, expected ${expectedPath}`,
    )
  } else {
    record(false, `${pathname} did not return a Location header`)
  }
}

async function main() {
  const robots = await fetchText('/robots.txt')
  record(robots.response.status === 200, `/robots.txt returned ${robots.response.status}`)
  record(/Sitemap:\s+\S+\/sitemap\.xml/i.test(robots.body), '/robots.txt does not declare the sitemap')

  const publicPaths = await sitemapPaths()
  record(new Set(publicPaths).size === publicPaths.length, 'The sitemap contains duplicate paths')
  await Promise.all(publicPaths.map(checkPublicPage))

  for (const breadcrumbPath of checkedBreadcrumbs) {
    record(publicPaths.includes(breadcrumbPath), `Breadcrumb target is not in the public sitemap: ${breadcrumbPath}`)
  }

  await Promise.all(privatePaths.map(async (pathname) => {
    const { response, body } = await fetchText(pathname)
    const robotsValue = firstMatch(body, /<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)/i)
    record(response.status === 200, `${pathname} returned ${response.status}`)
    record(robotsValue.toLowerCase() === 'noindex,nofollow', `${pathname} robots was ${robotsValue || 'missing'}`)
  }))

  const unknown = await fetchText('/seo-certification-not-found')
  record(unknown.response.status === 404, `Unknown HTML path returned ${unknown.response.status}`)
  record(/noindex,nofollow/i.test(unknown.body), 'Unknown HTML path was not noindex,nofollow')

  await checkRedirect('/index.html', '/')
  const slashCandidate = publicPaths.find((pathname) => pathname !== '/')
  if (slashCandidate) {
    await checkRedirect(`${slashCandidate}/?seo-cert=1`, `${slashCandidate}?seo-cert=1`)
  }

  const health = await fetch(localUrl('/api/health'))
  const healthPayload = await health.json().catch(() => ({}))
  record(health.status === 200, `/api/health returned ${health.status}`)
  record(
    health.headers.get('x-robots-tag')?.toLowerCase() === 'noindex, nofollow',
    '/api/health does not return X-Robots-Tag: noindex, nofollow',
  )
  record(Boolean(healthPayload.release?.revision), '/api/health does not expose a release revision')

  const routeResponse = await fetch(localUrl('/api/community/anthony-route'))
  record(routeResponse.status === 200, `/api/community/anthony-route returned ${routeResponse.status}`)
  record(
    routeResponse.headers.get('cache-control')?.includes('stale-while-revalidate'),
    '/api/community/anthony-route does not expose the public snapshot cache policy',
  )
  record(
    routeResponse.headers.get('x-robots-tag')?.toLowerCase() === 'noindex, nofollow',
    '/api/community/anthony-route does not return X-Robots-Tag: noindex, nofollow',
  )

  if (failures.length) {
    console.error(`SEO certification failed with ${failures.length} issue${failures.length === 1 ? '' : 's'}:`)
    for (const failure of failures) console.error(`- ${failure}`)
    process.exitCode = 1
    return
  }

  console.log(`SEO certification passed for ${publicPaths.length} public and ${privatePaths.length} private routes at ${baseUrl.origin}`)
}

await main()
