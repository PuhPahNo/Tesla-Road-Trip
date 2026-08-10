# ChargeQuest technical SEO and indexing audit

**Audit date:** August 10, 2026
**Repository state audited:** `main` at `247a28e`
**Canonical production origin:** `https://www.teslachargequest.com`
**Scope:** crawlability, indexability, public/private route boundaries, server rendering, metadata, canonicals, robots, sitemap, HTTP behavior, structured data, social metadata, performance/CWV risk, search-relevant semantics, automated coverage, and production-validation gaps.

## Executive verdict

**Verdict: the site has a sound crawl/indexing foundation, but it is not yet a clean technical-SEO pass.** All 17 sitemap URLs returned `200`, a self-referencing canonical, and `index,follow` in a live August 10 check. Unknown URLs returned a real `404` with `noindex,nofollow`; private routes returned `200` with `noindex,nofollow`; the canonical host and HTTPS redirects are active; XML is valid; and the 14 editorial pages include substantial server-delivered body copy rather than an empty SPA shell.

The remaining risks are concentrated and fixable:

1. `/track-anthony` contains the site's most distinctive route evidence, but the initial HTML has only a short generic fallback. Its 73-day route arrives through JavaScript from a public API that produced a **9.88-second cold-sample TTFB** and a **501,578-byte uncompressed payload**. A crawler that does not render JavaScript—or whose render times out—cannot see the actual route.
2. Every route currently receives a **952.13 kB minified / 278.16 kB gzip main JavaScript bundle**, because the planner, public tracker, Leaflet map, and large route code are eagerly imported. The homepage also starts with a **1.25 MB portrait JPEG** with no intrinsic dimensions, responsive source, preload, or `fetchpriority`. This is a material mobile LCP/INP/CLS risk until field data proves otherwise.
3. structured breadcrumbs for nested guides point to `/competition`, `/badges`, and `/routes`; those parent URLs return `404`, and the visible breadcrumb is not the same hierarchy as the JSON-LD breadcrumb.
4. metadata is duplicated between server and client registries and has already drifted on `/community` and `/track-anthony`. This creates different raw-HTML and rendered titles/descriptions.
5. trailing-slash URLs and `/index.html` remain crawlable `200` variants. Canonicals reduce duplication, but redirects would prevent crawl waste and make the preferred URL unambiguous.

This audit does **not** claim that Google has indexed, ranked, or selected the declared canonical for any URL. Only Google Search Console and live search-result testing can establish that.

## Evidence and methodology

Evidence labels used below:

- **Code:** direct inspection of the checked-out repository.
- **Automated:** six focused Vitest files, 14 tests, all passing on August 10.
- **Build:** a Vite production build written outside the repository to measure output; it completed with a `>500 kB` chunk warning.
- **Live:** read-only requests to the production site on August 10. All 17 sitemap URLs were fetched and checked for status, canonical, and robots. Additional status/header/API samples are documented below.
- **Requires Google/field validation:** GSC coverage, Google-selected canonical, rendered-page indexing, search rankings, Chrome UX Report data, and rich-result eligibility.

Severity means likely SEO impact, not code correctness. Effort is relative: **S** (hours), **M** (days), **L** (multi-day or architectural).

## Technical scorecard

