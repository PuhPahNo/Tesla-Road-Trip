import type { ReactNode } from 'react'
import type { PlaceRating, RoutePlan } from '../domain/types'
import type { StateRouteStats } from '../domain/routeStats'
import { buildTripComposition, topLandmarkLabel } from '../domain/tripComposition'
import type { StationsResponse } from '../api/client'
import { ProgressBar, StatTile, cx, scoreColor } from '../ui/primitives'
import { AlertIcon, CloseIcon, InfoIcon, RefreshIcon } from '../ui/icons'
import type { PanelKey } from './Chrome'

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */
export type RoadStatusVM = {
  status: 'idle' | 'loading' | 'ready' | 'error' | 'estimate' | 'fallback'
  routeName?: string
  message?: string
}

export type AllSitesFeasibility = {
  totalStations: number
  availableDays: number
  requiredStationsPerDay: number
  minimumStopHours: number
  distanceStopHours: number
  verdict: 'not_plausible' | 'aggressive' | 'plausible'
  explanation: string
}

const PANEL_COPY: Record<PanelKey, { kicker: string; title: (route?: RoutePlan) => string }> = {
  overview: { kicker: 'Trip overview', title: () => 'At a glance' },
  days: { kicker: 'Daily plan', title: (route) => route?.name ?? 'No route yet' },
  coverage: { kicker: 'Route coverage', title: () => 'Stations by state' },
  stats: { kicker: 'Trip stats', title: () => 'Composition & pace' },
  status: { kicker: 'Status & rules', title: () => 'Source & guardrails' },
}

/* ------------------------------------------------------------------ */
/* Shared card + note styles                                           */
/* ------------------------------------------------------------------ */
function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cx('rounded-[11px] border border-edge bg-chip p-[13px]', className)}>
      {children}
    </div>
  )
}

function CardKicker({ children, tone }: { children: ReactNode; tone?: 'warn' }) {
  return (
    <div
      className={cx(
        'font-mono text-[9px] uppercase tracking-[0.1em]',
        tone === 'warn' ? 'text-warn' : 'text-faint',
      )}
    >
      {children}
    </div>
  )
}

