import type { Coordinate } from './types'

const EARTH_RADIUS_MILES = 3958.8
const MILES_PER_DEGREE_LAT = 69.0

function toRadians(value: number) {
  return (value * Math.PI) / 180
}

export function haversineMiles(a: Coordinate, b: Coordinate) {
  const dLat = toRadians(b.lat - a.lat)
  const dLon = toRadians(b.lon - a.lon)
  const lat1 = toRadians(a.lat)
  const lat2 = toRadians(b.lat)

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2

  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(h))
}

export function estimatedRoadMiles(
  a: Coordinate,
  b: Coordinate,
  roadDistanceFactor: number,
) {
  return haversineMiles(a, b) * roadDistanceFactor
}

function toLocalXY(point: Coordinate, referenceLat: number) {
  const x =
    point.lon * Math.cos(toRadians(referenceLat)) * MILES_PER_DEGREE_LAT
  const y = point.lat * MILES_PER_DEGREE_LAT
  return { x, y }
}

export function distanceToSegmentMiles(
  point: Coordinate,
  start: Coordinate,
  end: Coordinate,
) {
  const referenceLat = (point.lat + start.lat + end.lat) / 3
  const p = toLocalXY(point, referenceLat)
  const a = toLocalXY(start, referenceLat)
  const b = toLocalXY(end, referenceLat)
  const dx = b.x - a.x
  const dy = b.y - a.y
  const lengthSquared = dx * dx + dy * dy

  if (lengthSquared === 0) {
    return {
      distance: haversineMiles(point, start),
      progress: 0,
    }
  }

  const progress = Math.max(
    0,
    Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSquared),
  )
  const projected = {
    x: a.x + progress * dx,
    y: a.y + progress * dy,
  }
  const distance = Math.hypot(p.x - projected.x, p.y - projected.y)

  return { distance, progress }
}

export function scoreAgainstPolyline(point: Coordinate, anchors: Coordinate[]) {
  let bestDistance = Number.POSITIVE_INFINITY
  let bestOrder = 0
  let bestSegmentIndex = 0
  let bestProgress = 0
  let cumulative = 0

  for (let index = 0; index < anchors.length - 1; index += 1) {
    const start = anchors[index]
    const end = anchors[index + 1]
    const segmentLength = haversineMiles(start, end)
    const result = distanceToSegmentMiles(point, start, end)

    if (result.distance < bestDistance) {
      bestDistance = result.distance
      bestOrder = cumulative + segmentLength * result.progress
      bestSegmentIndex = index
      bestProgress = result.progress
    }

    cumulative += segmentLength
  }

  return {
    distanceMiles: bestDistance,
    order: bestOrder,
    segmentIndex: bestSegmentIndex,
    segmentProgress: bestProgress,
  }
}

export function polylineLengthMiles(anchors: Coordinate[]) {
  return anchors.reduce((total, anchor, index) => {
    if (index === 0) return total
    return total + haversineMiles(anchors[index - 1], anchor)
  }, 0)
}

export function anchorOrders(anchors: Coordinate[]) {
  let cumulative = 0
  return anchors.map((anchor, index) => {
    if (index > 0) {
      cumulative += haversineMiles(anchors[index - 1], anchor)
    }
    return {
      order: cumulative,
      point: anchor,
    }
  })
}

export function round(value: number, digits = 1) {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}
