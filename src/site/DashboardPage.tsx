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
import { useAuth } from './AuthContext'

const EDITORIAL_KIND_LABELS: Partial<Record<SeoPageKind, string>> = {
  guide: 'Competition guide',
  route: 'Road-trip field guide',
  badge: 'Iconic Charger guide',
}

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
        className="min-h-[calc(100svh-117px)] bg-[#ece9e1] px-5 py-16 text-black/50 sm:min-h-[calc(100vh-78px)]"
      >
        Loading your ChargeQuest dashboard…
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100svh-117px)] bg-[#ece9e1] text-[#0a0b0d] sm:min-h-[calc(100vh-78px)]">
      <header className="border-b border-black/12 bg-[#f5f2eb] px-4 py-8 sm:px-6 sm:py-10 lg:px-10">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="font-mono text-[8px] font-semibold uppercase tracking-[0.14em] text-[#c9161d]">
              Your dashboard
            </div>
            <h1 className="mt-2 text-[clamp(34px,5vw,54px)] font-semibold leading-[0.98] tracking-[-0.052em]">
              Welcome back, {user?.username}.
            </h1>
            <p className="mt-3 max-w-[680px] text-[13px] leading-[1.65] text-black/55 sm:text-[14px]">
              Continue a saved route, follow Anthony’s 2026 quest, or catch up on
              what changed since your last visit.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              to={leadRoute ? plannerRouteHref(leadRoute.id) : '/planner'}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#e82127] px-5 py-3 text-[12px] font-semibold text-white no-underline transition hover:bg-black"
            >
              {leadRoute ? `Continue ${leadRoute.name}` : data ? 'Build your first route' : 'Open CORE'}
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
            <Link
              to="/account"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-black/18 px-5 py-3 text-[12px] font-semibold text-black no-underline"
            >
              <Settings size={14} aria-hidden="true" />
              Account settings
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
        {error ? (
          <div className="mb-6 rounded-[8px] border border-[#e82127]/25 bg-[#e82127]/8 px-4 py-3 text-[13px] text-[#a91319]">
            {error}
          </div>
        ) : null}

        <section aria-label="Account overview" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <OverviewCard
            icon={<RouteIcon size={17} aria-hidden="true" />}
            label="Saved routes"
            value={data ? String(routes.length) : '—'}
            detail={routes.length === 1 ? 'route in your library' : 'routes in your library'}
          />
          <OverviewCard
            icon={<CalendarDays size={17} aria-hidden="true" />}
            label="Next departure"
            value={leadRoute?.startDate ? readableDate(leadRoute.startDate, false) : 'Not set'}
            detail={leadRoute?.name ?? 'Add dates inside CORE'}
          />
          <OverviewCard
            icon={<Sparkles size={17} aria-hidden="true" />}
            label="Ideas sent"
            value={data ? String(data.suggestions.length) : '—'}
            detail="route suggestions for Anthony"
          />
          <OverviewCard
            icon={<BookOpen size={17} aria-hidden="true" />}
            label="Latest field note"
            value={compactDate(latestFieldNote.publishedAt)}
            detail="from Anthony’s trip journal"
          />
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(330px,.7fr)]">
          <section className="border border-black/12 bg-[#f8f5ee]" aria-labelledby="dashboard-routes-heading">
            <DashboardSectionHeader
              eyebrow="Your road library"
              heading="Saved routes"
              action={(
                <Link to="/planner" className="inline-flex items-center gap-2 text-[11px] font-semibold text-black no-underline">
                  <Plus size={13} aria-hidden="true" />
                  Create or manage
                </Link>
              )}
            />

            {!data ? (
              <EmptyRoutes
                heading="Your routes could not load right now."
                copy="CORE is still available, but this dashboard cannot confirm which routes are already saved to your account."
              />
            ) : routes.length ? (
              <div className="divide-y divide-black/10">
                {routes.map((route) => <SavedRouteRow key={route.id} route={route} />)}
              </div>
            ) : (
              <EmptyRoutes
                heading="Your first route starts in CORE."
                copy="Set your Tesla, practical range, daily pace, required stops, and the places worth building the trip around."
              />
            )}
          </section>

          <aside className="flex flex-col overflow-hidden bg-[#090a0c] text-white" aria-labelledby="anthony-quest-heading">
            <div className="border-b border-white/12 p-6 sm:p-7">
              <div className="flex items-center justify-between gap-4">
                <div className="font-mono text-[8px] font-semibold uppercase tracking-[0.14em] text-[#23d7d1]">
                  Anthony’s 2026 quest
                </div>
                <MapPinned size={21} className="text-[#e82127]" aria-hidden="true" />
              </div>
              <h2 id="anthony-quest-heading" className="mt-5 text-[31px] font-semibold leading-[1] tracking-[-0.045em]">
                Follow the route. Help make it better.
              </h2>
              <p className="mt-4 text-[13px] leading-[1.65] text-white/55">
                See Anthony’s 73-day plan, the stations already locked in, and the
                questions he is still trying to answer before departure.
              </p>
              <div className="mt-6 grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <Link to="/track-anthony" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-4 py-3 text-[11px] font-semibold text-black no-underline">
                  Track Anthony
                  <ArrowRight size={13} aria-hidden="true" />
                </Link>
                <Link to="/community" className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/20 px-4 py-3 text-[11px] font-semibold text-white no-underline">
                  Challenge the route
                </Link>
              </div>
            </div>
            <div className="flex flex-1 flex-col p-6 sm:p-7">
              <div className="font-mono text-[8px] font-semibold uppercase tracking-[0.13em] text-white/38">
                Latest from Anthony · {compactDate(latestFieldNote.publishedAt)}
              </div>
              <h3 className="mt-4 text-[23px] font-semibold leading-[1.08] tracking-[-0.035em]">
                {latestFieldNote.title}
              </h3>
              <p className="mt-3 line-clamp-3 text-[12.5px] leading-[1.65] text-white/50">
                {latestFieldNote.excerpt}
              </p>
              <Link
                to={`/track-anthony#journal-${latestFieldNote.id}`}
                className="mt-auto inline-flex items-center gap-2 pt-7 text-[11px] font-semibold text-[#23d7d1] no-underline"
              >
                Read the field note
                <ArrowRight size={13} aria-hidden="true" />
              </Link>
            </div>
          </aside>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(330px,.7fr)]">
          <section className="border border-black/12 bg-[#f8f5ee]" aria-labelledby="dashboard-latest-heading">
            <DashboardSectionHeader
              eyebrow="Recently updated"
              heading="Field Guide"
              action={(
                <Link to="/2026-tesla-supercharging-competition" className="inline-flex items-center gap-2 text-[11px] font-semibold text-black no-underline">
                  View competition guide
                  <ArrowRight size={13} aria-hidden="true" />
                </Link>
              )}
            />
            <div className="divide-y divide-black/10">
              {editorialItems.map((page) => <EditorialRow key={page.path} page={page} />)}
            </div>
          </section>

          <section className="border border-black/12 bg-[#f8f5ee]" aria-labelledby="quick-actions-heading">
            <DashboardSectionHeader eyebrow="Shortcuts" heading="Quick actions" />
            <div className="divide-y divide-black/10">
              <QuickAction to="/planner" title="Open CORE" detail="Build, edit, or compare a route" />
              <QuickAction to="/community" title="Send Anthony an idea" detail="Suggest a stop, challenge, or meetup" />
              <QuickAction to="/account" title="Account settings" detail="Change your password and review access" />
            </div>
            <div className="border-t border-black/10 bg-black/[.025] px-6 py-4 text-[11px] leading-[1.55] text-black/45">
              {data ? `${data.meetups.length} meetup invitations sent from this account.` : 'Community activity is unavailable right now.'}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

