import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CarFront,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  ExternalLink,
  Hotel,
  Image as ImageIcon,
  MapPin,
  PlugZap,
  Search,
  Sparkles,
} from 'lucide-react'
import {
  fetchAdminCommunity,
  fetchAdminHotels,
  type AdminHotelDay,
  type AdminHotelPlan,
  type AdminHotelRecommendation,
} from '../api/siteClient'
import type { SavedCustomRoute } from '../domain/types'
import { formatStationAddress } from '../domain/stationAddress'
import { cx } from '../ui/primitives'

type DistanceFilter = 'any' | '5' | '15'

export function AdminHotelsPage() {
  const [routes, setRoutes] = useState<SavedCustomRoute[]>([])
  const [selectedRouteId, setSelectedRouteId] = useState('')
  const [plan, setPlan] = useState<AdminHotelPlan>()
  const [selectedDay, setSelectedDay] = useState(1)
  const [query, setQuery] = useState('')
  const [onlyEv, setOnlyEv] = useState(false)
  const [onlyHigherEnd, setOnlyHigherEnd] = useState(false)
  const [onlyUnique, setOnlyUnique] = useState(false)
  const [maxDistance, setMaxDistance] = useState<DistanceFilter>('any')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()

  useEffect(() => {
    void fetchAdminCommunity()
      .then((result) => {
        const savedRoutes = result.savedRoutes ?? []
        const preferred =
          savedRoutes.find((route) => route.name === '2026 Competition') ??
          savedRoutes.find(
            (route) => route.id === result.community.trip.selectedRouteId,
          ) ??
          savedRoutes[0]
        setRoutes(savedRoutes)
        setSelectedRouteId(preferred?.id ?? '')
        if (!preferred) setLoading(false)
      })
      .catch((requestError) => {
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Unable to load saved routes.',
        )
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (!selectedRouteId) return
    setLoading(true)
    setError(undefined)
    void fetchAdminHotels(selectedRouteId)
      .then((result) => {
        setPlan(result)
        setSelectedDay((current) =>
          result.days.some((day) => day.day === current)
            ? current
            : result.days[0]?.day ?? 1,
        )
      })
      .catch((requestError) => {
        setPlan(undefined)
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Unable to load hotel recommendations.',
        )
      })
      .finally(() => setLoading(false))
  }, [selectedRouteId])

  const matchingDays = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return plan?.days ?? []
    return (plan?.days ?? []).filter((day) => {
      const haystack = [
        day.day,
        day.date,
        day.station?.name,
        day.station?.address.city,
        day.station?.address.state,
        ...day.recommendations.map((hotel) => hotel.name),
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(normalizedQuery)
    })
  }, [plan?.days, query])

  const day = plan?.days.find((item) => item.day === selectedDay)
  const visibleHotels = useMemo(
    () =>
      (day?.recommendations ?? []).filter((hotel) => {
        if (onlyEv && hotel.evCharging.status !== 'nearby') return false
        if (
          onlyHigherEnd &&
          hotel.tier !== 'luxury' &&
          hotel.tier !== 'upscale'
        ) {
          return false
        }
        if (onlyUnique && !hotel.isUnique) return false
        if (
          maxDistance !== 'any' &&
          hotel.distanceFromSuperchargerMiles > Number(maxDistance)
        ) {
          return false
        }
        return true
      }),
    [day?.recommendations, maxDistance, onlyEv, onlyHigherEnd, onlyUnique],
  )

  const goToDay = (nextDay: number) => {
    if (!plan?.days.some((item) => item.day === nextDay)) return
    setSelectedDay(nextDay)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="mx-auto max-w-[1480px] px-4 py-6 sm:px-7 sm:py-9 lg:px-10">
      <header className="border-b border-edge pb-6">
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-faint no-underline transition hover:text-ink"
        >
          <ArrowLeft size={13} /> Back to admin
        </Link>
        <div className="mt-5 flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
          <div>
            <div className="site-kicker">Anthony admin · hotel command center</div>
            <h1 className="mt-2 text-[34px] font-semibold leading-none tracking-[-0.045em] sm:text-[46px]">
              Hotels for every night
            </h1>
            <p className="mt-3 max-w-[760px] text-[12.5px] leading-[1.65] text-dim">
              Route-aware shortlists for the current Supercharger and tomorrow’s
              direction, with dated Booking.com snapshots, property photos,
              mapped EV charging, and higher-end or distinctive picks first.
            </p>
          </div>
          <label className="site-field-label w-full xl:w-[360px]">
            Saved route
            <select
              className="site-input"
              value={selectedRouteId}
              onChange={(event) => setSelectedRouteId(event.target.value)}
            >
              {routes.map((route) => (
                <option key={route.id} value={route.id}>
                  {route.name} · {route.targetDays ?? '—'} nights
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      {error ? (
        <div className="mt-6 rounded-[12px] border border-warn-bd bg-warn-bg px-4 py-3 text-[12.5px] text-warn">
          {error}
        </div>
      ) : null}

      {loading && !plan ? (
        <div className="admin-surface mt-6 flex min-h-[360px] items-center justify-center p-8 text-[13px] text-faint">
          Building the hotel plan from the saved route…
        </div>
      ) : null}

      {!loading && routes.length === 0 ? (
        <div className="admin-surface mt-6 p-7 text-[13px] leading-[1.6] text-dim">
          Save a route in CORE first. Hotel planning is tied to exact route dates
          and Supercharger stops.
        </div>
      ) : null}

      {plan ? (
        <>
          <HotelStats plan={plan} />

          <div className="mt-5 rounded-[13px] border border-info-bd bg-info-bg px-4 py-3 text-[11.5px] leading-[1.55] text-info">
            Each displayed price is a one-room, one-adult Booking.com snapshot for
            this exact night—not a quote or a range. Taxes and fees may be excluded,
            and rates can change. “EV nearby” means a charger is mapped within 0.3
            miles; confirm overnight access with the hotel before booking.
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start">
            <aside className="admin-surface overflow-hidden lg:sticky lg:top-[96px]">
              <div className="border-b border-edge p-4">
                <label className="relative block">
                  <Search
                    size={14}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
                  />
                  <input
                    className="site-input pl-9"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Day, city, or hotel"
                    aria-label="Search hotel nights"
                  />
                </label>
                <select
                  className="site-input mt-3 lg:hidden"
                  value={selectedDay}
                  onChange={(event) => setSelectedDay(Number(event.target.value))}
                  aria-label="Choose hotel night"
                >
                  {matchingDays.map((item) => (
                    <option key={item.day} value={item.day}>
                      Day {item.day} · {shortDate(item.date)} ·{' '}
                      {item.station?.address.city ?? 'No stop'}
                    </option>
                  ))}
                </select>
              </div>
              <div className="hidden max-h-[calc(100vh-230px)] overflow-y-auto p-2 lg:block">
                {matchingDays.map((item) => (
                  <button
                    key={item.day}
                    type="button"
                    onClick={() => setSelectedDay(item.day)}
                    className={cx(
                      'flex w-full cursor-pointer items-center gap-3 rounded-[11px] border px-3 py-3 text-left transition',
                      item.day === selectedDay
                        ? 'border-accent bg-accent/8'
                        : 'border-transparent hover:border-edge hover:bg-chip',
                    )}
                  >
                    <span
                      className={cx(
                        'flex h-9 w-9 flex-none items-center justify-center rounded-[9px] font-mono text-[10px] font-semibold',
                        item.day === selectedDay
                          ? 'bg-accent text-on-accent'
                          : 'bg-panel2 text-faint',
                      )}
                    >
                      D{item.day}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[11.5px] font-semibold text-ink">
                        {item.station?.address.city ?? 'No station'}
                      </span>
                      <span className="mt-0.5 block font-mono text-[8.5px] text-faint">
                        {shortDate(item.date)} · {item.recommendations.length} picks
                      </span>
                    </span>
                    {item.recommendations.some(
                      (hotel) => hotel.evCharging.status === 'nearby',
                    ) ? (
                      <PlugZap size={12} className="flex-none text-good" />
                    ) : null}
                  </button>
                ))}
                {matchingDays.length === 0 ? (
                  <div className="p-4 text-[11.5px] text-faint">
                    No nights match that search.
                  </div>
                ) : null}
              </div>
            </aside>

            <main className="min-w-0">
              {day ? (
                <>
                  <NightHeader
                    day={day}
                    totalDays={plan.route.totalDays}
                    onPrevious={() => goToDay(day.day - 1)}
                    onNext={() => goToDay(day.day + 1)}
                  />
                  <HotelFilters
                    onlyEv={onlyEv}
                    setOnlyEv={setOnlyEv}
                    onlyHigherEnd={onlyHigherEnd}
                    setOnlyHigherEnd={setOnlyHigherEnd}
                    onlyUnique={onlyUnique}
                    setOnlyUnique={setOnlyUnique}
                    maxDistance={maxDistance}
                    setMaxDistance={setMaxDistance}
                  />

                  {day.researchStatus === 'needs_refresh' ? (
                    <div className="mt-4 rounded-[12px] border border-warn-bd bg-warn-bg p-4 text-[12px] leading-[1.55] text-warn">
                      This stop or date changed after the hotel research snapshot.
                      Refresh the recommendations before relying on this night.
                    </div>
                  ) : null}

                  <div className="mt-4 grid gap-4 xl:grid-cols-2">
                    {visibleHotels.map((hotel, index) => (
                      <HotelCard
                        key={hotel.sourceKey}
                        hotel={hotel}
                        bestRouteFit={index === 0}
                      />
                    ))}
                  </div>
                  {visibleHotels.length === 0 ? (
                    <div className="admin-surface mt-4 p-8 text-center">
                      <div className="text-[14px] font-semibold text-ink">
                        No hotels match every filter
                      </div>
                      <div className="mt-2 text-[12px] text-faint">
                        Remote stops may not have a higher-end or mapped-charging
                        option. Relax one filter to see the researched shortlist.
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setOnlyEv(false)
                          setOnlyHigherEnd(false)
                          setOnlyUnique(false)
                          setMaxDistance('any')
                        }}
                        className="site-secondary-button mt-5"
                      >
                        Clear filters
                      </button>
                    </div>
                  ) : null}
                </>
              ) : null}
            </main>
          </div>

          <footer className="mt-8 border-t border-edge py-5 font-mono text-[8.5px] leading-[1.7] text-faint">
            Route captured {longDateTime(plan.research.capturedAt)} · Hotel and EV
            map research {longDateTime(plan.research.researchedAt)} · Booking.com
            prices checked{' '}
            {plan.research.bookingResearchedAt
              ? longDateTime(plan.research.bookingResearchedAt)
              : 'date unavailable'}{' '}
            · Rates and hotel-owned charger access require verification.
          </footer>
        </>
      ) : null}
    </div>
  )
}

