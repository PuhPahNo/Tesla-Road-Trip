import { useId } from 'react'
import type { RoutePlan } from '../domain/types'
import { Overlay, OverlayHeader } from '../ui/Overlay'
import { cx } from '../ui/primitives'
import { AlertIcon, InfoIcon } from '../ui/icons'

export interface RoutePickerProps {
  routes: RoutePlan[]
  selectedRouteId?: string
  open: boolean
  onClose: () => void
  onSelect: (id: string) => void
}

export function RoutePicker({
  routes,
  selectedRouteId,
  open,
  onClose,
  onSelect,
}: RoutePickerProps) {
  const titleId = useId()

  const choose = (id: string) => {
    onSelect(id)
    onClose()
  }

  return (
    <Overlay open={open} onClose={onClose} size="detail" labelledBy={titleId}>
      <OverlayHeader
        titleId={titleId}
        kicker="Route candidates"
        title="Choose a route"
        onClose={onClose}
      />

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-4 md:p-5">
        {routes.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-edge bg-panel2 px-5 py-10 text-center">
            <div className="text-[14px] font-semibold text-ink">No routes yet</div>
            <div className="text-[12.5px] text-dim">Run Optimize to generate candidates.</div>
          </div>
        ) : (
          routes.map((route) => {
            const selected = route.id === selectedRouteId
            const hasWarnings = route.warnings.length > 0
            const hasAdvisories = route.advisories.length > 0
            return (
              <button
                key={route.id}
                type="button"
                onClick={() => choose(route.id)}
                aria-pressed={selected}
                aria-label={`Select route ${route.name}`}
                className={cx(
                  'grid w-full grid-cols-[8px_1fr_auto] items-stretch gap-3 rounded-xl border p-3 text-left transition cursor-pointer',
                  selected
                    ? 'border-accent shadow-card'
                    : 'border-edge hover:border-edge2',
                )}
              >
                <span
                  aria-hidden
                  className="min-h-11 w-2 self-stretch rounded"
                  style={{ background: route.color }}
                />

                <span className="flex min-w-0 flex-col justify-center gap-0.5">
                  <span className="truncate text-[14px] font-semibold text-ink">
                    {route.name}
                  </span>
                  <span className="truncate font-mono text-[11.5px] text-faint">
                    {route.uniqueStations.toLocaleString()} sites · {route.totalDays}{' '}
                    days · {route.totalMiles.toLocaleString()} mi
                  </span>
                </span>

                <span className="flex items-center justify-end pl-1">
                  {hasWarnings ? (
                    <AlertIcon
                      size={16}
                      className="flex-none text-warn"
                      aria-hidden
                    />
                  ) : hasAdvisories ? (
                    <InfoIcon size={16} className="flex-none text-info" aria-hidden />
                  ) : null}
                </span>
              </button>
            )
          })
        )}
      </div>
    </Overlay>
  )
}
