import { describe, expect, it } from 'vitest'
import { resolveBasemap } from './basemap'

describe('resolveBasemap', () => {
  it('adds the CARTO key to both branded tile styles', () => {
    expect(resolveBasemap('tesla', 'public key').url).toBe(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=public%20key',
    )
    expect(resolveBasemap('dash', 'public key').url).toBe(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?key=public%20key',
    )
  })

  it('uses an unwatermarked OpenStreetMap fallback when no key is configured', () => {
    const basemap = resolveBasemap('dash')
    expect(basemap.provider).toBe('osm')
    expect(basemap.url).toBe('https://tile.openstreetmap.org/{z}/{x}/{y}.png')
    expect(basemap.attribution).not.toContain('CARTO')
  })
})
