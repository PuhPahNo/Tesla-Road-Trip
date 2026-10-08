import type { Coordinate, RoutePlan } from './types'

/** Frame a window around a day, keeping a full window at either end. */
export function routeDayWindowPositions(
  route: RoutePlan,
  start: Coordinate,
  dayIndex: number,
  dayCount: number,
): [number, number][] {
  const count = Math.min(route.days.length, Math.max(1, dayCount))
  const first = Math.max(0, Math.min(dayIndex - Math.floor(count / 2), route.days.length - count))
  const days = route.days.slice(first, first + count)
  if (!days.length) return []

  const previous = route.days[first - 1]
  const positions = [previous?.overnight?.position ?? previous?.visits.at(-1)?.station.position ?? start]
  for (const day of days) {
    positions.push(...day.visits.map((visit) => visit.station.position))
    if (day.overnight) positions.push(day.overnight.position)
  }
  if (first + count === route.days.length) positions.push(start)
  return positions.map((point) => [point.lat, point.lon])
}