| Area | Verdict | Evidence |
|---|---|---|
| Public route HTTP status | Strong | All 17 sitemap URLs returned `200` live; exact registry is in `server/seo.ts:29-62` and `src/seo/seoPages.ts:152-862`. |
| Unknown URL handling | Strong | Server returns a real `404`, no-store, and `noindex,nofollow` (`server/seo.ts:112-125`; `server/index.ts:707-720`). Live unknown route confirmed. |
| Private route indexing boundary | Strong | Seven explicit private paths receive `noindex,nofollow` (`server/seo.ts:64-72`, `server/seo.ts:100-109`). |
| Raw-HTML metadata | Strong with drift risk | Server replaces title, description, canonical, OG fields, robots, Twitter title/description, and optional JSON-LD (`server/seo.ts:146-171`). |
| Non-JavaScript content | Strong for 14 guides; weak for 3 main public surfaces | Full fallback renderer for editorial pages (`server/seo.ts:174-228`); minimal fallbacks for home/community/tracker (`server/seo.ts:29-62`). |
| Sitemap | Valid and complete; freshness weak | 17 valid XML URLs; generated during build (`package.json:13-19`; `server/seo.ts:128-144`). `lastmod` is static. |
| robots.txt | Strong | Global allow plus canonical sitemap reference (`public/robots.txt:1-4`). This lets crawlers reach private HTML and see its `noindex`, which is preferable to blocking it. |
| Canonical host | Strong live; not enforced in app code | Live apex/non-www/HTTP redirects reach `https://www.teslachargequest.com/`. Host behavior is external to Express. |
| Structured data | Useful but incomplete/inconsistent | Article/ProfilePage/CollectionPage plus BreadcrumbList (`src/seo/seoPages.ts:887-947`); broken logical parents and missing recommended article fields. |
| Social metadata | Functional but generic | Generic portrait OG/Twitter image in `index.html:29-36`; server customizes text/type but not imagery (`server/seo.ts:146-165`). |
| CWV readiness | High risk | 278.16 kB gzip main JS, 1.25 MB hero JPEG, no responsive images/intrinsic dimensions, and a large dynamic tracker payload. No field data was available. |
| Automated SEO regression coverage | Good base, important gaps | Existing tests cover status, sitemap membership, substantial copy, metadata presence, and schema shape (`server/seo.test.ts:9-49`; `src/seo/seoPages.test.ts:5-99`). |

## Strengths worth preserving

- The server, not only React effects, emits a unique title, description, canonical, OG URL/title/description/type, robots directive, Twitter title/description, structured data, and crawlable body for editorial pages (`server/seo.ts:74-97`, `server/seo.ts:146-171`).
- Unknown URLs do not receive an SPA `200`; they receive a genuine `404` and a useful HTML body (`server/seo.ts:112-125`). This materially lowers soft-404 risk.
- Route lookup is exact. Unknown slugs under otherwise valid React patterns do not become indexable (`src/site/Router.tsx:32-38`, `src/site/Router.tsx:98-102`).
- Private account, admin, and planner surfaces are deliberately excluded from search while remaining crawlable enough for bots to read the noindex directive (`server/seo.ts:64-72`, `server/seo.ts:100-109`).
- The sitemap is generated from the same editorial page registry used by the server, reducing omission risk (`server/seo.ts:128-144`; `server/generateSitemap.ts:1-10`).
- The editorial templates use one H1, nested H2s, semantic tables with captions and scoped headers, a visible author/update line, internal related links, and official-source links (`src/site/SeoPage.tsx:27-145`).
- Images on public content inspected have descriptive alt text, and primary/mobile navigation and the visual breadcrumb have accessible labels (`src/site/SiteShell.tsx:37-63`, `src/site/SiteShell.tsx:108-124`; `src/site/LandingPage.tsx:29-33`; `src/site/CommunityPage.tsx:74-80`).
- Live response compression is active even though it is not configured in this repository. HTML and the public route API returned gzip content in the production check.

## Findings

### T-01 — The public 73-day route is not in initial HTML and has a high cold-render dependency

**Severity:** High
**Impact:** Indexability, long-tail relevance, scraping reliability, rendering reliability
**Effort:** M–L

**Evidence**

- The server fallback for `/track-anthony` is only a heading and one sentence (`server/seo.ts:53-61`, `server/seo.ts:224-228`). It contains no days, route stops, cities, dates, mileage, station names, or journal entries.
- Before React starts, the client removes the server fallback (`src/main.tsx:8-16`). The shared shell withholds public content while the auth session loads (`src/site/AuthContext.tsx:29-45`; `src/site/SiteShell.tsx:29-31`).
- The actual route and timeline are fetched after mount (`src/site/TrackAnthonyPage.tsx:61-85`) from `/api/community` and `/api/community/anthony-route` (`src/api/siteClient.ts:310-319`).
- The route endpoint can fetch station data, optimize the route, refine road legs, and build a large response before returning (`server/community.ts:93-113`; `server/anthonyRoute.ts:53-178`). Its in-memory cache key includes the station snapshot time (`server/anthonyRoute.ts:74-85`), so cold service starts and refreshed station snapshots can repeat expensive work.
- One live cold sample returned after **9.88 seconds**, with a **501,578-byte JSON body before gzip / about 99 kB transferred after gzip**, containing 73 days, 73 visits, and 8,605 road points. Three immediate warm samples returned in 0.14–0.20 seconds. This is a point sample, not a controlled load test, but the variance is large enough to treat as a render-budget risk.