function NoteCard({
  tone,
  children,
}: {
  tone: 'warn' | 'info'
  children: ReactNode
}) {
  return (
    <div className="flex gap-[9px] rounded-[10px] border border-edge bg-chip p-[11px]">
      <span
        className={cx('mt-px flex-none', tone === 'warn' ? 'text-warn' : 'text-info')}
        aria-hidden
      >
        {tone === 'warn' ? <AlertIcon size={13} /> : <InfoIcon size={13} />}
      </span>
      <span className="min-w-0 text-[12px] leading-[1.45] text-dim">{children}</span>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Overview                                                            */
/* ------------------------------------------------------------------ */
const FEASIBILITY_VERDICT: Record<AllSitesFeasibility['verdict'], string> = {
  plausible: 'Plausible target',
  aggressive: 'Aggressive target',
  not_plausible: 'Not plausible',
}

export function OverviewSection({
  route,
  feasibility,
}: {
  route?: RoutePlan
  feasibility?: AllSitesFeasibility
}) {
  const isLongestTrip = route?.plannerMode === 'longest_trip'
  const dash = '—'
  const composition = buildTripComposition(route)
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        <StatTile
          label={isLongestTrip ? 'Streak stops' : 'Unique sites'}
          value={route ? route.uniqueStations.toLocaleString() : dash}
        />
        <StatTile
          label="Total miles"
          value={route ? route.totalMiles.toLocaleString() : dash}
          unit={route ? 'mi' : undefined}
        />
        <StatTile
          label={isLongestTrip ? 'Streak days' : 'Days'}
          value={route ? route.totalDays : dash}
        />
        <StatTile
          label="Avg drive/day"
          value={route ? route.averageDriveHoursPerDay : dash}
          unit={route ? 'h' : undefined}
        />
        <StatTile
          label="Trip rating"
          value={route ? route.rating.score : dash}
          unit={route ? '/100' : undefined}
        />
        <StatTile
          label="Scenery"
          value={route ? route.rating.sceneryScore : dash}
          unit={route ? '/100' : undefined}
        />
      </div>

      {route ? (
        <Card>
          <div className="mb-2.5 flex items-baseline justify-between gap-3">
            <span className="text-[12.5px] font-semibold text-ink">
              Trip composition
            </span>
            <span className="font-mono text-[10.5px] text-faint">
              {composition.signatureStops} state signatures
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <MiniMetric label="Big cities" value={composition.bigCities} />
            <MiniMetric label="Landmarks" value={composition.landmarks} />
            <MiniMetric label="Tesla badges" value={composition.teslaBadges} />
          </div>
          <div className="mt-3 flex flex-col gap-1.5">
            {composition.topCities.slice(0, 2).map((city) => (
              <CompositionRow
                key={`city-${city.id}`}
                label={city.label}
                meta={`big city · ${city.rating}/100`}
              />
            ))}
            {composition.topLandmarks.slice(0, 3).map((landmark) => (
              <CompositionRow
                key={
                  'signature' in landmark
                    ? `sig-${landmark.signature.id}`
                    : `landmark-${landmark.id}`
                }
                label={topLandmarkLabel(landmark)}
                meta={'signature' in landmark ? 'state signature' : 'landmark'}
              />
            ))}
            {composition.topBadges.map((badge) => (
              <CompositionRow
                key={`badge-${badge.id}`}
                label={badge.label}
                meta={`Tesla badge candidate · ${badge.rating}/100`}
              />
            ))}
          </div>
        </Card>
      ) : null}

      {feasibility ? (
        <div
          className="rounded-[11px] p-[13px]"
          style={{
            border: '1px solid color-mix(in srgb, var(--warn-tx) 38%, transparent)',
            background: 'color-mix(in srgb, var(--warn-tx) 12%, transparent)',
          }}
        >
          <CardKicker tone="warn">{FEASIBILITY_VERDICT[feasibility.verdict]}</CardKicker>
          <div className="mt-[7px] text-[12.5px] leading-[1.5] text-dim">
            {feasibility.explanation}
          </div>
          <div className="mt-[9px] font-mono text-[11px] text-faint">
            {feasibility.totalStations.toLocaleString()} sites ·{' '}
            {feasibility.requiredStationsPerDay}/day needed
          </div>
        </div>
      ) : null}

      {route?.warnings.map((warning, i) => (
        <NoteCard key={`w-${i}`} tone="warn">
          {warning}
        </NoteCard>
      ))}
      {route?.advisories.map((advisory, i) => (
        <NoteCard key={`a-${i}`} tone={advisory.severity === 'high' ? 'warn' : 'info'}>
          {advisory.message}
        </NoteCard>
      ))}

      {!route && (
        <div className="text-[12.5px] leading-relaxed text-faint">
          Run Optimize to generate a route, then explore days, coverage, and stats here.
        </div>
      )}
    </div>
  )
}

function MiniMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[9px] border border-edge bg-panel2 px-2.5 py-2">
      <div className="font-mono text-[8.5px] uppercase tracking-[0.08em] text-faint">
        {label}
      </div>
      <div className="mt-1 font-mono text-[17px] font-semibold leading-none text-ink">
        {value}
      </div>
    </div>
  )
}

