import { useId } from 'react'
import type { DayPlan, RoutePlan } from '../domain/types'
import { Overlay, OverlayHeader } from '../ui/Overlay'
import {
  badgeOpportunitiesForRoute,
  tripDateForDay,
  type TeslaBadgeOpportunity,
} from '../domain/teslaBadges'
import {
  calendarDayPresentation,
  type CalendarDayTone,
} from './calendarDayPresentation'

const CALENDAR_DAY_STYLES: Record<
  CalendarDayTone,
  { color: string; label: string }
> = {
  transit: { color: 'var(--calendar-transit)', label: 'Transit · 4h+' },
  highlight: { color: 'var(--calendar-highlight)', label: 'Highlight · 90+' },
  short: { color: 'var(--calendar-short)', label: 'Easy drive · <1.5h' },
  standard: { color: 'var(--dim)', label: 'Standard day' },
}

function stars(score: number) {
  const full = Math.max(1, Math.min(5, Math.round(score / 20)))
  return { full: '★'.repeat(full), empty: '☆'.repeat(5 - full) }
}

function DayTile({
  day,
  date,
  badgeGoals,
  onOpen,
}: {
  day: DayPlan
  date?: string
  badgeGoals: TeslaBadgeOpportunity[]
  onOpen: () => void
}) {
  const cities = [...new Set(day.visits.map((visit) => visit.station.address.city))]
  const star = stars(day.rating.score)
  const presentation = calendarDayPresentation(day)
  const tone = CALENDAR_DAY_STYLES[presentation.tone]
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Open day ${day.day} state coverage`}
      data-calendar-tone={presentation.tone}
      className="flex min-h-[118px] cursor-pointer flex-col gap-1.5 rounded-xl p-3 text-left transition hover:brightness-110"
      style={{
        border:
          presentation.tone === 'standard'
            ? '1px solid var(--border)'
            : `1px solid color-mix(in srgb, ${tone.color} 52%, var(--border))`,
        background:
          presentation.tone === 'standard'
            ? 'var(--panel-2)'
            : `color-mix(in srgb, ${tone.color} 16%, var(--panel-2))`,
      }}
    >
      <div className="flex items-center justify-between gap-1.5">
        <span className="font-mono text-[12px] font-semibold text-ink">Day {day.day}</span>
        <span className="text-[10px] text-amber">
          {star.full}
          <span className="text-faint">{star.empty}</span>
        </span>
      </div>
      {date ? <div className="font-mono text-[9px] text-faint">{date}</div> : null}
      <div className="truncate text-[12px] font-medium text-ink">
        {cities.slice(0, 2).join(' → ') || 'Open road'}
      </div>
      {day.stay && (
        <div className="truncate font-mono text-[9.5px] text-accent2">
          ⛺ {day.stay.label} · N{day.stay.night}/{day.stay.totalNights}
        </div>
      )}
      <div className="mt-auto flex flex-wrap gap-1">
        {(presentation.flags.length > 0
          ? presentation.flags
          : (['standard'] as const)
        ).map((flag) => {
          const flagStyle = CALENDAR_DAY_STYLES[flag]
          return (
            <span
              key={flag}
              className="rounded-full border px-1.5 py-0.5 font-mono text-[8px] font-semibold uppercase tracking-[0.04em]"
              style={{
                borderColor: `color-mix(in srgb, ${flagStyle.color} 48%, var(--border))`,
                background: `color-mix(in srgb, ${flagStyle.color} 12%, transparent)`,
                color: flagStyle.color,
              }}
            >
              {flagStyle.label}
            </span>
          )
        })}
      </div>
      <div className="font-mono text-[9.5px] text-faint">
        {day.uniqueStations} sites · {day.miles.toLocaleString()} mi ·{' '}
        {day.driveHours.toFixed(1)}h
      </div>
      {badgeGoals.length > 0 ? (
        <div className="mt-auto truncate font-mono text-[9px] text-amber">
          ◆ {badgeGoals.map((badge) => badge.label).join(' · ')}
        </div>
      ) : null}
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
  const badgeOpportunities = badgeOpportunitiesForRoute(route)
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
        meta={`${route.totalDays} days · ${route.uniqueStations.toLocaleString()} sites · ${route.tripStartDate ? `starts ${route.tripStartDate}` : 'start date not set'} · Chattanooga, TN 37405`}
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
                <DayTile
                  key={day.day}
                  day={day}
                  date={tripDateForDay(route.tripStartDate, day.day)}
                  badgeGoals={badgeOpportunities.filter((badge) => badge.day === day.day)}
                  onOpen={() => onOpenDay(index)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-none flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-edge px-[18px] py-3 font-mono text-[10.5px] text-faint md:px-[22px]">
        {(
          [
            ['transit', 'Transit · 4.0h+'],
            ['highlight', 'Highlight · rating 90+'],
            ['short', 'Easy drive · under 1.5h'],
            ['standard', 'Standard day'],
          ] as const
        ).map(([toneName, label]) => (
          <span key={toneName} className="flex items-center gap-1.5">
            <span
              className="h-[11px] w-[11px] rounded-[3px] border"
              style={{
                borderColor:
                  toneName === 'standard'
                    ? 'var(--border-2)'
                    : CALENDAR_DAY_STYLES[toneName].color,
                background:
                  toneName === 'standard'
                    ? 'var(--panel-2)'
                    : `color-mix(in srgb, ${CALENDAR_DAY_STYLES[toneName].color} 24%, var(--panel-2))`,
              }}
            />
            {label}
          </span>
        ))}
        <span className="flex-1" />
        <span className="hidden sm:inline">Click a day to open state coverage</span>
      </div>
    </Overlay>
  )
}
