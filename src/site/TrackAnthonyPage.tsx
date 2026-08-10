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
  type AnthonyTrip,
  type CommunitySnapshot,
  type PublishedAnthonyRoute,
} from '../api/siteClient'
import { MapView } from '../components/MapView'
import {
  PUBLISHED_ANTHONY_FIELD_NOTES,
  type AnthonyFieldNote,
  type AnthonyFieldNoteInline,
} from '../content/anthonyFieldNotes'
import { CHATTANOOGA_37405_START } from '../domain/config'
import type { DayPlan, RoutePlan } from '../domain/types'
import { STATE_CODE_TO_NAME } from '../domain/usStates'
import { useAuth } from './AuthContext'
import { usePageMetadata } from './usePageMetadata'
import { buildCustomPublicStructuredData, getCustomPublicPage } from '../seo/siteArchitecture'

const TRACK_METADATA = getCustomPublicPage('/track-anthony')!
const TRACK_STRUCTURED_DATA = buildCustomPublicStructuredData(TRACK_METADATA)

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

type PublicTripPhase = 'pre_trip' | 'live' | 'completed'

const DAY_IN_MS = 24 * 60 * 60 * 1000

function getPublicTripPhase(
  startDate: string | null | undefined,
  totalDays: number | null | undefined,
  now = new Date(),
): PublicTripPhase {
  const start = dateOnlyValue(startDate)
  if (start == null || !totalDays || totalDays < 1) return 'pre_trip'

  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  if (today < start) return 'pre_trip'
  if (today >= start + totalDays * DAY_IN_MS) return 'completed'
  return 'live'
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
    ...TRACK_METADATA,
    structuredData: TRACK_STRUCTURED_DATA,
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
  const journalEntries = [
    ...PUBLISHED_ANTHONY_FIELD_NOTES.map((note) => ({
      kind: 'field-note' as const,
      date: note.publishedAt,
      note,
    })),
    ...updates.map((update) => ({
      kind: 'update' as const,
      date: update.created_at,
      update,
    })),
  ].sort((left, right) => right.date.localeCompare(left.date))
  const routePlan = publishedRoute?.route
  const publishedDays = routePlan?.totalDays ?? trip?.totalDays
  const departureDate =
    publishedRoute?.savedRoute.startDate ??
    routePlan?.tripStartDate ??
    trip?.departureDate
  const tripPhase = getPublicTripPhase(departureDate, publishedDays)
  const isLiveTrip = Boolean(
    trip?.active && publishedRoute && routePlan && tripPhase === 'live',
  )
  const activeDayNumber = useMemo(() => {
    if (!isLiveTrip || !publishedDays) return undefined
    if (
      trip?.dayNumber &&
      trip.dayNumber >= 1 &&
      trip.dayNumber <= publishedDays
    ) {
      return trip.dayNumber
    }
    return routeDayNumberForDate(departureDate, publishedDays)
  }, [departureDate, isLiveTrip, publishedDays, trip?.dayNumber])
  const progress = useMemo(() => {
    if (!isLiveTrip || !activeDayNumber || !publishedDays) return 0
    return Math.max(0, Math.min(100, (activeDayNumber / publishedDays) * 100))
  }, [activeDayNumber, isLiveTrip, publishedDays])

  useEffect(() => {
    if (!isLiveTrip || !activeDayNumber || !routePlan?.days.length) return
    const currentDayIndex = routePlan.days.findIndex(
      (day) => day.day === activeDayNumber,
    )
    if (currentDayIndex >= 0) setSelectedDayIndex(currentDayIndex)
  }, [activeDayNumber, isLiveTrip, routePlan])

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
      <div className="min-h-[calc(100svh-117px)] bg-black px-5 py-20 text-white/60 sm:min-h-[calc(100vh-78px)]">
        Loading Anthony’s quest…
      </div>
    )
  }

  const publishedName =
    publishedRoute?.savedRoute.name ?? trip?.routeName ?? 'Route still being decided'

  return (
    <div className="bg-[#f1eee6] text-[#0a0b0d]">
      {isLiveTrip && trip && publishedRoute && routePlan ? (
        <LiveRouteHero
          publication={publishedRoute}
          trip={trip}
          activeDayNumber={activeDayNumber}
          selectedDayIndex={selectedDayIndex}
          progress={progress}
          error={error}
          notice={notice}
        />
      ) : (
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
                  publishedRoute
                    ? tripPhase === 'completed'
                      ? 'bg-white/55'
                      : 'bg-[#e82127]'
                    : 'bg-white/30'
                }`}
              />
              {publishedRoute
                ? tripPhase === 'completed'
                  ? '2026 competition route · planned itinerary archive'
                  : '2026 competition route · pre-trip plan'
                : 'Planning my 2026 competition route'}
            </div>
            {trip?.updatedAt ? (
              <div className="font-mono text-[8px] uppercase tracking-[0.1em] text-white/55">
                Latest activity {formatTimestamp(trip.updatedAt)}
              </div>
            ) : null}
          </div>

          <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_340px] lg:items-end">
            <div>
              <h1 className="max-w-[900px] text-[clamp(48px,10vw,112px)] font-semibold leading-[0.86] tracking-[-0.068em]">
                {publishedRoute
                  ? tripPhase === 'completed'
                    ? 'My planned 2026 Tesla Supercharging Competition route, preserved day by day'
                    : 'My 2026 Tesla Supercharging Competition route, day by day'
                  : 'I’m building my 2026 Tesla Supercharging Competition route in public'}
              </h1>
              <p className="mt-8 max-w-[740px] text-[17px] leading-[1.75] text-white/62">
                {publishedRoute
                  ? tripPhase === 'completed'
                    ? `This preserves the ${publishedDays ?? routePlan?.days.length}-day competition itinerary I published: the planned Supercharger sequence, route map, overnight areas, landmarks, and the dated notes attached to each day. Planned details remain labeled as a plan unless a field note records what was actually observed.`
                    : `This is the ${publishedDays ?? routePlan?.days.length}-day competition route I currently plan to drive, mapped from departure through the return home. Open any day to inspect the planned Supercharger sequence, mileage, overnight area, landmarks, and the route decisions I publish before the trip.`
                  : 'This is the chronological planning record—from comparing CORE route candidates and testing assumptions to making the final cuts. I publish real decisions and evidence without pretending the trip has started.'}
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
                label={tripPhase === 'completed' ? 'Published itinerary' : 'Planned departure'}
                value={tripPhase === 'completed'
                  ? `${publishedDays ?? '—'} planned days`
                  : formatDeparture(departureDate)}
              />
              <HeroFact
                icon={<MapPin size={15} />}
                label={publishedRoute ? 'Route status' : 'Planning stage'}
                value={publishedRoute
                  ? tripPhase === 'completed'
                    ? 'Planned itinerary archive'
                    : `${publishedDays ?? '—'} days · not yet live`
                  : updates[0]
                    ? PHASE_LABELS[updates[0].phase]
                    : 'Planning'}
              />
            </div>
          </div>
        </div>
        </section>
      )}

      {publishedRoute ? (
        <CompleteRoute
          publication={publishedRoute}
          updates={updates}
          selectedDayIndex={selectedDayIndex}
          onSelectDay={setSelectedDayIndex}
          mapInHero={isLiveTrip}
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
          <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-black/65">
            Trip journal
          </div>
          <h2 className="mt-4 max-w-[760px] text-[clamp(40px,7vw,74px)] font-semibold leading-[0.92] tracking-[-0.058em]">
            The story behind the route
          </h2>
          <p className="mt-6 max-w-[700px] text-[15px] leading-[1.75] text-black/65">
            Route decisions, planning notes, blogs, videos, milestones, and live road
            updates stay together here. Entries assigned to a trip day also appear
            inside that day in the route explorer above.
          </p>

          <div className="relative mt-12 border-t border-black/15">
            {journalEntries.map((entry, index) => entry.kind === 'field-note' ? (
              <PublishedFieldNoteEntry
                key={`field-note-${entry.note.id}`}
                note={entry.note}
                index={index}
              />
            ) : (
              <TimelineEntry
                key={entry.update.id}
                update={entry.update}
                index={index}
              />
            ))}
            {journalEntries.length === 0 ? (
              <div className="border-b border-black/15 py-12">
                <div className="font-mono text-[8px] uppercase tracking-[0.12em] text-[#c9161d]">
                  The first entry is coming
                </div>
                <p className="mt-4 max-w-[620px] text-[14px] leading-[1.7] text-black/65">
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
              <AsideStep number="02" title="Read the evidence">
                Day-linked planning notes, blogs, vlogs, and field evidence open with that location.
              </AsideStep>
              <AsideStep number="03" title="Check back on the road">
                The current day and live location move as the trip unfolds.
              </AsideStep>
            </ol>
          </div>

          <div className="border border-black/14 bg-white/45 p-6">
            <div className="font-mono text-[8px] uppercase tracking-[0.13em] text-black/65">
              You can influence the route
            </div>
            <h3 className="mt-3 text-[25px] font-semibold tracking-[-0.04em]">
              See a route problem I missed?
            </h3>
            <p className="mt-4 text-[13px] leading-[1.65] text-black/65">
              Suggestions go to me privately. Nothing is posted automatically.
            </p>
            <Link
              to="/community"
              className="mt-6 flex min-h-11 items-center justify-between rounded-full bg-[#e51c23] px-5 py-3 text-[12px] font-semibold text-white no-underline"
            >
              Send the idea <ArrowUpRight size={15} />
            </Link>
          </div>
        </aside>
      </section>

      {isLiveTrip ? (
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
                <label className="site-field-label text-white/60">
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
                <label className="site-field-label text-white/60">
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
                <label className="site-field-label text-white/60 sm:col-span-2">
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
                <label className="site-field-label text-white/60 sm:col-span-2">
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

function LiveRouteHero({
  publication,
  trip,
  activeDayNumber,
  selectedDayIndex,
  progress,
  error,
  notice,
}: {
  publication: PublishedAnthonyRoute
  trip: AnthonyTrip
  activeDayNumber?: number
  selectedDayIndex: number
  progress: number
  error?: string
  notice?: string
}) {
  const route = publication.route
  const selectedDay = route.days[selectedDayIndex] ?? route.days[0]
  const matchedLiveDayIndex = route.days.findIndex(
    (day) => day.day === activeDayNumber,
  )
  const liveDayIndex =
    matchedLiveDayIndex >= 0 ? matchedLiveDayIndex : selectedDayIndex
  const liveDay = route.days[liveDayIndex] ?? selectedDay
  const routeStations = useMemo(
    () => route.visits.map((visit) => visit.station),
    [route.visits],
  )
  const liveLocation =
    trip.currentLocation?.trim() ||
    (liveDay ? dayLocation(liveDay) : 'On the road')
  const selectedLocation = selectedDay
    ? dayLocation(selectedDay)
    : liveLocation
  const selectedIsLive = selectedDay?.day === liveDay?.day
  const roadAccurate =
    Boolean(publication.road?.line.length) && !publication.road?.degraded

  return (
    <section
      id="live-route-map"
      aria-label="Live 2026 Tesla Supercharging Competition route map"
      className="relative min-h-[720px] overflow-hidden bg-[#08090b] text-white lg:h-[calc(100svh-64px)] lg:max-h-[980px]"
    >
      <div className="absolute inset-0">
        <MapView
          stations={routeStations}
          route={route}
          roadLine={publication.road?.line}
          start={CHATTANOOGA_37405_START}
          showAllStations={false}
          highlightedDayIndex={selectedDayIndex}
          activeDayIndex={liveDayIndex}
          zoomFocusDayIndex={selectedDayIndex}
          scrollWheelZoom={false}
          pageScrollOnMobile
          fitPadding={{
            topLeft: [48, 150],
            bottomRight: [48, 260],
          }}
        />
      </div>
      <div className="pointer-events-none absolute inset-0 z-[450] bg-[linear-gradient(180deg,rgba(0,0,0,.54)_0%,rgba(0,0,0,.04)_38%,rgba(0,0,0,.08)_58%,rgba(0,0,0,.88)_100%)]" />

      <div className="pointer-events-none relative z-[500] mx-auto flex min-h-[720px] max-w-[1440px] flex-col justify-start p-4 sm:p-7 lg:h-full lg:justify-between lg:p-10">
        <div>
          {error ? (
            <div className="pointer-events-auto mb-3 max-w-[680px] rounded-[10px] bg-[#e82127] px-4 py-3 text-[13px] text-white">
              {error}
            </div>
          ) : null}
          {notice ? (
            <div className="pointer-events-auto mb-3 max-w-[680px] rounded-[10px] bg-[#23d7d1] px-4 py-3 text-[13px] font-semibold text-black">
              {notice}
            </div>
          ) : null}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="bg-black/88 px-4 py-3 backdrop-blur-md sm:px-5 sm:py-4">
              <div className="flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.14em] text-[#23d7d1]">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#23d7d1]" />
                2026 competition route · Live day {activeDayNumber ?? selectedDay?.day ?? '—'} of {route.totalDays}
              </div>
              <div className="mt-2 text-[22px] font-semibold tracking-[-0.035em] sm:text-[28px]">
                {liveLocation}
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 font-mono text-[7px] uppercase tracking-[0.08em] text-white/46">
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className="h-1.5 w-4 rounded-full"
                    style={{ backgroundColor: route.color }}
                  />
                  Full trip
                </span>
                <span className="inline-flex items-center gap-1.5 text-[#23d7d1]">
                  <span className="h-1.5 w-4 rounded-full bg-[#23d7d1]" />
                  Current day {liveDay?.day ?? '—'}
                </span>
                {!selectedIsLive ? (
                  <span className="inline-flex items-center gap-1.5 text-[#facc15]">
                    <span className="h-1.5 w-4 rounded-full bg-[#facc15]" />
                    Preview day {selectedDay?.day ?? '—'}
                  </span>
                ) : null}
              </div>
            </div>
            <div className="bg-black/82 px-4 py-3 text-right backdrop-blur-md">
              <div className={`font-mono text-[8px] uppercase tracking-[0.11em] ${roadAccurate ? 'text-[#23d7d1]' : 'text-[#f5b642]'}`}>
                {roadAccurate
                  ? `${publication.road?.provider} road-accurate route`
                  : 'Route estimate'}
              </div>
              <div className="mt-1 font-mono text-[7px] uppercase tracking-[0.09em] text-white/36">
                Updated {formatTimestamp(trip.updatedAt)}
              </div>
              <div className="mt-2 font-mono text-[6.5px] uppercase tracking-[0.08em] text-white/28">
                <span className="md:hidden">
                  One finger scrolls · two fingers move or zoom
                </span>
                <span className="hidden md:inline">
                  Wheel scrolls the page · + / − follows the selected leg
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-[360px] grid gap-5 lg:mt-0 lg:grid-cols-[minmax(0,1fr)_minmax(360px,.52fr)] lg:items-end">
          <div className="max-w-[850px] bg-black/84 p-5 backdrop-blur-md sm:p-7 lg:p-8">
            <div className="font-mono text-[8px] uppercase tracking-[0.14em] text-[#23d7d1]">
              {selectedIsLive ? 'Current route leg' : 'Previewing route leg'} ·{' '}
              {selectedDay
                ? formatTripDay(route.tripStartDate, selectedDay.day)
                : publication.savedRoute.name}
            </div>
            <h1 className="mt-3 text-[clamp(38px,8vw,78px)] font-semibold leading-[0.9] tracking-[-0.06em]">
              My 2026 Tesla Supercharging Competition route:{' '}
              {selectedIsLive && trip.headline
                ? trip.headline
                : `Day ${selectedDay?.day ?? activeDayNumber ?? '—'} — ${selectedLocation}`}
            </h1>
            <p className="mt-5 max-w-[680px] text-[13.5px] leading-[1.7] text-white/58 sm:text-[15px]">
              {selectedIsLive && trip.body
                ? trip.body
                : selectedIsLive
                  ? 'Follow the road route, open today’s stops, and read the latest field notes from the trip.'
                  : 'This planned leg is highlighted on the road map. Open its landmarks, charging stops, and any attached field notes below.'}
            </p>
            <div className="pointer-events-auto mt-6 flex flex-col gap-2 sm:flex-row">
              <a
                href="#full-route"
                className="flex min-h-11 items-center justify-center rounded-full bg-[#e82127] px-5 py-3 text-[12px] font-semibold text-white no-underline"
              >
                Open the day-by-day route
              </a>
              <a
                href="#journey-log"
                className="flex min-h-11 items-center justify-center rounded-full border border-white/30 px-5 py-3 text-[12px] font-semibold text-white no-underline"
              >
                Read the trip journal
              </a>
            </div>
          </div>

          <div className="bg-black/84 p-5 backdrop-blur-md sm:p-6">
            <div className="grid grid-cols-3 divide-x divide-white/12">
              <LiveHeroStat label="Miles" value={Math.round(route.totalMiles).toLocaleString()} />
              <LiveHeroStat label="Stops" value={route.uniqueStations.toLocaleString()} />
              <LiveHeroStat label="Landmarks" value={countRouteLandmarks(route).toLocaleString()} />
            </div>
            <div className="mt-5">
              <div className="mb-2 flex justify-between font-mono text-[7.5px] uppercase tracking-[0.09em] text-white/60">
                <span>Trip progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full bg-[#e82127]"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function CompleteRoute({
  publication,
  updates,
  selectedDayIndex,
  onSelectDay,
  mapInHero,
}: {
  publication: PublishedAnthonyRoute
  updates: AnthonyUpdate[]
  selectedDayIndex: number
  onSelectDay: (index: number) => void
  mapInHero: boolean
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
              Published 2026 competition route plan
            </div>
            <div className={`mt-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[7.5px] uppercase tracking-[0.09em] ${
              publication.road && !publication.road.degraded
                ? 'border-[#23d7d1]/35 bg-[#23d7d1]/10 text-[#23d7d1]'
                : 'border-[#f5b642]/30 bg-[#f5b642]/10 text-[#f5b642]'
            }`}>
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {publication.road && !publication.road.degraded
                ? `Road accurate via ${publication.road.provider}`
                : 'Road routing temporarily using estimates'}
            </div>
            <h2 className="mt-4 max-w-[850px] text-[clamp(42px,7vw,78px)] font-semibold leading-[0.9] tracking-[-0.06em]">
              The complete 2026 competition route and day-by-day itinerary
            </h2>
            <p className="mt-6 max-w-[720px] text-[14px] leading-[1.75] text-white/52">
              {mapInHero
                ? 'Select a day or overnight location to inspect its landmarks and writing. The live road map above follows the selected leg.'
                : 'Select a day or its overnight location to highlight that road leg on the map. Landmarks and day-specific writing open inside the itinerary.'}
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

        <div className={`mt-8 grid gap-6 ${
          mapInHero
            ? 'xl:grid-cols-[minmax(360px,.72fr)_minmax(0,1.28fr)]'
            : 'xl:grid-cols-[minmax(0,1.2fr)_minmax(390px,.8fr)]'
        }`}>
          <div className="xl:sticky xl:top-24 xl:h-fit">
            {!mapInHero ? (
              <div className="relative h-[460px] overflow-hidden border border-white/14 bg-[#15171b] sm:h-[590px]">
                <MapView
                  stations={routeStations}
                  route={route}
                  roadLine={publication.road?.line}
                  start={CHATTANOOGA_37405_START}
                  showAllStations={false}
                  highlightedDayIndex={selectedDayIndex}
                  zoomFocusDayIndex={selectedDayIndex}
                  scrollWheelZoom={false}
                  pageScrollOnMobile
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
            ) : null}

            {selectedDay ? (
              <SelectedDayPanel
                route={route}
                day={selectedDay}
                updates={selectedUpdates}
                mapInHero={mapInHero}
              />
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

function SelectedDayPanel({
  route,
  day,
  updates,
  mapInHero,
}: {
  route: RoutePlan
  day: DayPlan
  updates: AnthonyUpdate[]
  mapInHero: boolean
}) {
  return (
    <div
      className={`bg-white/[.035] p-5 sm:p-7 ${
        mapInHero
          ? 'border border-white/14'
          : 'border-x border-b border-white/14'
      }`}
    >
      {mapInHero ? (
        <a
          href="#live-route-map"
          className="mb-5 inline-flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.1em] text-[#23d7d1] no-underline"
        >
          <Navigation size={12} />
          See this leg on the live map
        </a>
      ) : null}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="font-mono text-[8px] uppercase tracking-[0.12em] text-[#e82127]">
            {formatTripDay(route.tripStartDate, day.day)}
          </div>
          <h3 className="mt-2 text-[clamp(27px,5vw,40px)] font-semibold tracking-[-0.045em]">
            Day {day.day}: {dayLocation(day)}
          </h3>
        </div>
        <div className="flex gap-4 font-mono text-[8px] uppercase tracking-[0.08em] text-white/60 sm:flex-col sm:items-end sm:gap-1.5">
          <span>{Math.round(day.miles)} mi</span>
          <span>{day.driveHours.toFixed(1)} hr</span>
          <span>{day.uniqueStations} stops</span>
        </div>
      </div>
      <DayDetails day={day} updates={updates} />
    </div>
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
        <div className="font-mono text-[8px] uppercase tracking-[0.1em] text-white/55">
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
        <div className="font-mono text-[8px] uppercase tracking-[0.08em] text-white/55">
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
        <div className="font-mono text-[8px] uppercase tracking-[0.1em] text-white/55">
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
          <p className="mt-3 text-[12px] leading-[1.6] text-white/60">
            This leg is focused on driving and unique Supercharger stops.
          </p>
        )}
        {day.stay ? (
          <div className="mt-4 border-l-2 border-[#e82127] pl-3 text-[11px] leading-[1.55] text-white/60">
            Overnight {day.stay.night} of {day.stay.totalNights} near {day.stay.label}
          </div>
        ) : null}
      </div>
      <div>
        <div className="font-mono text-[8px] uppercase tracking-[0.1em] text-white/55">
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
          <p className="mt-3 text-[12px] leading-[1.6] text-white/60">
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
            <span className="text-black/65">Day {update.day_number}</span>
          ) : null}
          {showLocation ? <span className="text-black/65">{update.location}</span> : null}
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

function PublishedFieldNoteEntry({
  note,
  index,
}: {
  note: AnthonyFieldNote
  index: number
}) {
  return (
    <article
      id={`journal-${note.id}`}
      data-published-field-note={note.id}
      className="grid scroll-mt-24 gap-4 border-b border-black/15 py-8 sm:grid-cols-[54px_minmax(0,1fr)] sm:py-10"
    >
      <div className="font-mono text-[9px] text-black/28">
        {String(index + 1).padStart(2, '0')}
      </div>
      <div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-[8px] uppercase tracking-[0.1em]">
          <span className="text-[#e82127]">{note.phaseLabel}</span>
          <time dateTime={note.publishedAt} className="text-black/45">
            {formatTimestamp(`${note.publishedAt}T12:00:00`)}
          </time>
        </div>
        <h3 className="mt-3 text-[clamp(30px,5vw,48px)] font-semibold leading-[0.98] tracking-[-0.05em]">
          {note.title}
        </h3>
        <p className="mt-5 max-w-[760px] text-[16px] font-medium leading-[1.75] text-black/68">
          {note.excerpt}
        </p>
        <div className="mt-8 max-w-[780px] space-y-5">
          {note.lede.map((paragraph, paragraphIndex) => (
            <FieldNoteParagraph key={`lede-${paragraphIndex}`} content={paragraph} />
          ))}
        </div>
        {note.sections.map((section) => (
          <section key={section.heading} className="mt-12 max-w-[820px]">
            <h4 className="text-[clamp(24px,4vw,34px)] font-semibold leading-[1.04] tracking-[-0.04em]">
              {section.heading}
            </h4>
            <div className="mt-5 space-y-5">
              {section.paragraphs.map((paragraph, paragraphIndex) => (
                <FieldNoteParagraph
                  key={`${section.heading}-paragraph-${paragraphIndex}`}
                  content={paragraph}
                />
              ))}
            </div>
            {section.bullets?.length ? (
              <ul className="mt-6 space-y-3 border-l-2 border-[#e82127] pl-5">
                {section.bullets.map((bullet) => (
                  <li key={bullet} className="text-[14px] leading-[1.65] text-black/62">
                    {bullet}
                  </li>
                ))}
              </ul>
            ) : null}
            {section.afterBullets?.length ? (
              <div className="mt-7 space-y-5">
                {section.afterBullets.map((paragraph, paragraphIndex) => (
                  <FieldNoteParagraph
                    key={`${section.heading}-after-${paragraphIndex}`}
                    content={paragraph}
                  />
                ))}
              </div>
            ) : null}
          </section>
        ))}
        <nav
          aria-label={`Continue reading after ${note.title}`}
          className="mt-12 max-w-[820px] border-y border-black/14 py-7"
        >
          <div className="font-mono text-[8px] font-semibold uppercase tracking-[0.13em] text-black/55">
            Continue through ChargeQuest
          </div>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {note.closingLinks.map((link) => (
              <li key={`${link.href}-${link.label}`}>
                <FieldNoteLink link={link} />
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-7 max-w-[820px]">
          <div className="font-mono text-[8px] font-semibold uppercase tracking-[0.13em] text-black/55">
            Source checked for this note
          </div>
          <ul className="mt-3 space-y-2">
            {note.sources.map((source) => (
              <li key={source.href}>
                <FieldNoteLink link={source} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  )
}

function FieldNoteParagraph({ content }: { content: AnthonyFieldNoteInline[] }) {
  return (
    <p className="text-[14.5px] leading-[1.78] text-black/62">
      {content.map((part, index) => typeof part === 'string' ? (
        <span key={`${part.slice(0, 24)}-${index}`}>{part}</span>
      ) : (
        <FieldNoteLink key={`${part.href}-${index}`} link={part} inline />
      ))}
    </p>
  )
}

function FieldNoteLink({
  link,
  inline = false,
}: {
  link: Exclude<AnthonyFieldNoteInline, string>
  inline?: boolean
}) {
  const className = inline
    ? 'font-semibold text-black underline decoration-[#e82127]/35 underline-offset-4 hover:decoration-[#e82127]'
    : 'inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-black underline decoration-black/20 underline-offset-4 hover:decoration-[#e82127]'

  if (link.external) {
    return (
      <a href={link.href} target="_blank" rel="noreferrer" className={className}>
        {link.label}
        {!inline ? <ArrowUpRight size={12} aria-hidden="true" /> : null}
      </a>
    )
  }
  if (link.href.startsWith('#')) {
    return <a href={link.href} className={className}>{link.label}</a>
  }
  return <Link to={link.href} className={className}>{link.label}</Link>
}

function RouteStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#0a0b0d] px-4 py-4 text-center">
      <div className="text-[21px] font-semibold tracking-[-0.04em]">{value}</div>
      <div className="mt-1 font-mono text-[7px] uppercase tracking-[0.1em] text-white/55">
        {label}
      </div>
    </div>
  )
}

function LiveHeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 text-center first:pl-0 last:pr-0">
      <div className="text-[20px] font-semibold tracking-[-0.04em] sm:text-[24px]">
        {value}
      </div>
      <div className="mt-1 font-mono text-[7px] uppercase tracking-[0.1em] text-white/55">
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
      <span className="font-mono text-[7.5px] uppercase tracking-[0.09em] text-white/55">
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
        <p className="mt-1 text-[11.5px] leading-[1.55] text-white/60">{children}</p>
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

function dateOnlyValue(value?: string | null) {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const result = Date.UTC(year, month - 1, day)
  const verified = new Date(result)
  if (
    verified.getUTCFullYear() !== year ||
    verified.getUTCMonth() !== month - 1 ||
    verified.getUTCDate() !== day
  ) {
    return null
  }
  return result
}

function routeDayNumberForDate(
  startDate: string | null | undefined,
  totalDays: number,
  now = new Date(),
) {
  const start = dateOnlyValue(startDate)
  if (start == null) return undefined
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.max(1, Math.min(totalDays, Math.floor((today - start) / DAY_IN_MS) + 1))
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
