import { memo, useEffect, useState } from 'react'
import {
  AlertTriangle,
  BadgeCheck,
  Info,
  Landmark,
  MapPin,
  Sparkles,
  X,
} from 'lucide-react'
import {
  dayHighlights,
  stationHighlights,
  type StationHighlight,
} from '../domain/highlights'
import type { DayPlan, RoutePlan } from '../domain/types'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'

interface DayPlanTableProps {
  route?: RoutePlan
}

const INITIAL_DAY_VISIT_LIMIT = 80

export function DayPlanTable({ route }: DayPlanTableProps) {
  const [selectedDay, setSelectedDay] = useState<DayPlan>()

  if (!route) return null

  const closeDay = () => setSelectedDay(undefined)

  return (
    <section className="day-panel" aria-label="Day-level route plan">
      <header className="panel-heading">
        <div>
          <p className="eyebrow">Daily plan</p>
          <h2>{route.name}</h2>
        </div>
        <span className="pace-pill">{route.stationsPerDay} sites/day</span>
      </header>

      {route.warnings.length > 0 && (
        <div className="warning-box">
          <AlertTriangle size={18} />
          <div>
            {route.warnings.map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
          </div>
        </div>
      )}

      {route.advisories.length > 0 && (
        <div className="advisory-box">
          <Info size={18} />
          <div>
            {route.advisories.map((advisory) => (
              <p key={advisory.message}>{advisory.message}</p>
            ))}
          </div>
        </div>
      )}

      <div className="day-table-wrap">
        <table className="day-table">
          <thead>
            <tr>
              <th>Day</th>
              <th>Sites</th>
              <th>Miles</th>
              <th>Avg gap</th>
              <th>Drive</th>
              <th>Stops</th>
              <th>Route targets</th>
            </tr>
          </thead>
          <tbody>
            {route.days.map((day) => (
              <DayPlanRow
                key={day.day}
                day={day}
                onOpen={setSelectedDay}
              />
            ))}
          </tbody>
        </table>
      </div>
      <DayDetailModal day={selectedDay} route={route} onClose={closeDay} />
    </section>
  )
}

const DayPlanRow = memo(function DayPlanRow({
  day,
  onOpen,
}: {
  day: DayPlan
  onOpen: (day: DayPlan) => void
}) {
  return (
    <tr
      className={`day-row ${day.longDayOptimized ? 'long-day-row' : ''}`}
      tabIndex={0}
      onClick={() => onOpen(day)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onOpen(day)
        }
      }}
    >
      <td>{day.day}</td>
      <td>{day.uniqueStations}</td>
      <td>{day.miles.toLocaleString()}</td>
      <td>{day.averageDistanceBetweenSuperchargers.toFixed(1)} mi</td>
      <td>{day.driveHours.toFixed(1)}h</td>
      <td>{Math.round(day.stopMinutes)}m</td>
      <td className="route-target-cell">
        <RouteTargetPreview day={day} />
        {day.longDayOptimized && day.longDayReason && (
          <span className="long-day-note">{day.longDayReason}</span>
        )}
        {day.warnings.length > 0 && (
          <span className="row-warning">
            <AlertTriangle size={14} />
            {day.warnings.length}
          </span>
        )}
        {day.advisories.length > 0 && (
          <span className="row-advisory">
            <Info size={14} />
            {day.advisories.length}
          </span>
        )}
      </td>
    </tr>
  )
})

function RouteTargetPreview({ day }: { day: DayPlan }) {
  const first = day.visits[0]
  const last = day.visits.at(-1)
  const middle = day.visits.slice(1, 5)
  const highlights = dayHighlights(day).slice(0, 3)

  if (!first) return <span className="station-chain">Return / transfer day</span>

  return (
    <div className="target-preview">
      <div className="target-path">
        <TargetStop
          label={first.station.address.city}
          state={first.station.address.state}
          sequence={first.sequence}
        />
        {middle.map((visit) => (
          <TargetStop
            key={`${day.day}-${visit.sequence}`}
            label={visit.station.address.city}
            state={visit.station.address.state}
            sequence={visit.sequence}
          />
        ))}
        {last && last.station.id !== first.station.id && (
          <TargetStop
            label={last.station.address.city}
            state={last.station.address.state}
            sequence={last.sequence}
            strong
          />
        )}
        {day.visits.length > 6 && (
          <span className="target-more">+{day.visits.length - 6}</span>
        )}
      </div>
      <div className="target-meta">
        {highlights.map((highlight) => (
          <HighlightPill key={highlight.id} highlight={highlight} compact />
        ))}
        <span className="target-open-hint">Open day details</span>
      </div>
    </div>
  )
}

function TargetStop({
  label,
  state,
  sequence,
  strong = false,
}: {
  label: string
  state: string
  sequence: number
  strong?: boolean
}) {
  return (
    <span className={`target-stop ${strong ? 'strong' : ''}`}>
      <span className="target-sequence">{sequence}</span>
      <span>
        {label}, {state}
      </span>
    </span>
  )
}

