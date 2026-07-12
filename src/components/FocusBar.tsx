import type { RoutePlan } from '../domain/types'
import { cx, scoreColor } from '../ui/primitives'
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PauseIcon,
  PlayIcon,
} from '../ui/icons'

/**
 * Focus mode day navigator — bottom-center glass bar with per-day dots,
 * prev/next stepping, an auto-play tour, and a shortcut to the trip
 * calendar. The current day is highlighted on the map by App.
 */
export function FocusBar({
  route,
  curDay,
  playing,
  isMobile,
  onSetDay,
  onPrev,
  onNext,
  onTogglePlay,
  onOpenDay,
  onOpenCalendar,
}: {
  route: RoutePlan
  curDay: number
  playing: boolean
  isMobile: boolean
  onSetDay: (index: number) => void
  onPrev: () => void
  onNext: () => void
  onTogglePlay: () => void
  onOpenDay: (index: number) => void
  onOpenCalendar: () => void
}) {
  const index = Math.min(curDay, route.days.length - 1)
  const day = route.days[index]
  if (!day) return null

  const cities = [...new Set(day.visits.map((visit) => visit.station.address.city))]
  const title = cities.slice(0, 3).join(' → ') || 'Open road'

  return (
    <div
      className={cx(
        'fixed left-1/2 z-[36] flex -translate-x-1/2 flex-col items-center gap-[9px]',
        isMobile ? 'bottom-[calc(env(safe-area-inset-bottom)_+_86px)]' : 'bottom-4',
      )}
    >
      {!isMobile && (
        <div className="glass flex max-w-[60vw] items-center gap-1 overflow-x-auto rounded-full px-[11px] py-[7px]">
          {route.days.map((d, i) => (
            <button
              key={d.day}
              type="button"
              aria-label={`Jump to day ${d.day}`}
              onClick={() => onSetDay(i)}
              className="flex-none cursor-pointer rounded-[4px] border-none p-0 transition-all"
              style={{
                width: index === i ? 20 : 7,
                height: 7,
                background: index === i ? 'var(--accent)' : 'var(--border-2)',
              }}
            />
          ))}
        </div>
      )}

      <div
        className={cx(
          'glass flex items-center gap-2 rounded-[15px] py-0 pl-2 pr-2',
          isMobile ? 'h-[52px] max-w-[calc(100vw-16px)] gap-1.5 px-1.5' : 'h-[58px] gap-2.5 pl-3.5',
        )}
      >
        <button
          type="button"
          onClick={onPrev}
          aria-label="Previous day"
          className="flex h-[34px] w-[34px] flex-none cursor-pointer items-center justify-center rounded-[9px] border border-edge bg-transparent text-ink transition hover:bg-chip"
        >
          <ChevronLeftIcon size={15} />
        </button>

        <button
          type="button"
          onClick={() => onOpenDay(index)}
          className={cx(
            'cursor-pointer border-none bg-transparent p-0 text-center text-ink',
            isMobile ? 'min-w-0 max-w-[48vw]' : 'min-w-[236px]',
          )}
        >
          <div className="truncate text-[14px] font-semibold">
            <span className="mr-2 font-mono text-[11px] text-faint">
              DAY {day.day}/{route.days.length}
            </span>
            {title}
          </div>
          <div className="mt-1 flex justify-center gap-3 whitespace-nowrap font-mono text-[10px] text-faint">
            <span style={{ color: scoreColor(day.rating.score) }}>★ {day.rating.score}</span>
            {day.stay && (
              <span className="text-accent2">
                ⛺ N{day.stay.night}/{day.stay.totalNights}
              </span>
            )}
            {!isMobile && <span>{day.uniqueStations} sites</span>}
            <span>{day.miles.toLocaleString()} mi</span>
            {!isMobile && <span>{day.driveHours.toFixed(1)}h</span>}
          </div>
        </button>

        <button
          type="button"
          onClick={onNext}
          aria-label="Next day"
          className="flex h-[34px] w-[34px] flex-none cursor-pointer items-center justify-center rounded-[9px] border border-edge bg-transparent text-ink transition hover:bg-chip"
        >
          <ChevronRightIcon size={15} />
        </button>

        {!isMobile && (
          <>
            <button
              type="button"
              onClick={onTogglePlay}
              aria-label={playing ? 'Pause day tour' : 'Play day tour'}
              className="flex h-[34px] w-[34px] flex-none cursor-pointer items-center justify-center rounded-[9px] border-none bg-accent text-on-accent transition hover:brightness-95"
            >
              {playing ? <PauseIcon size={13} /> : <PlayIcon size={13} />}
            </button>

            <span className="mx-[3px] h-[26px] w-px flex-none bg-edge" aria-hidden />
          </>
        )}

        <button
          type="button"
          onClick={onOpenCalendar}
          aria-label="Open trip calendar"
          title="Open trip calendar"
          className={cx(
            'flex h-[34px] flex-none cursor-pointer items-center gap-[7px] rounded-[9px] border border-edge bg-chip text-[12px] font-medium text-ink transition hover:brightness-110',
            isMobile ? 'w-[34px] justify-center' : 'px-[13px]',
          )}
        >
          <CalendarIcon size={14} />
          {!isMobile && 'Calendar'}
        </button>
      </div>
    </div>
  )
}
