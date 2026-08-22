import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  MapPinned,
  Plus,
  Route as RouteIcon,
  Settings,
  Sparkles,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { fetchAccount, type AccountSnapshot } from '../api/siteClient'
import { PUBLISHED_ANTHONY_FIELD_NOTES } from '../content/anthonyFieldNotes'
import type { SavedCustomRoute } from '../domain/types'
import { SEO_PAGES, type SeoPage, type SeoPageKind } from '../seo/seoPages'
import { getSeoPagePresentation } from '../seo/siteArchitecture'
import { useAuth } from './AuthContext'

const EDITORIAL_KIND_LABELS: Partial<Record<SeoPageKind, string>> = {
  guide: 'Competition strategy',
  route: 'Road-trip field guide',
  badge: 'Iconic Charger guide',
}

const ROUTE_COVERS = [
  {
    src: '/landing/grand-canyon-1280.webp',
    alt: 'Sunlight breaking across the Grand Canyon',
    position: 'center',
  },
  {
    src: '/landing/golden-gate-1280.webp',
    alt: 'The Golden Gate Bridge at dusk',
    position: 'center 48%',
  },
  {
    src: '/landing/yellowstone-bison-1280.webp',
    alt: 'Bison crossing a road in Yellowstone',
    position: 'center',
  },
]

