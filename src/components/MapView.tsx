import { memo, useEffect, useMemo, useRef } from 'react'
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
import type { Coordinate, RoutePlan, RouteStationVisit, Station } from '../domain/types'
import { haversineMiles, simplifyPolyline } from '../domain/geo'
import { STATE_NAME_TO_CODE } from '../domain/usStates'
import usStatesRaw from '../assets/us-states.json'
import { useTheme } from '../theme/theme'
import { IconButton } from '../ui/primitives'
import { MinusIcon, PlusIcon } from '../ui/icons'

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
  caption?: string
}

const US_STATES = usStatesRaw as unknown as FeatureCollection<Geometry, { name: string }>

const MAX_ROUTE_MARKERS = 360
const MAX_POLYLINE_POINTS = 3500
const ROAD_OVERVIEW_TOLERANCE_MILES = 6
const ROAD_POLYLINE_SMOOTH_FACTOR = 3.5
const TURN_MARKER_MIN_LEG_MILES = 12
const TURN_MARKER_MIN_ANGLE_DEGREES = 105

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
  caption,
}: MapViewProps) {
  const { theme, isDark } = useTheme()
  // preferCanvas means Leaflet vector strokes/fills are painted to <canvas>,
  // which cannot resolve CSS var(), so theme colors are picked here in JS.
  const ink = isDark ? '#e9edf2' : '#171a20'
  const node = isDark ? '#0e131a' : '#ffffff'
  const faintLine = isDark ? '#3a4150' : '#475569'
  const faintFill = isDark ? '#4b5563' : '#94a3b8'
  const coverage = isDark ? '#0bd5d0' : '#0f7d6b'

  const coverageByCode = useMemo(
    () => new Map(stateStats.map((state) => [state.state, state])),
    [stateStats],
  )
  const rawRouteLine = useMemo(
    () =>
      roadLine
        ? simplifyPolyline(roadLine, ROAD_OVERVIEW_TOLERANCE_MILES)
        : route?.routeLine,
    [roadLine, route?.routeLine],
  )
  const routePositions = useMemo(
    () =>
      downsampleLine(rawRouteLine ?? [], MAX_POLYLINE_POINTS).map(
        (point) => [point.lat, point.lon] as [number, number],
      ),
    [rawRouteLine],
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

      {route && <FitRoute positions={routePositions} />}
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
          {isDark && (
            <Polyline
              positions={routePositions}
              smoothFactor={roadLine ? ROAD_POLYLINE_SMOOTH_FACTOR : 1}
              pathOptions={{
                color: route.color,
                opacity: 0.25,
                weight: roadLine ? 16 : 13,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          )}
          <Polyline
            positions={routePositions}
            smoothFactor={roadLine ? ROAD_POLYLINE_SMOOTH_FACTOR : 1}
            pathOptions={{
              color: '#ffffff',
              opacity: roadLine ? 0.9 : 0.72,
              weight: roadLine ? 9 : 7,
            }}
          />
          <Polyline
            positions={routePositions}
            smoothFactor={roadLine ? ROAD_POLYLINE_SMOOTH_FACTOR : 1}
            pathOptions={{
              color: route.color,
              opacity: roadLine ? 0.92 : 0.78,
              weight: roadLine ? 4 : 3,
            }}
          />
          {routeVisits.map((visit) => (
            <CircleMarker
              key={`${route.id}-${visit.sequence}-${visit.station.id}`}
              center={[visit.station.position.lat, visit.station.position.lon]}
              radius={visit.sequence % 10 === 0 ? 5 : 4}
              pathOptions={{
                color: node,
                fillColor: route.color,
                fillOpacity: 0.95,
                opacity: 0.95,
                weight: 1.5,
              }}
            >
              <Popup>
                <strong>
                  {visit.sequence}. {visit.station.name}
                </strong>
                <br />
                Day {visit.day} · {Math.round(visit.legMiles)} mi leg ·{' '}
                {visit.stopMinutes} min stop
                <br />
                {visit.station.address.city}, {visit.station.address.state}
              </Popup>
            </CircleMarker>
          ))}
        </>
      )}

      <MapChrome caption={caption} />
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
/* Custom zoom control (top-left)                                      */
/* ------------------------------------------------------------------ */
function ZoomControl() {
  const map = useMap()
  return (
    <div className="absolute left-4 top-4 z-[800] flex flex-col overflow-hidden rounded-[9px] border border-edge bg-panel shadow-card">
      <IconButton
        label="Zoom in"
        size={44}
        className="rounded-none border-0 border-b border-edge bg-panel"
        onClick={() => map.zoomIn()}
      >
        <PlusIcon size={18} />
      </IconButton>
      <IconButton
        label="Zoom out"
        size={44}
        className="rounded-none border-0 bg-panel"
        onClick={() => map.zoomOut()}
      >
        <MinusIcon size={18} />
      </IconButton>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Legend (bottom-left) + caption (bottom-right)                       */
/* ------------------------------------------------------------------ */
function MapChrome({ caption }: { caption?: string }) {
  return (
    <>
      <div className="absolute bottom-4 left-4 z-[800] hidden max-w-[calc(100%-2rem)] flex-wrap items-center gap-x-4 gap-y-1.5 rounded-[9px] border border-edge bg-panel px-3 py-2 text-[11.5px] text-dim shadow-card md:flex">
        <span className="flex items-center gap-[7px]">
          <span className="h-[3px] w-[18px] flex-none rounded-[2px] bg-route" />
          Route
        </span>
        <span className="flex items-center gap-[7px]">
          <span
            className="h-[10px] w-[18px] flex-none rounded-[3px]"
            style={{
              background:
                'linear-gradient(90deg, color-mix(in srgb, var(--accent-2) 16%, transparent), var(--accent-2))',
            }}
          />
          State coverage
        </span>
        <span className="flex items-center gap-[7px]">
          <span className="h-2 w-2 flex-none rounded-full border-[1.5px] border-node bg-route" />
          Supercharger
        </span>
      </div>

      {caption ? (
        <div className="pointer-events-none absolute bottom-4 right-4 z-[800] hidden font-mono text-[10px] uppercase tracking-[0.04em] text-faint md:block">
          {caption}
        </div>
      ) : null}
    </>
  )
}

function FitRoute({ positions }: { positions: [number, number][] }) {
  const map = useMap()

  useEffect(() => {
    if (positions.length < 2) return
    map.fitBounds(positions, {
      padding: [28, 28],
      maxZoom: 7,
    })
  }, [map, positions])

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
