import { useId } from 'react'
import type { RoutePlan } from '../domain/types'
import { Overlay, OverlayHeader } from '../ui/Overlay'
import { CheckIcon } from '../ui/icons'
import { Button } from '../ui/primitives'
import { buildTripComposition } from '../domain/tripComposition'

export interface RoutePickerProps {
  routes: RoutePlan[]
  selectedRouteId?: string
  open: boolean
  onClose: () => void
  onSelect: (id: string) => void
  onCreateCustomRoute?: () => void
}

export function RoutePicker({
  routes,
  selectedRouteId,
  open,
  onClose,
  onSelect,
  onCreateCustomRoute,
}: RoutePickerProps) {
  const titleId = useId()
  const isLongestTrip = routes[0]?.plannerMode === 'longest_trip'

  const choose = (id: string) => {
    onSelect(id)
    onClose()
  }

  return (
    <Overlay open={open} onClose={onClose} size="picker" variant="top" labelledBy={titleId}>
      <OverlayHeader
        titleId={titleId}
        kicker={`Route candidates · ${isLongestTrip ? 'Longest Trip' : 'Most Unique Sites'}`}
        title="Choose a route"
        onClose={onClose}
      />

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3">
        {onCreateCustomRoute ? (
          <Button
            variant="primary"
            className="mb-1 min-h-10 w-full"
            onClick={onCreateCustomRoute}
          >
            Create Custom Route
          </Button>
        ) : null}
        {routes.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-edge bg-panel2 px-5 py-10 text-center">
            <div className="text-[14px] font-semibold text-ink">No routes yet</div>
            <div className="text-[12.5px] text-dim">Run Optimize to generate candidates.</div>
          </div>
        ) : (
          routes.map((route) => {
            const selected = route.id === selectedRouteId
            const composition = buildTripComposition(route)
            return (
              <button
                key={route.id}
                type="button"
                onClick={() => choose(route.id)}
                aria-pressed={selected}
                aria-label={`Select route ${route.name}, rating ${route.rating.score} out of 100`}
                className="flex w-full cursor-pointer items-stretch gap-[13px] rounded-xl p-[13px] text-left transition"
                style={{
                  border: `1px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
                  background: selected
                    ? 'color-mix(in srgb, var(--accent) 8%, var(--panel-2))'
                    : 'var(--panel-2)',
                }}
              >
                <span
                  aria-hidden
                  className="w-2.5 flex-none self-stretch rounded-[5px]"
                  style={{ background: route.color }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-semibold text-ink">
                    {route.name}
                  </span>
                  <span className="mt-0.5 block text-[12px] text-dim">{route.strategy}</span>
                  <span className="mt-[5px] block font-mono text-[11px] text-faint">
                    {route.uniqueStations.toLocaleString()}{' '}
                    {route.plannerMode === 'longest_trip' ? 'stops' : 'sites'} ·{' '}
                    {route.totalDays} days · {route.totalMiles.toLocaleString()} mi ·{' '}
                    {route.averageDriveHoursPerDay}h/day · ★ {route.rating.score}
                  </span>
                  <span className="mt-[4px] block font-mono text-[10.5px] text-faint">
                    {composition.bigCities} big cities · {composition.landmarks} landmarks ·{' '}
                    {composition.teslaBadges} Tesla badges
                  </span>
                </span>
                {selected ? (
                  <span className="flex flex-none items-center text-accent" aria-hidden>
                    <CheckIcon size={18} />
                  </span>
                ) : null}
              </button>
            )
          })
        )}
      </div>
    </Overlay>
  )
}
