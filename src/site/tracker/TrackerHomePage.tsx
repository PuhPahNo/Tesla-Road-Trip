import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Maximize2 } from 'lucide-react'
import { MapView } from '../../components/MapView'
import { CHATTANOOGA_37405_START } from '../../domain/config'
import type { DayPlan, RoutePlan, Station } from '../../domain/types'
import { usePageMetadata } from '../usePageMetadata'
import { PUBLIC_PAGES } from '../sitePages'
import {
  JournalCard,
  Kicker,
  LiveDot,
  LoadingBlock,
  PageContainer,
  ProgressTrack,
  SectionHeading,
  StatBlock,
  TextLink,
} from './components'
import { DayCard } from './DayCard'
import { useTripData } from './TripData'
import {
  dayEndLabel,
  daysUntil,
  formatLongDate,
  formatMiles,
  formatRelativeTime,
  type TripProgress,
} from './tripProgress'

export function TrackerHomePage() {
  usePageMetadata(PUBLIC_PAGES.tracker)
  const { community, published, progress, journal, loading, error, routeError } = useTripData()
  const route = published?.route
  const trip = community?.trip

  const focusDays = useMemo(() => (route ? pickFocusDays(route, progress) : []), [route, progress])
  const currentDayIndex =
    progress.currentDay && route ? route.days.findIndex((day) => day.day === progress.currentDay) : -1

  if (loading) return <LoadingBlock label="Loading the trip…" />

  return (
    <div className="pb-16">
      <PageContainer className="pt-8 sm:pt-12">
        {error ? (
          <div className="mb-6 rounded-xl border border-warn-bd bg-warn-bg px-4 py-3 text-[14px] text-warn">{error}</div>
        ) : null}
        <StatusHero progress={progress} route={route} trip={trip} />
      </PageContainer>

      <PageContainer className="mt-8">
        {route ? (
          <div className="relative h-[58vh] min-h-[340px] max-h-[620px] overflow-hidden rounded-3xl border border-edge bg-canvas">
            <MapView
              stations={routeStations(route)}
              route={route}
              roadLine={published?.road?.line}
              start={CHATTANOOGA_37405_START}
              showAllStations={false}
              activeDayIndex={currentDayIndex >= 0 ? currentDayIndex : undefined}
              zoomFocusDayIndex={currentDayIndex >= 0 ? currentDayIndex : undefined}
              scrollWheelZoom={false}
              pageScrollOnMobile
              fitPadding={{ topLeft: [32, 32], bottomRight: [32, 72] }}
            />
            <Link
              to={progress.currentDay ? `/route?day=${progress.currentDay}` : '/route'}
              className="glass absolute bottom-3 right-3 z-[500] inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-[13.5px] font-semibold text-ink no-underline"
            >
              <Maximize2 size={15} aria-hidden="true" /> Explore the full route
            </Link>
          </div>
        ) : (
          <div className="rounded-3xl border border-edge bg-panel p-8 text-[15px] text-dim">
            {routeError ? `The route map couldn’t load right now: ${routeError}` : 'The route will appear here once it’s published.'}
          </div>
        )}
      </PageContainer>

      {route ? (
        <PageContainer className="mt-8">
          <StatsGrid progress={progress} />
        </PageContainer>
      ) : null}

      {route && focusDays.length ? (
        <PageContainer className="mt-14">
          <SectionHeading
            kicker={progress.phase === 'live' ? 'Where I’m headed' : progress.phase === 'finished' ? 'The last stretch' : 'First days on the road'}
            title={progress.phase === 'live' ? 'Today and tomorrow' : progress.phase === 'finished' ? 'How it ended' : 'How it starts'}
            action={<TextLink to="/route">All {route.days.length} days <ArrowRight size={14} /></TextLink>}
          />
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {focusDays.map((day) => (
              <DayCard
                key={day.day}
                route={route}
                day={day}
                progress={progress}
                energyKwh={community?.dayLog.find((entry) => entry.dayNumber === day.day)?.energyKwh}
              />
            ))}
          </div>
        </PageContainer>
      ) : null}

      <PageContainer className="mt-14">
        <SectionHeading
          kicker="Journal"
          title="Latest from the road"
          action={journal.length > 3 ? <TextLink to="/journal">See all <ArrowRight size={14} /></TextLink> : undefined}
        />
        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {journal.slice(0, 3).map((entry) => (
            <JournalCard key={entry.id} entry={entry} />
          ))}
        </div>
        {journal.length === 0 ? (
          <p className="mt-5 text-[15px] text-dim">Posts and videos from the trip will show up here.</p>
        ) : null}
      </PageContainer>

      <PageContainer className="mt-14">
        <CompetitionStrip />
      </PageContainer>
    </div>
  )
}

