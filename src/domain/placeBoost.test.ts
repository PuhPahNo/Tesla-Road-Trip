import { describe, expect, it } from 'vitest'
import {
  MAX_RATING_BONUS_MILES,
  buildStationRatingBonus,
  ratingBonusMiles,
} from './placeBoost'
import type { Station } from './types'

function stationAt(id: string, lat: number, lon: number, state = 'AZ'): Station {
  return {
    id,
    sourceId: id,
    source: 'supercharge.info',
    name: id,
    status: 'OPEN',
    position: { lat, lon },
    address: { city: id, state, country: 'USA' },
    stallCount: 8,
    powerKw: 250,
    counted: true,
    otherEvs: false,
  }
}

describe('ratingBonusMiles', () => {
  it('gives no bonus at or below rating 70', () => {
    expect(ratingBonusMiles(70)).toBe(0)
    expect(ratingBonusMiles(50)).toBe(0)
  })

  it('ramps quadratically toward the cap at rating 100', () => {
    expect(ratingBonusMiles(100)).toBe(MAX_RATING_BONUS_MILES)
    expect(ratingBonusMiles(85)).toBeCloseTo(MAX_RATING_BONUS_MILES / 4, 5)
    expect(ratingBonusMiles(99)).toBeLessThan(MAX_RATING_BONUS_MILES)
    expect(ratingBonusMiles(99)).toBeGreaterThan(MAX_RATING_BONUS_MILES * 0.8)
  })
})

describe('buildStationRatingBonus', () => {
  it('boosts stations inside a top-rated place area and skips remote ones', () => {
    const grandCanyon = stationAt('near-gc', 36.1, -112.1)
    const remote = stationAt('remote-mt-corner', 48.9, -104.0, 'MT')
    const bonus = buildStationRatingBonus([grandCanyon, remote])

    expect(bonus.get('near-gc') ?? 0).toBeGreaterThan(10)
    expect(bonus.get('remote-mt-corner') ?? 0).toBe(0)
  })

  it('keeps the strongest bonus when areas overlap', () => {
    const vegas = stationAt('vegas', 36.17, -115.14, 'NV')
    const bonus = buildStationRatingBonus([vegas])
    const value = bonus.get('vegas') ?? 0

    expect(value).toBeGreaterThan(0)
    expect(value).toBeLessThanOrEqual(MAX_RATING_BONUS_MILES)
  })
})
