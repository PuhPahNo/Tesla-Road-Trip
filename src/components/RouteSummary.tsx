import { AlertTriangle, Clock3, Gauge, Info, MapPinned, Route } from 'lucide-react'
import type { RoutePlan } from '../domain/types'

interface RouteSummaryProps {
  routes: RoutePlan[]
  selectedRouteId?: string
  onSelectRoute: (routeId: string) => void
}

export function RouteSummary({
  routes,
  selectedRouteId,
  onSelectRoute,
}: RouteSummaryProps) {
  if (routes.length === 0) {
    return (
      <section className="empty-panel">
        <MapPinned size={22} />
        <h2>No route generated yet</h2>
        <p>Open configuration, set a station target, then optimize.</p>
      </section>
    )
  }

  return (
    <section className="route-list" aria-label="Route candidates">
      {routes.map((route) => (
        <button
          key={route.id}
          className={`route-option ${route.id === selectedRouteId ? 'active' : ''}`}
          type="button"
          onClick={() => onSelectRoute(route.id)}
          style={{ borderColor: route.id === selectedRouteId ? route.color : undefined }}
        >
          <span className="route-swatch" style={{ background: route.color }} />
          <span className="route-option-main">
            <strong>{route.name}</strong>
            <span>{route.uniqueStations.toLocaleString()} sites · {route.totalDays} days · {route.totalMiles.toLocaleString()} mi</span>
          </span>
          {route.warnings.length > 0 ? (
            <AlertTriangle size={16} />
          ) : route.advisories.length > 0 ? (
            <Info size={16} />
          ) : null}
        </button>
      ))}
    </section>
  )
}

export function SelectedRouteStats({ route }: { route?: RoutePlan }) {
  if (!route) return null

  return (
    <section className="stats-grid" aria-label="Selected route statistics">
      <Stat icon={<MapPinned size={17} />} label="Unique sites" value={route.uniqueStations.toLocaleString()} />
      <Stat icon={<Route size={17} />} label="Miles" value={route.totalMiles.toLocaleString()} />
      <Stat icon={<Clock3 size={17} />} label="Days" value={String(route.totalDays)} />
      <Stat icon={<Gauge size={17} />} label="Avg drive/day" value={`${route.averageDriveHoursPerDay}h`} />
    </section>
  )
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="stat">
      <span className="stat-label">
        {icon}
        {label}
      </span>
      <strong>{value}</strong>
    </div>
  )
}
