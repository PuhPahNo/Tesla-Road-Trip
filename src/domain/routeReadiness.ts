import type { RoutePlan } from './types'

export type RouteRangeStatus =
  | 'road_ready'
  | 'road_gaps'
  | 'estimate_clear'
  | 'estimate_gaps'

export interface RouteRangeReadiness {
  status: RouteRangeStatus
  distanceSource: 'estimate' | 'road'
  rangeGapCount: number
  rangeChecked: boolean
}

export function routeRangeReadiness(route: RoutePlan): RouteRangeReadiness {
  const distanceSource = route.distanceSource ?? 'estimate'
  const returnRangeGaps = route.days.filter((day) =>
    day.warnings.some((warning) => warning.startsWith('Return leg is ')),
  ).length
  const rangeGapCount =
    route.visits.filter((visit) => visit.rangeWarning).length + returnRangeGaps
  const rangeChecked = distanceSource === 'road'
  return {
    distanceSource,
    rangeGapCount,
    rangeChecked,
    status: rangeChecked
      ? rangeGapCount === 0
        ? 'road_ready'
        : 'road_gaps'
      : rangeGapCount === 0
        ? 'estimate_clear'
        : 'estimate_gaps',
  }
}

export function preferredRouteId(routes: RoutePlan[]) {
  return [...routes]
    .sort((left, right) => {
      const leftReadiness = routeRangeReadiness(left)
      const rightReadiness = routeRangeReadiness(right)
      return (
        Number(leftReadiness.rangeGapCount > 0) -
          Number(rightReadiness.rangeGapCount > 0) ||
        leftReadiness.rangeGapCount - rightReadiness.rangeGapCount ||
        left.warnings.length - right.warnings.length ||
        right.rating.score - left.rating.score
      )
    })[0]?.id
}