export function DashboardPage() {
  const { user } = useAuth()
  const [data, setData] = useState<AccountSnapshot>()
  const [error, setError] = useState<string>()

  useEffect(() => {
    void fetchAccount()
      .then((result) => {
        setData(result)
        setError(undefined)
      })
      .catch((requestError) => {
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Unable to load your dashboard.',
        )
      })
  }, [])

  const routes = useMemo(
    () => [...(data?.routes ?? [])].sort((left, right) =>
      right.updatedAt.localeCompare(left.updatedAt),
    ),
    [data?.routes],
  )
  const leadRoute = routes[0]
  const latestFieldNote = PUBLISHED_ANTHONY_FIELD_NOTES[0]
  const editorialItems = latestEditorialItems()

  if (!data && !error) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="min-h-[calc(100svh-117px)] bg-[#050506] px-5 py-16 text-white/45 sm:min-h-[calc(100vh-78px)]"
      >
        Loading your ChargeQuest dashboard…
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100svh-117px)] overflow-hidden bg-[#050506] text-white sm:min-h-[calc(100vh-78px)]">
      <section className="relative isolate min-h-[660px] overflow-hidden border-b border-white/10 sm:min-h-[720px]">
        <picture className="absolute inset-0 -z-20 block h-full w-full">
          <source
            type="image/avif"
            srcSet="/landing/desert-road-640.avif 640w, /landing/desert-road-960.avif 960w, /landing/desert-road-1280.avif 1280w, /landing/desert-road-1920.avif 1920w"
            sizes="100vw"
          />
          <source
            type="image/webp"
            srcSet="/landing/desert-road-640.webp 640w, /landing/desert-road-960.webp 960w, /landing/desert-road-1280.webp 1280w, /landing/desert-road-1920.webp 1920w"
            sizes="100vw"
          />
          <img
            src="/landing/desert-road-1280.jpg"
            alt="An open highway running through the painted desert"
            className="h-full w-full object-cover object-center"
            width={1280}
            height={1600}
            fetchPriority="high"
          />
        </picture>
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(3,3,4,.97)_0%,rgba(3,3,4,.82)_42%,rgba(3,3,4,.2)_78%,rgba(3,3,4,.38)_100%)]" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,#050506_0%,transparent_46%,rgba(0,0,0,.24)_100%)]" />
        <div className="absolute right-[8%] top-[19%] -z-10 h-72 w-72 rounded-full bg-[#e82127]/18 blur-[120px]" />

        <div className="mx-auto flex min-h-[660px] max-w-[1500px] flex-col justify-between px-4 py-7 sm:min-h-[720px] sm:px-7 sm:py-10 lg:px-12">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-black/35 px-4 py-2 font-mono text-[8px] font-semibold uppercase tracking-[0.15em] text-white/65 backdrop-blur-xl">
              <span className="h-1.5 w-1.5 rounded-full bg-[#23d7d1] shadow-[0_0_18px_#23d7d1]" />
              Your command center
            </div>
            <Link
              to="/account"
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/15 bg-black/30 px-4 py-2 text-[11px] font-semibold text-white/82 no-underline backdrop-blur-xl transition hover:border-white/35 hover:text-white"
            >
              <Settings size={13} aria-hidden="true" />
              Account settings
            </Link>
          </div>

          <div className="max-w-[1060px] pb-4 sm:pb-8">
            <div className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-[#ff5a52]">
              ChargeQuest / Signed in
            </div>
            <h1 aria-label={`Welcome back, ${user?.username}.`} className="mt-5 max-w-[980px] text-[clamp(58px,11vw,138px)] font-semibold leading-[0.78] tracking-[-0.075em] text-white">
              Welcome back,<br /><span>{user?.username}.</span>
            </h1>
            <p className="mt-8 max-w-[620px] text-[15px] leading-[1.7] text-white/64 sm:text-[18px]">
              Your next route, Anthony’s latest field note, and the stories worth
              building the drive around—all in one place.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                to={leadRoute ? plannerRouteHref(leadRoute.id) : '/planner'}
                className="group inline-flex min-h-14 items-center justify-between gap-6 rounded-full bg-white py-2 pl-6 pr-2 text-[13px] font-semibold text-black no-underline shadow-[0_18px_55px_rgba(0,0,0,.36)] transition hover:-translate-y-0.5"
              >
                <span>{leadRoute ? `Continue ${leadRoute.name}` : data ? 'Build your first route' : 'Open CORE'}</span>
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e82127] text-white transition group-hover:translate-x-0.5">
                  <ArrowRight size={15} aria-hidden="true" />
                </span>
              </Link>
              <Link
                to="/track-anthony"
                className="inline-flex min-h-14 items-center justify-center rounded-full border border-white/22 bg-black/25 px-6 py-3 text-[13px] font-semibold text-white no-underline backdrop-blur-xl transition hover:border-white/45"
              >
                Track Anthony
              </Link>
            </div>
          </div>

          <section aria-label="Account overview" className="grid overflow-hidden rounded-[18px] border border-white/12 bg-black/45 backdrop-blur-2xl sm:grid-cols-2 xl:grid-cols-4">
            <HeroMetric
              label="Saved routes"
              value={data ? String(routes.length) : '—'}
              detail={routes.length === 1 ? 'route in your library' : 'routes in your library'}
            />
            <HeroMetric
              label="Next departure"
              value={leadRoute?.startDate ? compactDate(leadRoute.startDate) : 'Not set'}
              detail={leadRoute?.name ?? 'Add dates inside CORE'}
            />
            <HeroMetric
              label="Ideas sent"
              value={data ? String(data.suggestions.length) : '—'}
              detail="route suggestions for Anthony"
            />
            <HeroMetric
              label="Latest field note"
              value={compactDate(latestFieldNote.publishedAt)}
              detail="new from Anthony"
            />
          </section>
        </div>
        <div className="absolute bottom-3 right-5 font-mono text-[7px] uppercase tracking-[0.12em] text-white/35">
          Photo · Pierre Jeanneret / Unsplash
        </div>
      </section>

      <main className="mx-auto max-w-[1500px] px-4 py-20 sm:px-7 sm:py-28 lg:px-12 lg:py-36">
        {error ? (
          <div className="mb-8 rounded-[12px] border border-[#e82127]/35 bg-[#e82127]/10 px-4 py-3 text-[13px] text-[#ffaaa7]">
            {error}
          </div>
        ) : null}

        <section aria-labelledby="dashboard-routes-heading">
          <SectionIntro
            eyebrow="01 / Your road library"
            heading="The road ahead."
            copy="Pick up an existing route exactly where you left it, or give CORE a completely different idea to chase."
            action={(
              <Link to="/planner" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-[11px] font-semibold text-white no-underline hover:border-white/35">
                <Plus size={13} aria-hidden="true" />
                Create or manage routes
              </Link>
            )}
          />

          <div className="mt-12 grid gap-5 xl:grid-cols-[minmax(0,1.52fr)_minmax(340px,.68fr)]">
            {!data ? (
              <EmptyRoutes
                heading="Your routes could not load right now."
                copy="CORE is still available, but this dashboard cannot confirm which routes are already saved to your account."
              />
            ) : routes.length ? (
              <div className="grid gap-5">
                {routes.map((route, index) => (
                  <SavedRouteVisual key={route.id} route={route} index={index} />
                ))}
              </div>
            ) : (
              <EmptyRoutes
                heading="Your first route starts in CORE."
                copy="Set your Tesla, practical range, daily pace, required stops, and the places worth building the trip around."
              />
            )}

            <aside className="group relative isolate min-h-[560px] overflow-hidden rounded-[22px] border border-white/12 bg-[#0b0c0f]" aria-labelledby="anthony-quest-heading">
              <img
                src="/landing/tesla-chargers-1280.webp"
                alt="Tesla Superchargers illuminated at night"
                className="absolute inset-0 -z-20 h-full w-full object-cover transition duration-700 group-hover:scale-[1.025]"
                width={1280}
                height={960}
                loading="lazy"
              />
              <div className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,rgba(4,5,7,.99)_0%,rgba(4,5,7,.78)_52%,rgba(4,5,7,.08)_100%)]" />
              <div className="flex min-h-[560px] flex-col justify-between p-6 sm:p-8">
                <div className="flex items-center justify-between gap-3 font-mono text-[8px] font-semibold uppercase tracking-[0.15em] text-white/70">
                  <span>Anthony’s 2026 quest</span>
                  <MapPinned size={19} className="text-[#ff5149]" aria-hidden="true" />
                </div>
                <div>
                  <div className="font-mono text-[8px] uppercase tracking-[0.13em] text-[#23d7d1]">
                    Latest field note · {compactDate(latestFieldNote.publishedAt)}
                  </div>
                  <h2 id="anthony-quest-heading" className="mt-4 text-[clamp(37px,4.2vw,58px)] font-semibold leading-[0.88] tracking-[-0.06em]">
                    {latestFieldNote.title}
                  </h2>
                  <p className="mt-5 line-clamp-4 text-[13px] leading-[1.7] text-white/57">
                    {latestFieldNote.excerpt}
                  </p>
                  <div className="mt-7 flex flex-col gap-2 sm:flex-row xl:flex-col 2xl:flex-row">
                    <Link
                      to={`/track-anthony#journal-${latestFieldNote.id}`}
                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-[11px] font-semibold text-black no-underline"
                    >
                      Read the field note
                      <ArrowRight size={13} aria-hidden="true" />
                    </Link>
                    <Link
                      to="/community"
                      className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/20 bg-black/25 px-5 py-3 text-[11px] font-semibold text-white no-underline backdrop-blur-lg"
                    >
                      Challenge the route
                    </Link>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="mt-32 sm:mt-40" aria-labelledby="dashboard-latest-heading">
          <SectionIntro
            eyebrow="02 / Recently published"
            heading="Stories for the drive."
            copy="Competition strategy, routes worth stealing, and places that deserve more than a charging stop."
            action={(
              <Link to="/2026-tesla-supercharging-competition" className="inline-flex items-center gap-2 text-[11px] font-semibold text-white no-underline">
                Explore the Field Guide
                <ArrowRight size={13} aria-hidden="true" />
              </Link>
            )}
          />

          <div className="mt-12 grid gap-5 lg:grid-cols-12">
            {editorialItems.map((page, index) => (
              <ArticleCoverCard
                key={page.path}
                page={page}
                featured={index === 0}
              />
            ))}
          </div>
        </section>

        <section className="mt-32 border-t border-white/12 pt-12 sm:mt-40 sm:pt-16" aria-labelledby="quick-actions-heading">
          <div className="font-mono text-[8px] font-semibold uppercase tracking-[0.16em] text-[#ff5149]">03 / Keep moving</div>
          <h2 id="quick-actions-heading" className="mt-4 text-[clamp(46px,8vw,92px)] font-semibold leading-[0.85] tracking-[-0.065em]">
            What’s next?
          </h2>
          <div className="mt-10 grid gap-px overflow-hidden rounded-[20px] border border-white/12 bg-white/10 md:grid-cols-3">
            <QuickAction to="/planner" number="01" title="Open CORE" detail="Build, edit, or compare a route" icon={<RouteIcon size={22} aria-hidden="true" />} />
            <QuickAction to="/community" number="02" title="Send Anthony an idea" detail="Suggest a stop, challenge, or meetup" icon={<Sparkles size={22} aria-hidden="true" />} />
            <QuickAction to="/account" number="03" title="Account settings" detail="Change your password and review access" icon={<Settings size={22} aria-hidden="true" />} />
          </div>
          <div className="mt-5 text-right font-mono text-[8px] uppercase tracking-[0.12em] text-white/30">
            {data ? `${data.meetups.length} meetup invitations sent from this account` : 'Community activity unavailable'}
          </div>
        </section>
      </main>
    </div>
  )
}

