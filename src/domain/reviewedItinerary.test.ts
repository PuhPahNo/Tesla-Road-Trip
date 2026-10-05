import { describe, expect, it } from 'vitest'
import { aggregateReviewedRoadLegs, buildReviewedRoadPlan } from './reviewedItinerary'
import type { SavedCustomRoute, Station } from './types'

const start = {lat: 35, lon: -85}
const stations = [36, 37].map((lat, i) => ({id: `s-${i}`, position: {lat, lon: -85}})) as Station[]
const route: SavedCustomRoute = {
  id: 'reviewed', name: 'Reviewed', color: 'red', waypoints: [], createdAt: 'now', updatedAt: 'now',
  dailyStationIds: stations.map(s => s.id), reviewedDayStopCounts: [1, 1],
  reviewedDayDetails: [
    {primaryChargeIndex: 0, overnight: {label: 'First hotel area', position: {lat: 36.5, lon: -85}}},
    {primaryChargeIndex: 0, overnight: {label: 'Home', position: start}},
  ],
}

describe('overnight driving and charging range', () => {
  it('assigns post-charge hotel miles to today and battery consumption to the next charging leg', () => {
    const plan = buildReviewedRoadPlan(start, stations, route)
    expect(plan.coordinates).toEqual([start, stations[0].position, route.reviewedDayDetails![0].overnight.position, stations[1].position, start, start])
    const result = aggregateReviewedRoadLegs(plan, [100, 20, 80, 40, 0], [2, .5, 1.5, 1, 0])
    expect(result.legMiles).toEqual([120, 120, 0])
    expect(result.chargeLegMiles).toEqual([100, 100, 40])
    expect(result.driveHours).toEqual([2.5, 2.5, 0])
  })

  it('retains the original loop geometry for routes without overnight details', () => {
    const plan = buildReviewedRoadPlan(start, stations)
    expect(plan.coordinates).toEqual([start, ...stations.map(s => s.position), start])
    const result = aggregateReviewedRoadLegs(plan, [100, 80, 120], [2, 1.5, 3])
    expect(result.legMiles).toEqual([100, 80, 120])
    expect(result.chargeLegMiles).toEqual(result.legMiles)
  })
})