function HotelStats({ plan }: { plan: AdminHotelPlan }) {
  const stats = [
    { label: 'Nights covered', value: `${plan.stats.researchedDays}/${plan.route.totalDays}`, icon: <CalendarDays size={15} /> },
    { label: 'Hotel shortlists', value: plan.stats.totalRecommendations, icon: <Hotel size={15} /> },
    { label: 'Dated prices', value: plan.stats.pricedOptions, icon: <CircleDollarSign size={15} /> },
    { label: 'Property photos', value: plan.stats.withPhotos, icon: <ImageIcon size={15} /> },
    { label: 'Mapped EV nearby', value: plan.stats.nearbyCharging, icon: <PlugZap size={15} /> },
    { label: 'Higher-end picks', value: plan.stats.higherEnd, icon: <Sparkles size={15} /> },
  ]
  return (
    <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
      {stats.map((stat) => (
        <div key={stat.label} className="admin-surface flex items-center gap-3 px-4 py-4">
          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-[10px] bg-good-bg text-good">
            {stat.icon}
          </span>
          <span className="min-w-0">
            <span className="block text-[18px] font-semibold tracking-[-0.03em] text-ink">
              {stat.value}
            </span>
            <span className="block truncate font-mono text-[7.5px] uppercase tracking-[0.08em] text-faint">
              {stat.label}
            </span>
          </span>
        </div>
      ))}
    </div>
  )
}

