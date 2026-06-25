import { defaultPlannerConfig, sanitizePlannerConfig } from './config'
import {
  anchorOrders,
  haversineMiles,
  polylineLengthMiles,
  round,
  scoreAgainstPolyline,
} from './geo'
import { estimateAllSitesFeasibility } from './rules'
import {
  countryCounts,
  filterOpenStations,
  filterStationsForConfig,
} from './stations'
import type {
  Coordinate,
  DayPlan,
  OptimizeResponse,
  PlannerAdvisory,
  PlannerConfig,
  RoutePlan,
  RouteStationVisit,
  RouteWaypoint,
  Station,
} from './types'

interface RouteVariant {
  id: string
  name: string
  strategy: string
  color: string
  corridorMiles: number
  anchors: Coordinate[]
  forcedWaypoints: RouteWaypoint[]
}

interface ScoredStation {
  station: Station
  distanceMiles: number
  order: number
  segmentIndex: number
  segmentProgress: number
}

const CITY = {
  chattanooga: { lat: 35.0795399, lon: -85.3082738 },
  atlanta: { lat: 33.749, lon: -84.388 },
  jacksonville: { lat: 30.3322, lon: -81.6557 },
  miami: { lat: 25.7617, lon: -80.1918 },
  tampa: { lat: 27.9506, lon: -82.4572 },
  tallahassee: { lat: 30.4383, lon: -84.2807 },
  pensacola: { lat: 30.4213, lon: -87.2169 },
  mobile: { lat: 30.6954, lon: -88.0399 },
  newOrleans: { lat: 29.9511, lon: -90.0715 },
  houston: { lat: 29.7604, lon: -95.3698 },
  dallas: { lat: 32.7767, lon: -96.797 },
  sanAntonio: { lat: 29.4241, lon: -98.4936 },
  elPaso: { lat: 31.7619, lon: -106.485 },
  phoenix: { lat: 33.4484, lon: -112.074 },
  sanDiego: { lat: 32.7157, lon: -117.1611 },
  losAngeles: { lat: 34.0522, lon: -118.2437 },
  sanFrancisco: { lat: 37.7749, lon: -122.4194 },
  sacramento: { lat: 38.5816, lon: -121.4944 },
  portland: { lat: 45.5152, lon: -122.6784 },
  seattle: { lat: 47.6062, lon: -122.3321 },
  boise: { lat: 43.615, lon: -116.2023 },
  saltLakeCity: { lat: 40.7608, lon: -111.891 },
  denver: { lat: 39.7392, lon: -104.9903 },
  kansasCity: { lat: 39.0997, lon: -94.5786 },
  stLouis: { lat: 38.627, lon: -90.1994 },
  chicago: { lat: 41.8781, lon: -87.6298 },
  minneapolis: { lat: 44.9778, lon: -93.265 },
  detroit: { lat: 42.3314, lon: -83.0458 },
  cleveland: { lat: 41.4993, lon: -81.6944 },
  pittsburgh: { lat: 40.4406, lon: -79.9959 },
  buffalo: { lat: 42.8864, lon: -78.8784 },
  boston: { lat: 42.3601, lon: -71.0589 },
  newYork: { lat: 40.7128, lon: -74.006 },
  philadelphia: { lat: 39.9526, lon: -75.1652 },
  washingtonDc: { lat: 38.9072, lon: -77.0369 },
  charlotte: { lat: 35.2271, lon: -80.8431 },
  nashville: { lat: 36.1627, lon: -86.7816 },
  memphis: { lat: 35.1495, lon: -90.049 },
}

