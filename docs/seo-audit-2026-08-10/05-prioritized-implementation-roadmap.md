# Prioritized SEO Implementation Roadmap

This roadmap converts the audit findings into small, reversible delivery batches. It does not authorize source-code changes or a production release. Each batch should be implemented, tested, deployed, and validated separately.

## Prioritization rules

Work is ordered by:

1. Factual/user harm before ranking opportunity.
2. Crawl and content truth before metadata decoration.
3. Unique first-hand evidence before new keyword pages.
4. Shared architectural fixes before page-by-page duplication.
5. Production and Search Console proof before declaring success.

Effort: **S** = hours, **M** = a few focused days, **L** = multi-day architectural/editorial work.
Owners: **ENG** = engineering, **ANTHONY** = factual/editorial owner, **SEO** = auditor/strategist, **DATA** = analytics/Search Console owner.

## Baseline to preserve

- 17 intended public URLs currently return `200`, `index,follow`, unique titles, and exact self-canonicals.
- The 14 registry-backed field-guide pages include substantial crawlable copy in initial HTML.
- Unknown URLs return a real `404` and private routes render `noindex,nofollow`.
- The sitemap contains only intended public URLs.
- Editorial pages have one H1, useful H2s, visible bylines/dates, official sources, related links, and structured data.
- The current content is not a content farm; the next phase should deepen evidence rather than multiply URLs.

Every batch must retain these contracts.

## Batch 0 — Correct public truth immediately

Target: first release, before new content or keyword work.

| ID | Action | Impact | Effort | Owner | Acceptance criteria |
|---|---|---:|---:|---|---|
| TRUTH-01 | Correct the Longest Trip 24-hour explanation everywhere. Tesla's official page currently uses both prior-session **start** and **end** wording. State the conflict, link the source, label it last reviewed August 10, 2026, and plan to the stricter start-time interpretation until Tesla clarifies. | Critical | S | ANTHONY + SEO | Hub, Longest guide, README/caveats, and any planner help use one reviewed disclosure; no page presents the permissive interpretation as settled. |
| TRUTH-02 | Fix Track Anthony's production state. It must not say `LIVE NOW`, `current day`, or show trip progress before the September 27 departure. | Critical | S | ANTHONY + ENG | On August/pre-trip dates the page clearly says planned/pre-trip; H1, status, progress, and selected date agree; post-departure live mode still has a tested activation path. |
| TRUTH-03 | Replace `42 starting route ideas` with the exact product/content truth. Decide whether the public promise is 40 fixed variants plus conditional custom routes, or three detailed editorial route families. | High | S | ANTHONY + ENG | Public claim is reproducible from code; page visibly delivers what the fact block promises; test fails if fixed variant count changes without content review. |
| TRUTH-04 | Add a visible `Last reviewed against Tesla` date to competition facts and a small rule-change log. | High | S | ANTHONY | Review date is separate from prose-modified date; source URL and affected planning assumption are visible. |

### Batch 0 verification

- Editorial read-through by Anthony.
- Focused competition and tracker tests.
- Rendered mobile/desktop check of pre-trip state.
- Direct raw-HTML fetch of the competition hub and Track Anthony.
- No new public URLs.

## Batch 1 — Repair breadcrumbs and topic flow

Target: first technical SEO batch.

| ID | Action | Impact | Effort | Owner | Acceptance criteria |
|---|---|---:|---:|---|---|
| IA-01 | Add explicit collection metadata and short breadcrumb labels beside the central SEO registry. Do not infer hierarchy from path segments. | High | S | ENG | Competition children resolve through the real competition hub; badge and route children resolve through their real hubs. |
| IA-02 | Implement one `getSeoBreadcrumbs(page)` resolver used by React, raw-HTML fallback, and BreadcrumbList JSON-LD. | High | M | ENG | Visible/raw/schema breadcrumb labels and URLs match; every item URL returns public `200`; `/competition`, `/badges`, and `/routes` never appear. |
| IA-03 | Add reciprocal links among the competition guide, Track Anthony, and route library. | High | S | ANTHONY + ENG | Hub links to `Anthony's 2026 competition route`; Track links to rules and route ideas; route hub links to the real competition route. |
| IA-04 | Turn hub copy into real tables of contents. Link the three competition categories, four published badge guides, and three route guides in the main content, not only `Keep exploring`. | High | M | ENG + ANTHONY | Each leaf is one click from its real hub in rendered and server-delivered HTML. |
| IA-05 | Put Community and Track Anthony into the server-rendered crawl graph and give their fallbacks useful outbound links. | Medium | S | ENG | Every indexable URL except `/` has at least one raw-HTML inbound link and no indexable page is a raw-HTML dead end. |
| IA-06 | Add a safe structured contextual-link model; do not store raw HTML strings in content data. Distinguish internal and external table links. | Medium | M | ENG | Internal table/body links stay same-tab and server/client output remains escaped and equivalent. |