function NightHeader({
  day,
  totalDays,
  onPrevious,
  onNext,
}: {
  day: AdminHotelDay
  totalDays: number
  onPrevious: () => void
  onNext: () => void
}) {
  return (
    <section className="admin-surface overflow-hidden">
      <div className="flex flex-col justify-between gap-4 border-b border-edge p-5 sm:flex-row sm:items-center sm:p-6">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 flex-none items-center justify-center rounded-[13px] bg-accent text-[12px] font-semibold text-on-accent">
            D{day.day}
          </span>
          <span>
            <span className="font-mono text-[8px] uppercase tracking-[0.1em] text-faint">
              Check in {longDate(day.date)} · Check out {longDate(day.checkOut)}
            </span>
            <h2 className="mt-1.5 text-[24px] font-semibold leading-none tracking-[-0.035em] text-ink sm:text-[30px]">
              {day.station?.address.city ?? 'No destination'},{' '}
              {day.station?.address.state}
            </h2>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPrevious}
            disabled={day.day === 1}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-[10px] border border-edge bg-chip text-dim disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Previous hotel night"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="min-w-[72px] text-center font-mono text-[9px] text-faint">
            {day.day} / {totalDays}
          </span>
          <button
            type="button"
            onClick={onNext}
            disabled={day.day === totalDays}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-[10px] border border-edge bg-chip text-dim disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Next hotel night"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
        <div className="rounded-[11px] border border-edge bg-chip p-3.5">
          <div className="flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.1em] text-faint">
            <MapPin size={12} /> Tonight’s Supercharger
          </div>
          <div className="mt-2 text-[12px] font-semibold text-ink">
            {day.station?.name}
          </div>
          <div className="mt-1 text-[10.5px] leading-[1.45] text-faint">
            {day.station ? formatStationAddress(day.station.address) : '—'}
          </div>
        </div>
        <div className="rounded-[11px] border border-edge bg-chip p-3.5">
          <div className="flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.1em] text-faint">
            <ArrowRight size={12} /> Tomorrow’s direction
          </div>
          <div className="mt-2 text-[12px] font-semibold text-ink">
            {day.nextStation
              ? `${day.nextStation.city}, ${day.nextStation.state}`
              : 'Trip complete'}
          </div>
          <div className="mt-1 text-[10.5px] text-faint">
            {day.nextStation?.name ?? 'Final night in Chattanooga'}
          </div>
        </div>
      </div>
    </section>
  )
}

