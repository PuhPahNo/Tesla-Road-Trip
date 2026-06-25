import { useState, type ReactNode } from 'react'
import type { RoutePlan, StationUniverseStats } from '../domain/types'
import type { StateRouteStats } from '../domain/routeStats'
import type { StationsResponse } from '../api/client'
import {
  Collapsible,
  Eyebrow,
  ProgressBar,
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
  status: 'idle' | 'loading' | 'ready' | 'error' | 'estimate'
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
const MAX_COVERAGE_ROWS = 12

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
  const maxPct = stats.reduce((max, stat) => Math.max(max, stat.coveragePct), 0)
  const rows = stats.slice(0, MAX_COVERAGE_ROWS)
  const overflow = Math.max(0, stats.length - MAX_COVERAGE_ROWS)

  const list = (
    <div className="flex flex-col gap-1.5">
      {rows.length === 0 ? (
        <div className="text-[12px] text-faint">No states on this route yet.</div>
      ) : (
        rows.map((stat) => {
          const barPct = maxPct > 0 ? (stat.coveragePct / maxPct) * 100 : 0
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
      {overflow > 0 ? (
        <div className="px-2 font-mono text-[11px] text-faint">
          +{overflow} more {overflow === 1 ? 'state' : 'states'}
        </div>
      ) : null}
    </div>
  )

  if (bare) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between px-1">
          <Eyebrow>Stations by state</Eyebrow>
          <span className="font-mono text-[11px] text-dim">
            {stats.length} {stats.length === 1 ? 'state' : 'states'}
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
      <div className="px-3.5 pb-3.5 pt-1">{list}</div>
    </Collapsible>
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
/* Sidebar — Overview / Coverage / Status tabs                         */
/* ------------------------------------------------------------------ */
type SidebarTab = 'overview' | 'coverage' | 'status'

const SIDEBAR_TABS: { key: SidebarTab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'coverage', label: 'Coverage' },
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
                'relative flex-1 px-2 py-2.5 text-[12.5px] font-semibold transition cursor-pointer',
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

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
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
    </div>
  )
}
