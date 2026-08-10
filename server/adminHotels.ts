import { readFileSync } from 'node:fs'
import type { Express } from 'express'
import type { RoutePlan } from '../src/domain/types'
import { tripDateForDay } from '../src/domain/teslaBadges'
import { requireAdmin } from './auth'
import {
  buildAnthonyRoute,
  type StationSnapshot,
} from './anthonyRoute'

interface HotelRecommendation {
  sourceKey: string
  name: string
  brand?: string
  tier: string
  tierLabel: string
  isUnique: boolean
  curatorNote?: string
  position: { lat: number; lon: number }
  address: string
  distanceFromSuperchargerMiles: number
  routeDetourMiles: number
  evCharging: {
    status: 'nearby' | 'unverified'
    distanceMiles?: number
    label?: string
  }
  officialUrl?: string
  bookingUrl: string
  mapsUrl: string
  photoUrl?: string
  photoSource?: string
  rateSnapshot: {
    provider: 'Booking.com'
    availability: 'available' | 'unavailable' | 'not_found'
    nightlyUsd: number | null
    observedAt: string | null
  }
}

interface HotelResearchDay {
  day: number
  date: string
  checkOut: string
  station: {
    sourceId: string
    name: string
    address: string
    city: string
    state: string
    position: { lat: number; lon: number }
  }
  nextStation: {
    name: string
    city: string
    state: string
    position: { lat: number; lon: number }
  } | null
  recommendations: HotelRecommendation[]
}

interface HotelResearchDataset {
  routeName: string
  capturedAt: string
  researchedAt: string
  bookingResearchedAt?: string
  sources: Record<string, string>
  days: HotelResearchDay[]
}

const hotelResearch = JSON.parse(
  readFileSync(
    new URL('../src/data/hotelRecommendations.json', import.meta.url),
    'utf8',
  ),
) as HotelResearchDataset

function researchKey(day: number, date: string, sourceId: string) {
  return `${day}:${date}:${sourceId}`
}

export function matchHotelResearchToRoute(route: RoutePlan) {
  const routeMatchesResearch =
    route.days.length === hotelResearch.days.length &&
    route.days.every((day) => {
      const station = day.visits.at(-1)?.station
      const research = hotelResearch.days[day.day - 1]
      return (
        research?.day === day.day &&
        research.date === tripDateForDay(route.tripStartDate, day.day) &&
        research.station.sourceId === station?.sourceId
      )
    })
  const byExactStop = new Map(
    hotelResearch.days.map((day) => [
      researchKey(day.day, day.date, day.station.sourceId),
      day,
    ]),
  )

  return route.days.map((day) => {
    const station = day.visits.at(-1)?.station
    const date = tripDateForDay(route.tripStartDate, day.day) ?? ''
    const research = routeMatchesResearch && station
      ? byExactStop.get(researchKey(day.day, date, station.sourceId))
      : undefined
    return {
      day: day.day,
      date,
      checkOut: research?.checkOut ?? '',
      station: station
        ? {
            sourceId: station.sourceId,
            name: station.name,
            address: station.address,
            position: station.position,
          }
        : null,
      nextStation: research?.nextStation ?? null,
      recommendations: research?.recommendations ?? [],
      researchStatus: research ? 'current' : 'needs_refresh',
    }
  })
}

export function registerAdminHotelRoutes(
  app: Express,
  loadStations: () => Promise<StationSnapshot>,
) {
  app.get('/api/admin/hotels/:routeId', async (request, response) => {
    try {
      const admin = requireAdmin(request, response)
      if (!admin) return
      const published = await buildAnthonyRoute(
        admin.id,
        request.params.routeId,
        loadStations,
      )
      if (!published) {
        response.status(404).json({ message: 'Saved route not found.' })
        return
      }

      const days = matchHotelResearchToRoute(published.route)
      const recommendations = days.flatMap((day) => day.recommendations)
      response.setHeader('Cache-Control', 'private, no-store')
      response.json({
        route: {
          id: published.savedRoute.id,
          name: published.savedRoute.name,
          startDate: published.savedRoute.startDate,
          totalDays: published.route.totalDays,
          uniqueStations: published.route.uniqueStations,
        },
        research: {
          routeName: hotelResearch.routeName,
          capturedAt: hotelResearch.capturedAt,
          researchedAt: hotelResearch.researchedAt,
          bookingResearchedAt: hotelResearch.bookingResearchedAt,
          sources: hotelResearch.sources,
        },
        stats: {
          researchedDays: days.filter(
            (day) => day.researchStatus === 'current',
          ).length,
          totalRecommendations: recommendations.length,
          pricedOptions: recommendations.filter(
            (hotel) => hotel.rateSnapshot.nightlyUsd !== null,
          ).length,
          withPhotos: recommendations.filter((hotel) => hotel.photoUrl).length,
          nearbyCharging: recommendations.filter(
            (hotel) => hotel.evCharging.status === 'nearby',
          ).length,
          higherEnd: recommendations.filter(
            (hotel) => hotel.tier === 'luxury' || hotel.tier === 'upscale',
          ).length,
          uniqueStays: recommendations.filter((hotel) => hotel.isUnique).length,
        },
        days,
      })
    } catch (error) {
      response.status(500).json({
        message:
          error instanceof Error
            ? error.message
            : 'Unable to load the hotel planner.',
      })
    }
  })
}
