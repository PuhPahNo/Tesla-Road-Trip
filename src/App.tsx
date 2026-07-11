import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  fetchHealth,
  fetchStations,
  createCustomRoute,
  deleteCustomRoute,
  optimizeRoutes,
  refineRoute,
  updateCustomRoute,
  type PlannerAgentResponse,
  type StationsResponse,
} from './api/client'
import { defaultPlannerConfig, sanitizePlannerConfig } from './domain/config'
import {
  buildAllStateRouteStats,
  buildStateRouteStats,
} from './domain/routeStats'
import type {
  Coordinate,
  OptimizeResponse,
  PlannerConfig,
  RoutePlan,
  SavedCustomRoute,
  Station,
  DayPlan,
} from './domain/types'
import { useIsMobile } from './hooks/useMediaQuery'
import { useContestStatus } from './hooks/useContestStatus'
import {
  ActionsIsland,
  BrandIsland,
  IconRail,
  MobileTabBar,
  type MobileTab,
  type PanelKey,
} from './components/Chrome'
import {
  CoverageSection,
  DaysSection,
  GlassPanel,
  OverviewSection,
  StatsSection,
  StatusSection,
  type RoadStatusVM,
} from './components/GlassPanel'
import { FocusBar } from './components/FocusBar'
import { CalendarModal } from './components/CalendarModal'
import { MapView, type FitPadding } from './components/MapView'
import { RoutePicker } from './components/RoutePicker'
import { StateDetailModal } from './components/StateDetailModal'
import { ConfigModal } from './components/ConfigModal'
import { RouteCopilotPanel } from './components/RouteCopilot'
import { CustomRouteModal, type CustomRouteDraft } from './components/CustomRouteModal'
import {
  Overlay,
  OverlayHeader,
  OptimizeOverlay,
  SplashScreen,
  Toast,
} from './ui/Overlay'
import { AlertIcon } from './ui/icons'
import { Eyebrow } from './ui/primitives'
import { fetchPreferences, savePreferences } from './api/siteClient'
import { useAuth } from './site/AuthContext'

const EMPTY_STATIONS: Station[] = []

const OPTIMIZE_STEPS = [
  'Loading station universe…',
  'Clustering corridor sites…',
  'Solving daily legs…',
  'Balancing drive caps…',
  'Finalizing the day plan…',
]

const PLAY_INTERVAL_MS = 1400

type DayStateScore = {
  state: string
  visits: number
  miles: number
  firstSequence: number
}

type RoadRouteState =
  | { status: 'idle'; routeId?: string }
  | { status: 'loading'; routeId: string }
  | { status: 'ready'; routeId: string; line: Coordinate[]; warning?: string }
  | { status: 'fallback'; routeId: string; message: string }
  | { status: 'error'; routeId: string; message: string }

