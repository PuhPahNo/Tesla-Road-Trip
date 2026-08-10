# SEO Agency Audit Brief and Scorecard

Use this document to request and compare proposals for an exhaustive SEO audit of ChargeQuest. The recommended engagement is a fixed-scope audit with a separately priced implementation phase. Do not begin with an open-ended monthly retainer.

## Company and product context

**Site:** [https://www.teslachargequest.com](https://www.teslachargequest.com)
**Product:** ChargeQuest CORE, a Tesla Supercharger route planner and first-person route-building project centered on the 2026 Tesla Free Supercharging Competition
**Stack:** React SPA, Express server, server-generated metadata/static HTML fallbacks, Render hosting, Cloudflare edge, generated XML sitemap
**Current public inventory:** 17 intended indexable URLs
**Primary conversion:** create a free username-based account and begin/save a route
**Primary editorial differentiator:** Anthony's real route decisions, route output, sources, tradeoffs, and later field evidence—not generic EV travel copy

The company must review the actual code and live production behavior. A tool-only PDF is not acceptable.

## Engagement objective

Determine what prevents ChargeQuest from earning qualified non-branded search visibility for the 2026 Tesla Supercharging Competition, competition route planning, Tesla Supercharger route ideas, and Iconic Charger badges—without turning the site into a thin AI-content farm.

The audit must answer:

1. Can Google and other legitimate crawlers reliably discover, render, understand, and index every intended public page?
2. Is every public URL's status, canonical, robots rule, metadata, content, structured data, and internal-link context correct?
3. Does the site architecture make the competition hub, supporting strategies, route ideas, badge guides, author proof, and Track Anthony experience reinforce one another?
4. Which queries already generate impressions/clicks, which page Google selects, and where is there cannibalization or intent mismatch?
5. Does the copy sound like Anthony, contain first-hand evidence, answer the searcher's question, and avoid generic AI patterns?
6. What technical, editorial, authority, and performance work should happen first, and how will success be measured?

## Required scope

### 1. Technical crawling and indexation

- Crawl JavaScript-disabled raw HTML and fully rendered DOM separately.
- Inventory every `200`, redirect, `3xx` chain, `4xx`, soft 404, canonical, robots directive, hreflang if present, title, description, H1, schema type, and sitemap status.
- Test canonical host/protocol/slash/query normalization.
- Compare repository public-route truth, router truth, sitemap truth, server-render truth, and live truth.
- Inspect robots.txt, XML sitemap accuracy, `lastmod` quality, cache behavior, status codes, and static-asset accessibility.
- Verify private/account/planner/admin pages remain out of the index and are still securely access-controlled.
- Check Googlebot access to JavaScript, CSS, fonts, images, public APIs, and route content.
- Inspect log or edge data for crawler status codes, failed assets, redirect loops, latency, and wasted crawl if available.

### 2. Google Search Console

- Export Page Indexing, Sitemaps, URL Inspection samples, Crawl Stats, Core Web Vitals, Manual Actions, Security Issues, Links, and Performance data.
- Report submitted versus indexed URLs and explain every exclusion group.
- Record both user-declared and Google-selected canonical for sampled URLs.
- Inspect rendered HTML/screenshots for the homepage, every hub, Track Anthony, Community, and a representative leaf from each cluster.
- Split performance by query, page, device, country, search appearance, and date range.
- Separate branded from non-branded discovery and distinguish expected `noindex` exclusions from defects.

### 3. Information architecture and internal linking

- Produce a crawl-depth and inbound-link graph for raw and rendered HTML.
- Identify orphan, weak-spoke, dead-end, and overlinked pages.
- Evaluate global nav, footer, contextual body links, related-content modules, anchor text, and conversion links.
- Audit visible breadcrumbs and BreadcrumbList schema against real `200` hub URLs.
- Recommend a hub/spoke taxonomy that reuses the existing central registry and avoids duplicate/thin namespace pages.

### 4. On-page content and human quality

- Review every public page manually, not by word count or AI detector score alone.
- Evaluate search intent, factual completeness, specificity, first-hand evidence, sourcing, authorship, dates, disclaimers, readability, and conversion fit.
- Flag generic cadence, repeated abstractions, slogan repetition, symmetrical list patterns, filler transitions, empty superlatives, and unsupported claims.
- Identify where copy should be rewritten, expanded with evidence, consolidated, held until evidence exists, or removed.
- Verify the current competition claims against Tesla's official source and date the review.
- Review the live Track Anthony state for internal timeline, route, date, and status consistency.

### 5. Keyword, SERP, and competitor research

- Build a query universe around the 2026 Tesla Free Supercharging Competition, Longest Trip, Most Unique Sites, Most Energy, route planning, guide/checklist intent, Iconic Charger badges, and the site's route concepts.
- Provide search volume only with source, geography, date, and tool; label zero/unknown-volume long tails honestly.
- Capture current SERP intent and top result types for each priority cluster.
- Map exactly one primary intent to each current/proposed URL and identify cannibalization risks.
- Compare ChargeQuest with Tesla's official pages and relevant editorial/product competitors on content depth, evidence, authority, links, format, freshness, and result features.
- Do not recommend a page merely because a keyword variant exists. New pages need distinct intent, evidence, and a durable update owner.

### 6. Structured data and rich-result eligibility

- Parse every JSON-LD block from raw and rendered HTML.
- Test representative URLs in Schema.org Validator and Google's Rich Results Test.
- Validate page/entity relationships, Organization/Brand/Person identity, Article/CollectionPage/ProfilePage usage, BreadcrumbList, dates, URLs, and visible-content parity.
- Identify schema that is valid but has no Google rich-result benefit, so effort is not misrepresented.

### 7. Performance and page experience

- Run mobile and desktop Lighthouse at least three times per template and report median values.
- Review field Core Web Vitals from Search Console/CrUX where available.
- Test homepage, competition hub, one detail guide, Track Anthony, and Community.
- Diagnose LCP request discovery, responsive images, modern formats, explicit image dimensions, font loading, render blocking, JavaScript bundle reuse/code splitting, map/API cost, CLS, INP/TBT, and mobile interaction.
- Include accessibility findings that materially affect content access or search usability.

### 8. Authority and off-site signals

- Audit referring domains, linked pages, anchor context, broken/lost links, toxic-looking patterns, and realistic editorial outreach opportunities.
- Compare authority gaps against actual ranking competitors, not only large generic EV publishers.
- Do not propose paid links, private blog networks, bulk directories, reciprocal schemes, or mass guest-post packages.
- Identify first-party linkable assets: route comparison data, reproducible CORE experiments, maps, field logs, rule-change tracking, and unique charger/badge reference work.

### 9. Measurement and conversion

- Verify analytics coverage, consent behavior if applicable, organic landing-page attribution, signup measurement, and first-route creation measurement.
- Define a 30/60/90-day scorecard using indexed pages, non-branded impressions/clicks, top-20/top-10 queries, CTR, organic signup rate, and first-route creation.
- Separate leading signals from business outcomes and establish an annotation/change log.

## Required deliverables

The final package must include editable files and raw exports:

1. **Executive summary:** current state, five highest risks, five strongest assets, and recommended investment order.
2. **Issue register:** unique ID, severity, affected URLs, evidence, root cause, user/search impact, recommended change, effort, dependency, owner, and acceptance test.
3. **Complete URL inventory:** status, indexability, canonical, sitemap, lastmod, metadata, headings, word/content type, inbound links, depth, schema, and recommendation.
4. **Raw and rendered crawl exports:** tool configuration included so results can be reproduced.
5. **Search Console evidence pack:** exports/screenshots and written interpretation.
6. **Internal-link graph:** current and proposed, with exact source→destination opportunities and anchor guidance.
7. **Keyword-to-page map:** query cluster, intent, current rank/impressions if known, chosen landing page, content gap, priority, and cannibalization notes.
8. **Page-by-page editorial review:** keep/revise/consolidate/hold/remove recommendation with human-quality notes.
9. **Structured-data report:** raw snippets, validation results, errors/warnings, and corrected model.
10. **Performance report:** mobile/desktop lab medians, field data, waterfall evidence, and prioritized fixes.
11. **Authority/backlink report:** competitors, gaps, lost links, linkable assets, and safe outreach opportunities.
12. **Implementation backlog:** Now/Next/Later, impact/effort, dependencies, acceptance criteria, and estimated implementation range.
13. **Validation report:** a post-fix recrawl and Search Console follow-up plan; implementation is not considered successful merely because code changed.

Every recommendation must cite a URL, file/code pattern, crawl record, Search Console record, SERP capture, or authoritative search-engine guidance. Generic best-practice statements belong in an appendix, not the issue register.

## Baseline findings the agency must independently verify

Do not tell candidates these are conclusions they must agree with. Ask them to confirm, refine, or disprove each one:

- Seventeen intended public URLs currently return `200`, self-canonicalize, and expose meaningful raw HTML.
- Unknown URLs return a real `404`; private routes return raw `noindex,nofollow` HTML.
- Breadcrumb schema appears to link to nonexistent `/competition`, `/badges`, and `/routes` parents.
- Homepage and Track/Community raw fallbacks have a weaker internal-link graph than the rendered React site.
- Google was observed returning ChargeQuest for the focused competition-route query, but the homepage—not the dedicated guide—was the primary result.
- The homepage's single mobile Lighthouse baseline recorded Performance 70 and LCP 9.8 s, with roughly 2.3 MB of potential image savings.
- Sitemap `lastmod` values are tied to a shared July 19 date rather than each page's last significant change.
- Track Anthony was observed claiming `LIVE NOW` for a future September 27 day on August 10.

A strong agency will reproduce the evidence, explain material differences, and avoid inflating minor warnings into emergencies.

## Proposal questions

Require written answers before the sales call:

1. Who will perform the crawl, Search Console analysis, technical review, content review, and final presentation? Name the people, not only the agency.
2. Show one anonymized issue register, one internal-link analysis, and one page-by-page editorial review from a comparable audit.
3. How do you test a React SPA whose server returns route-specific fallback HTML?
4. How will you compare raw HTML, rendered DOM, sitemap, declared canonical, and Google-selected canonical?
5. How do you decide whether to create a new keyword page versus improve an existing page?
6. How do you identify AI-sounding copy without relying on an unreliable detector score?
7. What Search Console exports and URL Inspection evidence will you provide?
8. Which recommendations can your team implement in TypeScript/React/Express, and how are code review and regression tests handled?
9. What do you expect to improve in 30, 60, and 90 days, and what cannot be guaranteed?
10. How do you measure organic signup and first-route creation, not only traffic?
11. What access do you need, why, for how long, and at what permission level?
12. What work is explicitly excluded from your price?
13. How do you handle factual updates when Tesla changes the competition rules?
14. Describe a recommendation you chose not to make because it would have created thin content or technical debt.

## Weighted selection scorecard

Score each section from 0–5, multiply by its weight, and normalize to 100.

| Category | Weight | What earns a 5 |
|---|---:|---|
| Technical crawl/index expertise | 20% | Demonstrates raw/rendered SPA testing, status/canonical/schema/GSC depth, and reproducible evidence |
| Search/keyword strategy | 15% | Maps intent to pages, uses current SERP and GSC evidence, and resists keyword-page sprawl |
| Editorial/human-quality judgment | 15% | Shows strong manual editing, first-hand evidence standards, sourcing, and a believable human voice |
| Information architecture/internal links | 10% | Produces usable graphs and exact contextual link recommendations, not only crawl-depth scores |
| Performance/page experience | 10% | Combines field and repeatable lab data with root-cause waterfall/image/JS diagnosis |
| Measurement/business outcomes | 10% | Connects queries and landing pages to signup and first-route creation |
| Implementation capability | 10% | Can make small tested React/Express changes or hand off acceptance-ready tickets |
| Transparency/communication | 5% | Names practitioners, documents reasoning, shares raw data, and states uncertainty |
| Safety/reputation | 5% | Follows Search Essentials, rejects link schemes and ranking guarantees, and uses least-privilege access |

Require a minimum overall score of 80 and no score below 3 in Technical, Editorial, Measurement, or Safety.

## Disqualifiers

Reject a proposal that:

- Guarantees a number-one ranking, a fixed traffic increase, instant indexing, or a special Google relationship.
- Leads with hundreds of generated city, charger, destination, or keyword-variant pages.
- Cannot explain how it will inspect Search Console or compare raw and rendered SPA content.
- Offers only a Lighthouse/Screaming Frog export without manual page and SERP analysis.
- Recommends creating `/competition`, `/badges`, and `/routes` solely because broken breadcrumb code emits those URLs.
- Uses an AI detector percentage as the main content-quality verdict.
- Proposes backlinks through paid networks, bulk directories, undisclosed placements, or reciprocal schemes.
- Wants Search Console owner/write access during the audit.
- Refuses to share raw exports, tool settings, affected URL lists, or recommendation reasoning.
- Bundles the audit into a long retainer before defining implementation scope and acceptance criteria.

Google's own hiring guidance recommends interviewing the practitioner, checking references, requiring realistic estimates, granting only read access to Search Console during an audit, and rejecting ranking guarantees. See [Google Search Central: Do you need an SEO?](https://developers.google.com/search/docs/fundamentals/do-i-need-seo).

## Access and security rules

- Search Console: read-only during audit.
- Analytics: viewer/read-only.
- Repository: read-only clone until a separate implementation agreement exists.
- Render/Cloudflare: read-only logs/analytics where possible; no DNS, deploy, or environment-variable permissions for audit work.
- Never share personal passwords. Use named accounts, role-based access, MFA, and time-limited invitations.
- No production changes, index-removal requests, disavows, redirects, DNS changes, or Search Console settings changes without written approval.
- Record all access granted and revoke it when the audit/validation window ends.
- Require disclosure of subcontractors and any use of site, analytics, or customer data in AI systems.

## Recommended commercial structure

1. **Paid discovery/audit:** fixed fee, fixed deliverables, named team, two-to-four week window.
2. **Findings workshop:** recorded walkthrough plus a challenge/revision period.
3. **Implementation proposal:** separately scoped after findings are accepted; group work into small reversible batches.
4. **Post-fix validation:** recrawl and Search Console checks included as a defined deliverable.
5. **Optional ongoing support:** consider only after the company demonstrates judgment and the measurement baseline is working.

Do not pay primarily for page count. A concise evidence-rich audit with reproducible exports is more valuable than a 200-page deck of duplicated warnings.

## Definition of done

The audit is complete only when:

- Every intended public and private route has an evidence-backed disposition.
- Search Console claims are supported by exports or screenshots.
- Every P0/P1 item has exact affected URLs, root cause, recommended owner, effort range, and acceptance test.
- The keyword map assigns a clear intent to each existing or proposed page without unresolved cannibalization.
- Every public page has a manual editorial judgment and evidence/freshness recommendation.
- Performance results distinguish single-run lab data from field Core Web Vitals.
- Raw crawl, GSC, keyword, backlink, and measurement exports are delivered in reusable formats.
- The agency presents what it would **not** do and why.
- A post-fix validation plan and 30/60/90-day scorecard are agreed before implementation begins.
