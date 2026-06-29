import { STATE_CODE_TO_NAME } from './usStates'
import type { Coordinate, LongestTripVisitTargetType } from './types'

export interface LongestTripDestination {
  id: string
  type: Exclude<LongestTripVisitTargetType, 'state'>
  label: string
  state: string
  position: Coordinate
  radiusMiles: number
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

export const LONGEST_TRIP_DESTINATIONS: LongestTripDestination[] = [
  {
    id: 'city-nashville',
    type: 'city',
    label: 'Nashville',
    state: 'TN',
    position: { lat: 36.1627, lon: -86.7816 },
    radiusMiles: 35,
  },
  {
    id: 'city-chicago',
    type: 'city',
    label: 'Chicago',
    state: 'IL',
    position: { lat: 41.8781, lon: -87.6298 },
    radiusMiles: 45,
  },
  {
    id: 'city-new-york',
    type: 'city',
    label: 'New York City',
    state: 'NY',
    position: { lat: 40.7128, lon: -74.006 },
    radiusMiles: 45,
  },
  {
    id: 'city-washington-dc',
    type: 'city',
    label: 'Washington, DC',
    state: 'DC',
    position: { lat: 38.9072, lon: -77.0369 },
    radiusMiles: 35,
  },
  {
    id: 'city-new-orleans',
    type: 'city',
    label: 'New Orleans',
    state: 'LA',
    position: { lat: 29.9511, lon: -90.0715 },
    radiusMiles: 45,
  },
  {
    id: 'city-denver',
    type: 'city',
    label: 'Denver',
    state: 'CO',
    position: { lat: 39.7392, lon: -104.9903 },
    radiusMiles: 55,
  },
  {
    id: 'city-las-vegas',
    type: 'city',
    label: 'Las Vegas',
    state: 'NV',
    position: { lat: 36.1699, lon: -115.1398 },
    radiusMiles: 45,
  },
  {
    id: 'city-los-angeles',
    type: 'city',
    label: 'Los Angeles',
    state: 'CA',
    position: { lat: 34.0522, lon: -118.2437 },
    radiusMiles: 55,
  },
  {
    id: 'city-san-francisco',
    type: 'city',
    label: 'San Francisco Bay Area',
    state: 'CA',
    position: { lat: 37.7749, lon: -122.4194 },
    radiusMiles: 55,
  },
  {
    id: 'city-seattle',
    type: 'city',
    label: 'Seattle',
    state: 'WA',
    position: { lat: 47.6062, lon: -122.3321 },
    radiusMiles: 55,
  },
  {
    id: 'landmark-grand-canyon',
    type: 'landmark',
    label: 'Grand Canyon',
    state: 'AZ',
    position: { lat: 36.0544, lon: -112.1401 },
    radiusMiles: 95,
  },
  {
    id: 'landmark-yellowstone',
    type: 'landmark',
    label: 'Yellowstone gateway',
    state: 'WY',
    position: { lat: 44.428, lon: -110.5885 },
    radiusMiles: 120,
  },
  {
    id: 'landmark-yosemite',
    type: 'landmark',
    label: 'Yosemite gateway',
    state: 'CA',
    position: { lat: 37.8651, lon: -119.5383 },
    radiusMiles: 90,
  },
  {
    id: 'landmark-zion',
    type: 'landmark',
    label: 'Zion / southern Utah',
    state: 'UT',
    position: { lat: 37.2982, lon: -113.0263 },
    radiusMiles: 85,
  },
  {
    id: 'landmark-rocky-mountain',
    type: 'landmark',
    label: 'Rocky Mountain NP',
    state: 'CO',
    position: { lat: 40.3428, lon: -105.6836 },
    radiusMiles: 80,
  },
  {
    id: 'landmark-mount-rushmore',
    type: 'landmark',
    label: 'Mount Rushmore / Black Hills',
    state: 'SD',
    position: { lat: 43.8791, lon: -103.4591 },
    radiusMiles: 90,
  },
  {
    id: 'landmark-gateway-arch',
    type: 'landmark',
    label: 'Gateway Arch',
    state: 'MO',
    position: { lat: 38.6247, lon: -90.1848 },
    radiusMiles: 35,
  },
  {
    id: 'landmark-space-coast',
    type: 'landmark',
    label: 'Florida Space Coast',
    state: 'FL',
    position: { lat: 28.5729, lon: -80.649 },
    radiusMiles: 55,
  },
  {
    id: 'landmark-alamo',
    type: 'landmark',
    label: 'The Alamo',
    state: 'TX',
    position: { lat: 29.4259, lon: -98.4861 },
    radiusMiles: 30,
  },
  {
    id: 'landmark-acadia',
    type: 'landmark',
    label: 'Acadia / Bar Harbor',
    state: 'ME',
    position: { lat: 44.3386, lon: -68.2733 },
    radiusMiles: 95,
  },
]

export function getLongestTripDestination(id: string) {
  return LONGEST_TRIP_DESTINATIONS.find((destination) => destination.id === id)
}

export function getLongestTripStateTarget(id: string) {
  return LONGEST_TRIP_STATE_TARGETS.find((state) => state.id === id)
}
