import { useMemo, useState, type ReactNode } from 'react'
import type { RoutePlan, StationUniverseStats } from '../domain/types'
import type { StateRouteStats } from '../domain/routeStats'
import type { StationsResponse } from '../api/client'
import {
  Collapsible,
  Eyebrow,
  ProgressBar,
  SegmentedControl,
  StatTile,
  cx,
  toneClasses,
  type Tone,
} from '../ui/primitives'
import { AlertIcon, InfoIcon, RefreshIcon } from '../ui/icons'

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */
export type RoadStatusVM = {
  status: 'idle' | 'loading' | 'ready' | 'error' | 'estimate' | 'fallback'
  routeName?: string
  message?: string
}

export type AllSitesFeasibility = StationUniverseStats['allSitesFeasibility']

export interface SidebarProps {
  route?: RoutePlan
  stationStatus?: StationsResponse
  isLoadingStations: boolean
  routeStateStats: StateRouteStats[]
  feasibility?: AllSitesFeasibility
  roadStatus: RoadStatusVM
  passportDeadline: string
  onSelectState: (state: string) => void
  onHoverState?: (state: string | undefined) => void
  highlightedState?: string
  onRefresh: () => void
  copilot?: ReactNode
  className?: string
}

/* ------------------------------------------------------------------ */
/* Shared note card (warnings / advisories / status lines)            */
/* ------------------------------------------------------------------ */
function NoteCard({
  tone,
  icon,
  children,
}: {
  tone: Tone
  icon?: ReactNode
  children: ReactNode
}) {
  return (
    <div
      className={cx(
        'flex items-start gap-2 rounded-[9px] border px-[11px] py-[9px] text-[11.5px] leading-[1.45]',
        toneClasses(tone),
      )}
    >
      {icon ? <span className="mt-px flex-none">{icon}</span> : null}
      <span className="min-w-0">{children}</span>
    </div>
  )
}

function advisoryTone(severity: 'info' | 'medium' | 'high'): Tone {
  if (severity === 'high') return 'warn'
  if (severity === 'medium') return 'warn'
  return 'info'
}

/* Spacious, always-expanded card — used on mobile sheets where the compact
   desktop collapsibles read as cramped. */
