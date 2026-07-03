import type { LongestTripDestination } from './visitTargets'
import type { StateSignature } from './stateSignatures'
import type { CatalogPlaceType, PlaceCatalogEntry } from './placeCatalog'

export interface PlaceDetail {
  rating: number
  sceneryScore: number
  summary: string
  popularity: string
  activities: string[]
}

const SIGNATURE_OVERRIDES: Record<string, Partial<PlaceDetail>> = {
  'az-grand-canyon': {
    rating: 99,
    sceneryScore: 100,
    summary:
      'The main canyon overlook corridor: huge desert views, sunrise and sunset stops, rim walks, and a true route-defining detour.',
    popularity: 'World-class national park icon',
    activities: ['rim overlooks', 'sunrise', 'short hikes', 'desert photos'],
  },
  'landmark-az-grand-canyon': {
    rating: 99,
    sceneryScore: 100,
    summary:
      'The main canyon overlook corridor: huge desert views, sunrise and sunset stops, rim walks, and a true route-defining detour.',
    popularity: 'World-class national park icon',
    activities: ['rim overlooks', 'sunrise', 'short hikes', 'desert photos'],
  },
  'ca-yosemite': {
    rating: 98,
    sceneryScore: 99,
    summary:
      'Sierra Nevada gateway for Yosemite: granite walls, waterfalls, alpine roads, big-view pullouts, and one of the strongest scenery payoffs in California.',
    popularity: 'Flagship national park gateway',
    activities: ['valley views', 'waterfalls', 'granite cliffs', 'day hikes'],
  },
  'landmark-ca-yosemite': {
    rating: 98,
    sceneryScore: 99,
    summary:
      'Sierra Nevada gateway for Yosemite: granite walls, waterfalls, alpine roads, big-view pullouts, and one of the strongest scenery payoffs in California.',
    popularity: 'Flagship national park gateway',
    activities: ['valley views', 'waterfalls', 'granite cliffs', 'day hikes'],
  },
  'ca-golden-gate': {
    rating: 93,
    sceneryScore: 90,
    summary:
      'Bay Area landmark cluster with the Golden Gate, waterfront viewpoints, city food stops, and dense Supercharger coverage nearby.',
    popularity: 'Major city landmark',
    activities: ['bridge views', 'waterfront', 'food stops', 'city photos'],
  },
  'landmark-ca-golden-gate': {
    rating: 93,
    sceneryScore: 90,
    summary:
      'Bay Area landmark cluster with the Golden Gate, waterfront viewpoints, city food stops, and dense Supercharger coverage nearby.',
    popularity: 'Major city landmark',
    activities: ['bridge views', 'waterfront', 'food stops', 'city photos'],
  },
  'ca-santa-monica': {
    rating: 86,
    sceneryScore: 74,
    summary:
      'Los Angeles beach-and-pier anchor with coastal driving, city energy, food, and easy access to Southern California charger density.',
    popularity: 'Classic Los Angeles stop',
    activities: ['pier walk', 'beach', 'food', 'coastal drive'],
  },
  'landmark-ca-hollywood-walk-of-fame': {
    rating: 86,
    sceneryScore: 60,
    summary:
      'Hollywood Boulevard anchor with film-history value, tourist energy, and dense Los Angeles charger coverage nearby.',
    popularity: 'Iconic entertainment landmark',
    activities: ['walkable stop', 'film history', 'photos', 'city food'],
  },
  'co-rocky-mountain': {
    rating: 96,
    sceneryScore: 98,
    summary:
      'Front Range mountain gateway with alpine scenery, wildlife, high-elevation drives, and strong route-photo value.',
    popularity: 'Top-tier mountain national park',
    activities: ['mountain views', 'wildlife', 'scenic roads', 'short hikes'],
  },
  'landmark-co-rocky-mountain': {
    rating: 96,
    sceneryScore: 98,
    summary:
      'Front Range mountain gateway with alpine scenery, wildlife, high-elevation drives, and strong route-photo value.',
    popularity: 'Top-tier mountain national park',
    activities: ['mountain views', 'wildlife', 'scenic roads', 'short hikes'],
  },
  'landmark-oh-pro-football-hall-of-fame': {
    rating: 86,
    sceneryScore: 48,
    summary:
      'Canton sports-history anchor that gives Ohio a nationally recognizable football stop beyond the larger metro corridors.',
    popularity: 'National sports landmark',
    activities: ['museum time', 'football history', 'photos', 'short stop'],
  },
  'landmark-tn-civil-rights-museum': {
    rating: 92,
    sceneryScore: 58,
    summary:
      'Memphis civil-rights anchor at the Lorraine Motel, strong enough to define an entire Southern history route segment.',
    popularity: 'Major civil-rights museum',
    activities: ['museum time', 'civil-rights history', 'downtown walk', 'music stops'],
  },
  'nv-las-vegas': {
    rating: 84,
    sceneryScore: 70,
    summary:
      'Desert-city anchor with the Strip, food, shows, night views, and a practical connector between California, Utah, and Arizona.',
    popularity: 'Iconic desert city',
    activities: ['Strip walk', 'food', 'night views', 'desert connector'],
  },
  'ny-statue-of-liberty': {
    rating: 94,
    sceneryScore: 70,
    summary:
      'Lower Manhattan and harbor landmark cluster: skyline views, ferries, historic sites, and dense Northeast route coverage.',
    popularity: 'National landmark',
    activities: ['skyline views', 'ferry', 'historic sites', 'food stops'],
  },
  'landmark-ny-statue-of-liberty': {
    rating: 94,
    sceneryScore: 70,
    summary:
      'Lower Manhattan and harbor landmark cluster: skyline views, ferries, historic sites, and dense Northeast route coverage.',
    popularity: 'National landmark',
    activities: ['skyline views', 'ferry', 'historic sites', 'food stops'],
  },
  'ut-zion': {
    rating: 98,
    sceneryScore: 99,
    summary:
      'Southern Utah red-rock gateway with canyon walls, scenic roads, desert light, and one of the best public-lands payoffs on the route.',
    popularity: 'Premier red-rock park',
    activities: ['canyon views', 'scenic shuttle', 'short hikes', 'sunset'],
  },
  'landmark-ut-zion': {
    rating: 98,
    sceneryScore: 99,
    summary:
      'Southern Utah red-rock gateway with canyon walls, scenic roads, desert light, and one of the best public-lands payoffs on the route.',
    popularity: 'Premier red-rock park',
    activities: ['canyon views', 'scenic shuttle', 'short hikes', 'sunset'],
  },
  'wy-yellowstone': {
    rating: 97,
    sceneryScore: 99,
    summary:
      'Northern Rockies gateway for geysers, wildlife, mountain passes, thermal basins, and a major wilderness feel.',
    popularity: 'World-famous national park gateway',
    activities: ['geysers', 'wildlife', 'mountain drives', 'thermal basins'],
  },
  'landmark-wy-yellowstone': {
    rating: 97,
    sceneryScore: 99,
    summary:
      'Northern Rockies gateway for geysers, wildlife, mountain passes, thermal basins, and a major wilderness feel.',
    popularity: 'World-famous national park gateway',
    activities: ['geysers', 'wildlife', 'mountain drives', 'thermal basins'],
  },
}