function buildVariants(
  start: Coordinate,
  requiredWaypoints: RouteWaypoint[],
  customRouteWaypoints: RouteWaypoint[],
): RouteVariant[] {
  const variants = [
    {
      id: 'balanced-national',
      name: 'Balanced National Loop',
      strategy:
        'A broad lower-48 loop that samples the Southeast, Texas, Southwest, California, Pacific Northwest, Rockies, Great Lakes, and Northeast.',
      color: '#d72638',
      corridorMiles: 145,
      anchors: [
        start,
        CITY.atlanta,
        CITY.jacksonville,
        CITY.miami,
        CITY.tampa,
        CITY.tallahassee,
        CITY.pensacola,
        CITY.mobile,
        CITY.newOrleans,
        CITY.houston,
        CITY.elPaso,
        CITY.phoenix,
        CITY.losAngeles,
        CITY.sanFrancisco,
        CITY.seattle,
        CITY.saltLakeCity,
        CITY.denver,
        CITY.chicago,
        CITY.detroit,
        CITY.newYork,
        CITY.washingtonDc,
        CITY.charlotte,
        start,
      ],
      forcedWaypoints: requiredWaypoints,
    },
    {
      id: 'northeast-density',
      name: 'Northeast Density Loop',
      strategy:
        'A station-dense sweep through the Southeast, Mid-Atlantic, New York, New England, Pennsylvania, Ohio, Michigan, and Chicago.',
      color: '#006d77',
      corridorMiles: 120,
      anchors: [
        start,
        CITY.atlanta,
        CITY.jacksonville,
        CITY.charlotte,
        CITY.washingtonDc,
        CITY.philadelphia,
        CITY.newYork,
        CITY.boston,
        CITY.buffalo,
        CITY.cleveland,
        CITY.detroit,
        CITY.chicago,
        CITY.stLouis,
        CITY.nashville,
        start,
      ],
      forcedWaypoints: requiredWaypoints,
    },
    {
      id: 'sunbelt-west',
      name: 'Sunbelt and West Loop',
      strategy:
        'A warm-weather loop across the Gulf, Texas metros, Southwest, Southern California, Bay Area, Las Vegas corridor, Colorado, and Midwest return.',
      color: '#f46036',
      corridorMiles: 135,
      anchors: [
        start,
        CITY.memphis,
        CITY.newOrleans,
        CITY.houston,
        CITY.sanAntonio,
        CITY.dallas,
        CITY.elPaso,
        CITY.phoenix,
        CITY.sanDiego,
        CITY.losAngeles,
        CITY.sanFrancisco,
        CITY.saltLakeCity,
        CITY.denver,
        CITY.kansasCity,
        CITY.stLouis,
        start,
      ],
      forcedWaypoints: requiredWaypoints,
    },
    {
      id: 'great-lakes-mid-atlantic',
      name: 'Great Lakes and Mid-Atlantic',
      strategy:
        'An efficient interior loop with high site density across Chicago, Wisconsin/Minnesota edges, Michigan, Ohio, Pennsylvania, New Jersey, DC, Virginia, and the Carolinas.',
      color: '#2f7d32',
      corridorMiles: 130,
      anchors: [
        start,
        CITY.stLouis,
        CITY.chicago,
        CITY.minneapolis,
        CITY.detroit,
        CITY.cleveland,
        CITY.pittsburgh,
        CITY.philadelphia,
        CITY.newYork,
        CITY.washingtonDc,
        CITY.charlotte,
        CITY.atlanta,
        start,
      ],
      forcedWaypoints: requiredWaypoints,
    },
    {
      id: 'west-coast-reach',
      name: 'West Coast Reach',
      strategy:
        'A larger-mileage plan that reaches the densest California corridor and Pacific Northwest before returning through the Rockies and central states.',
      color: '#5b5fc7',
      corridorMiles: 150,
      anchors: [
        start,
        CITY.nashville,
        CITY.dallas,
        CITY.elPaso,
        CITY.phoenix,
        CITY.sanDiego,
        CITY.losAngeles,
        CITY.sanFrancisco,
        CITY.sacramento,
        CITY.portland,
        CITY.seattle,
        CITY.boise,
        CITY.saltLakeCity,
        CITY.denver,
        CITY.kansasCity,
        CITY.stLouis,
        start,
      ],
      forcedWaypoints: requiredWaypoints,
    },
  ].map((variant) => ({
    ...variant,
    anchors: insertRequiredWaypoints(variant.anchors, requiredWaypoints),
  }))

  if (customRouteWaypoints.length > 0) {
    const customForcedWaypoints = dedupeWaypoints([
      ...requiredWaypoints,
      ...customRouteWaypoints,
    ])
    variants.push({
      id: 'custom-ai-route',
      name: 'Custom AI Route',
      strategy: `A custom ordered corridor through ${customRouteWaypoints.map((waypoint) => waypoint.label).join(' -> ')} before returning to the start.`,
      color: '#7c3aed',
      corridorMiles: 150,
      anchors: [
        start,
        ...customRouteWaypoints.map((waypoint) => waypoint.position),
        start,
      ],
      forcedWaypoints: customForcedWaypoints,
    })
  }

  return variants
}