function HeroMetric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="border-b border-white/10 px-5 py-5 last:border-b-0 sm:border-r sm:[&:nth-child(2)]:border-r-0 sm:[&:nth-child(n+3)]:border-b-0 xl:border-b-0 xl:[&:nth-child(2)]:border-r xl:last:border-r-0">
      <div className="font-mono text-[7px] font-semibold uppercase tracking-[0.13em] text-white/40">{label}</div>
      <div className="mt-2 text-[25px] font-semibold leading-none tracking-[-0.045em]">{value}</div>
      <div className="mt-2 truncate text-[10px] text-white/38">{detail}</div>
    </div>
  )
}

function SectionIntro({ eyebrow, heading, copy, action }: { eyebrow: string; heading: string; copy: string; action: ReactNode }) {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
      <div>
        <div className="font-mono text-[8px] font-semibold uppercase tracking-[0.16em] text-[#ff5149]">{eyebrow}</div>
        <h2 id={heading === 'The road ahead.' ? 'dashboard-routes-heading' : heading === 'Stories for the drive.' ? 'dashboard-latest-heading' : undefined} className="mt-4 text-[clamp(52px,9vw,104px)] font-semibold leading-[0.82] tracking-[-0.07em]">
          {heading}
        </h2>
      </div>
      <div className="lg:pb-1">
        <p className="max-w-[420px] text-[14px] leading-[1.75] text-white/50">{copy}</p>
        <div className="mt-6">{action}</div>
      </div>
    </div>
  )
}

