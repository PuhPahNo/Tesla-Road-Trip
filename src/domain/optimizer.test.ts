import { describe, expect, it } from 'vitest'
import { defaultPlannerConfig } from './config'
import { haversineMiles } from './geo'
import { optimizeRoutes, refineRouteWithRoadLegs } from './optimizer'
import type { SavedCustomRoute, Station } from './types'

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

function makeNamedStation(
  index: number,
  name: string,
  city: string,
  state: string,
  lat: number,
  lon: number,
): Station {
  const station = makeStation(index, lat, lon, state)
  return {
    ...station,
    name,
    address: {
      ...station.address,
      city,
      state,
    },
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

const mostUniqueConfig = {
  ...defaultPlannerConfig,
  plannerMode: 'most_unique_sites' as const,
}

describe('route optimizer', () => {
  it('generates many route candidates with day-level plans', () => {
    const result = optimizeRoutes(buildStationGrid(), {
      ...mostUniqueConfig,
      targetStations: 25,
      tripWeeks: 9,
    })

    expect(result.routes.length).toBeGreaterThanOrEqual(15)
    expect(result.routes[0].uniqueStations).toBeGreaterThanOrEqual(25)
    expect(result.routes[0].days.length).toBeGreaterThan(1)
    expect(result.routes[0].averageDriveHoursPerDay).toBeGreaterThan(0)
    expect(result.routes[0].routeLine[0]).toEqual(defaultPlannerConfig.start)
    expect(result.routes[0].rating.score).toBeGreaterThan(0)
    expect(result.routes[0].days.every((day) => day.rating.score > 0)).toBe(true)
  })

  it('defaults to longest trip mode with one unique streak stop per day', () => {
    const result = optimizeRoutes(buildStationGrid(), {
      ...defaultPlannerConfig,
      longestTripDays: 12,
    })
    const route = result.routes[0]

    expect(result.config.plannerMode).toBe('longest_trip')
    expect(result.routes.length).toBeGreaterThanOrEqual(20)
    expect(route.plannerMode).toBe('longest_trip')
    expect(route.uniqueStations).toBe(12)
    expect(route.totalDays).toBe(12)
    expect(route.days.every((day) => day.visits.length === 1)).toBe(true)
    expect(route.routeLine[0]).toEqual(defaultPlannerConfig.start)
    expect(route.routeLine.at(-1)).toEqual(defaultPlannerConfig.start)
    result.routes.forEach((candidate) => {
      expect(candidate.visits[0]?.station.position.lat).toBeGreaterThan(
        defaultPlannerConfig.start.lat,
      )
      expect(candidate.routeLine[1]?.lat).toBeGreaterThan(
        defaultPlannerConfig.start.lat,
      )
      expect(candidate.routeLine.at(-1)).toEqual(defaultPlannerConfig.start)
      expect(candidate.totalDays).toBe(12)
    })
    expect(
      route.advisories.some((item) =>
        item.message.includes('unique Supercharger per streak day'),
      ),
    ).toBe(true)
  })

  it('reserves configured Longest Trip target stay days', () => {
    const bayArea = { lat: 37.8, lon: -122.4 }
    const result = optimizeRoutes(buildStationGrid(), {
      ...defaultPlannerConfig,
      longestTripDays: 12,
      longestTripTargets: [
        {
          id: 'state-ca',
          type: 'state',
          label: 'California',
          state: 'CA',
          position: { lat: 37.1841, lon: -119.4696 },
          stayDays: 3,
        },
        {
          id: 'landmark-bay-area-test',
          type: 'landmark',
          label: 'Bay Area',
          position: bayArea,
          radiusMiles: 100,
          stayDays: 2,
        },
      ],
    })
    const route = result.routes[0]
    const californiaVisits = route.visits.filter(
      (visit) => visit.station.address.state === 'CA',
    )
    const bayAreaVisits = route.visits.filter(
      (visit) => haversineMiles(visit.station.position, bayArea) <= 100,
    )

    expect(route.totalDays).toBe(12)
    expect(route.uniqueStations).toBe(12)
    expect(californiaVisits.length).toBeGreaterThanOrEqual(3)
    expect(bayAreaVisits.length).toBeGreaterThanOrEqual(2)
  })

  it('reserves visit target stations in most unique sites mode', () => {
    const bayArea = { lat: 37.8, lon: -122.4 }
    const result = optimizeRoutes(buildStationGrid(), {
      ...mostUniqueConfig,
      targetStations: 30,
      tripWeeks: 9,
      longestTripTargets: [
        {
          id: 'landmark-bay-area-test',
          type: 'landmark',
          label: 'Bay Area',
          position: bayArea,
          radiusMiles: 100,
          stayDays: 3,
        },
      ],
    })
    const route = result.routes[0]
    const bayAreaVisits = route.visits.filter(
      (visit) => haversineMiles(visit.station.position, bayArea) <= 100,
    )

    expect(bayAreaVisits.length).toBeGreaterThanOrEqual(3)
  })

  it('tags rating-driven stay nights on longest trip day plans', () => {
    const result = optimizeRoutes(buildStationGrid(), {
      ...defaultPlannerConfig,
      longestTripDays: 20,
      tripPace: 'balanced',
      autoStays: true,
    })
    const stayDays = result.routes.flatMap((route) =>
      route.days.filter((day) => day.stay),
    )

    expect(stayDays.length).toBeGreaterThan(0)
    stayDays.forEach((day) => {
      expect(day.stay!.totalNights).toBeGreaterThanOrEqual(2)
      expect(day.stay!.night).toBeGreaterThanOrEqual(1)
      expect(day.stay!.night).toBeLessThanOrEqual(day.stay!.totalNights)
      expect(day.visits.length).toBe(1)
    })

    const routeWithRun = result.routes.find((route) =>
      route.days.some((day) => day.stay?.night === 1 && day.stay.totalNights >= 2),
    )
    expect(routeWithRun).toBeDefined()
    const days = routeWithRun!.days
    const runStart = days.findIndex(
      (day) => day.stay?.night === 1 && day.stay.totalNights >= 2,
    )
    const run = days[runStart].stay!
    for (let night = 1; night <= run.totalNights; night += 1) {
      const day = days[runStart + night - 1]
      expect(day.stay?.placeId).toBe(run.placeId)
      expect(day.stay?.night).toBe(night)
    }
  })

  it('drops all stays on sprint pace with auto stays disabled', () => {
    const result = optimizeRoutes(buildStationGrid(), {
      ...defaultPlannerConfig,
      longestTripDays: 12,
      tripPace: 'sprint',
      autoStays: false,
    })

    expect(result.config.tripPace).toBe('sprint')
    expect(result.config.autoStays).toBe(false)
  })

  it('optimizes saved custom stop order instead of preserving selection order', () => {
    const unorderedRoute: SavedCustomRoute = {
      id: 'saved-unordered-test',
      name: 'Unordered Stops',
      color: '#7c3aed',
      waypoints: [
        {
          id: 'city-los-angeles',
          label: 'Los Angeles',
          position: { lat: 34.0522, lon: -118.2437 },
          radiusMiles: 55,
        },
        {
          id: 'city-atlanta',
          label: 'Atlanta',
          position: { lat: 33.749, lon: -84.388 },
          radiusMiles: 50,
        },
      ],
      createdAt: '2026-07-03T00:00:00.000Z',
      updatedAt: '2026-07-03T00:00:00.000Z',
    }
    const result = optimizeRoutes(buildStationGrid(), {
      ...defaultPlannerConfig,
      longestTripDays: 12,
      savedCustomRoutes: [unorderedRoute],
    })
    const route = result.routes.find((candidate) => candidate.id === unorderedRoute.id)
    expect(route).toBeDefined()
    if (!route) throw new Error('Saved custom route was not generated.')

    const firstGeorgiaIndex = route.visits.findIndex(
      (visit) => visit.station.address.state === 'GA',
    )
    const firstCaliforniaIndex = route.visits.findIndex(
      (visit) => visit.station.address.state === 'CA',
    )

    expect(route.strategy).toContain('optimizes 2 selected stops')
    expect(firstGeorgiaIndex).toBeGreaterThanOrEqual(0)
    expect(firstCaliforniaIndex).toBeGreaterThanOrEqual(0)
    expect(firstGeorgiaIndex).toBeLessThan(firstCaliforniaIndex)
  })

  it('preserves saved stop order when keepOrder is set', () => {
    const orderedRoute: SavedCustomRoute = {
      id: 'saved-ordered-test',
      name: 'Ordered Stops',
      color: '#7c3aed',
      keepOrder: true,
      startMonth: 1,
      directionPreference: 'south',
      waypoints: [
        {
          id: 'city-los-angeles',
          label: 'Los Angeles',
          position: { lat: 34.0522, lon: -118.2437 },
          radiusMiles: 55,
        },
        {
          id: 'city-atlanta',
          label: 'Atlanta',
          position: { lat: 33.749, lon: -84.388 },
          radiusMiles: 50,
        },
      ],
      createdAt: '2026-07-03T00:00:00.000Z',
      updatedAt: '2026-07-03T00:00:00.000Z',
    }
    const result = optimizeRoutes(buildStationGrid(), {
      ...defaultPlannerConfig,
      longestTripDays: 12,
      savedCustomRoutes: [orderedRoute],
    })
    const route = result.routes.find((candidate) => candidate.id === orderedRoute.id)
    expect(route).toBeDefined()
    if (!route) throw new Error('Ordered custom route was not generated.')

    const firstGeorgiaIndex = route.visits.findIndex(
      (visit) => visit.station.address.state === 'GA',
    )
    const firstCaliforniaIndex = route.visits.findIndex(
      (visit) => visit.station.address.state === 'CA',
    )

    expect(route.strategy).toContain('exact saved order')
    expect(firstCaliforniaIndex).toBeGreaterThanOrEqual(0)
    expect(firstGeorgiaIndex).toBeGreaterThanOrEqual(0)
    expect(firstCaliforniaIndex).toBeLessThan(firstGeorgiaIndex)
  })

  it('honors an explicit first heading for an optimized custom route', () => {
    const eastFirstRoute: SavedCustomRoute = {
      id: 'saved-east-first',
      name: 'East First Loop',
      color: '#0891b2',
      startMonth: 1,
      directionPreference: 'east',
      waypoints: [
        {
          id: 'city-los-angeles',
          label: 'Los Angeles',
          position: { lat: 34.0522, lon: -118.2437 },
          radiusMiles: 55,
        },
        {
          id: 'city-new-york',
          label: 'New York City',
          position: { lat: 40.7128, lon: -74.006 },
          radiusMiles: 50,
        },
      ],
      createdAt: '2026-07-11T00:00:00.000Z',
      updatedAt: '2026-07-11T00:00:00.000Z',
    }
    const result = optimizeRoutes(buildStationGrid(), {
      ...defaultPlannerConfig,
      longestTripDays: 12,
      savedCustomRoutes: [eastFirstRoute],
    })
    const route = result.routes.find((candidate) => candidate.id === eastFirstRoute.id)
    expect(route).toBeDefined()
    if (!route) throw new Error('East-first custom route was not generated.')

    expect(route.strategy).toContain('starts east first')
    expect(route.visits[0]?.station.position.lon).toBeGreaterThan(
      defaultPlannerConfig.start.lon,
    )
  })

  it('starts a winter custom route south when season-smart direction is selected', () => {
    const winterRoute: SavedCustomRoute = {
      id: 'saved-winter-south-first',
      name: 'Winter Loop',
      color: '#7c3aed',
      startMonth: 1,
      directionPreference: 'seasonal',
      waypoints: [
        {
          id: 'city-new-york',
          label: 'New York City',
          position: { lat: 40.7128, lon: -74.006 },
          radiusMiles: 50,
        },
        {
          id: 'landmark-az-grand-canyon',
          label: 'Grand Canyon',
          position: { lat: 36.1069, lon: -112.1129 },
          radiusMiles: 95,
        },
        {
          id: 'city-miami',
          label: 'Miami',
          position: { lat: 25.7617, lon: -80.1918 },
          radiusMiles: 55,
        },
      ],
      createdAt: '2026-07-11T00:00:00.000Z',
      updatedAt: '2026-07-11T00:00:00.000Z',
    }
    const result = optimizeRoutes(buildStationGrid(), {
      ...defaultPlannerConfig,
      longestTripDays: 12,
      savedCustomRoutes: [winterRoute],
    })
    const route = result.routes.find((candidate) => candidate.id === winterRoute.id)
    expect(route).toBeDefined()
    if (!route) throw new Error('Winter custom route was not generated.')

    expect(route.strategy).toContain('starts south first')
    expect(route.visits[0]?.station.position.lat).toBeLessThan(
      defaultPlannerConfig.start.lat,
    )
  })

  it('uses a saved custom route day target without changing prebuilt route targets', () => {
    const customRoute: SavedCustomRoute = {
      id: 'saved-extended-trip',
      name: 'Extended Custom Trip',
      color: '#7c3aed',
      targetDays: 16,
      waypoints: [
        {
          id: 'city-atlanta',
          label: 'Atlanta',
          position: { lat: 33.749, lon: -84.388 },
          radiusMiles: 50,
        },
      ],
      createdAt: '2026-07-11T00:00:00.000Z',
      updatedAt: '2026-07-11T00:00:00.000Z',
    }
    const result = optimizeRoutes(buildStationGrid(), {
      ...defaultPlannerConfig,
      longestTripDays: 12,
      savedCustomRoutes: [customRoute],
    })

    expect(result.config.longestTripDays).toBe(12)
    expect(result.routes.find((route) => route.id === customRoute.id)?.totalDays).toBe(16)
    expect(
      result.routes.find((route) => route.id !== customRoute.id)?.totalDays,
    ).toBe(12)
  })

  it('applies saved route travel overrides without changing global preferences', () => {
    const routeId = 'saved-route-preferences'
    const savedRoute: SavedCustomRoute = {
      id: routeId,
      name: 'Slow Scenic Route',
      color: '#0891b2',
      waypoints: [
        {
          id: 'city-atlanta',
          label: 'Atlanta',
          position: { lat: 33.749, lon: -84.388 },
          radiusMiles: 50,
        },
      ],
      travelPreferences: {
        vehicleProfileId: 'model-s-awd',
        practicalRangeMiles: 305,
        manualPracticalRange: false,
        tripPace: 'savor',
        dailyDriveTargetHours: 2,
        dailyDriveMaxHours: 3,
      },
      createdAt: '2026-07-11T00:00:00.000Z',
      updatedAt: '2026-07-11T00:00:00.000Z',
    }
    const station = makeNamedStation(
      850,
      'Atlanta Supercharger',
      'Atlanta',
      'GA',
      33.749,
      -84.388,
    )
    const route = refineRouteWithRoadLegs(
      [station],
      {
        ...mostUniqueConfig,
        dailyDriveTargetHours: 8,
        dailyDriveMaxHours: 10,
        savedCustomRoutes: [savedRoute],
      },
      {
        id: routeId,
        name: savedRoute.name,
        strategy: 'Route-specific preference test',
        color: savedRoute.color,
      },
      [180, 180],
      [4, 4],
    )

    expect(route.days.length).toBeGreaterThan(1)
    expect(route.days.every((day) => day.driveHours <= 4)).toBe(true)
  })

  it('guarantees a state signature stop for states the streak drives through', () => {
    const sedona = { lat: 34.8697, lon: -111.7609 }
    const grandCanyon = { lat: 36.1069, lon: -112.1129 }
    const result = optimizeRoutes(
      [
        ...buildStationGrid(),
        makeNamedStation(800, 'Sedona Supercharger', 'Sedona', 'AZ', 34.8697, -111.7609),
      ],
      {
        ...defaultPlannerConfig,
        longestTripDays: 12,
      },
    )

    // Any Arizona presence counts — even a route that only crosses the
    // state via a range connector drives through it and owes a signature.
    const arizonaRoutes = result.routes.filter((route) =>
      route.visits.some((visit) => visit.station.address.state === 'AZ'),
    )

    expect(arizonaRoutes.length).toBeGreaterThan(0)
    arizonaRoutes.forEach((route) => {
      const covered = route.visits.some(
        (visit) =>
          haversineMiles(visit.station.position, sedona) <= 55 ||
          haversineMiles(visit.station.position, grandCanyon) <= 95,
      )
      expect(covered).toBe(true)
    })
  })

  it('warns when a driven-through state has no reachable signature stop', () => {
    const result = optimizeRoutes(buildStationGrid(), {
      ...defaultPlannerConfig,
      longestTripDays: 12,
    })
    // The grid's only Florida stations sit in Jacksonville, far from every
    // Florida signature (Kennedy Space Center, Disney, South Beach).
    const floridaRoutes = result.routes.filter((route) =>
      route.visits.some((visit) => visit.station.address.state === 'FL'),
    )

    expect(floridaRoutes.length).toBeGreaterThan(0)
    floridaRoutes.forEach((route) => {
      expect(
        route.warnings.some((warning) => warning.includes('Florida')),
      ).toBe(true)
    })
  })

  it('rates visited cities, landmarks, day segments, and the full trip', () => {
    const result = optimizeRoutes(
      [
        ...buildStationGrid(),
        makeNamedStation(
          700,
          'Tusayan Grand Canyon Supercharger',
          'Tusayan',
          'AZ',
          35.973,
          -112.126,
        ),
        makeNamedStation(
          701,
          'San Francisco Supercharger',
          'San Francisco',
          'CA',
          37.7749,
          -122.4194,
        ),
      ],
      {
        ...defaultPlannerConfig,
        longestTripDays: 10,
        longestTripTargets: [
          {
            id: 'landmark-grand-canyon',
            type: 'landmark',
            label: 'Grand Canyon',
            position: { lat: 36.0544, lon: -112.1401 },
            radiusMiles: 95,
            stayDays: 1,
          },
          {
            id: 'city-san-francisco',
            type: 'city',
            label: 'San Francisco Bay Area',
            position: { lat: 37.7749, lon: -122.4194 },
            radiusMiles: 55,
            stayDays: 1,
          },
        ],
      },
    )
    const route = result.routes[0]

    expect(route.rating.score).toBeGreaterThan(60)
    expect(route.rating.sceneryScore).toBeGreaterThan(60)
    expect(route.days.every((day) => day.rating.score > 0)).toBe(true)
    expect(
      route.rating.places.some(
        (place) => place.type === 'landmark' && place.label.includes('Grand Canyon'),
      ),
    ).toBe(true)
    expect(
      route.rating.places.some(
        (place) => place.type === 'city' && place.label.includes('San Francisco'),
      ),
    ).toBe(true)
  })

  it('recalculates refined route ratings from selected custom place targets', () => {
    const memphisStop = makeNamedStation(
      702,
      'Memphis Downtown Supercharger',
      'Memphis',
      'TN',
      35.135,
      -90.057,
    )
    const meta = {
      id: 'custom-ai-route',
      name: 'Custom AI Route',
      strategy: 'Test custom target rating',
      color: '#7c3aed',
    }
    const baseRoute = refineRouteWithRoadLegs(
      [memphisStop],
      mostUniqueConfig,
      meta,
      [60, 60],
      [1, 1],
    )
    const targetedRoute = refineRouteWithRoadLegs(
      [memphisStop],
      {
        ...mostUniqueConfig,
        customRouteWaypoints: [
          {
            id: 'landmark-custom-civil-rights-museum',
            label: 'National Civil Rights Museum',
            position: { lat: 35.1345, lon: -90.0576 },
            radiusMiles: 35,
          },
        ],
      },
      meta,
      [60, 60],
      [1, 1],
    )

    expect(
      targetedRoute.rating.places.some((place) =>
        place.label.includes('National Civil Rights Museum'),
      ),
    ).toBe(true)
    expect(
      targetedRoute.days.some((day) =>
        day.rating.places.some((place) =>
          place.label.includes('National Civil Rights Museum'),
        ),
      ),
    ).toBe(true)
    expect(targetedRoute.rating.score).toBeGreaterThan(baseRoute.rating.score)
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
      ...mostUniqueConfig,
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
      ...mostUniqueConfig,
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
      ...mostUniqueConfig,
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
        ...mostUniqueConfig,
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
    expect(route.rating.score).toBeGreaterThan(0)
    expect(route.days.every((day) => day.rating.score > 0)).toBe(true)
  })

  it('creates explained long days when the extra site return is high enough', () => {
    const withoutLongDays = optimizeRoutes(buildStationGrid(), {
      ...mostUniqueConfig,
      targetStations: 45,
      dailyDriveTargetHours: 3,
      dailyDriveMaxHours: 3.5,
      longDayOptimization: false,
    })
    const withLongDays = optimizeRoutes(buildStationGrid(), {
      ...mostUniqueConfig,
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
      ...mostUniqueConfig,
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