function DayDetailModal({
  day,
  route,
  onClose,
}: {
  day?: DayPlan
  route: RoutePlan
  onClose: () => void
}) {
  useBodyScrollLock(Boolean(day))
  const [showAllVisits, setShowAllVisits] = useState(false)

  useEffect(() => {
    setShowAllVisits(false)
  }, [day?.day])

  if (!day) return null

  const highlights = dayHighlights(day)
  const rangeWarnings = day.visits.filter((visit) => visit.rangeWarning)
  const visibleVisits = showAllVisits
    ? day.visits
    : day.visits.slice(0, INITIAL_DAY_VISIT_LIMIT)

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section
        aria-modal="true"
        className="detail-modal"
        role="dialog"
        aria-labelledby="day-detail-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="modal-header">
          <div>
            <p className="eyebrow">{route.name}</p>
            <h2 id="day-detail-title">Day {day.day} detailed plan</h2>
          </div>
          <button
            aria-label="Close day details"
            className="icon-button"
            type="button"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </header>

        <div className="detail-body">
          <div className="detail-stat-grid">
            <DetailStat label="Unique sites" value={String(day.uniqueStations)} />
            <DetailStat label="Route miles" value={day.miles.toLocaleString()} />
            <DetailStat
              label="Avg site gap"
              value={`${day.averageDistanceBetweenSuperchargers.toFixed(1)} mi`}
            />
            <DetailStat label="Drive time" value={`${day.driveHours.toFixed(1)}h`} />
            <DetailStat label="Stop time" value={`${day.stopMinutes}m`} />
            <DetailStat label="Range flags" value={String(rangeWarnings.length)} />
          </div>

          {highlights.length > 0 && (
            <section className="detail-section">
              <div className="detail-section-heading">
                <Sparkles size={17} />
                <h3>Interesting stops</h3>
              </div>
              <div className="highlight-grid">
                {highlights.map((highlight) => (
                  <article key={highlight.id} className={`highlight-card ${highlight.type}`}>
                    <HighlightPill highlight={highlight} />
                    <p>{highlight.summary}</p>
                  </article>
                ))}
              </div>
            </section>
          )}

          {(day.warnings.length > 0 || day.advisories.length > 0) && (
            <section className="detail-section">
              <div className="detail-section-heading">
                <AlertTriangle size={17} />
                <h3>Planning notes</h3>
              </div>
              <div className="note-list">
                {day.warnings.map((warning) => (
                  <p key={warning} className="note warning">{warning}</p>
                ))}
                {day.advisories.map((advisory) => (
                  <p key={advisory.message} className={`note ${advisory.severity}`}>
                    {advisory.message}
                  </p>
                ))}
              </div>
            </section>
          )}

          <section className="detail-section">
            <div className="detail-section-heading">
              <MapPin size={17} />
              <h3>Supercharger sequence</h3>
            </div>
            <div className="visit-list">
              {visibleVisits.map((visit) => {
                const highlightsForStation = stationHighlights(visit.station)
                return (
                  <article key={`${day.day}-${visit.sequence}`} className="visit-card">
                    <div className="visit-sequence">{visit.sequence}</div>
                    <div className="visit-main">
                      <strong>{visit.station.name}</strong>
                      <span>
                        {visit.station.address.city}, {visit.station.address.state}
                      </span>
                      {highlightsForStation.length > 0 && (
                        <div className="visit-highlights">
                          {highlightsForStation.map((highlight) => (
                            <HighlightPill
                              key={highlight.id}
                              highlight={highlight}
                              compact
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="visit-stats">
                      <span>{visit.legMiles.toFixed(1)} mi leg</span>
                      <span>{visit.driveHours.toFixed(1)}h drive</span>
                      <span>{visit.stopMinutes}m stop</span>
                      {visit.rangeWarning && <span className="range-flag">Range</span>}
                    </div>
                  </article>
                )
              })}
              {day.visits.length > INITIAL_DAY_VISIT_LIMIT && (
                <button
                  className="inline-expand-button visit-expand-button"
                  type="button"
                  onClick={() => setShowAllVisits((current) => !current)}
                >
                  {showAllVisits
                    ? 'Show fewer stops'
                    : `Show ${day.visits.length - INITIAL_DAY_VISIT_LIMIT} more stops`}
                </button>
              )}
            </div>
          </section>
        </div>
      </section>
    </div>
  )
}

function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="detail-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

export function HighlightPill({
  highlight,
  compact = false,
}: {
  highlight: StationHighlight
  compact?: boolean
}) {
  const Icon =
    highlight.type === 'tesla_badge'
      ? BadgeCheck
      : highlight.type === 'landmark'
        ? Landmark
        : highlight.type === 'city'
          ? MapPin
          : Sparkles

  return (
    <span className={`highlight-pill ${highlight.type} ${compact ? 'compact' : ''}`}>
      <Icon size={compact ? 13 : 15} />
      {highlight.label}
    </span>
  )
}