function chooseStationsForVariant(
  variant: RouteVariant,
  stations: Station[],
  targetStations: number,
  requiredWaypoints: RouteWaypoint[],
) {
  const target = Math.min(targetStations, stations.length)
  let corridorMiles = variant.corridorMiles
  let scored = scoreStations(variant.anchors, stations)

  while (
    scored.filter((station) => station.distanceMiles <= corridorMiles).length <
      target &&
    corridorMiles < 900
  ) {
    corridorMiles += 75
  }

  let selected = scored
    .filter((station) => station.distanceMiles <= corridorMiles)
    .sort((a, b) => a.distanceMiles - b.distanceMiles)
    .slice(0, target)
    .sort((a, b) => a.order - b.order || a.distanceMiles - b.distanceMiles)

  const forcedStationIds = new Set<string>()
  const waypointWarnings: string[] = []

  requiredWaypoints.forEach((waypoint) => {
    const nearest = nearestScoredStation(waypoint, scored)
    if (!nearest) return

    forcedStationIds.add(nearest.station.id)
    if (!selected.some((item) => item.station.id === nearest.station.id)) {
      selected = [...selected, nearest]
    }

    const directMiles = haversineMiles(waypoint.position, nearest.station.position)
    if (directMiles > waypoint.radiusMiles) {
      waypointWarnings.push(
        `Closest Supercharger to ${waypoint.label} is ${round(directMiles)} miles away at ${nearest.station.name}; verify the Tesla app before treating it as an exact stop.`,
      )
    }
  })

  if (selected.length > target) {
    const forced = selected.filter((station) =>
      forcedStationIds.has(station.station.id),
    )
    const regular = selected.filter(
      (station) => !forcedStationIds.has(station.station.id),
    )
    selected = [...forced, ...regular].slice(0, Math.max(target, forced.length))
  }

  return {
    selected: selected.sort(
      (a, b) => a.order - b.order || a.distanceMiles - b.distanceMiles,
    ),
    waypointWarnings,
  }
}

function scoreStations(anchors: Coordinate[], stations: Station[]) {
  return stations.map<ScoredStation>((station) => ({
    station,
    ...scoreAgainstPolyline(station.position, anchors),
  }))
}

function stopMinutesForLeg(legMiles: number, config: PlannerConfig) {
  if (legMiles <= config.closeStationRadiusMiles) {
    return config.closeStationStopMinutes
  }
  return config.distanceChargeStopMinutes
}

function emptyDay(day: number): DayPlan {
  return {
    day,
    miles: 0,
    driveHours: 0,
    stopMinutes: 0,
    uniqueStations: 0,
    averageDistanceBetweenSuperchargers: 0,
    visits: [],
    warnings: [],
    advisories: [],
    longDayOptimized: false,
  }
}

