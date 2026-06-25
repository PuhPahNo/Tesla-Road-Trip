import { memo, useEffect, useMemo, useState } from 'react'
import {
  CircleMarker,
  MapContainer,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from 'react-leaflet'
import type { StateRouteStats } from '../domain/routeStats'
import type { Coordinate, RoutePlan, Station } from '../domain/types'
import { useTheme } from '../theme/theme'
import { cx, IconButton } from '../ui/primitives'
import { MinusIcon, PlusIcon } from '../ui/icons'

interface MapViewProps {
  stations: Station[]
  route?: RoutePlan
  start: Coordinate
  showAllStations: boolean
  roadLine?: Coordinate[]
  stateStats?: StateRouteStats[]
  onSelectState?: (state: string) => void
  caption?: string
}

const STATE_LABELS = [
  ['WA', 'Washington', 47.4, -120.7],
  ['OR', 'Oregon', 44.0, -120.6],
  ['CA', 'California', 37.2, -119.7],
  ['ID', 'Idaho', 44.2, -114.6],
  ['NV', 'Nevada', 39.4, -116.6],
  ['MT', 'Montana', 46.9, -110.4],
  ['WY', 'Wyoming', 43.0, -107.6],
  ['UT', 'Utah', 39.3, -111.7],
  ['AZ', 'Arizona', 34.2, -111.7],
  ['CO', 'Colorado', 39.0, -105.6],
  ['NM', 'New Mexico', 34.4, -106.1],
  ['ND', 'North Dakota', 47.5, -100.5],
  ['SD', 'South Dakota', 44.4, -100.0],
  ['NE', 'Nebraska', 41.5, -99.8],
  ['KS', 'Kansas', 38.5, -98.0],
  ['OK', 'Oklahoma', 35.6, -97.5],
  ['TX', 'Texas', 31.0, -99.2],
  ['MN', 'Minnesota', 46.0, -94.5],
  ['IA', 'Iowa', 42.1, -93.5],
  ['MO', 'Missouri', 38.5, -92.4],
  ['AR', 'Arkansas', 35.0, -92.4],
  ['LA', 'Louisiana', 31.0, -92.0],
  ['WI', 'Wisconsin', 44.6, -89.8],
  ['IL', 'Illinois', 40.0, -89.2],
  ['MI', 'Michigan', 44.3, -85.4],
  ['IN', 'Indiana', 39.9, -86.3],
  ['OH', 'Ohio', 40.3, -82.8],
  ['KY', 'Kentucky', 37.6, -85.3],
  ['TN', 'Tennessee', 35.8, -86.4],
  ['MS', 'Mississippi', 32.7, -89.7],
  ['AL', 'Alabama', 32.8, -86.7],
  ['GA', 'Georgia', 32.7, -83.4],
  ['FL', 'Florida', 28.1, -81.7],
  ['SC', 'South Carolina', 33.8, -80.9],
  ['NC', 'North Carolina', 35.5, -79.4],
  ['VA', 'Virginia', 37.5, -78.8],
  ['WV', 'West Virginia', 38.6, -80.6],
  ['PA', 'Pennsylvania', 41.0, -77.8],
  ['NY', 'New York', 42.9, -75.0],
  ['ME', 'Maine', 45.1, -69.0],
  ['VT', 'Vermont', 44.0, -72.7],
  ['NH', 'New Hampshire', 43.9, -71.6],
  ['MA', 'Massachusetts', 42.2, -71.8],
  ['CT', 'Connecticut', 41.6, -72.7],
  ['RI', 'Rhode Island', 41.7, -71.6],
  ['NJ', 'New Jersey', 40.1, -74.7],
  ['DE', 'Delaware', 39.1, -75.5],
  ['MD', 'Maryland', 39.0, -76.7],
  ['DC', 'District of Columbia', 38.9, -77.0],
] as const

const MAX_ROUTE_MARKERS = 220
const MAX_POLYLINE_POINTS = 3500

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
  caption,
}: MapViewProps) {
  const { theme, isDark } = useTheme()
  // preferCanvas means Leaflet vector strokes/fills are painted to <canvas>,
  // which cannot resolve CSS var(), so theme colors are picked here in JS.
  const ink = isDark ? '#e9edf2' : '#171a20'
  const node = isDark ? '#0e131a' : '#ffffff'
  const faintLine = isDark ? '#3a4150' : '#475569'
  const faintFill = isDark ? '#4b5563' : '#94a3b8'
  const stateStatsByCode = useMemo(
    () => new Map(stateStats.map((state) => [state.state, state])),
    [stateStats],
  )
  const rawRouteLine = roadLine ?? route?.routeLine
  const routePositions = useMemo(
    () => downsampleLine(rawRouteLine ?? [], MAX_POLYLINE_POINTS).map(
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
      <StateClickOverlay
        stateStatsByCode={stateStatsByCode}
        onSelectState={onSelectState}
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
            pathOptions={{
              color: '#ffffff',
              opacity: roadLine ? 0.9 : 0.72,
              weight: roadLine ? 9 : 7,
            }}
          />
          <Polyline
            positions={routePositions}
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
                <strong>{visit.sequence}. {visit.station.name}</strong>
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
/* Custom zoom control (top-left, 16px inset)                          */
/* ------------------------------------------------------------------ */
/**
 * Keep Leaflet's canvas/panes sized to the container. The map lives in a flex
 * layout that reflows when the drawer collapses, the sidebar/sheets toggle, or
 * the device rotates — without this the route canvas can render at 0 height.
 */
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
          <span className="h-[9px] w-[9px] flex-none rounded-[3px] border border-good-bd bg-good-bg" />
          Visited state
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

interface StateClickOverlayProps {
  stateStatsByCode: Map<string, StateRouteStats>
  onSelectState?: (state: string) => void
}

function StateClickOverlay({
  stateStatsByCode,
  onSelectState,
}: StateClickOverlayProps) {
  const map = useMap()
  const [points, setPoints] = useState<
    Array<{
      state: string
      label: string
      x: number
      y: number
      stats?: StateRouteStats
    }>
  >([])
  const [isMoving, setIsMoving] = useState(false)

  useEffect(() => {
    const updatePoints = () => {
      setPoints(
        STATE_LABELS.map(([state, label, lat, lon]) => {
          const point = map.latLngToContainerPoint([lat, lon])
          return {
            state,
            label,
            x: point.x,
            y: point.y,
            stats: stateStatsByCode.get(state),
          }
        }),
      )
      setIsMoving(false)
    }
    const markMoving = () => setIsMoving(true)

    updatePoints()
    map.on('movestart zoomstart', markMoving)
    map.on('moveend zoomend resize', updatePoints)

    return () => {
      map.off('movestart zoomstart', markMoving)
      map.off('moveend zoomend resize', updatePoints)
    }
  }, [map, stateStatsByCode])

  return (
    <div
      className={cx(
        'pointer-events-none absolute inset-0 z-[650] transition-opacity duration-200',
        isMoving ? 'opacity-0' : 'opacity-100',
      )}
      aria-label="State map shortcuts"
    >
      {points.map(({ state, label, x, y, stats }) => {
        const isVisited = Boolean(stats && stats.routeStations > 0)
        const isClickable = Boolean(stats && onSelectState)

        return (
          <button
            key={state}
            type="button"
            aria-label={`${label} state details`}
            disabled={!isClickable}
            style={{ left: x, top: y }}
            title={
              stats
                ? `${label}: ${stats.routeStations} of ${stats.totalStations} sites`
                : label
            }
            className={cx(
              'pointer-events-auto absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-px rounded-lg px-[7px] py-1 font-mono leading-none whitespace-nowrap transition cursor-pointer disabled:cursor-default',
              isVisited
                ? 'z-[4] border border-good-bd bg-good-bg text-good shadow-card'
                : stats
                  ? 'z-[2] border border-idle-bd bg-idle-bg text-idle'
                  : 'z-[2] border border-idle-bd bg-idle-bg text-idle opacity-70',
            )}
            onClick={(event) => {
              event.stopPropagation()
              if (stats) onSelectState?.(state)
            }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <span className="text-[11px] font-semibold tracking-[0.02em]">{state}</span>
            {isVisited && stats && (
              <span className="text-[9.5px] leading-none opacity-85">
                {stats.routeStations}/{stats.totalStations}
              </span>
            )}
          </button>
        )
      })}
    </div>
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

function selectRouteMarkers<
  T extends {
    sequence: number
  },
>(visits: T[], maxMarkers: number) {
  if (visits.length <= maxMarkers) return visits

  const stride = Math.ceil(visits.length / maxMarkers)
  return visits.filter(
    (visit, index) =>
      index === 0 ||
      index === visits.length - 1 ||
      visit.sequence % 10 === 0 ||
      index % stride === 0,
  )
}
