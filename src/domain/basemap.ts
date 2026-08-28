export type BasemapTheme = 'dash' | 'tesla'

const CARTO_TILE_URL = {
  tesla: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
  dash: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
} as const

const CARTO_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

export function resolveBasemap(theme: BasemapTheme, cartoKey?: string) {
  const key = cartoKey?.trim()
  if (!key) {
    return {
      attribution: OSM_ATTRIBUTION,
      provider: 'osm' as const,
      subdomains: undefined,
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    }
  }

  return {
    attribution: CARTO_ATTRIBUTION,
    provider: 'carto' as const,
    subdomains: 'abcd',
    url: `${CARTO_TILE_URL[theme]}?key=${encodeURIComponent(key)}`,
  }
}