const DESTINATION_OVERRIDES: Record<string, Partial<PlaceDetail>> = {
  'city-los-angeles': {
    rating: 86,
    sceneryScore: 74,
    summary:
      'Major Southern California metro with beaches, food, entertainment, and high-density charging options.',
    popularity: 'Major U.S. metro',
    activities: ['beach', 'food', 'entertainment', 'coastal drive'],
  },
  'city-san-francisco': {
    rating: 93,
    sceneryScore: 90,
    summary:
      'Bay Area anchor with Golden Gate views, waterfront neighborhoods, skyline photos, and dense charger coverage.',
    popularity: 'Major coastal city',
    activities: ['bridge views', 'waterfront', 'food', 'city photos'],
  },
  'city-new-york': {
    rating: 94,
    sceneryScore: 70,
    summary:
      'Dense Northeast anchor with skyline views, major landmarks, food, museums, and strong badge-story value.',
    popularity: 'Global city landmark',
    activities: ['skyline', 'museums', 'food', 'historic sites'],
  },
}

export function detailForSignature(
  signature: StateSignature,
  state: string,
): PlaceDetail {
  return {
    ...fallbackDetail(signature.label, state),
    ...SIGNATURE_OVERRIDES[signature.id],
  }
}

export function detailForDestination(
  destination: Pick<LongestTripDestination, 'id' | 'label' | 'state' | 'type'>,
): PlaceDetail {
  return {
    ...fallbackDetail(destination.label, destination.state, destination.type),
    ...SIGNATURE_OVERRIDES[destination.id],
    ...DESTINATION_OVERRIDES[destination.id],
  }
}

