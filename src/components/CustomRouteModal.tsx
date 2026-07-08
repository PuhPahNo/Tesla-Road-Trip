import { useEffect, useId, useMemo, useState } from 'react'
import type { RouteWaypoint } from '../domain/types'
import { detailForCatalogPlace } from '../domain/placeDetails'
import {
  PLACE_CATALOG,
  PLACE_CATEGORY_LABELS,
  PLACE_CATEGORY_OPTIONS,
  type CatalogPlaceType,
  type PlaceCategory,
} from '../domain/placeCatalog'
import { Overlay, OverlayHeader } from '../ui/Overlay'
import { Button, scoreColor } from '../ui/primitives'
import { ChevronDownIcon, ChevronUpIcon, CloseIcon } from '../ui/icons'

interface CatalogLocation {
  id: string
  label: string
  type: 'city' | 'landmark'
  state: string
  position: { lat: number; lon: number }
  radiusMiles: number
  categories: PlaceCategory[]
  rating: number
  summary: string
}

export interface CustomRouteDraft {
  name: string
  waypoints: RouteWaypoint[]
  keepOrder: boolean
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
  const [typeFilter, setTypeFilter] = useState<'all' | CatalogPlaceType>('all')
  const [categoryFilter, setCategoryFilter] = useState<'all' | PlaceCategory>('all')
  const [waypoints, setWaypoints] = useState<RouteWaypoint[]>([])
  const [keepOrder, setKeepOrder] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [manualLabel, setManualLabel] = useState('')
  const [manualLat, setManualLat] = useState('')
  const [manualLon, setManualLon] = useState('')

  useEffect(() => {
    if (open || isSaving) return
    setName('')
    setQuery('')
    setTypeFilter('all')
    setCategoryFilter('all')
    setWaypoints([])
    setKeepOrder(false)
    setDragIndex(null)
    setManualLabel('')
    setManualLat('')
    setManualLon('')
  }, [open, isSaving])

