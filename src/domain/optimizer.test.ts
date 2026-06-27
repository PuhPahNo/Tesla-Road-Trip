import { describe, expect, it } from 'vitest'
import { defaultPlannerConfig } from './config'
import { optimizeRoutes, refineRouteWithRoadLegs } from './optimizer'
import type { Station } from './types'

function makeStation(index: number, lat: number, lon: number, state = 'TN'): Station {
  return {
    id: `test-${index}`,
    sourceId: String(index),
    source: 'supercharge.info',
    name: `Test Station ${index}`,
    status: 'OPEN',
    position: { lat, lon },
    address: {
      city: `City ${index}`,
      state,
      country: 'USA',
    },
    stallCount: 8,
    powerKw: 250,
    counted: true,
    otherEvs: false,
  }
}

function buildStationGrid() {
  const stations: Station[] = []
  const anchors = [
    [35.1, -85.3, 'TN'],
    [33.7, -84.4, 'GA'],
    [30.3, -81.6, 'FL'],
    [29.8, -95.4, 'TX'],
    [33.4, -112.1, 'AZ'],
    [34.1, -118.2, 'CA'],
    [37.8, -122.4, 'CA'],
    [45.5, -122.7, 'OR'],
    [39.7, -105.0, 'CO'],
    [41.9, -87.6, 'IL'],
    [40.7, -74.0, 'NY'],
    [38.9, -77.0, 'DC'],
  ] as const

  anchors.forEach(([lat, lon, state], anchorIndex) => {
    for (let offset = 0; offset < 5; offset += 1) {
      stations.push(
        makeStation(
          anchorIndex * 5 + offset,
          lat + offset * 0.08,
          lon + offset * 0.08,
          state,
        ),
      )
    }
  })

  return stations
}

describe('route optimizer', () => {
  it('generates many route candidates with day-level plans', () => {
    const result = optimizeRoutes(buildStationGrid(), {
      ...defaultPlannerConfig,
      targetStations: 25,
      tripWeeks: 9,
    })

    expect(result.routes.length).toBeGreaterThanOrEqual(15)
    expect(result.routes[0].uniqueStations).toBeGreaterThanOrEqual(25)
    expect(result.routes[0].days.length).toBeGreaterThan(1)
    expect(result.routes[0].averageDriveHoursPerDay).toBeGreaterThan(0)
    expect(result.routes[0].routeLine[0]).toEqual(defaultPlannerConfig.start)
  })

  it('starts every loop with a northbound first stop that is not west when available', () => {
    const stations = [
      makeStation(
        900,
        defaultPlannerConfig.start.lat - 0.01,
        defaultPlannerConfig.start.lon - 0.02,
        'GA',
      ),
      makeStation(
        901,
        defaultPlannerConfig.start.lat + 0.005,
        defaultPlannerConfig.start.lon - 0.005,
      ),
      ...buildStationGrid(),
    ]
    const result = optimizeRoutes(stations, {
      ...defaultPlannerConfig,
      targetStations: 25,
      tripWeeks: 9,
    })

    result.routes.forEach((route) => {
      expect(route.visits[0]?.station.position.lat).toBeGreaterThan(
        defaultPlannerConfig.start.lat,
      )
      expect(route.routeLine[1]?.lat).toBeGreaterThan(
        defaultPlannerConfig.start.lat,
      )
      expect(route.routeLine[1]?.lon).toBeGreaterThanOrEqual(
        defaultPlannerConfig.start.lon,
      )
    })
  })

  it('reports medium auxiliary-charging advisories when practical range is too low', () => {
    const result = optimizeRoutes(buildStationGrid(), {
      ...defaultPlannerConfig,
      targetStations: 25,
      practicalRangeMiles: 80,
    })

    expect(
      result.routes.some((route) =>
        route.advisories.some((advisory) => advisory.severity === 'medium'),
      ),
    ).toBe(true)
    expect(
      result.routes.some((route) =>
        route.visits.some((visit) => visit.rangeWarning),
      ),
    ).toBe(true)
  })

  it('inserts transfer connector stops into long repositioning legs', () => {
    const result = optimizeRoutes(buildStationGrid(), {
      ...defaultPlannerConfig,
      targetStations: 25,
      practicalRangeMiles: 180,
    })

    expect(
      result.routes.some((route) =>
        route.visits.some((visit) => visit.connectorStop),
      ),
    ).toBe(true)
    expect(
      result.routes.some((route) =>
        route.advisories.some((advisory) =>
          advisory.message.includes('transfer connector'),
        ),
      ),
    ).toBe(true)
  })

  it('carries range forward across clustered stops before requiring another full charge', () => {
    const orderedStations = [
      makeStation(1000, 36.0, -84.8),
      makeStation(1001, 36.1, -84.7),
      makeStation(1002, 36.2, -84.6),
    ]
    const route = refineRouteWithRoadLegs(
      orderedStations,
      {
        ...defaultPlannerConfig,
        practicalRangeMiles: 220,
        closeStationStopMinutes: 2,
        distanceChargeStopMinutes: 18,
      },
      {
        id: 'test-route',
        name: 'Test Route',
        strategy: 'Test stateful charging',
        color: '#d72638',
      },
      [180, 10, 10, 100],
      [3, 0.2, 0.2, 1.7],
    )

    expect(route.visits.map((visit) => visit.stopMinutes)).toEqual([
      2,
      2,
      18,
    ])
  })

  it('creates explained long days when the extra site return is high enough', () => {
    const withoutLongDays = optimizeRoutes(buildStationGrid(), {
      ...defaultPlannerConfig,
      targetStations: 45,
      dailyDriveTargetHours: 3,
      dailyDriveMaxHours: 3.5,
      longDayOptimization: false,
    })
    const withLongDays = optimizeRoutes(buildStationGrid(), {
      ...defaultPlannerConfig,
      targetStations: 45,
      dailyDriveTargetHours: 3,
      dailyDriveMaxHours: 3.5,
      longDayOptimization: true,
      longDayMaxHours: 9,
      longDayMinSitesPerExtraHour: 0.5,
    })
    const regularRoute = withoutLongDays.routes[0]
    const optimizedRoute = withLongDays.routes[0]

    expect(optimizedRoute.longDays).toBeGreaterThan(0)
    expect(optimizedRoute.totalDays).toBeLessThanOrEqual(regularRoute.totalDays)
    expect(
      optimizedRoute.days.some((day) =>
        day.longDayReason?.includes('Worth it'),
      ),
    ).toBe(true)
  })

  it('does not draw a direct Florida-to-Texas shortcut across the Gulf', () => {
    const result = optimizeRoutes(buildStationGrid(), {
      ...defaultPlannerConfig,
      targetStations: 25,
      tripWeeks: 9,
    })
    const balancedRoute = result.routes.find(
      (route) => route.id === 'balanced-national',
    )

    expect(balancedRoute).toBeDefined()
    const hasDirectGulfJump = balancedRoute!.routeLine.some((point, index) => {
      const next = balancedRoute!.routeLine[index + 1]
      if (!next) return false

      const pointIsSouthFlorida = point.lat < 28.5 && point.lon > -83
      const nextIsTexasOrLouisianaWest =
        next.lat < 31.5 && next.lon < -90 && next.lon > -98
      const reverse =
        next.lat < 28.5 &&
        next.lon > -83 &&
        point.lat < 31.5 &&
        point.lon < -90 &&
        point.lon > -98

      return (pointIsSouthFlorida && nextIsTexasOrLouisianaWest) || reverse
    })

    expect(hasDirectGulfJump).toBe(false)
  })
})
