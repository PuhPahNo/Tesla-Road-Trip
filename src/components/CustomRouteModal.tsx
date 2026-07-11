import { useEffect, useId, useMemo, useState } from 'react'
import type {
  PlannerConfig,
  RouteDirectionPreference,
  RouteTravelPreferences,
  RouteWaypoint,
  SavedCustomRoute,
  TripPace,
} from '../domain/types'
import { CHATTANOOGA_37405_START } from '../domain/config'
import { TRIP_PACE_LABELS } from '../domain/stays'
import {
  directionPreferenceDescription,
  ROUTE_DIRECTION_OPTIONS,
} from '../domain/routeDirection'
import { detailForCatalogPlace } from '../domain/placeDetails'
import {
  PLACE_CATALOG,
  PLACE_CATEGORY_LABELS,
  PLACE_CATEGORY_OPTIONS,
  type CatalogPlaceType,
  type PlaceCategory,
} from '../domain/placeCatalog'
import {
  TESLA_ICONIC_BADGES,
  specialEventBadgesInTripWindow,
} from '../domain/teslaBadges'
import { Overlay, OverlayHeader } from '../ui/Overlay'
import { Button, scoreColor } from '../ui/primitives'
import { ChevronDownIcon, ChevronUpIcon, CloseIcon } from '../ui/icons'
import {
  getVehicleProfile,
  practicalRangeForVehicle,
  VEHICLE_PROFILES,
  type VehicleProfileId,
} from '../domain/vehicleProfiles'

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
  teslaBadge: boolean
  routeTarget: boolean
  badgeRegion?: 'lower48' | 'canada' | 'hawaii'
  availabilityNote?: string
}

type CatalogCategoryFilter = 'all' | PlaceCategory | 'tesla-badge'
type RouteWizardStep = 1 | 2 | 3

export interface CustomRouteDraft {
  name: string
  waypoints: RouteWaypoint[]
  targetDays: number
  keepOrder: boolean
  startMonth: number
  startDate: string
  directionPreference: RouteDirectionPreference
  travelPreferences?: RouteTravelPreferences | null
}

export interface CustomRouteModalProps {
  open: boolean
  isSaving: boolean
  route?: SavedCustomRoute
  defaultTargetDays: number
  defaultStartDate?: string
  preferences: Pick<
    PlannerConfig,
    | 'tripPace'
    | 'dailyDriveTargetHours'
    | 'dailyDriveMaxHours'
    | 'vehicleProfileId'
    | 'practicalRangeMiles'
    | 'manualPracticalRange'
    | 'includeCanada'
  >
  onClose: () => void
  onSave: (draft: CustomRouteDraft) => void
}

const CATALOG: CatalogLocation[] = buildCatalog()

