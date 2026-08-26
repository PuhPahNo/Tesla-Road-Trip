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
    <figure data-route-anchor-map className="overflow-hidden border border-black/14 bg-[#0b0d0f] text-white">
      <figcaption className="border-b border-white/14 px-5 py-5 sm:px-7">
        <div className="font-mono text-[8px] font-semibold uppercase tracking-[0.14em] text-[#23d7d1]">Geographic ChargeQuest route map</div>
        <h2 className="mt-2 text-[clamp(25px,4vw,38px)] font-semibold leading-[1] tracking-[-0.04em]">{routeMap.title}</h2>
        <p className="mt-3 max-w-[680px] text-[14px] leading-[1.7] text-white/62">{routeMap.summary}</p>
      </figcaption>
      <div className="bg-[radial-gradient(circle_at_50%_40%,rgba(35,215,209,.12),transparent_58%)] p-3 sm:p-6">
        <svg
          viewBox="0 0 900 440"
          role="img"
          aria-label={`${routeMap.title}. ${routeMap.stops.map((stop) => stop.label).join(routeMap.connectStops === false ? ', ' : ' to ')}.`}
          className="h-auto w-full"
        >
          <title>{routeMap.title}</title>
          <desc>A geographic map of the contiguous United States with route anchors plotted from their latitude and longitude.</desc>
          <rect x="18" y="16" width="864" height="406" rx="18" fill="rgba(255,255,255,.025)" stroke="rgba(255,255,255,.12)" />
          {[180, 330, 480, 630, 780].map((x) => (
            <line key={`vertical-${x}`} x1={x} y1="28" x2={x} y2="410" stroke="rgba(255,255,255,.045)" strokeDasharray="4 8" />
          ))}
          {[110, 200, 290].map((y) => (
            <line key={`horizontal-${y}`} x1="30" y1={y} x2="870" y2={y} stroke="rgba(255,255,255,.045)" strokeDasharray="4 8" />
          ))}
          <path
            data-map-layer="lower-48-outline"
            d={LOWER_48_OUTLINE_PATH}
            fill="rgba(255,255,255,.07)"
            stroke="rgba(255,255,255,.42)"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <text x="500" y="215" textAnchor="middle" fill="rgba(255,255,255,.12)" fontSize="24" fontWeight="700" letterSpacing="5">UNITED STATES</text>
          <text x="500" y="38" textAnchor="middle" fill="rgba(255,255,255,.22)" fontSize="8" fontWeight="700" letterSpacing="2">CANADA</text>
          <text x="470" y="352" textAnchor="middle" fill="rgba(255,255,255,.18)" fontSize="8" fontWeight="700" letterSpacing="2">MEXICO</text>
          {hasHawaiiInset ? (
            <g>
              <rect x="42" y="344" width="100" height="62" rx="12" fill="rgba(35,215,209,.04)" stroke="rgba(35,215,209,.32)" strokeDasharray="4 6" />
              <path d="M62 372 l6 -3 7 2 6 -2 7 3 7 -2 7 3 8 -1" fill="none" stroke="rgba(255,255,255,.4)" strokeWidth="2" strokeLinecap="round" />
              <text x="92" y="398" textAnchor="middle" fill="rgba(255,255,255,.5)" fontSize="8" fontWeight="700">HAWAII</text>
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
  if (lon < -140 && lat < 25) return { x: 92, y: 372 }
  return {
    x: Math.min(842, Math.max(58, 58 + ((lon + 125.5) / 59) * 784)),
    y: Math.min(334, Math.max(44, 44 + ((50 - lat) / 25.5) * 290)),
  }
}

// Natural Earth 1:110m public-domain boundary, projected to the SVG viewport.
const LOWER_48_OUTLINE_PATH = 'M93.3,55.4 L131.1,55.4 L170.5,55.4 L183.6,55.4 L224.1,55.4 L263.3,55.4 L303.2,55.4 L343.1,55.4 L388.2,55.4 L433.7,55.4 L461.2,55.4 L461.2,51.0 L465.7,50.9 L468.1,57.2 L472.2,59.1 L481.5,59.8 L495.0,61.6 L507.9,65.2 L518.7,63.7 L535.0,66.6 L539.4,66.5 L551.3,63.3 L563.7,67.4 L576.7,71.8 L587.5,75.6 L597.8,79.3 L599.1,82.2 L602.2,83.4 L601.4,84.5 L605.0,84.8 L607.6,83.7 L608.2,86.4 L610.9,88.2 L614.6,88.2 L616.5,89.6 L614.9,91.6 L628.7,96.9 L631.5,107.2 L634.2,117.1 L630.3,123.8 L624.1,130.1 L621.2,134.1 L620.9,135.3 L622.3,136.9 L626.9,138.7 L630.2,138.7 L645.6,132.6 L659.3,130.8 L676.7,125.2 L677.0,124.0 L675.8,120.5 L673.6,118.3 L679.6,116.5 L692.7,116.5 L704.9,116.5 L709.1,112.0 L710.8,111.1 L724.8,103.0 L730.8,100.9 L751.0,100.8 L775.5,100.8 L776.8,98.0 L781.1,97.4 L786.7,95.6 L791.4,90.5 L795.5,81.6 L805.6,73.0 L810.0,76.0 L819.0,74.1 L824.9,77.4 L824.8,92.9 L833.5,99.3 L835.8,103.0 L821.6,108.5 L808.0,112.5 L793.9,115.8 L786.9,122.6 L784.7,125.1 L784.5,131.2 L788.9,137.2 L794.4,137.5 L793.0,133.3 L797.0,135.9 L796.0,139.1 L787.0,141.0 L780.6,140.7 L770.8,142.7 L765.0,143.3 L757.3,143.8 L746.2,147.1 L765.7,145.0 L769.6,147.1 L751.0,150.6 L742.6,150.6 L743.0,149.2 L738.9,152.3 L742.8,152.9 L740.0,161.0 L730.3,169.8 L729.3,166.9 L726.4,166.3 L722.0,163.4 L724.8,169.6 L728.1,171.6 L728.3,175.9 L724.0,180.3 L716.6,189.4 L715.3,188.9 L719.5,181.2 L712.7,176.8 L711.1,167.4 L708.6,172.3 L711.4,179.5 L702.6,177.7 L711.8,181.4 L712.3,192.2 L716.1,193.0 L717.5,196.9 L719.4,208.3 L710.9,216.8 L697.2,220.1 L688.5,226.8 L681.8,227.5 L675.1,231.7 L673.2,235.5 L658.6,242.9 L651.1,248.3 L644.9,255.1 L642.8,263.1 L645.2,271.0 L649.6,280.8 L655.5,288.8 L655.6,293.7 L661.9,306.9 L661.4,314.6 L660.9,319.0 L657.5,326.0 L653.6,327.4 L647.0,326.0 L644.9,321.0 L639.9,318.4 L632.8,308.6 L626.7,299.9 L624.7,295.5 L627.4,287.9 L623.7,281.7 L613.3,272.2 L608.1,270.4 L594.7,275.6 L592.3,275.0 L585.9,269.7 L577.6,266.9 L562.5,268.3 L550.8,267.1 L540.6,267.9 L535.1,269.6 L537.5,272.7 L537.3,277.3 L540.1,279.5 L537.6,281.0 L532.7,279.3 L527.7,281.5 L518.0,281.1 L508.1,275.1 L496.5,276.5 L486.9,273.9 L478.6,274.7 L467.4,277.4 L455.3,285.8 L442.1,290.7 L434.9,296.1 L431.8,301.2 L431.7,309.1 L432.3,314.6 L434.9,318.4 L429.7,318.8 L420.2,316.3 L409.9,312.7 L406.1,307.4 L403.2,299.4 L395.4,292.9 L390.8,286.3 L384.1,278.5 L374.8,274.0 L363.9,274.2 L355.5,283.2 L344.5,279.8 L337.6,276.3 L334.3,270.1 L329.9,264.1 L322.0,259.1 L315.2,255.5 L310.4,251.5 L287.4,251.5 L287.3,256.2 L276.8,256.2 L250.4,256.3 L220.0,248.3 L200.0,242.7 L201.2,240.5 L184.4,241.7 L169.3,242.6 L167.0,236.8 L158.4,230.3 L152.2,228.9 L150.8,225.6 L143.3,225.1 L138.5,222.0 L126.2,220.9 L122.8,219.0 L121.2,212.8 L108.3,201.4 L97.2,185.6 L97.7,182.9 L91.8,179.2 L81.6,169.6 L79.7,160.4 L72.6,154.2 L75.6,144.7 L75.1,135.0 L70.9,126.3 L76.0,115.6 L77.7,105.2 L79.3,94.9 L76.9,79.7 L72.7,69.9 L68.8,64.6 L70.4,62.4 L89.6,66.3 L96.7,77.0 L100.0,74.0 L97.9,64.7 L93.3,55.4 Z'