**Why it matters**

Google can render JavaScript, but rendering is deferred and not guaranteed to wait indefinitely for expensive data. Other crawlers, AI/search agents, link unfurlers, and simple scrapers may use initial HTML only. The unique evidence that could support searches such as “2026 Tesla supercharging competition route,” “route plan,” individual stop names, and day-by-day itinerary terms is therefore absent from the most reliable crawl surface.

**Recommended fix**

Precompute a public, cacheable route publication whenever Anthony publishes or changes the route. Serve a bounded HTML route summary in the initial document—route name, departure date, totals, major regions/stops, and links/anchors for every day—and hydrate the interactive map afterward. Do not run full optimization in the request path for crawlers. A static snapshot is simpler, cheaper, reversible, and more reliable than full general-purpose SSR.

**Acceptance criteria**

- `curl` of `/track-anthony` contains the current route name, date, totals, representative locations, and day links without executing JavaScript.
- The initial HTML remains useful if `/api/community/anthony-route` is slow or unavailable.
- Published route data has explicit cache headers/ETag and invalidates on publication changes.
- Cold `/track-anthony` content becomes available within an agreed server budget, ideally under 1 second at the HTML edge.

### T-02 — The main bundle eagerly ships the planner and map to every public page

**Severity:** High
**Impact:** Mobile LCP, INP, crawl rendering cost, conversion
**Effort:** M

**Evidence**

- `Router.tsx` eagerly imports the full planner `App`, Track Anthony, all public pages, and their dependencies; only the admin hotels screen is lazy (`src/site/Router.tsx:1-21`).
- Track Anthony eagerly imports `MapView` (`src/site/TrackAnthonyPage.tsx:27`), and `MapView` imports React Leaflet plus the full U.S. state GeoJSON (`src/components/MapView.tsx:1-29`).
- The audit build produced one main JavaScript chunk of **952.13 kB minified / 278.16 kB gzip**, plus **119.67 kB CSS / 24.80 kB gzip**. Vite emitted a chunk-over-500-kB warning.

**Why it matters**

A competition guide or homepage visit should not pay the parsing and execution cost of the authenticated planner and interactive national map. The problem is especially relevant on mobile and for Google's renderer. A fast server response does not offset heavy client parse/execute work.

**Recommended fix**

Lazy-load route families: planner, Track Anthony/map, admin, auth/account, and optionally the editorial shell. Keep the public landing and static SEO content in a small shared entry. Load Leaflet, GeoJSON, and the road map only when the tracker/map is visible. Add a bundle budget to CI.

**Acceptance criteria**

- Homepage and editorial-guide initial JS is below an agreed budget (reasonable first target: under 150 kB gzip).
- Leaflet, U.S. GeoJSON, planner optimizer/UI, and route planner code do not appear in the home/guide initial chunks.
- Route transitions retain loading and error states without layout jumps.

### T-03 — Hero images create an avoidable LCP and CLS risk

**Severity:** High
**Impact:** Core Web Vitals, mobile rankings, user experience
**Effort:** S–M

**Evidence**

- `/landing/desert-road.jpg` is **1,248,411 bytes** and **2200×2750**. It is used as the above-the-fold home hero (`src/site/LandingPage.tsx:28-35`) and Community hero (`src/site/CommunityPage.tsx:74-80`).
- Public landing images are JPEG-only. The inspected `<img>` elements do not declare `width`/`height`, `srcset`, `sizes`, or modern AVIF/WebP alternatives (`src/site/LandingPage.tsx:29-33`, `src/site/LandingPage.tsx:157-188`, `src/site/LandingPage.tsx:228-232`, `src/site/LandingPage.tsx:449`).
- The hero is eager by default, but it is not preloaded or marked `fetchpriority="high"`. The browser must discover it after parsing HTML/CSS.
- The viewport also includes `maximum-scale=1` (`index.html:10-13`), which is an accessibility regression and can fail audit checks.

**Recommended fix**

Create responsive AVIF/WebP/JPEG variants sized for actual breakpoints; use `<picture>`, `srcset`, and `sizes`; declare intrinsic dimensions/aspect ratio; preload only the route-specific LCP image and set `fetchpriority="high"`; lazy-load below-fold images. Use a landscape social asset separately. Remove `maximum-scale=1` unless a documented product constraint requires it.

**Acceptance criteria**

