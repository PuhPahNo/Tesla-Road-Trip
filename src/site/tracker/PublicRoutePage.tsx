import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, BookOpen } from 'lucide-react'
import { fetchStations, type StationsResponse } from '../../api/client'
import { CalendarModal } from '../../components/CalendarModal'
import {
  IconRail,
  MOBILE_TABS,
  MobileTabBar,
  RAIL_ITEMS,
  type MobileTab,
  type PanelKey,
} from '../../components/Chrome'
import { FocusBar } from '../../components/FocusBar'
import {
  CoverageSection,
  DaysSection,
  GlassPanel,
  OverviewSection,
  StatsSection,
} from '../../components/GlassPanel'
import { MapView, type FitPadding } from '../../components/MapView'
import { StateDetailModal } from '../../components/StateDetailModal'
import { CHATTANOOGA_37405_START, defaultPlannerConfig } from '../../domain/config'
import { buildAllStateRouteStats, buildStateRouteStats } from '../../domain/routeStats'
import type { DayPlan, Station } from '../../domain/types'
import { useIsMobile } from '../../hooks/useMediaQuery'
import { Overlay, OverlayHeader } from '../../ui/Overlay'
import { Eyebrow } from '../../ui/primitives'
import { usePageMetadata } from '../usePageMetadata'
import { PUBLIC_PAGES } from '../sitePages'
import { ThemeToggle } from '../SiteShell'
import { DayStatusBadge, LoadingBlock } from './components'
import { entriesForDay } from './journal'
import { useTripData } from './TripData'
import { dayStatus } from './tripProgress'

// Visitors get CORE's read-only views; "Guardrails" is planner diagnostics.
const PUBLIC_RAIL_ITEMS = RAIL_ITEMS.filter((item) => item.key !== 'status')
const PUBLIC_MOBILE_TABS = MOBILE_TABS.filter((tab) => tab.key !== 'copilot')
const PLAY_INTERVAL_MS = 1400

/**
 * Read-only CORE: the same map, day navigator, calendar and trip panels
 * Anthony uses in the planner, fed by the published route instead of the
 * optimizer. Nothing here can change the route.
 */