function buildDayPlans(
  selectedStations: ScoredStation[],
  variant: RouteVariant,
  config: PlannerConfig,
) {
  const days: DayPlan[] = []
  const visits: RouteStationVisit[] = []
  let day = emptyDay(1)
  let previous = {
    position: config.start,
    order: 0,
    distanceMiles: 0,
  }
  const routeLength = polylineLengthMiles(variant.anchors)

  for (let index = 0; index < selectedStations.length; index += 1) {
    const scoredStation = selectedStations[index]
    const legMiles = corridorLegMiles(
      previous,
      scoredStation,
      config.roadDistanceFactor,
    )
    const driveHours = legMiles / config.averageMph

    const projectedDriveHours = day.driveHours + driveHours
    const longDayOpportunity = evaluateLongDayOpportunity(
      day,
      index,
      selectedStations,
      previous,
      config,
    )

    if (day.visits.length > 0 && projectedDriveHours > config.dailyDriveTargetHours) {
      if (longDayOpportunity.allow) {
        day.longDayOptimized = true
        day.longDayReason = longDayOpportunity.reason
      } else {
        days.push(finalizeDay(day, config))
        day = emptyDay(day.day + 1)
      }
    }

    const activeLegMiles =
      day.visits.length === 0 && projectedDriveHours > config.dailyDriveTargetHours
        ? corridorLegMiles(previous, scoredStation, config.roadDistanceFactor)
        : legMiles
    const activeDriveHours = activeLegMiles / config.averageMph
    const activeStopMinutes = stopMinutesForLeg(activeLegMiles, config)

    if (
      day.visits.length > 0 &&
      day.driveHours + activeDriveHours > getCurrentDayCap(day, config)
    ) {
      days.push(finalizeDay(day, config))
      day = emptyDay(day.day + 1)
    }

    const visit: RouteStationVisit = {
      sequence: index + 1,
      day: day.day,
      station: scoredStation.station,
      legMiles: round(activeLegMiles),
      driveHours: round(activeDriveHours, 2),
      stopMinutes: activeStopMinutes,
      rangeWarning: activeLegMiles > config.practicalRangeMiles,
    }

    day.miles += activeLegMiles
    day.driveHours += activeDriveHours
    day.stopMinutes += activeStopMinutes
    day.uniqueStations += 1
    day.visits.push(visit)
    visits.push(visit)
    previous = {
      position: scoredStation.station.position,
      order: scoredStation.order,
      distanceMiles: scoredStation.distanceMiles,
    }
  }

  const returnLegMiles = corridorReturnMiles(
    previous,
    config.start,
    routeLength,
    config.roadDistanceFactor,
  )
  const returnDriveHours = returnLegMiles / config.averageMph

  if (
    day.visits.length > 0 &&
    day.driveHours + returnDriveHours > config.dailyDriveTargetHours
  ) {
    days.push(finalizeDay(day, config))
    day = emptyDay(day.day + 1)
  }

  day.miles += returnLegMiles
  day.driveHours += returnDriveHours
  if (returnLegMiles > config.practicalRangeMiles) {
    day.warnings.push(
      `Return leg is ${round(returnLegMiles)} miles, above configured practical range.`,
    )
  }
  days.push(finalizeDay(day, config))

  const totalMiles = days.reduce((sum, item) => sum + item.miles, 0)
  const totalDriveHours = days.reduce((sum, item) => sum + item.driveHours, 0)
  const totalStopHours =
    days.reduce((sum, item) => sum + item.stopMinutes, 0) / 60
  const availableDays = Math.round(config.tripWeeks * 7)
  const warnings: string[] = []
  const advisories: PlannerAdvisory[] = []
  const overRangeCount = visits.filter((visit) => visit.rangeWarning).length
  const longDays = days.filter((item) => item.longDayOptimized).length

  if (days.length > availableDays) {
    warnings.push(
      `${days.length} planned days exceeds the configured ${availableDays}-day trip window.`,
    )
  }
  if (overRangeCount > 0) {
    advisories.push({
      severity: 'medium',
      message: `${overRangeCount} legs exceed the configured Supercharger-to-Supercharger range. Plan auxiliary non-Tesla charging stops on those legs.`,
    })
  }
  if (days.some((item) => exceedsAllowedDayCap(item, config))) {
    warnings.push('At least one day exceeds the configured hard drive cap.')
  }
  if (longDays > 0) {
    advisories.push({
      severity: 'info',
      message: `${longDays} long day${longDays === 1 ? '' : 's'} intentionally exceed the normal cap because the added unique-site density cleared your long-day threshold.`,
    })
  }
  if (visits.length < config.targetStations) {
    warnings.push(
      `Only ${visits.length} matching sites were available for ${variant.name} under the current station filters.`,
    )
  }
  if (visits.length / Math.max(1, days.length) > 18) {
    warnings.push(
      'This plan requires an extremely high daily station pace. Verify short-session assumptions in Tesla Passport before relying on it.',
    )
  }

  return {
    days,
    visits,
    totals: {
      totalMiles: round(totalMiles),
      totalDriveHours: round(totalDriveHours, 1),
      totalStopHours: round(totalStopHours, 1),
      warnings,
      advisories,
      longDays,
    },
  }
}