function SavedRouteVisual({ route, index }: { route: SavedCustomRoute; index: number }) {
  const firstWaypoint = route.waypoints[0]?.label
  const lastWaypoint = route.waypoints.at(-1)?.label
  const cover = ROUTE_COVERS[index % ROUTE_COVERS.length]

  return (
    <article className="group relative isolate min-h-[560px] overflow-hidden rounded-[22px] border border-white/12 bg-[#0b0c0f]">
      <img
        src={cover.src}
        alt={cover.alt}
        className="absolute inset-0 -z-20 h-full w-full object-cover transition duration-700 group-hover:scale-[1.025]"
        style={{ objectPosition: cover.position }}
        width={1280}
        height={853}
        loading="lazy"
      />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,rgba(3,4,5,.98)_0%,rgba(3,4,5,.72)_50%,rgba(3,4,5,.07)_100%)]" />
      <div className="flex min-h-[560px] flex-col justify-between p-6 sm:p-9">
        <div className="flex items-center justify-between gap-4">
          <div className="rounded-full border border-white/16 bg-black/30 px-3 py-2 font-mono text-[7px] font-semibold uppercase tracking-[0.14em] text-white/72 backdrop-blur-lg">
            Saved route · Updated {compactDate(route.updatedAt)}
          </div>
          <span className="h-2.5 w-2.5 rounded-full shadow-[0_0_20px_currentColor]" style={{ color: route.color, background: route.color }} />
        </div>

        <div>
          <h3 className="max-w-[900px] text-[clamp(48px,7vw,90px)] font-semibold leading-[0.82] tracking-[-0.07em]">
            {route.name}
          </h3>
          {firstWaypoint ? (
            <p className="mt-5 max-w-[760px] text-[13px] leading-[1.6] text-white/60 sm:text-[15px]">
              {firstWaypoint}{lastWaypoint && lastWaypoint !== firstWaypoint ? ` → ${lastWaypoint}` : ''}
            </p>
          ) : null}
          <div className="mt-8 grid grid-cols-3 border-y border-white/14 py-5">
            <RouteFact icon={<CalendarDays size={14} aria-hidden="true" />} label="Departure" value={route.startDate ? readableDate(route.startDate) : 'Not set'} />
            <RouteFact icon={<MapPinned size={14} aria-hidden="true" />} label="Route anchors" value={String(route.waypoints.length)} />
            <RouteFact icon={<BookOpen size={14} aria-hidden="true" />} label="Target" value={route.targetDays ? `${route.targetDays} days` : 'Flexible'} />
          </div>
          <Link
            to={plannerRouteHref(route.id)}
            className="mt-7 inline-flex min-h-12 items-center gap-3 rounded-full bg-white px-6 py-3 text-[12px] font-semibold text-black no-underline transition hover:bg-[#e82127] hover:text-white"
          >
            Open in CORE
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  )
}

function RouteFact({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="min-w-0 border-r border-white/12 px-3 first:pl-0 last:border-r-0 last:pr-0">
      <div className="flex items-center gap-1.5 text-white/35">
        {icon}
        <span className="font-mono text-[6px] uppercase tracking-[0.1em] sm:text-[7px]">{label}</span>
      </div>
      <div className="mt-2 truncate text-[10px] font-semibold text-white/85 sm:text-[12px]">{value}</div>
    </div>
  )
}

