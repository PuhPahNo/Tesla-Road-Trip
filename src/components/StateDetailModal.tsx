import { useId, useState } from 'react'
import type { StateRouteStats } from '../domain/routeStats'
import { STATE_CODE_TO_NAME } from '../domain/usStates'
import { Overlay, OverlayHeader } from '../ui/Overlay'
import { Button, Chip, StatTile } from '../ui/primitives'

export interface StateDetailModalProps {
  state?: StateRouteStats
  onClose: () => void
}

const CITY_CAP = 24

export function StateDetailModal({ state, onClose }: StateDetailModalProps) {
  const titleId = useId()
  const [citiesExpanded, setCitiesExpanded] = useState(false)

  if (!state) return null

  const fullName = STATE_CODE_TO_NAME[state.state] ?? state.state
  const visibleCities = citiesExpanded ? state.cities : state.cities.slice(0, CITY_CAP)
  const hiddenCities = state.cities.length - visibleCities.length

  return (
    <Overlay open onClose={onClose} size="compact" labelledBy={titleId}>
      <OverlayHeader
        titleId={titleId}
        kicker="State coverage"
        title={fullName}
        meta={`${state.routeStations} of ${state.totalStations} filtered Superchargers visited`}
        onClose={onClose}
      />

      <div className="min-h-0 flex-1 overflow-y-auto p-[18px]">
        <div className="grid grid-cols-2 gap-2.5">
          <StatTile label="On route" value={state.routeStations} />
          <StatTile label="Coverage" value={state.coveragePct} unit="%" />
          <StatTile label="Total sites" value={state.totalStations} />
          <StatTile label="Miles in state" value={state.miles.toLocaleString()} />
        </div>

        {state.cities.length > 0 && (
          <div className="mt-5">
            <div className="mb-[9px] font-mono text-[10px] uppercase tracking-[0.05em] text-faint">
              Cities visited
            </div>
            <div className="flex flex-wrap items-center gap-[7px]">
              {visibleCities.map((city) => (
                <Chip key={city} label={city} />
              ))}
              {hiddenCities > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setCitiesExpanded(true)}
                  aria-label={`Show ${hiddenCities} more cities`}
                >
                  +{hiddenCities} more
                </Button>
              )}
            </div>
          </div>
        )}

        {state.highlights.length > 0 && (
          <div className="mt-5">
            <div className="mb-[9px] font-mono text-[10px] uppercase tracking-[0.05em] text-faint">
              Landmarks
            </div>
            <div className="flex flex-wrap items-center gap-[7px]">
              {state.highlights.map((highlight) => (
                <span
                  key={highlight.id}
                  className="inline-flex items-center gap-[7px] rounded-[9px] border border-edge bg-chip px-3 py-1.5 text-[12.5px] text-ink"
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
      </div>
    </Overlay>
  )
}