function getCurrentDayCap(day: DayPlan, config: PlannerConfig) {
  if (config.longDayOptimization && day.longDayOptimized) {
    return config.longDayMaxHours
  }

  return config.dailyDriveMaxHours
}

function exceedsAllowedDayCap(day: DayPlan, config: PlannerConfig) {
  if (config.longDayOptimization && day.longDayOptimized) {
    return day.driveHours > config.longDayMaxHours
  }

  return day.driveHours > config.dailyDriveMaxHours
}

function evaluateLongDayOpportunity(
  day: DayPlan,
  startIndex: number,
  selectedStations: ScoredStation[],
  previous: { position: Coordinate; order: number; distanceMiles: number },
  config: PlannerConfig,
) {
  if (!config.longDayOptimization) {
    return { allow: false }
  }

  if (day.driveHours >= config.longDayMaxHours) {
    return { allow: false }
  }

  let simulatedPrevious = previous
  let simulatedDriveHours = day.driveHours
  let addedSites = 0
  let addedMiles = 0

  for (let index = startIndex; index < selectedStations.length; index += 1) {
    const station = selectedStations[index]
    const legMiles = corridorLegMiles(
      simulatedPrevious,
      station,
      config.roadDistanceFactor,
    )
    const legDriveHours = legMiles / config.averageMph

    if (simulatedDriveHours + legDriveHours > config.longDayMaxHours) {
      break
    }

    simulatedDriveHours += legDriveHours
    addedMiles += legMiles
    addedSites += 1
    simulatedPrevious = {
      position: station.station.position,
      order: station.order,
      distanceMiles: station.distanceMiles,
    }
  }

  const extraDriveHours = Math.max(
    0,
    simulatedDriveHours - config.dailyDriveTargetHours,
  )
  const sitesPerExtraHour =
    extraDriveHours > 0 ? addedSites / extraDriveHours : 0
  const allow =
    addedSites > 0 &&
    extraDriveHours > 0 &&
    sitesPerExtraHour >= config.longDayMinSitesPerExtraHour

  if (!allow) {
    return { allow: false }
  }

  return {
    allow: true,
    reason: `Worth it: extending to ${round(simulatedDriveHours, 1)}h adds ${addedSites} unique site${addedSites === 1 ? '' : 's'} for ${round(extraDriveHours, 1)} extra drive hours (${round(sitesPerExtraHour, 1)} sites/extra hour, ${round(addedMiles)} added miles).`,
  }
}

function corridorLegMiles(
  previous: { position: Coordinate; order: number; distanceMiles: number },
  next: ScoredStation,
  roadDistanceFactor: number,
) {
  const corridorMiles =
    Math.abs(next.order - previous.order) +
    previous.distanceMiles +
    next.distanceMiles
  const directMiles = haversineMiles(previous.position, next.station.position)

  return Math.max(corridorMiles, directMiles) * roadDistanceFactor
}