- Mobile hero transfer is materially smaller (target 100–250 kB, quality-reviewed).
- No image-caused layout shift in Lighthouse/DevTools.
- Mobile PageSpeed and real-user CWV show passing LCP/CLS at the 75th percentile; lab results alone are not sufficient.

### T-04 — Nested breadcrumb structured data points to 404 parents and does not match the visible trail

**Severity:** Medium
**Impact:** Breadcrumb rich-result eligibility, crawl clarity, information architecture
**Effort:** S

**Evidence**

- Breadcrumb JSON-LD is inferred mechanically from every URL segment (`src/seo/seoPages.ts:887-897`). This generates `/competition`, `/badges`, and `/routes` as intermediate items.
- Those paths are not public routes in the React router (`src/site/Router.tsx:32-38`) or server registry; live `/competition/` returned `404`.
- Real hubs exist at `/2026-tesla-supercharging-competition`, `/tesla-iconic-charger-badges`, and `/tesla-road-trip-routes` (`src/seo/seoPages.ts:154`, `src/seo/seoPages.ts:345`, `src/seo/seoPages.ts:577`).
- The visible breadcrumb renders only `ChargeQuest / {eyebrow}` and does not link a hub (`src/site/SeoPage.tsx:27-31`). That is not the same trail declared in JSON-LD.

**Recommended fix**

Add an explicit breadcrumb trail to each page record. Point nested competition guides to the competition hub, badge guides to the badge hub, and route ideas to the route hub. Render the exact same hierarchy visibly and in JSON-LD. Do not manufacture URL-segment parents.

**Acceptance criteria**

- Every breadcrumb `item` URL returns `200` and is indexable.
- Visible and structured trails contain the same ordered labels and links.
- Google Rich Results Test and Schema Markup Validator report no breadcrumb errors.

### T-05 — Server and client metadata have already drifted

**Severity:** Medium
**Impact:** Snippet consistency, rendered-vs-raw indexing, maintainability
**Effort:** S–M

**Evidence**

- Server metadata is defined separately in `server/seo.ts:29-62`; client metadata is repeated inside each page component.
- `/community` raw/live server title is `Send Anthony a Tesla Route Idea | ChargeQuest` (`server/seo.ts:44-51`), while React changes it to `Send Anthony a Route Idea | ChargeQuest Community` (`src/site/CommunityPage.tsx:26-30`). Descriptions also differ.
- `/track-anthony` has matching titles but different server and client descriptions (`server/seo.ts:53-60`; `src/site/TrackAnthonyPage.tsx:61-65`).
- `usePageMetadata` updates title, description, OG text/URL, robots, canonical, and page schema, but it does not update `og:type`, Twitter title/description/image, or page-specific social images (`src/site/usePageMetadata.ts:17-39`). A client navigation away from an article can therefore leave stale social metadata in the live DOM.

**Recommended fix**

Create one typed registry for every public route, used by server rendering, React, sitemap, and tests. Include title, description, canonical path, robots, OG type/image/alt, Twitter fields, schema, breadcrumb, and `lastmod`. Add an equality test between raw server output and post-render metadata.

### T-06 — Sitemap and structured `dateModified` freshness is manually frozen

**Severity:** Medium
**Impact:** Recrawl hints, trust in update labels, GSC sitemap diagnostics
**Effort:** S

**Evidence**

- `SEO_UPDATED_AT` is hard-coded to `2026-07-19` and reused by most editorial records (`src/seo/seoPages.ts:5-6`).
- Home, Community, and Track Anthony also receive that same date in the sitemap (`server/seo.ts:128-134`).
- The production sitemap reported `/track-anthony` last modified July 19 even though `git log` shows its current file changed on August 7 (`f94a85e`).
- Article/Profile schema sets `dateModified` from the same page date (`src/seo/seoPages.ts:903-935`). No `datePublished` is recorded.

**Recommended fix**

Store `publishedAt` and `updatedAt` per public route. For dynamic tracker content, use the latest route-publication or public-entry timestamp. Only advance dates when visible content materially changes; do not set all pages to build time. Generate sitemap and schema from the same values.

### T-07 — Duplicate URL variants return `200` instead of redirecting

**Severity:** Medium
**Impact:** Crawl budget, canonical consolidation, analytics fragmentation
**Effort:** S

**Evidence**