function HotelFilters({
  onlyEv,
  setOnlyEv,
  onlyHigherEnd,
  setOnlyHigherEnd,
  onlyUnique,
  setOnlyUnique,
  maxDistance,
  setMaxDistance,
}: {
  onlyEv: boolean
  setOnlyEv: (value: boolean) => void
  onlyHigherEnd: boolean
  setOnlyHigherEnd: (value: boolean) => void
  onlyUnique: boolean
  setOnlyUnique: (value: boolean) => void
  maxDistance: DistanceFilter
  setMaxDistance: (value: DistanceFilter) => void
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 rounded-[12px] border border-edge bg-panel px-3 py-3">
      <span className="mr-1 flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.1em] text-faint">
        <CarFront size={12} /> Filters
      </span>
      <FilterToggle active={onlyEv} onClick={() => setOnlyEv(!onlyEv)}>
        <PlugZap size={11} /> EV nearby
      </FilterToggle>
      <FilterToggle
        active={onlyHigherEnd}
        onClick={() => setOnlyHigherEnd(!onlyHigherEnd)}
      >
        <Sparkles size={11} /> Higher end
      </FilterToggle>
      <FilterToggle active={onlyUnique} onClick={() => setOnlyUnique(!onlyUnique)}>
        <Hotel size={11} /> Unique
      </FilterToggle>
      <select
        value={maxDistance}
        onChange={(event) => setMaxDistance(event.target.value as DistanceFilter)}
        className="h-8 rounded-full border border-edge bg-panel2 px-3 font-mono text-[8.5px] text-dim outline-none"
        aria-label="Maximum distance from Supercharger"
      >
        <option value="any">Any distance</option>
        <option value="5">Within 5 miles</option>
        <option value="15">Within 15 miles</option>
      </select>
    </div>
  )
}

