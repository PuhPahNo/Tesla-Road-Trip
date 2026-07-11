import { haversineMiles } from './geo'
import { detailForCatalogPlace } from './placeDetails'
import {
  PLACE_CATALOG,
  catalogEntryToWaypoint,
  getPlaceCatalogEntry,
} from './placeCatalog'
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
  rating: number
  sceneryScore: number
}

interface HighlightRule {
  id: string
  type: StationHighlightType
  label: string
  summary: string
  rating?: number
  sceneryScore?: number
  states?: string[]
  cities?: string[]
  nameIncludes?: string[]
  near?: Coordinate
  radiusMiles?: number
  waypointId?: string
}

export const KNOWN_WAYPOINTS: RouteWaypoint[] =
  PLACE_CATALOG.map(catalogEntryToWaypoint)

const LEGACY_WAYPOINT_ALIASES: Record<string, string> = {
  grand_canyon: 'landmark-az-grand-canyon',
  los_angeles: 'city-los-angeles',
  las_vegas: 'city-las-vegas',
  san_francisco: 'city-san-francisco',
  seattle: 'city-seattle',
  denver: 'city-denver',
  new_york: 'city-new-york',
}

const HIGHLIGHT_RULES: HighlightRule[] = [
  {
    id: 'tesla-grand-canyon',
    type: 'tesla_badge',
    label: 'Grand Canyon Badge',
    summary: 'Tesla app badge candidate near the Grand Canyon travel corridor.',
    rating: 97,
    sceneryScore: 98,
    states: ['AZ'],
    cities: ['Grand Canyon', 'Tusayan', 'Williams', 'Flagstaff'],
    nameIncludes: ['grand canyon', 'tusayan', 'williams', 'flagstaff'],
    near: { lat: 36.0544, lon: -112.1401 },
    radiusMiles: 95,
    waypointId: 'landmark-az-grand-canyon',
  },
  {
    id: 'tesla-santa-monica',
    type: 'tesla_badge',
    label: 'Santa Monica Badge',
    summary: 'Tesla app Iconic Charger badge destination around Santa Monica.',
    rating: 91,
    sceneryScore: 88,
    states: ['CA'],
    cities: ['Santa Monica'],
    nameIncludes: ['santa monica'],
    near: { lat: 34.01, lon: -118.4962 },
    radiusMiles: 25,
    waypointId: 'landmark-ca-santa-monica-pier',
  },
  {
    id: 'tesla-diner',
    type: 'tesla_badge',
    label: 'Tesla Diner Badge',
    summary: 'Tesla app Iconic Charger badge destination at the Hollywood Tesla Diner.',
    rating: 94,
    sceneryScore: 74,
    states: ['CA'],
    cities: ['Los Angeles', 'West Hollywood', 'Hollywood'],
    nameIncludes: ['tesla diner', 'santa monica boulevard'],
    near: { lat: 34.0908, lon: -118.344 },
    radiusMiles: 12,
    waypointId: 'landmark-ca-tesla-diner',
  },
  {
    id: 'tesla-oasis',
    type: 'tesla_badge',
    label: 'Tesla Oasis Badge',
    summary: 'Tesla app Iconic Charger badge destination at Tesla Oasis in Lost Hills.',
    rating: 93,
    sceneryScore: 70,
    states: ['CA'],
    cities: ['Lost Hills'],
    nameIncludes: ['tesla oasis', 'lost hills'],
    near: { lat: 35.6163, lon: -119.6943 },
    radiusMiles: 20,
    waypointId: 'landmark-ca-tesla-oasis',
  },
  {
    id: 'tesla-yosemite',
    type: 'tesla_badge',
    label: 'Yosemite Badge',
    summary: 'Tesla app Iconic Charger badge destination in the Yosemite travel corridor.',
    rating: 98,
    sceneryScore: 99,
    states: ['CA'],
    cities: ['Mariposa', 'Oakhurst', 'Groveland', 'Fish Camp'],
    nameIncludes: ['yosemite', 'mariposa', 'oakhurst', 'groveland'],
    near: { lat: 37.8651, lon: -119.5383 },
    radiusMiles: 95,
    waypointId: 'landmark-ca-yosemite',
  },
  {
    id: 'tesla-yellowstone',
    type: 'tesla_badge',
    label: 'Yellowstone Badge',
    summary: 'Tesla app Iconic Charger badge destination in the Yellowstone travel corridor.',
    rating: 97,
    sceneryScore: 99,
    states: ['WY', 'MT', 'ID'],
    cities: ['West Yellowstone', 'Gardiner', 'Jackson', 'Bozeman', 'Idaho Falls'],
    nameIncludes: ['yellowstone', 'gardiner', 'west yellowstone'],
    near: { lat: 44.428, lon: -110.5885 },
    radiusMiles: 130,
    waypointId: 'landmark-wy-yellowstone',
  },
  {
    id: 'city-los-angeles',
    type: 'city',
    label: 'Los Angeles',
    summary: 'Major West Coast metro and dense Southern California Supercharger area.',
    rating: 78,
    sceneryScore: 62,
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
    rating: 90,
    sceneryScore: 88,
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
    rating: 82,
    sceneryScore: 74,
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
    rating: 88,
    sceneryScore: 86,
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
    rating: 87,
    sceneryScore: 89,
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
    rating: 93,
    sceneryScore: 65,
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
    rating: 98,
    sceneryScore: 99,
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
    rating: 97,
    sceneryScore: 99,
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
    rating: 96,
    sceneryScore: 98,
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
    rating: 78,
    sceneryScore: 62,
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
    rating: 84,
    sceneryScore: 70,
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
    rating: 76,
    sceneryScore: 50,
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
    rating: 82,
    sceneryScore: 55,
    states: ['TN'],
    cities: ['Nashville'],
    near: { lat: 36.1627, lon: -86.7816 },
    radiusMiles: 28,
  },
  {
    id: 'city-chicago',
    type: 'city',
    label: 'Chicago',
    summary: 'Major Great Lakes city with strong skyline, lakefront, and food-stop value.',
    rating: 88,
    sceneryScore: 72,
    states: ['IL'],
    cities: ['Chicago', 'Evanston', 'Oak Brook', 'Schaumburg'],
    near: { lat: 41.8781, lon: -87.6298 },
    radiusMiles: 38,
  },
  {
    id: 'city-washington-dc',
    type: 'city',
    label: 'Washington, DC',
    summary: 'Capital corridor with monuments, museums, and dense historic-route value.',
    rating: 90,
    sceneryScore: 68,
    states: ['DC', 'VA', 'MD'],
    cities: ['Washington', 'Arlington', 'Alexandria', 'Bethesda'],
    near: { lat: 38.9072, lon: -77.0369 },
    radiusMiles: 34,
  },
  {
    id: 'city-new-orleans',
    type: 'city',
    label: 'New Orleans',
    summary: 'High-character Gulf city stop with music, food, and riverfront travel value.',
    rating: 89,
    sceneryScore: 66,
    states: ['LA'],
    cities: ['New Orleans', 'Metairie', 'Kenner'],
    near: { lat: 29.9511, lon: -90.0715 },
    radiusMiles: 40,
  },
  {
    id: 'landmark-rocky-mountain',
    type: 'landmark',
    label: 'Rocky Mountain NP',
    summary: 'Front Range mountain corridor with high scenic-drive upside.',
    rating: 95,
    sceneryScore: 97,
    states: ['CO'],
    cities: ['Estes Park', 'Boulder', 'Loveland', 'Fort Collins'],
    near: { lat: 40.3428, lon: -105.6836 },
    radiusMiles: 80,
  },
  {
    id: 'landmark-mount-rushmore',
    type: 'landmark',
    label: 'Mount Rushmore / Black Hills',
    summary: 'Black Hills landmark corridor with strong scenic and Americana value.',
    rating: 86,
    sceneryScore: 88,
    states: ['SD'],
    cities: ['Rapid City', 'Keystone', 'Custer'],
    near: { lat: 43.8791, lon: -103.4591 },
    radiusMiles: 90,
  },
  {
    id: 'landmark-acadia',
    type: 'landmark',
    label: 'Acadia / Bar Harbor',
    summary: 'Coastal Maine national-park gateway with top-tier Atlantic scenery.',
    rating: 94,
    sceneryScore: 96,
    states: ['ME'],
    cities: ['Bar Harbor', 'Ellsworth', 'Bangor'],
    near: { lat: 44.3386, lon: -68.2733 },
    radiusMiles: 95,
  },
]

