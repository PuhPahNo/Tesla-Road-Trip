import { useEffect, useMemo, useRef, useState } from 'react'
import {
  fetchRoadRoute,
  fetchStations,
  optimizeRoutes,
  type PlannerAgentResponse,
  type StationsResponse,
} from './api/client'
import { defaultPlannerConfig, sanitizePlannerConfig } from './domain/config'
import {
  buildAllStateRouteStats,
  buildStateRouteStats,
} from './domain/routeStats'
import { TESLA_CONTEST_RULES } from './domain/rules'
import type {
  Coordinate,
  OptimizeResponse,
  PlannerConfig,
  Station,
} from './domain/types'
import { useIsMobile } from './hooks/useMediaQuery'
import { TopBar } from './components/TopBar'
import { MapView } from './components/MapView'
import {
  CoverageSection,
  FeasibilitySection,
  GuardrailsSection,
  HeroStats,
  Sidebar,
  SourceSection,
  type RoadStatusVM,
} from './components/Sidebar'
import { DailyPlanDrawer, DayTable } from './components/DailyPlan'
import { DayDetailModal } from './components/DayDetailModal'
import { StateDetailModal } from './components/StateDetailModal'
import { ConfigModal } from './components/ConfigModal'
import { RouteCopilot, type CopilotMode } from './components/RouteCopilot'
import { RoutePicker } from './components/RoutePicker'
import { Overlay, OverlayHeader, OptimizeOverlay, Toast } from './ui/Overlay'
import { AlertIcon, CalendarIcon, CompassIcon, LayersIcon, MapPinIcon } from './ui/icons'
import { cx } from './ui/primitives'

const EMPTY_STATIONS: Station[] = []

const OPTIMIZE_STEPS = [
  'Loading station universe…',
  'Clustering corridor sites…',
  'Solving daily legs…',
  'Balancing drive caps…',
  'Finalizing the day plan…',
]

type RoadRouteState =
  | { status: 'idle'; routeId?: string }
  | { status: 'loading'; routeId: string }
  | { status: 'ready'; routeId: string; line: Coordinate[]; warning?: string }
  | { status: 'error'; routeId: string; message: string }

type MobileSheet = 'routes' | 'days' | 'states' | null