function App() {
  const isMobile = useIsMobile()
  const contestStatus = useContestStatus()
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()

  // ---- planner data state (preserved from the original app) ----
  const [config, setConfig] = useState<PlannerConfig>(defaultPlannerConfig)
  const [stationStatus, setStationStatus] = useState<StationsResponse>()
  const [result, setResult] = useState<OptimizeResponse>()
  const [selectedRouteId, setSelectedRouteId] = useState<string>()
  const [isLoadingStations, setIsLoadingStations] = useState(false)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [error, setError] = useState<string>()
  const [roadRoutes, setRoadRoutes] = useState<Record<string, Coordinate[]>>({})
  const [refinedRoutes, setRefinedRoutes] = useState<Record<string, RoutePlan>>({})
  // True only when a routing engine (OpenRouteService / real OSRM) is configured
  // AND currently working — a missing, invalid, or quota-exhausted key reports
  // false, which restores estimate mode and the manual Average-speed control.
  const [roadRoutingEnabled, setRoadRoutingEnabled] = useState(false)
  const [roadRouteState, setRoadRouteState] = useState<RoadRouteState>({ status: 'idle' })
  const [selectedStateCode, setSelectedStateCode] = useState<string>()

  // ---- UI state (cockpit) ----
  const [panel, setPanel] = useState<PanelKey | null>('overview')
  const [mobileTab, setMobileTab] = useState<MobileTab>(null)
  const [copilotOpen, setCopilotOpen] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [configOpen, setConfigOpen] = useState(false)
  const [routePickerOpen, setRoutePickerOpen] = useState(false)
  const [customRouteOpen, setCustomRouteOpen] = useState(false)
  const [editingCustomRoute, setEditingCustomRoute] = useState<SavedCustomRoute>()
  const [isSavingCustomRoute, setIsSavingCustomRoute] = useState(false)
  const [deletingCustomRouteId, setDeletingCustomRouteId] = useState<string>()
  const [hoveredDayIndex, setHoveredDayIndex] = useState<number>()
  const [hoveredState, setHoveredState] = useState<string>()
  const [curDay, setCurDay] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [optimizeStep, setOptimizeStep] = useState(OPTIMIZE_STEPS[0])
  const toastTimer = useRef<number>(0)

  const selectedRoute = useMemo(() => {
    if (!result) return undefined
    return (
      result.routes.find((route) => route.id === selectedRouteId) ?? result.routes[0]
    )
  }, [result, selectedRouteId])

  const showToast = (message: string) => {
    setToast(message)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 3000)
  }

  // ---- data loaders ----
  const loadStations = async (activeConfig = config) => {
    setIsLoadingStations(true)
    setError(undefined)
    try {
      setStationStatus(await fetchStations(activeConfig))
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Station feed failed.')
    } finally {
      setIsLoadingStations(false)
    }
  }

  const applyOptimizationResult = (
    response: OptimizeResponse,
    routeId = response.routes[0]?.id,
  ) => {
    setConfig(sanitizePlannerConfig(response.config))
    setResult(response)
    setStationStatus({
      source: response.source,
      totalNormalized: response.universe.totalOpenStations,
      totalOpen: response.universe.totalOpenStations,
      filteredStations: response.universe.filteredStations,
      stations: response.stations,
    })
    setSelectedRouteId(routeId)
    setSelectedStateCode(undefined)
    setRoadRoutes({})
    setRefinedRoutes({})
    setRoadRouteState({ status: 'idle' })
    setCurDay(0)
    setPlaying(false)
    setHoveredDayIndex(undefined)
  }

  const runOptimize = async (
    activeConfig = config,
    persistPreferences = true,
  ) => {
    setIsOptimizing(true)
    setError(undefined)
    setOptimizeStep(OPTIMIZE_STEPS[0])
    setConfigOpen(false)
    try {
      const sanitized = sanitizePlannerConfig(activeConfig)
      if (user && persistPreferences) await savePreferences(sanitized)
      const response = await optimizeRoutes(sanitized)
      applyOptimizationResult(response)
      showToast(
        sanitized.plannerMode === 'longest_trip'
          ? `Longest Trip planned · ${response.routes[0]?.totalDays.toLocaleString() ?? 0} streak days`
          : `Route optimized · ${response.routes[0]?.uniqueStations.toLocaleString() ?? 0} unique sites`,
      )
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Optimization failed.')
    } finally {
      setIsOptimizing(false)
    }
  }

  const applyAgentResponse = (response: PlannerAgentResponse) => {
    setConfig(sanitizePlannerConfig(response.config))
    if (response.result) {
      applyOptimizationResult(response.result, response.selectedRouteId)
      showToast('Copilot updated the plan')
    }
  }

  // ---- effects ----
  // First load (and account switch): hydrate that user's saved preferences,
  // then optimize with their account-owned routes.
  useEffect(() => {
    if (authLoading) return
    void fetchPreferences()
      .then(({ config: savedConfig }) => {
        const next = sanitizePlannerConfig(savedConfig)
        setConfig(next)
        void loadStations(next)
        void runOptimize(next, false)
      })
      .catch(() => {
        void loadStations(defaultPlannerConfig)
        void runOptimize(defaultPlannerConfig, false)
      })
    void fetchHealth()
      .then((health) => setRoadRoutingEnabled(Boolean(health.roadRouting?.enabled)))
      .catch(() => setRoadRoutingEnabled(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.id])

  // rotate the optimize-overlay step text while optimizing.
  useEffect(() => {
    if (!isOptimizing) return
    let i = 0
    const id = window.setInterval(() => {
      i = (i + 1) % OPTIMIZE_STEPS.length
      setOptimizeStep(OPTIMIZE_STEPS[i])
    }, 360)
    return () => window.clearInterval(id)
  }, [isOptimizing])

  // ⌘K toggles the copilot, Escape closes it (overlays handle their own).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCopilotOpen((open) => !open)
      }
      if (e.key === 'Escape') setCopilotOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  // road geometry for the selected route (OSRM), cached per route.
  useEffect(() => {
    if (!selectedRoute) return
    // No real routing engine configured -> use the estimate, don't call OSRM.
    if (!roadRoutingEnabled) {
      setRoadRouteState({ status: 'idle', routeId: selectedRoute.id })
      return
    }
    if (roadRoutes[selectedRoute.id]) {
      setRoadRouteState({
        status: 'ready',
        routeId: selectedRoute.id,
        line: roadRoutes[selectedRoute.id],
      })
      return
    }

    let cancelled = false
    setRoadRouteState({ status: 'loading', routeId: selectedRoute.id })

    // Ask the server for real OSRM road geometry + per-leg distances, and use
    // them to rebuild this route's mileage/day plan (road-accurate). Falls back
    // to the estimate if OSRM is unavailable.
    void refineRoute(
      config,
      {
        id: selectedRoute.id,
        name: selectedRoute.name,
        strategy: selectedRoute.strategy,
        color: selectedRoute.color,
      },
      selectedRoute.visits.map((visit) => visit.station),
    )
      .then((response) => {
        if (cancelled) return
        setRefinedRoutes((current) => ({ ...current, [selectedRoute.id]: response.route }))
        if (response.degraded) {
          const message =
            response.warnings[0] ??
            'Road routing could not refine this route — using straight-line fallback.'
          setRoadRouteState({
            status: 'fallback',
            routeId: selectedRoute.id,
            message,
          })
          showToast(message)
          return
        }

        setRoadRoutes((current) => ({ ...current, [selectedRoute.id]: response.roadLine }))
        setRoadRouteState({
          status: 'ready',
          routeId: selectedRoute.id,
          line: response.roadLine,
          warning: response.warnings[0],
        })
      })
      .catch((requestError) => {
        if (cancelled) return
        setRoadRouteState({
          status: 'error',
          routeId: selectedRoute.id,
          message:
            requestError instanceof Error ? requestError.message : 'Road geometry failed.',
        })
      })

    return () => {
      cancelled = true
    }
  }, [config, roadRoutes, selectedRoute, roadRoutingEnabled])

  // ---- derived ----
  const visibleStations = result?.stations ?? stationStatus?.stations ?? EMPTY_STATIONS
  // The route shown everywhere: the road-accurate refined version once it loads,
  // otherwise the fast estimate.
  const displayRoute =
    selectedRoute && refinedRoutes[selectedRoute.id]
      ? refinedRoutes[selectedRoute.id]
      : selectedRoute
  const routeStateStats = useMemo(
    () => buildStateRouteStats(displayRoute, visibleStations),
    [displayRoute, visibleStations],
  )
  const allStateStats = useMemo(
    () => buildAllStateRouteStats(displayRoute, visibleStations),
    [displayRoute, visibleStations],
  )
  const selectedStateStats = allStateStats.find((s) => s.state === selectedStateCode)

  const activeRoadLine =
    selectedRoute &&
    roadRouteState.status === 'ready' &&
    roadRouteState.routeId === selectedRoute.id
      ? roadRouteState.line
      : undefined

  const roadStatus = useMemo<RoadStatusVM>(() => {
    if (!selectedRoute) return { status: 'idle' }
    const routeName = selectedRoute.name
    if (!roadRoutingEnabled) return { status: 'estimate', routeName }
    if (roadRouteState.routeId !== selectedRoute.id) return { status: 'idle', routeName }
    if (roadRouteState.status === 'error')
      return { status: 'error', routeName, message: roadRouteState.message }
    if (roadRouteState.status === 'fallback')
      return { status: 'fallback', routeName, message: roadRouteState.message }
    if (roadRouteState.status === 'loading') return { status: 'loading', routeName }
    if (roadRouteState.status === 'ready') return { status: 'ready', routeName }
    return { status: 'idle', routeName }
  }, [selectedRoute, roadRouteState, roadRoutingEnabled])

  const feasibility = result?.universe.allSitesFeasibility
  const allSitesTarget =
    feasibility != null &&
    config.plannerMode === 'most_unique_sites' &&
    config.targetStations >= Math.floor(feasibility.totalStations * 0.95)
  const visibleFeasibility = allSitesTarget ? feasibility : undefined

  // splash until the first optimize resolves (or fails visibly).
  const ready = Boolean(result) || Boolean(error)

  // Focus mode: the current day stays highlighted on the map unless the
  // user is hovering another day in the panel.
  const focusVisible = Boolean(displayRoute) && (!isMobile || mobileTab === null)
  const highlightedDayIndex =
    hoveredDayIndex ?? (focusVisible && displayRoute ? Math.min(curDay, displayRoute.days.length - 1) : undefined)

  const fitPadding = useMemo<FitPadding>(
    () =>
      isMobile
        ? { topLeft: [16, 88], bottomRight: [16, 170] }
        : { topLeft: [panel ? 440 : 96, 104], bottomRight: [96, 124] },
    [isMobile, panel],
  )

  // day auto-play tour.
  useEffect(() => {
    if (!playing || !displayRoute) return
    const id = window.setInterval(() => {
      setCurDay((current) => (current + 1) % displayRoute.days.length)
    }, PLAY_INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [playing, displayRoute])

  // ---- handlers ----
  const handleSelectRoute = (id: string) => {
    setSelectedRouteId(id)
    setSelectedStateCode(undefined)
    setHoveredDayIndex(undefined)
    setCurDay(0)
    setPlaying(false)
  }
  const handleSelectState = (state: string) => {
    setCalendarOpen(false)
    setSelectedStateCode(state)
    setMobileTab(null)
  }
  const handleOpenDay = (dayIndex: number) => {
    setCurDay(dayIndex)
    setHoveredDayIndex(undefined)
    setCalendarOpen(false)
    setMobileTab(null)
    const primaryState = primaryStateForDay(displayRoute?.days[dayIndex])
    if (primaryState) setSelectedStateCode(primaryState)
  }
  const handleSetDay = (dayIndex: number) => {
    if (!displayRoute) return
    setCurDay(Math.max(0, Math.min(displayRoute.days.length - 1, dayIndex)))
  }
  const handleTogglePanel = (key: PanelKey) => {
    setPanel((current) => (current === key ? null : key))
  }

  const handleOpenCustomRoute = () => {
    if (!user) {
      navigate('/signup?returnTo=/planner')
      return
    }
    setEditingCustomRoute(undefined)
    setRoutePickerOpen(false)
    setCopilotOpen(false)
    setMobileTab(null)
    setCustomRouteOpen(true)
  }

  const handleEditCustomRoute = (route: SavedCustomRoute) => {
    setEditingCustomRoute(route)
    setRoutePickerOpen(false)
    setCopilotOpen(false)
    setMobileTab(null)
    setCustomRouteOpen(true)
  }

  const handleSaveCustomRoute = async (draft: CustomRouteDraft) => {
    setIsSavingCustomRoute(true)
    setError(undefined)
    try {
      const saved = editingCustomRoute
        ? await updateCustomRoute(editingCustomRoute.id, draft)
        : await createCustomRoute(draft)
      const response = await optimizeRoutes(sanitizePlannerConfig(config))
      applyOptimizationResult(response, saved.route.id)
      setCustomRouteOpen(false)
      setEditingCustomRoute(undefined)
      setRoutePickerOpen(true)
      showToast(`${editingCustomRoute ? 'Updated' : 'Saved'} ${saved.route.name}`)
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : 'Custom route save failed.',
      )
    } finally {
      setIsSavingCustomRoute(false)
    }
  }

  const handleDeleteCustomRoute = async (route: SavedCustomRoute) => {
    setDeletingCustomRouteId(route.id)
    setError(undefined)
    try {
      await deleteCustomRoute(route.id)
      const response = await optimizeRoutes(sanitizePlannerConfig(config))
      applyOptimizationResult(
        response,
        selectedRoute?.id === route.id ? response.routes[0]?.id : selectedRoute?.id,
      )
      setRoutePickerOpen(true)
      showToast(`Deleted ${route.name}`)
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : 'Custom route delete failed.',
      )
    } finally {
      setDeletingCustomRouteId(undefined)
    }
  }

  const panelContent = (key: PanelKey) => {
    switch (key) {
      case 'overview':
        return <OverviewSection route={displayRoute} feasibility={visibleFeasibility} />
      case 'days':
        return (
          <DaysSection
            route={displayRoute}
            hoveredDayIndex={hoveredDayIndex}
            onOpenDay={handleOpenDay}
            onHoverDay={setHoveredDayIndex}
          />
        )
      case 'coverage':
        return (
          <CoverageSection
            stats={routeStateStats}
            onSelectState={handleSelectState}
            onHoverState={setHoveredState}
            highlightedState={hoveredState}
          />
        )
      case 'stats':
        return <StatsSection route={displayRoute} routeStateStats={routeStateStats} />
      case 'status':
        return (
          <StatusSection
            stationStatus={stationStatus}
            isLoadingStations={isLoadingStations}
            onRefresh={loadStations}
            contestStatus={contestStatus}
            roadStatus={roadStatus}
          />
        )
    }
  }

  return (
    <div className="fixed inset-0 overflow-hidden bg-app text-ink">
      {/* Fullscreen map behind the floating chrome */}
      <div className="absolute inset-0 z-0">
        <MapView
          stations={visibleStations}
          route={displayRoute}
          start={config.start}
          showAllStations={config.showAllStations}
          roadLine={activeRoadLine}
          stateStats={allStateStats}
          onSelectState={handleSelectState}
          onHoverState={setHoveredState}
          highlightedState={hoveredState}
          highlightedDayIndex={highlightedDayIndex}
          fitPadding={fitPadding}
        />
      </div>

      {/* Floating top chrome */}
      <BrandIsland
        routeName={selectedRoute?.name ?? 'No route yet'}
        routeColor={selectedRoute?.color}
        contestLabel={contestStatus.brandLabel}
        onOpenRoutePicker={() => setRoutePickerOpen(true)}
      />
      <ActionsIsland
        onOpenCopilot={() => setCopilotOpen((open) => !open)}
        onRefresh={() => void loadStations()}
        isRefreshing={isLoadingStations}
        onOpenConfig={() => setConfigOpen(true)}
        showAsk={!isMobile}
      />

      {/* Error banner */}
      {error && (
        <div className="glass fixed left-1/2 top-[76px] z-50 flex max-w-[min(560px,calc(100vw-32px))] -translate-x-1/2 items-center gap-2 rounded-[11px] px-3.5 py-2.5 text-[12.5px] text-warn">
          <AlertIcon size={14} className="flex-none" />
          <span className="min-w-0 flex-1 truncate">{error}</span>
          <button
            type="button"
            className="cursor-pointer font-mono text-[10.5px] uppercase tracking-wide opacity-70 hover:opacity-100"
            onClick={() => setError(undefined)}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Desktop: icon rail + adaptive glass panel */}
      {!isMobile && (
        <>
          <IconRail activePanel={panel} onSelect={handleTogglePanel} />
          {panel && (
            <GlassPanel panel={panel} route={displayRoute} onClose={() => setPanel(null)}>
              {panelContent(panel)}
            </GlassPanel>
          )}
          {copilotOpen && (
            <RouteCopilotPanel
              config={config}
              route={displayRoute}
              selectedRouteId={selectedRoute?.id}
              onApply={applyAgentResponse}
              onOpenCustomRoute={handleOpenCustomRoute}
              onClose={() => setCopilotOpen(false)}
            />
          )}
        </>
      )}

      {/* Focus day navigator */}
      {focusVisible && displayRoute && (
        <FocusBar
          route={displayRoute}
          curDay={curDay}
          playing={playing}
          isMobile={isMobile}
          onSetDay={handleSetDay}
          onPrev={() => handleSetDay(curDay - 1)}
          onNext={() => handleSetDay(curDay + 1)}
          onTogglePlay={() => setPlaying((p) => !p)}
          onOpenDay={handleOpenDay}
          onOpenCalendar={() => setCalendarOpen(true)}
        />
      )}

      {/* Mobile: glass tab bar + sheets */}
      {isMobile && (
        <>
          <MobileTabBar
            active={mobileTab}
            onSelect={(tab) =>
              setMobileTab((current) => (tab === null || current === tab ? null : tab))
            }
          />

          <Overlay
            open={mobileTab === 'trip'}
            onClose={() => setMobileTab(null)}
            size="detail"
          >
            <OverlayHeader
              kicker="Trip dashboard"
              title="Overview & stats"
              onClose={() => setMobileTab(null)}
            />
            <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4">
              <OverviewSection route={displayRoute} feasibility={visibleFeasibility} />
              <div className="flex flex-col gap-3">
                <Eyebrow>Trip stats</Eyebrow>
                <StatsSection route={displayRoute} routeStateStats={routeStateStats} />
              </div>
              <div className="flex flex-col gap-3">
                <Eyebrow>Status & rules</Eyebrow>
                <StatusSection
                  stationStatus={stationStatus}
                  isLoadingStations={isLoadingStations}
                  onRefresh={loadStations}
                  contestStatus={contestStatus}
                  roadStatus={roadStatus}
                />
              </div>
            </div>
          </Overlay>

          <Overlay
            open={mobileTab === 'days'}
            onClose={() => setMobileTab(null)}
            size="detail"
          >
            <OverlayHeader
              kicker="Daily plan"
              title={displayRoute?.name ?? 'Daily plan'}
              onClose={() => setMobileTab(null)}
            />
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <DaysSection
                route={displayRoute}
                hoveredDayIndex={hoveredDayIndex}
                onOpenDay={handleOpenDay}
                onHoverDay={setHoveredDayIndex}
              />
            </div>
          </Overlay>

          <Overlay
            open={mobileTab === 'coverage'}
            onClose={() => setMobileTab(null)}
            size="detail"
          >
            <OverlayHeader
              kicker="Route coverage"
              title="Stations by state"
              onClose={() => setMobileTab(null)}
            />
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <CoverageSection
                stats={routeStateStats}
                onSelectState={handleSelectState}
              />
            </div>
          </Overlay>

          <Overlay
            open={mobileTab === 'copilot'}
            onClose={() => setMobileTab(null)}
            size="detail"
          >
            <RouteCopilotPanel
              config={config}
              route={displayRoute}
              selectedRouteId={selectedRoute?.id}
              onApply={applyAgentResponse}
              onOpenCustomRoute={handleOpenCustomRoute}
              mode="sheet"
              onClose={() => setMobileTab(null)}
            />
          </Overlay>
        </>
      )}

      {/* Modals */}
      <RoutePicker
        routes={result?.routes ?? []}
        selectedRouteId={selectedRoute?.id}
        open={routePickerOpen}
        onClose={() => setRoutePickerOpen(false)}
        onSelect={handleSelectRoute}
        onCreateCustomRoute={handleOpenCustomRoute}
        savedCustomRoutes={config.savedCustomRoutes}
        onEditCustomRoute={handleEditCustomRoute}
        onDeleteCustomRoute={handleDeleteCustomRoute}
        deletingRouteId={deletingCustomRouteId}
      />
      <CalendarModal
        route={displayRoute}
        open={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        onOpenDay={handleOpenDay}
      />
      <StateDetailModal
        state={selectedStateStats}
        onClose={() => setSelectedStateCode(undefined)}
      />
      <ConfigModal
        config={config}
        open={configOpen}
        isOptimizing={isOptimizing}
        roadRoutingEnabled={roadRoutingEnabled}
        onClose={() => setConfigOpen(false)}
        onChange={(next) => setConfig(sanitizePlannerConfig(next))}
        onApply={() => void runOptimize()}
      />
      <CustomRouteModal
        open={customRouteOpen}
        isSaving={isSavingCustomRoute}
        route={editingCustomRoute}
        defaultTargetDays={config.longestTripDays}
        preferences={config}
        onClose={() => {
          setCustomRouteOpen(false)
          setEditingCustomRoute(undefined)
        }}
        onSave={handleSaveCustomRoute}
      />

      {/* Overlays */}
      {!ready && (
        <SplashScreen
          subtitle={`Charting the ${contestStatus.region} Supercharger network…`}
        />
      )}
      {isOptimizing && ready && <OptimizeOverlay step={optimizeStep} />}
      <Toast message={toast} />
    </div>
  )
}

function primaryStateForDay(day?: DayPlan): string | undefined {
  if (!day) return undefined

  const scores = new Map<string, DayStateScore>()
  day.visits.forEach((visit) => {
    const state = visit.station.address.state
    if (!state) return

    const score =
      scores.get(state) ??
      ({
        state,
        visits: 0,
        miles: 0,
        firstSequence: visit.sequence,
      } satisfies DayStateScore)
    score.visits += 1
    score.miles += visit.legMiles
    score.firstSequence = Math.min(score.firstSequence, visit.sequence)
    scores.set(state, score)
  })

  return Array.from(scores.values()).sort(
    (a, b) =>
      b.visits - a.visits ||
      b.miles - a.miles ||
      a.firstSequence - b.firstSequence ||
      a.state.localeCompare(b.state),
  )[0]?.state
}

export default App
