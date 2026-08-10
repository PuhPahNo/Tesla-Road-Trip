// @vitest-environment node

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import type { RoutePlan, Station } from '../src/domain/types'
import { matchHotelResearchToRoute } from './adminHotels'

const station: Station = {
  id: 'sci-9531',
  sourceId: '9531',
  source: 'supercharge.info',
  name: 'Cleveland, TN',
  status: 'OPEN',
  position: { lat: 35.217036, lon: -84.867062 },
  address: {
    street: '4570 Frontage Rd NW',
    city: 'Cleveland',
    state: 'TN',
    zip: '37312',
    country: 'USA',
  },
  stallCount: 12,
  powerKw: 250,
  counted: true,
  otherEvs: false,
}

const researchDays = JSON.parse(
  readFileSync(
    new URL('../src/data/hotelRecommendations.json', import.meta.url),
    'utf8',
  ),
).days as Array<{
  day: number
  station: { sourceId: string; name: string }
}>

function route(startDate: string, exact = true) {
  return {
    tripStartDate: startDate,
    days: (exact ? researchDays : researchDays.slice(0, 1)).map((day) => ({
      day: day.day,
      visits: [
        {
          station: {
            ...station,
            sourceId: day.station.sourceId,
            name: day.station.name,
          },
        },
      ],
    })),
  } as unknown as RoutePlan
}

describe('admin hotel research matching', () => {
  it('returns current recommendations only for the exact route day, date, and station', () => {
    const days = matchHotelResearchToRoute(route('2026-09-27'))
    const day = days[0]

    expect(day.researchStatus).toBe('current')
    expect(day.recommendations.length).toBeGreaterThanOrEqual(3)
    expect(day.station?.sourceId).toBe('9531')
    expect(days).toHaveLength(73)
  })

  it('marks a changed route date for refresh instead of serving stale booking links', () => {
    const [day] = matchHotelResearchToRoute(route('2026-09-28'))

    expect(day.researchStatus).toBe('needs_refresh')
    expect(day.recommendations).toEqual([])
  })

  it('does not attach the 2026 research to another or partial CORE route', () => {
    const [day] = matchHotelResearchToRoute(route('2026-09-27', false))

    expect(day.researchStatus).toBe('needs_refresh')
    expect(day.recommendations).toEqual([])
  })
})