export function CustomRouteModal({
  open,
  isSaving,
  route,
  defaultTargetDays,
  defaultStartDate = new Date().toISOString().slice(0, 10),
  preferences,
  onClose,
  onSave,
}: CustomRouteModalProps) {
  const titleId = useId()
  const [step, setStep] = useState<RouteWizardStep>(1)
  const [name, setName] = useState('')
  const [targetDays, setTargetDays] = useState(String(defaultTargetDays))
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | CatalogPlaceType>('all')
  const [categoryFilter, setCategoryFilter] = useState<CatalogCategoryFilter>('all')
  const [waypoints, setWaypoints] = useState<RouteWaypoint[]>([])
  const [keepOrder, setKeepOrder] = useState(false)
  const [startDate, setStartDate] = useState(defaultStartDate)
  const [directionPreference, setDirectionPreference] =
    useState<RouteDirectionPreference>('seasonal')
  const [customizePreferences, setCustomizePreferences] = useState(false)
  const [routePreferences, setRoutePreferences] = useState<RouteTravelPreferences>(
    () => routeTravelPreferencesFrom(preferences),
  )
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [manualLabel, setManualLabel] = useState('')
  const [manualLat, setManualLat] = useState('')
  const [manualLon, setManualLon] = useState('')

  useEffect(() => {
    if (!open) return
    setStep(1)
    setName(route?.name ?? '')
    setTargetDays(String(route?.targetDays ?? defaultTargetDays))
    setQuery('')
    setTypeFilter('all')
    setCategoryFilter('all')
    setWaypoints(route?.waypoints ?? [])
    setKeepOrder(Boolean(route?.keepOrder))
    setStartDate(routeStartDate(route, defaultStartDate))
    setDirectionPreference(route?.directionPreference ?? 'seasonal')
    setCustomizePreferences(Boolean(route?.travelPreferences))
    setRoutePreferences(
      route?.travelPreferences ?? routeTravelPreferencesFrom(preferences),
    )
    setDragIndex(null)
    setManualLabel('')
    setManualLat('')
    setManualLon('')
  }, [defaultStartDate, defaultTargetDays, open, preferences, route])

  const startMonth = monthForDate(startDate)
  const specialEventBadges = useMemo(
    () => specialEventBadgesInTripWindow(startDate, Number(targetDays)),
    [startDate, targetDays],
  )

  const filteredCatalog = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    const selectedIds = new Set(waypoints.map((waypoint) => waypoint.id))
    return CATALOG.filter((item) => !selectedIds.has(item.id))
      .filter((item) => (typeFilter === 'all' ? true : item.type === typeFilter))
      .filter((item) =>
        categoryFilter === 'all'
          ? true
          : categoryFilter === 'tesla-badge'
            ? item.teslaBadge
            : item.categories.includes(categoryFilter),
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
    const parsedTargetDays = Number(targetDays)
    if (
      !trimmedName ||
      waypoints.length === 0 ||
      !Number.isInteger(parsedTargetDays) ||
      parsedTargetDays < 1 ||
      parsedTargetDays > 365 ||
      isSaving
    ) return
    onSave({
      name: trimmedName,
      waypoints,
      targetDays: parsedTargetDays,
      keepOrder,
      startMonth,
      startDate,
      directionPreference,
      travelPreferences: customizePreferences
        ? normalizedTravelPreferences(routePreferences)
        : route
          ? null
          : undefined,
    })
  }

  const validTargetDays =
    Number.isInteger(Number(targetDays)) && Number(targetDays) >= 1 && Number(targetDays) <= 365
  const setupValid = Boolean(name.trim() && startDate && validTargetDays)
  const destinationsValid = waypoints.length > 0
  const effectivePreferences = customizePreferences ? routePreferences : preferences

  return (
    <Overlay open={open} onClose={onClose} size="wide" labelledBy={titleId}>
      <OverlayHeader
        titleId={titleId}
        kicker="Route builder"
        title={route ? 'Edit custom route' : 'Create custom route'}
        meta={`Step ${step} of 3 · ${step === 1 ? 'Set up the trip' : step === 2 ? 'Choose destinations' : 'Review and optimize'}`}
        onClose={onClose}
      />

      <RouteWizardStepper
        step={step}
        canOpenDestinations={setupValid}
        canOpenReview={setupValid && destinationsValid}
        onStepChange={setStep}
      />

      <div className={`grid min-h-0 flex-1 gap-0 overflow-hidden ${step === 1 ? '' : 'md:grid-cols-[minmax(0,1fr)_360px]'}`}>
        <div className={`min-h-0 overflow-y-auto p-4 ${step === 1 ? 'mx-auto w-full max-w-5xl' : ''}`}>
          {step === 1 ? <>
          <div className="mb-4">
            <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-accent2">Step 1</div>
            <h2 className="mt-1 text-[18px] font-semibold text-ink">Start with the trip basics</h2>
            <p className="mt-1 max-w-2xl text-[12px] leading-[1.5] text-dim">
              Name the route, choose when it starts, and decide how the first leg should head out. Your saved preferences are already loaded as presets.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_150px]">
            <label className="block text-[12px] font-medium text-dim" htmlFor="custom-route-name">
              Route name
              <input
                id="custom-route-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Southwest Parks Run"
                className="mt-2 h-11 w-full rounded-[10px] border border-edge bg-panel2 px-3 text-[13px] text-ink outline-none placeholder:text-faint"
              />
            </label>
            <label className="block text-[12px] font-medium text-dim" htmlFor="custom-route-days">
              Trip length
              <div className="relative mt-2">
                <input
                  id="custom-route-days"
                  value={targetDays}
                  onChange={(event) => setTargetDays(event.target.value)}
                  type="number"
                  min={1}
                  max={365}
                  step={1}
                  aria-label="Custom route trip days"
                  className="h-11 w-full rounded-[10px] border border-edge bg-panel2 px-3 pr-12 text-[13px] text-ink outline-none"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] uppercase text-faint">
                  days
                </span>
              </div>
            </label>
          </div>

          <div className="mt-4 rounded-[11px] border border-edge bg-chip p-3">
            <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-faint">
              How should this trip begin?
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block text-[12px] font-medium text-dim" htmlFor="custom-route-date">
                Trip starts
                <input
                  id="custom-route-date"
                  aria-label="Trip start date"
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="mt-2 h-11 w-full rounded-[10px] border border-edge bg-panel2 px-3 text-[13px] text-ink outline-none"
                />
              </label>
              <label className="block text-[12px] font-medium text-dim" htmlFor="custom-route-direction">
                First heading
                <select
                  id="custom-route-direction"
                  aria-label="Starting direction preference"
                  value={directionPreference}
                  disabled={keepOrder}
                  onChange={(event) =>
                    setDirectionPreference(event.target.value as RouteDirectionPreference)
                  }
                  className="mt-2 h-11 w-full rounded-[10px] border border-edge bg-panel2 px-3 text-[13px] text-ink outline-none disabled:opacity-50"
                >
                  {ROUTE_DIRECTION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-2 text-[11px] leading-[1.5] text-faint">
              {keepOrder
                ? 'Exact stop order is on, so the first saved stop sets the heading.'
                : directionPreferenceDescription(
                    directionPreference,
                    startMonth,
                    CHATTANOOGA_37405_START,
                  )}
            </div>
            <div className="mt-3 rounded-[9px] border border-edge bg-panel2 px-3 py-2 text-[10.5px] leading-[1.5] text-faint">
              {specialEventBadges.length > 0
                ? specialEventBadges.map((badge) => `${badge.label} · day ${badge.day} (${badge.date})`).join(' · ')
                : 'No currently announced date-limited Tesla badge falls inside this trip window.'}
            </div>
          </div>

          <div className="mt-4 rounded-[11px] border border-edge bg-chip p-3">
            <div className="flex items-baseline justify-between gap-3">
              <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-faint">
                Travel preferences
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-[10.5px] text-dim">
                <input
                  type="checkbox"
                  checked={customizePreferences}
                  onChange={(event) => {
                    setCustomizePreferences(event.target.checked)
                    if (event.target.checked && !route?.travelPreferences) {
                      setRoutePreferences(routeTravelPreferencesFrom(preferences))
                    }
                  }}
                  aria-label="Customize travel preferences for this route"
                  className="h-4 w-4 accent-[var(--accent)]"
                />
                Customize for this route
              </label>
            </div>
            <div className="mt-1 font-mono text-[9.5px] text-faint">
              {customizePreferences
                ? 'Saved with this route · global changes will not replace these values'
                : `Using Preferences presets · ${getVehicleProfile(preferences.vehicleProfileId).label}`}
            </div>
            {customizePreferences ? (
              <div className="mt-3">
                <RoutePreferencesEditor
                  value={routePreferences}
                  onChange={setRoutePreferences}
                />
              </div>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <PreferenceSummary label="Pace" value={TRIP_PACE_LABELS[preferences.tripPace]} />
                <PreferenceSummary label="Comfortable day" value={`${preferences.dailyDriveTargetHours}h`} />
                <PreferenceSummary label="Daily maximum" value={`${preferences.dailyDriveMaxHours}h`} />
                <PreferenceSummary label="Practical range" value={`${preferences.practicalRangeMiles} mi`} />
              </div>
            )}
          </div>

          </> : null}

          {step === 2 ? <>
          <div className="mb-4">
            <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-accent2">Step 2</div>
            <h2 className="mt-1 text-[18px] font-semibold text-ink">Add the places that matter</h2>
            <p className="mt-1 max-w-2xl text-[12px] leading-[1.5] text-dim">
              Choose cities, landmarks, or Tesla Iconic Charger targets. Charge Quest will fill in charging stops between these anchors.
            </p>
          </div>
          <div>
            <label className="mb-2 block text-[12px] font-medium text-dim" htmlFor="custom-route-search">
              Search destinations
            </label>
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_130px_185px]">
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
                  setCategoryFilter(event.target.value as CatalogCategoryFilter)
                }
                aria-label="Filter by category"
                className="h-10 rounded-[10px] border border-edge bg-panel2 px-2.5 text-[12.5px] text-ink outline-none"
              >
                <option value="all">All categories</option>
                <option value="tesla-badge">Tesla Iconic Chargers</option>
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
            {categoryFilter === 'tesla-badge' ? (
              <div className="mt-2 rounded-[9px] border border-edge bg-chip px-3 py-2 text-[11px] leading-[1.45] text-faint">
                Researched Iconic Charger targets use exact Supercharger sites where
                public data is available. Confirm current eligibility in the Tesla app.
              </div>
            ) : null}
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {filteredCatalog.map((item) => {
              const canAdd = item.routeTarget &&
                (item.badgeRegion !== 'canada' || preferences.includeCanada)
              const availability = item.badgeRegion === 'canada' && !preferences.includeCanada
                ? 'Turn on Include Canada in Travel Preferences to target this badge.'
                : item.availabilityNote
              return (
                <button
                key={item.id}
                type="button"
                onClick={() => addCatalogItem(item)}
                aria-label={`Add ${item.label} to custom route`}
                disabled={!canAdd}
                className="min-h-[108px] cursor-pointer rounded-[11px] border border-edge bg-chip p-3 text-left transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-55"
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
                  {[
                    ...(item.teslaBadge ? ['Tesla Iconic Charger'] : []),
                    ...item.categories.map((category) => PLACE_CATEGORY_LABELS[category]),
                  ].join(' · ')}
                </div>
                <div className="mt-2 line-clamp-2 text-[11.5px] leading-[1.4] text-dim">
                  {availability ?? item.summary}
                </div>
              </button>
              )
            })}
          </div>

          <details className="mt-5 rounded-[11px] border border-edge bg-chip p-3">
            <summary className="cursor-pointer font-mono text-[9px] uppercase tracking-[0.1em] text-faint">
              Add a location by coordinates
            </summary>
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
          </details>
          </> : null}

          {step === 3 ? (
            <div>
              <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-accent2">Step 3</div>
              <h2 className="mt-1 text-[18px] font-semibold text-ink">Review the route, then optimize</h2>
              <p className="mt-1 max-w-2xl text-[12px] leading-[1.5] text-dim">
                Confirm the trip shape and reorder any anchors that must happen in sequence. The detailed driving and charging plan is built after you save.
              </p>

              <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
                <PreferenceSummary label="Route" value={name.trim() || 'Untitled'} />
                <PreferenceSummary label="Starts" value={startDate} />
                <PreferenceSummary label="Trip length" value={`${targetDays} days`} />
                <PreferenceSummary label="Vehicle" value={getVehicleProfile(effectivePreferences.vehicleProfileId).label} />
                <PreferenceSummary label="Pace" value={TRIP_PACE_LABELS[effectivePreferences.tripPace]} />
                <PreferenceSummary label="Practical range" value={`${effectivePreferences.practicalRangeMiles} mi`} />
              </div>

              <div className="mt-4 rounded-[11px] border border-edge bg-chip p-3">
                <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-faint">First heading</div>
                <div className="mt-1 text-[12.5px] font-semibold text-ink">
                  {ROUTE_DIRECTION_OPTIONS.find((option) => option.value === directionPreference)?.label}
                </div>
                <div className="mt-1 text-[11px] leading-[1.5] text-faint">
                  {keepOrder
                    ? 'Exact stop order will take priority over the directional preference.'
                    : directionPreferenceDescription(directionPreference, startMonth, CHATTANOOGA_37405_START)}
                </div>
              </div>

              {specialEventBadges.length > 0 ? (
                <div className="mt-4 rounded-[11px] border border-accent2/40 bg-chip p-3">
                  <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-accent2">Badge opportunities in this trip window</div>
                  <div className="mt-2 text-[11.5px] leading-[1.5] text-dim">
                    {specialEventBadges.map((badge) => `${badge.label} · day ${badge.day} (${badge.date})`).join(' · ')}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        {step !== 1 ? <aside className="flex min-h-0 flex-col border-t border-edge bg-panel2 p-4 md:border-l md:border-t-0">
          <div className="flex items-baseline justify-between gap-3">
            <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-faint">
              {step === 2 ? 'Selected destinations' : 'Stop order'}
            </div>
            <div className="font-mono text-[10.5px] text-faint">
              {waypoints.length} stops
            </div>
          </div>

          <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
            {waypoints.length === 0 ? (
              <div className="rounded-[11px] border border-dashed border-edge bg-chip p-5 text-center text-[12.5px] leading-[1.5] text-dim">
                Add at least one destination. The optimizer will build the
                Supercharger sequence and day plan around the places you choose.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {waypoints.map((waypoint, index) => (
                  <div
                    key={`${waypoint.id}-${index}`}
                    draggable={step === 3}
                    onDragStart={() => step === 3 && setDragIndex(index)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault()
                      if (dragIndex !== null) moveWaypoint(dragIndex, index)
                      setDragIndex(null)
                    }}
                    onDragEnd={() => setDragIndex(null)}
                    className={`rounded-[11px] border bg-chip p-3 ${step === 3 ? 'cursor-grab' : ''} ${
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
                      {step === 3 ? <button
                        type="button"
                        onClick={() => moveWaypoint(index, index - 1)}
                        disabled={index === 0}
                        aria-label={`Move ${waypoint.label} earlier`}
                        className="flex h-7 w-7 flex-none cursor-pointer items-center justify-center rounded-lg border border-edge bg-transparent text-dim transition hover:text-ink disabled:cursor-default disabled:opacity-30"
                      >
                        <ChevronUpIcon size={12} />
                      </button> : null}
                      {step === 3 ? <button
                        type="button"
                        onClick={() => moveWaypoint(index, index + 1)}
                        disabled={index === waypoints.length - 1}
                        aria-label={`Move ${waypoint.label} later`}
                        className="flex h-7 w-7 flex-none cursor-pointer items-center justify-center rounded-lg border border-edge bg-transparent text-dim transition hover:text-ink disabled:cursor-default disabled:opacity-30"
                      >
                        <ChevronDownIcon size={12} />
                      </button> : null}
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

          {step === 3 ? <label className="mt-3 flex flex-none cursor-pointer items-center justify-between gap-3 rounded-[11px] border border-edge bg-panel2 px-[13px] py-2.5">
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
          </label> : null}
        </aside> : null}
      </div>

      <div className="flex flex-none items-center justify-between gap-3 border-t border-edge bg-panel2 px-4 py-3">
        <Button variant="secondary" onClick={step === 1 ? onClose : () => setStep((step - 1) as RouteWizardStep)}>
          {step === 1 ? 'Cancel' : 'Back'}
        </Button>
        {step === 1 ? (
          <Button variant="primary" disabled={!setupValid} onClick={() => setStep(2)}>
            Continue to destinations
          </Button>
        ) : step === 2 ? (
          <Button variant="primary" disabled={!destinationsValid} onClick={() => setStep(3)}>
            Review route
          </Button>
        ) : (
          <Button
            variant="primary"
            disabled={isSaving || !setupValid || !destinationsValid}
            onClick={submit}
          >
            {isSaving ? 'Saving...' : route ? 'Update and optimize' : 'Save and optimize'}
          </Button>
        )}
      </div>
    </Overlay>
  )
}

function RouteWizardStepper({
  step,
  canOpenDestinations,
  canOpenReview,
  onStepChange,
}: {
  step: RouteWizardStep
  canOpenDestinations: boolean
  canOpenReview: boolean
  onStepChange: (step: RouteWizardStep) => void
}) {
  const steps: Array<{ id: RouteWizardStep; label: string; hint: string }> = [
    { id: 1, label: 'Trip setup', hint: 'Preferences & timing' },
    { id: 2, label: 'Destinations', hint: 'Places that matter' },
    { id: 3, label: 'Review & optimize', hint: 'Order & save' },
  ]

  return (
    <nav
      aria-label="Custom route steps"
      className="grid flex-none grid-cols-3 border-b border-edge bg-panel2 px-3 py-2"
    >
      {steps.map((item) => {
        const enabled = item.id === 1 || (item.id === 2 ? canOpenDestinations : canOpenReview)
        const active = step === item.id
        return (
          <button
            key={item.id}
            type="button"
            disabled={!enabled}
            aria-current={active ? 'step' : undefined}
            onClick={() => onStepChange(item.id)}
            className={`flex min-w-0 items-center gap-2 rounded-[9px] px-2 py-2 text-left transition ${
              active ? 'bg-chip text-ink' : 'text-faint hover:bg-chip/60 hover:text-dim'
            } disabled:cursor-not-allowed disabled:opacity-35`}
          >
            <span
              className={`flex h-6 w-6 flex-none items-center justify-center rounded-full text-[10.5px] font-semibold ${
                active ? 'bg-accent text-on-accent' : 'border border-edge bg-chip'
              }`}
            >
              {item.id}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[11.5px] font-semibold">
                {item.label}
              </span>
              <span className="hidden truncate font-mono text-[8.5px] uppercase tracking-[0.06em] sm:block">
                {item.hint}
              </span>
            </span>
          </button>
        )
      })}
    </nav>
  )
}

function RoutePreferencesEditor({
  value,
  onChange,
}: {
  value: RouteTravelPreferences
  onChange: (value: RouteTravelPreferences) => void
}) {
  const setVehicle = (vehicleProfileId: VehicleProfileId) =>
    onChange({
      ...value,
      vehicleProfileId,
      practicalRangeMiles: value.manualPracticalRange
        ? value.practicalRangeMiles
        : practicalRangeForVehicle(vehicleProfileId),
    })

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
      <label className="text-[10.5px] text-dim">
        Vehicle
        <select
          aria-label="Custom route vehicle profile"
          value={value.vehicleProfileId}
          onChange={(event) => setVehicle(event.target.value as VehicleProfileId)}
          className="mt-1 h-9 w-full rounded-[9px] border border-edge bg-panel2 px-2 text-[11.5px] text-ink outline-none"
        >
          {VEHICLE_PROFILES.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.label}
            </option>
          ))}
        </select>
      </label>
      <label className="text-[10.5px] text-dim">
        Pace
        <select
          aria-label="Custom route trip pace"
          value={value.tripPace}
          onChange={(event) =>
            onChange({ ...value, tripPace: event.target.value as TripPace })
          }
          className="mt-1 h-9 w-full rounded-[9px] border border-edge bg-panel2 px-2 text-[11.5px] text-ink outline-none"
        >
          {(Object.entries(TRIP_PACE_LABELS) as Array<[TripPace, string]>).map(
            ([tripPace, label]) => (
              <option key={tripPace} value={tripPace}>
                {label}
              </option>
            ),
          )}
        </select>
      </label>
      <CompactNumberPreference
        label="Comfortable day"
        ariaLabel="Custom route comfortable drive hours"
        value={value.dailyDriveTargetHours}
        min={1}
        max={14}
        step={0.25}
        unit="h"
        onChange={(dailyDriveTargetHours) =>
          onChange({
            ...value,
            dailyDriveTargetHours,
            dailyDriveMaxHours: Math.max(
              dailyDriveTargetHours,
              value.dailyDriveMaxHours,
            ),
          })
        }
      />
      <CompactNumberPreference
        label="Daily maximum"
        ariaLabel="Custom route maximum drive hours"
        value={value.dailyDriveMaxHours}
        min={value.dailyDriveTargetHours}
        max={16}
        step={0.25}
        unit="h"
        onChange={(dailyDriveMaxHours) =>
          onChange({ ...value, dailyDriveMaxHours })
        }
      />
      <div className="text-[10.5px] text-dim">
        Practical range
        <div className="mt-1 flex h-9 items-center gap-1 rounded-[9px] border border-edge bg-panel2 px-2">
          <input
            aria-label="Custom route practical range miles"
            type="number"
            min={80}
            max={350}
            step={5}
            disabled={!value.manualPracticalRange}
            value={value.practicalRangeMiles}
            onChange={(event) =>
              onChange({ ...value, practicalRangeMiles: Number(event.target.value) })
            }
            className="min-w-0 flex-1 bg-transparent text-right font-mono text-[11.5px] text-ink outline-none disabled:opacity-70"
          />
          <span className="font-mono text-[9px] text-faint">mi</span>
        </div>
        <label className="mt-1 flex cursor-pointer items-center gap-1 text-[9.5px] text-faint">
          <input
            type="checkbox"
            checked={value.manualPracticalRange}
            onChange={(event) =>
              onChange({
                ...value,
                manualPracticalRange: event.target.checked,
                practicalRangeMiles: event.target.checked
                  ? value.practicalRangeMiles
                  : practicalRangeForVehicle(value.vehicleProfileId),
              })
            }
            aria-label="Override custom route practical range"
            className="h-3.5 w-3.5 accent-[var(--accent)]"
          />
          Manual override
        </label>
      </div>
    </div>
  )
}

function CompactNumberPreference({
  label,
  ariaLabel,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string
  ariaLabel: string
  value: number
  min: number
  max: number
  step: number
  unit: string
  onChange: (value: number) => void
}) {
  return (
    <label className="text-[10.5px] text-dim">
      {label}
      <div className="mt-1 flex h-9 items-center gap-1 rounded-[9px] border border-edge bg-panel2 px-2">
        <input
          aria-label={ariaLabel}
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="min-w-0 flex-1 bg-transparent text-right font-mono text-[11.5px] text-ink outline-none"
        />
        <span className="font-mono text-[9px] text-faint">{unit}</span>
      </div>
    </label>
  )
}

function PreferenceSummary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[9px] border border-edge bg-panel2 px-2.5 py-2">
      <div className="font-mono text-[8.5px] uppercase tracking-[0.08em] text-faint">
        {label}
      </div>
      <div className="mt-1 text-[12px] font-semibold text-ink">{value}</div>
    </div>
  )
}

function routeTravelPreferencesFrom(
  preferences: CustomRouteModalProps['preferences'],
): RouteTravelPreferences {
  return {
    vehicleProfileId: preferences.vehicleProfileId,
    practicalRangeMiles: preferences.practicalRangeMiles,
    manualPracticalRange: preferences.manualPracticalRange,
    tripPace: preferences.tripPace,
    dailyDriveTargetHours: preferences.dailyDriveTargetHours,
    dailyDriveMaxHours: preferences.dailyDriveMaxHours,
  }
}

function normalizedTravelPreferences(
  preferences: RouteTravelPreferences,
): RouteTravelPreferences {
  return {
    ...preferences,
    practicalRangeMiles: preferences.manualPracticalRange
      ? preferences.practicalRangeMiles
      : practicalRangeForVehicle(preferences.vehicleProfileId),
    dailyDriveMaxHours: Math.max(
      preferences.dailyDriveTargetHours,
      preferences.dailyDriveMaxHours,
    ),
  }
}

function buildCatalog(): CatalogLocation[] {
  const places = PLACE_CATALOG.map((entry) => {
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
      teslaBadge: false,
      routeTarget: true,
    }
  })
  const badges: CatalogLocation[] = TESLA_ICONIC_BADGES.map((badge) => ({
    id: badge.waypointId,
    label: badge.label,
    type: 'landmark',
    state: badge.state,
    position: badge.position,
    radiusMiles: badge.radiusMiles,
    categories: badge.categories,
    rating: badge.rating,
    summary: badge.summary,
    teslaBadge: true,
    routeTarget: badge.routeTarget,
    badgeRegion: badge.region,
    ...(badge.availabilityNote ? { availabilityNote: badge.availabilityNote } : {}),
  }))
  return [...badges, ...places]
    .sort((a, b) => Number(b.teslaBadge) - Number(a.teslaBadge) || b.rating - a.rating || a.label.localeCompare(b.label))
}

function monthForDate(value: string) {
  const month = Number(value.slice(5, 7))
  return month >= 1 && month <= 12 ? month : new Date().getMonth() + 1
}

function routeStartDate(route: SavedCustomRoute | undefined, fallback: string) {
  if (route?.startDate) return route.startDate
  if (!route?.startMonth) return fallback
  const year = /^\d{4}/.test(fallback) ? fallback.slice(0, 4) : String(new Date().getFullYear())
  return `${year}-${String(route.startMonth).padStart(2, '0')}-01`
}

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
