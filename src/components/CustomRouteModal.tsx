import { useEffect, useId, useMemo, useState } from 'react'
import type { RouteWaypoint } from '../domain/types'
import { STATE_SIGNATURES } from '../domain/stateSignatures'
import { detailForDestination, detailForSignature } from '../domain/placeDetails'
import { LONGEST_TRIP_DESTINATIONS } from '../domain/visitTargets'
import { Overlay, OverlayHeader } from '../ui/Overlay'
import { Button, scoreColor } from '../ui/primitives'
import { CloseIcon } from '../ui/icons'

interface CatalogLocation {
  id: string
  label: string
  type: 'city' | 'landmark'
  state: string
  position: { lat: number; lon: number }
  radiusMiles: number
  rating: number
  summary: string
}

export interface CustomRouteDraft {
  name: string
  waypoints: RouteWaypoint[]
}

export interface CustomRouteModalProps {
  open: boolean
  isSaving: boolean
  onClose: () => void
  onCreate: (draft: CustomRouteDraft) => void
}

const CATALOG: CatalogLocation[] = buildCatalog()

export function CustomRouteModal({
  open,
  isSaving,
  onClose,
  onCreate,
}: CustomRouteModalProps) {
  const titleId = useId()
  const [name, setName] = useState('')
  const [query, setQuery] = useState('')
  const [waypoints, setWaypoints] = useState<RouteWaypoint[]>([])
  const [manualLabel, setManualLabel] = useState('')
  const [manualLat, setManualLat] = useState('')
  const [manualLon, setManualLon] = useState('')

  useEffect(() => {
    if (open || isSaving) return
    setName('')
    setQuery('')
    setWaypoints([])
    setManualLabel('')
    setManualLat('')
    setManualLon('')
  }, [open, isSaving])

  const filteredCatalog = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    const selectedIds = new Set(waypoints.map((waypoint) => waypoint.id))
    return CATALOG.filter((item) => !selectedIds.has(item.id))
      .filter((item) =>
        normalized
          ? `${item.label} ${item.state} ${item.type}`.toLowerCase().includes(normalized)
          : true,
      )
      .slice(0, 36)
  }, [query, waypoints])

  const addCatalogItem = (item: CatalogLocation) => {
    setWaypoints((current) => [
      ...current,
      {
        id: item.id,
        label: item.label,
        position: item.position,
        radiusMiles: item.radiusMiles,
        reason: `Saved route stop: ${item.summary}`,
      },
    ])
  }

  const addManualWaypoint = () => {
    const label = manualLabel.trim()
    const lat = Number(manualLat)
    const lon = Number(manualLon)
    if (!label || !Number.isFinite(lat) || !Number.isFinite(lon)) return
    setWaypoints((current) => [
      ...current,
      {
        id: `manual-${slug(label)}-${current.length + 1}`,
        label,
        position: { lat, lon },
        radiusMiles: 60,
        reason: 'Saved manual custom route stop.',
      },
    ])
    setManualLabel('')
    setManualLat('')
    setManualLon('')
  }

  const removeWaypoint = (id: string) => {
    setWaypoints((current) => current.filter((waypoint) => waypoint.id !== id))
  }

  const moveWaypoint = (index: number, direction: -1 | 1) => {
    setWaypoints((current) => {
      const nextIndex = index + direction
      if (nextIndex < 0 || nextIndex >= current.length) return current
      const next = current.slice()
      const [item] = next.splice(index, 1)
      next.splice(nextIndex, 0, item)
      return next
    })
  }

  const submit = () => {
    const trimmedName = name.trim()
    if (!trimmedName || waypoints.length === 0 || isSaving) return
    onCreate({ name: trimmedName, waypoints })
  }

  return (
    <Overlay open={open} onClose={onClose} size="wide" labelledBy={titleId}>
      <OverlayHeader
        titleId={titleId}
        kicker="Custom route"
        title="Create saved route"
        meta="Pick landmark/city stops in order, then optimize and grade the route."
        onClose={onClose}
      />

      <div className="grid min-h-0 flex-1 gap-0 overflow-hidden md:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-h-0 overflow-y-auto p-4">
          <label className="mb-2 block text-[12px] font-medium text-dim" htmlFor="custom-route-name">
            Route name
          </label>
          <input
            id="custom-route-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Southwest Parks Run"
            className="h-11 w-full rounded-[10px] border border-edge bg-panel2 px-3 text-[13px] text-ink outline-none placeholder:text-faint"
          />

          <div className="mt-4">
            <label className="mb-2 block text-[12px] font-medium text-dim" htmlFor="custom-route-search">
              Add from loaded landmarks and cities
            </label>
            <input
              id="custom-route-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search Yosemite, Zion, New York, Grand Canyon..."
              className="h-10 w-full rounded-[10px] border border-edge bg-panel2 px-3 text-[13px] text-ink outline-none placeholder:text-faint"
            />
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {filteredCatalog.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => addCatalogItem(item)}
                className="min-h-[108px] cursor-pointer rounded-[11px] border border-edge bg-chip p-3 text-left transition hover:brightness-110"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-semibold text-ink">
                      {item.label}
                    </div>
                    <div className="mt-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-faint">
                      {item.state} · {item.type}
                    </div>
                  </div>
                  <span
                    className="flex-none font-mono text-[12px] font-semibold"
                    style={{ color: scoreColor(item.rating) }}
                  >
                    {item.rating}
                  </span>
                </div>
                <div className="mt-2 line-clamp-2 text-[11.5px] leading-[1.4] text-dim">
                  {item.summary}
                </div>
              </button>
            ))}
          </div>

          <div className="mt-5 rounded-[11px] border border-edge bg-chip p-3">
            <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-faint">
              Manual location
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_100px_100px_auto]">
              <input
                value={manualLabel}
                onChange={(event) => setManualLabel(event.target.value)}
                placeholder="Landmark name"
                className="h-10 min-w-0 rounded-[9px] border border-edge bg-panel2 px-3 text-[12.5px] text-ink outline-none placeholder:text-faint"
              />
              <input
                value={manualLat}
                onChange={(event) => setManualLat(event.target.value)}
                placeholder="Lat"
                inputMode="decimal"
                className="h-10 rounded-[9px] border border-edge bg-panel2 px-3 text-[12.5px] text-ink outline-none placeholder:text-faint"
              />
              <input
                value={manualLon}
                onChange={(event) => setManualLon(event.target.value)}
                placeholder="Lon"
                inputMode="decimal"
                className="h-10 rounded-[9px] border border-edge bg-panel2 px-3 text-[12.5px] text-ink outline-none placeholder:text-faint"
              />
              <Button variant="secondary" className="h-10" onClick={addManualWaypoint}>
                Add
              </Button>
            </div>
          </div>
        </div>

        <aside className="flex min-h-0 flex-col border-t border-edge bg-panel2 p-4 md:border-l md:border-t-0">
          <div className="flex items-baseline justify-between gap-3">
            <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-faint">
              Route order
            </div>
            <div className="font-mono text-[10.5px] text-faint">
              {waypoints.length} stops
            </div>
          </div>

          <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
            {waypoints.length === 0 ? (
              <div className="rounded-[11px] border border-dashed border-edge bg-chip p-5 text-center text-[12.5px] leading-[1.5] text-dim">
                Add at least one stop. The optimizer will route from Chattanooga through
                your stops and back.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {waypoints.map((waypoint, index) => (
                  <div
                    key={`${waypoint.id}-${index}`}
                    className="rounded-[11px] border border-edge bg-chip p-3"
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-on-accent">
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[12.5px] font-semibold text-ink">
                          {waypoint.label}
                        </div>
                        <div className="mt-0.5 font-mono text-[10px] text-faint">
                          {waypoint.position.lat.toFixed(3)},{' '}
                          {waypoint.position.lon.toFixed(3)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeWaypoint(waypoint.id)}
                        aria-label={`Remove ${waypoint.label}`}
                        className="flex h-7 w-7 flex-none cursor-pointer items-center justify-center rounded-lg border border-edge bg-transparent text-dim transition hover:text-ink"
                      >
                        <CloseIcon size={12} />
                      </button>
                    </div>
                    <div className="mt-2 flex gap-2 pl-8">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={index === 0}
                        onClick={() => moveWaypoint(index, -1)}
                      >
                        Up
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={index === waypoints.length - 1}
                        onClick={() => moveWaypoint(index, 1)}
                      >
                        Down
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-none gap-2">
            <Button variant="secondary" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              disabled={isSaving || !name.trim() || waypoints.length === 0}
              onClick={submit}
            >
              {isSaving ? 'Saving...' : 'Save route'}
            </Button>
          </div>
        </aside>
      </div>
    </Overlay>
  )
}

function buildCatalog(): CatalogLocation[] {
  const destinationItems = LONGEST_TRIP_DESTINATIONS.map((destination) => {
    const detail = detailForDestination(destination)
    return {
      id: `catalog-${destination.id}`,
      label: destination.label,
      type: destination.type,
      state: destination.state,
      position: destination.position,
      radiusMiles: destination.radiusMiles,
      rating: detail.rating,
      summary: detail.summary,
    }
  })

  const signatureItems = Object.entries(STATE_SIGNATURES).flatMap(([state, signatures]) =>
    signatures.map((signature) => {
      const detail = detailForSignature(signature, state)
      return {
        id: `signature-${signature.id}`,
        label: signature.label,
        type: 'landmark' as const,
        state,
        position: signature.position,
        radiusMiles: signature.radiusMiles,
        rating: detail.rating,
        summary: detail.summary,
      }
    }),
  )

  const byKey = new Map<string, CatalogLocation>()
  ;[...destinationItems, ...signatureItems]
    .sort((a, b) => b.rating - a.rating || a.label.localeCompare(b.label))
    .forEach((item) => {
      const key = `${item.label.toLowerCase()}-${item.state}`
      if (!byKey.has(key)) byKey.set(key, item)
    })

  return [...byKey.values()]
}

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
