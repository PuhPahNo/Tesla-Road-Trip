import { haversineMiles } from './geo'
import { stationHighlights, type StationHighlight } from './highlights'
import { STATE_SIGNATURES, type StateSignature } from './stateSignatures'
import type { PlaceRating, RoutePlan } from './types'

export interface StateSignatureHit {
  state: string
  signature: StateSignature
}

export interface TripComposition {
  bigCities: number
  landmarks: number
  teslaBadges: number
  signatureStops: number
  topCities: StationHighlight[]
  topLandmarks: Array<StationHighlight | StateSignatureHit>
  topBadges: StationHighlight[]
  ratedLandmarks: PlaceRating[]
}

export function buildTripComposition(route?: RoutePlan): TripComposition {
  if (!route) {
    return {
      bigCities: 0,
      landmarks: 0,
      teslaBadges: 0,
      signatureStops: 0,
      topCities: [],
      topLandmarks: [],
      topBadges: [],
      ratedLandmarks: [],
    }
  }

  const highlights = dedupeStationHighlights(
    route.visits.flatMap((visit) => stationHighlights(visit.station)),
  )
  const cityHighlights = highlights
    .filter((highlight) => highlight.type === 'city')
    .sort(sortHighlights)
  const badgeHighlights = highlights
    .filter((highlight) => highlight.type === 'tesla_badge')
    .sort(sortHighlights)
  const landmarkHighlights = highlights
    .filter((highlight) => highlight.type === 'landmark' || highlight.type === 'unique')
    .sort(sortHighlights)
  const signatureHits = dedupeSignatureHits(
    Object.entries(STATE_SIGNATURES).flatMap(([state, signatures]) =>
      signatures
        .filter((signature) =>
          route.visits.some(
            (visit) =>
              visit.station.address.state === state &&
              haversineMiles(visit.station.position, signature.position) <=
                signature.radiusMiles,
          ),
        )
        .map((signature) => ({ state, signature })),
    ),
  )
  const landmarkIds = new Set([
    ...landmarkHighlights.map((highlight) => `highlight:${highlight.id}`),
    ...signatureHits.map((hit) => `signature:${hit.signature.id}`),
  ])

  return {
    bigCities: cityHighlights.length,
    landmarks: landmarkIds.size,
    teslaBadges: badgeHighlights.length,
    signatureStops: signatureHits.length,
    topCities: cityHighlights.slice(0, 5),
    topLandmarks: [...landmarkHighlights.slice(0, 5), ...signatureHits.slice(0, 5)].slice(
      0,
      5,
    ),
    topBadges: badgeHighlights.slice(0, 5),
    ratedLandmarks: route.rating.places
      .filter((place) => place.type === 'landmark')
      .slice(0, 6),
  }
}

function dedupeStationHighlights(highlights: StationHighlight[]) {
  const seen = new Set<string>()
  return highlights.filter((highlight) => {
    if (seen.has(highlight.id)) return false
    seen.add(highlight.id)
    return true
  })
}

function dedupeSignatureHits(hits: StateSignatureHit[]) {
  const seen = new Set<string>()
  return hits.filter((hit) => {
    if (seen.has(hit.signature.id)) return false
    seen.add(hit.signature.id)
    return true
  })
}

function sortHighlights(a: StationHighlight, b: StationHighlight) {
  return (
    b.rating - a.rating ||
    b.sceneryScore - a.sceneryScore ||
    a.label.localeCompare(b.label)
  )
}

export function topLandmarkLabel(item: StationHighlight | StateSignatureHit) {
  return 'signature' in item ? item.signature.label : item.label
}
