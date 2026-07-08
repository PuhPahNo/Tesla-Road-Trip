import { haversineMiles } from './geo'
import { PLACE_CATALOG } from './placeCatalog'
import { detailForCatalogPlace } from './placeDetails'
import type { Station } from './types'

/**
 * Ceiling for how many corridor-miles a station can "earn back" by sitting
 * inside a top-rated place's radius. Kept small so geometry still dominates:
 * a rated station wins ties and modest detours, never a big rerouting.
 */
export const MAX_RATING_BONUS_MILES = 15

/** Quadratic ramp from 0 bonus at rating 70 to the max at rating 100. */
export function ratingBonusMiles(rating: number): number {
  if (rating <= 70) return 0
  const t = Math.min(1, (rating - 70) / 30)
  return t * t * MAX_RATING_BONUS_MILES
}

/**
 * Precompute each station's best rating bonus from the catalog place areas
 * containing it. Built once per optimize run (station set is shared across
 * all route variants) and read during station selection as an effective
 * corridor distance: distanceMiles - bonus.
 */
export function buildStationRatingBonus(stations: Station[]): Map<string, number> {
  const places = PLACE_CATALOG.map((entry) => ({
    position: entry.position,
    radiusMiles: entry.radiusMiles,
    bonus: ratingBonusMiles(detailForCatalogPlace(entry).rating),
  }))
    .filter((place) => place.bonus > 0)
    .sort((a, b) => b.bonus - a.bonus)

  const bonusByStation = new Map<string, number>()
  stations.forEach((station) => {
    for (const place of places) {
      if (
        haversineMiles(station.position, place.position) <= place.radiusMiles
      ) {
        bonusByStation.set(station.id, place.bonus)
        break
      }
    }
  })

  return bonusByStation
}
