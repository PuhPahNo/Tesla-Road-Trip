import { haversineMiles, scoreAgainstPolyline } from './geo'
import { PLACE_CATALOG, type PlaceCategory } from './placeCatalog'
import { detailForCatalogPlace } from './placeDetails'
import type {
  Coordinate,
  DayPlan,
  DayStay,
  LongestTripVisitTarget,
  PlannerConfig,
  TripPace,
} from './types'

export interface PaceProfile {
  /** Extra nights a 100-rated place earns beyond its first streak day. */
  maxExtraNights: number
  /** Minimum place rating that can earn extra nights. */
  minStayRating: number
  /** Share of longestTripDays that auto-stays may spend on extra nights. */
  leisureShare: number
}

export const PACE_PROFILES: Record<TripPace, PaceProfile> = {
  sprint: {
    maxExtraNights: 0,
    minStayRating: Number.POSITIVE_INFINITY,
    leisureShare: 0,
  },
  balanced: { maxExtraNights: 2, minStayRating: 85, leisureShare: 0.25 },
  savor: { maxExtraNights: 3, minStayRating: 80, leisureShare: 0.4 },
}

export const TRIP_PACE_LABELS: Record<TripPace, string> = {
  sprint: 'Sprint',
  balanced: 'Balanced',
  savor: 'Savor',
}

export const TRIP_PACE_DESCRIPTIONS: Record<TripPace, string> = {
  sprint: 'Every day is a fresh streak hop; no extra nights anywhere.',
  balanced: 'Top-rated places earn up to 2 extra basecamp nights.',
  savor: 'Great places earn up to 3 extra nights with short daily hops.',
}

/** Keep auto basecamps from stacking on top of each other. */
const MIN_STAY_SPACING_MILES = 70
const MAX_AUTO_STAYS_PER_ROUTE = 10

export const FAVORITE_CATEGORY_RATING_BOOST = 6
export const MUTED_CATEGORY_RATING_PENALTY = 12

export type CategoryPreferences = Pick<
  PlannerConfig,
  'favoriteCategories' | 'mutedCategories'
>

/**
 * A place's rating through the lens of the user's category preferences:
 * favorites earn a boost (more likely to become stays and selection
 * targets), muted categories take a penalty. Display ratings stay raw —
 * this only shapes planning decisions.
 */
export function effectivePlaceRating(
  rating: number,
  categories: PlaceCategory[],
  preferences: CategoryPreferences,
): number {
  const favored = categories.some((category) =>
    preferences.favoriteCategories.includes(category),
  )
  const muted = categories.some((category) =>
    preferences.mutedCategories.includes(category),
  )
  const adjusted =
    rating +
    (favored ? FAVORITE_CATEGORY_RATING_BOOST : 0) -
    (muted ? MUTED_CATEGORY_RATING_PENALTY : 0)

  return Math.max(0, Math.min(100, adjusted))
}

/**
 * Total streak days a place earns from its rating: 1 pass-through day plus
 * extra basecamp nights on a curve that stays flat until minStayRating and
 * climbs toward maxExtraNights at a 100 rating. Each extra night still needs
 * its own new unique Supercharger, so stays never break the 24-hour streak.
 */
export function suggestedStayDays(rating: number, pace: TripPace): number {
  const profile = PACE_PROFILES[pace]
  if (profile.maxExtraNights <= 0 || rating < profile.minStayRating) return 1

  const reach = 100 - profile.minStayRating
  const t = reach <= 0 ? 1 : Math.min(1, (rating - profile.minStayRating) / reach)
  return 1 + Math.round(t ** 1.25 * profile.maxExtraNights)
}

/**
 * Rating-driven stays for a route corridor: every catalog place close enough
 * to the corridor whose rating earns 2+ days becomes a synthetic visit
 * target, so the optimizer reserves that many distinct Superchargers around
 * it. Manual must-visit targets always win overlaps, and total extra nights
 * are capped by the pace's leisure share of the trip (highest-rated places
 * keep their nights first).
 */
