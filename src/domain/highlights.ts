import { haversineMiles } from './geo'
import type {
  Coordinate,
  DayPlan,
  RouteWaypoint,
  Station,
} from './types'

export type StationHighlightType = 'tesla_badge' | 'city' | 'landmark' | 'unique'

export interface StationHighlight {
  id: string
  type: StationHighlightType
  label: string
  summary: string
}

interface HighlightRule {
  id: string
  type: StationHighlightType
  label: string
  summary: string
  states?: string[]
  cities?: string[]
  nameIncludes?: string[]
  near?: Coordinate
  radiusMiles?: number
}

export const KNOWN_WAYPOINTS: RouteWaypoint[] = [
  {
    id: 'grand_canyon',
    label: 'Grand Canyon',
    position: { lat: 36.0544, lon: -112.1401 },
    radiusMiles: 95,
    reason: 'Route preference from the trip agent.',
  },
  {
    id: 'los_angeles',
    label: 'Los Angeles',
    position: { lat: 34.0522, lon: -118.2437 },
    radiusMiles: 55,
    reason: 'Route preference from the trip agent.',
  },
  {
    id: 'las_vegas',
    label: 'Las Vegas',
    position: { lat: 36.1699, lon: -115.1398 },
    radiusMiles: 45,
    reason: 'Route preference from the trip agent.',
  },
  {
    id: 'san_francisco',
    label: 'San Francisco',
    position: { lat: 37.7749, lon: -122.4194 },
    radiusMiles: 55,
    reason: 'Route preference from the trip agent.',
  },
  {
    id: 'seattle',
    label: 'Seattle',
    position: { lat: 47.6062, lon: -122.3321 },
    radiusMiles: 55,
    reason: 'Route preference from the trip agent.',
  },
  {
    id: 'denver',
    label: 'Denver',
    position: { lat: 39.7392, lon: -104.9903 },
    radiusMiles: 55,
    reason: 'Route preference from the trip agent.',
  },
  {
    id: 'new_york',
    label: 'New York City',
    position: { lat: 40.7128, lon: -74.006 },
    radiusMiles: 45,
    reason: 'Route preference from the trip agent.',
  },
]