- The renderer strips a trailing slash for lookup and emits the non-slash canonical, but never redirects (`server/seo.ts:74-76`, `server/seo.ts:235-238`). Live `/competition/longest-trip-strategy/` returned `200` with canonical to the non-slash URL.
- `express.static` runs before the route renderer (`server/index.ts:697-706`), so live `/index.html` returns `200` with the homepage canonical rather than redirecting to `/`.
- Live HTTP apex required two redirects (`http://teslachargequest.com/` → HTTPS apex → HTTPS www). All variants ultimately converged correctly, but one-hop normalization is cleaner.

**Recommended fix**

Use permanent redirects for `/index.html` → `/`, known trailing-slash variants → non-slash, HTTP → HTTPS, and apex → www. Configure host redirects at the edge/DNS layer and path redirects in Express before static serving. Preserve query strings where appropriate.

### T-08 — Article and site schema omit useful identity and rich-result fields

**Severity:** Medium
**Impact:** Entity clarity and article enhancement eligibility; not basic indexing
**Effort:** S–M

**Evidence**

- Article schema includes headline, description, URL, dateModified, author, and publisher, but no `datePublished`, representative `image`, `mainEntityOfPage`, or stable `@id` links (`src/seo/seoPages.ts:920-935`).
- The base WebApplication schema has creator/provider but no logo/image or stable entity IDs (`index.html:44-77`). It remains in every route document in addition to route-specific schema.
- The ProfilePage author has no `sameAs` links; this may be intentional if no authoritative profiles are available and should not be fabricated (`src/seo/seoPages.ts:898-919`).

**Recommended fix**

Define stable `Organization`, `WebSite`, `WebApplication`, and `Person` nodes with `@id`, then reference them. Add truthful `datePublished`, `dateModified`, `mainEntityOfPage`, and page-specific image data to articles. Add `sameAs` only for real, controlled profiles. Validate rendered production output; schema completeness does not guarantee a rich result.

### T-09 — Open Graph and Twitter use one generic portrait image for every page

**Severity:** Medium
**Impact:** Social click-through, share rendering, indirect discovery
**Effort:** S–M

**Evidence**

- Every route inherits `/landing/desert-road.jpg` for `og:image` and `twitter:image` (`index.html:29-36`). The source is portrait (2200×2750), while common link previews are landscape.
- The server replaces route text and OG type but not image, image alt, dimensions, MIME type, locale, Twitter site/creator, or article dates (`server/seo.ts:146-165`).

**Recommended fix**

Create reviewed 1200×630 assets for the competition hub, strategy cluster, badges, route ideas, and Anthony tracker. Add `og:image:alt`, width, height, type, `og:locale`, and appropriate article metadata. Keep Twitter in the same registry. Test URLs in platform-specific sharing debuggers after deployment.

### T-10 — Several titles/descriptions are likely to truncate and are tested by character count, not SERP width

**Severity:** Low
**Impact:** Search-result clarity and click-through, not indexability
**Effort:** S

**Evidence**

- Current editorial titles range up to 65 characters and descriptions up to 169 characters. Examples include the 65-character Most Energy title (`src/seo/seoPages.ts:299-304`), the 64-character Iconic Charger title with 166-character description (`src/seo/seoPages.ts:345-350`), and the 169-character Great American Icons description (`src/seo/seoPages.ts:744-749`).
- Tests enforce description length of 110–170 characters but do not test title uniqueness by rendered pixel width or prioritize the distinguishing phrase (`src/seo/seoPages.test.ts:5-31`).

**Recommended fix**

Review snippets by desktop/mobile pixel width, not a hard character superstition. Put the unique search intent first, retain the ChargeQuest suffix only where it fits, and keep every description accurate even when Google rewrites it.

### T-11 — Production revision cannot be proven from the health endpoint

**Severity:** Medium
**Impact:** Audit/release confidence, regression diagnosis
**Effort:** S

**Evidence**

- `/api/health` reports service, time, routing, and account state but no commit/release identifier (`server/index.ts:197-205`).
- Live behavior matched the audited code on the tested SEO boundaries, but the public service does not expose evidence that it is running commit `247a28e`.

**Recommended fix**

Inject a non-secret build revision and deployed-at timestamp into the health response and optionally an HTML response header. SEO release QA should record exact SHA, sitemap hash, and post-deploy checks.

### T-12 — API and non-HTML crawl directives are implicit

