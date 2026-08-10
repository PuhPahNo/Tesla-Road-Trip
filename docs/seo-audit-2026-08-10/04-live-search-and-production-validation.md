# Live Search and Production Validation

Audit date: August 10, 2026
Canonical production origin: `https://www.teslachargequest.com`
Repository state tested: `247a28e` on `main`, matching `origin/main` at the start of the audit

## Executive verdict

ChargeQuest is publicly crawlable and has real search visibility. The production implementation is materially better than a typical client-only SPA: public editorial routes return meaningful raw HTML, correct HTTP statuses, self-canonicals, and unique metadata before JavaScript runs.

The live evidence does **not** justify saying “Google Search Console will have no issues.” Search Console account data was not available in this audit, and several fixable weaknesses remain. The most important are:

1. Google is surfacing the homepage for a competition-route query instead of making the dedicated competition guide the obvious primary result.
2. Breadcrumb structured data creates intermediate `/competition`, `/badges`, and `/routes` URLs that return `404`.
3. The homepage mobile Lighthouse run recorded a very poor `9.8 s` LCP, driven mainly by an oversized, late-discovered hero image.
4. The live Track Anthony page says `LIVE NOW · DAY 1 OF 73` while identifying that day as September 27, 2026, which is still in the future on the audit date.
5. Search Console-specific evidence—indexing state, selected canonicals, crawl history, manual actions, security issues, and field Core Web Vitals—still must be collected.

## What was tested

The audit used four independent evidence lanes:

- Direct production HTTP requests, including a Googlebot user agent and JavaScript-disabled response inspection.
- A rendered browser inspection of the homepage, competition guide, and Track Anthony page.
- A focused live Google result check for the requested topic.
- Lighthouse 13.4.1 mobile lab runs against the homepage and competition guide.

These tests establish current public behavior. They do not replace Search Console, analytics, backlink, log-file, or field-performance data.

## Crawl and indexability results

### Intended public inventory

The sitemap and central SEO registry currently produce 17 intended indexable URLs:

- 3 core public surfaces: homepage, Community, and Track Anthony.
- 14 field-guide pages: 3 hubs, 3 competition guides, 4 badge guides, 3 route guides, and the author page.

All 17 returned the following in a Googlebot-style raw HTTP fetch:

- HTTP `200`.
- A unique `<title>`; 17 titles across 17 URLs.
- An exact self-referencing canonical on the `www` HTTPS origin.
- `<meta name="robots" content="index,follow">`.
- A meaningful raw-HTML fallback `<h1>`.

This is a major strength. Google does not need to wait for React merely to discover each page's title, canonical, H1, body copy, or related editorial links.

### Boundary behavior

| Check | Live result | Verdict |
|---|---:|---|
| `https://www.teslachargequest.com/robots.txt` | `200`, text/plain | Pass |
| `https://www.teslachargequest.com/sitemap.xml` | `200`, application/xml | Pass |
| Unknown public URL | Real `404`, HTML, `no-store` | Pass |
| `/planner` | `200` with `noindex,nofollow` in raw HTML | Pass; expected GSC exclusion |
| HTTP `www` to canonical | One `301` to HTTPS `www` | Pass |
| HTTPS apex to canonical | One `301` to HTTPS `www` | Pass |
| HTTP apex to canonical | Two `301` hops | Improve |
| Trailing-slash guide URL | `200`, canonical points to slashless URL | Valid canonical signal, but redirect is preferable |

Expected Search Console exclusions for `/login`, `/signup`, `/account`, `/admin`, `/admin/hotels`, `/planner`, and similar private URLs are not SEO failures. The audit company should separate intentional `noindex` exclusions from accidental exclusions instead of reporting a scary aggregate count.

### Redirect cleanup

`http://teslachargequest.com/` currently redirects to `https://teslachargequest.com/`, which then redirects to `https://www.teslachargequest.com/`. Configure the edge to send every noncanonical host/protocol combination directly to the final canonical URL in one permanent hop.

Public routes with a trailing slash currently return `200` and rely on `rel=canonical` to consolidate with the slashless URL. Add a permanent slash-normalization redirect if it can be done centrally and regression-tested without affecting API routes or the root path.

## Search visibility snapshot

Search results vary by location, device, history, datacenter, and time. The observations below are evidence that ChargeQuest is discoverable, **not** a promise of a stable rank.

### Focused Google observation

Observed query:

```text
"2026 tesla supercharging competition" route
```

In the live Google result set observed on August 10, 2026:

- `ChargeQuest CORE | Tesla Supercharger Route Planner for ...` was the first standard web result.
- Google also showed `Great American Icons Tesla Road Trip Idea | ChargeQuest` and `About Anthony Pappano, Creator of ChargeQuest`.
- The dedicated `/2026-tesla-supercharging-competition` guide was not the primary result shown for this route-focused query.

Interpretation: ChargeQuest already has topical recognition, but Google appears to associate the homepage more strongly with the competition-route intent than the dedicated guide. That may be acceptable for conversion, but it should be an explicit decision. The recommended target model is:

| Query intent | Preferred landing page |
|---|---|
| 2026 Tesla Supercharging Competition / rules / guide | `/2026-tesla-supercharging-competition` |
| 2026 competition route / route planning / build a route | A new first-person route-planning hub, or the competition guide until that page exists |
| Tesla Supercharger route planner | `/` |
| Longest Trip strategy | `/competition/longest-trip-strategy` |
| Most unique Supercharger sites | `/competition/most-unique-supercharger-sites` |

### Broader search-provider observations

For the unquoted query `2026 tesla supercharging competition`, the search provider returned Tesla's official competition page first and ChargeQuest's homepage second in the observed result set. For route/guide/planning variations, ChargeQuest's homepage was discoverable, but the returned result set did not consistently promote the dedicated competition guide.

