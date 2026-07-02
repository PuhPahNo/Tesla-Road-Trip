import { memo, useEffect, useMemo, useRef, useState } from 'react'
import {
  CircleMarker,
  GeoJSON,
  MapContainer,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from 'react-leaflet'
import type { Feature, FeatureCollection, Geometry } from 'geojson'
import type { Layer, Path, PathOptions } from 'leaflet'
import type { StateRouteStats } from '../domain/routeStats'
import type {
  Coordinate,
  DayPlan,
  RoutePlan,
  RouteStationVisit,
  Station,
} from '../domain/types'
import { haversineMiles, simplifyPolyline } from '../domain/geo'
import { STATE_NAME_TO_CODE } from '../domain/usStates'
import usStatesRaw from '../assets/us-states.json'
import { useTheme } from '../theme/theme'

/** fitBounds padding so the route clears the floating cockpit chrome. */
export interface FitPadding {
  topLeft: [number, number]
  bottomRight: [number, number]
}

interface MapViewProps {
  stations: Station[]
  route?: RoutePlan
  start: Coordinate
  showAllStations: boolean
  roadLine?: Coordinate[]
  stateStats?: StateRouteStats[]
  onSelectState?: (state: string) => void
  onHoverState?: (state: string | undefined) => void
  highlightedState?: string
  highlightedDayIndex?: number
  fitPadding: FitPadding
}

const US_STATES = usStatesRaw as unknown as FeatureCollection<Geometry, { name: string }>

const MAX_ROUTE_MARKERS = 360
const MAX_POLYLINE_POINTS = 3500
const ROAD_OVERVIEW_TOLERANCE_MILES = 6
const ROAD_POLYLINE_SMOOTH_FACTOR = 3.5
const TURN_MARKER_MIN_LEG_MILES = 12
const TURN_MARKER_MIN_ANGLE_DEGREES = 105
const DAY_BOUNDARY_MATCH_TOLERANCE_MILES = 5

const TILE_URL = {
  tesla: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
  dash: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
} as const

export const MapView = memo(function MapView({
  stations,
  route,
  start,
  showAllStations,
  roadLine,
  stateStats = [],
  onSelectState,
  onHoverState,
  highlightedState,
  highlightedDayIndex,
  fitPadding,
}: MapViewProps) {
  const { theme, isDark } = useTheme()
  // preferCanvas means Leaflet vector strokes/fills are painted to <canvas>,
  // which cannot resolve CSS var(), so theme colors are picked here in JS.
  const ink = isDark ? '#e9edf2' : '#171a20'
  const node = isDark ? '#0e131a' : '#ffffff'
  const faintLine = isDark ? '#3a4150' : '#475569'
  const faintFill = isDark ? '#4b5563' : '#94a3b8'
  const coverage = isDark ? '#0bd5d0' : '#0f7d6b'
  const connector = isDark ? '#facc15' : '#d97706'

  const coverageByCode = useMemo(
    () => new Map(stateStats.map((state) => [state.state, state])),
    [stateStats],
  )
  const routeVisits = useMemo(
    () => selectRouteMarkers(route?.visits ?? [], MAX_ROUTE_MARKERS),
    [route?.visits],
  )

  return (
    <MapContainer
      className="h-full w-full"
      center={[start.lat, start.lon]}
      preferCanvas
      zoom={5}
      zoomControl={false}
      scrollWheelZoom
    >
      <TileLayer
        key={theme}
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        detectRetina
        subdomains="abcd"
        url={isDark ? TILE_URL.dash : TILE_URL.tesla}
      />
      <ZoomControl />
      <ResizeHandler />

      <StateChoropleth
        key={`${theme}-${route?.id ?? 'none'}`}
        coverageByCode={coverageByCode}
        coverageColor={coverage}
        highlightedState={highlightedState}
        onSelectState={onSelectState}
        onHoverState={onHoverState}
      />

      {showAllStations &&
        stations.map((station) => (
          <CircleMarker
            key={station.id}
            center={[station.position.lat, station.position.lon]}
            radius={2}
            pathOptions={{
              color: faintLine,
              fillColor: faintFill,
              fillOpacity: 0.32,
              opacity: 0.28,
              weight: 1,
            }}
          />
        ))}

      <CircleMarker
        center={[start.lat, start.lon]}
        radius={8}
        pathOptions={{
          color: ink,
          fillColor: node,
          fillOpacity: 1,
          weight: 3,
        }}
      >
        <Tooltip direction="top" offset={[0, -4]}>
          Start / end
        </Tooltip>
      </CircleMarker>

      {route && (
        <>
          <RouteLine
            route={route}
            roadLine={roadLine}
            isDark={isDark}
            fitPadding={fitPadding}
          />
          <DayHighlightLine
            route={route}
            start={start}
            dayIndex={highlightedDayIndex}
            roadLine={roadLine}
            isDark={isDark}
          />
          <RouteStopMarkers
            route={route}
            visits={routeVisits}
            nodeColor={node}
            connectorColor={connector}
          />
        </>
      )}
    </MapContainer>
  )
})

/* ------------------------------------------------------------------ */
/* Coverage choropleth — states tinted by % of sites visited          */
/* ------------------------------------------------------------------ */
interface StateChoroplethProps {
  coverageByCode: Map<string, StateRouteStats>
  coverageColor: string
  highlightedState?: string
  onSelectState?: (state: string) => void
  onHoverState?: (state: string | undefined) => void
}

function codeOf(feature?: Feature<Geometry, { name: string }>): string | undefined {
  const name = feature?.properties?.name
  return name ? STATE_NAME_TO_CODE[name] : undefined
}

function StateChoropleth({
  coverageByCode,
  coverageColor,
  highlightedState,
  onSelectState,
  onHoverState,
}: StateChoroplethProps) {
  const layersByCode = useRef(new Map<string, Path>())

  const baseStyle = (code?: string): PathOptions => {
    const stat = code ? coverageByCode.get(code) : undefined
    if (!stat) return { weight: 0, fill: false, interactive: false, opacity: 0 }
    const visited = stat.routeStations > 0
    if (!visited) {
      return {
        weight: 0.5,
        color: coverageColor,
        opacity: 0.14,
        fill: true,
        fillColor: coverageColor,
        fillOpacity: 0,
        interactive: true,
      }
    }
    const pct = Math.max(0, Math.min(100, stat.coveragePct))
    return {
      weight: 1,
      color: coverageColor,
      opacity: 0.5,
      fill: true,
      fillColor: coverageColor,
      fillOpacity: 0.14 + (pct / 100) * 0.34,
      interactive: true,
    }
  }

  const highlightStyle = (code?: string): PathOptions => {
    const base = baseStyle(code)
    if (!base.interactive) return base
    return {
      ...base,
      weight: 2.5,
      opacity: 0.95,
      fillOpacity: Math.max(base.fillOpacity ?? 0, 0.3),
    }
  }

  // Sidebar -> map link: re-style when the externally highlighted state changes.
  useEffect(() => {
    layersByCode.current.forEach((layer, code) => {
      layer.setStyle(code === highlightedState ? highlightStyle(code) : baseStyle(code))
      if (code === highlightedState) layer.bringToFront()
    })
    // baseStyle/highlightStyle close over the current (remounted) coverage data.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightedState])

  return (
    <GeoJSON
      data={US_STATES}
      style={(feature) => baseStyle(codeOf(feature))}
      onEachFeature={(feature, layer: Layer) => {
        const code = codeOf(feature as Feature<Geometry, { name: string }>)
        const path = layer as Path
        const stat = code ? coverageByCode.get(code) : undefined
        const name = (feature as Feature<Geometry, { name: string }>).properties?.name ?? ''
        if (!stat) return

        layersByCode.current.set(code!, path)
        path.bindTooltip(
          stat.routeStations > 0
            ? `${name} · ${stat.routeStations}/${stat.totalStations} sites · ${stat.coveragePct}%`
            : `${name} · not on this route`,
          { sticky: true, direction: 'top', className: 'sqp-state-tooltip' },
        )
        path.on({
          mouseover: () => {
            path.setStyle(highlightStyle(code))
            path.bringToFront()
            onHoverState?.(code)
          },
          mouseout: () => {
            path.setStyle(baseStyle(code))
            onHoverState?.(undefined)
          },
          click: () => onSelectState?.(code!),
        })
      }}
    />
  )
}

/**
 * Stop markers sized by zoom — at continent-level fit (small screens
 * especially) full-size beads would bury the route line, so they shrink
 * to dots and grow back as the user zooms in.
 */
function RouteStopMarkers({
  route,
  visits,
  nodeColor,
  connectorColor,
}: {
  route: RoutePlan
  visits: RouteStationVisit[]
  nodeColor: string
  connectorColor: string
}) {
  const zoom = useMapZoom()
  const scale = markerScaleForZoom(zoom)

  return (
    <>
      {visits.map((visit) => (
        <CircleMarker
          key={`${route.id}-${visit.sequence}-${visit.station.id}`}
          center={[visit.station.position.lat, visit.station.position.lon]}
          radius={
            (visit.connectorStop ? 3.5 : visit.sequence % 10 === 0 ? 5 : 4) * scale
          }
          pathOptions={{
            color: nodeColor,
            fillColor: visit.connectorStop ? connectorColor : route.color,
            fillOpacity: 0.95,
            opacity: 0.95,
            weight: Math.max(0.75, 1.5 * scale),
          }}
        >
          <Popup>
            <strong>
              {visit.sequence}. {visit.station.name}
            </strong>
            <br />
            Day {visit.day} · {Math.round(visit.legMiles)} mi leg ·{' '}
            {visit.stopMinutes} min stop
            {visit.connectorStop ? (
              <>
                <br />
                Transfer connector
              </>
            ) : null}
            <br />
            {visit.station.address.city}, {visit.station.address.state}
          </Popup>
        </CircleMarker>
      ))}
    </>
  )
}

function markerScaleForZoom(zoom: number) {
  if (zoom >= 7) return 1
  if (zoom >= 6) return 0.85
  if (zoom >= 5) return 0.7
  return 0.5
}

function RouteLine({
  route,
  roadLine,
  isDark,
  fitPadding,
}: {
  route: RoutePlan
  roadLine?: Coordinate[]
  isDark: boolean
  fitPadding: FitPadding
}) {
  const zoom = useMapZoom()
  const hasRoadLine = Boolean(roadLine?.length)
  const sourceLine = hasRoadLine ? roadLine! : route.routeLine
  const routePositions = useMemo(
    () =>
      downsampleLine(
        hasRoadLine
          ? simplifyPolyline(sourceLine, roadToleranceMilesForZoom(zoom))
          : sourceLine,
        maxPolylinePointsForZoom(zoom),
      ).map((point) => [point.lat, point.lon] as [number, number]),
    [hasRoadLine, sourceLine, zoom],
  )
  const fitPositions = useMemo(
    () =>
      downsampleLine(route.routeLine, MAX_POLYLINE_POINTS).map(
        (point) => [point.lat, point.lon] as [number, number],
      ),
    [route.routeLine],
  )
  const smoothFactor = hasRoadLine ? roadSmoothFactorForZoom(zoom) : 1

  return (
    <>
      <FitRoute
        positions={fitPositions}
        routeKey={`${route.id}-${hasRoadLine ? 'road' : 'estimate'}`}
        fitPadding={fitPadding}
      />
      {isDark && (
        <Polyline
          positions={routePositions}
          smoothFactor={smoothFactor}
          pathOptions={{
            color: route.color,
            opacity: 0.25,
            weight: hasRoadLine ? 16 : 13,
            lineCap: 'round',
            lineJoin: 'round',
          }}
        />
      )}
      <Polyline
        positions={routePositions}
        smoothFactor={smoothFactor}
        pathOptions={{
          color: '#ffffff',
          opacity: hasRoadLine ? 0.9 : 0.72,
          weight: hasRoadLine ? 9 : 7,
        }}
      />
      <Polyline
        positions={routePositions}
        smoothFactor={smoothFactor}
        pathOptions={{
          color: route.color,
          opacity: hasRoadLine ? 0.92 : 0.78,
          weight: hasRoadLine ? 4 : 3,
        }}
      />
    </>
  )
}

function DayHighlightLine({
  route,
  start,
  dayIndex,
  roadLine,
  isDark,
}: {
  route: RoutePlan
  start: Coordinate
  dayIndex?: number
  roadLine?: Coordinate[]
  isDark: boolean
}) {
  const zoom = useMapZoom()

  // Map each day boundary (start, then every day's last stop) onto an index in
  // the road geometry so a day's highlight traces the same drawn road line.
  const dayBoundaryIndices = useMemo(
    () =>
      roadLine?.length ? matchDayBoundaryIndices(roadLine, route.days, start) : undefined,
    [roadLine, route.days, start],
  )

  const roadPositions = useMemo(() => {
    if (dayIndex == null || !roadLine?.length || !dayBoundaryIndices) return undefined
    const from = dayBoundaryIndices[dayIndex]
    const to = dayBoundaryIndices[dayIndex + 1]
    if (from == null || to == null || to <= from) return undefined
    return downsampleLine(
      simplifyPolyline(roadLine.slice(from, to + 1), roadToleranceMilesForZoom(zoom)),
      maxPolylinePointsForZoom(zoom),
    ).map((point) => [point.lat, point.lon] as [number, number])
  }, [dayIndex, roadLine, dayBoundaryIndices, zoom])

  const positions = useMemo(() => {
    if (dayIndex == null) return []
    const day = route.days[dayIndex]
    if (!day || day.visits.length === 0) return []
    if (roadPositions) return roadPositions

    // No road geometry: straight legs between stops, matching the estimate line.
    const previousDay = route.days[dayIndex - 1]
    const previousStop = previousDay?.visits.at(-1)?.station.position ?? start
    const stops = [previousStop, ...day.visits.map((visit) => visit.station.position)]
    if (dayIndex === route.days.length - 1) stops.push(start)
    return stops.map((point) => [point.lat, point.lon] as [number, number])
  }, [dayIndex, route.days, start, roadPositions])

  if (positions.length < 2) return null

  const label = route.days[dayIndex ?? -1]?.day
  const smoothFactor = roadPositions ? roadSmoothFactorForZoom(zoom) : 1

  return (
    <>
      {isDark ? (
        <Polyline
          positions={positions}
          smoothFactor={smoothFactor}
          pathOptions={{
            color: route.color,
            opacity: 0.28,
            weight: 18,
            lineCap: 'round',
            lineJoin: 'round',
          }}
        />
      ) : null}
      <Polyline
        positions={positions}
        smoothFactor={smoothFactor}
        pathOptions={{
          color: '#ffffff',
          opacity: 0.98,
          weight: 12,
          lineCap: 'round',
          lineJoin: 'round',
        }}
      />
      <Polyline
        positions={positions}
        smoothFactor={smoothFactor}
        pathOptions={{
          color: route.color,
          opacity: 1,
          weight: 6,
          lineCap: 'round',
          lineJoin: 'round',
        }}
      >
        {label ? (
          <Tooltip sticky direction="top">
            Day {label}
          </Tooltip>
        ) : null}
      </Polyline>
    </>
  )
}

/**
 * Map trip-day boundaries (start, then each day's last stop) onto indices of
 * the road polyline. Scans monotonically so loops that revisit an area match
 * the pass in visiting order. Returns undefined when any stop sits farther
 * than the tolerance from the line — the geometry doesn't describe this route.
 */
function matchDayBoundaryIndices(
  roadLine: Coordinate[],
  days: DayPlan[],
  start: Coordinate,
): number[] | undefined {
  const boundaries: Coordinate[] = [start]
  for (const day of days) {
    boundaries.push(
      day.visits.at(-1)?.station.position ?? boundaries[boundaries.length - 1],
    )
  }

  const indices: number[] = []
  let searchFrom = 0
  for (const boundary of boundaries) {
    let bestIndex = searchFrom
    let bestMiles = Infinity
    for (let index = searchFrom; index < roadLine.length; index += 1) {
      const miles = haversineMiles(roadLine[index], boundary)
      if (miles < bestMiles) {
        bestMiles = miles
        bestIndex = index
      }
    }
    if (bestMiles > DAY_BOUNDARY_MATCH_TOLERANCE_MILES) return undefined
    indices.push(bestIndex)
    searchFrom = bestIndex
  }

  // The trip loops home: the last day's leg runs to the end of the road line.
  indices[indices.length - 1] = roadLine.length - 1
  return indices
}

function useMapZoom() {
  const map = useMap()
  const [zoom, setZoom] = useState(map.getZoom())

  useEffect(() => {
    const update = () => setZoom(map.getZoom())
    map.on('zoomend', update)
    return () => {
      map.off('zoomend', update)
    }
  }, [map])

  return zoom
}

function roadToleranceMilesForZoom(zoom: number) {
  if (zoom >= 10) return 0
  if (zoom >= 8) return 0.15
  if (zoom >= 6) return 0.75
  return ROAD_OVERVIEW_TOLERANCE_MILES
}

function roadSmoothFactorForZoom(zoom: number) {
  if (zoom >= 10) return 0.15
  if (zoom >= 8) return 0.6
  if (zoom >= 6) return 1.4
  return ROAD_POLYLINE_SMOOTH_FACTOR
}

function maxPolylinePointsForZoom(zoom: number) {
  if (zoom >= 10) return 50_000
  if (zoom >= 8) return 25_000
  if (zoom >= 6) return 10_000
  return MAX_POLYLINE_POINTS
}

/* ------------------------------------------------------------------ */
/* Keep Leaflet sized to the (flex-reflowing) container               */
/* ------------------------------------------------------------------ */
function ResizeHandler() {
  const map = useMap()
  useEffect(() => {
    const container = map.getContainer()
    const fix = () => map.invalidateSize({ animate: false })
    const observer = new ResizeObserver(fix)
    observer.observe(container)
    const raf = requestAnimationFrame(fix)
    const timer = window.setTimeout(fix, 250)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(raf)
      window.clearTimeout(timer)
    }
  }, [map])
  return null
}

/* ------------------------------------------------------------------ */
/* Custom zoom control — glass island, bottom-right (desktop only)     */
/* ------------------------------------------------------------------ */
function ZoomControl() {
  const map = useMap()
  return (
    <div className="glass absolute bottom-4 right-4 z-[800] hidden flex-col overflow-hidden rounded-[11px] md:flex">
      <button
        type="button"
        aria-label="Zoom in"
        onClick={() => map.zoomIn()}
        className="flex h-[38px] w-[38px] cursor-pointer items-center justify-center border-0 border-b border-glass-bd bg-transparent text-[19px] leading-none text-ink"
      >
        +
      </button>
      <button
        type="button"
        aria-label="Zoom out"
        onClick={() => map.zoomOut()}
        className="flex h-[38px] w-[38px] cursor-pointer items-center justify-center border-0 bg-transparent text-[19px] leading-none text-ink"
      >
        −
      </button>
    </div>
  )
}

function FitRoute({
  positions,
  routeKey,
  fitPadding,
}: {
  positions: [number, number][]
  routeKey: string
  fitPadding: FitPadding
}) {
  const map = useMap()

  useEffect(() => {
    if (positions.length < 2) return

    const fit = () =>
      map.fitBounds(positions, {
        paddingTopLeft: fitPadding.topLeft,
        paddingBottomRight: fitPadding.bottomRight,
        maxZoom: 7,
      })

    map.invalidateSize({ animate: false })
    const size = map.getSize()
    if (size.x > 0 && size.y > 0) {
      fit()
      return
    }

    // Container has no layout yet (e.g. hidden or 0-sized viewport) —
    // fitting now would clamp to maxZoom. Fit once it gains real size.
    const onResize = () => {
      const next = map.getSize()
      if (next.x > 0 && next.y > 0) {
        map.off('resize', onResize)
        fit()
      }
    }
    map.on('resize', onResize)
    return () => {
      map.off('resize', onResize)
    }
    // Refit only when the route changes, not on every padding tweak.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, positions, routeKey])

  return null
}

function downsampleLine(points: Coordinate[], maxPoints: number) {
  if (points.length <= maxPoints) return points

  const step = (points.length - 1) / (maxPoints - 1)
  return Array.from({ length: maxPoints }, (_, index) => {
    if (index === maxPoints - 1) return points[points.length - 1]
    return points[Math.round(index * step)]
  })
}

function selectRouteMarkers(visits: RouteStationVisit[], maxMarkers: number) {
  if (visits.length <= maxMarkers) return visits

  const stride = Math.ceil(visits.length / maxMarkers)
  return visits.filter(
    (visit, index) =>
      index === 0 ||
      index === visits.length - 1 ||
      isDayBoundaryVisit(visits, index) ||
      isSharpTurnVisit(visits, index) ||
      visit.sequence % 10 === 0 ||
      index % stride === 0,
  )
}

function isDayBoundaryVisit(visits: RouteStationVisit[], index: number) {
  const previous = visits[index - 1]
  const current = visits[index]
  const next = visits[index + 1]

  return current.day !== previous?.day || current.day !== next?.day
}

function isSharpTurnVisit(visits: RouteStationVisit[], index: number) {
  const previous = visits[index - 1]
  const current = visits[index]
  const next = visits[index + 1]
  if (!previous || !next) return false

  const inboundMiles = haversineMiles(
    previous.station.position,
    current.station.position,
  )
  const outboundMiles = haversineMiles(
    current.station.position,
    next.station.position,
  )
  if (
    inboundMiles < TURN_MARKER_MIN_LEG_MILES ||
    outboundMiles < TURN_MARKER_MIN_LEG_MILES
  ) {
    return false
  }

  return (
    angleDifferenceDegrees(
      bearingDegrees(previous.station.position, current.station.position),
      bearingDegrees(current.station.position, next.station.position),
    ) >= TURN_MARKER_MIN_ANGLE_DEGREES
  )
}

function bearingDegrees(from: Coordinate, to: Coordinate) {
  const fromLat = toRadians(from.lat)
  const toLat = toRadians(to.lat)
  const deltaLon = toRadians(to.lon - from.lon)
  const y = Math.sin(deltaLon) * Math.cos(toLat)
  const x =
    Math.cos(fromLat) * Math.sin(toLat) -
    Math.sin(fromLat) * Math.cos(toLat) * Math.cos(deltaLon)

  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
}

function angleDifferenceDegrees(a: number, b: number) {
  const difference = Math.abs(a - b) % 360
  return difference > 180 ? 360 - difference : difference
}

function toRadians(value: number) {
  return (value * Math.PI) / 180
}