**Severity:** Low
**Impact:** Crawl hygiene
**Effort:** S

**Evidence**

- Global headers contain security directives but no `X-Robots-Tag` (`server/index.ts:186-195`).
- Public JSON endpoints such as `/api/community` and `/api/community/anthony-route` return `200` JSON and are referenced by client code. The live API response did not include `X-Robots-Tag`.

**Recommended fix**

Set `X-Robots-Tag: noindex, nofollow` on `/api/*`, non-public files, and any private downloadable formats. Keep robots.txt permissive enough for Google to fetch HTML noindex pages. Do not block assets required for rendering.

### T-13 — Existing tests miss production-equivalence and performance regressions

**Severity:** Medium
**Impact:** Future reliability
**Effort:** M

**Evidence**

- Server tests correctly loop through all editorial routes and test crawlable copy, canonical presence, noindex boundaries, 404 status, and sitemap membership (`server/seo.test.ts:9-49`).
- Content tests check uniqueness, word count, descriptions, related links, selected schema fields, and official sources (`src/seo/seoPages.test.ts:5-99`).
- They do not test public-page server/client metadata equality, trailing-slash/index.html redirects, breadcrumb item status, schema validation, OG/Twitter completeness, sitemap `lastmod` freshness, cold tracker behavior, bundle budgets, image budgets, HTML heading landmarks, or live host redirects.

**Recommended fix**

Add fast registry/unit checks first, then a small post-deploy smoke suite. Avoid a brittle, all-purpose crawler; test explicit contracts: every public URL, every private URL, every breadcrumb URL, every canonical variant, metadata equality, asset budgets, and exact deployed SHA.

## Public-route indexability matrix

All rows below were present in the live sitemap and returned `200`, `index,follow`, and a self-referencing canonical on August 10, 2026.

| Public route | Intent/type | Initial HTML body | Sitemap | Main technical note |
|---|---|---:|---:|---|
| `/` | Product/home | Minimal | Yes | Rich React page; initial fallback is one paragraph plus three guide links. |
| `/community` | Private-suggestion landing | Minimal | Yes | Server/client title and description differ. |
| `/track-anthony` | Public route and journal | Minimal | Yes | Core route evidence depends on JS and a potentially slow/large API response. |
| `/2026-tesla-supercharging-competition` | Competition hub | Full | Yes | Strong raw HTML; CollectionPage + breadcrumb schema. |
| `/competition/longest-trip-strategy` | Strategy article | Full | Yes | Structured parent `/competition` returns 404. |
| `/competition/most-unique-supercharger-sites` | Strategy article | Full | Yes | Structured parent `/competition` returns 404. |
| `/competition/most-energy-supercharged` | Strategy article | Full | Yes | Title is likely to truncate; structured parent returns 404. |
| `/tesla-iconic-charger-badges` | Badge hub | Full | Yes | Strong raw HTML; generic OG image. |
| `/badges/grand-canyon` | Badge article | Full | Yes | Structured parent `/badges` returns 404. |
| `/badges/yellowstone` | Badge article | Full | Yes | Structured parent `/badges` returns 404. |
| `/badges/yosemite` | Badge article | Full | Yes | Structured parent `/badges` returns 404. |
| `/badges/tesla-diner` | Badge article | Full | Yes | Structured parent `/badges` returns 404. |
| `/tesla-road-trip-routes` | Route-ideas hub | Full | Yes | Strong raw HTML; generic OG image. |
| `/routes/tesla-route-66-supercharger-road-trip` | Route article | Full | Yes | Structured parent `/routes` returns 404. |
| `/routes/tesla-national-parks-road-trip` | Route article | Full | Yes | Structured parent `/routes` returns 404. |
| `/routes/great-american-icons` | Route article | Full | Yes | Structured parent `/routes` returns 404; description is 169 characters. |
| `/about-anthony` | Author/ProfilePage | Full | Yes | Good author destination; schema could gain stable IDs/verified profiles. |

### Explicit non-indexable/status boundaries