function CompositionRow({ label, meta }: { label: string; meta: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 text-[11.5px]">
      <span className="min-w-0 truncate text-ink">{label}</span>
      <span className="font-mono text-[9.5px] uppercase tracking-[0.06em] text-faint">
        {meta}
      </span>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Days                                                                */
/* ------------------------------------------------------------------ */
export function DaysSection({
  route,
  hoveredDayIndex,
  onOpenDay,
  onHoverDay,
}: {
  route?: RoutePlan
  hoveredDayIndex?: number
  onOpenDay: (dayIndex: number) => void
  onHoverDay?: (dayIndex: number | undefined) => void
}) {
  if (!route) {
    return (
      <div className="text-[12.5px] text-faint">No route generated yet — run Optimize.</div>
    )
  }
  return (
    <div className="flex flex-col gap-1.5">
      {route.days.map((day, index) => {
        const cities = [...new Set(day.visits.map((visit) => visit.station.address.city))]
        const cityLabel =
          cities.slice(0, 3).join(' · ') +
          (cities.length > 3 ? ` +${cities.length - 3}` : '')
        const active = hoveredDayIndex === index
        return (
          <button
            key={day.day}
            type="button"
            onClick={() => onOpenDay(index)}
            onMouseEnter={() => onHoverDay?.(index)}
            onMouseLeave={() => onHoverDay?.(undefined)}
            onFocus={() => onHoverDay?.(index)}
            onBlur={() => onHoverDay?.(undefined)}
            aria-label={`Open day ${day.day} detail, rating ${day.rating.score} out of 100`}
            className={cx(
              'flex w-full cursor-pointer flex-col rounded-[11px] border px-[11px] py-2.5 text-left transition',
              active ? 'border-accent2' : 'border-edge bg-chip',
            )}
            style={
              active
                ? { background: 'color-mix(in srgb, var(--accent-2) 8%, transparent)' }
                : undefined
            }
          >
            <div className="flex items-center gap-2.5">
              <span className="w-[34px] font-mono text-[12px] font-semibold text-ink">
                D{day.day}
              </span>
              <span
                className="w-[30px] font-mono text-[12px] font-semibold"
                style={{ color: scoreColor(day.rating.score) }}
              >
                {day.rating.score}
              </span>
              <span className="min-w-0 flex-1 truncate text-left text-[12px] text-dim">
                {cityLabel || 'Open road'}
              </span>
            </div>
            <div className="mt-1.5 flex items-center gap-3 pl-11 font-mono text-[10.5px] text-faint">
              <span>{day.uniqueStations} sites</span>
              <span>{day.miles.toLocaleString()} mi</span>
              <span>{day.driveHours.toFixed(1)}h</span>
              {day.longDayOptimized && <span className="text-amber">long day</span>}
              {day.warnings.length + day.advisories.length > 0 && (
                <span className={day.warnings.length > 0 ? 'text-warn' : 'text-info'}>
                  {day.warnings.length + day.advisories.length}{' '}
                  {day.warnings.length > 0 ? '⚠' : 'ⓘ'}
                </span>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Coverage                                                            */
/* ------------------------------------------------------------------ */
export function CoverageSection({
  stats,
  onSelectState,
  onHoverState,
  highlightedState,
}: {
  stats: StateRouteStats[]
  onSelectState: (s: string) => void
  onHoverState?: (s: string | undefined) => void
  highlightedState?: string
}) {
  const visited = stats.filter((stat) => stat.routeStations > 0)
  if (visited.length === 0) {
    return <div className="text-[12px] text-faint">No states on this route yet.</div>
  }
  return (
    <div className="flex flex-col gap-2">
      {visited.map((stat) => {
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
              'flex w-full cursor-pointer flex-col rounded-[10px] border p-2.5 text-left transition',
              active ? 'border-accent2' : 'border-edge bg-chip',
            )}
            style={
              active
                ? { background: 'color-mix(in srgb, var(--accent-2) 8%, transparent)' }
                : undefined
            }
          >
            <div className="mb-1.5 flex items-baseline justify-between gap-2">
              <span className="min-w-0 truncate text-[12.5px] font-semibold text-ink">
                {stat.state}{' '}
                <span className="font-mono text-[10.5px] font-normal text-faint">
                  {stat.routeStations} of {stat.totalStations} ·{' '}
                  {stat.miles.toLocaleString()} mi
                </span>
              </span>
              <span className="flex-none font-mono text-[11.5px] text-ink">
                {stat.coveragePct}%
              </span>
            </div>
            <ProgressBar pct={stat.coveragePct} tone="accent2" />
          </button>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Stats                                                               */
/* ------------------------------------------------------------------ */
function formatHours(value: number) {
  return value >= 10 ? Math.round(value).toLocaleString() : value.toFixed(1)
}

function TopPlaces({ places }: { places: PlaceRating[] }) {
  const leaders = places.slice(0, 6)
  if (leaders.length === 0) {
    return <div className="text-[12px] text-faint">No rated places on this route yet.</div>
  }
  return (
    <div className="flex flex-col gap-2">
      {leaders.map((place) => (
        <div
          key={place.id}
          className="grid grid-cols-[minmax(0,1fr)_34px] items-center gap-2"
        >
          <span className="min-w-0 truncate text-[12px] text-ink">
            {place.label}
            <span className="ml-1.5 font-mono text-[9.5px] uppercase text-faint">
              {place.type}
            </span>
          </span>
          <span className="text-right font-mono text-[11px] font-semibold text-accent2">
            {place.rating}
          </span>
        </div>
      ))}
    </div>
  )
}

export function StatsSection({
  route,
  routeStateStats,
}: {
  route?: RoutePlan
  routeStateStats: StateRouteStats[]
}) {
  if (!route) {
    return (
      <div className="text-[12.5px] text-faint">
        Generate a route to see trip composition, pace, and state leaders.
      </div>
    )
  }

  const activeHours = route.totalDriveHours + route.totalStopHours
  const drivePct = activeHours > 0 ? Math.round((route.totalDriveHours / activeHours) * 100) : 0
  const leaders = routeStateStats.filter((stat) => stat.routeStations > 0).slice(0, 6)
  const maxLeader = leaders.reduce((max, stat) => Math.max(max, stat.routeStations), 1)

  return (
    <div className="flex flex-col gap-[13px]">
      <div className="grid grid-cols-2 gap-2">
        <StatTile label="Drive" value={formatHours(route.totalDriveHours)} unit="h" />
        <StatTile label="Charge" value={formatHours(route.totalStopHours)} unit="h" />
        <StatTile
          label="Pace"
          value={route.stationsPerDay}
          unit={route.plannerMode === 'longest_trip' ? 'stops/d' : 'sites/d'}
        />
        <StatTile
          label="Avg gap"
          value={route.averageDistanceBetweenSuperchargers}
          unit="mi"
        />
      </div>

      <Card>
        <div className="mb-2.5 flex items-baseline justify-between">
          <span className="text-[12.5px] font-semibold text-ink">Time split</span>
          <span className="font-mono text-[10.5px] text-faint">
            {formatHours(activeHours)}h active
          </span>
        </div>
        <div className="flex h-2 overflow-hidden rounded-[5px]">
          <div className="bg-accent" style={{ width: `${drivePct}%` }} aria-hidden />
          <div className="bg-accent2" style={{ width: `${100 - drivePct}%` }} aria-hidden />
        </div>
        <div className="mt-2 flex justify-between font-mono text-[10.5px]">
          <span className="text-accent">Driving {drivePct}%</span>
          <span className="text-accent2">Charging {100 - drivePct}%</span>
        </div>
      </Card>

      <Card>
        <div className="mb-2.5 text-[12.5px] font-semibold text-ink">State leaders</div>
        <div className="flex flex-col gap-2">
          {leaders.length === 0 ? (
            <div className="text-[12px] text-faint">No state coverage yet.</div>
          ) : (
            leaders.map((stat) => (
              <div
                key={`${stat.country}-${stat.state}`}
                className="grid grid-cols-[32px_1fr_30px] items-center gap-[9px]"
              >
                <span className="font-mono text-[11px] font-semibold text-ink">
                  {stat.state}
                </span>
                <ProgressBar pct={(stat.routeStations / maxLeader) * 100} tone="accent2" className="h-1.5" />
                <span className="text-right font-mono text-[11px] text-dim">
                  {stat.routeStations}
                </span>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card>
        <div className="mb-1 text-[12.5px] font-semibold text-ink">Top places</div>
        <div className="mb-2.5 font-mono text-[10px] leading-relaxed text-faint">
          {route.rating.summary}
        </div>
        <TopPlaces places={route.rating.places} />
      </Card>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Status — station source + rule guardrails                           */
/* ------------------------------------------------------------------ */
function fetchedLabel(fetchedAt?: string): string {
  if (!fetchedAt) return 'not loaded yet'
  const fetched = new Date(fetchedAt)
  const mins = Math.max(1, Math.round((Date.now() - fetched.getTime()) / 60000))
  return mins < 60 ? `${mins} min ago` : fetched.toLocaleString()
}

function roadStatusNote(roadStatus: RoadStatusVM): string {
  const name = roadStatus.routeName ?? 'route'
  switch (roadStatus.status) {
    case 'ready':
      return `Road-accurate distances loaded for ${name}.`
    case 'loading':
      return `Mapping ${name} through real roads…`
    case 'error':
      return `Road geometry fallback: ${roadStatus.message ?? 'using straight-line legs.'}`
    case 'fallback':
      return roadStatus.message ?? `Road geometry fallback for ${name}.`
    case 'estimate':
      return 'Distances are estimated (straight-line × road factor). Set OSRM_BASE_URL to a routing engine for exact road miles.'
    default:
      return 'Waiting for route.'
  }
}

export function StatusSection({
  stationStatus,
  isLoadingStations,
  onRefresh,
  passportDeadline,
  roadStatus,
}: {
  stationStatus?: StationsResponse
  isLoadingStations: boolean
  onRefresh: () => void
  passportDeadline: string
  roadStatus: RoadStatusVM
}) {
  const count = stationStatus?.filteredStations
  return (
    <div className="flex flex-col gap-3">
      <Card>
        <CardKicker>Station source</CardKicker>
        <div className="mt-1.5 text-[13px] font-semibold text-ink">
          {count != null ? `${count.toLocaleString()} filtered open sites` : 'Not loaded yet'}
        </div>
        <div className="mt-[5px] font-mono text-[11px] leading-[1.5] text-faint">
          Supercharge.info · fetched {fetchedLabel(stationStatus?.source.fetchedAt)}
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoadingStations}
          className="mt-[11px] flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-[9px] border border-edge bg-panel2 text-[12.5px] text-ink transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshIcon size={13} className={isLoadingStations ? 'anim-spin' : ''} />
          {isLoadingStations ? 'Refreshing…' : 'Refresh stations'}
        </button>
      </Card>

      <Card>
        <CardKicker>Rule guardrails</CardKicker>
        <div className="mt-1.5 text-[13px] font-semibold text-ink">
          Passport deadline {passportDeadline}
        </div>
        <div className="mt-[7px] text-[12px] leading-[1.5] text-dim">
          No minimum charge duration is stated in the contest rules. The planner treats stop
          time as a configurable assumption.
        </div>
        <div
          className="mt-2.5 rounded-[9px] px-[11px] py-[9px] text-[11.5px] leading-[1.45] text-dim"
          style={{ background: 'color-mix(in srgb, var(--info-tx) 12%, transparent)' }}
        >
          {roadStatusNote(roadStatus)}
        </div>
      </Card>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Desktop glass panel shell                                           */
/* ------------------------------------------------------------------ */
export function GlassPanel({
  panel,
  route,
  onClose,
  children,
}: {
  panel: PanelKey
  route?: RoutePlan
  onClose: () => void
  children: ReactNode
}) {
  const copy = PANEL_COPY[panel]
  return (
    <div className="glass anim-fadeup fixed bottom-[150px] left-20 top-20 z-[37] flex w-[344px] flex-col overflow-hidden rounded-[15px]">
      <div className="flex flex-none items-center justify-between border-b border-edge px-4 pb-3 pt-[15px]">
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-faint">
            {copy.kicker}
          </div>
          <div className="mt-[3px] text-[15px] font-semibold text-ink">
            {copy.title(route)}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close panel"
          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-edge bg-transparent text-dim transition hover:text-ink"
        >
          <CloseIcon size={13} />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[18px] pt-3.5">{children}</div>
    </div>
  )
}
