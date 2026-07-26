import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'
import {
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  MapPin,
  Navigation,
  Route,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  fetchAnthonyRoute,
  fetchCommunity,
  sendMeetupInvite,
  type AnthonyUpdate,
  type AnthonyUpdatePhase,
  type CommunitySnapshot,
  type PublishedAnthonyRoute,
} from '../api/siteClient'
import { MapView } from '../components/MapView'
import { CHATTANOOGA_37405_START } from '../domain/config'
import type { DayPlan, RoutePlan } from '../domain/types'
import { STATE_CODE_TO_NAME } from '../domain/usStates'
import { useAuth } from './AuthContext'
import { usePageMetadata } from './usePageMetadata'

const STATES = Object.entries(STATE_CODE_TO_NAME).sort((a, b) =>
  a[1].localeCompare(b[1]),
)

const PHASE_LABELS: Record<AnthonyUpdatePhase, string> = {
  planning: 'Planning the quest',
  'route-decision': 'Route decision',
  'build-note': 'Building CORE',
  milestone: 'Milestone',
  'on-the-road': 'On the road',
}

export function TrackAnthonyPage() {
  const { user } = useAuth()
  const [community, setCommunity] = useState<CommunitySnapshot>()
  const [publishedRoute, setPublishedRoute] = useState<PublishedAnthonyRoute | null>()
  const [selectedDayIndex, setSelectedDayIndex] = useState(0)
  const [error, setError] = useState<string>()
  const [routeError, setRouteError] = useState<string>()
  const [notice, setNotice] = useState<string>()
  const [invite, setInvite] = useState({
    stateCode: 'CO',
    city: '',
    proposedDay: '',
    message: '',
  })

  usePageMetadata({
    title: 'Track Anthony’s ChargeQuest | Full Route and Trip Journal',
    description: 'Explore Anthony’s complete ChargeQuest route day by day, follow every planned location and landmark on the map, and open the field notes, blogs, and videos attached to each stop.',
    path: '/track-anthony',
  })

  useEffect(() => {
    void fetchCommunity().then(setCommunity).catch((requestError) => {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to load Anthony’s timeline.',
      )
    })
    void fetchAnthonyRoute()
      .then((result) => setPublishedRoute(result.route))
      .catch((requestError) => {
        setPublishedRoute(null)
        setRouteError(
          requestError instanceof Error
            ? requestError.message
            : 'Unable to load the published route.',
        )
      })
  }, [])

  const trip = community?.trip
  const updates = community?.updates ?? []
  const routePlan = publishedRoute?.route
  const progress = useMemo(() => {
    const totalDays = routePlan?.totalDays ?? trip?.totalDays
    if (!trip?.active || !trip.dayNumber || !totalDays) return 0
    return Math.max(0, Math.min(100, (trip.dayNumber / totalDays) * 100))
  }, [routePlan?.totalDays, trip])

  useEffect(() => {
    if (!trip?.active || !trip.dayNumber || !routePlan?.days.length) return
    const currentDayIndex = routePlan.days.findIndex(
      (day) => day.day === trip.dayNumber,
    )
    if (currentDayIndex >= 0) setSelectedDayIndex(currentDayIndex)
  }, [routePlan, trip?.active, trip?.dayNumber])

  const submitInvite = async (event: FormEvent) => {
    event.preventDefault()
    try {
      const result = await sendMeetupInvite({
        stateCode: invite.stateCode,
        city: invite.city,
        proposedDay: invite.proposedDay ? Number(invite.proposedDay) : undefined,
        message: invite.message,
      })
      setInvite({ stateCode: 'CO', city: '', proposedDay: '', message: '' })
      setNotice(result.message)
      setError(undefined)
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to send invite.',
      )
    }
  }

  if (!community && !error) {
    return (
      <div className="min-h-[65vh] bg-black px-5 py-20 text-white/40">
        Loading Anthony’s quest…
      </div>
    )
  }

  const publishedName =
    publishedRoute?.savedRoute.name ?? trip?.routeName ?? 'Route still being decided'
  const publishedDays = routePlan?.totalDays ?? trip?.totalDays
  const departureDate =
    publishedRoute?.savedRoute.startDate ??
    routePlan?.tripStartDate ??
    trip?.departureDate

  return (
    <div className="bg-[#f1eee6] text-[#0a0b0d]">
      <section className="relative overflow-hidden bg-black px-4 py-16 text-white sm:px-6 sm:py-24 lg:px-12 lg:py-32">
        <div className="pointer-events-none absolute -right-40 -top-52 h-[680px] w-[680px] rounded-full bg-[#e82127]/18 blur-[150px]" />
        <div className="relative mx-auto max-w-[1240px]">
          {error ? (
            <div className="mb-6 rounded-[10px] bg-[#e82127] px-4 py-3 text-[13px] text-white">
              {error}
            </div>
          ) : null}
          {notice ? (
            <div className="mb-6 rounded-[10px] bg-[#23d7d1] px-4 py-3 text-[13px] font-semibold text-black">
              {notice}
            </div>
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.15em] text-[#23d7d1]">
              <span
                className={`h-2 w-2 rounded-full ${
                  trip?.active
                    ? 'animate-pulse bg-[#23d7d1]'
                    : publishedRoute
                      ? 'bg-[#e82127]'
                      : 'bg-white/30'
                }`}
              />
              {trip?.active
                ? 'The quest is live'
                : publishedRoute
                  ? 'The complete trip plan'
                  : 'The road to ChargeQuest'}
            </div>
            {trip?.updatedAt ? (
              <div className="font-mono text-[8px] uppercase tracking-[0.1em] text-white/32">
                Latest activity {formatTimestamp(trip.updatedAt)}
              </div>
            ) : null}
          </div>

          <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_340px] lg:items-end">
            <div>
              <h1 className="max-w-[900px] text-[clamp(48px,10vw,112px)] font-semibold leading-[0.86] tracking-[-0.068em]">
                {trip?.active
                  ? trip.headline || publishedName
                  : publishedRoute
                    ? `${publishedName}, day by day`
                    : 'I’m building the route in public'}
              </h1>
              <p className="mt-8 max-w-[740px] text-[17px] leading-[1.75] text-white/62">
                {trip?.active
                  ? trip.body ||
                    'I’m on the road. Open any trip day to see the plan and the latest field notes.'
                  : publishedRoute
                    ? `This is the trip I plan to drive—${publishedDays ?? routePlan?.days.length} days mapped from departure through the return home. Open any day to see where I’ll be, what I’m visiting, and anything I publish from that part of the route.`
                    : 'This is the chronological record—from building CORE and comparing route ideas to making the final cuts and, eventually, testing the plan on the road.'}
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                {publishedRoute ? (
                  <a
                    href="#full-route"
                    className="flex min-h-12 items-center justify-center rounded-full bg-[#e82127] px-6 py-3.5 text-[13px] font-semibold text-white no-underline"
                  >
                    Explore the full route
                  </a>
                ) : null}
                <a
                  href="#journey-log"
                  className="flex min-h-12 items-center justify-center rounded-full border border-white/35 px-6 py-3.5 text-[13px] font-semibold text-white no-underline hover:border-white"
                >
                  Read the trip journal
                </a>
              </div>
            </div>

            <div className="border-y border-white/15">
              <HeroFact
                icon={<Route size={15} />}
                label="Published route"
                value={publishedName}
              />
              <HeroFact
                icon={<CalendarDays size={15} />}
                label={trip?.active ? 'Trip progress' : 'Departure'}
                value={
                  trip?.active
                    ? `Day ${trip.dayNumber ?? '—'} of ${publishedDays ?? '—'}`
                    : formatDeparture(departureDate)
                }
              />
              <HeroFact
                icon={<MapPin size={15} />}
                label={trip?.active ? 'Current area' : 'Trip length'}
                value={
                  trip?.active
                    ? trip.currentLocation || 'En route'
                    : publishedDays
                      ? `${publishedDays} planned days`
                      : updates[0]
                        ? PHASE_LABELS[updates[0].phase]
                        : 'Planning'
                }
              />
              {trip?.active ? (
                <div className="py-5">
                  <div className="mb-2 flex justify-between font-mono text-[7.5px] uppercase tracking-[0.09em] text-white/35">
                    <span>Quest progress</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/12">
                    <div
                      className="h-full bg-[#e82127]"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {publishedRoute ? (
        <CompleteRoute
          publication={publishedRoute}
          updates={updates}
          selectedDayIndex={selectedDayIndex}
          onSelectDay={setSelectedDayIndex}
        />
      ) : routeError ? (
        <section className="bg-[#0a0b0d] px-4 py-14 text-white sm:px-6">
          <div className="mx-auto max-w-[1240px] border border-white/15 p-6 text-[13px] text-white/58">
            The trip profile is available, but the complete saved route could not be
            drawn right now: {routeError}
          </div>
        </section>
      ) : null}

      <section
        id="journey-log"
        className="mx-auto grid max-w-[1240px] gap-12 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-[minmax(0,1fr)_330px] lg:px-8 lg:py-36"
      >
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-black/42">
            Trip journal
          </div>
          <h2 className="mt-4 max-w-[760px] text-[clamp(40px,7vw,74px)] font-semibold leading-[0.92] tracking-[-0.058em]">
            The story behind the route
          </h2>
          <p className="mt-6 max-w-[700px] text-[15px] leading-[1.75] text-black/55">
            Route decisions, planning notes, blogs, videos, milestones, and live road
            updates stay together here. Entries assigned to a trip day also appear
            inside that day in the route explorer above.
          </p>

          <div className="relative mt-12 border-t border-black/15">
            {updates.map((update, index) => (
              <TimelineEntry key={update.id} update={update} index={index} />
            ))}
            {updates.length === 0 ? (
              <div className="border-b border-black/15 py-12">
                <div className="font-mono text-[8px] uppercase tracking-[0.12em] text-[#e82127]">
                  The first entry is coming
                </div>
                <p className="mt-4 max-w-[620px] text-[14px] leading-[1.7] text-black/55">
                  The route is public now. Blogs, videos, and field notes will appear
                  here and on the day where they happened.
                </p>
              </div>
            ) : null}
          </div>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-28 lg:h-fit">
          <div className="bg-black p-6 text-white">
            <div className="font-mono text-[8px] uppercase tracking-[0.13em] text-[#23d7d1]">
              How to follow
            </div>
            <ol className="mt-5 space-y-5">
              <AsideStep number="01" title="Pick a day">
                See the date, overnight area, mileage, landmarks, and charging plan.
              </AsideStep>
              <AsideStep number="02" title="Read what happened">
                Day-linked blogs, vlogs, and field notes open with that location.
              </AsideStep>
              <AsideStep number="03" title="Check back on the road">
                The current day and live location move as the trip unfolds.
              </AsideStep>
            </ol>
          </div>

          <div className="border border-black/14 bg-white/45 p-6">
            <div className="font-mono text-[8px] uppercase tracking-[0.13em] text-black/38">
              You can influence the route
            </div>
            <h3 className="mt-3 text-[25px] font-semibold tracking-[-0.04em]">
              See a route problem I missed?
            </h3>
            <p className="mt-4 text-[13px] leading-[1.65] text-black/55">
              Suggestions go to me privately. Nothing is posted automatically.
            </p>
            <Link
              to="/community"
              className="mt-6 flex min-h-11 items-center justify-between rounded-full bg-[#e82127] px-5 py-3 text-[12px] font-semibold text-white no-underline"
            >
              Send the idea <ArrowUpRight size={15} />
            </Link>
          </div>
        </aside>
      </section>

      {trip?.active ? (
        <section className="bg-[#090a0c] px-4 py-20 text-white sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto grid max-w-[1120px] gap-10 lg:grid-cols-[.8fr_1.2fr]">
            <div>
              <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#23d7d1]">
                Meet along the route
              </div>
              <h2 className="mt-4 text-[clamp(38px,7vw,68px)] font-semibold leading-[.93] tracking-[-0.055em]">
                Coffee when our routes cross?
              </h2>
              <p className="mt-6 text-[14px] leading-[1.7] text-white/52">
                Invites stay private until I approve them. Public entries show only
                what the sender intended to share.
              </p>
            </div>
            {user ? (
              <form
                className="grid gap-4 border border-white/15 bg-white/[.04] p-5 sm:grid-cols-2 sm:p-7"
                onSubmit={submitInvite}
              >
                <label className="site-field-label text-white/42">
                  State
                  <select
                    className="site-input"
                    value={invite.stateCode}
                    onChange={(event) =>
                      setInvite((current) => ({
                        ...current,
                        stateCode: event.target.value,
                      }))
                    }
                  >
                    {STATES.map(([code, name]) => (
                      <option key={code} value={code}>
                        {name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="site-field-label text-white/42">
                  City
                  <input
                    required
                    minLength={2}
                    maxLength={80}
                    className="site-input"
                    value={invite.city}
                    onChange={(event) =>
                      setInvite((current) => ({ ...current, city: event.target.value }))
                    }
                  />
                </label>
                <label className="site-field-label text-white/42 sm:col-span-2">
                  Possible trip day
                  <input
                    type="number"
                    min={1}
                    max={365}
                    className="site-input"
                    value={invite.proposedDay}
                    onChange={(event) =>
                      setInvite((current) => ({
                        ...current,
                        proposedDay: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="site-field-label text-white/42 sm:col-span-2">
                  Message
                  <textarea
                    required
                    minLength={10}
                    maxLength={600}
                    rows={4}
                    className="site-input resize-y"
                    value={invite.message}
                    onChange={(event) =>
                      setInvite((current) => ({
                        ...current,
                        message: event.target.value,
                      }))
                    }
                  />
                </label>
                <button type="submit" className="site-primary-button sm:col-span-2">
                  Send invite to Anthony
                </button>
              </form>
            ) : (
              <div className="border border-white/15 p-7 text-[14px] text-white/55">
                <Link to="/login" className="font-semibold text-white">
                  Sign in
                </Link>{' '}
                to send a meetup invite.
              </div>
            )}
          </div>
        </section>
      ) : null}
    </div>
  )
}

function CompleteRoute({
  publication,
  updates,
  selectedDayIndex,
  onSelectDay,
}: {
  publication: PublishedAnthonyRoute
  updates: AnthonyUpdate[]
  selectedDayIndex: number
  onSelectDay: (index: number) => void
}) {
  const route = publication.route
  const selectedDay = route.days[selectedDayIndex] ?? route.days[0]
  const selectedUpdates = updates.filter(
    (update) => update.day_number === selectedDay?.day,
  )
  const routeStations = useMemo(
    () => route.visits.map((visit) => visit.station),
    [route.visits],
  )

  return (
    <section
      id="full-route"
      className="bg-[#0a0b0d] px-4 py-20 text-white sm:px-6 sm:py-28 lg:px-8"
    >
      <div className="mx-auto max-w-[1320px]">
        <div className="grid gap-8 border-b border-white/14 pb-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#23d7d1]">
              The complete route
            </div>
            <h2 className="mt-4 max-w-[850px] text-[clamp(42px,7vw,78px)] font-semibold leading-[0.9] tracking-[-0.06em]">
              Every day. Every stop. One mapped trip.
            </h2>
            <p className="mt-6 max-w-[720px] text-[14px] leading-[1.75] text-white/52">
              Select a day or its overnight location to highlight that leg on the
              map. Landmarks and day-specific writing open inside the itinerary.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-px overflow-hidden border border-white/14 bg-white/14 sm:grid-cols-4 lg:w-[520px]">
            <RouteStat label="Days" value={route.totalDays.toLocaleString()} />
            <RouteStat label="Miles" value={Math.round(route.totalMiles).toLocaleString()} />
            <RouteStat label="Stops" value={route.uniqueStations.toLocaleString()} />
            <RouteStat
              label="Landmarks"
              value={countRouteLandmarks(route).toLocaleString()}
            />
          </div>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(390px,.8fr)]">
          <div className="xl:sticky xl:top-24 xl:h-fit">
            <div className="relative h-[460px] overflow-hidden border border-white/14 bg-[#15171b] sm:h-[590px]">
              <MapView
                stations={routeStations}
                route={route}
                start={CHATTANOOGA_37405_START}
                showAllStations={false}
                highlightedDayIndex={selectedDayIndex}
                fitPadding={{
                  topLeft: [48, 48],
                  bottomRight: [48, 48],
                }}
              />
              <div className="pointer-events-none absolute left-4 top-4 z-[500] max-w-[calc(100%-2rem)] bg-black/88 px-4 py-3 backdrop-blur">
                <div className="font-mono text-[8px] uppercase tracking-[0.12em] text-[#23d7d1]">
                  Day {selectedDay?.day ?? '—'} highlighted
                </div>
                <div className="mt-1 text-[13px] font-semibold">
                  {selectedDay ? dayLocation(selectedDay) : publication.savedRoute.name}
                </div>
              </div>
            </div>

            {selectedDay ? (
              <div className="border-x border-b border-white/14 bg-white/[.035] p-5 sm:p-7">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <div className="font-mono text-[8px] uppercase tracking-[0.12em] text-[#e82127]">
                      {formatTripDay(route.tripStartDate, selectedDay.day)}
                    </div>
                    <h3 className="mt-2 text-[clamp(27px,5vw,40px)] font-semibold tracking-[-0.045em]">
                      Day {selectedDay.day}: {dayLocation(selectedDay)}
                    </h3>
                  </div>
                  <div className="flex gap-4 font-mono text-[8px] uppercase tracking-[0.08em] text-white/42">
                    <span>{Math.round(selectedDay.miles)} mi</span>
                    <span>{selectedDay.driveHours.toFixed(1)} hr</span>
                    <span>{selectedDay.uniqueStations} stops</span>
                  </div>
                </div>
                <DayDetails day={selectedDay} updates={selectedUpdates} />
              </div>
            ) : null}
          </div>

          <div
            className="border-t border-white/14 xl:max-h-[820px] xl:overflow-y-auto xl:pr-2"
            aria-label="Full day-by-day itinerary"
          >
            {route.days.map((day, index) => (
              <DayRouteCard
                key={day.day}
                day={day}
                startDate={route.tripStartDate}
                selected={index === selectedDayIndex}
                updateCount={
                  updates.filter((update) => update.day_number === day.day).length
                }
                onSelect={() => onSelectDay(index)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function DayRouteCard({
  day,
  startDate,
  selected,
  updateCount,
  onSelect,
}: {
  day: DayPlan
  startDate?: string
  selected: boolean
  updateCount: number
  onSelect: () => void
}) {
  const landmarks = landmarksForDay(day)
  const location = dayLocation(day)
  return (
    <button
      type="button"
      aria-label={`Open day ${day.day}, ${location}`}
      aria-pressed={selected}
      onClick={onSelect}
      className={`grid w-full gap-4 border-b border-white/14 px-1 py-5 text-left text-white transition sm:grid-cols-[72px_minmax(0,1fr)_auto] sm:items-start sm:py-6 ${
        selected ? 'bg-white/[.07] sm:px-4' : 'hover:bg-white/[.035] sm:px-4'
      }`}
    >
      <div>
        <div className="font-mono text-[8px] uppercase tracking-[0.1em] text-[#23d7d1]">
          Day
        </div>
        <div className="mt-1 text-[27px] font-semibold tracking-[-0.05em]">
          {String(day.day).padStart(2, '0')}
        </div>
      </div>
      <div>
        <div className="font-mono text-[8px] uppercase tracking-[0.1em] text-white/34">
          {formatTripDay(startDate, day.day)}
        </div>
        <div className="mt-2 flex items-center gap-2 text-[16px] font-semibold">
          <MapPin size={14} className="shrink-0 text-[#e82127]" />
          {location}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {landmarks.slice(0, 3).map((landmark) => (
            <span
              key={landmark}
              className="border border-white/12 px-2.5 py-1 font-mono text-[7px] uppercase tracking-[0.07em] text-white/47"
            >
              {landmark}
            </span>
          ))}
          {landmarks.length > 3 ? (
            <span className="px-1 py-1 font-mono text-[7px] uppercase text-white/28">
              +{landmarks.length - 3} more
            </span>
          ) : null}
          {landmarks.length === 0 ? (
            <span className="font-mono text-[7px] uppercase text-white/24">
              Travel and charging day
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-2">
        <div className="font-mono text-[8px] uppercase tracking-[0.08em] text-white/38">
          {Math.round(day.miles)} mi · {day.driveHours.toFixed(1)} hr
        </div>
        {updateCount ? (
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#e82127] px-2.5 py-1 font-mono text-[7px] uppercase tracking-[0.08em] text-white">
            <BookOpen size={10} /> {updateCount} {updateCount === 1 ? 'entry' : 'entries'}
          </div>
        ) : (
          <div className="font-mono text-[7px] uppercase tracking-[0.08em] text-white/22">
            No journal yet
          </div>
        )}
      </div>
    </button>
  )
}

function DayDetails({
  day,
  updates,
}: {
  day: DayPlan
  updates: AnthonyUpdate[]
}) {
  const landmarks = landmarksForDay(day)
  return (
    <div className="mt-6 grid gap-6 border-t border-white/12 pt-6 lg:grid-cols-2">
      <div>
        <div className="font-mono text-[8px] uppercase tracking-[0.1em] text-white/30">
          Planned highlights
        </div>
        {landmarks.length ? (
          <ul className="mt-4 space-y-2">
            {landmarks.map((landmark) => (
              <li
                key={landmark}
                className="flex items-start gap-2 text-[12px] leading-[1.55] text-white/62"
              >
                <Navigation size={12} className="mt-1 shrink-0 text-[#23d7d1]" />
                {landmark}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-[12px] leading-[1.6] text-white/38">
            This leg is focused on driving and unique Supercharger stops.
          </p>
        )}
        {day.stay ? (
          <div className="mt-4 border-l-2 border-[#e82127] pl-3 text-[11px] leading-[1.55] text-white/45">
            Overnight {day.stay.night} of {day.stay.totalNights} near {day.stay.label}
          </div>
        ) : null}
      </div>
      <div>
        <div className="font-mono text-[8px] uppercase tracking-[0.1em] text-white/30">
          Blogs, vlogs, and field notes
        </div>
        {updates.length ? (
          <div className="mt-4 space-y-3">
            {updates.map((update) => (
              <article key={update.id} className="border border-white/12 p-4">
                <div className="font-mono text-[7px] uppercase tracking-[0.08em] text-[#23d7d1]">
                  {PHASE_LABELS[update.phase]}
                </div>
                <h4 className="mt-2 text-[15px] font-semibold">{update.title}</h4>
                <p className="mt-2 line-clamp-3 text-[11.5px] leading-[1.6] text-white/48">
                  {update.body}
                </p>
                <a
                  href={`#journal-${update.id}`}
                  className="mt-3 inline-flex items-center gap-1 text-[10px] font-semibold text-white"
                >
                  Read the full entry <ArrowUpRight size={11} />
                </a>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-[12px] leading-[1.6] text-white/38">
            Nothing has been published from this day yet. The route details are
            here now; writing and video will attach to this location as the trip
            unfolds.
          </p>
        )}
      </div>
    </div>
  )
}

function TimelineEntry({ update, index }: { update: AnthonyUpdate; index: number }) {
  const showLocation = update.location && update.location !== 'Pre-trip'
  return (
    <article
      id={`journal-${update.id}`}
      className="grid scroll-mt-24 gap-4 border-b border-black/15 py-8 sm:grid-cols-[54px_minmax(0,1fr)] sm:py-10"
    >
      <div className="font-mono text-[9px] text-black/28">
        {String(index + 1).padStart(2, '0')}
      </div>
      <div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-[8px] uppercase tracking-[0.1em]">
          <span className="text-[#e82127]">{PHASE_LABELS[update.phase]}</span>
          <span className="text-black/25">{formatTimestamp(update.created_at)}</span>
          {update.day_number ? (
            <span className="text-black/35">Day {update.day_number}</span>
          ) : null}
          {showLocation ? <span className="text-black/35">{update.location}</span> : null}
        </div>
        <h3 className="mt-3 text-[clamp(25px,4vw,36px)] font-semibold leading-[1.02] tracking-[-0.045em]">
          {update.title}
        </h3>
        <p className="mt-5 whitespace-pre-line text-[14.5px] leading-[1.75] text-black/60">
          {update.body}
        </p>
        {update.visiting ? (
          <div className="mt-5 border-l-2 border-[#e82127] pl-4 text-[12px] leading-[1.6] text-black/52">
            On the list: {update.visiting}
          </div>
        ) : null}
        {update.artifact_url ? (
          <a
            href={update.artifact_url}
            target="_blank"
            rel="noreferrer"
            className="mt-6 flex min-h-12 items-center justify-between border border-black/15 bg-white/50 px-4 py-3 text-[12px] font-semibold text-black no-underline hover:border-black/35"
          >
            <span>
              <span className="mr-2 font-mono text-[7px] uppercase text-[#e82127]">
                {update.artifact_type ?? 'link'}
              </span>
              {update.artifact_label || 'Open the attached artifact'}
            </span>
            <ArrowUpRight size={15} aria-hidden="true" />
          </a>
        ) : null}
      </div>
    </article>
  )
}

function RouteStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#0a0b0d] px-4 py-4 text-center">
      <div className="text-[21px] font-semibold tracking-[-0.04em]">{value}</div>
      <div className="mt-1 font-mono text-[7px] uppercase tracking-[0.1em] text-white/30">
        {label}
      </div>
    </div>
  )
}

function HeroFact({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="grid grid-cols-[22px_110px_minmax(0,1fr)] items-center gap-2 border-b border-white/15 py-5 last:border-b-0">
      <span className="text-[#23d7d1]">{icon}</span>
      <span className="font-mono text-[7.5px] uppercase tracking-[0.09em] text-white/35">
        {label}
      </span>
      <span className="text-right text-[12.5px] font-semibold">{value}</span>
    </div>
  )
}

function AsideStep({
  number,
  title,
  children,
}: {
  number: string
  title: string
  children: ReactNode
}) {
  return (
    <li className="grid list-none grid-cols-[26px_1fr] gap-3">
      <span className="font-mono text-[8px] text-[#e82127]">{number}</span>
      <div>
        <div className="text-[13px] font-semibold">{title}</div>
        <p className="mt-1 text-[11.5px] leading-[1.55] text-white/42">{children}</p>
      </div>
    </li>
  )
}

function dayLocation(day: DayPlan) {
  if (day.stay?.label) return day.stay.label
  const finalStop = day.visits.at(-1)?.station
  if (!finalStop) return 'Route day'
  return `${finalStop.address.city}, ${finalStop.address.state}`
}

function landmarksForDay(day: DayPlan) {
  return Array.from(
    new Set(
      day.rating.places
        .filter((place) => place.type === 'landmark')
        .map((place) => place.label),
    ),
  )
}

function countRouteLandmarks(route: RoutePlan) {
  return new Set(route.days.flatMap((day) => landmarksForDay(day))).size
}

function formatTripDay(startDate: string | undefined, day: number) {
  if (!startDate) return `Trip day ${day}`
  const date = new Date(`${startDate}T12:00:00`)
  date.setDate(date.getDate() + day - 1)
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

function formatDeparture(value?: string | null) {
  if (!value) return 'Not announced yet'
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${value}T12:00:00`))
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}