### Batch 1 automated gate

- Every sitemap URL resolves `200`, self-canonical, `index,follow`.
- Every breadcrumb/related/contextual path is in the public registry and resolves `200`.
- Raw-HTML crawl from `/` has maximum intended depth 2.
- All private routes remain absent from sitemap and `noindex,nofollow`.
- Unknown routes remain true `404`s.

## Batch 2 — Make the public site fast enough to earn the crawl

Target: parallel design/engineering work after truth fixes; deploy separately from the architecture batch if risk is high.

| ID | Action | Impact | Effort | Owner | Acceptance criteria |
|---|---|---:|---:|---|---|
| PERF-01 | Produce responsive AVIF/WebP/JPEG variants for public landing images. Add `picture`, `srcset`, `sizes`, intrinsic dimensions/aspect ratios, and audited crops. | Critical | M | ENG/design | Mobile hero transfer target 100–250 KiB; no image layout shift; images remain visually strong at real breakpoints. |
| PERF-02 | Expose the homepage LCP hero in initial HTML and add appropriate preload/`fetchpriority="high"`; preload only the actual route-specific LCP image. | Critical | S | ENG | Lighthouse no longer flags LCP request discovery; no duplicate/unnecessary preloads. |
| PERF-03 | Lazy-load route families: planner, Track map/Leaflet/GeoJSON, auth/account, admin, and other heavy application code. | Critical | M | ENG | Home/guide initial JS excludes planner, Leaflet, map data, and optimizer code; first target under 150 KiB gzip. |
| PERF-04 | Precompute a public Track Anthony route publication and put a bounded route summary in initial HTML. Hydrate the map afterward. | Critical | L | ENG + ANTHONY | Raw HTML includes route name/version, dates, totals, major stops, and day links; content remains useful when the route API is slow or unavailable. |
| PERF-05 | Cache the public route snapshot by publication version with ETag/cache controls; remove full optimization from the crawler request path. | High | M | ENG | Cold public route summary is served within agreed budget, ideally under 1 s at the HTML edge; publication invalidates the snapshot deterministically. |
| PERF-06 | Remove `maximum-scale=1`, fix failing small/low-opacity contrast, and size logos. | Medium | S–M | ENG/design | Mobile accessibility audit has no viewport restriction, unsized logo, or known text-contrast failures. |

### Batch 2 performance gate

Use three Lighthouse mobile and desktop runs per template and record medians. Test homepage, competition hub, one leaf, Track Anthony, and Community.

Initial release targets—not ranking guarantees:

- Homepage mobile lab LCP materially below the 9.8 s baseline; target under 3.0 s in the controlled audit environment.
- Guide mobile lab LCP improves from the 3.7 s baseline.
- Homepage transfer materially below 3,114 KiB.
- TBT remains near zero and CLS remains zero.
- Homepage/editorial initial JavaScript under the agreed budget.
- GSC/CrUX 75th-percentile field metrics are reviewed after sufficient traffic; lab success is not field success.

## Batch 3 — Establish one public SEO contract

Target: maintainability and metadata consistency.

