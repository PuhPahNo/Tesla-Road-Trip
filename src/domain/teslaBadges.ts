import { haversineMiles } from './geo'
import type { PlaceCategory } from './placeCatalog'
import type { RoutePlan, RouteWaypoint, Station } from './types'

export type TeslaBadgeRegion = 'lower48' | 'canada' | 'hawaii'

export interface TeslaIconicBadge {
  id: string
  label: string
  waypointId: string
  summary: string
  state: string
  country: 'USA' | 'Canada'
  region: TeslaBadgeRegion
  position: { lat: number; lon: number }
  radiusMiles: number
  categories: PlaceCategory[]
  rating: number
  sceneryScore: number
  routeTarget: boolean
  qualifyingLocationIds: string[]
  officialLocationUrls: string[]
  availabilityNote?: string
}

export interface TeslaSpecialEventBadge {
  id: string
  label: string
  date: string
  summary: string
}

export interface TeslaBadgeOpportunity {
  id: string
  label: string
  kind: 'special_event' | 'milestone'
  status: 'scheduled' | 'candidate' | 'on-track'
  summary: string
  day?: number
  date?: string
  stationName?: string
}

/**
 * North American Iconic Charger catalog shown by Tesla in July 2026.
 * Positions are qualifying Supercharger sites, not the attraction centroid.
 * Tesla can change eligibility; location IDs let us match the live station feed
 * narrowly while the sub-mile fallback tolerates upstream identifier changes.
 */