export function PublicRoutePage() {
  usePageMetadata(PUBLIC_PAGES.route)
  const isMobile = useIsMobile()
  const [searchParams, setSearchParams] = useSearchParams()
  const { published, progress, journal, loading, routeError } = useTripData()
  const route = published?.route

  const [universe, setUniverse] = useState<StationsResponse>()
  const [panel, setPanel] = useState<PanelKey | null>(isMobile ? null : 'days')
  const [mobileTab, setMobileTab] = useState<MobileTab>(null)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [selectedStateCode, setSelectedStateCode] = useState<string>()
  const [hoveredState, setHoveredState] = useState<string>()
  const [hoveredDayIndex, setHoveredDayIndex] = useState<number>()
  const [playing, setPlaying] = useState(false)
  const [curDay, setCurDay] = useState(0)

  // Station universe for "X of Y sites in this state" coverage numbers.
  useEffect(() => {
    void fetchStations(defaultPlannerConfig).then(setUniverse).catch(() => undefined)
  }, [])

  // Open on ?day=N, else the day Anthony is on, else day 1.
  const requestedDay = Number(searchParams.get('day')) || progress.currentDay
  useEffect(() => {
    if (!route) return
    const index = route.days.findIndex((day) => day.day === requestedDay)
    setCurDay(index >= 0 ? index : 0)
  }, [route, requestedDay])

  useEffect(() => {
    if (!playing || !route) return
    const id = window.setInterval(() => setCurDay((current) => (current + 1) % route.days.length), PLAY_INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [playing, route])

  const stations = useMemo(() => universe?.stations ?? routeStations(route?.visits.map((visit) => visit.station)), [route, universe])
  const routeStateStats = useMemo(() => buildStateRouteStats(route, stations), [route, stations])
  const allStateStats = useMemo(() => buildAllStateRouteStats(route, stations), [route, stations])
  const selectedStateStats = allStateStats.find((stat) => stat.state === selectedStateCode)

  const fitPadding = useMemo<FitPadding>(
    () => (isMobile ? { topLeft: [16, 88], bottomRight: [16, 170] } : { topLeft: [panel ? 440 : 96, 104], bottomRight: [96, 124] }),
    [isMobile, panel],
  )

  if (loading) return <LoadingBlock label="Loading the route…" />
  if (!route) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-app px-6 text-center text-ink">
        <p className="max-w-[420px] text-[15px] text-dim">
          {routeError ? `The route couldn’t load right now: ${routeError}` : 'The route hasn’t been published yet.'}
        </p>
        <Link to="/" className="text-[14px] font-medium text-accent">Back to the tracker</Link>
      </div>
    )
  }

  const dayIndex = Math.min(curDay, route.days.length - 1)
  const day = route.days[dayIndex]
  const liveIndex = progress.currentDay ? route.days.findIndex((candidate) => candidate.day === progress.currentDay) : -1
  const dayPosts = day ? entriesForDay(journal, day.day) : []
  const focusVisible = !isMobile || mobileTab === null

  const setDay = (index: number) => {
    const next = Math.max(0, Math.min(route.days.length - 1, index))
    setCurDay(next)
    setSearchParams({ day: String(route.days[next].day) }, { replace: true })
  }
  const openDay = (index: number) => {
    setDay(index)
    setHoveredDayIndex(undefined)
    setCalendarOpen(false)
    setMobileTab(null)
  }
  const selectState = (state: string) => {
    setCalendarOpen(false)
    setSelectedStateCode(state)
    setMobileTab(null)
  }

  const panelContent = (key: PanelKey) => {
    switch (key) {
      case 'overview':
        return <OverviewSection route={route} />
      case 'days':
        return <DaysSection route={route} hoveredDayIndex={hoveredDayIndex} onOpenDay={openDay} onHoverDay={setHoveredDayIndex} />
      case 'coverage':
        return (
          <CoverageSection
            stats={routeStateStats}
            onSelectState={selectState}
            onHoverState={setHoveredState}
            highlightedState={hoveredState}
          />
        )
      case 'stats':
        return <StatsSection route={route} routeStateStats={routeStateStats} />
      default:
        return null
    }
  }

  return (
    <div className="planner-shell fixed inset-0 overflow-hidden bg-app text-ink">
      <div className="absolute inset-0 z-0">
        <MapView
          stations={stations}
          route={route}
          start={CHATTANOOGA_37405_START}
          showAllStations={false}
          roadLine={published?.road?.line}
          stateStats={allStateStats}
          onSelectState={selectState}
          onHoverState={setHoveredState}
          highlightedState={hoveredState}
          activeDayIndex={liveIndex >= 0 ? liveIndex : undefined}
          highlightedDayIndex={hoveredDayIndex ?? (focusVisible ? dayIndex : undefined)}
          fitPadding={fitPadding}
        />
      </div>

      <RouteIsland day={day} status={day ? dayStatus(progress, day.day) : 'upcoming'} postCount={dayPosts.length} />
      <div className="glass fixed right-3 top-3 z-40 flex h-11 items-center gap-1 rounded-[12px] px-1 sm:right-4 sm:top-4 sm:h-12 sm:rounded-[13px] sm:px-1.5">
        <ThemeToggle className="border-transparent" />
      </div>

      {!isMobile ? (
        <>
          <IconRail activePanel={panel} onSelect={(key) => setPanel((current) => (current === key ? null : key))} items={PUBLIC_RAIL_ITEMS} />
          {panel ? (
            <GlassPanel panel={panel} route={route} onClose={() => setPanel(null)}>
              {panelContent(panel)}
            </GlassPanel>
          ) : null}
        </>
      ) : null}

      {focusVisible ? (
        <FocusBar
          route={route}
          curDay={dayIndex}
          playing={playing}
          isMobile={isMobile}
          onSetDay={setDay}
          onPrev={() => setDay(dayIndex - 1)}
          onNext={() => setDay(dayIndex + 1)}
          onTogglePlay={() => setPlaying((value) => !value)}
          onOpenDay={openDay}
          onOpenCalendar={() => setCalendarOpen(true)}
        />
      ) : null}

      {isMobile ? (
        <>
          <MobileTabBar
            active={mobileTab}
            tabs={PUBLIC_MOBILE_TABS}
            onSelect={(tab) => setMobileTab((current) => (tab === null || current === tab ? null : tab))}
          />
          <Overlay open={mobileTab === 'trip'} onClose={() => setMobileTab(null)} size="detail">
            <OverlayHeader kicker="The trip" title="Overview & stats" onClose={() => setMobileTab(null)} />
            <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-3.5 sm:p-4">
              <OverviewSection route={route} />
              <div className="flex flex-col gap-3">
                <Eyebrow>Trip stats</Eyebrow>
                <StatsSection route={route} routeStateStats={routeStateStats} />
              </div>
            </div>
          </Overlay>
          <Overlay open={mobileTab === 'days'} onClose={() => setMobileTab(null)} size="detail">
            <OverlayHeader kicker="Daily plan" title={`${route.days.length} days`} onClose={() => setMobileTab(null)} />
            <div className="min-h-0 flex-1 overflow-y-auto p-3.5 sm:p-4">
              <DaysSection route={route} hoveredDayIndex={hoveredDayIndex} onOpenDay={openDay} onHoverDay={setHoveredDayIndex} />
            </div>
          </Overlay>
          <Overlay open={mobileTab === 'coverage'} onClose={() => setMobileTab(null)} size="detail">
            <OverlayHeader kicker="Route coverage" title="Stations by state" onClose={() => setMobileTab(null)} />
            <div className="min-h-0 flex-1 overflow-y-auto p-3.5 sm:p-4">
              <CoverageSection stats={routeStateStats} onSelectState={selectState} />
            </div>
          </Overlay>
        </>
      ) : null}

      <CalendarModal route={route} open={calendarOpen} onClose={() => setCalendarOpen(false)} onOpenDay={openDay} />
      <StateDetailModal state={selectedStateStats} onClose={() => setSelectedStateCode(undefined)} />
    </div>
  )
}