export function detailForCatalogPlace(
  place: Pick<PlaceCatalogEntry, 'id' | 'label' | 'state' | 'type'>,
): PlaceDetail {
  return detailForDestination(place)
}

function fallbackDetail(label: string, state: string, type: CatalogPlaceType = 'landmark'): PlaceDetail {
  const lower = label.toLowerCase()
  const isPark =
    lower.includes('national park') ||
    lower.includes('yosemite') ||
    lower.includes('zion') ||
    lower.includes('acadia') ||
    lower.includes('badlands') ||
    lower.includes('glacier') ||
    lower.includes('smoky') ||
    lower.includes('shenandoah')
  const isCoast =
    lower.includes('beach') ||
    lower.includes('coast') ||
    lower.includes('bay') ||
    lower.includes('island') ||
    lower.includes('gorge')
  const isCity =
    type === 'city' ||
    lower.includes('downtown') ||
    lower.includes('district') ||
    lower.includes('market') ||
    lower.includes('broadway')
  const isHistoric =
    lower.includes('historic') ||
    lower.includes('battlefield') ||
    lower.includes('trail') ||
    lower.includes('liberty') ||
    lower.includes('president') ||
    lower.includes('mansions') ||
    lower.includes('civil rights') ||
    lower.includes('memorial') ||
    lower.includes('hall of fame') ||
    lower.includes('museum')

  if (isPark) {
    return {
      rating: 92,
      sceneryScore: 94,
      summary: `${label} gives ${state} a high-scenery stop with gateway-town routing, photo pullouts, and outdoor side-trip value.`,
      popularity: 'National park or major outdoor icon',
      activities: ['scenic drive', 'photos', 'short hikes', 'viewpoints'],
    }
  }

  if (isCoast) {
    return {
      rating: 86,
      sceneryScore: 84,
      summary: `${label} adds waterfront scenery, walkable stops, and a stronger sense of place than a pure charger hop.`,
      popularity: 'Popular coastal stop',
      activities: ['waterfront', 'photos', 'food', 'walkable stop'],
    }
  }

  if (isHistoric) {
    return {
      rating: 82,
      sceneryScore: 68,
      summary: `${label} is a recognizable history stop that gives the route a clearer story in ${state}.`,
      popularity: 'Historic landmark',
      activities: ['historic site', 'photos', 'museum time', 'walkable stop'],
    }
  }

  if (isCity) {
    return {
      rating: 80,
      sceneryScore: 62,
      summary: `${label} is a city anchor with food, services, recognizable stops, and practical charging density.`,
      popularity: 'Major city or regional anchor',
      activities: ['food', 'city walk', 'services', 'charger density'],
    }
  }

  return {
    rating: 78,
    sceneryScore: 70,
    summary: `${label} is a curated ${state} signature stop selected to make the state visit feel more intentional.`,
    popularity: 'Curated state signature',
    activities: ['photos', 'short stop', 'local landmark', 'route story'],
  }
}