function corridorReturnMiles(
  previous: { position: Coordinate; order: number; distanceMiles: number },
  start: Coordinate,
  routeLength: number,
  roadDistanceFactor: number,
) {
  const corridorMiles =
    Math.max(0, routeLength - previous.order) + previous.distanceMiles
  const directMiles = haversineMiles(previous.position, start)

  return Math.max(corridorMiles, directMiles) * roadDistanceFactor
}

function buildDisplayRouteLine(
  selectedStations: ScoredStation[],
  anchors: Coordinate[],
) {
  const anchorPoints = anchorOrders(anchors)
  const stationPoints = selectedStations.map((selected) => ({
    order: selected.order,
    point: selected.station.position,
  }))

  return [...anchorPoints, ...stationPoints]
    .sort((a, b) => a.order - b.order)
    .map((item) => item.point)
}

function insertRequiredWaypoints(
  anchors: Coordinate[],
  requiredWaypoints: RouteWaypoint[],
) {
  if (requiredWaypoints.length === 0) return anchors

  const insertions = requiredWaypoints.map((waypoint) => ({
    waypoint,
    ...scoreAgainstPolyline(waypoint.position, anchors),
  }))

  return anchors.flatMap((anchor, index) => {
    if (index === anchors.length - 1) return [anchor]

    const nextInsertions = insertions
      .filter((insertion) => insertion.segmentIndex === index)
      .sort((a, b) => a.segmentProgress - b.segmentProgress)
      .map((insertion) => insertion.waypoint.position)

    return [anchor, ...nextInsertions]
  })
}

function nearestScoredStation(
  waypoint: RouteWaypoint,
  scoredStations: ScoredStation[],
) {
  return scoredStations
    .map((station) => ({
      ...station,
      waypointDistanceMiles: haversineMiles(
        station.station.position,
        waypoint.position,
      ),
    }))
    .sort(
      (a, b) =>
        a.waypointDistanceMiles - b.waypointDistanceMiles ||
        a.distanceMiles - b.distanceMiles,
    )[0]
}

function dedupeWaypoints(waypoints: RouteWaypoint[]) {
  const seen = new Set<string>()
  return waypoints.filter((waypoint) => {
    if (seen.has(waypoint.id)) return false
    seen.add(waypoint.id)
    return true
  })
}

function finalizeDay(day: DayPlan, config: PlannerConfig): DayPlan {
  const warnings = [...day.warnings]
  const advisories = [...day.advisories]
  const overRangeVisits = day.visits.filter((visit) => visit.rangeWarning)
  const densityLongDay =
    config.longDayOptimization &&
    day.longDayOptimized &&
    day.driveHours > config.dailyDriveMaxHours &&
    day.driveHours <= config.longDayMaxHours
  const transferLongDay =
    config.longDayOptimization &&
    !day.longDayOptimized &&
    day.visits.length <= 1 &&
    day.driveHours > config.dailyDriveMaxHours &&
    day.driveHours <= config.longDayMaxHours
  const longDayOptimized = densityLongDay || transferLongDay
  const extraTargetHours = Math.max(
    0.1,
    day.driveHours - config.dailyDriveTargetHours,
  )
  const longDayReason =
    transferLongDay
      ? `Long transfer: ${round(day.driveHours, 1)}h keeps the route moving through sparse Supercharger spacing; use the auxiliary-charging advisory on this leg.`
      : densityLongDay
        ? `Worth it: ${round(day.driveHours, 1)}h day is ${round(day.driveHours - config.dailyDriveTargetHours, 1)}h over target and captures ${day.uniqueStations} unique sites (${round(day.uniqueStations / extraTargetHours, 1)} sites/extra target hour).`
        : undefined
  const dayForCap = {
    ...day,
    longDayOptimized,
  }

  if (exceedsAllowedDayCap(dayForCap, config)) {
    warnings.push(
      `${round(day.driveHours, 1)} drive hours exceeds ${getCurrentDayCap(dayForCap, config)} hour cap.`,
    )
  }
  if (overRangeVisits.length > 0) {
    advisories.push({
      severity: 'medium',
      message: `${overRangeVisits.length} leg(s) exceed practical Supercharger range; plan an auxiliary charging stop between Tesla sites.`,
    })
  }
  if (longDayOptimized && longDayReason) {
    advisories.push({
      severity: 'info',
      message: longDayReason,
    })
  }

  return {
    ...day,
    miles: round(day.miles),
    driveHours: round(day.driveHours, 2),
    stopMinutes: Math.round(day.stopMinutes),
    averageDistanceBetweenSuperchargers:
      day.visits.length > 0
        ? round(
            day.visits.reduce((sum, visit) => sum + visit.legMiles, 0) /
              day.visits.length,
          )
        : 0,
    warnings,
    advisories,
    longDayOptimized,
    ...(longDayReason ? { longDayReason } : {}),
    visits: day.visits.map((visit) => ({
      ...visit,
      day: day.day,
    })),
  }
}