| Route class | Expected response | Live/code verdict |
|---|---|---|
| `/login`, `/signup`, `/change-password`, `/account`, `/admin`, `/admin/hotels`, `/planner` | `200` + `noindex,nofollow` | Correct by code; `/planner` confirmed live. |
| Unknown document route | `404` + `noindex,nofollow` + `no-store` | Correct by code and live sample. |
| Unknown `/api/*` route | JSON `404` | Correct in `server/index.ts:707-720`; add X-Robots-Tag to API class. |
| `/competition`, `/badges`, `/routes` | Currently `404` | Fine as routes, but incorrect as BreadcrumbList item URLs. |
| Known trailing-slash variant | Currently `200` + canonical to non-slash | Canonical is correct; permanent redirect is preferable. |
| `/index.html` | Currently `200` + homepage canonical | Redirect to `/`. |

## Google Search Console issue forecast

This is a forecast from technical behavior, not a reading of the site's GSC property.

| GSC/Page Indexing outcome | Forecast | Interpretation/action |
|---|---|---|
| **Submitted and indexed** | Plausible for all 17 sitemap URLs | Technical eligibility is strong, but verify each representative template with URL Inspection. |
| **Crawled – currently not indexed** | Moderate risk | Most likely for newer/template-similar pages or `/track-anthony` if rendered content is delayed. Inspect Google's rendered HTML, canonical selection, and duplication—not only word count. |
| **Discovered – currently not indexed** | Low–moderate risk | Could occur while the cluster is new or weakly linked externally. Internal links exist, but GSC is required to confirm. |
| **Excluded by `noindex`** | Expected | Private/auth/admin/planner URLs may appear here. This is healthy if the canonical shown is the private URL itself. |
| **Not found (404)** | Expected for junk URLs; problematic for breadcrumb parents | `/competition`, `/badges`, and `/routes` may be discovered from structured data despite returning 404. Fix the structured trail. |
| **Page with redirect** | Expected | HTTP and apex host variants. Keep redirect chains to one hop. |
| **Alternate page with proper canonical** | Likely if discovered | Trailing slashes and `/index.html` can land here. Redirect them to reduce noise. |
| **Duplicate without user-selected canonical** | Low risk | Canonicals are present server-side. Verify Google-selected canonical in URL Inspection. |
| **Soft 404** | Low risk | Unknown pages already return real 404s with useful but concise content. |
| **Blocked by robots.txt** | Low risk | robots.txt allows all. Do not disallow private HTML before Google can see its noindex. |
| **Server error (5xx)** | Low for HTML; render-incomplete risk on tracker | The document can stay `200` while the route API is slow/fails, so GSC may show a rendered-content problem rather than a 5xx. |
| **Breadcrumb enhancement suppressed/warned** | Moderate risk | Intermediate structured URLs return 404 and visible/structured trails differ. Validate after correcting. |
| **Article enhancement warnings** | Moderate risk | Missing image/datePublished/mainEntityOfPage may reduce eligibility; not necessarily a blocking error. |
| **Core Web Vitals: poor/needs improvement** | Material risk | Bundle and image evidence justify concern, but only CrUX/GSC field data can confirm. |

## Prioritized remediation plan

### P0 — Fix before treating technical SEO as release-ready

1. **Publish a static route snapshot for `/track-anthony`.** Precompute on route publication; put meaningful day/stop content in initial HTML; keep the map as progressive enhancement.
2. **Split the public bundles by route family.** Keep planner, Leaflet/map, GeoJSON, and tracker interaction out of home/guide initial JS.
3. **Optimize LCP images.** Responsive modern formats, intrinsic dimensions, landscape-specific crops, preload/fetch priority for the actual hero only.
4. **Replace inferred breadcrumbs with explicit real-hub trails** and render the same trail visibly and in JSON-LD.
5. **Unify public metadata into one registry** used by server, client, sitemap, schema, and social tags.

### P1 — Complete the indexing and entity layer

6. Add truthful per-route `publishedAt`/`updatedAt`; regenerate sitemap and schema from them.
7. Redirect `/index.html`, known trailing slashes, and host/scheme variants directly to canonical URLs.
8. Add page-specific 1200×630 social assets and complete OG/Twitter fields.
9. Strengthen structured identity with stable IDs and truthful article fields.
10. Expose build revision/deployed timestamp for exact-SHA production verification.

### P2 — Prevent regressions and observe field behavior

11. Add registry equality, breadcrumb-status, redirect, sitemap-freshness, bundle, and image-budget tests.
12. Add `X-Robots-Tag` for API/non-HTML private output.
13. Add privacy-appropriate real-user Web Vitals collection or regularly review GSC/CrUX, segmented by home, tracker, hub, and article templates.
14. Re-run live crawl and GSC validation after each material route publication, not only after code changes.

