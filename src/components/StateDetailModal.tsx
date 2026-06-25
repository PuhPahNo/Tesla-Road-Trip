import { useId, useMemo, useState, type ReactNode } from 'react'
import type { StateRouteStats } from '../domain/routeStats'
import { Overlay, OverlayHeader } from '../ui/Overlay'
import { Button, Chip, Pill, StatTile } from '../ui/primitives'
import { AlertIcon } from '../ui/icons'

export interface StateDetailModalProps {
  state?: StateRouteStats
  onClose: () => void
}

/** 2-letter postal code → full name (all 50 states + DC). */
const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama',
  AK: 'Alaska',
  AZ: 'Arizona',
  AR: 'Arkansas',
  CA: 'California',
  CO: 'Colorado',
  CT: 'Connecticut',
  DE: 'Delaware',
  DC: 'District of Columbia',
  FL: 'Florida',
  GA: 'Georgia',
  HI: 'Hawaii',
  ID: 'Idaho',
  IL: 'Illinois',
  IN: 'Indiana',
  IA: 'Iowa',
  KS: 'Kansas',
  KY: 'Kentucky',
  LA: 'Louisiana',
  ME: 'Maine',
  MD: 'Maryland',
  MA: 'Massachusetts',
  MI: 'Michigan',
  MN: 'Minnesota',
  MS: 'Mississippi',
  MO: 'Missouri',
  MT: 'Montana',
  NE: 'Nebraska',
  NV: 'Nevada',
  NH: 'New Hampshire',
  NJ: 'New Jersey',
  NM: 'New Mexico',
  NY: 'New York',
  NC: 'North Carolina',
  ND: 'North Dakota',
  OH: 'Ohio',
  OK: 'Oklahoma',
  OR: 'Oregon',
  PA: 'Pennsylvania',
  RI: 'Rhode Island',
  SC: 'South Carolina',
  SD: 'South Dakota',
  TN: 'Tennessee',
  TX: 'Texas',
  UT: 'Utah',
  VT: 'Vermont',
  VA: 'Virginia',
  WA: 'Washington',
  WV: 'West Virginia',
  WI: 'Wisconsin',
  WY: 'Wyoming',
}

/** Minutes → "Xh Ym" / "Ym" compact label. */
function fmtMinutes(m: number): string {
  const total = Math.max(0, Math.round(m))
  const hours = Math.floor(total / 60)
  const mins = total % 60
  if (hours <= 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

const CITY_CAP = 36
const VISIT_CAP = 40

/* ------------------------------------------------------------------ */
/* Section label — mono micro caption matching the design             */
/* ------------------------------------------------------------------ */
function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="mb-[9px] font-mono text-[11px] uppercase tracking-[0.05em] text-faint">
      {children}
    </div>
  )
}

