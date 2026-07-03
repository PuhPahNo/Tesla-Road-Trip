import { STATE_CODE_TO_NAME } from './usStates'
import { PLACE_CATALOG, type PlaceCategory } from './placeCatalog'
import type { Coordinate, LongestTripVisitTargetType } from './types'

export interface LongestTripDestination {
  id: string
  type: Exclude<LongestTripVisitTargetType, 'state'>
  label: string
  state: string
  position: Coordinate
  radiusMiles: number
  categories: PlaceCategory[]
  priority: number
}

export interface LongestTripStateTarget {
  id: string
  type: 'state'
  label: string
  state: string
  position: Coordinate
}

const LOWER_48_AND_DC = new Set(
  Object.keys(STATE_CODE_TO_NAME).filter(
    (code) => !['AK', 'HI', 'PR'].includes(code),
  ),
)

const STATE_TARGET_DATA: Array<[string, number, number]> = [
  ['AL', 32.8067, -86.7911],
  ['AZ', 34.2744, -111.6602],
  ['AR', 34.8938, -92.4426],
  ['CA', 37.1841, -119.4696],
  ['CO', 38.9972, -105.5478],
  ['CT', 41.6219, -72.7273],
  ['DE', 38.9896, -75.505],
  ['DC', 38.9072, -77.0369],
  ['FL', 28.6305, -82.4497],
  ['GA', 32.6415, -83.4426],
  ['ID', 44.3509, -114.613],
  ['IL', 40.0417, -89.1965],
  ['IN', 39.8942, -86.2816],
  ['IA', 42.0751, -93.496],
  ['KS', 38.4937, -98.3804],
  ['KY', 37.5347, -85.3021],
  ['LA', 31.0689, -91.9968],
  ['ME', 45.3695, -69.2428],
  ['MD', 39.055, -76.7909],
  ['MA', 42.2596, -71.8083],
  ['MI', 44.3467, -85.4102],
  ['MN', 46.2807, -94.3053],
  ['MS', 32.7364, -89.6678],
  ['MO', 38.3566, -92.458],
  ['MT', 47.0527, -109.6333],
  ['NE', 41.5378, -99.7951],
  ['NV', 39.3289, -116.6312],
  ['NH', 43.6805, -71.5811],
  ['NJ', 40.1907, -74.6728],
  ['NM', 34.4071, -106.1126],
  ['NY', 42.9538, -75.5268],
  ['NC', 35.5557, -79.3877],
  ['ND', 47.4501, -100.4659],
  ['OH', 40.2862, -82.7937],
  ['OK', 35.5889, -97.4943],
  ['OR', 43.9336, -120.5583],
  ['PA', 40.8781, -77.7996],
  ['RI', 41.6762, -71.5562],
  ['SC', 33.9169, -80.8964],
  ['SD', 44.4443, -100.2263],
  ['TN', 35.858, -86.3505],
  ['TX', 31.4757, -99.3312],
  ['UT', 39.3055, -111.6703],
  ['VT', 44.0687, -72.6658],
  ['VA', 37.5215, -78.8537],
  ['WA', 47.3826, -120.4472],
  ['WV', 38.6409, -80.6227],
  ['WI', 44.6243, -89.9941],
  ['WY', 42.9957, -107.5512],
]

export const LONGEST_TRIP_STATE_TARGETS: LongestTripStateTarget[] =
  STATE_TARGET_DATA.filter(([code]) => LOWER_48_AND_DC.has(code))
  .map(([state, lat, lon]) => ({
    id: `state-${state.toLowerCase()}`,
    type: 'state',
    label: STATE_CODE_TO_NAME[state] ?? state,
    state,
    position: { lat: Number(lat), lon: Number(lon) },
  }))

export const LONGEST_TRIP_DESTINATIONS: LongestTripDestination[] = PLACE_CATALOG
  .map((entry) => ({
    id: entry.id,
    type: entry.type,
    label: entry.label,
    state: entry.state,
    position: entry.position,
    radiusMiles: entry.radiusMiles,
    categories: entry.categories,
    priority: entry.priority,
  }))
  .sort((a, b) => b.priority - a.priority || a.label.localeCompare(b.label))

export function getLongestTripDestination(id: string) {
  return LONGEST_TRIP_DESTINATIONS.find((destination) => destination.id === id)
}

export function getLongestTripStateTarget(id: string) {
  return LONGEST_TRIP_STATE_TARGETS.find((state) => state.id === id)
}
