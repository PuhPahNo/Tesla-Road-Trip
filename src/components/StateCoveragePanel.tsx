import { useEffect, useState } from 'react'
import { BarChart3, Landmark, MapPinned, X } from 'lucide-react'
import type { StateRouteStats } from '../domain/routeStats'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'
import { HighlightPill } from './DayPlanTable'

const INITIAL_CITY_LIMIT = 36
const INITIAL_VISIT_LIMIT = 80

interface StateCoveragePanelProps {
  stats: StateRouteStats[]
  selectedState?: StateRouteStats
  onSelectState: (state: string) => void
  onCloseState: () => void
}

export function StateCoveragePanel({
  stats,
  selectedState,
  onSelectState,
  onCloseState,
}: StateCoveragePanelProps) {
  if (stats.length === 0) return null

  return (
    <>
      <section className="state-coverage" aria-label="State route coverage">
        <header className="compact-panel-heading">
          <div>
            <p className="eyebrow">Route state coverage</p>
            <h2>Stations by state</h2>
          </div>
          <span className="coverage-count">{stats.length} states</span>
        </header>
        <div className="state-row-list">
          {stats.slice(0, 12).map((state) => (
            <button
              key={state.state}
              className="state-row"
              type="button"
              onClick={() => onSelectState(state.state)}
            >
              <span className="state-row-main">
                <strong>{state.state}</strong>
                <span>
                  {state.routeStations} of {state.totalStations} filtered sites
                </span>
              </span>
              <span className="state-row-metrics">
                <strong>{state.coveragePct.toFixed(1)}%</strong>
                <span>{state.miles.toLocaleString()} mi</span>
              </span>
            </button>
          ))}
        </div>
      </section>
      <StateDetailModal stats={selectedState} onClose={onCloseState} />
    </>
  )
}

export function StateDetailModal({
  stats,
  onClose,
}: {
  stats?: StateRouteStats
  onClose: () => void
}) {
  useBodyScrollLock(Boolean(stats))
  const [showAllCities, setShowAllCities] = useState(false)
  const [showAllVisits, setShowAllVisits] = useState(false)

  useEffect(() => {
    setShowAllCities(false)
    setShowAllVisits(false)
  }, [stats?.state])

  if (!stats) return null

  const cities = showAllCities
    ? stats.cities
    : stats.cities.slice(0, INITIAL_CITY_LIMIT)
  const visits = showAllVisits
    ? stats.visits
    : stats.visits.slice(0, INITIAL_VISIT_LIMIT)

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section
        aria-modal="true"
        className="detail-modal state-detail-modal"
        role="dialog"
        aria-labelledby="state-detail-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="modal-header">
          <div>
            <p className="eyebrow">{stats.country}</p>
            <h2 id="state-detail-title">{stats.state} trip detail</h2>
          </div>
          <button
            aria-label="Close state details"
            className="icon-button"
            type="button"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </header>

        <div className="detail-body">
          <div className="detail-stat-grid">
            <DetailStat
              label="Route sites"
              value={`${stats.routeStations}/${stats.totalStations}`}
            />
            <DetailStat label="Coverage" value={`${stats.coveragePct.toFixed(1)}%`} />
            <DetailStat label="Arrival-leg miles" value={stats.miles.toLocaleString()} />
            <DetailStat label="Drive time" value={`${stats.driveHours.toFixed(1)}h`} />
            <DetailStat label="Stop time" value={`${stats.stopMinutes}m`} />
            <DetailStat
              label="Avg site gap"
              value={`${stats.averageDistanceBetweenSuperchargers.toFixed(1)} mi`}
            />
          </div>

          <section className="detail-section">
            <div className="detail-section-heading">
              <MapPinned size={17} />
              <h3>Cities visited</h3>
            </div>
            <div className="city-chip-list">
              {stats.cities.length > 0 ? (
                cities.map((city) => (
                  <span key={city} className="city-chip">{city}</span>
                ))
              ) : (
                <span className="empty-inline-note">
                  This route does not stop in {stats.state} yet.
                </span>
              )}
              {stats.cities.length > INITIAL_CITY_LIMIT && (
                <button
                  className="inline-expand-button"
                  type="button"
                  onClick={() => setShowAllCities((current) => !current)}
                >
                  {showAllCities
                    ? 'Show fewer cities'
                    : `Show ${stats.cities.length - INITIAL_CITY_LIMIT} more cities`}
                </button>
              )}
            </div>
          </section>

          {stats.highlights.length > 0 && (
            <section className="detail-section">
              <div className="detail-section-heading">
                <Landmark size={17} />
                <h3>Landmarks and notable stops</h3>
              </div>
              <div className="highlight-grid">
                {stats.highlights.map((highlight) => (
                  <article key={highlight.id} className={`highlight-card ${highlight.type}`}>
                    <HighlightPill highlight={highlight} />
                    <p>{highlight.summary}</p>
                  </article>
                ))}
              </div>
            </section>
          )}

          <section className="detail-section">
            <div className="detail-section-heading">
              <BarChart3 size={17} />
              <h3>State route sequence</h3>
            </div>
            <div className="visit-list">
              {stats.visits.length > 0 ? (
                <>
                {visits.map((visit) => (
                  <article key={`${stats.state}-${visit.sequence}`} className="visit-card">
                    <div className="visit-sequence">{visit.sequence}</div>
                    <div className="visit-main">
                      <strong>{visit.station.name}</strong>
                      <span>
                        Day {visit.day} · {visit.station.address.city},{' '}
                        {visit.station.address.state}
                      </span>
                    </div>
                    <div className="visit-stats">
                      <span>{visit.legMiles.toFixed(1)} mi leg</span>
                      <span>{visit.driveHours.toFixed(1)}h drive</span>
                      <span>{visit.stopMinutes}m stop</span>
                    </div>
                  </article>
                ))}
                {stats.visits.length > INITIAL_VISIT_LIMIT && (
                  <button
                    className="inline-expand-button visit-expand-button"
                    type="button"
                    onClick={() => setShowAllVisits((current) => !current)}
                  >
                    {showAllVisits
                      ? 'Show fewer stops'
                      : `Show ${stats.visits.length - INITIAL_VISIT_LIMIT} more stops`}
                  </button>
                )}
                </>
              ) : (
                <p className="empty-inline-note">
                  No Supercharger visits in this state for the selected route.
                </p>
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
