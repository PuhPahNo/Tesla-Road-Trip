import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { usePageMetadata } from './usePageMetadata'

export function NoIndexPage({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  const location = useLocation()
  usePageMetadata({
    title: `${title} | ChargeQuest`,
    description: 'A private ChargeQuest account and route-planning page.',
    path: location.pathname,
    robots: 'noindex,nofollow',
  })
  return children
}

export function NotFoundPage() {
  const location = useLocation()
  usePageMetadata({
    title: 'Page Not Found | ChargeQuest',
    description: 'That ChargeQuest page could not be found.',
    path: location.pathname,
    robots: 'noindex,nofollow',
  })

  return (
    <section className="flex min-h-[68vh] items-center bg-[#090a0c] px-5 py-20 text-white">
      <div className="mx-auto w-full max-w-[880px]">
        <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.17em] text-[#23d7d1]">404 · Wrong turn</div>
        <h1 className="mt-5 text-[clamp(54px,12vw,120px)] font-semibold leading-[0.86] tracking-[-0.07em]">This road ends here.</h1>
        <p className="mt-7 max-w-[570px] text-[17px] leading-[1.7] text-white/58">
          The page may have moved, or the address may be off. Head back to ChargeQuest and choose another direction.
        </p>
        <Link to="/" className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-[#e82127] px-7 py-3 text-[13px] font-semibold text-white no-underline">
          Return home
        </Link>
      </div>
    </section>
  )
}
