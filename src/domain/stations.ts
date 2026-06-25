import type { PlannerConfig, Station } from './types'

const LOWER_48_AND_DC = new Set([
  'AL',
  'AZ',
  'AR',
  'CA',
  'CO',
  'CT',
  'DE',
  'DC',
  'FL',
  'GA',
  'ID',
  'IL',
  'IN',
  'IA',
  'KS',
  'KY',
  'LA',
  'ME',
  'MD',
  'MA',
  'MI',
  'MN',
  'MS',
  'MO',
  'MT',
  'NE',
  'NV',
  'NH',
  'NJ',
  'NM',
  'NY',
  'NC',
  'ND',
  'OH',
  'OK',
  'OR',
  'PA',
  'RI',
  'SC',
  'SD',
  'TN',
  'TX',
  'UT',
  'VT',
  'VA',
  'WA',
  'WV',
  'WI',
  'WY',
])

interface SuperchargeInfoSite {
  id?: number | string
  locationId?: string
  name?: string
  status?: string
  counted?: boolean
  stallCount?: number
  powerKilowatt?: number
  otherEVs?: boolean
  address?: {
    street?: string
    city?: string
    state?: string
    zip?: string
    country?: string
    region?: string
  }
  gps?: {
    latitude?: number
    longitude?: number
  }
  teslaId?: string
  plugshareId?: string
  osmNodeId?: string
}

function stableStationId(site: SuperchargeInfoSite) {
  if (site.id !== undefined && site.id !== null) return String(site.id)
  if (site.locationId) return site.locationId
  const name = site.name ?? 'unknown'
  const lat = site.gps?.latitude?.toFixed(5) ?? '0'
  const lon = site.gps?.longitude?.toFixed(5) ?? '0'
  return `${name}-${lat}-${lon}`
}

export function normalizeSuperchargeSites(rawSites: unknown[]): Station[] {
  return rawSites.reduce<Station[]>((stations, site) => {
    const raw = site as SuperchargeInfoSite
    const lat = raw.gps?.latitude
    const lon = raw.gps?.longitude
    const city = raw.address?.city
    const state = raw.address?.state
    const country = raw.address?.country

    if (
      typeof lat !== 'number' ||
      typeof lon !== 'number' ||
      !raw.name ||
      !raw.status ||
      !city ||
      !state ||
      !country
    ) {
      return stations
    }

    const sourceId = stableStationId(raw)
    const station: Station = {
      id: `sci-${sourceId}`,
      sourceId,
      source: 'supercharge.info',
      name: raw.name,
      status: raw.status,
      position: { lat, lon },
      address: {
        ...(raw.address?.street ? { street: raw.address.street } : {}),
        city,
        state,
        ...(raw.address?.zip ? { zip: raw.address.zip } : {}),
        country,
        ...(raw.address?.region ? { region: raw.address.region } : {}),
      },
      stallCount: typeof raw.stallCount === 'number' ? raw.stallCount : null,
      powerKw:
        typeof raw.powerKilowatt === 'number' ? raw.powerKilowatt : null,
      counted: typeof raw.counted === 'boolean' ? raw.counted : null,
      otherEvs: typeof raw.otherEVs === 'boolean' ? raw.otherEVs : null,
      ...(raw.locationId || raw.teslaId
        ? { teslaLocationId: raw.locationId ?? raw.teslaId }
        : {}),
      ...(raw.plugshareId ? { plugshareId: raw.plugshareId } : {}),
      ...(raw.osmNodeId ? { osmNodeId: raw.osmNodeId } : {}),
    }

    stations.push(station)
    return stations
  }, [])
}

export function filterOpenStations(stations: Station[]) {
  return stations.filter((station) => station.status === 'OPEN')
}

export function filterStationsForConfig(
  stations: Station[],
  config: PlannerConfig,
) {
  const allowedCountries = new Set(['USA'])
  if (config.includeCanada) allowedCountries.add('Canada')
  if (config.includeMexico) allowedCountries.add('Mexico')

  return filterOpenStations(stations).filter((station) => {
    if (!allowedCountries.has(station.address.country)) return false
    if (station.address.country === 'USA') {
      return LOWER_48_AND_DC.has(station.address.state)
    }
    return true
  })
}

export function countryCounts(stations: Station[]) {
  return stations.reduce<Record<string, number>>((counts, station) => {
    counts[station.address.country] = (counts[station.address.country] ?? 0) + 1
    return counts
  }, {})
}

export { LOWER_48_AND_DC }
