import { haversineMiles, round } from './geo'
import { stationHighlights, type StationHighlight } from './highlights'
import type {
  Coordinate,
  DayPlan,
  PlaceRating,
  PlaceRatingType,
  RouteStationVisit,
  SegmentRating,
  Station,
} from './types'

export interface RatingPlaceTarget {
  id: string
  type: PlaceRatingType
  label: string
  position: Coordinate
  radiusMiles: number
  rating: number
  sceneryScore: number
  summary: string
}

const STATE_SCENERY_SCORE: Record<string, number> = {
  AK: 96,
  HI: 95,
  CA: 88,
  CO: 92,
  UT: 94,
  AZ: 90,
  WY: 92,
  MT: 91,
  OR: 87,
  WA: 88,
  ME: 86,
  VT: 82,
  NH: 84,
  NM: 84,
  ID: 83,
  NV: 79,
  SD: 78,
  NC: 77,
  TN: 74,
  VA: 75,
  WV: 76,
  FL: 73,
  LA: 68,
  NY: 69,
  TX: 62,
  IL: 58,
}

export function emptySegmentRating(): SegmentRating {
  return {
    score: 0,
    sceneryScore: 0,
    cityScore: 0,
    landmarkScore: 0,
    places: [],
    summary: 'No rated cities or landmarks on this segment yet.',
  }
}

function driveOnlySegmentRating(): SegmentRating {
  return {
    score: 50,
    sceneryScore: 50,
    cityScore: 0,
    landmarkScore: 0,
    places: [],
    summary: '50/100 drive-only day with no rated city or landmark stops.',
  }
}

export function buildSegmentRating(
  visits: RouteStationVisit[],
  scope: 'day' | 'trip' = 'day',
  hasTravel = false,
  ratingTargets: RatingPlaceTarget[] = [],
): SegmentRating {
  if (visits.length === 0) {
    return hasTravel ? driveOnlySegmentRating() : emptySegmentRating()
  }

  const places = buildPlaceRatings(visits, ratingTargets)
  const sceneryScore = computeSceneryScore(visits, places)
  const cityPlaces = places.filter((place) => place.type === 'city')
  const landmarkPlaces = places.filter((place) => place.type === 'landmark')
  const cityScore = weightedPlaceAverage(cityPlaces, Math.max(55, sceneryScore - 10))
  const landmarkScore = weightedPlaceAverage(
    landmarkPlaces,
    Math.max(45, sceneryScore - 12),
  )
  const diversityBonus = Math.min(
    scope === 'trip' ? 8 : 5,
    Math.log2(Math.max(1, places.length)) * (scope === 'trip' ? 1.55 : 1.25),
  )
  const balanceBonus =
    cityPlaces.length > 0 && landmarkPlaces.length > 0
      ? scope === 'trip'
        ? 3
        : 2
      : 0
  const score = clampScore(
    cityScore * 0.3 +
      landmarkScore * 0.38 +
      sceneryScore * 0.32 +
      diversityBonus +
      balanceBonus,
  )

  return {
    score,
    sceneryScore,
    cityScore,
    landmarkScore,
    places,
    summary: ratingSummary(score, sceneryScore, cityPlaces.length, landmarkPlaces.length),
  }
}

export function buildRouteRating(
  days: DayPlan[],
  ratingTargets: RatingPlaceTarget[] = [],
): SegmentRating {
  const visits = days.flatMap((day) => day.visits)
  if (visits.length === 0) return emptySegmentRating()

  const placeRating = buildSegmentRating(visits, 'trip', false, ratingTargets)
  const ratedDays = days.filter((day) => day.rating.score > 0)
  const weightedDayScore =
    ratedDays.length > 0
      ? weightedAverage(
          ratedDays.map((day) => ({
            value: day.rating.score,
            weight: Math.max(1, day.uniqueStations),
          })),
        )
      : placeRating.score
  const score = clampScore(placeRating.score * 0.72 + weightedDayScore * 0.28)

  return {
    ...placeRating,
    score,
    summary: ratingSummary(
      score,
      placeRating.sceneryScore,
      placeRating.places.filter((place) => place.type === 'city').length,
      placeRating.places.filter((place) => place.type === 'landmark').length,
    ),
  }
}