export const TESLA_BADGE_WAYPOINT_IDS = new Set(
  HIGHLIGHT_RULES.filter((rule) => rule.type === 'tesla_badge')
    .map((rule) => rule.waypointId)
    .filter((id): id is string => Boolean(id)),
)

export function getKnownWaypoint(id: string) {
  const entry = getPlaceCatalogEntry(LEGACY_WAYPOINT_ALIASES[id] ?? id)
  return entry ? catalogEntryToWaypoint(entry) : undefined
}

export function stationHighlights(station: Station): StationHighlight[] {
  const ruleHighlights = HIGHLIGHT_RULES.filter((rule) => matchesRule(rule, station)).map(
    ({ id, type, label, summary, rating, sceneryScore }) => ({
      id,
      type,
      label,
      summary,
      rating: rating ?? defaultRatingForType(type),
      sceneryScore: sceneryScore ?? defaultSceneryForType(type),
    }),
  )
  const catalogHighlights = PLACE_CATALOG.filter(
    (entry) =>
      entry.state === station.address.state &&
      haversineMiles(station.position, entry.position) <= entry.radiusMiles,
  ).map((entry): StationHighlight => {
    const detail = detailForCatalogPlace(entry)
    return {
      id: entry.id,
      type: entry.type,
      label: entry.label,
      summary: detail.summary,
      rating: detail.rating,
      sceneryScore: detail.sceneryScore,
    }
  })

  return dedupeHighlights([...ruleHighlights, ...catalogHighlights])
}

export function dayHighlights(day: DayPlan): StationHighlight[] {
  return dedupeHighlights(
    day.visits.flatMap((visit) => stationHighlights(visit.station)),
  )
}

export function dedupeHighlights(highlights: StationHighlight[]) {
  const seen = new Set<string>()
  return highlights.filter((highlight) => {
    const labelKey = `${highlight.type}:${highlight.label.toLowerCase()}`
    if (seen.has(highlight.id) || seen.has(labelKey)) return false
    seen.add(highlight.id)
    seen.add(labelKey)
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

function defaultRatingForType(type: StationHighlightType) {
  switch (type) {
    case 'landmark':
    case 'tesla_badge':
      return 88
    case 'unique':
      return 80
    case 'city':
      return 76
  }
}

function defaultSceneryForType(type: StationHighlightType) {
  switch (type) {
    case 'landmark':
    case 'tesla_badge':
      return 86
    case 'unique':
      return 70
    case 'city':
      return 60
  }
}
