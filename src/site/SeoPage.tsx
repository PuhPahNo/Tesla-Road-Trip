import { ArrowRight, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  getRelatedSeoPages,
  seoPageStructuredData,
  type SeoPage as SeoPageContent,
} from '../seo/seoPages'
import { usePageMetadata } from './usePageMetadata'

export function SeoPage({ page }: { page: SeoPageContent }) {
  const relatedPages = getRelatedSeoPages(page)

  usePageMetadata({
    title: page.title,
    description: page.description,
    path: page.path,
    structuredData: seoPageStructuredData(page),
  })

  return (
    <article className="bg-[#f4f0e8] text-black">
      <header className="relative overflow-hidden bg-[#090a0c] px-4 py-20 text-white sm:px-6 sm:py-28 lg:px-12 lg:py-36">
        <div className="pointer-events-none absolute -right-32 -top-40 h-[520px] w-[520px] rounded-full bg-[#e82127]/20 blur-[130px]" />
        <div className="relative mx-auto max-w-[1180px]">
          <nav className="mb-14 flex flex-wrap items-center gap-2 font-mono text-[9px] uppercase tracking-[0.13em] text-white/42" aria-label="Breadcrumb">
            <Link to="/" className="text-white/42 no-underline hover:text-white">ChargeQuest</Link>
            <span aria-hidden="true">/</span>
            <span>{page.eyebrow}</span>
          </nav>
          <div className="font-mono text-[9px] font-semibold uppercase tracking-[0.17em] text-[#23d7d1]">{page.eyebrow}</div>
          <h1 className="mt-5 max-w-[1050px] text-[clamp(44px,8.5vw,104px)] font-semibold leading-[0.9] tracking-[-0.058em] sm:leading-[0.87] sm:tracking-[-0.067em]">
            {page.headline}
          </h1>
          <p className="mt-8 max-w-[790px] text-[17px] leading-[1.72] text-white/68 sm:text-[20px]">
            {page.intro}
          </p>
          <div className="mt-14 grid border-y border-white/15 sm:grid-cols-3">
            {page.facts.map((fact) => (
              <div key={fact.label} className="border-b border-white/15 px-0 py-6 last:border-b-0 sm:border-b-0 sm:border-r sm:px-6 sm:first:pl-0 sm:last:border-r-0">
                <div className="font-mono text-[8px] uppercase tracking-[0.12em] text-white/35">{fact.label}</div>
                <div className="mt-2 text-[18px] font-semibold tracking-[-0.025em]">{fact.value}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      <div className="px-4 py-20 sm:px-6 sm:py-28 lg:px-12 lg:py-36">
        <div className="mx-auto grid max-w-[1180px] gap-14 lg:grid-cols-[minmax(0,760px)_280px] lg:justify-between lg:gap-20">
          <div>
            {page.sections.map((section, index) => (
              <section key={section.heading} className={index > 0 ? 'mt-16 border-t border-black/14 pt-14' : ''}>
                <div className="mb-5 font-mono text-[8px] font-semibold uppercase tracking-[0.14em] text-[#e82127]">{String(index + 1).padStart(2, '0')}</div>
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
              </section>
            ))}

            {page.note ? (
              <aside className="mt-16 border border-black/12 bg-white/55 p-6 sm:p-8">
                <div className="font-mono text-[8px] font-semibold uppercase tracking-[0.14em] text-black/40">Important context</div>
                <p className="mt-3 text-[14px] leading-[1.75] text-black/60">{page.note}</p>
              </aside>
            ) : null}

            {page.sources.length ? (
              <section className="mt-12">
                <h2 className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-black/45">Official sources</h2>
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
          </div>

          <aside className="lg:pt-1">
            <div className="lg:sticky lg:top-28">
              <div className="font-mono text-[8px] font-semibold uppercase tracking-[0.14em] text-black/38">Keep exploring</div>
              <div className="mt-4 border-t border-black/14">
                {relatedPages.map((related) => (
                  <Link key={related.path} to={related.path} className="group block border-b border-black/14 py-5 text-black no-underline">
                    <div className="font-mono text-[7.5px] uppercase tracking-[0.11em] text-black/35">{related.eyebrow}</div>
                    <div className="mt-2 text-[15px] font-semibold leading-[1.25] tracking-[-0.02em] group-hover:text-[#e82127]">{related.headline}</div>
                  </Link>
                ))}
              </div>
              <div className="mt-8 bg-[#e82127] p-6 text-white">
                <div className="font-mono text-[8px] uppercase tracking-[0.13em] text-white/65">ChargeQuest CORE</div>
                <h2 className="mt-3 text-[25px] font-semibold leading-[1] tracking-[-0.04em]">{page.cta.title}</h2>
                <p className="mt-4 text-[13px] leading-[1.65] text-white/75">{page.cta.body}</p>
                <Link to={page.cta.path} className="mt-6 flex min-h-11 items-center justify-between rounded-full bg-black px-5 py-3 text-[12px] font-semibold text-white no-underline">
                  {page.cta.label}
                  <ArrowRight aria-hidden="true" size={16} />
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </article>
  )
}
