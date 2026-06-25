import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Route, Settings2 } from 'lucide-react'
import {
  fetchRoadRoute,
  fetchStations,
  optimizeRoutes,
  type PlannerAgentResponse,
  type StationsResponse,
} from './api/client'
import './App.css'
import { ConfigModal } from './components/ConfigModal'
import { DayPlanTable } from './components/DayPlanTable'
import { FeasibilityPanel } from './components/FeasibilityPanel'
import { MapView } from './components/MapView'
import { PlannerAgent } from './components/PlannerAgent'
import {
  RouteSummary,
  SelectedRouteStats,
} from './components/RouteSummary'
import { StateCoveragePanel } from './components/StateCoveragePanel'
import { StationSourceBar } from './components/StationSourceBar'
import {
  defaultPlannerConfig,
  sanitizePlannerConfig,
} from './domain/config'
import {
  buildAllStateRouteStats,
  buildStateRouteStats,
} from './domain/routeStats'
import { TESLA_CONTEST_RULES } from './domain/rules'
import type { OptimizeResponse, PlannerConfig, Station } from './domain/types'

const EMPTY_STATIONS: Station[] = []

type RoadRouteState =
  | { status: 'idle'; routeId?: string }
  | { status: 'loading'; routeId: string }
  | { status: 'ready'; routeId: string; line: PlannerConfig['start'][]; warning?: string }
  | { status: 'error'; routeId: string; message: string }

function App() {
  const [config, setConfig] = useState<PlannerConfig>(defaultPlannerConfig)
  const [stationStatus, setStationStatus] = useState<StationsResponse>()
  const [result, setResult] = useState<OptimizeResponse>()
  const [selectedRouteId, setSelectedRouteId] = useState<string>()
  const [configOpen, setConfigOpen] = useState(true)
  const [isLoadingStations, setIsLoadingStations] = useState(false)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [error, setError] = useState<string>()
  const [roadRoutes, setRoadRoutes] = useState<Record<string, PlannerConfig['start'][]>>({})
  const [roadRouteState, setRoadRouteState] = useState<RoadRouteState>({
    status: 'idle',
  })
  const [selectedStateCode, setSelectedStateCode] = useState<string>()

  const selectedRoute = useMemo(() => {
    if (!result) return undefined
    return (
      result.routes.find((routeOption) => routeOption.id === selectedRouteId) ??
      result.routes[0]
    )
  }, [result, selectedRouteId])

  const loadStations = async () => {
    setIsLoadingStations(true)
    setError(undefined)
    try {
      const response = await fetchStations(config)
      setStationStatus(response)
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Station feed failed.',
      )
    } finally {
      setIsLoadingStations(false)
    }
  }

  const runOptimize = async () => {
    setIsOptimizing(true)
    setError(undefined)
    try {
      const response = await optimizeRoutes(sanitizePlannerConfig(config))
      applyOptimizationResult(response)
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Optimization failed.',
      )
    } finally {
      setIsOptimizing(false)
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
    setConfigOpen(false)
  }

  const applyAgentResponse = (response: PlannerAgentResponse) => {
    setConfig(sanitizePlannerConfig(response.config))
    if (response.result) {
      applyOptimizationResult(response.result, response.selectedRouteId)
    }
  }

  useEffect(() => {
    void loadStations()
    // Station reloads are triggered explicitly after initial load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
        setRoadRoutes((current) => ({
          ...current,
          [selectedRoute.id]: roadRoute.roadLine,
        }))
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
            requestError instanceof Error
              ? requestError.message
              : 'Road geometry failed.',
        })
      })

    return () => {
      cancelled = true
    }
  }, [config.start, roadRoutes, selectedRoute])

  const visibleStations = result?.stations ?? stationStatus?.stations ?? EMPTY_STATIONS
  const stateStats = useMemo(
    () => buildStateRouteStats(selectedRoute, visibleStations),
    [selectedRoute, visibleStations],
  )
  const allStateStats = useMemo(
    () => buildAllStateRouteStats(selectedRoute, visibleStations),
    [selectedRoute, visibleStations],
  )
  const selectedStateStats = allStateStats.find(
    (state) => state.state === selectedStateCode,
  )
  const activeRoadLine =
    selectedRoute && roadRouteState.status === 'ready'
      ? roadRouteState.line
      : undefined

  return (
    <main className="app-shell">
      <section className="map-stage">
        <MapView
          stations={visibleStations}
          route={selectedRoute}
          start={config.start}
          showAllStations={config.showAllStations}
          roadLine={activeRoadLine}
          stateStats={allStateStats}
          onSelectState={setSelectedStateCode}
        />
        <div className="map-toolbar">
          <div>
            <p className="eyebrow">2026 Americas competition</p>
            <h1>Supercharger Quest Planner</h1>
          </div>
          <div className="toolbar-actions">
            <button
              className="icon-text-button"
              type="button"
              onClick={() => setConfigOpen(true)}
            >
              <Settings2 size={18} />
              Configure
            </button>
            <button
              className="primary-button"
              type="button"
              disabled={isOptimizing}
              onClick={runOptimize}
            >
              <Route size={18} />
              {isOptimizing ? 'Optimizing...' : 'Optimize'}
            </button>
          </div>
        </div>
      </section>

      <aside className="planner-panel">
        <StationSourceBar
          stationStatus={stationStatus}
          isLoading={isLoadingStations}
          error={error}
          onRefresh={loadStations}
        />

        {error && (
          <section className="error-panel">
            <AlertTriangle size={18} />
            <p>{error}</p>
          </section>
        )}

        <section className="rules-panel">
          <p className="eyebrow">Rule guardrails</p>
          <h2>Passport deadline: {TESLA_CONTEST_RULES.passportDeadline}</h2>
          <p>
            No minimum charge duration is stated in Tesla&apos;s referenced contest
            page. The planner treats stop time as a configurable assumption.
          </p>
          {selectedRoute && (
            <p className={`road-status ${roadRouteState.status}`}>
              {roadRouteState.status === 'loading' &&
                `Road geometry: mapping ${selectedRoute.name} through OSRM roads...`}
              {roadRouteState.status === 'ready' &&
                `Road geometry: OSRM road polyline loaded for ${selectedRoute.name}.`}
              {roadRouteState.status === 'error' &&
                `Road geometry fallback: ${roadRouteState.message}`}
              {roadRouteState.status === 'idle' && 'Road geometry: waiting for route.'}
            </p>
          )}
        </section>

        <SelectedRouteStats route={selectedRoute} />
        <StateCoveragePanel
          stats={stateStats}
          selectedState={selectedStateStats}
          onSelectState={setSelectedStateCode}
          onCloseState={() => setSelectedStateCode(undefined)}
        />
        <PlannerAgent
          config={config}
          selectedRouteId={selectedRoute?.id}
          onApply={applyAgentResponse}
        />
        <RouteSummary
          routes={result?.routes ?? []}
          selectedRouteId={selectedRoute?.id}
          onSelectRoute={setSelectedRouteId}
        />
        <FeasibilityPanel result={result} />
      </aside>

      <section className="lower-workspace">
        <DayPlanTable route={selectedRoute} />
      </section>

      <ConfigModal
        config={config}
        open={configOpen}
        isOptimizing={isOptimizing}
        onClose={() => setConfigOpen(false)}
        onChange={(nextConfig) => setConfig(sanitizePlannerConfig(nextConfig))}
        onOptimize={runOptimize}
      />
    </main>
  )
}

export default App
