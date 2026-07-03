import { useState } from 'react'
import { stationHighlights } from '../domain/highlights'
import type { DayPlan, RoutePlan, RouteStationVisit } from '../domain/types'
import { Overlay, OverlayHeader } from '../ui/Overlay'
import { cx } from '../ui/primitives'

export interface DayDetailModalProps {
  day?: DayPlan
  route?: RoutePlan
  onClose: () => void
}

const VISIT_CAP = 60

export function DayDetailModal({ day, route, onClose }: DayDetailModalProps) {
  const [showAll, setShowAll] = useState(false)

  return (
    <Overlay
      open={Boolean(day)}
      onClose={onClose}
      size="detail"
      labelledBy="day-detail-title"
    >
      {day ? (
        <DayDetailContent
          day={day}
          route={route}
          onClose={onClose}
          showAll={showAll}
          setShowAll={setShowAll}
        />
      ) : null}
    </Overlay>
  )
}

function DayDetailContent({
  day,
  route,
  onClose,
  showAll,
  setShowAll,
}: {
  day: DayPlan
  route?: RoutePlan
  onClose: () => void
  showAll: boolean
  setShowAll: (v: boolean) => void
}) {
  const cities = [...new Set(day.visits.map((visit) => visit.station.address.city))]
  const title = cities.slice(0, 3).join(' → ') || 'Open road'

  const visitsShown =
    showAll || day.visits.length <= VISIT_CAP ? day.visits : day.visits.slice(0, VISIT_CAP)
  const hiddenCount = day.visits.length - visitsShown.length
  const notes = [
    ...day.warnings.map((message) => ({ tone: 'warn' as const, message })),
    ...day.advisories.map((advisory) => ({
      tone: advisory.severity === 'high' ? ('warn' as const) : ('info' as const),
      message: advisory.message,
    })),
  ]
  const places = day.rating.places.slice(0, 10)

  return (
    <>
      <OverlayHeader
        titleId="day-detail-title"
        kicker={`Day ${day.day} · rating ${day.rating.score}/100 · ${route?.name ?? 'Route'}`}
        title={title}
        meta={`${day.miles.toLocaleString()} mi · ${day.driveHours.toFixed(1)}h drive · ${Math.round(day.stopMinutes)}m charging · ${day.uniqueStations} sites`}
        onClose={onClose}
      />

      <div className="min-h-0 flex-1 overflow-y-auto py-2">
        {notes.length > 0 && (
          <div className="flex flex-col gap-2 px-[18px] py-2">
            {notes.map((note, i) => (
              <div
                key={i}
                className={cx(
                  'rounded-[10px] px-3 py-2 text-[11.5px] leading-[1.45]',
                  note.tone === 'warn' ? 'text-warn' : 'text-info',
                )}
                style={{
                  background: `color-mix(in srgb, ${
                    note.tone === 'warn' ? 'var(--warn-tx)' : 'var(--info-tx)'
                  } 12%, transparent)`,
                }}
              >
                {note.message}
              </div>
            ))}
          </div>
        )}

        {places.length > 0 && (
          <div className="flex flex-wrap gap-[7px] px-[18px] py-2">
            {places.map((place) => (
              <span
                key={place.id}
                title={`${place.summary} Scenery ${place.sceneryScore}/100.`}
                className="inline-flex max-w-full items-center gap-[7px] rounded-[9px] border border-edge bg-chip px-2.5 py-1 text-[11.5px] text-ink"
              >
                <span className="font-mono text-[9px] uppercase tracking-[0.05em] text-faint">
                  {place.type}
                </span>
                <span className="min-w-0 truncate">{place.label}</span>
                <span className="font-mono font-semibold text-accent2">{place.rating}</span>
              </span>
            ))}
          </div>
        )}

        {visitsShown.map((visit) => (
          <VisitRow key={`${visit.sequence}-${visit.station.id}`} visit={visit} route={route} />
        ))}
        {hiddenCount > 0 && (
          <div className="px-[18px] py-3">
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="flex min-h-11 w-full cursor-pointer items-center justify-center rounded-xl border border-edge bg-panel2 px-3 text-[13px] font-medium text-ink transition hover:brightness-95"
            >
              Show all {day.visits.length} stops
            </button>
          </div>
        )}
      </div>
    </>
  )
}

function VisitRow({ visit, route }: { visit: RouteStationVisit; route?: RoutePlan }) {
  const dotColor = visit.connectorStop ? 'var(--amber)' : route?.color ?? 'var(--accent)'
  const badges = stationHighlights(visit.station).filter(
    (highlight) => highlight.type === 'tesla_badge',
  )
  const hasBadges = badges.length > 0
  return (
    <div
      className="flex gap-3 border-b border-edge px-[18px] py-[11px] last:border-b-0"
      style={
        hasBadges
          ? {
              background: 'color-mix(in srgb, var(--accent-2) 9%, transparent)',
            }
          : undefined
      }
    >
      <div className="flex flex-none flex-col items-center pt-0.5" aria-hidden>
        <span
          className="h-[9px] w-[9px] rounded-full border-2 border-panel"
          style={{
            background: hasBadges ? 'var(--amber)' : dotColor,
            boxShadow: hasBadges
              ? '0 0 0 4px color-mix(in srgb, var(--amber) 18%, transparent)'
              : undefined,
          }}
        />
        <span className="mt-0.5 w-[2px] flex-1 bg-edge" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 text-[13px] font-semibold text-ink">
          <span className="min-w-0 truncate">
            {visit.sequence}. {visit.station.name}
          </span>
          {badges.map((badge) => (
            <span
              key={badge.id}
              title={`${badge.summary} Rating ${badge.rating}/100.`}
              className="inline-flex flex-none items-center gap-1 rounded-[8px] border px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.05em] text-amber"
              style={{
                borderColor: 'color-mix(in srgb, var(--amber) 48%, transparent)',
                background: 'color-mix(in srgb, var(--amber) 14%, transparent)',
              }}
            >
              Tesla badge
              <span className="text-ink">{badge.rating}</span>
            </span>
          ))}
        </div>
        <div className="mt-[3px] font-mono text-[10.5px] text-faint">
          Day {visit.day} · {Math.round(visit.legMiles)} mi leg · {Math.round(visit.stopMinutes)}{' '}
          min · {visit.station.address.city}, {visit.station.address.state}
          {visit.connectorStop ? ' · transfer connector' : ''}
        </div>
        {visit.rangeWarning && (
          <div className="mt-[5px] text-[11px] text-warn">
            ⚠ Leg exceeds practical range — aux charge suggested
          </div>
        )}
      </div>
    </div>
  )
}