A `site:teslachargequest.com` query returned the homepage in the search provider used here. `site:` queries are incomplete and are not an index coverage report, so this cannot be used to claim that only one page is indexed.

## Rendered-page observations

### Homepage

- Correct rendered title, description, canonical, `index,follow`, one H1, and `lang="en"`.
- The visible homepage links to all three main editorial hubs and the author page through crawlable anchors.
- The linked logo has an image alt of `ChargeQuest`, which gives the otherwise text-empty logo link usable alternative anchor text.
- The homepage retains a server-generated fallback for non-JavaScript crawlers and removes it once React renders, avoiding a duplicate visible article tree.

### Competition guide

- Correct rendered title, description, canonical, `index,follow`, H1, and substantial visible copy.
- Four contextual related-page links plus global footer links.
- Visible byline and updated date.
- CollectionPage and BreadcrumbList schema is added, but the base WebApplication schema remains in the document as a second JSON-LD block. This is not automatically invalid, but entity relationships should be made explicit and tested.
- The visible breadcrumb is only `ChargeQuest / 2026 competition field guide`; child pages also need their real hub in both visible breadcrumbs and schema.

### Track Anthony

The rendered page loaded successfully with no captured browser errors and exposed roughly 2,000 visible words from the public route. However, its state is internally contradictory on the audit date:

- `LIVE NOW · DAY 1 OF 73`
- `Current day 1`
- Selected day: `SUN, SEP 27`
- Audit date: August 10, 2026

This should be corrected immediately. It is a human-trust, snippet-quality, and freshness problem even if it does not directly block indexing. Pre-trip mode should not use `live now`, current-day progress, or a live-location H1 before departure.

## Mobile Lighthouse snapshot

Lighthouse is lab data, not field Core Web Vitals. Scores can move between runs. These runs are retained as a reproducible audit baseline.

### Homepage

| Category/metric | Result |
|---|---:|
| Performance | 70 |
| Accessibility | 87 |
| Best Practices | 100 |
| SEO | 100 |
| First Contentful Paint | 2.9 s |
| Largest Contentful Paint | 9.8 s |
| Total Blocking Time | 0 ms |
| Cumulative Layout Shift | 0 |
| Total transfer | 3,114 KiB |

The hero image `/landing/desert-road.jpg` was the LCP element. Lighthouse reported:

- The LCP request was not discoverable in the initial document.
- `fetchpriority="high"` was absent.
- The hero transferred about 1.25 MB.
- Total estimated image-delivery savings were about 2.3 MB.
- Roughly 154 KiB of JavaScript was unused on the homepage.
- The external IBM Plex Mono stylesheet and main CSS were render-blocking.
- Several small and low-opacity text treatments failed color contrast.
- Images lacked explicit width/height attributes.
- `maximum-scale=1` in the viewport prevented a perfect accessibility result.

This is the largest concrete organic-performance risk found in the audit. The first implementation batch should produce responsive AVIF/WebP hero variants, preload or otherwise expose the LCP request in the initial response, add `fetchpriority="high"`, size every image, and code-split route-specific application code out of the public landing bundle.

### Competition guide

| Category/metric | Result |
|---|---:|
| Performance | 85 |
| Accessibility | 89 |
| Best Practices | 100 |
| SEO | 100 |
| First Contentful Paint | 2.9 s |
| Largest Contentful Paint | 3.7 s |
| Total Blocking Time | 0 ms |
| Cumulative Layout Shift | 0 |
| Total transfer | 371 KiB |

The guide performs substantially better than the image-heavy homepage, but FCP/LCP, unused shared JavaScript, font loading, contrast, the viewport restriction, and unsized logos still need work.

## Search Console evidence still required

An external auditor should receive read-only access to Google Search Console and export evidence for:

1. **Page indexing:** submitted versus indexed URLs, all exclusion reasons, examples, and validation history.
2. **URL Inspection:** homepage, all three hubs, one child from each cluster, Track Anthony, Community, and one private URL.
3. **Google-selected canonical:** confirm it matches the declared canonical for every sampled public URL.
4. **Rendered HTML and screenshot:** verify Google sees the intended H1, body copy, links, schema, and public API-driven Track Anthony content.
5. **Sitemaps:** last read time, discovered URL count, status, and any parse warnings.
6. **Performance:** query/page/device/country exports for 3, 6, and 16 months; distinguish branded from non-branded queries.
7. **Core Web Vitals:** field URL groups and mobile/desktop status.
8. **Manual Actions and Security Issues:** screenshots showing no active issues, or a remediation plan if any exist.
9. **Crawl Stats:** host status, response codes, file types, average response time, and crawl spikes.
10. **Links:** top linked pages and domains, with an explicit note that GSC link data is a sample.

## Production re-test checklist

After each SEO release:

```bash
npm test
npm run build
npm run lint
curl -I https://www.teslachargequest.com/robots.txt
curl -I https://www.teslachargequest.com/sitemap.xml
curl -I https://www.teslachargequest.com/not-a-real-page
```

Then repeat the 17-route raw-HTML crawl, inspect rendered metadata in a browser, run mobile and desktop Lighthouse on the homepage plus one representative hub and child page, validate structured data, and use Search Console URL Inspection on the changed canonical URLs.

## Primary reference material

- [Tesla: 2026 Free Supercharging Competition](https://www.tesla.com/support/tesla-app/charging-badges/contest)
- [Google: JavaScript SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)
- [Google: Link best practices](https://developers.google.com/search/docs/crawling-indexing/links-crawlable)
- [Google: Breadcrumb structured data](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb)
- [Google: Build and submit a sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
