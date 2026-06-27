import { describe, expect, it } from 'vitest'
import { simplifyPolyline } from './geo'
import type { Coordinate } from './types'

describe('polyline simplification', () => {
  it('drops small access-road wiggles while preserving endpoints', () => {
    const line: Coordinate[] = [
      { lat: 35.0, lon: -85.0 },
      { lat: 35.01, lon: -84.99 },
      { lat: 35.02, lon: -84.98 },
      { lat: 35.03, lon: -84.97 },
    ]

    expect(simplifyPolyline(line, 5)).toEqual([
      { lat: 35.0, lon: -85.0 },
      { lat: 35.03, lon: -84.97 },
    ])
  })

  it('keeps meaningful bends in the route overview', () => {
    const line: Coordinate[] = [
      { lat: 35.0, lon: -85.0 },
      { lat: 36.0, lon: -85.0 },
      { lat: 36.0, lon: -84.0 },
    ]

    expect(simplifyPolyline(line, 5)).toEqual(line)
  })
})
