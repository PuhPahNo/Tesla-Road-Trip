import type { Coordinate, DayPlan, ReviewedDayDetail, SavedCustomRoute, Station } from './types'

/** Keep calendar driving separate from mileage between actual charging options. */
export function buildReviewedRoadPlan(start: Coordinate, stations: Station[], route?: SavedCustomRoute) {
  const coordinates = [start]
  const segmentOwners: number[] = []
  const rangeOwners: number[] = []
  const counts = route?.reviewedDayStopCounts ?? stations.map(() => 1)
  const details = route?.reviewedDayDetails
  if (counts.reduce((sum, count) => sum + count, 0) !== stations.length) {
    throw new Error('Reviewed day boundaries must match the ordered charging options before road refinement.')
  }
  let visitIndex = 0
  for (const [dayIndex, count] of counts.entries()) {
    for (let stop = 0; stop < count; stop++) {
      coordinates.push(stations[visitIndex].position)
      segmentOwners.push(visitIndex)
      rangeOwners.push(visitIndex++)
    }
    if (details) {
      coordinates.push(details[dayIndex].overnight.position)
      segmentOwners.push(visitIndex - 1)
      // The drive after today's charge consumes range before the next charge.
      rangeOwners.push(visitIndex)
    }
  }
  coordinates.push(start)
  segmentOwners.push(details ? visitIndex - 1 : visitIndex)
  rangeOwners.push(visitIndex)
  return { coordinates, segmentOwners, rangeOwners, visitCount: visitIndex }
}

export function aggregateReviewedRoadLegs(
  plan: ReturnType<typeof buildReviewedRoadPlan>, miles: number[], rawHours: number[],
) {
  const legMiles = Array<number>(plan.visitCount + 1).fill(0)
  const driveHours = legMiles.slice()
  const chargeLegMiles = legMiles.slice()
  for (let index = 0; index < plan.segmentOwners.length; index++) {
    legMiles[plan.segmentOwners[index]] += miles[index]
    driveHours[plan.segmentOwners[index]] += rawHours[index]
    chargeLegMiles[plan.rangeOwners[index]] += miles[index]
  }
  return { legMiles, driveHours, chargeLegMiles }
}

export function applyReviewedDayDetails(days: DayPlan[], details?: ReviewedDayDetail[]): DayPlan[] {
  if (!details) return days
  return days.map((day, index) => ({ ...day, ...details[index], stay: details[index].stay }))
}

export function suggestedVisits(day: DayPlan) {
  return day.primaryChargeIndex === undefined ? day.visits : [day.visits[day.primaryChargeIndex]]
}

export function dayDestination(day: DayPlan) {
  return day.overnight?.label ?? [...new Set(day.visits.map(v => v.station.address.city))].slice(0, 3).join(' · ')
}

export function stayLabel(day: DayPlan) {
  return day.stay ? `${day.stay.isOvernight === false ? 'visit day' : 'night'} ${day.stay.night}/${day.stay.totalNights}` : ''
}