## Verification checklist

### Repository/build checks

```bash
npm test -- server/seo.test.ts src/seo/seoPages.test.ts src/site/Router.test.tsx src/site/LandingPage.test.tsx src/site/CommunityPage.test.tsx src/site/TrackAnthonyPage.test.tsx
npm run build
xmllint --noout public/sitemap.xml
git diff --check
```

Add CI assertions for:

- exact public/private route lists;
- unique server and rendered title/description/canonical/robots;
- every sitemap URL present once and every `lastmod` sourced from its page record;
- every BreadcrumbList `item` URL returning `200`;
- no private URL in the sitemap;
- real 404 for unknown route and unknown SEO slug;
- permanent redirects for canonical variants;
- initial JS/CSS and public image budgets;
- one H1 and a logical heading sequence per public template;
- JSON-LD parses and passes schema-level contract tests.

### Live HTTP checks

```bash
curl -sSIL https://www.teslachargequest.com/
curl -sSIL https://teslachargequest.com/
curl -sSIL http://www.teslachargequest.com/
curl -sSIL https://www.teslachargequest.com/index.html
curl -sSIL https://www.teslachargequest.com/2026-tesla-supercharging-competition/
curl -sSIL https://www.teslachargequest.com/planner
curl -sSIL https://www.teslachargequest.com/not-a-real-page
curl -sS https://www.teslachargequest.com/robots.txt
curl -sS https://www.teslachargequest.com/sitemap.xml | xmllint --noout -
```

For every sitemap URL, assert:

- final status `200`;
- exactly one self-referencing canonical;
- `index,follow` (or no restrictive directive);
- a unique title and description;
- useful body copy in `curl`, not only after JavaScript;
- one valid page schema and the shared entity graph;
- no console/network errors in a rendered desktop and mobile browser.

For every private URL, assert `noindex,nofollow`; for every unknown route, assert a real `404` and `noindex,nofollow`.

### Google and field checks that code cannot prove

1. Submit `https://www.teslachargequest.com/sitemap.xml` in GSC and confirm the fetched URL count is 17 after deployment.
2. Use URL Inspection on at least: `/`, `/track-anthony`, the competition hub, one strategy article, one badge article, one route article, `/about-anthony`, `/planner`, and a deliberate 404.
3. Compare **view crawled page** HTML/screenshot with the live page. On `/track-anthony`, confirm route name, day/stop text, and links appear in Google's rendered HTML.
4. Record Google's selected canonical, last crawl, index status, referring sitemaps, and page resources for each template.
5. Review Page Indexing reasons weekly for the first 6–8 weeks after material changes.
6. Run Rich Results Test and Schema Markup Validator on every schema template after breadcrumb/entity repairs.
7. Review GSC Core Web Vitals and PageSpeed Insights mobile/desktop. Segment home, tracker, hubs, and articles; do not extrapolate one lab run to the whole site.
8. Test social previews with Facebook Sharing Debugger, LinkedIn Post Inspector, and platform-appropriate Twitter/X tooling.
9. Check live search results separately for the target query set. A technically indexable page does not prove ranking for “2026 tesla supercharging competition,” “route,” “guide,” “planning,” or their variants.

## Production-vs-code gaps that must remain explicit

- The checked-out code does not expose a deployed commit, so exact production parity is not currently provable.
- No GSC property data was available in this workstream. Index coverage, Google-selected canonicals, manual actions, security issues, crawl stats, and enhancement reports are unknown.
- No CrUX/GSC field CWV data was available. Code and build measurements identify risk, not the 75th-percentile outcome.
- The live tracker API timing is a small point sample. Repeat from multiple regions, after a cold deploy, after the hourly station refresh, and under realistic concurrency.
- Live host redirects appear correct today but are controlled outside this repository and can drift with DNS/hosting changes.
- Search ranking and result snippets are not guaranteed by metadata, sitemap inclusion, or passing tests. Measure them independently over time.

## Bottom line

Google can crawl and index the current public site, and the editorial content routes are substantially better protected from SPA failure than most React sites. The next technical SEO investment should not be more meta-tag decoration. It should make the unique 2026 route evidence available in initial HTML, dramatically reduce the public JavaScript/image cost, make breadcrumbs truthful, and eliminate metadata duplication. Those changes improve search engines, scrapers, accessibility, performance, and maintainability at the same time.
