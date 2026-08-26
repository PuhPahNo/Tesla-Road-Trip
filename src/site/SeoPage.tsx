import { ArrowRight, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  SEO_AUTHOR,
  formatSeoDate,
  getRelatedSeoPages,
  type SeoRouteMap,
  type SeoPage as SeoPageContent,
} from '../seo/seoPages'
import {
  buildSeoPageStructuredData,
  getContextualPublicLinks,
  getSeoBreadcrumbs,
  getSeoPagePresentation,
} from '../seo/siteArchitecture'
import { usePageMetadata } from './usePageMetadata'

export function SeoPage({ page }: { page: SeoPageContent }) {
  const relatedPages = getRelatedSeoPages(page)
  const breadcrumbs = getSeoBreadcrumbs(page)
  const contextualLinks = getContextualPublicLinks(page.path).filter(
    (link) => !page.relatedPaths.includes(link.path),
  )
  const presentation = getSeoPagePresentation(page)

  usePageMetadata({
    ...presentation,
    structuredData: buildSeoPageStructuredData(page),
  })

  return (
    <article className="bg-[#f4f0e8] text-black">
      <header className="relative isolate overflow-hidden bg-[#090a0c] px-4 py-20 text-white sm:px-6 sm:py-28 lg:min-h-[760px] lg:px-12 lg:py-36">
        <img
          src={presentation.socialImage}
          alt={presentation.socialImageAlt}
          className="absolute inset-0 z-0 h-full w-full object-cover"
          width={presentation.socialImageWidth}
          height={presentation.socialImageHeight}
          fetchPriority="high"
        />
        <div className="absolute inset-0 z-[1] bg-[linear-gradient(90deg,rgba(3,3,4,.98)_0%,rgba(3,3,4,.86)_52%,rgba(3,3,4,.24)_100%)]" />
        <div className="absolute inset-0 z-[1] bg-[linear-gradient(0deg,#090a0c_0%,transparent_58%,rgba(0,0,0,.2)_100%)]" />
        <div className="pointer-events-none absolute -right-32 -top-40 z-[2] h-[520px] w-[520px] rounded-full bg-[#e82127]/20 blur-[130px]" />
        <div className="relative z-10 mx-auto max-w-[1180px]">
          <nav className="mb-14 flex flex-wrap items-center gap-2 font-mono text-[9px] uppercase tracking-[0.13em] text-white/55" aria-label="Breadcrumb">
            {breadcrumbs.map((breadcrumb, index) => (
              <span key={breadcrumb.path} className="contents">
                {index > 0 ? <span aria-hidden="true">/</span> : null}
                {index === breadcrumbs.length - 1 ? (
                  <span aria-current="page" className="text-white/68">{breadcrumb.name}</span>
                ) : (
                  <Link to={breadcrumb.path} className="text-white/55 no-underline hover:text-white">
                    {breadcrumb.name}
                  </Link>
                )}
              </span>
            ))}
          </nav>
          <div className="font-mono text-[9px] font-semibold uppercase tracking-[0.17em] text-[#23d7d1]">{page.eyebrow}</div>
          <h1 className="mt-5 max-w-[1050px] text-[clamp(44px,8.5vw,104px)] font-semibold leading-[0.9] tracking-[-0.058em] sm:leading-[0.87] sm:tracking-[-0.067em]">
            {page.headline}
          </h1>
          <p className="mt-8 max-w-[790px] text-[17px] leading-[1.72] text-white/68 sm:text-[20px]">
            {page.intro}
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[8.5px] uppercase tracking-[0.11em] text-white/55">
            {page.kind === 'about' ? (
              <span>{SEO_AUTHOR.name}</span>
            ) : (
              <span>
                Written by{' '}
                <Link to={SEO_AUTHOR.path} className="font-semibold text-white/78 no-underline hover:text-white">
                  {SEO_AUTHOR.name}
                </Link>
              </span>
            )}
            <span aria-hidden="true">·</span>
            <time dateTime={page.updatedAt}>Updated {formatSeoDate(page.updatedAt)}</time>
            {presentation.photoCredit ? (
              <>
                <span aria-hidden="true">·</span>
                <a
                  href={presentation.photoCredit.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-white/55 no-underline hover:text-white"
                >
                  Photo by {presentation.photoCredit.photographer} on Unsplash
                </a>
              </>
            ) : null}
          </div>
          <div className="mt-14 grid border-y border-white/15 sm:grid-cols-3">
            {page.facts.map((fact) => (
              <div key={fact.label} className="border-b border-white/15 px-0 py-6 last:border-b-0 sm:border-b-0 sm:border-r sm:px-6 sm:first:pl-0 sm:last:border-r-0">
                <div className="font-mono text-[8px] uppercase tracking-[0.12em] text-white/55">{fact.label}</div>
                <div className="mt-2 text-[18px] font-semibold tracking-[-0.025em]">{fact.value}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      <div className="px-4 py-20 sm:px-6 sm:py-28 lg:px-12 lg:py-36">
        <div className="mx-auto grid max-w-[1180px] gap-14 lg:grid-cols-[minmax(0,760px)_280px] lg:justify-between lg:gap-20">
          <div className="min-w-0">
            {page.routeMap ? <RouteAnchorMap routeMap={page.routeMap} /> : null}
            {page.sections.map((section, index) => (
              <section key={section.heading} className={index > 0 || page.routeMap ? 'mt-16 border-t border-black/14 pt-14' : ''}>
                <div className="mb-5 font-mono text-[8px] font-semibold uppercase tracking-[0.14em] text-[#c9161d]">{String(index + 1).padStart(2, '0')}</div>
                <h2 className="max-w-[720px] text-[clamp(30px,5vw,50px)] font-semibold leading-[1] tracking-[-0.045em]">{section.heading}</h2>
                <div className="mt-7 space-y-5">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph} className="max-w-[720px] text-[16px] leading-[1.8] text-black/66 sm:text-[17px]">{paragraph}</p>
                  ))}
                </div>
                {section.bullets ? (
                  <ul className="mt-8 space-y-3 border-l-2 border-[#e82127] pl-6 text-[15px] leading-[1.7] text-black/65">
                    {section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                  </ul>
                ) : null}
                {section.table ? (
                  <div className="mt-9 overflow-x-auto border border-black/14 bg-white">
                    <table className="w-full min-w-[720px] border-collapse text-left">
                      <caption className="border-b border-black/14 px-5 py-4 text-left font-mono text-[8px] font-semibold uppercase tracking-[0.12em] text-black/65">
                        {section.table.caption}
                      </caption>
                      <thead>
                        <tr className="bg-black text-white">
                          {section.table.columns.map((column) => (
                            <th key={column} scope="col" className="px-4 py-3.5 font-mono text-[8px] font-semibold uppercase tracking-[0.1em]">
                              {column}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        {section.table.rows.map((row, rowIndex) => (
                          <tr key={`${section.table?.caption}-${rowIndex}`} className="border-b border-black/10 align-top last:border-b-0">
                            {row.map((cell, cellIndex) => (
                              <td key={`${cellIndex}-${typeof cell === 'string' ? cell : cell.text}`} className={`px-4 py-4 text-[13px] leading-[1.55] text-black/75 ${cellIndex === 0 ? 'font-semibold text-black/82' : ''}`}>
                                {typeof cell === 'string' ? cell : cell.links?.length ? (
                                  <span className="flex flex-wrap gap-x-3 gap-y-1">
                                    {cell.links.map((link) => (
                                      <a key={link.href} href={link.href} target="_blank" rel="noreferrer" className="font-semibold text-black underline decoration-black/20 underline-offset-4 hover:decoration-[#e82127]">
                                        {link.text}
                                      </a>
                                    ))}
                                  </span>
                                ) : cell.href ? (
                                  isExternalHref(cell.href) ? (
                                    <a href={cell.href} target="_blank" rel="noreferrer" className="font-semibold text-black underline decoration-black/20 underline-offset-4 hover:decoration-[#e82127]">
                                      {cell.text}
                                    </a>
                                  ) : (
                                    <Link to={cell.href} className="font-semibold text-black underline decoration-black/20 underline-offset-4 hover:decoration-[#e82127]">
                                      {cell.text}
                                    </Link>
                                  )
                                ) : cell.text}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </section>
            ))}

            {page.note ? (
              <aside className="mt-16 border border-black/12 bg-white/55 p-6 sm:p-8">
                <div className="font-mono text-[8px] font-semibold uppercase tracking-[0.14em] text-black/65">Important context</div>
                <p className="mt-3 text-[14px] leading-[1.75] text-black/60">{page.note}</p>
              </aside>
            ) : null}

            {page.sources.length ? (
              <section className="mt-12">
                <h2 className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-black/65">Sources and verification</h2>
                <ul className="mt-4 space-y-3">
                  {page.sources.map((source) => (
                    <li key={source.url}>
                      <a href={source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-[13px] font-semibold text-black underline decoration-black/20 underline-offset-4 hover:decoration-[#e82127]">
                        {source.label}
                        <ExternalLink aria-hidden="true" size={13} />
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {page.furtherReading?.length ? (
              <section className="mt-12 border-t border-black/14 pt-10">
                <h2 className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-black/65">Further reading</h2>
                <p className="mt-3 max-w-[620px] text-[14px] leading-[1.7] text-black/60">
                  Good reporting and different perspectives on the 2026 competition.
                </p>
                <ul className="mt-5 space-y-3">
                  {page.furtherReading.map((article) => (
                    <li key={article.url}>
                      <a href={article.url} target="_blank" rel="noreferrer" className="text-[13px] font-semibold text-black underline decoration-black/20 underline-offset-4 hover:decoration-[#e82127]">
                        <span>{article.label}</span>
                        <ExternalLink aria-hidden="true" size={13} className="ml-2 inline-block align-[-0.12em]" />
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {contextualLinks.length ? (
              <section className="mt-12 border-t border-black/14 pt-10">
                <h2 className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-black/65">Connect the planning</h2>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {contextualLinks.map((link) => (
                    <li key={link.path}>
                      <Link to={link.path} className="text-[13px] font-semibold text-black underline decoration-black/20 underline-offset-4 hover:decoration-[#e82127]">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>

          <aside className="lg:pt-1">
            <div className="lg:sticky lg:top-28">
              <div className="font-mono text-[8px] font-semibold uppercase tracking-[0.14em] text-black/65">Keep exploring</div>
              <div className="mt-4 border-t border-black/14">
                {relatedPages.map((related) => (
                  <Link key={related.path} to={related.path} className="group block border-b border-black/14 py-5 text-black no-underline">
                    <div className="font-mono text-[7.5px] uppercase tracking-[0.11em] text-black/65">{related.eyebrow}</div>
                    <div className="mt-2 text-[15px] font-semibold leading-[1.25] tracking-[-0.02em] group-hover:text-[#e82127]">{related.headline}</div>
                  </Link>
                ))}
              </div>
              <div className="mt-8 bg-[#e51c23] p-6 text-white">
                <div className="font-mono text-[8px] uppercase tracking-[0.13em] text-white">ChargeQuest CORE</div>
                <h2 className="mt-3 text-[25px] font-semibold leading-[1] tracking-[-0.04em]">{page.cta.title}</h2>
                <p className="mt-4 text-[13px] leading-[1.65] text-white">{page.cta.body}</p>
                {page.cta.path.startsWith('mailto:') ? (
                  <a href={page.cta.path} className="mt-6 flex min-h-11 items-center justify-between rounded-full bg-black px-5 py-3 text-[12px] font-semibold text-white no-underline">
                    {page.cta.label}
                    <ArrowRight aria-hidden="true" size={16} />
                  </a>
                ) : (
                  <Link to={page.cta.path} className="mt-6 flex min-h-11 items-center justify-between rounded-full bg-black px-5 py-3 text-[12px] font-semibold text-white no-underline">
                    {page.cta.label}
                    <ArrowRight aria-hidden="true" size={16} />
                  </Link>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </article>
  )
}

function RouteAnchorMap({ routeMap }: { routeMap: SeoRouteMap }) {
  const points = routeMap.stops.map((stop) => ({ ...stop, ...projectSeoMapPoint(stop) }))
  const routePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' ')
  const hasHawaiiInset = routeMap.stops.some((stop) => stop.lon < -140 && stop.lat < 25)

  return (
    <figure className="overflow-hidden border border-black/14 bg-[#0b0d0f] text-white">
      <figcaption className="border-b border-white/14 px-5 py-5 sm:px-7">
        <div className="font-mono text-[8px] font-semibold uppercase tracking-[0.14em] text-[#23d7d1]">Original ChargeQuest route diagram</div>
        <h2 className="mt-2 text-[clamp(25px,4vw,38px)] font-semibold leading-[1] tracking-[-0.04em]">{routeMap.title}</h2>
        <p className="mt-3 max-w-[680px] text-[14px] leading-[1.7] text-white/62">{routeMap.summary}</p>
      </figcaption>
      <div className="bg-[radial-gradient(circle_at_50%_40%,rgba(35,215,209,.12),transparent_58%)] p-3 sm:p-6">
        <svg
          viewBox="0 0 900 410"
          role="img"
          aria-label={`${routeMap.title}. ${routeMap.stops.map((stop) => stop.label).join(routeMap.connectStops === false ? ', ' : ' to ')}.`}
          className="h-auto w-full"
        >
          <rect x="18" y="16" width="864" height="372" rx="18" fill="rgba(255,255,255,.025)" stroke="rgba(255,255,255,.12)" />
          {[160, 300, 440, 580, 720].map((x) => (
            <line key={`vertical-${x}`} x1={x} y1="28" x2={x} y2="376" stroke="rgba(255,255,255,.055)" strokeDasharray="4 8" />
          ))}
          {[100, 188, 276].map((y) => (
            <line key={`horizontal-${y}`} x1="30" y1={y} x2="870" y2={y} stroke="rgba(255,255,255,.055)" strokeDasharray="4 8" />
          ))}
          {hasHawaiiInset ? (
            <g>
              <rect x="42" y="298" width="100" height="72" rx="12" fill="rgba(35,215,209,.04)" stroke="rgba(35,215,209,.32)" strokeDasharray="4 6" />
              <text x="92" y="362" textAnchor="middle" fill="rgba(255,255,255,.5)" fontSize="8" fontWeight="700">HAWAII</text>
            </g>
          ) : null}
          {routeMap.connectStops === false ? null : (
            <>
              <path d={routePath} fill="none" stroke="rgba(35,215,209,.42)" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
              <path d={routePath} fill="none" stroke="#23d7d1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </>
          )}
          {points.map((point, index) => (
            <g key={`${point.label}-${index}`} transform={`translate(${point.x.toFixed(1)} ${point.y.toFixed(1)})`}>
              <circle r="11" fill="#0b0d0f" stroke="#e82127" strokeWidth="3" />
              <text y="3.5" textAnchor="middle" fill="white" fontSize="9" fontWeight="700">{index + 1}</text>
            </g>
          ))}
        </svg>
      </div>
      <ol className="grid border-t border-white/12 sm:grid-cols-2 lg:grid-cols-3">
        {routeMap.stops.map((stop, index) => (
          <li key={`${stop.label}-${index}`} className="flex gap-3 border-b border-white/10 px-4 py-3 text-[12px] leading-[1.4] text-white/68 sm:border-r sm:px-5">
            <span className="font-mono text-[9px] font-semibold text-[#23d7d1]">{String(index + 1).padStart(2, '0')}</span>
            <span>{stop.label}</span>
          </li>
        ))}
      </ol>
      <p className="border-t border-white/12 px-5 py-4 text-[11px] leading-[1.65] text-white/48 sm:px-7">{routeMap.note}</p>
    </figure>
  )
}

function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href)
}

function projectSeoMapPoint({ lat, lon }: { lat: number; lon: number }) {
  if (lon < -140 && lat < 25) return { x: 92, y: 329 }
  return {
    x: Math.min(872, Math.max(28, 28 + ((lon + 125) / 59) * 844)),
    y: Math.min(376, Math.max(24, 24 + ((50 - lat) / 26) * 352)),
  }
}
