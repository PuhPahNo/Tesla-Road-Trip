import type { CSSProperties } from 'react'
import type { DayPlan, RoutePlan } from '../domain/types'
import { Button, Chip, Eyebrow, Pill, cx } from '../ui/primitives'
import { AlertIcon, ChevronDownIcon, InfoIcon } from '../ui/icons'

/* Shared 7-column grid template (Day, Sites, Miles, Avg gap, Drive, Stops, Targets). */
const GRID_COLS = '46px 56px 82px 86px 64px 64px minmax(0,1fr)'
const GRID_STYLE: CSSProperties = { gridTemplateColumns: GRID_COLS }
/* Keep the grid usable on narrow phones: min width = sum of fixed cols + gaps + a usable targets cell. */
const GRID_MIN_WIDTH = 600

export interface DayTableProps {
  route?: RoutePlan
  onOpenDay: (dayIndex: number) => void
  roadStatus?: 'idle' | 'loading' | 'ready' | 'error' | 'estimate'
}

function DayRow({
  day,
  index,
  onOpenDay,
}: {
  day: DayPlan
  index: number
  onOpenDay: (dayIndex: number) => void
}) {
  const cities = day.visits
    .map((visit) => visit.station.address.city)
    .filter(Boolean)
  const shown = cities.slice(0, 4)
  const extra = day.uniqueStations - shown.length
  const issueCount = day.warnings.length + day.advisories.length
  const hasWarnings = day.warnings.length > 0

  return (
    <button
      type="button"
      onClick={() => onOpenDay(index)}
      aria-label={`Open day ${day.day} detail`}
      style={GRID_STYLE}
      className={cx(
        'grid w-full min-h-11 items-center gap-2 border-b border-edge px-[18px] py-[11px] text-left transition hover:bg-panel2',
        day.longDayOptimized && 'bg-panel2',
      )}
    >
      <div className="font-mono text-[13px] font-semibold text-ink">{day.day}</div>
      <div className="font-mono text-[13px] text-ink">{day.uniqueStations}</div>
      <div className="font-mono text-[13px] text-dim">{day.miles.toLocaleString()}</div>
      <div className="font-mono text-[13px] text-dim">
        {day.averageDistanceBetweenSuperchargers} mi
      </div>
      <div className="font-mono text-[13px] text-dim">{day.driveHours.toFixed(1)}h</div>
      <div className="font-mono text-[13px] text-dim">{Math.round(day.stopMinutes)}m</div>
      <div className="flex min-w-0 items-center gap-1.5 overflow-hidden">
        {issueCount > 0 && (
          <span
            className={cx(
              'inline-flex flex-none items-center gap-1 font-mono text-[11px]',
              hasWarnings ? 'text-warn' : 'text-info',
            )}
            aria-label={`${issueCount} ${hasWarnings ? 'warnings' : 'advisories'}`}
          >
            {hasWarnings ? <AlertIcon size={13} /> : <InfoIcon size={13} />}
            {issueCount}
          </span>
        )}
        {shown.map((city, i) => (
          <Chip key={`${city}-${i}`} index={i + 1} label={city} className="flex-none" />
        ))}
        {extra > 0 && (
          <span className="flex-none font-mono text-[11px] text-faint">+{extra}</span>
        )}
      </div>
    </button>
  )
}

export function DayTable({ route, onOpenDay, roadStatus }: DayTableProps) {
  if (!route) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-10 text-center text-[13px] text-dim">
        No route generated yet — run Optimize.
      </div>
    )
  }

  const longDays = route.days.filter((day) => day.longDayOptimized).length
  const auxLegs = route.visits.filter((visit) => visit.rangeWarning).length
  const routeStatus =
    roadStatus === 'loading'
      ? 'Refining road miles...'
      : roadStatus === 'ready'
        ? 'Road miles loaded'
        : roadStatus === 'estimate'
          ? 'Estimate mode'
          : roadStatus === 'error'
            ? 'Road fallback'
            : undefined

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Pills row */}
      <div className="flex flex-wrap items-center gap-2 border-b border-edge px-[18px] py-2.5">
        <Pill tone="neutral">{route.stationsPerDay} sites/day</Pill>
        {routeStatus ? (
          <Pill tone={roadStatus === 'ready' ? 'good' : roadStatus === 'error' ? 'warn' : 'info'}>
            {routeStatus}
          </Pill>
        ) : null}
        {longDays > 0 && (
          <Pill tone="warn">
            {longDays} long {longDays === 1 ? 'day' : 'days'}
          </Pill>
        )}
        {auxLegs > 0 && (
          <Pill tone="info">
            {auxLegs} {auxLegs === 1 ? 'leg needs' : 'legs need'} aux charge
          </Pill>
        )}
      </div>

      {/* Scrollable grid */}
      <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto">
        <div style={{ minWidth: GRID_MIN_WIDTH }}>
          {/* Header */}
          <div
            style={GRID_STYLE}
            className="grid items-center gap-2 border-b border-edge px-[18px] py-[9px] font-mono text-[9.5px] uppercase tracking-[0.08em] text-faint"
          >
            <div>Day</div>
            <div>Sites</div>
            <div>Miles</div>
            <div>Avg gap</div>
            <div>Drive</div>
            <div>Stops</div>
            <div>Route targets</div>
          </div>
          {/* Rows */}
          {route.days.map((day, index) => (
            <DayRow key={day.day} day={day} index={index} onOpenDay={onOpenDay} />
          ))}
        </div>
      </div>
    </div>
  )
}

export interface DailyPlanDrawerProps extends DayTableProps {
  open: boolean
  onToggleOpen: () => void
}

export function DailyPlanDrawer({
  route,
  onOpenDay,
  open,
  onToggleOpen,
  roadStatus,
}: DailyPlanDrawerProps) {
  return (
    <div
      className={cx(
        'flex flex-none flex-col border-t border-edge bg-panel',
        open && 'h-[288px]',
      )}
    >
      {/* Header */}
      <div className="flex flex-none items-center gap-3.5 border-b border-edge px-[18px] py-[13px]">
        <div className="min-w-0">
          <Eyebrow>Daily plan</Eyebrow>
          <div className="mt-px truncate text-[15px] font-semibold text-ink">
            {route ? route.name : 'No route'}
          </div>
        </div>
        <div className="flex-1" />
        <Button
          size="sm"
          variant="secondary"
          onClick={onToggleOpen}
          aria-expanded={open}
          className="flex-none"
        >
          {open ? 'Collapse' : 'Expand'}
          <ChevronDownIcon
            size={12}
            className={cx('transition-transform', open ? '' : 'rotate-180')}
          />
        </Button>
      </div>

      {open && <DayTable route={route} onOpenDay={onOpenDay} roadStatus={roadStatus} />}
    </div>
  )
}