function OverviewCard({ icon, label, value, detail }: { icon: ReactNode; label: string; value: string; detail: string }) {
  return (
    <div className="border border-black/12 bg-[#f8f5ee] p-5">
      <div className="flex items-center justify-between gap-3 text-black/42">
        <span className="font-mono text-[8px] font-semibold uppercase tracking-[0.11em]">{label}</span>
        {icon}
      </div>
      <div className="mt-5 truncate text-[25px] font-semibold leading-none tracking-[-0.04em]">{value}</div>
      <div className="mt-2 truncate text-[10px] text-black/43">{detail}</div>
    </div>
  )
}

function DashboardSectionHeader({ eyebrow, heading, action }: { eyebrow: string; heading: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 border-b border-black/12 px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
      <div>
        <div className="font-mono text-[7px] font-semibold uppercase tracking-[0.13em] text-[#c9161d]">{eyebrow}</div>
        <h2 className="mt-2 text-[25px] font-semibold leading-none tracking-[-0.04em]">{heading}</h2>
      </div>
      {action}
    </div>
  )
}

function SavedRouteRow({ route }: { route: SavedCustomRoute }) {
  const firstWaypoint = route.waypoints[0]?.label
  const lastWaypoint = route.waypoints.at(-1)?.label

  return (
    <article className="relative grid gap-5 px-5 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-6">
      <span aria-hidden="true" className="absolute inset-y-4 left-0 w-1" style={{ background: route.color }} />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h3 className="truncate text-[21px] font-semibold leading-none tracking-[-0.035em]">{route.name}</h3>
          <span className="font-mono text-[7px] uppercase tracking-[0.1em] text-black/35">Updated {compactDate(route.updatedAt)}</span>
        </div>
        {firstWaypoint ? (
          <p className="mt-2 truncate text-[11px] text-black/48">
            {firstWaypoint}{lastWaypoint && lastWaypoint !== firstWaypoint ? ` → ${lastWaypoint}` : ''}
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
          <InlineFact label="Start" value={route.startDate ? readableDate(route.startDate, true) : 'Not set'} />
          <InlineFact label="Stops" value={String(route.waypoints.length)} />
          <InlineFact label="Target" value={route.targetDays ? `${route.targetDays} days` : 'Flexible'} />
        </div>
      </div>
      <Link to={plannerRouteHref(route.id)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-black/15 px-4 py-2 text-[11px] font-semibold text-black no-underline">
        Open in CORE
        <ArrowRight size={13} aria-hidden="true" />
      </Link>
    </article>
  )
}

function InlineFact({ label, value }: { label: string; value: string }) {
  return (
    <span className="text-[10px] text-black/45">
      <strong className="mr-1 font-mono text-[7px] uppercase tracking-[0.08em] text-black/35">{label}</strong>
      <span className="font-semibold text-black/70">{value}</span>
    </span>
  )
}

function EmptyRoutes({ heading, copy }: { heading: string; copy: string }) {
  return (
    <div className="px-5 py-9 sm:px-6">
      <RouteIcon size={23} strokeWidth={1.5} className="text-black/45" aria-hidden="true" />
      <h3 className="mt-4 text-[23px] font-semibold tracking-[-0.035em]">{heading}</h3>
      <p className="mt-2 max-w-[620px] text-[12.5px] leading-[1.65] text-black/50">{copy}</p>
      <Link to="/planner" className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-full bg-black px-4 py-2 text-[11px] font-semibold text-white no-underline">
        Open CORE
        <ArrowRight size={13} aria-hidden="true" />
      </Link>
    </div>
  )
}

function EditorialRow({ page }: { page: SeoPage }) {
  return (
    <article className="grid gap-4 px-5 py-5 sm:grid-cols-[120px_minmax(0,1fr)_auto] sm:items-center sm:px-6">
      <div className="font-mono text-[7px] font-semibold uppercase tracking-[0.1em] text-black/38">
        {EDITORIAL_KIND_LABELS[page.kind]}
        <div className="mt-1 text-black/25">{compactDate(page.updatedAt)}</div>
      </div>
      <div className="min-w-0">
        <h3 className="text-[17px] font-semibold leading-[1.15] tracking-[-0.025em]">{page.headline}</h3>
        <p className="mt-1 line-clamp-1 text-[11px] text-black/46">{page.intro}</p>
      </div>
      <Link to={page.path} aria-label={`Read ${page.headline}`} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/14 text-black no-underline">
        <ArrowRight size={13} aria-hidden="true" />
      </Link>
    </article>
  )
}

function QuickAction({ to, title, detail }: { to: string; title: string; detail: string }) {
  return (
    <Link to={to} className="group flex items-center justify-between gap-4 px-5 py-5 text-black no-underline sm:px-6">
      <span>
        <strong className="block text-[14px] font-semibold">{title}</strong>
        <span className="mt-1 block text-[10.5px] text-black/42">{detail}</span>
      </span>
      <ArrowRight size={14} className="text-black/35 transition group-hover:translate-x-1 group-hover:text-[#e82127]" aria-hidden="true" />
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

function readableDate(value: string, includeYear: boolean) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    ...(includeYear ? { year: 'numeric' } : {}),
  }).format(dateValue(value))
}

function dateValue(value: string) {
  return new Date(value.includes('T') ? value : `${value}T12:00:00`)
}