| ID | Action | Impact | Effort | Owner | Acceptance criteria |
|---|---|---:|---:|---|---|
| META-01 | Create one typed public-page registry covering all 17 routes. Include indexability, sitemap membership, page type, title, description, path, OG/Twitter data, social image, breadcrumb, published/reviewed/updated dates, and server fallback model. | High | M | ENG | Server, React, sitemap, schema, and tests read the same records; route-to-component wiring remains separate. |
| META-02 | Eliminate server/client metadata drift on Community and Track Anthony; add equality tests for every public route. | High | S after META-01 | ENG | Raw title/description/canonical/robots equals post-render metadata for each URL; client navigation does not leave stale OG/Twitter fields. |
| META-03 | Add truthful per-page `publishedAt`, `updatedAt`, and `reviewedAt`; drive sitemap and schema from the right field. | High | S–M | ENG + ANTHONY | `lastmod` changes only after significant visible changes; Track uses its public publication timestamp; all pages no longer share July 19 automatically. |
| META-04 | Define stable Organization, WebSite, WebApplication, Brand, and Person `@id` nodes; add truthful Article image, `datePublished`, `dateModified`, and `mainEntityOfPage`. | Medium | M | ENG + SEO | JSON-LD parses, visible facts match markup, and representative pages pass schema validators; no invented `sameAs`. |
| META-05 | Add reviewed 1200×630 social assets by cluster and complete OG image alt/size/type plus Twitter fields. | Medium | M | Design + ENG | Link-preview tools show correct title, description, and landscape image for each template. |
| META-06 | Redirect `/index.html`, known trailing slashes, and host/protocol variants directly to the final canonical in one permanent hop. | Medium | S–M | ENG/infra | Query strings are handled deliberately; API/root routes are regression-tested; no redirect loops. |
| META-07 | Add `X-Robots-Tag: noindex,nofollow` to `/api/*` and non-HTML private outputs. | Low | S | ENG | HTML crawling remains allowed where needed; APIs/assets are not accidentally blocked from application use. |
| META-08 | Expose non-secret release SHA and deployed timestamp in health/headers. | Medium | S | ENG | Post-deploy audit records exact code revision, sitemap hash, and health result. |

## Batch 4 — Turn polished summaries into defensible evidence

Target: editorial work after truth, performance, and ownership are clear.

| ID | Action | Impact | Effort | Owner | Acceptance criteria |
|---|---|---:|---:|---|---|
| CONTENT-01 | Make `/track-anthony` the definitive `My 2026 Tesla Supercharging Competition Route & Map` page. Do not create a duplicate route URL. | Critical | M–L | ANTHONY + ENG + SEO | Crawlable title/H1/summary include current route version, dates, miles, days, stops, target category, vehicle/range, major decisions, known risks, data dates, and change log. |
| CONTENT-02 | Expand the competition hub into the best plain-English rules/planning bridge while Tesla remains the authority. | High | M | ANTHONY + SEO | Covers official name/prize, dates, enrollment, Passport behavior, categories, regions, eligibility, repeats, timing conflict, tie-break/winner order, missing sessions, last-open behavior, and ChargeQuest modeling limits. |
| CONTENT-03 | Add one original artifact to each category guide before expanding the content cluster. | High | L editorial | ANTHONY | Longest has exact clock math/failure drill; Unique has controlled corridor comparison; Energy has a transparent logged scenario and product-capability boundary. |
| CONTENT-04 | Add real maps, route tables, run dates, stop evidence, sources, and versioning to the three route guides. | High | L editorial/design | ANTHONY + ENG | Page promises `map`, `stops`, or `route` only when the artifact is visible and accessible. |
| CONTENT-05 | Add last-verified dates, status labels, map/change log, and relevant park/road primary sources to badge content. | Medium | M | ANTHONY | Claims are labeled official/modeled/planned/personally verified; no cloned pages for remaining badges without distinct evidence. |
| CONTENT-06 | Strengthen About Anthony with only verifiable specifics: vehicle/configuration, planning experience, project milestones, photo, corrections policy, and controlled external profiles if any. | Medium | S–M | ANTHONY | No invented credentials or profiles; factual correction path is visible. |
| CONTENT-07 | Vary evidence modules, not voice quirks. Add optional decision log, before/after, map, quote, checklist, FAQ, field photo, and source-change components. | Medium | M | ENG + ANTHONY | Reusable template remains maintainable, but articles use structures appropriate to their evidence. |

### Editorial rule for every new URL

Do not publish unless the page has:

- one distinct search task and canonical owner;
- a named author and per-page review date;
- at least one primary source for factual claims;
- at least one original artifact for route, badge, or strategy content;
- an explicit official/modeled/planned/observed label;
- descriptive hub and next-task internal links;
- an intent-matched CTA;
- a read-aloud review by Anthony.