const HIGHLIGHT_RULES: HighlightRule[] = [
  {
    id: 'tesla-grand-canyon',
    type: 'tesla_badge',
    label: 'Grand Canyon Badge',
    summary: 'Tesla app badge candidate near the Grand Canyon travel corridor.',
    states: ['AZ'],
    cities: ['Grand Canyon', 'Tusayan', 'Williams', 'Flagstaff'],
    nameIncludes: ['grand canyon', 'tusayan', 'williams', 'flagstaff'],
    near: { lat: 36.0544, lon: -112.1401 },
    radiusMiles: 95,
  },
  {
    id: 'city-los-angeles',
    type: 'city',
    label: 'Los Angeles',
    summary: 'Major West Coast metro and dense Southern California Supercharger area.',
    states: ['CA'],
    cities: ['Los Angeles', 'Santa Monica', 'Burbank', 'Glendale', 'Inglewood'],
    near: { lat: 34.0522, lon: -118.2437 },
    radiusMiles: 35,
  },
  {
    id: 'city-san-francisco',
    type: 'city',
    label: 'San Francisco Bay Area',
    summary: 'High-density Bay Area corridor with strong route-photo potential.',
    states: ['CA'],
    cities: ['San Francisco', 'Oakland', 'San Jose', 'Palo Alto', 'Fremont'],
    near: { lat: 37.7749, lon: -122.4194 },
    radiusMiles: 42,
  },
  {
    id: 'city-las-vegas',
    type: 'city',
    label: 'Las Vegas',
    summary: 'Iconic desert city and useful connector between California, Arizona, and Utah.',
    states: ['NV'],
    cities: ['Las Vegas', 'Henderson', 'North Las Vegas'],
    near: { lat: 36.1699, lon: -115.1398 },
    radiusMiles: 32,
  },
  {
    id: 'city-seattle',
    type: 'city',
    label: 'Seattle',
    summary: 'Pacific Northwest metro and useful northern turnaround corridor.',
    states: ['WA'],
    cities: ['Seattle', 'Bellevue', 'Tacoma', 'Everett'],
    near: { lat: 47.6062, lon: -122.3321 },
    radiusMiles: 38,
  },
  {
    id: 'city-denver',
    type: 'city',
    label: 'Denver',
    summary: 'Rocky Mountain gateway city and central return-route pivot.',
    states: ['CO'],
    cities: ['Denver', 'Aurora', 'Lakewood', 'Golden'],
    near: { lat: 39.7392, lon: -104.9903 },
    radiusMiles: 34,
  },
  {
    id: 'city-new-york',
    type: 'city',
    label: 'New York City',
    summary: 'Dense Northeast metro with a recognizable urban stop cluster.',
    states: ['NY', 'NJ'],
    cities: ['New York', 'Brooklyn', 'Queens', 'Jersey City', 'Newark'],
    near: { lat: 40.7128, lon: -74.006 },
    radiusMiles: 32,
  },
  {
    id: 'landmark-yosemite',
    type: 'landmark',
    label: 'Yosemite gateway',
    summary: 'Sierra Nevada gateway area for Yosemite National Park side-trip planning.',
    states: ['CA'],
    cities: ['Mariposa', 'Oakhurst', 'Mammoth Lakes'],
    near: { lat: 37.8651, lon: -119.5383 },
    radiusMiles: 80,
  },
  {
    id: 'landmark-zion',
    type: 'landmark',
    label: 'Zion / southern Utah',
    summary: 'Red-rock national park corridor with strong scenic-route value.',
    states: ['UT'],
    cities: ['St. George', 'Cedar City', 'Springdale'],
    near: { lat: 37.2982, lon: -113.0263 },
    radiusMiles: 75,
  },
  {
    id: 'landmark-yellowstone',
    type: 'landmark',
    label: 'Yellowstone gateway',
    summary: 'Northern Rockies gateway area near Yellowstone National Park approaches.',
    states: ['WY', 'MT', 'ID'],
    cities: ['West Yellowstone', 'Jackson', 'Bozeman', 'Idaho Falls'],
    near: { lat: 44.428, lon: -110.5885 },
    radiusMiles: 120,
  },
  {
    id: 'landmark-gateway-arch',
    type: 'landmark',
    label: 'Gateway Arch',
    summary: 'Recognizable St. Louis landmark near a common cross-country route pivot.',
    states: ['MO', 'IL'],
    cities: ['St. Louis', 'East St. Louis'],
    near: { lat: 38.6247, lon: -90.1848 },
    radiusMiles: 28,
  },
  {
    id: 'unique-space-coast',
    type: 'unique',
    label: 'Florida Space Coast',
    summary: 'Cape Canaveral / Kennedy Space Center area with a distinctive stop story.',
    states: ['FL'],
    cities: ['Cape Canaveral', 'Cocoa Beach', 'Titusville', 'Melbourne'],
    near: { lat: 28.5729, lon: -80.649 },
    radiusMiles: 45,
  },
  {
    id: 'unique-alamo',
    type: 'unique',
    label: 'The Alamo',
    summary: 'San Antonio landmark stop along the Texas route corridor.',
    states: ['TX'],
    cities: ['San Antonio'],
    near: { lat: 29.4259, lon: -98.4861 },
    radiusMiles: 22,
  },
  {
    id: 'unique-nashville',
    type: 'city',
    label: 'Nashville',
    summary: 'Music-city route stop close to the Chattanooga start/end region.',
    states: ['TN'],
    cities: ['Nashville'],
    near: { lat: 36.1627, lon: -86.7816 },
    radiusMiles: 28,
  },
]

export function getKnownWaypoint(id: string) {
  return KNOWN_WAYPOINTS.find((waypoint) => waypoint.id === id)
}

export function stationHighlights(station: Station): StationHighlight[] {
  return HIGHLIGHT_RULES.filter((rule) => matchesRule(rule, station)).map(
    ({ id, type, label, summary }) => ({ id, type, label, summary }),
  )
}

export function dayHighlights(day: DayPlan): StationHighlight[] {
  return dedupeHighlights(
    day.visits.flatMap((visit) => stationHighlights(visit.station)),
  )
}

export function dedupeHighlights(highlights: StationHighlight[]) {
  const seen = new Set<string>()
  return highlights.filter((highlight) => {
    if (seen.has(highlight.id)) return false
    seen.add(highlight.id)
    return true
  })
}

function matchesRule(rule: HighlightRule, station: Station) {
  const city = station.address.city.toLowerCase()
  const name = station.name.toLowerCase()

  if (rule.states && !rule.states.includes(station.address.state)) {
    return false
  }

  const cityMatch =
    rule.cities?.some((candidate) => city === candidate.toLowerCase()) ?? false
  const nameMatch =
    rule.nameIncludes?.some((candidate) =>
      name.includes(candidate.toLowerCase()),
    ) ?? false
  const nearbyMatch =
    Boolean(rule.near && rule.radiusMiles) &&
    haversineMiles(station.position, rule.near!) <= rule.radiusMiles!

  return cityMatch || nameMatch || nearbyMatch
}