function buildPlaceRatings(
  visits: RouteStationVisit[],
  ratingTargets: RatingPlaceTarget[] = [],
): PlaceRating[] {
  const places = new Map<string, PlaceRating>()

  visits.forEach((visit) => {
    addCityPlace(places, visit.station)

    stationHighlights(visit.station).forEach((highlight) => {
      addPlace(places, {
        id: `highlight:${highlight.id}`,
        type: placeTypeForHighlight(highlight),
        label: highlight.label,
        rating: highlight.rating,
        sceneryScore: highlight.sceneryScore,
        visits: 1,
        summary: highlight.summary,
      })
    })
  })

  ratingTargets.forEach((target) => {
    const matchedVisits = visits.filter(
      (visit) =>
        haversineMiles(visit.station.position, target.position) <= target.radiusMiles,
    )
    if (matchedVisits.length === 0) return

    addPlace(places, {
      id: `target:${target.id}`,
      type: target.type,
      label: target.label,
      rating: target.rating,
      sceneryScore: target.sceneryScore,
      visits: matchedVisits.length,
      summary: target.summary,
    })
  })

  return [...places.values()].sort(
    (a, b) =>
      b.rating - a.rating ||
      b.sceneryScore - a.sceneryScore ||
      a.type.localeCompare(b.type) ||
      a.label.localeCompare(b.label),
  )
}

function addCityPlace(places: Map<string, PlaceRating>, station: Station) {
  const city = station.address.city.trim()
  const state = station.address.state.trim()
  if (!city || !state) return

  const sceneryScore = stateSceneryScore(state)
  const rating = clampScore(56 + (sceneryScore - 55) * 0.38)

  addPlace(places, {
    id: `city:${state.toLowerCase()}:${slug(city)}`,
    type: 'city',
    label: `${city}, ${state}`,
    rating,
    sceneryScore,
    visits: 1,
    summary: `City stop in ${state} with ${sceneryScore}/100 regional scenery context.`,
  })
}

function addPlace(places: Map<string, PlaceRating>, next: PlaceRating) {
  const currentId = matchingPlaceId(places, next)
  const current = currentId ? places.get(currentId) : undefined
  if (!current) {
    places.set(next.id, next)
    return
  }

  places.set(currentId!, {
    ...current,
    rating: Math.max(current.rating, next.rating),
    sceneryScore: Math.max(current.sceneryScore, next.sceneryScore),
    visits: current.visits + next.visits,
    summary: current.rating >= next.rating ? current.summary : next.summary,
  })
}

function matchingPlaceId(places: Map<string, PlaceRating>, next: PlaceRating) {
  if (places.has(next.id)) return next.id

  const labelKey = normalizedPlaceLabel(next)
  for (const [id, place] of places) {
    if (normalizedPlaceLabel(place) === labelKey) return id
  }

  return undefined
}

function normalizedPlaceLabel(place: Pick<PlaceRating, 'type' | 'label'>) {
  return `${place.type}:${place.label.trim().toLowerCase()}`
}

function placeTypeForHighlight(highlight: StationHighlight): PlaceRatingType {
  return highlight.type === 'city' ? 'city' : 'landmark'
}

function computeSceneryScore(visits: RouteStationVisit[], places: PlaceRating[]) {
  const stateScore = weightedAverage(
    visits.map((visit) => ({
      value: stateSceneryScore(visit.station.address.state),
      weight: 1,
    })),
  )
  const placeScore = weightedAverage(
    places.map((place) => ({
      value: place.sceneryScore,
      weight: Math.max(1, Math.sqrt(place.visits)),
    })),
    stateScore,
  )
  const landmarkPlaces = places.filter((place) => place.type === 'landmark')
  const landmarkScenery = weightedPlaceAverage(landmarkPlaces, placeScore, 'sceneryScore')

  return clampScore(stateScore * 0.4 + placeScore * 0.38 + landmarkScenery * 0.22)
}

function weightedPlaceAverage(
  places: PlaceRating[],
  fallback: number,
  field: 'rating' | 'sceneryScore' = 'rating',
) {
  if (places.length === 0) return clampScore(fallback)

  return weightedAverage(
    places.map((place) => ({
      value: place[field],
      weight: Math.max(1, Math.sqrt(place.visits)),
    })),
    fallback,
  )
}

function weightedAverage(items: Array<{ value: number; weight: number }>, fallback = 0) {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0)
  if (totalWeight <= 0) return clampScore(fallback)

  return clampScore(
    items.reduce((sum, item) => sum + item.value * item.weight, 0) /
      totalWeight,
  )
}

function stateSceneryScore(state: string) {
  return STATE_SCENERY_SCORE[state] ?? 60
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, round(value, 0)))
}

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function ratingSummary(
  score: number,
  sceneryScore: number,
  cityCount: number,
  landmarkCount: number,
) {
  const cityLabel = cityCount === 1 ? 'city' : 'cities'
  const landmarkLabel = landmarkCount === 1 ? 'landmark' : 'landmarks'
  return `${score}/100 from ${cityCount} rated ${cityLabel}, ${landmarkCount} rated ${landmarkLabel}, and ${sceneryScore}/100 scenery.`
}