function FilterToggle({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        'inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border px-3 font-mono text-[8.5px] transition',
        active
          ? 'border-good-bd bg-good-bg text-good'
          : 'border-edge bg-panel2 text-faint hover:text-ink',
      )}
    >
      {children}
    </button>
  )
}

function HotelCard({
  hotel,
  bestRouteFit,
}: {
  hotel: AdminHotelRecommendation
  bestRouteFit: boolean
}) {
  const rate = hotel.rateSnapshot
  const hasDatedRate = rate.nightlyUsd !== null
  const rateMeta = hasDatedRate
    ? `1 night · checked ${shortDateTime(rate.observedAt)}`
    : rate.availability === 'unavailable'
      ? 'Unavailable on Booking.com'
      : 'No confident Booking.com match'
  return (
    <article className="admin-surface flex min-h-full flex-col overflow-hidden">
      <div className="relative h-[132px] overflow-hidden bg-[linear-gradient(135deg,color-mix(in_srgb,var(--accent-2)_18%,var(--panel-2)),var(--panel-2)_55%,color-mix(in_srgb,var(--accent)_14%,var(--panel-2)))]">
        {hotel.photoUrl ? (
          <img
            src={hotel.photoUrl}
            alt={`${hotel.name} property`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-[54px] font-semibold tracking-[-0.08em] text-ink/12">
              {hotel.name.slice(0, 2).toUpperCase()}
            </span>
          </div>
        )}
        {hotel.photoSource ? (
          <span className="absolute bottom-2 right-2 rounded-full bg-black/55 px-2 py-1 font-mono text-[6.5px] text-white/80 backdrop-blur">
            Photo via {hotel.photoSource}
          </span>
        ) : null}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
          <div className="flex flex-wrap gap-1.5">
            {bestRouteFit ? (
              <HotelBadge tone="good">Best route fit</HotelBadge>
            ) : null}
            <HotelBadge>{hotel.tierLabel}</HotelBadge>
            {hotel.isUnique ? <HotelBadge tone="accent">Unique</HotelBadge> : null}
          </div>
          <a
            href={hotel.mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/55 px-2.5 py-1.5 font-mono text-[7.5px] text-white no-underline backdrop-blur"
          >
            <ImageIcon size={10} /> Photos
          </a>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className="text-[17px] font-semibold leading-[1.15] tracking-[-0.02em] text-ink">
          {hotel.name}
        </h3>
        {hotel.curatorNote ? (
          <div className="mt-2 rounded-[9px] bg-good-bg px-3 py-2 text-[10.5px] leading-[1.45] text-good">
            {hotel.curatorNote}
          </div>
        ) : null}
        {hotel.address ? (
          <div className="mt-2 text-[10px] leading-[1.45] text-faint">
            {hotel.address}
          </div>
        ) : null}

        <div className="mt-4 grid grid-cols-2 gap-2">
          <HotelMetric
            icon={<CircleDollarSign size={13} />}
            label="Booking.com snapshot"
            value={
              rate.nightlyUsd !== null
                ? formatUsd(rate.nightlyUsd)
                : 'No dated rate'
            }
            meta={rateMeta}
          />
          <HotelMetric
            icon={<MapPin size={13} />}
            label="From Supercharger"
            value={`${hotel.distanceFromSuperchargerMiles} mi`}
            meta={`+${hotel.routeDetourMiles} mi route detour`}
          />
        </div>

        <div
          className={cx(
            'mt-2 rounded-[10px] border px-3 py-2.5',
            hotel.evCharging.status === 'nearby'
              ? 'border-good-bd bg-good-bg text-good'
              : 'border-edge bg-chip text-faint',
          )}
        >
          <div className="flex items-center gap-2 text-[10.5px] font-semibold">
            <PlugZap size={13} />
            {hotel.evCharging.status === 'nearby'
              ? `EV charging mapped ${hotel.evCharging.distanceMiles} mi away`
              : 'Hotel charging not verified'}
          </div>
          <div className="mt-1 font-mono text-[7.5px] leading-[1.4] opacity-75">
            {hotel.evCharging.status === 'nearby'
              ? `${hotel.evCharging.label ?? 'Mapped charger'} · verify overnight guest access`
              : 'Ask the property before relying on overnight charging'}
          </div>
        </div>

        <div className="mt-auto grid grid-cols-2 gap-2 pt-4">
          <a
            href={hotel.bookingUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[10px] bg-accent px-3 text-[10.5px] font-semibold text-on-accent no-underline"
          >
            {hasDatedRate ? 'Check current rate' : 'Check availability'}{' '}
            <ExternalLink size={11} />
          </a>
          {hotel.officialUrl ? (
            <a
              href={hotel.officialUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[10px] border border-edge bg-chip px-3 text-[10.5px] font-semibold text-ink no-underline"
            >
              Hotel site <ExternalLink size={11} />
            </a>
          ) : (
            <a
              href={hotel.mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[10px] border border-edge bg-chip px-3 text-[10.5px] font-semibold text-ink no-underline"
            >
              Maps <ExternalLink size={11} />
            </a>
          )}
        </div>
      </div>
    </article>
  )
}

function HotelMetric({
  icon,
  label,
  value,
  meta,
}: {
  icon: React.ReactNode
  label: string
  value: string
  meta: string
}) {
  return (
    <div className="rounded-[10px] border border-edge bg-chip p-3">
      <div className="flex items-center gap-1.5 font-mono text-[7px] uppercase tracking-[0.08em] text-faint">
        {icon} {label}
      </div>
      <div className="mt-1.5 text-[15px] font-semibold text-ink">{value}</div>
      <div className="mt-0.5 font-mono text-[7.5px] text-faint">{meta}</div>
    </div>
  )
}

function HotelBadge({
  tone = 'neutral',
  children,
}: {
  tone?: 'neutral' | 'good' | 'accent'
  children: React.ReactNode
}) {
  return (
    <span
      className={cx(
        'rounded-full border px-2 py-1 font-mono text-[7px] font-semibold uppercase tracking-[0.06em] backdrop-blur',
        tone === 'good'
          ? 'border-good-bd bg-good-bg text-good'
          : tone === 'accent'
            ? 'border-accent/35 bg-accent/15 text-accent'
            : 'border-white/20 bg-black/55 text-white',
      )}
    >
      {children}
    </span>
  )
}

function shortDate(date: string) {
  if (!date) return 'Date changed'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(`${date}T12:00:00`))
}

function longDate(date: string) {
  if (!date) return 'date unavailable'
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date(`${date}T12:00:00`))
}

function formatUsd(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function shortDateTime(value: string | null) {
  if (!value) return 'recently'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(value))
}

function longDateTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}