Do not create per-station, per-city, per-state, remaining-badge, leaderboard, hotel-price, or keyword-variant pages without source data, original evidence, durable maintenance, and Search Console/query justification.

## Batch 5 — Establish measurement truth

Target: begin immediately where access exists; repeat after every material release.

| ID | Action | Impact | Effort | Owner | Acceptance criteria |
|---|---|---:|---:|---|---|
| DATA-01 | Grant the chosen auditor read-only Search Console access and preserve baseline exports. | Critical | S | DATA | Page Indexing, Sitemaps, URL Inspection samples, Crawl Stats, CWV, Manual Actions, Security Issues, Links, and Performance evidence is archived. |
| DATA-02 | Inspect all three hubs, Track, Community, About, one child per collection, one private URL, and one deliberate 404. | Critical | S | SEO + DATA | Google-selected canonical, rendered HTML/screenshot, crawl time, resources, and status are recorded per sample. |
| DATA-03 | Define branded/non-branded query groups and page ownership monitoring. | High | S | SEO + DATA | Competition, route/planning, categories, Passport, badges, route types, and planner clusters are reported consistently by device/country. |
| DATA-04 | Verify analytics from organic landing through account, route generation, and route save. | High | M | DATA + ENG | Funnel events are documented, deduplicated, tested, and privacy-appropriate. |
| DATA-05 | Review query-to-page cannibalization, CTR, and conversion at 30/60/90 days. | High | Ongoing | SEO + ANTHONY | Titles/sections are changed from evidence, not rank-check anecdotes; release annotations exist. |
| DATA-06 | Review backlinks/referring domains and build safe outreach around original route experiments/maps/data. | Medium | M | SEO | No paid schemes, bulk directories, PBNs, or mass guest posts; each outreach target has a real editorial reason. |

## Recommended delivery sequence

```text
Truth corrections
  -> breadcrumb/topic-flow repair
  -> homepage/Track performance and static route snapshot
  -> unified registry/metadata/freshness
  -> evidence-led content expansion
  -> recurring GSC/analytics/field validation
```

Search Console measurement begins in parallel; it does not need to wait for implementation.

## First four implementation tickets

These are the smallest high-leverage starting points:

1. **Competition truth patch:** timing conflict disclosure, per-page review date, and current official-rule completeness checklist.
2. **Pre-trip truth patch:** correct Track Anthony state and test date/status consistency.
3. **Breadcrumb contract:** explicit collection map, one resolver, visible/raw/schema parity, and 404-parent regression tests.
4. **Homepage LCP patch:** responsive hero formats, intrinsic sizing, initial-document discovery, and fetch priority.

Do not combine these into a broad SEO rewrite. Each has a clear rollback and acceptance test.

## Release certification checklist

Before calling any batch complete:

```bash
npm test
npm run build
npm run lint
xmllint --noout public/sitemap.xml
git diff --check
```

Then:

- Verify only intended files changed.
- Record exact deployed SHA and health.
- Fetch all 17 public URLs and seven private routes from production.
- Verify canonical host, slash/index variants, 404, robots, and sitemap.
- Compare raw and rendered metadata/content/link graph.
- Check desktop and mobile console/network errors.
- Run repeat Lighthouse tests for affected templates.
- Validate representative JSON-LD/breadcrumbs.
- Use Search Console URL Inspection after deployment.
- Record whether the fix is technically live, Google has recrawled it, and search outcomes have changed as three separate states.

## What success looks like after 90 days

- No public factual contradiction is presented as settled.
- Track Anthony's status, dates, route version, and crawler-visible summary agree.
- Every intended URL has a clean Search Console disposition or a documented reason/action.
- Broken breadcrumb parent URLs are gone from structured data and Crawl Stats.
- Homepage and guide performance are materially better in repeatable lab tests, with field data trending toward good CWV where traffic is sufficient.
- The competition hub and Track Anthony receive impressions for their assigned rule and route/planning clusters without unresolved cannibalization.
- Public content contains reproducible maps, route outputs, decisions, and source dates that competitors cannot cheaply paraphrase.
- Organic performance is connected to route generation and route saves, not treated as a traffic-only score.