export const TESLA_ICONIC_BADGES: TeslaIconicBadge[] = [
  iconic('arches', 'Arches', 'UT', 'USA', 'lower48', 38.585988, -109.5566,
    ['MoabUTQ322', 'moabsupercharger'],
    ['https://www.tesla.com/findus/location/supercharger/MoabUTQ322', 'https://www.tesla.com/findus/location/supercharger/moabsupercharger'],
    'Moab Superchargers serving the Arches corridor.', ['national-park', 'scenic'], 95, 97),
  iconic('bryce-canyon', 'Bryce Canyon', 'UT', 'USA', 'lower48', 37.672618, -112.157001,
    ['408358'], ['https://www.tesla.com/findus/location/supercharger/408358'],
    'Bryce Canyon City Supercharger at Best Western Plus.', ['national-park', 'scenic'], 94, 98),
  iconic('death-valley', 'Death Valley', 'NV', 'USA', 'lower48', 36.913718, -116.754371,
    ['beattysupercharger'], ['https://www.tesla.com/findus/location/supercharger/beattysupercharger'],
    'Beatty Supercharger on the Death Valley gateway corridor.', ['national-park', 'scenic'], 93, 96),
  iconic('golden-gate-bridge', 'Golden Gate Bridge', 'CA', 'USA', 'lower48', 37.798513, -122.449846,
    ['qbdestinationsiteid83342'], ['https://www.tesla.com/findus/location/supercharger/qbdestinationsiteid83342'],
    'Letterman Drive Supercharger in the Presidio near the Golden Gate Bridge.', ['coast', 'scenic', 'history'], 96, 96),
  iconic('grand-canyon', 'Grand Canyon', 'AZ', 'USA', 'lower48', 35.969448, -112.127675,
    ['tusayanazsupercharger'], ['https://www.tesla.com/findus/location/supercharger/tusayanazsupercharger'],
    'Tusayan Supercharger at The Grand Hotel near the South Rim.', ['national-park', 'scenic'], 99, 99),
  iconic('joshua-tree', 'Joshua Tree', 'CA', 'USA', 'lower48', 34.12046, -116.050953,
    ['twentyninepalmssupercharger', 'YuccaValleyCASupercharger'],
    ['https://www.tesla.com/findus/location/supercharger/twentyninepalmssupercharger', 'https://www.tesla.com/findus/location/supercharger/YuccaValleyCASupercharger'],
    'Twentynine Palms and Yucca Valley Superchargers serving Joshua Tree.', ['national-park', 'scenic'], 92, 95),
  iconic('las-vegas-strip', 'Las Vegas Strip', 'NV', 'USA', 'lower48', 36.11671, -115.168258,
    ['lasvegaslinqsupercharger'], ['https://www.tesla.com/findus/location/supercharger/lasvegaslinqsupercharger'],
    'High Roller at LINQ Supercharger on the Las Vegas Strip.', ['entertainment', 'roadside'], 92, 78),
  iconic('miami-beach', 'Miami Beach', 'FL', 'USA', 'lower48', 25.79169, -80.134014,
    ['southbeachmiamisupercharger', 'MiamiBeachFLsupercharger2'],
    ['https://www.tesla.com/findus/location/supercharger/southbeachmiamisupercharger', 'https://www.tesla.com/findus/location/supercharger/MiamiBeachFLsupercharger2'],
    'Pennsylvania Avenue and West Avenue Superchargers in Miami Beach.', ['coast', 'culture'], 91, 88),
  iconic('niagara-falls', 'Niagara Falls', 'ON', 'Canada', 'canada', 43.1044595, -79.1105459,
    ['58833', 'niagarafallsonsupercharger'],
    ['https://www.tesla.com/findus/location/supercharger/58833', 'https://www.tesla.com/findus/location/supercharger/niagarafallsonsupercharger'],
    'Niagara Falls, Ontario Superchargers; Canada coverage must be enabled.', ['scenic', 'coast'], 96, 97, true,
    'Requires Include Canada in Travel Preferences.'),
  iconic('oasis', 'Oasis', 'CA', 'USA', 'lower48', 35.618181, -119.638431,
    ['25874'], ['https://www.tesla.com/findus/location/supercharger/25874'],
    'Tesla Oasis on Highway 46 in Lost Hills.', ['roadside', 'science'], 94, 75),
  iconic('san-antonio-river', 'San Antonio River', 'TX', 'USA', 'lower48', 29.432165, -98.482669,
    ['32612'], ['https://www.tesla.com/findus/location/supercharger/32612'],
    'Broadway Supercharger near the San Antonio River Walk.', ['history', 'culture', 'food'], 91, 83),
  iconic('santa-monica', 'Santa Monica', 'CA', 'USA', 'lower48', 34.014693, -118.493679,
    ['santamonicacaliforniasupercharger'], ['https://www.tesla.com/findus/location/supercharger/santamonicacaliforniasupercharger'],
    'Santa Monica Place Supercharger near the pier.', ['coast', 'culture'], 92, 90),
  iconic('tesla-diner', 'Tesla Diner', 'CA', 'USA', 'lower48', 34.091225, -118.342211,
    ['26139'], ['https://www.tesla.com/findus/location/supercharger/26139'],
    'Tesla Diner at 7001 Santa Monica Boulevard in Hollywood.', ['food', 'entertainment', 'roadside'], 96, 78),
  iconic('waikiki', 'Waikiki', 'HI', 'USA', 'hawaii', 21.278556, -157.826171,
    ['4007566'], ['https://www.tesla.com/findus/location/supercharger/4007566'],
    'Waikiki Supercharger at 2330 Kalakaua Avenue in Honolulu.', ['coast', 'culture'], 94, 96, false,
    'Cataloged for completeness, but it cannot be inserted into a mainland road route.'),
  iconic('whistler', 'Whistler', 'BC', 'Canada', 'canada', 50.119698, -122.956967,
    ['20829', 'whistlerbcsupercharger'],
    ['https://www.tesla.com/findus/location/supercharger/20829', 'https://www.tesla.com/findus/location/supercharger/whistlerbcsupercharger'],
    'Whistler Marketplace and Fairmont Chateau Superchargers.', ['scenic', 'culture'], 94, 98, true,
    'Requires Include Canada in Travel Preferences.'),
  iconic('yellowstone', 'Yellowstone', 'MT', 'USA', 'lower48', 44.655988, -111.099014,
    ['westyellowstonesupercharger'], ['https://www.tesla.com/findus/location/supercharger/westyellowstonesupercharger'],
    'West Yellowstone Supercharger at the Grizzly & Wolf Discovery Center.', ['national-park', 'scenic'], 98, 99),
  iconic('yosemite', 'Yosemite', 'CA', 'USA', 'lower48', 37.679047, -119.763477,
    ['elportalcasupercharger', 'fishcampsupercharger'],
    ['https://www.tesla.com/findus/location/supercharger/elportalcasupercharger', 'https://www.tesla.com/findus/location/supercharger/fishcampsupercharger'],
    'El Portal and Fish Camp Superchargers on Yosemite gateway corridors.', ['national-park', 'scenic'], 99, 99),
]

export const TESLA_SPECIAL_EVENT_BADGES: TeslaSpecialEventBadge[] = [
  {
    id: 'earth-day-2026',
    label: 'Earth Day 2026',
    date: '2026-04-22',
    summary: 'Charge on April 22, 2026. Tesla offered this as a limited-time Special Event badge.',
  },
  {
    id: 'america-250',
    label: 'America 250',
    date: '2026-07-04',
    summary: 'Supercharge on July 4, 2026 for America’s 250th birthday.',
  },
]

export const TESLA_BADGE_WAYPOINT_IDS = new Set(
  TESLA_ICONIC_BADGES.map((badge) => badge.waypointId),
)

export function iconicBadgeWaypoint(badge: TeslaIconicBadge): RouteWaypoint {
  return {
    id: badge.waypointId,
    label: badge.label,
    position: badge.position,
    radiusMiles: badge.radiusMiles,
    reason: `Tesla Iconic Charger target: ${badge.summary}`,
  }
}

export function getTeslaBadgeWaypoint(id: string) {
  const badge = TESLA_ICONIC_BADGES.find(
    (candidate) => candidate.waypointId === id || candidate.id === id,
  )
  return badge ? iconicBadgeWaypoint(badge) : undefined
}