function BareCard({
  eyebrow,
  title,
  meta,
  children,
}: {
  eyebrow: ReactNode
  title: ReactNode
  meta?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-2.5 rounded-xl border border-edge bg-panel p-4">
      <div className="flex items-baseline justify-between gap-2">
        <div className="min-w-0">
          <Eyebrow>{eyebrow}</Eyebrow>
          <div className="mt-1 text-[15px] font-semibold leading-snug text-ink">{title}</div>
        </div>
        {meta ? (
          <span className="flex-none font-mono text-[11.5px] text-dim">{meta}</span>
        ) : null}
      </div>
      {children}
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Hero stats — 2x2 grid of StatTiles                                  */
/* ------------------------------------------------------------------ */
export function HeroStats({ route }: { route?: RoutePlan }) {
  const dash = '-'
  return (
    <div className="grid grid-cols-2 gap-[9px]">
      <StatTile
        label="Unique sites"
        value={route ? route.uniqueStations.toLocaleString() : dash}
      />
      <StatTile
        label="Total miles"
        value={route ? route.totalMiles.toLocaleString() : dash}
        unit={route ? 'mi' : undefined}
      />
      <StatTile label="Days" value={route ? route.totalDays : dash} />
      <StatTile
        label="Avg drive/day"
        value={route ? route.averageDriveHoursPerDay : dash}
        unit={route ? 'h' : undefined}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Route warnings / advisories                                         */
/* ------------------------------------------------------------------ */
function RouteNotes({ route }: { route?: RoutePlan }) {
  const warnings = route?.warnings ?? []
  const advisories = route?.advisories ?? []
  if (warnings.length === 0 && advisories.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      {warnings.map((warning, i) => (
        <NoteCard key={`w-${i}`} tone="warn" icon={<AlertIcon size={13} />}>
          {warning}
        </NoteCard>
      ))}
      {advisories.map((advisory, i) => (
        <NoteCard
          key={`a-${i}`}
          tone={advisoryTone(advisory.severity)}
          icon={
            advisory.severity === 'high' ? (
              <AlertIcon size={13} />
            ) : (
              <InfoIcon size={13} />
            )
          }
        >
          {advisory.message}
        </NoteCard>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Feasibility — all-sites reality check                               */
/* ------------------------------------------------------------------ */
const FEASIBILITY_VERDICT: Record<
  AllSitesFeasibility['verdict'],
  { title: string; tone: Tone }
> = {
  plausible: { title: 'Plausible target', tone: 'good' },
  aggressive: { title: 'Aggressive target', tone: 'warn' },
  not_plausible: { title: 'Not plausible', tone: 'warn' },
}

export function FeasibilitySection({
  feasibility,
  bare,
}: {
  feasibility?: AllSitesFeasibility
  bare?: boolean
}) {
  if (!feasibility) return null
  const verdict = FEASIBILITY_VERDICT[feasibility.verdict]
  const strong = feasibility.verdict === 'not_plausible'

  const body = (
    <>
      <div
        className={cx(
          'font-mono leading-[1.6] text-dim',
          bare ? 'text-[12.5px]' : 'text-[11.5px]',
        )}
      >
        <span className="text-ink">{feasibility.totalStations.toLocaleString()}</span> open
        filtered sites ·{' '}
        <span className="text-ink">{feasibility.requiredStationsPerDay}</span> sites/day
        needed
      </div>
      <NoteCard tone={verdict.tone} icon={strong ? <AlertIcon size={13} /> : undefined}>
        {feasibility.explanation}
      </NoteCard>
      <div
        className={cx(
          'font-mono leading-[1.5] text-faint',
          bare ? 'text-[12px]' : 'text-[11px]',
        )}
      >
        Min stop-only <span className="text-dim">{feasibility.minimumStopHours}h</span> ·
        distance-charge <span className="text-dim">{feasibility.distanceStopHours}h</span>
      </div>
    </>
  )

  if (bare) {
    return (
      <BareCard eyebrow="All-sites reality check" title={verdict.title}>
        {body}
      </BareCard>
    )
  }

  return (
    <Collapsible defaultOpen eyebrow="All-sites reality check" title={verdict.title}>
      <div className="flex flex-col gap-2.5 px-3.5 pb-3.5 pt-0.5">{body}</div>
    </Collapsible>
  )
}

/* ------------------------------------------------------------------ */
/* Coverage — stations by state                                        */
/* ------------------------------------------------------------------ */
type CoverageSort = 'sites' | 'coverage'

const COVERAGE_SORT_OPTIONS: Array<{ value: CoverageSort; label: string }> = [
  { value: 'sites', label: 'Sites' },
  { value: 'coverage', label: 'Percent' },
]

export function CoverageSection({
  stats,
  onSelectState,
  onHoverState,
  highlightedState,
  bare,
}: {
  stats: StateRouteStats[]
  onSelectState: (s: string) => void
  onHoverState?: (s: string | undefined) => void
  highlightedState?: string
  /** Render the list without the collapsible chrome (e.g. inside a dedicated tab). */
  bare?: boolean
}) {
  const [sortBy, setSortBy] = useState<CoverageSort>('sites')
  const rows = useMemo(
    () =>
      [...stats].sort((a, b) => {
        if (sortBy === 'coverage') {
          return b.coveragePct - a.coveragePct || b.routeStations - a.routeStations
        }
        return b.routeStations - a.routeStations || b.coveragePct - a.coveragePct
      }),
    [stats, sortBy],
  )
  const maxRouteStations = rows.reduce((max, stat) => Math.max(max, stat.routeStations), 0)
  const maxCoveragePct = rows.reduce((max, stat) => Math.max(max, stat.coveragePct), 0)
  const maxValue = sortBy === 'sites' ? maxRouteStations : maxCoveragePct

  const list = (
    <div className="flex flex-col gap-1.5">
      {rows.length === 0 ? (
        <div className="text-[12px] text-faint">No states on this route yet.</div>
      ) : (
        rows.map((stat) => {
          const value = sortBy === 'sites' ? stat.routeStations : stat.coveragePct
          const barPct = maxValue > 0 ? (value / maxValue) * 100 : 0
          const active = highlightedState === stat.state
          return (
            <button
              key={`${stat.country}-${stat.state}`}
              type="button"
              onClick={() => onSelectState(stat.state)}
              onMouseEnter={() => onHoverState?.(stat.state)}
              onMouseLeave={() => onHoverState?.(undefined)}
              onFocus={() => onHoverState?.(stat.state)}
              onBlur={() => onHoverState?.(undefined)}
              aria-label={`${stat.state} coverage ${stat.coveragePct}%`}
              className={cx(
                'block w-full min-h-11 cursor-pointer rounded-lg px-2 py-1.5 text-left transition md:min-h-0',
                active ? 'bg-panel2 ring-1 ring-accent2/40' : 'hover:bg-panel2',
              )}
            >
              <div className="mb-[5px] flex items-baseline justify-between gap-2">
                <span className="min-w-0 truncate text-[12.5px] font-semibold text-ink">
                  {stat.state}
                  <span className="ml-[7px] font-mono text-[11px] font-normal text-faint">
                    {stat.routeStations} of {stat.totalStations} ·{' '}
                    {stat.miles.toLocaleString()} mi
                  </span>
                </span>
                <span className="flex-none font-mono text-[12px] text-ink">
                  {stat.coveragePct}%
                </span>
              </div>
              <ProgressBar pct={barPct} tone="accent2" className="h-1.5" />
            </button>
          )
        })
      )}
    </div>
  )

  const sortControl = (
    <SegmentedControl<CoverageSort>
      options={COVERAGE_SORT_OPTIONS}
      value={sortBy}
      onChange={setSortBy}
      size="sm"
      tone="accent2"
      ariaLabel="Sort state coverage"
    />
  )

  if (bare) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2 px-1">
          <div>
            <Eyebrow>Stations by state</Eyebrow>
            <span className="font-mono text-[11px] text-dim">
              {stats.length} {stats.length === 1 ? 'state' : 'states'}
            </span>
          </div>
          {sortControl}
        </div>
        <div className="flex items-center justify-between px-2 font-mono text-[10px] uppercase tracking-[0.08em] text-faint">
          <span>State</span>
          <span className="font-mono text-[11px] text-dim">
            Sort: {sortBy === 'sites' ? 'unique sites' : 'coverage %'}
          </span>
        </div>
        {list}
      </div>
    )
  }

  return (
    <Collapsible
      defaultOpen
      eyebrow="Route coverage"
      title="Stations by state"
      meta={`${stats.length} ${stats.length === 1 ? 'state' : 'states'}`}
    >
      <div className="flex flex-col gap-2 px-3.5 pb-3.5 pt-1">
        <div className="flex justify-end">{sortControl}</div>
        {list}
      </div>
    </Collapsible>
  )
}

/* ------------------------------------------------------------------ */
/* Trip stats — route composition and state leaders                    */
/* ------------------------------------------------------------------ */
function formatHours(value: number) {
  return value >= 10 ? Math.round(value).toLocaleString() : value.toFixed(1)
}

function TripStatCard({
  label,
  value,
  unit,
  tone = 'neutral',
}: {
  label: string
  value: ReactNode
  unit?: string
  tone?: Tone
}) {
  return (
    <div className={cx('rounded-xl border px-3.5 py-3', toneClasses(tone))}>
      <div className="mb-2 text-[10.5px] uppercase tracking-[0.06em] opacity-75">
        {label}
      </div>
      <div className="font-mono text-[20px] font-semibold leading-none">
        {value}
        {unit ? <span className="ml-1 text-[11px] font-normal opacity-70">{unit}</span> : null}
      </div>
    </div>
  )
}

function ShareBar({
  label,
  value,
  total,
  tone = 'accent',
}: {
  label: string
  value: number
  total: number
  tone?: 'accent' | 'accent2'
}) {
  const pct = total > 0 ? Math.max(0, Math.min(100, (value / total) * 100)) : 0
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[12px] font-medium text-ink">{label}</span>
        <span className="font-mono text-[11.5px] text-dim">
          {formatHours(value)}h · {Math.round(pct)}%
        </span>
      </div>
      <ProgressBar pct={pct} tone={tone} className="h-2" />
    </div>
  )
}

function TopStateBars({ stats }: { stats: StateRouteStats[] }) {
  const leaders = [...stats]
    .filter((stat) => stat.routeStations > 0)
    .sort((a, b) => b.routeStations - a.routeStations)
    .slice(0, 6)
  const maxSites = leaders.reduce((max, stat) => Math.max(max, stat.routeStations), 0)

  if (leaders.length === 0) {
    return <div className="text-[12px] text-faint">No state coverage yet.</div>
  }

  return (
    <div className="flex flex-col gap-2">
      {leaders.map((stat) => (
        <div key={`${stat.country}-${stat.state}`} className="grid grid-cols-[34px_1fr_42px] items-center gap-2">
          <span className="font-mono text-[11.5px] font-semibold text-ink">{stat.state}</span>
          <ProgressBar
            pct={maxSites > 0 ? (stat.routeStations / maxSites) * 100 : 0}
            tone="accent2"
            className="h-2"
          />
          <span className="text-right font-mono text-[11.5px] text-dim">
            {stat.routeStations}
          </span>
        </div>
      ))}
    </div>
  )
}

export function TripStatsSection({
  route,
  routeStateStats,
}: {
  route?: RoutePlan
  routeStateStats: StateRouteStats[]
}) {
  if (!route) {
    return (
      <div className="flex flex-col gap-2">
        <Eyebrow>Trip stats</Eyebrow>
        <div className="text-[12.5px] text-faint">
          Generate a route to see trip composition, pace, and state leaders.
        </div>
      </div>
    )
  }

  const totalActiveHours = route.totalDriveHours + route.totalStopHours
  const visitedStates = routeStateStats.filter((stat) => stat.routeStations > 0).length
  const issueCount =
    route.warnings.length +
    route.advisories.length +
    route.days.reduce(
      (sum, day) => sum + day.warnings.length + day.advisories.length,
      0,
    )
  const longDayPct = route.totalDays > 0 ? (route.longDays / route.totalDays) * 100 : 0

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Eyebrow>Trip stats</Eyebrow>
        <div className="mt-1 text-[15px] font-semibold text-ink">{route.name}</div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <TripStatCard label="Drive" value={formatHours(route.totalDriveHours)} unit="h" />
        <TripStatCard label="Charge" value={formatHours(route.totalStopHours)} unit="h" />
        <TripStatCard label="Pace" value={route.stationsPerDay} unit="sites/day" tone="info" />
        <TripStatCard
          label="Issues"
          value={issueCount}
          tone={issueCount > 0 ? 'warn' : 'good'}
        />
      </div>

      <section className="flex flex-col gap-3 rounded-xl border border-edge bg-panel2 p-3.5">
        <div className="flex items-baseline justify-between gap-2">
          <div>
            <div className="text-[13px] font-semibold text-ink">Time split</div>
            <div className="font-mono text-[10.5px] text-faint">
              {formatHours(totalActiveHours)} active hours
            </div>
          </div>
          <span className="font-mono text-[11.5px] text-dim">
            {route.totalMiles.toLocaleString()} mi
          </span>
        </div>
        <ShareBar label="Driving" value={route.totalDriveHours} total={totalActiveHours} />
        <ShareBar
          label="Charging"
          value={route.totalStopHours}
          total={totalActiveHours}
          tone="accent2"
        />
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-edge bg-panel2 p-3.5">
        <div className="flex items-baseline justify-between gap-2">
          <div>
            <div className="text-[13px] font-semibold text-ink">Route shape</div>
            <div className="font-mono text-[10.5px] text-faint">
              {visitedStates} states with planned visits
            </div>
          </div>
          <span className="font-mono text-[11.5px] text-dim">
            {route.averageDistanceBetweenSuperchargers} mi avg gap
          </span>
        </div>
        <ProgressBar pct={longDayPct} tone={route.longDays > 0 ? 'accent2' : 'accent'} className="h-2" />
        <div className="flex items-center justify-between font-mono text-[11px] text-faint">
          <span>{route.longDays} long-day boosts</span>
          <span>{Math.round(longDayPct)}% of days</span>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-edge bg-panel2 p-3.5">
        <div>
          <div className="text-[13px] font-semibold text-ink">State leaders</div>
          <div className="font-mono text-[10.5px] text-faint">
            Top states by unique planned sites
          </div>
        </div>
        <TopStateBars stats={routeStateStats} />
      </section>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Source — station source + refresh                                   */
/* ------------------------------------------------------------------ */
export function SourceSection({
  stationStatus,
  isLoadingStations,
  onRefresh,
  bare,
}: {
  stationStatus?: StationsResponse
  isLoadingStations: boolean
  onRefresh: () => void
  bare?: boolean
}) {
  const filtered = stationStatus?.filteredStations
  const title =
    filtered != null
      ? `${filtered.toLocaleString()} filtered open sites`
      : 'Station source'

  const fetchedAt = stationStatus?.source.fetchedAt
  const fetchedLabel = fetchedAt
    ? new Date(fetchedAt).toLocaleString()
    : 'not loaded yet'

  const refreshButton = (
    <button
      type="button"
      onClick={onRefresh}
      disabled={isLoadingStations}
      className={cx(
        'flex min-h-11 w-full items-center justify-center gap-2 rounded-[9px] border border-edge bg-panel2 px-3.5 font-medium text-ink transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60',
        bare ? 'text-[13px]' : 'text-[12.5px] md:h-[34px] md:min-h-0',
      )}
    >
      <RefreshIcon size={14} className={isLoadingStations ? 'anim-spin' : ''} />
      {isLoadingStations ? 'Refreshing…' : 'Refresh stations'}
    </button>
  )

  if (bare) {
    return (
      <BareCard eyebrow="Station source" title={title}>
        <div className="font-mono text-[12.5px] leading-[1.6] text-faint">
          Supercharge.info · fetched {fetchedLabel}
        </div>
        {refreshButton}
      </BareCard>
    )
  }

  return (
    <Collapsible eyebrow="Station source" title={title}>
      <div className="px-3.5 pb-3.5 pt-0.5">
        <div className="mb-[11px] font-mono text-[11.5px] leading-[1.5] text-faint">
          Supercharge.info · fetched {fetchedLabel}
        </div>
        {refreshButton}
      </div>
    </Collapsible>
  )
}

/* ------------------------------------------------------------------ */
/* Guardrails — rule guardrails + road status                          */
/* ------------------------------------------------------------------ */
function roadStatusNote(roadStatus: RoadStatusVM): { tone: Tone; text: string } {
  const name = roadStatus.routeName ?? 'route'
  switch (roadStatus.status) {
    case 'ready':
      return { tone: 'good', text: `Road-accurate distances loaded for ${name}.` }
    case 'loading':
      return { tone: 'info', text: `Mapping ${name} through real roads…` }
    case 'error':
      return {
        tone: 'warn',
        text: `Road geometry fallback: ${roadStatus.message ?? 'using straight-line legs.'}`,
      }
    case 'fallback':
      return {
        tone: 'warn',
        text: roadStatus.message ?? `Road geometry fallback for ${name}.`,
      }
    case 'estimate':
      return {
        tone: 'neutral',
        text: 'Distances are estimated (straight-line × road factor). Set OSRM_BASE_URL to a routing engine for exact road miles.',
      }
    default:
      return { tone: 'neutral', text: 'Waiting for route.' }
  }
}

export function GuardrailsSection({
  passportDeadline,
  roadStatus,
  bare,
}: {
  passportDeadline: string
  roadStatus: RoadStatusVM
  bare?: boolean
}) {
  const note = roadStatusNote(roadStatus)
  const body = (
    <>
      <div
        className={cx('leading-[1.6] text-dim', bare ? 'text-[12.5px]' : 'text-[11.5px]')}
      >
        No minimum charge duration is stated in the contest rules. The planner treats
        stop time as a configurable assumption.
      </div>
      <NoteCard
        tone={note.tone}
        icon={
          note.tone === 'warn' ? (
            <AlertIcon size={13} />
          ) : note.tone === 'info' ? (
            <InfoIcon size={13} />
          ) : undefined
        }
      >
        {note.text}
      </NoteCard>
    </>
  )

  if (bare) {
    return (
      <BareCard eyebrow="Rule guardrails" title={`Passport deadline ${passportDeadline}`}>
        {body}
      </BareCard>
    )
  }

  return (
    <Collapsible eyebrow="Rule guardrails" title={`Passport deadline ${passportDeadline}`}>
      <div className="flex flex-col gap-2.5 px-3.5 pb-3.5 pt-0.5">{body}</div>
    </Collapsible>
  )
}

/* ------------------------------------------------------------------ */
/* Sidebar — Overview / Coverage / Stats / Copilot / Status tabs       */
/* ------------------------------------------------------------------ */
type SidebarTab = 'overview' | 'coverage' | 'stats' | 'copilot' | 'status'

const SIDEBAR_TABS: { key: SidebarTab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'coverage', label: 'Coverage' },
  { key: 'stats', label: 'Stats' },
  { key: 'copilot', label: 'Copilot' },
  { key: 'status', label: 'Status' },
]

export function Sidebar({
  route,
  stationStatus,
  isLoadingStations,
  routeStateStats,
  feasibility,
  roadStatus,
  passportDeadline,
  onSelectState,
  onHoverState,
  highlightedState,
  onRefresh,
  copilot,
  className,
}: SidebarProps) {
  const [tab, setTab] = useState<SidebarTab>('overview')

  return (
    <div className={cx('flex min-h-0 flex-col', className)}>
      <div role="tablist" aria-label="Trip panels" className="flex flex-none border-b border-edge px-2">
        {SIDEBAR_TABS.map((t) => {
          const active = tab === t.key
          return (
            <button
              key={t.key}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => setTab(t.key)}
              className={cx(
                'relative flex-1 cursor-pointer px-1 py-2.5 text-[11.5px] font-semibold transition',
                active ? 'text-ink' : 'text-faint hover:text-dim',
              )}
            >
              {t.label}
              {active && (
                <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent" />
              )}
            </button>
          )
        })}
      </div>

      <div
        className={cx(
          'min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4',
          tab === 'copilot' ? 'hidden' : 'flex',
        )}
      >
        {tab === 'overview' && (
          <>
            <div className="flex flex-col gap-2">
              <Eyebrow>Trip overview</Eyebrow>
              <HeroStats route={route} />
            </div>
            <RouteNotes route={route} />
            <FeasibilitySection feasibility={feasibility} />
            {!route && (
              <div className="text-[12.5px] text-faint">
                Run Optimize to generate a route, then explore coverage and status here.
              </div>
            )}
          </>
        )}

        {tab === 'coverage' && (
          <CoverageSection
            bare
            stats={routeStateStats}
            onSelectState={onSelectState}
            onHoverState={onHoverState}
            highlightedState={highlightedState}
          />
        )}

        {tab === 'stats' && (
          <TripStatsSection route={route} routeStateStats={routeStateStats} />
        )}

        {tab === 'status' && (
          <>
            <SourceSection
              stationStatus={stationStatus}
              isLoadingStations={isLoadingStations}
              onRefresh={onRefresh}
            />
            <GuardrailsSection
              passportDeadline={passportDeadline}
              roadStatus={roadStatus}
            />
          </>
        )}
      </div>

      <div className={cx('min-h-0 flex-1', tab === 'copilot' ? 'flex' : 'hidden')}>
        {copilot ?? (
          <div className="flex flex-1 items-center justify-center px-6 text-center text-[12.5px] text-faint">
            Route Copilot is unavailable.
          </div>
        )}
      </div>
    </div>
  )
}
