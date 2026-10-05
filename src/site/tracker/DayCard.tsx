import { Link } from 'react-router-dom'
import { ArrowRight, Clock, Gauge, Zap } from 'lucide-react'
import type { DayPlan, RoutePlan } from '../../domain/types'
import { cx } from '../../ui/primitives'
import { DayStatusBadge } from './components'
import {
  dayEndLabel,
  dayStartLabel,
  dayStatus,
  formatMiles,
  formatShortDate,
  landmarksForDay,
  tripDayDate,
  type TripProgress,
} from './tripProgress'

export function DayCard({
  route,
  day,
  progress,
  energyKwh,
  className,
}: {
  route: RoutePlan
  day: DayPlan
  progress: TripProgress
  energyKwh?: number | null
  className?: string
}) {
  const status = dayStatus(progress, day.day)
  const date = formatShortDate(tripDayDate(progress.departureDate, day.day))
  const landmarks = landmarksForDay(day)
  return (
    <Link
      to={`/route?day=${day.day}`}
      className={cx(
        'group flex flex-col gap-4 rounded-2xl border bg-panel p-5 text-ink no-underline transition hover:border-edge2',
        status === 'today' ? 'border-accent/60' : 'border-edge',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-[13px] text-dim">
          <span className="font-semibold text-ink">Day {day.day}</span>
          {date ? <> · {date}</> : null}
        </div>
        <DayStatusBadge status={status} />
      </div>
      <div className="font-display text-[20px] font-semibold leading-[1.2] tracking-[-0.015em]">
        {dayStartLabel(route, day)}
        <span className="mx-2 text-faint" aria-hidden="true">→</span>
        <span className="sr-only"> to </span>
        {dayEndLabel(day)}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-[13px] text-dim">
        <span className="inline-flex items-center gap-1.5">
          <Gauge size={14} aria-hidden="true" /> {formatMiles(day.miles)} mi
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock size={14} aria-hidden="true" /> {formatHours(day.driveHours)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Zap size={14} aria-hidden="true" /> {day.primaryChargeIndex === undefined ? `${day.visits.length} Supercharger${day.visits.length === 1 ? '' : 's'}` : '1 charge suggestion'}
        </span>
        {energyKwh != null ? <span className="font-medium text-good">{Math.round(energyKwh)} kWh added</span> : null}
      </div>
      {landmarks.length ? (
        <div className="text-[13px] leading-[1.5] text-faint">Near {landmarks.slice(0, 3).join(', ')}</div>
      ) : null}
      <div className="mt-auto inline-flex items-center gap-1 text-[13px] font-medium text-accent">
        See this day on the map
        <ArrowRight size={14} className="transition group-hover:translate-x-0.5" aria-hidden="true" />
      </div>
    </Link>
  )
}

export function formatHours(hours: number) {
  const whole = Math.floor(hours)
  const minutes = Math.round((hours - whole) * 60)
  if (whole === 0) return `${minutes} min`
  return minutes ? `${whole} hr ${minutes} min` : `${whole} hr`
}