function RouteIsland({
  day,
  status,
  postCount,
}: {
  day?: DayPlan
  status: ReturnType<typeof dayStatus>
  postCount: number
}) {
  return (
    <div className="glass fixed left-3 top-3 z-40 flex h-11 max-w-[calc(100vw-80px)] items-center gap-2 rounded-[12px] pl-1 pr-2 sm:left-4 sm:top-4 sm:h-12 sm:gap-3 sm:rounded-[13px] sm:pr-3">
      <Link
        to="/"
        aria-label="Back to the tracker"
        className="flex h-9 flex-none items-center gap-1.5 rounded-[9px] px-2 text-[13px] font-medium text-dim no-underline hover:bg-chip hover:text-ink"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        <img src="/chargequest-logo.png?v=4" alt="ChargeQuest" className="hidden h-[22px] w-auto object-contain sm:block" />
        <span className="sm:hidden">Tracker</span>
      </Link>
      {day ? (
        <>
          <span className="h-5 w-px flex-none bg-edge" aria-hidden="true" />
          <span className="flex-none text-[13px] font-semibold">Day {day.day}</span>
          <DayStatusBadge status={status} />
          {postCount ? (
            <Link
              to="/journal"
              className="hidden flex-none items-center gap-1 text-[12.5px] font-medium text-accent no-underline sm:inline-flex"
            >
              <BookOpen size={13} aria-hidden="true" /> {postCount} post{postCount === 1 ? '' : 's'}
            </Link>
          ) : null}
        </>
      ) : null}
    </div>
  )
}

function routeStations(stations: Station[] | undefined) {
  const byId = new Map<string, Station>()
  for (const station of stations ?? []) byId.set(station.id, station)
  return Array.from(byId.values())
}