function EmptyRoutes({ heading, copy }: { heading: string; copy: string }) {
  return (
    <div className="flex min-h-[560px] flex-col justify-end rounded-[22px] border border-white/12 bg-[radial-gradient(circle_at_70%_15%,rgba(232,33,39,.18),transparent_38%),#0b0c0f] p-7 sm:p-10">
      <RouteIcon size={31} strokeWidth={1.4} className="text-[#ff5149]" aria-hidden="true" />
      <h3 className="mt-6 max-w-[700px] text-[clamp(42px,7vw,78px)] font-semibold leading-[0.86] tracking-[-0.065em]">{heading}</h3>
      <p className="mt-5 max-w-[620px] text-[14px] leading-[1.7] text-white/50">{copy}</p>
      <Link to="/planner" className="mt-7 inline-flex min-h-12 w-fit items-center gap-2 rounded-full bg-white px-6 py-3 text-[12px] font-semibold text-black no-underline">
        Open CORE
        <ArrowRight size={14} aria-hidden="true" />
      </Link>
    </div>
  )
}

function ArticleCoverCard({ page, featured }: { page: SeoPage; featured: boolean }) {
  const presentation = getSeoPagePresentation(page)

  return (
    <article className={`group relative isolate min-h-[520px] overflow-hidden rounded-[22px] border border-white/12 bg-[#101115] ${featured ? 'lg:col-span-6' : 'lg:col-span-3'}`}>
      <img
        src={presentation.socialImage}
        alt={presentation.socialImageAlt}
        className="absolute inset-0 -z-20 h-full w-full object-cover transition duration-700 group-hover:scale-[1.035]"
        width={presentation.socialImageWidth}
        height={presentation.socialImageHeight}
        loading="lazy"
      />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,rgba(4,5,6,.98)_0%,rgba(4,5,6,.68)_58%,rgba(4,5,6,.04)_100%)]" />
      <Link to={page.path} aria-label={`Read ${page.headline}`} className="flex min-h-[520px] flex-col justify-between p-6 text-white no-underline sm:p-8">
        <div className="flex items-center justify-between gap-4 font-mono text-[7px] font-semibold uppercase tracking-[0.13em] text-white/72">
          <span>{EDITORIAL_KIND_LABELS[page.kind]}</span>
          <span>{compactDate(page.updatedAt)}</span>
        </div>
        <div>
          <h3 className={`${featured ? 'text-[clamp(40px,5.2vw,70px)]' : 'text-[clamp(34px,3.5vw,49px)]'} font-semibold leading-[0.9] tracking-[-0.055em]`}>
            {page.headline}
          </h3>
          <p className="mt-5 line-clamp-3 text-[12.5px] leading-[1.65] text-white/55">{page.intro}</p>
          <div className="mt-6 inline-flex items-center gap-2 text-[11px] font-semibold text-white">
            Read the story
            <ArrowRight size={13} className="transition group-hover:translate-x-1" aria-hidden="true" />
          </div>
        </div>
      </Link>
    </article>
  )
}

function QuickAction({ to, number, title, detail, icon }: { to: string; number: string; title: string; detail: string; icon: ReactNode }) {
  return (
    <Link to={to} className="group flex min-h-[250px] flex-col justify-between bg-[#0b0c0f] p-6 text-white no-underline transition hover:bg-[#111318] sm:p-8">
      <div className="flex items-start justify-between gap-3 text-white/35">
        <span className="font-mono text-[8px] uppercase tracking-[0.13em]">{number}</span>
        {icon}
      </div>
      <div>
        <h3 className="text-[29px] font-semibold leading-[1] tracking-[-0.045em]">{title}</h3>
        <div className="mt-3 flex items-end justify-between gap-4">
          <p className="text-[11px] leading-[1.6] text-white/42">{detail}</p>
          <ArrowRight size={15} className="flex-none text-white/45 transition group-hover:translate-x-1 group-hover:text-[#ff5149]" aria-hidden="true" />
        </div>
      </div>
    </Link>
  )
}

function latestEditorialItems(): SeoPage[] {
  const byRecency = [...SEO_PAGES].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
  return (['guide', 'route', 'badge'] as const)
    .map((kind) => byRecency.find((page) => page.kind === kind))
    .filter((page): page is SeoPage => Boolean(page))
}

function plannerRouteHref(routeId: string) {
  return `/planner?route=${encodeURIComponent(routeId)}`
}

function compactDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(dateValue(value))
}

function readableDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(dateValue(value))
}

function dateValue(value: string) {
  return new Date(value.includes('T') ? value : `${value}T12:00:00`)
}
