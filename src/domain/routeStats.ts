import {
  dedupeHighlights,
  stationHighlights,
  type StationHighlight,
} from './highlights'
import type { RoutePlan, RouteStationVisit, Station } from './types'

export interface StateRouteStats {
  state: string
  country: string
  routeStations: number
  totalStations: number
  coveragePct: number
  miles: number
  driveHours: number
  stopMinutes: number
  days: number[]
  cities: string[]
  averageDistanceBetweenSuperchargers: number
  highlights: StationHighlight[]
  visits: RouteStationVisit[]
}

export function buildStateRouteStats(
  route: RoutePlan | undefined,
  stations: Station[],
): StateRouteStats[] {
  return buildStateStats(route, stations, false)
}

export function buildAllStateRouteStats(
  route: RoutePlan | undefined,
  stations: Station[],
): StateRouteStats[] {
  return buildStateStats(route, stations, true)
}

function buildStateStats(
  route: RoutePlan | undefined,
  stations: Station[],
  includeEmptyStates: boolean,
): StateRouteStats[] {
  if (!route && !includeEmptyStates) return []

  const totals = stations.reduce<Record<string, { total: number; country: string }>>(
    (counts, station) => {
      const key = station.address.state
      counts[key] = {
        total: (counts[key]?.total ?? 0) + 1,
        country: station.address.country,
      }
      return counts
    },
    {},
  )

  const grouped = (route?.visits ?? []).reduce<Record<string, RouteStationVisit[]>>(
    (groups, visit) => {
      const key = visit.station.address.state
      groups[key] = [...(groups[key] ?? []), visit]
      return groups
    },
    {},
  )
  const stateKeys = includeEmptyStates
    ? Object.keys(totals)
    : Object.keys(grouped)

  return stateKeys
    .map((state) => {
      const visits = grouped[state] ?? []
      const miles = visits.reduce((sum, visit) => sum + visit.legMiles, 0)
      const driveHours = visits.reduce((sum, visit) => sum + visit.driveHours, 0)
      const stopMinutes = visits.reduce((sum, visit) => sum + visit.stopMinutes, 0)
      const days = uniqueNumbers(visits.map((visit) => visit.day))
      const cities = uniqueStrings(
        visits.map((visit) => visit.station.address.city),
      )
      const totalStations = totals[state]?.total ?? visits.length
      const highlights = dedupeHighlights(
        visits.flatMap((visit) => stationHighlights(visit.station)),
      )

      return {
        state,
        country: totals[state]?.country ?? visits[0]?.station.address.country ?? '',
        routeStations: visits.length,
        totalStations,
        coveragePct:
          totalStations > 0 ? Math.round((visits.length / totalStations) * 1000) / 10 : 0,
        miles: Math.round(miles),
        driveHours: Math.round(driveHours * 10) / 10,
        stopMinutes: Math.round(stopMinutes),
        days,
        cities,
        averageDistanceBetweenSuperchargers:
          visits.length > 0 ? Math.round((miles / visits.length) * 10) / 10 : 0,
        highlights,
        visits,
      }
    })
    .sort(
      (a, b) =>
        b.routeStations - a.routeStations ||
        b.coveragePct - a.coveragePct ||
        a.state.localeCompare(b.state),
    )
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b))
}

function uniqueNumbers(values: number[]) {
  return Array.from(new Set(values)).sort((a, b) => a - b)
}