function App() {
  const isMobile = useIsMobile()

  // ---- planner data state (preserved from the original app) ----
  const [config, setConfig] = useState<PlannerConfig>(defaultPlannerConfig)
  const [stationStatus, setStationStatus] = useState<StationsResponse>()
  const [result, setResult] = useState<OptimizeResponse>()
  const [selectedRouteId, setSelectedRouteId] = useState<string>()
  const [isLoadingStations, setIsLoadingStations] = useState(false)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [error, setError] = useState<string>()
  const [roadRoutes, setRoadRoutes] = useState<Record<string, Coordinate[]>>({})
  const [roadRouteState, setRoadRouteState] = useState<RoadRouteState>({ status: 'idle' })
  const [selectedStateCode, setSelectedStateCode] = useState<string>()

  // ---- UI state ----
  const [configOpen, setConfigOpen] = useState(false)
  const [routePickerOpen, setRoutePickerOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(true)
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>()
  const [copilotOpen, setCopilotOpen] = useState(false)
  const [copilotMode, setCopilotMode] = useState<CopilotMode>('dock')
  const [mobileSheet, setMobileSheet] = useState<MobileSheet>(null)
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
  const loadStations = async () => {
    setIsLoadingStations(true)
    setError(undefined)
    try {
      setStationStatus(await fetchStations(config))
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
    setRoadRouteState({ status: 'idle' })
  }

  const runOptimize = async () => {
    setIsOptimizing(true)
    setError(undefined)
    setOptimizeStep(OPTIMIZE_STEPS[0])
    setConfigOpen(false)
    try {
      const response = await optimizeRoutes(sanitizePlannerConfig(config))
      applyOptimizationResult(response)
      showToast(
        `Route optimized · ${response.routes[0]?.uniqueStations.toLocaleString() ?? 0} unique sites`,
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
  // first load: fetch stations + auto-optimize so the map is populated.
  useEffect(() => {
    void loadStations()
    void runOptimize()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  // road geometry for the selected route (OSRM), cached per route.
  useEffect(() => {
    if (!selectedRoute) return
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
    const coordinates = [
      config.start,
      ...selectedRoute.visits.map((visit) => visit.station.position),
      config.start,
    ]

    void fetchRoadRoute(coordinates)
      .then((roadRoute) => {
        if (cancelled) return
        setRoadRoutes((current) => ({ ...current, [selectedRoute.id]: roadRoute.roadLine }))
        setRoadRouteState({
          status: 'ready',
          routeId: selectedRoute.id,
          line: roadRoute.roadLine,
          warning: roadRoute.warnings[0],
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
  }, [config.start, roadRoutes, selectedRoute])

  // ---- derived ----
  const visibleStations = result?.stations ?? stationStatus?.stations ?? EMPTY_STATIONS
  const routeStateStats = useMemo(
    () => buildStateRouteStats(selectedRoute, visibleStations),
    [selectedRoute, visibleStations],
  )
  const allStateStats = useMemo(
    () => buildAllStateRouteStats(selectedRoute, visibleStations),
    [selectedRoute, visibleStations],
  )
  const selectedStateStats = allStateStats.find((s) => s.state === selectedStateCode)
  const activeDay =
    selectedRoute && selectedDayIndex != null ? selectedRoute.days[selectedDayIndex] : undefined

  const activeRoadLine =
    selectedRoute &&
    roadRouteState.status === 'ready' &&
    roadRouteState.routeId === selectedRoute.id
      ? roadRouteState.line
      : undefined

  const roadStatus = useMemo<RoadStatusVM>(() => {
    if (!selectedRoute) return { status: 'idle' }
    const routeName = selectedRoute.name
    if (roadRouteState.routeId !== selectedRoute.id) return { status: 'idle', routeName }
    if (roadRouteState.status === 'error')
      return { status: 'error', routeName, message: roadRouteState.message }
    if (roadRouteState.status === 'loading') return { status: 'loading', routeName }
    if (roadRouteState.status === 'ready') return { status: 'ready', routeName }
    return { status: 'idle', routeName }
  }, [selectedRoute, roadRouteState])

  const feasibility = result?.universe.allSitesFeasibility
  const mapCaption = `${(result?.universe.filteredStations ?? stationStatus?.filteredStations ?? visibleStations.length).toLocaleString()} SITES`

  const handleSelectRoute = (id: string) => {
    setSelectedRouteId(id)
    setSelectedStateCode(undefined)
  }
  const handleSelectState = (state: string) => {
    setSelectedStateCode(state)
    setMobileSheet(null)
  }
  const handleOpenDay = (dayIndex: number) => {
    setSelectedDayIndex(dayIndex)
    setMobileSheet(null)
  }

  const sidebarData = {
    route: selectedRoute,
    stationStatus,
    isLoadingStations,
    routeStateStats,
    feasibility,
    roadStatus,
    passportDeadline: TESLA_CONTEST_RULES.passportDeadline,
    onSelectState: handleSelectState,
    onRefresh: loadStations,
  }

  return (
    <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-app text-ink">
      <TopBar
        selectedRouteName={selectedRoute?.name ?? 'No route yet'}
        onOpenRoutePicker={() => setRoutePickerOpen(true)}
        onOpenConfig={() => setConfigOpen(true)}
        onOptimize={runOptimize}
        isOptimizing={isOptimizing}
      />

      {error && (
        <div className="flex items-center gap-2 border-b border-warn-bd bg-warn-bg px-4 py-2 text-[13px] text-warn">
          <AlertIcon size={15} />
          <span className="min-w-0 flex-1 truncate">{error}</span>
          <button
            type="button"
            className="font-mono text-[11px] uppercase tracking-wide opacity-70 hover:opacity-100"
            onClick={() => setError(undefined)}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* MAIN */}
      <div className="relative flex min-h-0 flex-1">
        {/* Copilot (in-flow dock on desktop + floating launcher/panel/bar/sheet) */}
        <RouteCopilot
          config={config}
          selectedRouteId={selectedRoute?.id}
          onApply={applyAgentResponse}
          open={copilotOpen}
          mode={copilotMode}
          isMobile={isMobile}
          onOpen={() => setCopilotOpen(true)}
          onClose={() => setCopilotOpen(false)}
          onSetMode={setCopilotMode}
        />

        {/* Map */}
        <div className="relative min-w-0 flex-1">
          <MapView
            stations={visibleStations}
            route={selectedRoute}
            start={config.start}
            showAllStations={config.showAllStations}
            roadLine={activeRoadLine}
            stateStats={allStateStats}
            onSelectState={handleSelectState}
            caption={mapCaption}
          />
        </div>

        {/* Desktop sidebar */}
        {!isMobile && (
          <aside className="flex w-80 flex-none flex-col border-l border-edge bg-panel">
            <Sidebar {...sidebarData} className="flex-1" />
          </aside>
        )}
      </div>

      {/* Desktop daily-plan drawer */}
      {!isMobile && (
        <DailyPlanDrawer
          route={selectedRoute}
          open={drawerOpen}
          onToggleOpen={() => setDrawerOpen((o) => !o)}
          onOpenDay={handleOpenDay}
        />
      )}

      {/* Mobile bottom tab bar */}
      {isMobile && (
        <MobileTabBar
          active={mobileSheet}
          onSelect={(tab) =>
            setMobileSheet((current) => (tab === null || current === tab ? null : tab))
          }
        />
      )}

      {/* Mobile sheets */}
      {isMobile && (
        <>
          <Overlay
            open={mobileSheet === 'routes'}
            onClose={() => setMobileSheet(null)}
            size="detail"
          >
            <OverlayHeader
              kicker="Trip dashboard"
              title="Routes & stats"
              onClose={() => setMobileSheet(null)}
            />
            <div className="flex flex-col gap-3 overflow-y-auto p-4">
              <HeroStats route={selectedRoute} />
              <MobileRouteList
                routes={result?.routes ?? []}
                selectedRouteId={selectedRoute?.id}
                onSelect={(id) => {
                  handleSelectRoute(id)
                }}
              />
              <FeasibilitySection feasibility={feasibility} />
              <SourceSection
                stationStatus={stationStatus}
                isLoadingStations={isLoadingStations}
                onRefresh={loadStations}
              />
              <GuardrailsSection
                passportDeadline={TESLA_CONTEST_RULES.passportDeadline}
                roadStatus={roadStatus}
              />
            </div>
          </Overlay>

          <Overlay
            open={mobileSheet === 'days'}
            onClose={() => setMobileSheet(null)}
            size="wide"
          >
            <OverlayHeader
              kicker="Daily plan"
              title={selectedRoute?.name ?? 'Daily plan'}
              onClose={() => setMobileSheet(null)}
            />
            <div className="min-h-0 flex-1 overflow-y-auto">
              <DayTable route={selectedRoute} onOpenDay={handleOpenDay} />
            </div>
          </Overlay>

          <Overlay
            open={mobileSheet === 'states'}
            onClose={() => setMobileSheet(null)}
            size="detail"
          >
            <OverlayHeader
              kicker="Route coverage"
              title="Stations by state"
              onClose={() => setMobileSheet(null)}
            />
            <div className="overflow-y-auto p-4">
              <CoverageSection stats={routeStateStats} onSelectState={handleSelectState} />
            </div>
          </Overlay>
        </>
      )}

      {/* Modals (responsive via Overlay) */}
      <RoutePicker
        routes={result?.routes ?? []}
        selectedRouteId={selectedRoute?.id}
        open={routePickerOpen}
        onClose={() => setRoutePickerOpen(false)}
        onSelect={handleSelectRoute}
      />
      <DayDetailModal
        day={activeDay}
        route={selectedRoute}
        onClose={() => setSelectedDayIndex(undefined)}
      />
      <StateDetailModal
        state={selectedStateStats}
        onClose={() => setSelectedStateCode(undefined)}
      />
      <ConfigModal
        config={config}
        open={configOpen}
        isOptimizing={isOptimizing}
        onClose={() => setConfigOpen(false)}
        onChange={(next) => setConfig(sanitizePlannerConfig(next))}
        onApply={runOptimize}
      />

      {/* Overlays */}
      {isOptimizing && <OptimizeOverlay step={optimizeStep} />}
      <Toast message={toast} />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Mobile bottom tab bar                                               */
/* ------------------------------------------------------------------ */
const TABS: Array<{ key: Exclude<MobileSheet, null>; label: string; icon: typeof CompassIcon }> = [
  { key: 'routes', label: 'Routes', icon: LayersIcon },
  { key: 'days', label: 'Days', icon: CalendarIcon },
  { key: 'states', label: 'States', icon: MapPinIcon },
]

function MobileTabBar({
  active,
  onSelect,
}: {
  active: MobileSheet
  onSelect: (tab: MobileSheet) => void
}) {
  return (
    <nav className="pb-safe z-30 grid flex-none grid-cols-4 border-t border-edge bg-panel">
      <button
        type="button"
        onClick={() => onSelect(null)}
        aria-pressed={active === null}
        className={cx(
          'flex min-h-11 flex-col items-center justify-center gap-0.5 py-2 transition',
          active === null ? 'text-accent' : 'text-faint hover:text-ink',
        )}
      >
        <CompassIcon size={20} />
        <span className="text-[10px] font-medium">Map</span>
      </button>
      {TABS.map((tab) => {
        const isActive = active === tab.key
        const Icon = tab.icon
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onSelect(tab.key)}
            aria-pressed={isActive}
            className={cx(
              'flex min-h-11 flex-col items-center justify-center gap-0.5 py-2 transition',
              isActive ? 'text-accent' : 'text-faint hover:text-ink',
            )}
          >
            <Icon size={20} />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

/* ------------------------------------------------------------------ */
/* Compact route list used inside the mobile Routes sheet              */
/* ------------------------------------------------------------------ */
function MobileRouteList({
  routes,
  selectedRouteId,
  onSelect,
}: {
  routes: OptimizeResponse['routes']
  selectedRouteId?: string
  onSelect: (id: string) => void
}) {
  if (!routes.length) return null
  return (
    <div className="flex flex-col gap-2">
      <div className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-faint">
        Route candidates
      </div>
      {routes.map((route) => {
        const isActive = route.id === selectedRouteId
        return (
          <button
            key={route.id}
            type="button"
            onClick={() => onSelect(route.id)}
            className={cx(
              'grid min-h-11 grid-cols-[8px_1fr] items-center gap-3 rounded-xl border p-3 text-left transition',
              isActive ? 'border-accent shadow-card' : 'border-edge',
            )}
          >
            <span
              className="h-full min-h-9 w-2 rounded"
              style={{ background: route.color }}
            />
            <span className="min-w-0">
              <span className="block truncate text-[14px] font-semibold text-ink">
                {route.name}
              </span>
              <span className="block font-mono text-[11.5px] text-faint">
                {route.uniqueStations.toLocaleString()} sites · {route.totalDays} days ·{' '}
                {route.totalMiles.toLocaleString()} mi
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}

export default App