export function StateDetailModal({ state, onClose }: StateDetailModalProps) {
  const open = Boolean(state)
  const titleId = useId()

  const [citiesExpanded, setCitiesExpanded] = useState(false)
  const [visitsExpanded, setVisitsExpanded] = useState(false)

  const fullName = state ? (STATE_NAMES[state.state] ?? state.state) : ''

  const visibleCities = useMemo(() => {
    if (!state) return []
    return citiesExpanded ? state.cities : state.cities.slice(0, CITY_CAP)
  }, [state, citiesExpanded])

  const visibleVisits = useMemo(() => {
    if (!state) return []
    return visitsExpanded ? state.visits : state.visits.slice(0, VISIT_CAP)
  }, [state, visitsExpanded])

  if (!state) return null

  const badge = (
    <div className="flex h-[46px] w-[46px] flex-none items-center justify-center rounded-xl bg-accent font-mono text-[16px] font-semibold text-on-accent">
      {state.state}
    </div>
  )

  const kicker = state.routeStations > 0 ? 'Route state · visited' : 'Route state'
  const hiddenCities = state.cities.length - visibleCities.length
  const hiddenVisits = state.visits.length - visibleVisits.length

  return (
    <Overlay open={open} onClose={onClose} size="detail" labelledBy={titleId}>
      <OverlayHeader
        badge={badge}
        kicker={kicker}
        title={fullName}
        subtitle={`${state.routeStations} of ${state.totalStations} filtered Superchargers visited`}
        titleId={titleId}
        onClose={onClose}
      />

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 md:px-6">
        {/* Stat grid */}
        <div className="grid grid-cols-3 gap-2.5">
          <StatTile
            label="Route sites"
            value={`${state.routeStations}/${state.totalStations}`}
          />
          <StatTile label="Coverage" value={state.coveragePct} unit="%" />
          <StatTile label="Leg miles" value={state.miles.toLocaleString()} unit="mi" />
          <StatTile label="Drive time" value={state.driveHours} unit="h" />
          <StatTile label="Stop time" value={fmtMinutes(state.stopMinutes)} />
          <StatTile
            label="Avg gap"
            value={state.averageDistanceBetweenSuperchargers}
            unit="mi"
          />
        </div>

        {/* Cities visited */}
        <div className="mt-5">
          <SectionLabel>Cities visited</SectionLabel>
          {state.cities.length > 0 ? (
            <div className="flex flex-wrap items-center gap-[7px]">
              {visibleCities.map((city) => (
                <Chip key={city} label={city} />
              ))}
              {hiddenCities > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setCitiesExpanded(true)}
                  className="min-h-11 md:min-h-0"
                  aria-label={`Show ${hiddenCities} more cities`}
                >
                  +{hiddenCities} more
                </Button>
              )}
              {citiesExpanded && state.cities.length > CITY_CAP && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setCitiesExpanded(false)}
                  className="min-h-11 md:min-h-0"
                >
                  Show fewer
                </Button>
              )}
            </div>
          ) : (
            <p className="text-[12.5px] text-faint">
              No stops in this state on the current route.
            </p>
          )}
        </div>

        {/* Landmarks */}
        {state.highlights.length > 0 && (
          <div className="mt-5">
            <SectionLabel>Landmarks</SectionLabel>
            <div className="flex flex-wrap items-center gap-[7px]">
              {state.highlights.map((highlight) => (
                <span
                  key={highlight.id}
                  className="inline-flex items-center gap-[7px] rounded-[9px] border border-edge bg-panel2 px-3 py-1.5 text-[12.5px] text-ink"
                >
                  <span className="text-accent2" aria-hidden>
                    ◆
                  </span>
                  <span className="truncate">{highlight.label}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* State route sequence */}
        {state.visits.length > 0 && (
          <div className="mt-5">
            <SectionLabel>State route sequence</SectionLabel>
            <ul className="flex flex-col gap-2">
              {visibleVisits.map((visit) => (
                <li
                  key={`${visit.sequence}-${visit.station.id}`}
                  className="flex items-start gap-3 rounded-xl border border-edge bg-panel2 px-3.5 py-3"
                >
                  <span className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full bg-accent font-mono text-[11px] font-semibold text-on-accent">
                    {visit.sequence}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13.5px] font-semibold text-ink">
                          {visit.station.name}
                        </div>
                        <div className="mt-0.5 truncate font-mono text-[11px] text-faint">
                          Day {visit.day} · {visit.station.address.city},{' '}
                          {visit.station.address.state}
                        </div>
                      </div>
                      {visit.rangeWarning && (
                        <Pill tone="warn" className="flex-none">
                          <AlertIcon size={12} />
                          Range
                        </Pill>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-dim">
                      <span>{Math.round(visit.legMiles)} mi</span>
                      <span className="text-faint" aria-hidden>
                        ·
                      </span>
                      <span>{visit.driveHours.toFixed(1)}h</span>
                      <span className="text-faint" aria-hidden>
                        ·
                      </span>
                      <span>{Math.round(visit.stopMinutes)}m</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            {(hiddenVisits > 0 || (visitsExpanded && state.visits.length > VISIT_CAP)) && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setVisitsExpanded((prev) => !prev)}
                className="mt-2.5 min-h-11 md:min-h-0"
                aria-label={
                  visitsExpanded
                    ? 'Show fewer route stops'
                    : `Show ${hiddenVisits} more route stops`
                }
              >
                {visitsExpanded ? 'Show fewer' : `Show all ${state.visits.length} stops`}
              </Button>
            )}
          </div>
        )}
      </div>
    </Overlay>
  )
}