export function searchTeslaIconicBadges({
  query = '',
  state,
  limit = 20,
}: {
  query?: string
  state?: string
  limit?: number
} = {}) {
  const normalized = query.trim().toLowerCase().replace(/\b(badge|tesla|iconic)\b/g, '').trim()
  return TESLA_ICONIC_BADGES.filter((badge) =>
    state ? badge.state.toLowerCase() === state.toLowerCase() : true,
  )
    .filter((badge) =>
      normalized
        ? `${badge.label} ${badge.summary} ${badge.state} ${badge.country}`.toLowerCase().includes(normalized)
        : true,
    )
    .slice(0, Math.max(1, limit))
}

export function iconicBadgesForStation(station: Station) {
  const locationId = station.teslaLocationId?.toLowerCase()
  return TESLA_ICONIC_BADGES.filter((badge) => {
    const exactId = locationId && badge.qualifyingLocationIds.some(
      (id) => id.toLowerCase() === locationId,
    )
    return Boolean(exactId) || haversineMiles(station.position, badge.position) <= 0.75
  })
}

export function tripDateForDay(startDate: string | undefined, day: number) {
  if (
    !startDate ||
    !/^\d{4}-\d{2}-\d{2}$/.test(startDate) ||
    !Number.isFinite(day)
  ) return undefined
  const date = new Date(`${startDate}T12:00:00Z`)
  if (Number.isNaN(date.getTime())) return undefined
  date.setUTCDate(date.getUTCDate() + Math.max(0, day - 1))
  return date.toISOString().slice(0, 10)
}

export function specialEventBadgesInTripWindow(startDate: string, totalDays: number) {
  if (!Number.isFinite(totalDays) || totalDays < 1) return []
  const lastDate = tripDateForDay(startDate, totalDays)
  if (!lastDate) return []
  return TESLA_SPECIAL_EVENT_BADGES.filter(
    (badge) => badge.date >= startDate && badge.date <= lastDate,
  ).map((badge) => ({
    ...badge,
    day: daysBetween(startDate, badge.date) + 1,
  }))
}

export function badgeOpportunitiesForRoute(route: RoutePlan): TeslaBadgeOpportunity[] {
  const opportunities: TeslaBadgeOpportunity[] = []
  if (route.tripStartDate) {
    specialEventBadgesInTripWindow(route.tripStartDate, route.totalDays).forEach((badge) => {
      opportunities.push({
        id: badge.id,
        label: badge.label,
        kind: 'special_event',
        status: 'scheduled',
        summary: badge.summary,
        day: badge.day,
        date: badge.date,
      })
    })
  }

  const pitStop = route.visits.find((visit) => (visit.station.powerKw ?? 0) >= 250)
  if (pitStop) {
    opportunities.push({
      id: 'pit-stop',
      label: 'Pit Stop',
      kind: 'milestone',
      status: 'candidate',
      summary: 'Candidate 250 kW+ stop. Arrive preconditioned and low, add more than 80 miles, then end the session before 10:00.',
      day: pitStop.day,
      date: tripDateForDay(route.tripStartDate, pitStop.day),
      stationName: pitStop.station.name,
    })
  }

  if (route.uniqueStations >= 10) {
    opportunities.push({
      id: 'explorer',
      label: 'Explorer',
      kind: 'milestone',
      status: 'on-track',
      summary: `This route plans ${route.uniqueStations} unique Superchargers; Tesla’s first Explorer threshold is 10.`,
    })
  }

  if (route.totalDays >= 22) {
    opportunities.push({
      id: 'charging-streak',
      label: 'Charging Streak',
      kind: 'milestone',
      status: 'on-track',
      summary: 'The trip spans at least four weeks. Complete a Supercharger session in four consecutive weeks.',
    })
  }
  return opportunities
}

function iconic(
  id: string,
  label: string,
  state: string,
  country: 'USA' | 'Canada',
  region: TeslaBadgeRegion,
  lat: number,
  lon: number,
  qualifyingLocationIds: string[],
  officialLocationUrls: string[],
  summary: string,
  categories: PlaceCategory[],
  rating: number,
  sceneryScore: number,
  routeTarget = true,
  availabilityNote?: string,
): TeslaIconicBadge {
  return {
    id: `tesla-${id}`,
    label,
    waypointId: `tesla-badge-${id}`,
    summary,
    state,
    country,
    region,
    position: { lat, lon },
    radiusMiles: 1.25,
    categories,
    rating,
    sceneryScore,
    routeTarget,
    qualifyingLocationIds,
    officialLocationUrls,
    ...(availabilityNote ? { availabilityNote } : {}),
  }
}

function daysBetween(start: string, end: string) {
  return Math.round(
    (new Date(`${end}T12:00:00Z`).getTime() - new Date(`${start}T12:00:00Z`).getTime()) /
      86_400_000,
  )
}
