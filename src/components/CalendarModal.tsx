import { useId } from 'react'
import type { DayPlan, RoutePlan } from '../domain/types'
import { Overlay, OverlayHeader } from '../ui/Overlay'
import { scoreColor } from '../ui/primitives'

function stars(score: number) {
  const full = Math.max(1, Math.min(5, Math.round(score / 20)))
  return { full: '★'.repeat(full), empty: '☆'.repeat(5 - full) }
}

function DayTile({
  day,
  onOpen,
}: {
  day: DayPlan
  onOpen: () => void
}) {
  const cities = [...new Set(day.visits.map((visit) => visit.station.address.city))]
  const star = stars(day.rating.score)
  const tint = scoreColor(day.rating.score)
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Open day ${day.day} state coverage`}
      className="flex min-h-[104px] cursor-pointer flex-col gap-1.5 rounded-xl p-3 text-left transition hover:brightness-110"
      style={{
        border: day.longDayOptimized
          ? '1px solid color-mix(in srgb, var(--amber) 50%, var(--border))'
          : '1px solid var(--border)',
        background: `color-mix(in srgb, ${tint} ${8 + Math.round(day.rating.score * 0.16)}%, var(--panel-2))`,
      }}
    >
      <div className="flex items-center justify-between gap-1.5">
        <span className="font-mono text-[12px] font-semibold text-ink">Day {day.day}</span>
        <span className="text-[10px] text-amber">
          {star.full}
          <span className="text-faint">{star.empty}</span>
        </span>
      </div>
      <div className="truncate text-[12px] font-medium text-ink">
        {cities.slice(0, 2).join(' → ') || 'Open road'}
      </div>
      <div className="font-mono text-[9.5px] text-faint">
        {day.uniqueStations} sites · {day.miles.toLocaleString()} mi ·{' '}
        {day.driveHours.toFixed(1)}h
      </div>
    </button>
  )
}

/**
 * Trip calendar — the whole route as week-by-week day tiles, tinted by
 * day rating. Clicking a tile opens state coverage for that day's primary state.
 */
export function CalendarModal({
  route,
  open,
  onClose,
  onOpenDay,
}: {
  route?: RoutePlan
  open: boolean
  onClose: () => void
  onOpenDay: (dayIndex: number) => void
}) {
  const titleId = useId()
  if (!route) return null

  const isLongestTrip = route.plannerMode === 'longest_trip'
  const weeks: Array<{ label: string; days: Array<{ day: DayPlan; index: number }> }> = []
  for (let i = 0; i < route.days.length; i += 7) {
    weeks.push({
      label: `Week ${Math.floor(i / 7) + 1}`,
      days: route.days.slice(i, i + 7).map((day, offset) => ({ day, index: i + offset })),
    })
  }

  return (
    <Overlay open={open} onClose={onClose} size="wide" labelledBy={titleId}>
      <OverlayHeader
        kicker={`Trip calendar · ${isLongestTrip ? 'Longest Trip' : 'Most Unique Sites'}`}
        title={route.name}
        meta={`${route.totalDays} days · ${route.uniqueStations.toLocaleString()} sites · start Chattanooga, TN 37405`}
        titleId={titleId}
        onClose={onClose}
      />

      <div className="flex min-h-0 flex-1 flex-col gap-[18px] overflow-y-auto px-[18px] py-[18px] md:px-[22px]">
        {weeks.map((week) => (
          <div key={week.label}>
            <div className="mb-[9px] font-mono text-[9.5px] uppercase tracking-[0.1em] text-faint">
              {week.label}
            </div>
            <div className="grid grid-cols-2 gap-[9px] sm:grid-cols-4 md:grid-cols-7">
              {week.days.map(({ day, index }) => (
                <DayTile key={day.day} day={day} onOpen={() => onOpenDay(index)} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-none flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-edge px-[18px] py-3 font-mono text-[10.5px] text-faint md:px-[22px]">
        <span className="flex items-center gap-1.5">
          <span
            className="h-[11px] w-[11px] rounded-[3px] border border-edge"
            style={{ background: 'color-mix(in srgb, var(--good-tx) 30%, var(--panel-2))' }}
          />
          Standout
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="h-[11px] w-[11px] rounded-[3px] border border-edge"
            style={{ background: 'color-mix(in srgb, var(--warn-tx) 30%, var(--panel-2))' }}
          />
          Transit-heavy
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="h-[11px] w-[11px] rounded-[3px]"
            style={{ border: '1px solid color-mix(in srgb, var(--amber) 55%, var(--border))' }}
          />
          Long-day boost
        </span>
        <span className="flex-1" />
        <span className="hidden sm:inline">Click a day to open state coverage</span>
      </div>
    </Overlay>
  )
}