  const filteredCatalog = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    const selectedIds = new Set(waypoints.map((waypoint) => waypoint.id))
    return CATALOG.filter((item) => !selectedIds.has(item.id))
      .filter((item) => (typeFilter === 'all' ? true : item.type === typeFilter))
      .filter((item) =>
        categoryFilter === 'all' ? true : item.categories.includes(categoryFilter),
      )
      .filter((item) =>
        normalized
          ? `${item.label} ${item.state} ${item.type} ${item.categories.join(' ')}`.toLowerCase().includes(normalized)
          : true,
      )
      .slice(0, 72)
  }, [categoryFilter, query, typeFilter, waypoints])

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

  // Reordering implies the user cares about sequence, so lock it in.
  const moveWaypoint = (from: number, to: number) => {
    if (from === to || to < 0 || to >= waypoints.length) return
    setWaypoints((current) => {
      const next = current.slice()
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
    setKeepOrder(true)
  }

  const submit = () => {
    const trimmedName = name.trim()
    if (!trimmedName || waypoints.length === 0 || isSaving) return
    onCreate({ name: trimmedName, waypoints, keepOrder })
  }

  return (
    <Overlay open={open} onClose={onClose} size="wide" labelledBy={titleId}>
      <OverlayHeader
        titleId={titleId}
        kicker="Custom route"
        title="Create saved route"
        meta="Pick landmark/city stops; the optimizer picks the stop order and Supercharger sequence unless you lock the order below."
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
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_130px_160px]">
              <input
                id="custom-route-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search Canton, Hollywood, civil rights..."
                className="h-10 w-full rounded-[10px] border border-edge bg-panel2 px-3 text-[13px] text-ink outline-none placeholder:text-faint"
              />
              <select
                value={typeFilter}
                onChange={(event) =>
                  setTypeFilter(event.target.value as 'all' | CatalogPlaceType)
                }
                aria-label="Filter by place type"
                className="h-10 rounded-[10px] border border-edge bg-panel2 px-2.5 text-[12.5px] text-ink outline-none"
              >
                <option value="all">All types</option>
                <option value="city">Cities</option>
                <option value="landmark">Landmarks</option>
              </select>
              <select
                value={categoryFilter}
                onChange={(event) =>
                  setCategoryFilter(event.target.value as 'all' | PlaceCategory)
                }
                aria-label="Filter by category"
                className="h-10 rounded-[10px] border border-edge bg-panel2 px-2.5 text-[12.5px] text-ink outline-none"
              >
                <option value="all">All categories</option>
                {PLACE_CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-2 font-mono text-[10px] text-faint">
              Showing {filteredCatalog.length} of {CATALOG.length} catalog stops
            </div>
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
                <div className="mt-1 truncate font-mono text-[9px] uppercase tracking-[0.08em] text-faint">
                  {item.categories.map((category) => PLACE_CATEGORY_LABELS[category]).join(' · ')}
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
              Selected stops
            </div>
            <div className="font-mono text-[10.5px] text-faint">
              {waypoints.length} stops
            </div>
          </div>

          <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
            {waypoints.length === 0 ? (
              <div className="rounded-[11px] border border-dashed border-edge bg-chip p-5 text-center text-[12.5px] leading-[1.5] text-dim">
                Add at least one stop. The optimizer will choose the stop order,
                Supercharger sequence, day plan, and return leg from your configured
                trip settings.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {waypoints.map((waypoint, index) => (
                  <div
                    key={`${waypoint.id}-${index}`}
                    draggable
                    onDragStart={() => setDragIndex(index)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault()
                      if (dragIndex !== null) moveWaypoint(dragIndex, index)
                      setDragIndex(null)
                    }}
                    onDragEnd={() => setDragIndex(null)}
                    className={`cursor-grab rounded-[11px] border bg-chip p-3 ${
                      dragIndex === index ? 'border-accent2 opacity-70' : 'border-edge'
                    }`}
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
                        onClick={() => moveWaypoint(index, index - 1)}
                        disabled={index === 0}
                        aria-label={`Move ${waypoint.label} earlier`}
                        className="flex h-7 w-7 flex-none cursor-pointer items-center justify-center rounded-lg border border-edge bg-transparent text-dim transition hover:text-ink disabled:cursor-default disabled:opacity-30"
                      >
                        <ChevronUpIcon size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveWaypoint(index, index + 1)}
                        disabled={index === waypoints.length - 1}
                        aria-label={`Move ${waypoint.label} later`}
                        className="flex h-7 w-7 flex-none cursor-pointer items-center justify-center rounded-lg border border-edge bg-transparent text-dim transition hover:text-ink disabled:cursor-default disabled:opacity-30"
                      >
                        <ChevronDownIcon size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeWaypoint(waypoint.id)}
                        aria-label={`Remove ${waypoint.label}`}
                        className="flex h-7 w-7 flex-none cursor-pointer items-center justify-center rounded-lg border border-edge bg-transparent text-dim transition hover:text-ink"
                      >
                        <CloseIcon size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <label className="mt-3 flex flex-none cursor-pointer items-center justify-between gap-3 rounded-[11px] border border-edge bg-panel2 px-[13px] py-2.5">
            <span className="min-w-0">
              <span className="block text-[12.5px] font-medium text-ink">
                Keep stop order
              </span>
              <span className="mt-0.5 block text-[11px] text-faint">
                Visit stops exactly as listed instead of letting the optimizer
                reorder them.
              </span>
            </span>
            <input
              type="checkbox"
              checked={keepOrder}
              onChange={(event) => setKeepOrder(event.target.checked)}
              className="h-4 w-4 flex-none accent-[var(--accent)]"
            />
          </label>

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
              {isSaving ? 'Saving...' : 'Save and optimize'}
            </Button>
          </div>
        </aside>
      </div>
    </Overlay>
  )
}

function buildCatalog(): CatalogLocation[] {
  return PLACE_CATALOG.map((entry) => {
    const detail = detailForCatalogPlace(entry)
    return {
      id: entry.id,
      label: entry.label,
      type: entry.type,
      state: entry.state,
      position: entry.position,
      radiusMiles: entry.radiusMiles,
      categories: entry.categories,
      rating: detail.rating,
      summary: detail.summary,
    }
  })
    .sort((a, b) => b.rating - a.rating || a.label.localeCompare(b.label))
}

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