export function optimizeRoutes(
  allStations: Station[],
  partialConfig: Partial<PlannerConfig> = defaultPlannerConfig,
  sourceFetchedAt = new Date().toISOString(),
): OptimizeResponse {
  const config = sanitizePlannerConfig(partialConfig)
  const openStations = filterOpenStations(allStations)
  const stations = filterStationsForConfig(allStations, config)
  const variants = buildVariants(
    config.start,
    config.requiredWaypoints,
    config.customRouteWaypoints,
  )

  const routes: RoutePlan[] = variants.map((variant) => {
    const stationChoice = chooseStationsForVariant(
      variant,
      stations,
      config.targetStations,
      variant.forcedWaypoints,
    )
    const plans = buildDayPlans(stationChoice.selected, variant, config)
    const totalDays = plans.days.length
    const uniqueStations = plans.visits.length
    const totalVisitLegMiles = plans.visits.reduce(
      (sum, visit) => sum + visit.legMiles,
      0,
    )

    return {
      id: variant.id,
      name: variant.name,
      strategy: variant.strategy,
      color: variant.color,
      uniqueStations,
      totalMiles: plans.totals.totalMiles,
      totalDriveHours: plans.totals.totalDriveHours,
      totalStopHours: plans.totals.totalStopHours,
      totalDays,
      averageMilesPerDay: round(plans.totals.totalMiles / totalDays),
      averageDriveHoursPerDay: round(
        plans.totals.totalDriveHours / totalDays,
        2,
      ),
      averageStopHoursPerDay: round(plans.totals.totalStopHours / totalDays, 2),
      averageDistanceBetweenSuperchargers:
        uniqueStations > 0 ? round(totalVisitLegMiles / uniqueStations) : 0,
      stationsPerDay: round(uniqueStations / totalDays, 1),
      days: plans.days,
      visits: plans.visits,
      warnings: [...stationChoice.waypointWarnings, ...plans.totals.warnings],
      advisories: plans.totals.advisories,
      longDays: plans.totals.longDays,
      routeLine: buildDisplayRouteLine(stationChoice.selected, variant.anchors),
    }
  })

  return {
    generatedAt: new Date().toISOString(),
    source: {
      name: 'Supercharge.info',
      url: 'https://supercharge.info/service/supercharge/allSites',
      fetchedAt: sourceFetchedAt,
    },
    config,
    universe: {
      totalOpenStations: openStations.length,
      filteredStations: stations.length,
      countryCounts: countryCounts(stations),
      allSitesFeasibility: estimateAllSitesFeasibility(
        stations.length,
        config,
      ),
    },
    routes,
    stations,
  }
}
