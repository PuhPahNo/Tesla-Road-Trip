import { describe, expect, it } from 'vitest'
import { defaultPlannerConfig } from './config'
import {
  filterOpenStations,
  filterStationsForConfig,
  normalizeSuperchargeSites,
} from './stations'

const rawSites = [
  {
    id: 1,
    name: 'Chattanooga, TN',
    status: 'OPEN',
    stallCount: 8,
    powerKilowatt: 250,
    address: {
      city: 'Chattanooga',
      state: 'TN',
      country: 'USA',
    },
    gps: { latitude: 35.0456, longitude: -85.3097 },
  },
  {
    id: 2,
    name: 'Anchorage, AK',
    status: 'OPEN',
    address: {
      city: 'Anchorage',
      state: 'AK',
      country: 'USA',
    },
    gps: { latitude: 61.2176, longitude: -149.8997 },
  },
  {
    id: 3,
    name: 'Toronto, ON',
    status: 'OPEN',
    address: {
      city: 'Toronto',
      state: 'ON',
      country: 'Canada',
    },
    gps: { latitude: 43.6532, longitude: -79.3832 },
  },
  {
    id: 4,
    name: 'Future, TX',
    status: 'CONSTRUCTION',
    address: {
      city: 'Austin',
      state: 'TX',
      country: 'USA',
    },
    gps: { latitude: 30.2672, longitude: -97.7431 },
  },
]

describe('station normalization and filtering', () => {
  it('normalizes Supercharge.info records into stable station objects', () => {
    const stations = normalizeSuperchargeSites(rawSites)

    expect(stations).toHaveLength(4)
    expect(stations[0]).toMatchObject({
      id: 'sci-1',
      name: 'Chattanooga, TN',
      status: 'OPEN',
      stallCount: 8,
      powerKw: 250,
      address: {
        city: 'Chattanooga',
        state: 'TN',
        country: 'USA',
      },
    })
  })

  it('keeps only open stations when requested', () => {
    const stations = normalizeSuperchargeSites(rawSites)

    expect(filterOpenStations(stations).map((station) => station.name)).toEqual([
      'Chattanooga, TN',
      'Anchorage, AK',
      'Toronto, ON',
    ])
  })

  it('defaults to lower-48 USA and expands to Canada by config', () => {
    const stations = normalizeSuperchargeSites(rawSites)
    const defaultFiltered = filterStationsForConfig(stations, defaultPlannerConfig)
    const canadaFiltered = filterStationsForConfig(stations, {
      ...defaultPlannerConfig,
      includeCanada: true,
    })

    expect(defaultFiltered.map((station) => station.name)).toEqual([
      'Chattanooga, TN',
    ])
    expect(canadaFiltered.map((station) => station.name)).toEqual([
      'Chattanooga, TN',
      'Toronto, ON',
    ])
  })
})