function StatusHero({
  progress,
  route,
  trip,
}: {
  progress: TripProgress
  route?: RoutePlan
  trip?: { currentLocation?: string | null; headline?: string | null; body?: string | null; updatedAt: string }
}) {
  const currentDay = route?.days.find((day) => day.day === progress.currentDay)

  if (progress.phase === 'live') {
    const location = trip?.currentLocation || (currentDay ? dayEndLabel(currentDay) : undefined)
    return (
      <section aria-label="Trip status">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-accent/12 px-3 py-1.5 text-[13px] font-semibold text-accent">
            <LiveDot /> On the road
          </span>
          <span className="text-[14px] font-medium text-dim">
            Day {progress.currentDay} of {progress.totalDays}
          </span>
        </div>
        <h1 className="font-display mt-4 text-[clamp(40px,8vw,76px)] font-semibold leading-[0.98] tracking-[-0.035em]">
          {location ? <>Now in {location}</> : 'On the road'}
        </h1>
        {trip?.headline ? <p className="mt-4 max-w-[720px] text-[19px] font-medium leading-[1.45]">{trip.headline}</p> : null}
        {trip?.body ? <p className="mt-2 max-w-[720px] whitespace-pre-line text-[16px] leading-[1.65] text-dim">{trip.body}</p> : null}
        <div className="mt-6 max-w-[720px]">
          <ProgressTrack value={progress.completedDays.size} max={progress.totalDays} />
          <div className="mt-2 flex justify-between text-[12.5px] text-faint">
            <span>{progress.completedDays.size} of {progress.totalDays} days done</span>
            {trip?.updatedAt ? <span>Updated {formatRelativeTime(trip.updatedAt)}</span> : null}
          </div>
        </div>
      </section>
    )
  }

  if (progress.phase === 'finished') {
    return (
      <section aria-label="Trip status">
        <Kicker className="text-good">Trip complete</Kicker>
        <h1 className="font-display mt-3 text-[clamp(40px,8vw,76px)] font-semibold leading-[0.98] tracking-[-0.035em]">
          Made it home.
        </h1>
        <p className="mt-4 max-w-[680px] text-[17px] leading-[1.6] text-dim">
          {progress.totalDays} days, {formatMiles(progress.milesDriven)} miles and {progress.superchargersVisited} Superchargers.
          Thanks for following along.
        </p>
      </section>
    )
  }

  const countdown = daysUntil(progress.departureDate)
  return (
    <section aria-label="Trip status">
      <Kicker>{progress.departureDate ? `Departs ${formatLongDate(progress.departureDate)}` : 'Departure date coming soon'}</Kicker>
      <h1 className="font-display mt-3 text-[clamp(40px,8vw,76px)] font-semibold leading-[0.98] tracking-[-0.035em]">
        {countdownHeadline(countdown)}
      </h1>
      <p className="mt-4 max-w-[680px] text-[17px] leading-[1.6] text-dim">
        {route
          ? `A ${route.totalDays}-day loop through ${route.uniqueStations} Tesla Superchargers and about ${formatMiles(route.totalMiles)} miles, starting and ending in Chattanooga. Follow along here.`
          : 'A long loop of Tesla Superchargers, starting and ending in Chattanooga. Follow along here.'}
      </p>
      {trip?.headline ? <p className="mt-3 max-w-[680px] text-[16px] font-medium">{trip.headline}</p> : null}
    </section>
  )
}

function countdownHeadline(days: number | undefined) {
  if (days == null) return 'Getting ready to roll'
  if (days > 1) return `Leaving in ${days} days`
  if (days === 1) return 'Leaving tomorrow'
  if (days === 0) return 'Leaving today'
  return 'Getting ready to roll'
}

function StatsGrid({ progress }: { progress: TripProgress }) {
  const started = progress.phase !== 'pre_trip'
  const { planned } = progress
  return (
    <section aria-label="Trip numbers" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatBlock
        label="Superchargers visited"
        value={started ? String(progress.superchargersVisited) : '0'}
        of={String(planned.superchargers)}
        accent
      />
      <StatBlock label="Miles driven" value={started ? formatMiles(progress.milesDriven) : '0'} of={formatMiles(planned.miles)} />
      <StatBlock label="States" value={started ? String(progress.statesVisited) : '0'} of={String(planned.states)} />
      <StatBlock
        label="Energy added"
        value={progress.hasEnergyData ? `${formatMiles(progress.energyKwh)}` : '—'}
        hint={progress.hasEnergyData ? 'kWh at Superchargers' : 'Logged as the trip goes'}
      />
    </section>
  )
}

function CompetitionStrip() {
  return (
    <section className="rounded-3xl border border-edge bg-panel p-6 sm:p-8">
      <Kicker>Why so many Superchargers?</Kicker>
      <h2 className="font-display mt-2 text-[24px] font-semibold leading-[1.2] tracking-[-0.02em] sm:text-[28px]">
        This trip is my run at Tesla’s 2026 Supercharging Competition.
      </h2>
      <div className="mt-5 grid gap-5 sm:grid-cols-3">
        <CompetitionCategory title="Longest trip">
          A streak of new Superchargers, day after day. Every day of the route charges somewhere I haven’t charged before.
        </CompetitionCategory>
        <CompetitionCategory title="Most unique sites">
          Every stop is a different Supercharger, so the count above only goes up.
        </CompetitionCategory>
        <CompetitionCategory title="Most energy">
          Thousands of miles means a lot of kWh. I log what I add as I go.
        </CompetitionCategory>
      </div>
      <div className="mt-5">
        <TextLink to="/about">More about the trip <ArrowRight size={14} /></TextLink>
      </div>
    </section>
  )
}

function CompetitionCategory({ title, children }: { title: string; children: string }) {
  return (
    <div>
      <div className="text-[15px] font-semibold">{title}</div>
      <p className="mt-1 text-[14.5px] leading-[1.6] text-dim">{children}</p>
    </div>
  )
}

function pickFocusDays(route: RoutePlan, progress: TripProgress): DayPlan[] {
  const days = route.days
  if (progress.phase === 'live' && progress.currentDay) {
    const index = days.findIndex((day) => day.day === progress.currentDay)
    return index >= 0 ? days.slice(index, index + 2) : days.slice(0, 2)
  }
  if (progress.phase === 'finished') return days.slice(-2)
  return days.slice(0, 2)
}

function routeStations(route: RoutePlan): Station[] {
  const byId = new Map<string, Station>()
  for (const visit of route.visits) byId.set(visit.station.id, visit.station)
  return Array.from(byId.values())
}
