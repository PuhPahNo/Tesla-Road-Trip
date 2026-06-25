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

interface MapViewProps {
  stations: Station[]
  route?: RoutePlan
  start: Coordinate
  showAllStations: boolean
  roadLine?: Coordinate[]
  stateStats?: StateRouteStats[]
  onSelectState?: (state: string) => void
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

export const MapView = memo(function MapView({
  stations,
  route,
  start,
  showAllStations,
  roadLine,
  stateStats = [],
  onSelectState,
}: MapViewProps) {
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
      className="planner-map"
      center={[start.lat, start.lon]}
      preferCanvas
      zoom={5}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        detectRetina
        subdomains="abcd"
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
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
              color: '#475569',
              fillColor: '#94a3b8',
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
          color: '#111827',
          fillColor: '#ffffff',
          fillOpacity: 1,
          weight: 3,
        }}
      >
        <Tooltip direction="top" offset={[0, -4]}>
          Chattanooga start/end
        </Tooltip>
      </CircleMarker>

      {route && (
        <>
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
                color: route.color,
                fillColor: '#ffffff',
                fillOpacity: 0.92,
                opacity: 0.95,
                weight: 2,
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
    </MapContainer>
  )
})

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
      className={`state-click-overlay ${isMoving ? 'moving' : ''}`}
      aria-label="State map shortcuts"
    >
      {points.map(({ state, label, x, y, stats }) => {
        const isVisited = Boolean(stats && stats.routeStations > 0)
        const isClickable = Boolean(stats && onSelectState)

        return (
          <button
            key={state}
            aria-label={`${label} state details`}
            className={`state-map-button ${isVisited ? 'visited' : ''}`}
            disabled={!isClickable}
            style={{ left: x, top: y }}
            title={
              stats
                ? `${label}: ${stats.routeStations} of ${stats.totalStations} sites`
                : label
            }
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              if (stats) onSelectState?.(state)
            }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <span>{state}</span>
            {isVisited && stats && (
              <strong>
                {stats.routeStations}/{stats.totalStations}
              </strong>
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
    ;(window as Window & { __questMap?: typeof map }).__questMap = map
  }, [map])

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