export function planAutoStays(
  anchors: Coordinate[],
  corridorMiles: number,
  config: PlannerConfig,
): LongestTripVisitTarget[] {
  const profile = PACE_PROFILES[config.tripPace]
  if (!config.autoStays || profile.maxExtraNights <= 0 || anchors.length < 2) {
    return []
  }

  const manualTargets = config.longestTripTargets
  const manualIds = new Set(manualTargets.map((target) => target.id))
  const manualAreas = manualTargets
    .filter((target) => target.position)
    .map((target) => ({
      position: target.position!,
      radiusMiles: target.radiusMiles ?? 60,
    }))

  const candidates = PLACE_CATALOG.map((entry) => ({
    entry,
    rating: effectivePlaceRating(
      detailForCatalogPlace(entry).rating,
      entry.categories,
      config,
    ),
    corridorDistanceMiles: scoreAgainstPolyline(entry.position, anchors)
      .distanceMiles,
  }))
    .filter(({ entry, rating, corridorDistanceMiles }) => {
      if (manualIds.has(entry.id)) return false
      if (suggestedStayDays(rating, config.tripPace) < 2) return false
      if (corridorDistanceMiles > corridorMiles + entry.radiusMiles) return false
      return !manualAreas.some(
        (manual) =>
          haversineMiles(manual.position, entry.position) <=
          Math.max(manual.radiusMiles, entry.radiusMiles),
      )
    })
    .sort(
      (a, b) =>
        b.rating - a.rating ||
        b.entry.priority - a.entry.priority ||
        a.entry.label.localeCompare(b.entry.label),
    )

  const manualExtraNights = manualTargets.reduce(
    (sum, target) => sum + Math.max(0, target.stayDays - 1),
    0,
  )
  let extraNightBudget = Math.max(
    0,
    Math.floor(config.longestTripDays * profile.leisureShare) - manualExtraNights,
  )

  const stays: LongestTripVisitTarget[] = []
  const keptPositions: Coordinate[] = []

  for (const { entry, rating } of candidates) {
    if (stays.length >= MAX_AUTO_STAYS_PER_ROUTE || extraNightBudget <= 0) break
    if (
      keptPositions.some(
        (position) =>
          haversineMiles(position, entry.position) < MIN_STAY_SPACING_MILES,
      )
    ) {
      continue
    }

    const desiredExtra = suggestedStayDays(rating, config.tripPace) - 1
    const extra = Math.min(desiredExtra, extraNightBudget)
    if (extra <= 0) continue

    extraNightBudget -= extra
    keptPositions.push(entry.position)
    stays.push({
      id: entry.id,
      type: entry.type,
      label: entry.label,
      stayDays: 1 + extra,
      state: entry.state,
      position: entry.position,
      radiusMiles: entry.radiusMiles,
      auto: true,
    })
  }

  return stays
}

interface StayPlace {
  id: string
  label: string
  position: Coordinate
  radiusMiles: number
  rating: number
}

function stayPlacesForTagging(config: PlannerConfig): StayPlace[] {
  const places = new Map<string, StayPlace>()

  PLACE_CATALOG.forEach((entry) => {
    places.set(entry.id, {
      id: entry.id,
      label: entry.label,
      position: entry.position,
      radiusMiles: entry.radiusMiles,
      rating: detailForCatalogPlace(entry).rating,
    })
  })

  config.longestTripTargets.forEach((target) => {
    if (target.type === 'state' || !target.position || places.has(target.id)) {
      return
    }
    places.set(target.id, {
      id: target.id,
      label: target.label,
      position: target.position,
      radiusMiles: target.radiusMiles ?? 60,
      rating: 88,
    })
  })

  return [...places.values()]
}

/**
 * Describe multi-day dwells after day plans exist: consecutive single-visit
 * streak days whose stations share a catalog place (or manual target) area
 * become one stay, tagged night-by-night. Purely descriptive — numbers,
 * ordering, and ratings are untouched — so it works the same for estimated
 * and road-refined plans.
 */
export function tagStayDays(days: DayPlan[], config: PlannerConfig): DayPlan[] {
  if (config.plannerMode !== 'longest_trip' || days.length < 2) return days

  const places = stayPlacesForTagging(config)
  const matchesByDay = days.map((day) => {
    const found = new Map<string, StayPlace>()
    if (day.visits.length !== 1) return found

    const station = day.visits[0].station
    places.forEach((place) => {
      if (haversineMiles(station.position, place.position) <= place.radiusMiles) {
        found.set(place.id, place)
      }
    })
    return found
  })

  const tagged = days.slice()
  let index = 0

  while (index < days.length) {
    let shared = [...matchesByDay[index].values()]
    if (shared.length === 0) {
      index += 1
      continue
    }

    let end = index + 1
    while (end < days.length) {
      const next = matchesByDay[end]
      const intersection = shared.filter((place) => next.has(place.id))
      if (intersection.length === 0) break
      shared = intersection
      end += 1
    }

    const totalNights = end - index
    if (totalNights >= 2) {
      const place = shared.sort(
        (a, b) => b.rating - a.rating || a.label.localeCompare(b.label),
      )[0]
      for (let night = 1; night <= totalNights; night += 1) {
        const dayIndex = index + night - 1
        const stay: DayStay = {
          placeId: place.id,
          label: place.label,
          rating: place.rating,
          night,
          totalNights,
        }
        tagged[dayIndex] = { ...tagged[dayIndex], stay }
      }
    }

    index = end
  }

  return tagged
}
