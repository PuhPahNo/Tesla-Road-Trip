import { defaultPlannerConfig, sanitizePlannerConfig } from './config'
import {
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
import {
  buildRouteRating,
  buildSegmentRating,
  emptySegmentRating,
  type RatingPlaceTarget,
} from './ratings'
import { detailForCatalogPlace } from './placeDetails'
import { getPlaceCatalogEntry } from './placeCatalog'
import { buildStationRatingBonus } from './placeBoost'
import { planAutoStays, tagStayDays } from './stays'
import { STATE_SIGNATURES, type StateSignature } from './stateSignatures'
import { STATE_CODE_TO_NAME } from './usStates'
import { resolveInitialDirection } from './routeDirection'
import type {
  CompassDirection,
  Coordinate,
  DayPlan,
  LongestTripVisitTarget,
  OptimizeResponse,
  PlannerAdvisory,
  PlannerConfig,
  RoutePlan,
  RouteStationVisit,
  RouteWaypoint,
  SavedCustomRoute,
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
  targetDays?: number
  stationFilter?: (station: Station) => boolean
  /** Undefined preserves the built-in north-first behavior; anchor keeps the
   * saved custom anchor order without imposing a compass heading. */
  initialHeading?: CompassDirection | 'anchor'
}

interface ScoredStation {
  station: Station
  distanceMiles: number
  order: number
  segmentIndex: number
  segmentProgress: number
  connectorStop?: boolean
}

interface ChargingState {
  rangeRemainingMiles: number
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
  birmingham: { lat: 33.5186, lon: -86.8104 },
  savannah: { lat: 32.0809, lon: -81.0912 },
  orlando: { lat: 28.5383, lon: -81.3792 },
  raleigh: { lat: 35.7796, lon: -78.6382 },
  richmond: { lat: 37.5407, lon: -77.436 },
  norfolk: { lat: 36.8508, lon: -76.2859 },
  hartford: { lat: 41.7658, lon: -72.6734 },
  portlandMaine: { lat: 43.6591, lon: -70.2568 },
  louisville: { lat: 38.2527, lon: -85.7585 },
  cincinnati: { lat: 39.1031, lon: -84.512 },
  columbus: { lat: 39.9612, lon: -82.9988 },
  indianapolis: { lat: 39.7684, lon: -86.1581 },
  milwaukee: { lat: 43.0389, lon: -87.9065 },
  madison: { lat: 43.0731, lon: -89.4012 },
  desMoines: { lat: 41.5868, lon: -93.625 },
  omaha: { lat: 41.2565, lon: -95.9345 },
  littleRock: { lat: 34.7465, lon: -92.2896 },
  tulsa: { lat: 36.154, lon: -95.9928 },
  oklahomaCity: { lat: 35.4676, lon: -97.5164 },
  wichita: { lat: 37.6872, lon: -97.3301 },
  austin: { lat: 30.2672, lon: -97.7431 },
  amarillo: { lat: 35.222, lon: -101.8313 },
  albuquerque: { lat: 35.0844, lon: -106.6504 },
  santaFe: { lat: 35.687, lon: -105.9378 },
  flagstaff: { lat: 35.1983, lon: -111.6513 },
  lasVegas: { lat: 36.1699, lon: -115.1398 },
  reno: { lat: 39.5296, lon: -119.8138 },
  spokane: { lat: 47.6588, lon: -117.426 },
  billings: { lat: 45.7833, lon: -108.5007 },
  rapidCity: { lat: 44.0805, lon: -103.231 },
  fargo: { lat: 46.8772, lon: -96.7898 },
}

const PLACE = {
  acadia: { lat: 44.3386, lon: -68.2733 },
  asheville: { lat: 35.5951, lon: -82.5515 },
  badlands: { lat: 43.8554, lon: -102.3397 },
  bigBend: { lat: 29.1275, lon: -103.2425 },
  bigSur: { lat: 36.2704, lon: -121.8081 },
  birminghamCivilRights: { lat: 33.5162, lon: -86.8146 },
  bryceCanyon: { lat: 37.593, lon: -112.1871 },
  cahokia: { lat: 38.6544, lon: -90.0618 },
  capitolReef: { lat: 38.367, lon: -111.2615 },
  charleston: { lat: 32.7765, lon: -79.9311 },
  civilRightsMuseum: { lat: 35.1345, lon: -90.0576 },
  durango: { lat: 37.2753, lon: -107.8801 },
  gettysburg: { lat: 39.8309, lon: -77.2311 },
  grandCanyon: { lat: 36.1069, lon: -112.1129 },
  hollywoodWalk: { lat: 34.1016, lon: -118.3267 },
  lakeTahoe: { lat: 39.0968, lon: -120.0324 },
  mammothCave: { lat: 37.1862, lon: -86.1005 },
  mesaVerde: { lat: 37.2309, lon: -108.4618 },
  montgomery: { lat: 32.3668, lon: -86.3 },
  moab: { lat: 38.5733, lon: -109.5498 },
  monumentValley: { lat: 36.998, lon: -110.0985 },
  natchez: { lat: 31.5604, lon: -91.4032 },
  olympic: { lat: 47.8021, lon: -123.6044 },
  proFootballHall: { lat: 40.8212, lon: -81.3978 },
  redwood: { lat: 41.2132, lon: -124.0046 },
  rockyMountain: { lat: 40.3428, lon: -105.6836 },
  selma: { lat: 32.4074, lon: -87.0211 },
  shenandoah: { lat: 38.2928, lon: -78.6796 },
  sedona: { lat: 34.8697, lon: -111.7609 },
  whiteSands: { lat: 32.7797, lon: -106.1717 },
  yellowstone: { lat: 44.428, lon: -110.5885 },
  yosemite: { lat: 37.8651, lon: -119.5383 },
  zion: { lat: 37.2982, lon: -113.0263 },
}

function stateFilter(...states: string[]) {
  const wanted = new Set(states)
  return (station: Station) =>
    station.address.country === 'USA' && wanted.has(station.address.state)
}

function buildMostUniqueSiteVariants(
  start: Coordinate,
  requiredWaypoints: RouteWaypoint[],
  customRouteWaypoints: RouteWaypoint[],
  savedCustomRoutes: SavedCustomRoute[],
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
    {
      id: 'california-density-sweep',
      name: 'California Density Sweep',
      strategy:
        'A deadhead-heavy concept that reaches California, sweeps the California station universe, then returns through western connector stops.',
      color: '#ef4444',
      corridorMiles: 170,
      anchors: [
        start,
        CITY.nashville,
        CITY.memphis,
        CITY.oklahomaCity,
        CITY.amarillo,
        CITY.albuquerque,
        CITY.flagstaff,
        CITY.lasVegas,
        CITY.losAngeles,
        CITY.sanDiego,
        CITY.sanFrancisco,
        CITY.sacramento,
        CITY.reno,
        CITY.saltLakeCity,
        CITY.denver,
        CITY.kansasCity,
        CITY.stLouis,
        start,
      ],
      forcedWaypoints: requiredWaypoints,
      stationFilter: stateFilter('CA'),
    },
    {
      id: 'texas-triangle-gulf',
      name: 'Texas Triangle and Gulf',
      strategy:
        'A dense Texas-first loop through Dallas, Austin, San Antonio, Houston, Louisiana, the Gulf Coast, and the Southeast return.',
      color: '#ea580c',
      corridorMiles: 130,
      anchors: [
        start,
        CITY.memphis,
        CITY.littleRock,
        CITY.dallas,
        CITY.austin,
        CITY.sanAntonio,
        CITY.houston,
        CITY.newOrleans,
        CITY.mobile,
        CITY.pensacola,
        CITY.birmingham,
        start,
      ],
      forcedWaypoints: requiredWaypoints,
      stationFilter: stateFilter('TX', 'LA', 'MS', 'AL', 'AR', 'OK'),
    },
    {
      id: 'florida-southeast-density',
      name: 'Florida and Southeast Density',
      strategy:
        'A compact station-density play across Georgia, Florida, the Carolinas, Alabama, and the Tennessee home corridor.',
      color: '#16a34a',
      corridorMiles: 120,
      anchors: [
        start,
        CITY.atlanta,
        CITY.savannah,
        CITY.jacksonville,
        CITY.orlando,
        CITY.miami,
        CITY.tampa,
        CITY.tallahassee,
        CITY.pensacola,
        CITY.birmingham,
        CITY.charlotte,
        start,
      ],
      forcedWaypoints: requiredWaypoints,
      stationFilter: stateFilter('TN', 'GA', 'FL', 'SC', 'NC', 'AL'),
    },
    {
      id: 'i95-eastern-seaboard',
      name: 'I-95 Eastern Seaboard',
      strategy:
        'A coast-focused route from Florida through the Carolinas, Virginia, DC, Philadelphia, New York, Boston, and Maine.',
      color: '#0891b2',
      corridorMiles: 115,
      anchors: [
        start,
        CITY.atlanta,
        CITY.jacksonville,
        CITY.savannah,
        CITY.raleigh,
        CITY.richmond,
        CITY.washingtonDc,
        CITY.philadelphia,
        CITY.newYork,
        CITY.hartford,
        CITY.boston,
        CITY.portlandMaine,
        CITY.pittsburgh,
        CITY.charlotte,
        start,
      ],
      forcedWaypoints: requiredWaypoints,
      stationFilter: stateFilter(
        'FL',
        'GA',
        'SC',
        'NC',
        'VA',
        'MD',
        'DE',
        'NJ',
        'NY',
        'CT',
        'RI',
        'MA',
        'NH',
        'ME',
      ),
    },
    {
      id: 'northeast-megalopolis',
      name: 'Northeast Megalopolis',
      strategy:
        'A high-density Northeastern concentration around DC, Philadelphia, New Jersey, New York, Connecticut, Boston, and New England.',
      color: '#0f766e',
      corridorMiles: 110,
      anchors: [
        start,
        CITY.charlotte,
        CITY.raleigh,
        CITY.richmond,
        CITY.washingtonDc,
        CITY.philadelphia,
        CITY.newYork,
        CITY.hartford,
        CITY.boston,
        CITY.portlandMaine,
        CITY.buffalo,
        CITY.pittsburgh,
        start,
      ],
      forcedWaypoints: requiredWaypoints,
      stationFilter: stateFilter(
        'DC',
        'MD',
        'DE',
        'PA',
        'NJ',
        'NY',
        'CT',
        'RI',
        'MA',
        'NH',
        'ME',
        'VT',
      ),
    },
    {
      id: 'great-lakes-compact',
      name: 'Great Lakes Compact',
      strategy:
        'A denser Midwest loop through Chicago, Wisconsin, Minnesota edges, Michigan, Indiana, Ohio, and Pennsylvania.',
      color: '#4d7c0f',
      corridorMiles: 120,
      anchors: [
        start,
        CITY.louisville,
        CITY.indianapolis,
        CITY.chicago,
        CITY.milwaukee,
        CITY.madison,
        CITY.minneapolis,
        CITY.detroit,
        CITY.cleveland,
        CITY.columbus,
        CITY.cincinnati,
        start,
      ],
      forcedWaypoints: requiredWaypoints,
      stationFilter: stateFilter('IL', 'WI', 'MN', 'MI', 'IN', 'OH', 'PA', 'KY'),
    },
    {
      id: 'rockies-front-range',
      name: 'Rockies and Front Range',
      strategy:
        'A mountain/interior concept through Kansas, Colorado, Utah, Idaho, Wyoming/Montana edges, and New Mexico.',
      color: '#7c2d12',
      corridorMiles: 155,
      anchors: [
        start,
        CITY.stLouis,
        CITY.kansasCity,
        CITY.wichita,
        CITY.denver,
        CITY.saltLakeCity,
        CITY.boise,
        CITY.billings,
        CITY.rapidCity,
        CITY.denver,
        CITY.santaFe,
        CITY.albuquerque,
        CITY.oklahomaCity,
        start,
      ],
      forcedWaypoints: requiredWaypoints,
      stationFilter: stateFilter('CO', 'UT', 'ID', 'WY', 'MT', 'NM', 'KS', 'NE'),
    },
    {
      id: 'pacific-northwest-cascade',
      name: 'Pacific Northwest Cascade',
      strategy:
        'A long transfer to the Northwest with a Cascade/I-5 focus through Oregon, Washington, Idaho, and Northern California connectors.',
      color: '#2563eb',
      corridorMiles: 150,
      anchors: [
        start,
        CITY.stLouis,
        CITY.kansasCity,
        CITY.denver,
        CITY.saltLakeCity,
        CITY.boise,
        CITY.portland,
        CITY.seattle,
        CITY.spokane,
        CITY.boise,
        CITY.reno,
        CITY.sacramento,
        CITY.saltLakeCity,
        CITY.denver,
        start,
      ],
      forcedWaypoints: requiredWaypoints,
      stationFilter: stateFilter('OR', 'WA', 'ID', 'NV', 'CA'),
    },
    {
      id: 'southwest-desert-loop',
      name: 'Southwest Desert Loop',
      strategy:
        'A desert-focused route through Texas transfer corridors, New Mexico, Arizona, Nevada, Utah, and Southern California.',
      color: '#c2410c',
      corridorMiles: 140,
      anchors: [
        start,
        CITY.memphis,
        CITY.dallas,
        CITY.elPaso,
        CITY.albuquerque,
        CITY.phoenix,
        CITY.sanDiego,
        CITY.losAngeles,
        CITY.lasVegas,
        CITY.flagstaff,
        CITY.saltLakeCity,
        CITY.denver,
        CITY.kansasCity,
        start,
      ],
      forcedWaypoints: requiredWaypoints,
      stationFilter: stateFilter('AZ', 'NV', 'NM', 'UT', 'CA', 'TX'),
    },
    {
      id: 'i40-route-66-crosscountry',
      name: 'I-40 Route 66 Cross-Country',
      strategy:
        'An I-40 / Route 66 style run from Tennessee through Oklahoma, New Mexico, Arizona, Las Vegas, Southern California, and a central return.',
      color: '#db2777',
      corridorMiles: 125,
      anchors: [
        start,
        CITY.nashville,
        CITY.memphis,
        CITY.littleRock,
        CITY.oklahomaCity,
        CITY.amarillo,
        CITY.albuquerque,
        CITY.flagstaff,
        CITY.lasVegas,
        CITY.losAngeles,
        CITY.sanDiego,
        CITY.phoenix,
        CITY.elPaso,
        CITY.dallas,
        CITY.stLouis,
        start,
      ],
      forcedWaypoints: requiredWaypoints,
    },
    {
      id: 'lower48-perimeter',
      name: 'Lower-48 Perimeter',
      strategy:
        'A perimeter-style concept: Atlantic coast, Gulf Coast, California/Pacific Coast, Northwest, northern tier, and Great Lakes return.',
      color: '#9333ea',
      corridorMiles: 150,
      anchors: [
        start,
        CITY.atlanta,
        CITY.jacksonville,
        CITY.miami,
        CITY.tampa,
        CITY.newOrleans,
        CITY.houston,
        CITY.sanAntonio,
        CITY.elPaso,
        CITY.sanDiego,
        CITY.losAngeles,
        CITY.sanFrancisco,
        CITY.portland,
        CITY.seattle,
        CITY.spokane,
        CITY.billings,
        CITY.minneapolis,
        CITY.chicago,
        CITY.detroit,
        CITY.buffalo,
        CITY.boston,
        CITY.newYork,
        CITY.washingtonDc,
        CITY.charlotte,
        start,
      ],
      forcedWaypoints: requiredWaypoints,
    },
    {
      id: 'heartland-low-mileage',
      name: 'Heartland Low-Mileage Loop',
      strategy:
        'A lower-mileage, closer-to-home density strategy across Tennessee, Kentucky, Ohio, Indiana, Illinois, Missouri, Arkansas, Alabama, Georgia, and the Carolinas.',
      color: '#65a30d',
      corridorMiles: 125,
      anchors: [
        start,
        CITY.nashville,
        CITY.louisville,
        CITY.cincinnati,
        CITY.columbus,
        CITY.indianapolis,
        CITY.chicago,
        CITY.stLouis,
        CITY.littleRock,
        CITY.memphis,
        CITY.birmingham,
        CITY.atlanta,
        CITY.charlotte,
        start,
      ],
      forcedWaypoints: requiredWaypoints,
      stationFilter: stateFilter(
        'TN',
        'KY',
        'OH',
        'IN',
        'IL',
        'MO',
        'AR',
        'AL',
        'GA',
        'NC',
        'SC',
      ),
    },
    {
      id: 'north-border-sweep',
      name: 'Northern Border Sweep',
      strategy:
        'A northern-tier concept through Chicago, Minnesota, the Dakotas/Montana connectors, Great Lakes, New York, and New England.',
      color: '#1d4ed8',
      corridorMiles: 150,
      anchors: [
        start,
        CITY.louisville,
        CITY.chicago,
        CITY.madison,
        CITY.minneapolis,
        CITY.fargo,
        CITY.billings,
        CITY.rapidCity,
        CITY.minneapolis,
        CITY.milwaukee,
        CITY.detroit,
        CITY.buffalo,
        CITY.boston,
        CITY.portlandMaine,
        CITY.newYork,
        CITY.pittsburgh,
        start,
      ],
      forcedWaypoints: requiredWaypoints,
      stationFilter: stateFilter(
        'MN',
        'WI',
        'MI',
        'ND',
        'SD',
        'MT',
        'NY',
        'VT',
        'NH',
        'ME',
        'MA',
      ),
    },
    {
      id: 'southern-appalachia-carolinas',
      name: 'Southern Appalachia and Carolinas',
      strategy:
        'A closer regional loop that emphasizes Tennessee, Kentucky, Virginia, the Carolinas, Georgia, and Alabama.',
      color: '#15803d',
      corridorMiles: 115,
      anchors: [
        start,
        CITY.nashville,
        CITY.louisville,
        CITY.cincinnati,
        CITY.pittsburgh,
        CITY.richmond,
        CITY.norfolk,
        CITY.raleigh,
        CITY.charlotte,
        CITY.savannah,
        CITY.atlanta,
        CITY.birmingham,
        start,
      ],
      forcedWaypoints: requiredWaypoints,
      stationFilter: stateFilter('TN', 'KY', 'VA', 'WV', 'NC', 'SC', 'GA', 'AL'),
    },
    {
      id: 'four-corners-vegas',
      name: 'Four Corners and Vegas',
      strategy:
        'A western interior strategy through New Mexico, Arizona, Utah, Colorado, Las Vegas, and Southern California density.',
      color: '#a16207',
      corridorMiles: 140,
      anchors: [
        start,
        CITY.memphis,
        CITY.oklahomaCity,
        CITY.amarillo,
        CITY.albuquerque,
        CITY.santaFe,
        CITY.denver,
        CITY.saltLakeCity,
        CITY.lasVegas,
        CITY.phoenix,
        CITY.sanDiego,
        CITY.losAngeles,
        CITY.flagstaff,
        CITY.albuquerque,
        CITY.dallas,
        CITY.stLouis,
        start,
      ],
      forcedWaypoints: requiredWaypoints,
      stationFilter: stateFilter('NM', 'AZ', 'UT', 'CO', 'NV', 'CA'),
    },
  ].map((variant) => ({
    ...variant,
    anchors: insertRequiredWaypoints(
      closeAnchorsToStart(variant.anchors, start),
      requiredWaypoints,
    ),
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

  variants.push(
    ...buildSavedCustomRouteVariants(
      start,
      requiredWaypoints,
      savedCustomRoutes,
      [],
      'route',
    ),
  )

  return variants
}

function coldWeatherScore(point: Coordinate) {
  let score = point.lat

  if (point.lat >= 39) score += 16
  if (point.lat >= 44) score += 8
  if (point.lat >= 35 && point.lon <= -100) score += 6
  if (point.lat >= 38 && point.lon <= -90 && point.lon >= -105) score += 4

  return score
}

function weatherFirstClosedAnchors(anchors: Coordinate[], start: Coordinate) {
  const body = anchors.filter(
    (anchor, index) =>
      index > 0 && !(anchor.lat === start.lat && anchor.lon === start.lon),
  )

  if (body.length === 0) return [start]

  const sequences = [body, body.slice().reverse()]
  let best = body
  let bestScore = Number.NEGATIVE_INFINITY

  sequences.forEach((sequence) => {
    for (let index = 0; index < sequence.length; index += 1) {
      const rotated = [...sequence.slice(index), ...sequence.slice(0, index)]
      const earlyWeatherScore = rotated
        .slice(0, Math.min(4, rotated.length))
        .reduce(
          (sum, anchor, anchorIndex) =>
            sum + coldWeatherScore(anchor) / (anchorIndex + 1),
          0,
        )
      const first = rotated[0]
      const last = rotated.at(-1)!
      const firstNorthBonus = first.lat > start.lat ? 400 : -400
      const returnPenalty = haversineMiles(last, start) * 0.45
      const openingPenalty = haversineMiles(start, first) * 0.04
      const score =
        earlyWeatherScore + firstNorthBonus - returnPenalty - openingPenalty

      if (score > bestScore) {
        bestScore = score
        best = rotated
      }
    }
  })

  return closeAnchorsToStart([start, ...best], start)
}

function visitTargetAnchor(target: LongestTripVisitTarget) {
  return target.position
}

function mergeVisitTargetAnchors(
  anchors: Coordinate[],
  targets: LongestTripVisitTarget[],
) {
  if (targets.length === 0) return anchors

  const extraAnchors = targets
    .map(visitTargetAnchor)
    .filter((anchor): anchor is Coordinate => Boolean(anchor))

  if (extraAnchors.length === 0) return anchors

  const [start, ...body] = anchors
  const withoutClosingStart = body.filter(
    (anchor, index) =>
      index < body.length - 1 ||
      anchor.lat !== start.lat ||
      anchor.lon !== start.lon,
  )

  return [start, ...withoutClosingStart, ...extraAnchors]
}

function buildLongestTripVariants(
  start: Coordinate,
  requiredWaypoints: RouteWaypoint[],
  customRouteWaypoints: RouteWaypoint[],
  longestTripTargets: LongestTripVisitTarget[],
  savedCustomRoutes: SavedCustomRoute[],
): RouteVariant[] {
  const variants: RouteVariant[] = [
    {
      id: 'longest-great-american-icons',
      name: 'Great American Icons',
      strategy:
        'A scenic streak plan through major cities, western landmarks, northern icons, the Great Lakes, and the East Coast return corridor.',
      color: '#d72638',
      corridorMiles: 155,
      anchors: [
        start,
        CITY.nashville,
        CITY.stLouis,
        CITY.kansasCity,
        CITY.denver,
        CITY.santaFe,
        PLACE.grandCanyon,
        CITY.lasVegas,
        CITY.losAngeles,
        PLACE.hollywoodWalk,
        CITY.sanFrancisco,
        CITY.portland,
        CITY.seattle,
        PLACE.yellowstone,
        CITY.rapidCity,
        CITY.chicago,
        PLACE.proFootballHall,
        CITY.washingtonDc,
        CITY.charlotte,
      ],
      forcedWaypoints: requiredWaypoints,
    },
    {
      id: 'longest-national-parks-west',
      name: 'National Parks and Western Icons',
      strategy:
        'A parks-forward plan across the Front Range, red-rock Utah, Grand Canyon, Yosemite/Tahoe, the Pacific Northwest, Yellowstone, and the upper Midwest.',
      color: '#16a34a',
      corridorMiles: 165,
      anchors: [
        start,
        CITY.stLouis,
        CITY.denver,
        PLACE.rockyMountain,
        PLACE.moab,
        PLACE.zion,
        PLACE.grandCanyon,
        CITY.lasVegas,
        PLACE.yosemite,
        PLACE.lakeTahoe,
        CITY.portland,
        CITY.seattle,
        PLACE.yellowstone,
        PLACE.badlands,
        CITY.minneapolis,
        CITY.chicago,
      ],
      forcedWaypoints: requiredWaypoints,
    },
    {
      id: 'longest-coastal-cities',
      name: 'Coastal Cities Run',
      strategy:
        'A city-and-coast plan from the Atlantic Southeast through Florida, the Gulf, Texas, Southern California, the Bay Area, and the Pacific Northwest.',
      color: '#0891b2',
      corridorMiles: 150,
      anchors: [
        start,
        CITY.atlanta,
        CITY.savannah,
        CITY.jacksonville,
        CITY.miami,
        CITY.tampa,
        CITY.newOrleans,
        CITY.houston,
        CITY.sanAntonio,
        CITY.sanDiego,
        CITY.losAngeles,
        PLACE.hollywoodWalk,
        PLACE.bigSur,
        CITY.sanFrancisco,
        CITY.portland,
        CITY.seattle,
      ],
      forcedWaypoints: requiredWaypoints,
    },
    {
      id: 'longest-music-cities',
      name: 'Music Cities and Great Lakes',
      strategy:
        'A culture-heavy route through Nashville, Memphis, New Orleans, Austin, Dallas, Santa Fe, Denver, Kansas City, St. Louis, Chicago, Detroit, and Cleveland.',
      color: '#db2777',
      corridorMiles: 140,
      anchors: [
        start,
        CITY.nashville,
        CITY.memphis,
        CITY.newOrleans,
        CITY.austin,
        CITY.dallas,
        CITY.santaFe,
        CITY.denver,
        CITY.kansasCity,
        CITY.stLouis,
        CITY.chicago,
        CITY.detroit,
        CITY.cleveland,
        CITY.pittsburgh,
      ],
      forcedWaypoints: requiredWaypoints,
    },
    {
      id: 'longest-route-66-icons',
      name: 'Route 66 and Desert Icons',
      strategy:
        'An I-40 / Route 66 style streak through Memphis, Oklahoma City, Amarillo, New Mexico, Flagstaff, Grand Canyon, Vegas, Los Angeles, Phoenix, and Texas.',
      color: '#f46036',
      corridorMiles: 145,
      anchors: [
        start,
        CITY.nashville,
        CITY.memphis,
        CITY.littleRock,
        CITY.oklahomaCity,
        CITY.amarillo,
        CITY.albuquerque,
        CITY.santaFe,
        CITY.flagstaff,
        PLACE.grandCanyon,
        CITY.lasVegas,
        CITY.losAngeles,
        CITY.sanDiego,
        CITY.phoenix,
        CITY.dallas,
        CITY.stLouis,
      ],
      forcedWaypoints: requiredWaypoints,
    },
    {
      id: 'longest-east-coast-history',
      name: 'East Coast History Trail',
      strategy:
        'A historic-city route through Savannah, Charleston, Raleigh, Richmond, DC, Philadelphia, New York, Boston, Acadia/Maine, Niagara/Buffalo, Pittsburgh, and Charlotte.',
      color: '#0f766e',
      corridorMiles: 125,
      anchors: [
        start,
        CITY.atlanta,
        CITY.savannah,
        PLACE.charleston,
        CITY.raleigh,
        CITY.richmond,
        CITY.washingtonDc,
        CITY.philadelphia,
        CITY.newYork,
        CITY.boston,
        PLACE.acadia,
        CITY.buffalo,
        CITY.pittsburgh,
        CITY.charlotte,
      ],
      forcedWaypoints: requiredWaypoints,
    },
    {
      id: 'longest-great-lakes-new-england',
      name: 'Great Lakes to New England',
      strategy:
        'A northern city streak through Louisville, Chicago, Wisconsin, Minneapolis, Michigan, Ohio, Buffalo, Boston, Maine, New York, and Pennsylvania.',
      color: '#2563eb',
      corridorMiles: 135,
      anchors: [
        start,
        CITY.louisville,
        CITY.indianapolis,
        CITY.chicago,
        CITY.milwaukee,
        CITY.madison,
        CITY.minneapolis,
        CITY.detroit,
        CITY.cleveland,
        PLACE.proFootballHall,
        CITY.buffalo,
        CITY.boston,
        CITY.portlandMaine,
        CITY.newYork,
        CITY.pittsburgh,
      ],
      forcedWaypoints: requiredWaypoints,
    },
    {
      id: 'longest-rockies-red-rocks',
      name: 'Rockies and Red Rocks',
      strategy:
        'A mountain-and-desert route through Kansas City, Denver, Rocky Mountain, Moab, Monument Valley, Grand Canyon, Sedona, Santa Fe, Albuquerque, and Oklahoma City.',
      color: '#7c2d12',
      corridorMiles: 160,
      anchors: [
        start,
        CITY.stLouis,
        CITY.kansasCity,
        CITY.denver,
        PLACE.rockyMountain,
        PLACE.moab,
        PLACE.monumentValley,
        PLACE.grandCanyon,
        PLACE.sedona,
        CITY.santaFe,
        CITY.albuquerque,
        CITY.oklahomaCity,
        CITY.memphis,
      ],
      forcedWaypoints: requiredWaypoints,
    },
    {
      id: 'longest-texas-southwest',
      name: 'Texas and Southwest Landmarks',
      strategy:
        'A Texas-first streak through Dallas, Austin, San Antonio, Big Bend/El Paso, White Sands, Santa Fe, Phoenix, Las Vegas, Los Angeles, Denver, and St. Louis.',
      color: '#ea580c',
      corridorMiles: 155,
      anchors: [
        start,
        CITY.memphis,
        CITY.littleRock,
        CITY.dallas,
        CITY.austin,
        CITY.sanAntonio,
        PLACE.bigBend,
        CITY.elPaso,
        PLACE.whiteSands,
        CITY.santaFe,
        CITY.phoenix,
        CITY.lasVegas,
        CITY.losAngeles,
        CITY.denver,
        CITY.stLouis,
      ],
      forcedWaypoints: requiredWaypoints,
    },
    {
      id: 'longest-pacific-coast-rockies',
      name: 'Pacific Coast and Rockies',
      strategy:
        'A westward push to Southern California, Big Sur, San Francisco, Redwoods, Portland, Seattle, Spokane, Boise, Salt Lake City, and Denver.',
      color: '#5b5fc7',
      corridorMiles: 160,
      anchors: [
        start,
        CITY.dallas,
        CITY.elPaso,
        CITY.phoenix,
        CITY.sanDiego,
        CITY.losAngeles,
        PLACE.bigSur,
        CITY.sanFrancisco,
        PLACE.redwood,
        CITY.portland,
        CITY.seattle,
        CITY.spokane,
        CITY.boise,
        CITY.saltLakeCity,
        CITY.denver,
      ],
      forcedWaypoints: requiredWaypoints,
    },
    {
      id: 'longest-southeast-beaches',
      name: 'Southeast Beaches and Cities',
      strategy:
        'A closer-to-home streak through Atlanta, Savannah, Jacksonville, Orlando, Miami, Tampa, Pensacola, New Orleans, Birmingham, Charlotte, Raleigh, and Norfolk.',
      color: '#65a30d',
      corridorMiles: 125,
      anchors: [
        start,
        CITY.atlanta,
        CITY.savannah,
        CITY.jacksonville,
        CITY.orlando,
        CITY.miami,
        CITY.tampa,
        CITY.pensacola,
        CITY.newOrleans,
        CITY.birmingham,
        CITY.charlotte,
        CITY.raleigh,
        CITY.norfolk,
      ],
      forcedWaypoints: requiredWaypoints,
    },
    {
      id: 'longest-northern-tier',
      name: 'Northern Tier Adventure',
      strategy:
        'A long northern sweep through Chicago, Minnesota, Fargo, Badlands, Billings, Yellowstone, Boise, Seattle, Spokane, Rapid City, Michigan, Buffalo, and Boston.',
      color: '#1d4ed8',
      corridorMiles: 165,
      anchors: [
        start,
        CITY.louisville,
        CITY.chicago,
        CITY.madison,
        CITY.minneapolis,
        CITY.fargo,
        PLACE.badlands,
        CITY.billings,
        PLACE.yellowstone,
        CITY.boise,
        CITY.seattle,
        CITY.spokane,
        CITY.rapidCity,
        CITY.detroit,
        CITY.buffalo,
        CITY.boston,
      ],
      forcedWaypoints: requiredWaypoints,
    },
    {
      id: 'longest-four-corners-loop',
      name: 'Four Corners Scenic Route',
      strategy:
        'A Four Corners plan through Oklahoma, Amarillo, Albuquerque, Santa Fe, Durango, Monument Valley, Grand Canyon, Phoenix, Vegas, Zion, Moab, Denver, and Kansas City.',
      color: '#a16207',
      corridorMiles: 155,
      anchors: [
        start,
        CITY.memphis,
        CITY.oklahomaCity,
        CITY.amarillo,
        CITY.albuquerque,
        CITY.santaFe,
        PLACE.durango,
        PLACE.monumentValley,
        PLACE.grandCanyon,
        CITY.phoenix,
        CITY.lasVegas,
        PLACE.zion,
        PLACE.moab,
        CITY.denver,
        CITY.kansasCity,
      ],
      forcedWaypoints: requiredWaypoints,
    },
    {
      id: 'longest-california-dream',
      name: 'California Dream Streak',
      strategy:
        'A western streak to California with Flagstaff, Los Angeles, San Diego, Big Sur, San Francisco, Yosemite, Sacramento, Tahoe/Reno, Salt Lake City, and Denver.',
      color: '#ef4444',
      corridorMiles: 160,
      anchors: [
        start,
        CITY.memphis,
        CITY.oklahomaCity,
        CITY.amarillo,
        CITY.albuquerque,
        CITY.flagstaff,
        CITY.losAngeles,
        CITY.sanDiego,
        PLACE.bigSur,
        CITY.sanFrancisco,
        PLACE.yosemite,
        CITY.sacramento,
        PLACE.lakeTahoe,
        CITY.reno,
        CITY.saltLakeCity,
        CITY.denver,
      ],
      forcedWaypoints: requiredWaypoints,
    },
    {
      id: 'longest-appalachian-blue-ridge',
      name: 'Appalachian and Blue Ridge',
      strategy:
        'A regional scenic streak through Nashville, Louisville, Cincinnati, Pittsburgh, Shenandoah, Richmond, Raleigh, Asheville, Charlotte, Atlanta, Savannah, and Birmingham.',
      color: '#15803d',
      corridorMiles: 120,
      anchors: [
        start,
        CITY.nashville,
        CITY.louisville,
        CITY.cincinnati,
        CITY.pittsburgh,
        PLACE.shenandoah,
        CITY.richmond,
        CITY.raleigh,
        PLACE.asheville,
        CITY.charlotte,
        CITY.atlanta,
        CITY.savannah,
        CITY.birmingham,
      ],
      forcedWaypoints: requiredWaypoints,
    },
    {
      id: 'longest-civil-rights-southern-culture',
      name: 'Civil Rights and Southern Culture',
      strategy:
        'A history-and-culture streak through Nashville, Birmingham, Montgomery, Selma, Atlanta, Memphis, Little Rock, New Orleans, Savannah, Charleston, Raleigh, and DC.',
      color: '#b45309',
      corridorMiles: 130,
      anchors: [
        start,
        CITY.nashville,
        CITY.birmingham,
        PLACE.birminghamCivilRights,
        PLACE.montgomery,
        PLACE.selma,
        CITY.atlanta,
        CITY.memphis,
        PLACE.civilRightsMuseum,
        CITY.littleRock,
        CITY.newOrleans,
        CITY.savannah,
        PLACE.charleston,
        CITY.raleigh,
        CITY.washingtonDc,
      ],
      forcedWaypoints: requiredWaypoints,
    },
    {
      id: 'longest-great-river-road',
      name: 'Great River Road Streak',
      strategy:
        'A Mississippi River-inspired streak from the upper Midwest down through St. Louis, Cahokia, Memphis, Natchez, New Orleans, the Gulf, and the Southeast return.',
      color: '#0369a1',
      corridorMiles: 140,
      anchors: [
        start,
        CITY.nashville,
        CITY.stLouis,
        PLACE.cahokia,
        CITY.madison,
        CITY.minneapolis,
        CITY.desMoines,
        CITY.stLouis,
        CITY.memphis,
        PLACE.natchez,
        CITY.newOrleans,
        CITY.mobile,
        CITY.birmingham,
        CITY.atlanta,
      ],
      forcedWaypoints: requiredWaypoints,
    },
    {
      id: 'longest-world-heritage-highlights',
      name: 'World Heritage Highlights',
      strategy:
        'A UNESCO-inspired route through Mammoth Cave, Cahokia, Mesa Verde, Grand Canyon, Yosemite, Redwoods, Olympic, Yellowstone, and historic East Coast connectors.',
      color: '#7e22ce',
      corridorMiles: 175,
      anchors: [
        start,
        CITY.louisville,
        PLACE.mammothCave,
        CITY.stLouis,
        PLACE.cahokia,
        CITY.kansasCity,
        CITY.denver,
        PLACE.mesaVerde,
        PLACE.grandCanyon,
        CITY.lasVegas,
        PLACE.yosemite,
        PLACE.redwood,
        PLACE.olympic,
        PLACE.yellowstone,
        CITY.chicago,
        CITY.philadelphia,
      ],
      forcedWaypoints: requiredWaypoints,
    },
    {
      id: 'longest-utah-public-lands',
      name: 'Utah Public Lands and Canyons',
      strategy:
        'A public-lands streak through Denver, Mesa Verde, Moab, Canyonlands/Arches country, Capitol Reef, Bryce Canyon, Zion, Grand Canyon, Monument Valley, Sedona, Santa Fe, and Kansas City.',
      color: '#c2410c',
      corridorMiles: 160,
      anchors: [
        start,
        CITY.stLouis,
        CITY.kansasCity,
        CITY.denver,
        PLACE.mesaVerde,
        PLACE.moab,
        PLACE.capitolReef,
        PLACE.bryceCanyon,
        PLACE.zion,
        PLACE.grandCanyon,
        PLACE.monumentValley,
        PLACE.sedona,
        CITY.santaFe,
        CITY.albuquerque,
        CITY.oklahomaCity,
      ],
      forcedWaypoints: requiredWaypoints,
    },
    {
      id: 'longest-revolution-presidents',
      name: 'Revolution and Presidents Trail',
      strategy:
        'A landmark-heavy eastern route through Louisville, Pittsburgh, Gettysburg, DC, Philadelphia, New York, Boston, Maine, Buffalo, Cleveland, Cincinnati, Asheville, and Atlanta.',
      color: '#be123c',
      corridorMiles: 130,
      anchors: [
        start,
        CITY.louisville,
        CITY.pittsburgh,
        PLACE.gettysburg,
        CITY.washingtonDc,
        CITY.philadelphia,
        CITY.newYork,
        CITY.boston,
        CITY.portlandMaine,
        CITY.buffalo,
        CITY.cleveland,
        CITY.cincinnati,
        PLACE.asheville,
        CITY.atlanta,
      ],
      forcedWaypoints: requiredWaypoints,
    },
  ].map((variant) => ({
    ...variant,
    anchors: insertRequiredWaypoints(
      weatherFirstClosedAnchors(
        mergeVisitTargetAnchors(variant.anchors, longestTripTargets),
        start,
      ),
      requiredWaypoints,
    ),
  }))

  if (customRouteWaypoints.length > 0) {
    const customForcedWaypoints = dedupeWaypoints([
      ...requiredWaypoints,
      ...customRouteWaypoints,
    ])
    variants.push({
      id: 'custom-longest-trip',
      name: 'Custom Longest Trip',
      strategy: `A custom streak corridor through ${customRouteWaypoints.map((waypoint) => waypoint.label).join(' -> ')} before returning to the start.`,
      color: '#7c3aed',
      corridorMiles: 150,
      anchors: [
        start,
        ...customRouteWaypoints.map((waypoint) => waypoint.position),
        ...longestTripTargets
          .map(visitTargetAnchor)
          .filter((anchor): anchor is Coordinate => Boolean(anchor)),
        start,
      ],
      forcedWaypoints: customForcedWaypoints,
    })
  }

  variants.push(
    ...buildSavedCustomRouteVariants(
      start,
      requiredWaypoints,
      savedCustomRoutes,
      longestTripTargets.map(visitTargetAnchor),
      'streak route',
    ),
  )

  return variants
}

function buildSavedCustomRouteVariants(
  start: Coordinate,
  requiredWaypoints: RouteWaypoint[],
  savedCustomRoutes: SavedCustomRoute[],
  trailingAnchors: Array<Coordinate | undefined> = [],
  strategyNoun = 'route',
): RouteVariant[] {
  return savedCustomRoutes.map((route) => {
    const resolvedDirection = resolveInitialDirection(
      route.directionPreference,
      route.startMonth,
      start,
    )
    const optimizedWaypoints = route.keepOrder
      ? route.waypoints
      : orderWaypointsForRoute(route.waypoints, start, resolvedDirection)
    const forcedWaypoints = dedupeWaypoints([
      ...requiredWaypoints,
      ...route.waypoints,
    ])
    const anchors = [
      start,
      ...optimizedWaypoints.map((waypoint) => waypoint.position),
      ...trailingAnchors.filter((anchor): anchor is Coordinate => Boolean(anchor)),
      start,
    ]
    const selectedLabels = route.waypoints.map((waypoint) => waypoint.label)
    const directionNote = route.directionPreference
      ? resolvedDirection
        ? ` It starts ${resolvedDirection} first based on the saved ${route.directionPreference === 'seasonal' ? 'season-smart' : 'direction'} preference.`
        : ' It keeps the most efficient starting leg for the selected month.'
      : ''

    return {
      id: route.id,
      name: route.name,
      strategy: route.keepOrder
        ? `Saved custom ${strategyNoun} that visits ${route.waypoints.length} stop${route.waypoints.length === 1 ? '' : 's'} in your exact saved order (${selectedLabels.join(' -> ')}).`
        : `Saved custom ${strategyNoun} that optimizes ${route.waypoints.length} selected stop${route.waypoints.length === 1 ? '' : 's'} (${selectedLabels.join(', ')}) against the current trip settings and Supercharger coverage.${directionNote}`,
      color: route.color,
      corridorMiles: 150,
      targetDays: route.targetDays,
      initialHeading: route.keepOrder ? 'anchor' : resolvedDirection ?? 'anchor',
      anchors: insertRequiredWaypoints(
        closeAnchorsToStart(anchors, start),
        requiredWaypoints,
      ),
      forcedWaypoints,
    }
  })
}

function orderWaypointsForRoute(
  waypoints: RouteWaypoint[],
  start: Coordinate,
  initialDirection?: CompassDirection,
): RouteWaypoint[] {
  const remaining = waypoints.slice()
  const ordered: RouteWaypoint[] = []
  let current = start
  const directionIndex = initialDirection
    ? chooseDirectionalItemIndex(
        remaining,
        start,
        initialDirection,
        (waypoint) => waypoint.position,
      )
    : -1

  if (directionIndex >= 0) {
    const first = remaining.splice(directionIndex, 1)[0]
    ordered.push(first)
    current = first.position
  }

  while (remaining.length > 0) {
    let bestIndex = 0
    let bestMiles = Infinity
    remaining.forEach((waypoint, index) => {
      const miles = haversineMiles(current, waypoint.position)
      if (
        miles < bestMiles ||
        (miles === bestMiles &&
          waypoint.label.localeCompare(remaining[bestIndex].label) < 0)
      ) {
        bestMiles = miles
        bestIndex = index
      }
    })
    const next = remaining.splice(bestIndex, 1)[0]
    ordered.push(next)
    current = next.position
  }

  if (ordered.length <= 2) return ordered

  const leg = (a: Coordinate, b: Coordinate) => haversineMiles(a, b)
  const n = ordered.length
  const MAX_PASSES = 8
  for (let pass = 0; pass < MAX_PASSES; pass += 1) {
    let improved = false
    for (let i = directionIndex >= 0 ? 1 : 0; i < n - 1; i += 1) {
      for (let j = i + 1; j < n; j += 1) {
        const before =
          leg(i === 0 ? start : ordered[i - 1].position, ordered[i].position) +
          leg(
            ordered[j].position,
            j === n - 1 ? start : ordered[j + 1].position,
          )
        const after =
          leg(i === 0 ? start : ordered[i - 1].position, ordered[j].position) +
          leg(
            ordered[i].position,
            j === n - 1 ? start : ordered[j + 1].position,
          )

        if (after + 1e-9 < before) {
          ordered.splice(i, j - i + 1, ...ordered.slice(i, j + 1).reverse())
          improved = true
        }
      }
    }
    if (!improved) break
  }

  return ordered
}

function chooseDirectionalItemIndex<T>(
  items: T[],
  start: Coordinate,
  direction: CompassDirection,
  positionOf: (item: T) => Coordinate,
) {
  const cosLat = Math.cos((start.lat * Math.PI) / 180) || 1
  let bestIndex = -1
  let bestAlignment = -Infinity
  let bestMiles = Infinity

  items.forEach((item, index) => {
    const position = positionOf(item)
    const northMiles = (position.lat - start.lat) * 69
    const eastMiles = (position.lon - start.lon) * 69 * cosLat
    const progress =
      direction === 'north'
        ? northMiles
        : direction === 'south'
          ? -northMiles
          : direction === 'east'
            ? eastMiles
            : -eastMiles
    if (progress <= 10) return

    const miles = haversineMiles(start, position)
    const alignment = progress / Math.max(1, miles)
    if (
      alignment > bestAlignment + 1e-9 ||
      (Math.abs(alignment - bestAlignment) <= 1e-9 && miles < bestMiles)
    ) {
      bestAlignment = alignment
      bestMiles = miles
      bestIndex = index
    }
  })

  return bestIndex
}

function chooseStationsForVariant(
  variant: RouteVariant,
  stations: Station[],
  targetStations: number,
  requiredWaypoints: RouteWaypoint[],
  options: {
    spreadAlongCorridor?: boolean
    visitTargets?: LongestTripVisitTarget[]
    /** What one stayDays unit means in warnings: a streak day or a reserved stop. */
    visitTargetUnit?: 'streak day' | 'reserved stop'
    /** Per-station rating bonus miles — see buildStationRatingBonus. */
    ratingBonus?: Map<string, number>
  } = {},
) {
  const target = Math.min(targetStations, stations.length)
  let corridorMiles = variant.corridorMiles
  let scored = scoreStations(variant.anchors, stations)
  const bonusOf = (station: ScoredStation) =>
    options.ratingBonus?.get(station.station.id) ?? 0
  const effectiveDistance = (station: ScoredStation) =>
    station.distanceMiles - bonusOf(station)

  while (
    scored.filter((station) => station.distanceMiles <= corridorMiles).length <
      target &&
    corridorMiles < 900
  ) {
    corridorMiles += 75
  }

  let selected: ScoredStation[]

  if (variant.stationFilter) {
    const primary = scored
      .filter((station) => variant.stationFilter?.(station.station))
      .sort((a, b) => effectiveDistance(a) - effectiveDistance(b))
      .slice(0, target)

    if (primary.length >= target) {
      selected = primary
    } else {
      const primaryIds = new Set(primary.map((station) => station.station.id))
      const filler = scored
        .filter(
          (station) =>
            !primaryIds.has(station.station.id) &&
            effectiveDistance(station) <= corridorMiles,
        )
        .sort((a, b) => effectiveDistance(a) - effectiveDistance(b))
        .slice(0, target - primary.length)

      selected = [...primary, ...filler]
    }
  } else if (options.spreadAlongCorridor) {
    selected = selectStationsAcrossCorridor(
      scored.filter((station) => effectiveDistance(station) <= corridorMiles),
      target,
      variant.anchors,
      variant.anchors[0],
      bonusOf,
    )
  } else {
    selected = scored
      .filter((station) => effectiveDistance(station) <= corridorMiles)
      .sort((a, b) => effectiveDistance(a) - effectiveDistance(b))
      .slice(0, target)
  }

  selected = selected.sort(
    (a, b) => a.order - b.order || a.distanceMiles - b.distanceMiles,
  )

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

  if (options.visitTargets && options.visitTargets.length > 0) {
    const visitTargetResult = ensureVisitTargetStations(
      selected,
      scored,
      options.visitTargets,
      target,
      forcedStationIds,
      options.visitTargetUnit,
    )
    selected = visitTargetResult.selected
    waypointWarnings.push(...visitTargetResult.warnings)
  }

  if (selected.length > target) {
    const forced = selected.filter((station) =>
      forcedStationIds.has(station.station.id),
    )
    const regular = selected.filter(
      (station) => !forcedStationIds.has(station.station.id),
    )
    selected = trimWithForcedStations(forced, regular, target)
  }

  selected = ensureNorthFirstCandidate(
    selected,
    scored,
    variant.anchors[0],
    target,
    forcedStationIds,
  )

  return {
    selected: selected.sort(
      (a, b) => a.order - b.order || a.distanceMiles - b.distanceMiles,
    ),
    scored,
    waypointWarnings,
    protectedStationIds: forcedStationIds,
  }
}

function ensureVisitTargetStations(
  selected: ScoredStation[],
  scored: ScoredStation[],
  targets: LongestTripVisitTarget[],
  targetStationCount: number,
  forcedStationIds: Set<string>,
  unit: 'streak day' | 'reserved stop' = 'streak day',
) {
  let next = selected.slice()
  const warnings: string[] = []
  const selectedIds = new Set(next.map((station) => station.station.id))
  const requestedDays = targets.reduce(
    (sum, target) => sum + Math.max(1, target.stayDays),
    0,
  )

  if (requestedDays > targetStationCount) {
    warnings.push(
      unit === 'streak day'
        ? `Configured visit targets request ${requestedDays} streak days inside a ${targetStationCount}-day Longest Trip. Some requested stay days may be skipped.`
        : `Configured visit targets request ${requestedDays} reserved stops inside a ${targetStationCount}-station route. Some requested stops may be skipped.`,
    )
  }

  targets.forEach((target) => {
    const requested = Math.min(
      Math.max(1, target.stayDays),
      Math.max(0, targetStationCount - forcedStationIds.size),
    )
    if (requested <= 0) return

    const candidates = visitTargetCandidates(target, scored)
    let added = 0

    candidates.forEach((candidate) => {
      if (added >= requested) return
      if (forcedStationIds.has(candidate.station.id)) return

      forcedStationIds.add(candidate.station.id)
      added += 1

      if (!selectedIds.has(candidate.station.id)) {
        selectedIds.add(candidate.station.id)
        next.push(candidate)
      }
    })

    if (added < requested) {
      warnings.push(
        `${target.label} requested ${requested} ${unit}${requested === 1 ? '' : 's'}, but only ${added} unique matching Supercharger stop${added === 1 ? '' : 's'} were available.`,
      )
    }
  })

  if (next.length > targetStationCount) {
    const forced = next.filter((station) =>
      forcedStationIds.has(station.station.id),
    )
    const regular = next.filter(
      (station) => !forcedStationIds.has(station.station.id),
    )

    next = trimWithForcedStations(forced, regular, targetStationCount)
  }

  return { selected: next, warnings }
}

/**
 * Off-corridor cap for auto-added signature stops. Beyond this the detour
 * would dominate the day plan, so the route warns instead of detouring;
 * the user can still force it with an explicit must-visit target.
 */
const STATE_SIGNATURE_MAX_DETOUR_MILES = 220

/**
 * Guarantee the tour actually sees each state it drives through: for every
 * state the route touches (streak stops and range connectors both count as
 * driving through), make sure at least one stop falls near a signature
 * destination (Grand Canyon/Sedona for AZ, the Strip for NV, Rocky
 * Mountain NP for CO, …). When none is covered, force in the signature
 * station that's cheapest to weave into the corridor as a streak stop.
 */
function ensureStateSignatureStations(
  selected: ScoredStation[],
  scored: ScoredStation[],
  forcedStationIds: Set<string>,
  routeStations: Station[],
  handledStates: Set<string>,
) {
  const next = selected.slice()
  const warnings: string[] = []
  let forcedAny = false
  const coverage = routeStations.slice()
  const states = [...new Set(coverage.map((station) => station.address.state))]
    .filter((state) => !handledStates.has(state) && STATE_SIGNATURES[state]?.length)
    .sort()

  for (const state of states) {
    const signatures = STATE_SIGNATURES[state]
    const satisfied = signatures.some((signature) =>
      coverage.some(
        (station) =>
          haversineMiles(station.position, signature.position) <=
          signature.radiusMiles,
      ),
    )
    if (satisfied) continue

    let best: { signature: StateSignature; candidate: ScoredStation } | undefined
    for (const signature of signatures) {
      const candidate = scored
        .filter(
          (item) =>
            haversineMiles(item.station.position, signature.position) <=
            signature.radiusMiles,
        )
        .sort((a, b) => a.distanceMiles - b.distanceMiles)[0]
      if (!candidate) continue
      if (!best || candidate.distanceMiles < best.candidate.distanceMiles) {
        best = { signature, candidate }
      }
    }

    const stateName = STATE_CODE_TO_NAME[state] ?? state
    if (!best) {
      warnings.push(
        `This route stops in ${stateName} but no Supercharger sits near a signature stop there (${signatures
          .map((signature) => signature.label)
          .join(', ')}).`,
      )
      handledStates.add(state)
      continue
    }
    if (best.candidate.distanceMiles > STATE_SIGNATURE_MAX_DETOUR_MILES) {
      warnings.push(
        `${best.signature.label} is ${round(best.candidate.distanceMiles)} miles off this corridor — skipped to protect the streak. Add it as a must-visit target to force the detour.`,
      )
      handledStates.add(state)
      continue
    }

    handledStates.add(state)
    forcedStationIds.add(best.candidate.station.id)
    forcedAny = true
    if (!next.some((item) => item.station.id === best.candidate.station.id)) {
      next.push(best.candidate)
    }
    // A newly forced stop can cover a neighboring state too (e.g. Liberty
    // State Park serves both the NY and NJ signatures).
    coverage.push(best.candidate.station)
  }

  return { selected: next, warnings, forcedAny }
}

function trimWithForcedStations(
  forced: ScoredStation[],
  regular: ScoredStation[],
  targetCount: number,
) {
  const keepRegular = Math.max(0, targetCount - forced.length)
  return [
    ...forced,
    ...selectEvenlyOrderedStations(regular, keepRegular),
  ].slice(0, targetCount)
}

function selectEvenlyOrderedStations(stations: ScoredStation[], targetCount: number) {
  if (targetCount <= 0) return []

  const ordered = stations
    .slice()
    .sort((a, b) => a.order - b.order || a.distanceMiles - b.distanceMiles)

  if (ordered.length <= targetCount) return ordered
  if (targetCount === 1) return [ordered.at(-1)!]

  const selected: ScoredStation[] = []
  const usedIndexes = new Set<number>()

  for (let index = 0; index < targetCount; index += 1) {
    let candidateIndex = Math.round((index * (ordered.length - 1)) / (targetCount - 1))

    while (usedIndexes.has(candidateIndex) && candidateIndex < ordered.length - 1) {
      candidateIndex += 1
    }
    while (usedIndexes.has(candidateIndex) && candidateIndex > 0) {
      candidateIndex -= 1
    }

    if (usedIndexes.has(candidateIndex)) continue
    usedIndexes.add(candidateIndex)
    selected.push(ordered[candidateIndex])
  }

  return selected
}

function visitTargetCandidates(
  target: LongestTripVisitTarget,
  scored: ScoredStation[],
) {
  if (target.type === 'state' && target.state) {
    return scored
      .filter((station) => station.station.address.state === target.state)
      .sort((a, b) => {
        if (target.position) {
          const distanceA = haversineMiles(a.station.position, target.position)
          const distanceB = haversineMiles(b.station.position, target.position)
          return distanceA - distanceB || a.order - b.order
        }

        return a.order - b.order || a.distanceMiles - b.distanceMiles
      })
  }

  if (!target.position) return []

  const radius = target.radiusMiles ?? 60
  const withDistance = scored
    .map((station) => ({
      station,
      targetDistanceMiles: haversineMiles(station.station.position, target.position!),
    }))
    .sort(
      (a, b) =>
        a.targetDistanceMiles - b.targetDistanceMiles ||
        a.station.distanceMiles - b.station.distanceMiles,
    )

  const nearby = withDistance.filter(
    (item) => item.targetDistanceMiles <= radius,
  )
  // Auto-stays only reserve stations the route already passes; manual
  // targets fall back to the nearest stations because the user demanded them.
  if (target.auto) {
    return nearby.map((item) => item.station)
  }
  return (nearby.length > 0 ? nearby : withDistance.slice(0, 12)).map(
    (item) => item.station,
  )
}

function selectStationsAcrossCorridor(
  candidates: ScoredStation[],
  target: number,
  anchors: Coordinate[],
  start: Coordinate,
  bonusOf: (station: ScoredStation) => number = () => 0,
) {
  if (target <= 0) return []
  if (candidates.length <= target) {
    return candidates.sort(
      (a, b) => a.order - b.order || a.distanceMiles - b.distanceMiles,
    )
  }

  const routeLength = polylineLengthMiles(anchors)
  const selected: ScoredStation[] = []
  const selectedIds = new Set<string>()
  const northFirst = nearestMatchingScoredStation(candidates, start, (station) =>
    isNorthNotWest(station, start),
  )

  if (northFirst) {
    selectedIds.add(northFirst.station.id)
    selected.push({ ...northFirst, order: -1 })
  }

  const distributedTarget = target - selected.length
  const reservedNorthFirst = selected.length > 0

  for (let index = 0; index < distributedTarget; index += 1) {
    const desiredOrder =
      reservedNorthFirst
        ? (routeLength * (index + 1)) / distributedTarget
        : distributedTarget === 1
        ? routeLength
        : (routeLength * index) / (distributedTarget - 1)
    const desiredPoint = coordinateAtPolylineOrder(anchors, desiredOrder)
    let best: ScoredStation | undefined
    let bestScore = Infinity

    candidates.forEach((candidate) => {
      if (selectedIds.has(candidate.station.id)) return

      const score =
        haversineMiles(candidate.station.position, desiredPoint) +
        candidate.distanceMiles * 0.05 -
        bonusOf(candidate)
      if (score < bestScore) {
        bestScore = score
        best = candidate
      }
    })

    if (!best) break
    selectedIds.add(best.station.id)
    selected.push({ ...best, order: desiredOrder })
  }

  return selected.sort(
    (a, b) => a.order - b.order || a.distanceMiles - b.distanceMiles,
  )
}

function coordinateAtPolylineOrder(anchors: Coordinate[], targetOrder: number) {
  if (anchors.length === 0) return { lat: 0, lon: 0 }
  if (anchors.length === 1) return anchors[0]

  let cumulative = 0
  for (let index = 0; index < anchors.length - 1; index += 1) {
    const start = anchors[index]
    const end = anchors[index + 1]
    const segmentLength = haversineMiles(start, end)

    if (targetOrder <= cumulative + segmentLength || index === anchors.length - 2) {
      const progress =
        segmentLength > 0
          ? Math.max(0, Math.min(1, (targetOrder - cumulative) / segmentLength))
          : 0
      return {
        lat: start.lat + (end.lat - start.lat) * progress,
        lon: start.lon + (end.lon - start.lon) * progress,
      }
    }

    cumulative += segmentLength
  }

  return anchors.at(-1)!
}

function ensureNorthFirstCandidate(
  selected: ScoredStation[],
  scored: ScoredStation[],
  start: Coordinate,
  target: number,
  protectedStationIds: Set<string>,
) {
  if (selected.some((station) => isNorthNotWest(station.station, start))) {
    return selected
  }

  const candidate = nearestMatchingScoredStation(scored, start, (station) =>
    isNorthNotWest(station, start),
  )
  if (!candidate) return selected

  const next = selected.some(
    (station) => station.station.id === candidate.station.id,
  )
    ? selected.slice()
    : [...selected, candidate]

  if (next.length <= target) return next

  const removable = next
    .map((station, index) => ({ station, index }))
    .filter(
      ({ station }) =>
        station.station.id !== candidate.station.id &&
        !protectedStationIds.has(station.station.id),
    )
    .sort((a, b) => b.station.distanceMiles - a.station.distanceMiles)[0]

  if (removable) {
    next.splice(removable.index, 1)
  }

  return next
}

function nearestMatchingScoredStation(
  stations: ScoredStation[],
  start: Coordinate,
  matches: (station: Station) => boolean,
) {
  let best: ScoredStation | undefined
  let bestMiles = Infinity

  stations.forEach((station) => {
    if (!matches(station.station)) return

    const miles = haversineMiles(start, station.station.position)
    if (miles < bestMiles) {
      bestMiles = miles
      best = station
    }
  })

  return best
}

function scoreStations(anchors: Coordinate[], stations: Station[]) {
  return stations.map<ScoredStation>((station) => ({
    station,
    ...scoreAgainstPolyline(station.position, anchors),
  }))
}

function stopMinutesForVisit(
  legMiles: number,
  nextLegMiles: number,
  chargingState: ChargingState,
  config: PlannerConfig,
) {
  const chargeBudgetMiles = Math.max(0, legMiles - config.closeStationRadiusMiles)
  const nextChargeBudgetMiles = Math.max(
    0,
    nextLegMiles - config.closeStationRadiusMiles,
  )
  chargingState.rangeRemainingMiles -= chargeBudgetMiles

  const needsDistanceCharge =
    chargingState.rangeRemainingMiles < nextChargeBudgetMiles ||
    legMiles > config.practicalRangeMiles ||
    nextLegMiles > config.practicalRangeMiles

  if (needsDistanceCharge) {
    chargingState.rangeRemainingMiles = config.practicalRangeMiles
    return config.distanceChargeStopMinutes
  }

  return config.closeStationStopMinutes
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
    rating: emptySegmentRating(),
  }
}

function buildDayPlans(
  selectedStations: ScoredStation[],
  routeName: string,
  config: PlannerConfig,
  /** Real per-leg miles (e.g. from OSRM/ORS): index i = arrival leg for station i,
   *  index selectedStations.length = the return leg. Falls back to the estimate. */
  precomputedLegMiles?: number[],
  /** Real per-leg drive hours (e.g. ORS durations, speed-limit aware). When
   *  present, drive time uses these instead of distance / averageMph. */
  precomputedDriveHours?: number[],
  ratingTargets: RatingPlaceTarget[] = [],
) {
  const days: DayPlan[] = []
  const visits: RouteStationVisit[] = []
  const chargingState: ChargingState = {
    rangeRemainingMiles: config.practicalRangeMiles,
  }
  let day = emptyDay(1)
  let previous = {
    position: config.start,
    order: 0,
    distanceMiles: 0,
  }

  for (let index = 0; index < selectedStations.length; index += 1) {
    const scoredStation = selectedStations[index]
    const legMiles =
      precomputedLegMiles?.[index] ??
      roadLegMiles(
        previous.position,
        scoredStation.station.position,
        config.roadDistanceFactor,
      )
    const driveHours = precomputedDriveHours?.[index] ?? legMiles / config.averageMph

    const projectedDriveHours = day.driveHours + driveHours
    const longDayOpportunity = evaluateLongDayOpportunity(
      day,
      index,
      selectedStations,
      previous,
      config,
      precomputedLegMiles,
      precomputedDriveHours,
    )

    if (day.visits.length > 0 && projectedDriveHours > config.dailyDriveTargetHours) {
      if (longDayOpportunity.allow) {
        day.longDayOptimized = true
        day.longDayReason = longDayOpportunity.reason
      } else {
        days.push(finalizeDay(day, config, ratingTargets))
        day = emptyDay(day.day + 1)
      }
    }

    const activeLegMiles = legMiles
    const activeDriveHours = driveHours

    if (
      day.visits.length > 0 &&
      day.driveHours + activeDriveHours > getCurrentDayCap(day, config)
    ) {
      days.push(finalizeDay(day, config, ratingTargets))
      day = emptyDay(day.day + 1)
    }

    const nextPosition =
      selectedStations[index + 1]?.station.position ?? config.start
    const nextLegMiles =
      precomputedLegMiles?.[index + 1] ??
      roadLegMiles(
        scoredStation.station.position,
        nextPosition,
        config.roadDistanceFactor,
      )
    const activeStopMinutes = stopMinutesForVisit(
      activeLegMiles,
      nextLegMiles,
      chargingState,
      config,
    )

    const visit: RouteStationVisit = {
      sequence: index + 1,
      day: day.day,
      station: scoredStation.station,
      legMiles: round(activeLegMiles),
      driveHours: round(activeDriveHours, 2),
      stopMinutes: activeStopMinutes,
      rangeWarning: activeLegMiles > config.practicalRangeMiles,
      connectorStop: scoredStation.connectorStop,
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

  const returnLegMiles =
    precomputedLegMiles?.[selectedStations.length] ??
    roadLegMiles(previous.position, config.start, config.roadDistanceFactor)
  const returnDriveHours =
    precomputedDriveHours?.[selectedStations.length] ??
    returnLegMiles / config.averageMph

  if (
    day.visits.length > 0 &&
    day.driveHours + returnDriveHours > config.dailyDriveTargetHours
  ) {
    days.push(finalizeDay(day, config, ratingTargets))
    day = emptyDay(day.day + 1)
  }

  day.miles += returnLegMiles
  day.driveHours += returnDriveHours
  if (returnLegMiles > config.practicalRangeMiles) {
    day.warnings.push(
      `Return leg is ${round(returnLegMiles)} miles, above configured practical range.`,
    )
  }
  days.push(finalizeDay(day, config, ratingTargets))

  const totalMiles = days.reduce((sum, item) => sum + item.miles, 0)
  const totalDriveHours = days.reduce((sum, item) => sum + item.driveHours, 0)
  const totalStopHours =
    days.reduce((sum, item) => sum + item.stopMinutes, 0) / 60
  const uniqueStationCount = new Set(visits.map((visit) => visit.station.id)).size
  const availableDays = Math.round(config.tripWeeks * 7)
  const warnings: string[] = []
  const advisories: PlannerAdvisory[] = []
  const overRangeCount = visits.filter((visit) => visit.rangeWarning).length
  const connectorStops = visits.filter((visit) => visit.connectorStop).length
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
  if (connectorStops > 0) {
    advisories.push({
      severity: 'info',
      message: `${connectorStops} transfer connector stop${connectorStops === 1 ? '' : 's'} inserted to break long repositioning legs into Supercharger-sized hops.`,
    })
  }
  if (uniqueStationCount < config.targetStations) {
    warnings.push(
      `Only ${uniqueStationCount} matching sites were available for ${routeName} under the current station filters.`,
    )
  }
  if (uniqueStationCount / Math.max(1, days.length) > 18) {
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
      uniqueStationCount,
      warnings,
      advisories,
      longDays,
    },
  }
}

function buildLongestTripDayPlans(
  selectedStations: ScoredStation[],
  routeName: string,
  config: PlannerConfig,
  /** Real per-leg miles (e.g. from ORS): index i = arrival leg for station i. */
  precomputedLegMiles?: number[],
  /** Real per-leg drive hours. */
  precomputedDriveHours?: number[],
  ratingTargets: RatingPlaceTarget[] = [],
) {
  const days: DayPlan[] = []
  const visits: RouteStationVisit[] = []
  const chargingState: ChargingState = {
    rangeRemainingMiles: config.practicalRangeMiles,
  }
  let previous = {
    position: config.start,
    order: 0,
    distanceMiles: 0,
  }
  let previousStopMinutes = 0

  for (let index = 0; index < selectedStations.length; index += 1) {
    const scoredStation = selectedStations[index]
    const legMiles =
      precomputedLegMiles?.[index] ??
      roadLegMiles(
        previous.position,
        scoredStation.station.position,
        config.roadDistanceFactor,
      )
    const driveHours = precomputedDriveHours?.[index] ?? legMiles / config.averageMph
    const nextPosition = selectedStations[index + 1]?.station.position
    const nextLegMiles = nextPosition
      ? precomputedLegMiles?.[index + 1] ??
        roadLegMiles(
          scoredStation.station.position,
          nextPosition,
          config.roadDistanceFactor,
        )
      : 0
    const activeStopMinutes = stopMinutesForVisit(
      legMiles,
      nextLegMiles,
      chargingState,
      config,
    )

    const day = emptyDay(index + 1)
    const visit: RouteStationVisit = {
      sequence: index + 1,
      day: day.day,
      station: scoredStation.station,
      legMiles: round(legMiles),
      driveHours: round(driveHours, 2),
      stopMinutes: activeStopMinutes,
      rangeWarning: legMiles > config.practicalRangeMiles,
      connectorStop: scoredStation.connectorStop,
    }
    const startToStartHours = previousStopMinutes / 60 + driveHours

    day.miles += legMiles
    day.driveHours += driveHours
    day.stopMinutes += activeStopMinutes
    day.uniqueStations += 1
    day.visits.push(visit)

    if (index > 0 && startToStartHours > 24) {
      day.warnings.push(
        `${round(startToStartHours, 1)} hours from the previous charge start exceeds the 24-hour streak window.`,
      )
    } else if (index > 0 && startToStartHours > 21) {
      day.advisories.push({
        severity: 'medium',
        message: `${round(startToStartHours, 1)} hours from the previous charge start leaves little buffer for the 24-hour streak window.`,
      })
    }

    visits.push(visit)
    days.push(finalizeDay(day, config, ratingTargets))
    previous = {
      position: scoredStation.station.position,
      order: scoredStation.order,
      distanceMiles: scoredStation.distanceMiles,
    }
    previousStopMinutes = activeStopMinutes
  }

  const totalMiles = days.reduce((sum, item) => sum + item.miles, 0)
  const totalDriveHours = days.reduce((sum, item) => sum + item.driveHours, 0)
  const totalStopHours =
    days.reduce((sum, item) => sum + item.stopMinutes, 0) / 60
  const uniqueStationCount = new Set(visits.map((visit) => visit.station.id)).size
  const warnings: string[] = []
  const advisories: PlannerAdvisory[] = [
    {
      severity: 'info',
      message:
        `${routeName} targets one new unique Supercharger per streak day. Repeat Superchargers should be treated as backup charging only.`,
    },
  ]
  const overRangeCount = visits.filter((visit) => visit.rangeWarning).length
  const connectorStops = visits.filter((visit) => visit.connectorStop).length
  const longDays = days.filter((item) => item.longDayOptimized).length
  const streakWindowMisses = days.filter((day) =>
    day.warnings.some((warning) => warning.includes('24-hour streak window')),
  ).length
  const streakWindowTightDays = days.filter((day) =>
    day.advisories.some((advisory) =>
      advisory.message.includes('24-hour streak window'),
    ),
  ).length

  if (uniqueStationCount < config.longestTripDays) {
    warnings.push(
      `Only ${uniqueStationCount} unique streak stops were available for the configured ${config.longestTripDays}-day Longest Trip target.`,
    )
  }
  if (overRangeCount > 0) {
    advisories.push({
      severity: 'medium',
      message: `${overRangeCount} streak leg${overRangeCount === 1 ? '' : 's'} exceed the configured Supercharger-to-Supercharger range. Add a closer unique Supercharger or auxiliary charging buffer before relying on this streak.`,
    })
  }
  if (days.some((item) => exceedsAllowedDayCap(item, config))) {
    warnings.push('At least one streak day exceeds the configured hard drive cap.')
  }
  if (streakWindowMisses > 0) {
    warnings.push(
      `${streakWindowMisses} streak transition${streakWindowMisses === 1 ? '' : 's'} exceed the 24-hour window using current road-drive timing.`,
    )
  }
  if (streakWindowTightDays > 0) {
    advisories.push({
      severity: 'medium',
      message: `${streakWindowTightDays} streak transition${streakWindowTightDays === 1 ? '' : 's'} leave less than 3 hours of buffer before the 24-hour window closes.`,
    })
  }
  if (connectorStops > 0) {
    advisories.push({
      severity: 'info',
      message: `${connectorStops} transfer connector stop${connectorStops === 1 ? '' : 's'} inserted; each unique connector can count as a streak stop if charged within the 24-hour window.`,
    })
  }

  return {
    days,
    visits,
    totals: {
      totalMiles: round(totalMiles),
      totalDriveHours: round(totalDriveHours, 1),
      totalStopHours: round(totalStopHours, 1),
      uniqueStationCount,
      warnings,
      advisories,
      longDays,
    },
  }
}

function buildRouteDayPlans(
  selectedStations: ScoredStation[],
  routeName: string,
  config: PlannerConfig,
  precomputedLegMiles?: number[],
  precomputedDriveHours?: number[],
  ratingTargets: RatingPlaceTarget[] = [],
) {
  const plans =
    config.plannerMode === 'longest_trip'
      ? buildLongestTripDayPlans(
          selectedStations,
          routeName,
          config,
          precomputedLegMiles,
          precomputedDriveHours,
          ratingTargets,
        )
      : buildDayPlans(
          selectedStations,
          routeName,
          config,
          precomputedLegMiles,
          precomputedDriveHours,
          ratingTargets,
        )

  return { ...plans, days: tagStayDays(plans.days, config) }
}

function getCurrentDayCap(day: DayPlan, config: PlannerConfig) {
  if (allowsLongDayCap(day, config)) {
    return config.longDayMaxHours
  }

  return config.dailyDriveMaxHours
}

function exceedsAllowedDayCap(day: DayPlan, config: PlannerConfig) {
  if (allowsLongDayCap(day, config)) {
    return day.driveHours > config.longDayMaxHours
  }

  return day.driveHours > config.dailyDriveMaxHours
}

function allowsLongDayCap(day: DayPlan, config: PlannerConfig) {
  return (
    day.longDayOptimized &&
    (config.longDayOptimization || config.plannerMode === 'longest_trip')
  )
}

function evaluateLongDayOpportunity(
  day: DayPlan,
  startIndex: number,
  selectedStations: ScoredStation[],
  previous: { position: Coordinate; order: number; distanceMiles: number },
  config: PlannerConfig,
  precomputedLegMiles?: number[],
  precomputedDriveHours?: number[],
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
    const legMiles =
      precomputedLegMiles?.[index] ??
      roadLegMiles(
        simulatedPrevious.position,
        station.station.position,
        config.roadDistanceFactor,
      )
    const legDriveHours =
      precomputedDriveHours?.[index] ?? legMiles / config.averageMph

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

/** Point-to-point leg distance: great-circle miles inflated by the road factor.
 *  With a sensible visiting order this is a realistic per-leg estimate. */
function roadLegMiles(from: Coordinate, to: Coordinate, roadDistanceFactor: number) {
  return haversineMiles(from, to) * roadDistanceFactor
}

const MAX_CONNECTOR_STOPS_PER_LEG = 40

function insertConnectorStops(
  orderedStations: ScoredStation[],
  candidateStations: Station[],
  config: PlannerConfig,
  initialHeading?: CompassDirection | 'anchor',
) {
  if (orderedStations.length === 0) return orderedStations

  const usedStationIds = new Set<string>()
  const expanded: ScoredStation[] = []
  let previous = config.start

  orderedStations.forEach((station) => {
    if (usedStationIds.has(station.station.id)) return

    const connectors = findConnectorStopsBetween(
      previous,
      station.station.position,
      candidateStations,
      usedStationIds,
      config,
      initialHeading === undefined &&
        expanded.length === 0 &&
        !isNorthNotWest(station.station, config.start),
    )
    expanded.push(...connectors, station)
    usedStationIds.add(station.station.id)
    previous = station.station.position
  })

  const returnConnectors = findConnectorStopsBetween(
    previous,
    config.start,
    candidateStations,
    usedStationIds,
    config,
    false,
  )
  expanded.push(...returnConnectors)

  return expanded
}

function findConnectorStopsBetween(
  from: Coordinate,
  to: Coordinate,
  candidateStations: Station[],
  usedStationIds: Set<string>,
  config: PlannerConfig,
  requireNorthFirst: boolean,
) {
  const connectors: ScoredStation[] = []
  let cursor = from
  let firstStopPolicy: 'northNotWest' | 'north' | undefined = requireNorthFirst
    ? 'northNotWest'
    : undefined

  while (
    roadLegMiles(cursor, to, config.roadDistanceFactor) >
      config.practicalRangeMiles &&
    connectors.length < MAX_CONNECTOR_STOPS_PER_LEG
  ) {
    let next = chooseConnectorStation(
      cursor,
      to,
      candidateStations,
      usedStationIds,
      config,
      firstStopPolicy,
    )

    if (!next && firstStopPolicy === 'northNotWest') {
      next = chooseConnectorStation(
        cursor,
        to,
        candidateStations,
        usedStationIds,
        config,
        'north',
      )
    }

    if (!next && firstStopPolicy) {
      next = chooseConnectorStation(
        cursor,
        to,
        candidateStations,
        usedStationIds,
        config,
      )
    }

    if (!next) {
      next = chooseConnectorStation(
        cursor,
        to,
        candidateStations,
        usedStationIds,
        config,
        undefined,
        true,
      )
    }

    if (!next) break

    usedStationIds.add(next.id)
    connectors.push(asConnectorScoredStation(next, cursor, to))
    cursor = next.position
    firstStopPolicy = undefined
  }

  return connectors
}

function chooseConnectorStation(
  from: Coordinate,
  to: Coordinate,
  candidateStations: Station[],
  usedStationIds: Set<string>,
  config: PlannerConfig,
  firstStopPolicy?: 'northNotWest' | 'north',
  allowRevisit = false,
) {
  const currentRemaining = roadLegMiles(from, to, config.roadDistanceFactor)
  const minProgressMiles = Math.min(30, currentRemaining * 0.03)
  const corridorLimitMiles = Math.max(
    90,
    Math.min(220, currentRemaining * 0.3),
  )
  const targetLegMiles = config.practicalRangeMiles * 0.72
  let bestStation: Station | undefined
  let bestScore = Infinity

  candidateStations.forEach((station) => {
    if (!allowRevisit && usedStationIds.has(station.id)) return
    if (firstStopPolicy === 'northNotWest' && !isNorthNotWest(station, config.start)) {
      return
    }
    if (firstStopPolicy === 'north' && station.position.lat <= config.start.lat) {
      return
    }

    const legMiles = roadLegMiles(from, station.position, config.roadDistanceFactor)
    if (legMiles <= 1 || legMiles > config.practicalRangeMiles) return

    const remainingMiles = roadLegMiles(
      station.position,
      to,
      config.roadDistanceFactor,
    )
    if (remainingMiles >= currentRemaining - minProgressMiles) return

    const segmentScore = scoreAgainstPolyline(station.position, [from, to])
    if (segmentScore.segmentProgress <= 0.01) return
    if (segmentScore.distanceMiles > corridorLimitMiles) return

    const score =
      remainingMiles +
      segmentScore.distanceMiles * 2 +
      Math.abs(legMiles - targetLegMiles) * 0.15

    if (score < bestScore) {
      bestScore = score
      bestStation = station
    }
  })

  return bestStation
}

function asConnectorScoredStation(
  station: Station,
  from: Coordinate,
  to: Coordinate,
): ScoredStation {
  return {
    station,
    ...scoreAgainstPolyline(station.position, [from, to]),
    connectorStop: true,
  }
}

/**
 * Order selected stations into a sensible driving sequence: nearest-neighbour
 * from the start, then a bounded 2-opt pass to remove crossings. Ordering uses a
 * fast equirectangular projection (relative distances only); real leg mileage is
 * computed separately with haversine. This is what stops the route from zig-zagging.
 */
function optimizeStationOrder(
  selected: ScoredStation[],
  start: Coordinate,
  initialHeading?: CompassDirection | 'anchor',
): ScoredStation[] {
  if (selected.length === 0) return selected

  const cosLat = Math.cos((start.lat * Math.PI) / 180) || 1
  const projX = (p: Coordinate) => p.lon * cosLat
  const startX = projX(start)
  const startY = start.lat

  const remaining = selected.slice()
  const ordered: ScoredStation[] = []
  const firstIndex =
    initialHeading === undefined
      ? chooseNorthFirstStationIndex(remaining, start)
      : initialHeading === 'anchor'
        ? -1
        : chooseDirectionalItemIndex(
            remaining,
            start,
            initialHeading,
            (station) => station.station.position,
          )
  const fixedFirst = firstIndex >= 0

  if (fixedFirst) {
    const first = remaining.splice(firstIndex, 1)[0]
    ordered.push(first)
  }

  // Nearest-neighbour tour from the start point, after any fixed first stop.
  let curX = fixedFirst
    ? projX(ordered[0].station.position)
    : startX
  let curY = fixedFirst
    ? ordered[0].station.position.lat
    : startY
  while (remaining.length > 0) {
    let bestIndex = 0
    let bestDist = Infinity
    for (let i = 0; i < remaining.length; i += 1) {
      const p = remaining[i].station.position
      const dx = curX - projX(p)
      const dy = curY - p.lat
      const d = dx * dx + dy * dy
      if (d < bestDist) {
        bestDist = d
        bestIndex = i
      }
    }
    const next = remaining.splice(bestIndex, 1)[0]
    ordered.push(next)
    curX = projX(next.station.position)
    curY = next.station.position.lat
  }

  if (ordered.length <= 2) return ordered

  // Bounded 2-opt over the closed loop (start -> ordered -> start).
  const xs = ordered.map((s) => projX(s.station.position))
  const ys = ordered.map((s) => s.station.position.lat)
  const n = ordered.length
  const dist = (ax: number, ay: number, bx: number, by: number) =>
    Math.sqrt((ax - bx) * (ax - bx) + (ay - by) * (ay - by))
  const edge = (i: number, j: number) => dist(xs[i], ys[i], xs[j], ys[j])
  const toStart = (i: number) => dist(xs[i], ys[i], startX, startY)

  const MAX_PASSES = 8
  for (let pass = 0; pass < MAX_PASSES; pass += 1) {
    let improved = false
    for (let i = fixedFirst ? 1 : 0; i < n - 1; i += 1) {
      for (let j = i + 1; j < n; j += 1) {
        const before =
          (i === 0 ? toStart(i) : edge(i - 1, i)) +
          (j === n - 1 ? toStart(j) : edge(j, j + 1))
        const after =
          (i === 0 ? toStart(j) : edge(i - 1, j)) +
          (j === n - 1 ? toStart(i) : edge(i, j + 1))
        if (after + 1e-9 < before) {
          let lo = i
          let hi = j
          while (lo < hi) {
            ;[xs[lo], xs[hi]] = [xs[hi], xs[lo]]
            ;[ys[lo], ys[hi]] = [ys[hi], ys[lo]]
            ;[ordered[lo], ordered[hi]] = [ordered[hi], ordered[lo]]
            lo += 1
            hi -= 1
          }
          improved = true
        }
      }
    }
    if (!improved) break
  }

  return ordered
}

function chooseNorthFirstStationIndex(
  stations: ScoredStation[],
  start: Coordinate,
) {
  const northNotWestIndex = chooseNearestStationIndex(stations, start, (station) =>
    isNorthNotWest(station, start),
  )

  if (northNotWestIndex >= 0) return northNotWestIndex

  return chooseNearestStationIndex(
    stations,
    start,
    (station) => station.position.lat > start.lat,
  )
}

function chooseNearestStationIndex(
  stations: ScoredStation[],
  start: Coordinate,
  matches: (station: Station) => boolean,
) {
  let bestIndex = -1
  let bestMiles = Infinity

  stations.forEach((station, index) => {
    if (!matches(station.station)) return

    const miles = haversineMiles(start, station.station.position)
    if (miles < bestMiles) {
      bestMiles = miles
      bestIndex = index
    }
  })

  return bestIndex
}

function orderLongestTripStations(
  selected: ScoredStation[],
  start: Coordinate,
  initialHeading?: CompassDirection | 'anchor',
): ScoredStation[] {
  const ordered = selected
    .slice()
    .sort((a, b) => a.order - b.order || a.distanceMiles - b.distanceMiles)
  const firstIndex =
    initialHeading === undefined
      ? chooseNorthFirstStationIndex(ordered, start)
      : initialHeading === 'anchor'
        ? -1
        : chooseDirectionalItemIndex(
            ordered,
            start,
            initialHeading,
            (station) => station.station.position,
          )

  if (firstIndex > 0) {
    const first = ordered.splice(firstIndex, 1)[0]
    ordered.unshift(first)
  }

  return ordered
}

function takeRouteSequenceStations(
  stations: ScoredStation[],
  target: number,
  protectedStationIds: Set<string>,
) {
  if (target <= 0) return []

  const seen = new Set<string>()
  const unique = stations.filter((station) => {
    if (seen.has(station.station.id)) return false
    seen.add(station.station.id)
    return true
  })

  if (unique.length <= target) return unique

  const mandatoryIndexes = new Set<number>([0, unique.length - 1])
  unique.forEach((station, index) => {
    if (protectedStationIds.has(station.station.id)) {
      mandatoryIndexes.add(index)
    }
  })

  const mandatory = [...mandatoryIndexes]
    .sort((a, b) => a - b)
    .map((index) => ({ station: unique[index], index }))

  if (mandatory.length >= target) {
    return mandatory.slice(0, target).map((item) => item.station)
  }

  const regular = unique
    .map((station, index) => ({ station, index }))
    .filter((item) => !mandatoryIndexes.has(item.index))
  const regularSlots = target - mandatory.length
  const selectedRegular = selectEvenlyIndexedStations(regular, regularSlots)

  return [...mandatory, ...selectedRegular]
    .sort((a, b) => a.index - b.index)
    .map((item) => item.station)
}

function selectEvenlyIndexedStations(
  stations: Array<{ station: ScoredStation; index: number }>,
  targetCount: number,
) {
  if (targetCount <= 0) return []
  if (stations.length <= targetCount) return stations
  if (targetCount === 1) return [stations.at(-1)!]

  const selected: Array<{ station: ScoredStation; index: number }> = []
  const usedIndexes = new Set<number>()

  for (let index = 0; index < targetCount; index += 1) {
    let candidateIndex = Math.round((index * (stations.length - 1)) / (targetCount - 1))

    while (usedIndexes.has(candidateIndex) && candidateIndex < stations.length - 1) {
      candidateIndex += 1
    }
    while (usedIndexes.has(candidateIndex) && candidateIndex > 0) {
      candidateIndex -= 1
    }

    if (usedIndexes.has(candidateIndex)) continue
    usedIndexes.add(candidateIndex)
    selected.push(stations[candidateIndex])
  }

  return selected
}

function repairLongestTripLegSpacing(
  orderedStations: ScoredStation[],
  candidateStations: Station[],
  config: PlannerConfig,
  target: number,
  protectedStationIds: Set<string>,
) {
  let next = orderedStations.slice()
  const maxLegMiles = Math.min(
    config.practicalRangeMiles * 1.05,
    config.dailyDriveMaxHours * config.averageMph * 0.75,
  )

  for (let pass = 0; pass < target * 2; pass += 1) {
    const worst = findWorstArrivalLeg(next, config)
    if (!worst || worst.miles <= maxLegMiles) break

    const usedStationIds = new Set(next.map((station) => station.station.id))
    const connector =
      chooseConnectorStation(
        worst.from,
        worst.to.station.position,
        candidateStations,
        usedStationIds,
        config,
      ) ??
      chooseBridgeConnectorStation(
      worst.from,
      worst.to.station.position,
      candidateStations,
      usedStationIds,
      config,
      )

    if (!connector) break

    const connectorStation = asConnectorScoredStation(
      connector,
      worst.from,
      worst.to.station.position,
    )
    next.splice(worst.toIndex, 0, connectorStation)

    if (next.length > target) {
      const removableIndex = chooseRedundantStationIndex(
        next,
        config,
        protectedStationIds,
      )
      if (removableIndex < 0) {
        next = takeRouteSequenceStations(next, target, protectedStationIds)
      } else {
        next.splice(removableIndex, 1)
      }
    }
  }

  return next
}

function chooseBridgeConnectorStation(
  from: Coordinate,
  to: Coordinate,
  candidateStations: Station[],
  usedStationIds: Set<string>,
  config: PlannerConfig,
) {
  const currentRemaining = roadLegMiles(from, to, config.roadDistanceFactor)
  const maxLegMiles = config.practicalRangeMiles * 1.15
  let bestStation: Station | undefined
  let bestScore = Infinity

  candidateStations.forEach((station) => {
    if (usedStationIds.has(station.id)) return

    const legMiles = roadLegMiles(from, station.position, config.roadDistanceFactor)
    if (legMiles <= 1 || legMiles > maxLegMiles) return

    const remainingMiles = roadLegMiles(
      station.position,
      to,
      config.roadDistanceFactor,
    )
    if (remainingMiles >= currentRemaining - 25) return

    const detourMiles = Math.max(0, legMiles + remainingMiles - currentRemaining)
    const score = remainingMiles + detourMiles * 0.45 + legMiles * 0.1

    if (score < bestScore) {
      bestScore = score
      bestStation = station
    }
  })

  return bestStation
}

function findWorstArrivalLeg(
  stations: ScoredStation[],
  config: PlannerConfig,
) {
  let previous = config.start
  let worst:
    | { from: Coordinate; to: ScoredStation; toIndex: number; miles: number }
    | undefined

  stations.forEach((station, index) => {
    const miles = roadLegMiles(
      previous,
      station.station.position,
      config.roadDistanceFactor,
    )
    if (!worst || miles > worst.miles) {
      worst = {
        from: previous,
        to: station,
        toIndex: index,
        miles,
      }
    }
    previous = station.station.position
  })

  return worst
}

function chooseRedundantStationIndex(
  stations: ScoredStation[],
  config: PlannerConfig,
  protectedStationIds: Set<string>,
) {
  let bestIndex = -1
  let bestPenalty = Infinity

  for (let index = 1; index < stations.length - 1; index += 1) {
    const station = stations[index]
    if (station.connectorStop) continue
    if (protectedStationIds.has(station.station.id)) continue

    const previous = stations[index - 1].station.position
    const current = station.station.position
    const next = stations[index + 1].station.position
    const withStation =
      roadLegMiles(previous, current, config.roadDistanceFactor) +
      roadLegMiles(current, next, config.roadDistanceFactor)
    const withoutStation = roadLegMiles(previous, next, config.roadDistanceFactor)
    const penalty = Math.max(0, withoutStation - withStation)

    if (penalty < bestPenalty) {
      bestPenalty = penalty
      bestIndex = index
    }
  }

  return bestIndex
}

function isNorthNotWest(station: Station, start: Coordinate) {
  return station.position.lat > start.lat && station.position.lon >= start.lon
}

/** Display polyline: the start, every stop in visiting order, then back to start. */
function buildDisplayRouteLine(
  orderedStations: ScoredStation[],
  start: Coordinate,
  returnToStart = true,
): Coordinate[] {
  const points = [start, ...orderedStations.map((s) => s.station.position)]
  return returnToStart ? [...points, start] : points
}

function closeAnchorsToStart(anchors: Coordinate[], start: Coordinate) {
  const last = anchors.at(-1)
  if (last && last.lat === start.lat && last.lon === start.lon) return anchors

  return [...anchors, start]
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

function ratingTargetsForVariant(
  config: PlannerConfig,
  forcedWaypoints: RouteWaypoint[],
  autoStayTargets: LongestTripVisitTarget[] = [],
) {
  return buildRatingTargets(forcedWaypoints, [
    ...config.longestTripTargets,
    ...autoStayTargets,
  ])
}

function ratingTargetsForRefinedRoute(config: PlannerConfig, routeId: string) {
  const savedRoute = config.savedCustomRoutes.find((route) => route.id === routeId)
  const routeWaypoints =
    savedRoute?.waypoints ??
    (routeId === 'custom-ai-route' || routeId === 'custom-longest-trip'
      ? config.customRouteWaypoints
      : [])

  return buildRatingTargets(
    dedupeWaypoints([...config.requiredWaypoints, ...routeWaypoints]),
    config.longestTripTargets,
  )
}

function buildRatingTargets(
  waypoints: RouteWaypoint[],
  visitTargets: LongestTripVisitTarget[] = [],
): RatingPlaceTarget[] {
  const targets = [
    ...waypoints.map(ratingTargetForWaypoint),
    ...visitTargets
      .map(ratingTargetForVisitTarget)
      .filter((target): target is RatingPlaceTarget => Boolean(target)),
  ]
  const seen = new Set<string>()

  return targets.filter((target) => {
    const key = `${target.type}:${target.label.toLowerCase()}`
    if (seen.has(target.id) || seen.has(key)) return false
    seen.add(target.id)
    seen.add(key)
    return true
  })
}

function ratingTargetForWaypoint(waypoint: RouteWaypoint): RatingPlaceTarget {
  const catalogEntry = getPlaceCatalogEntry(waypoint.id)
  const type = catalogEntry?.type ?? inferWaypointType(waypoint)
  const detail = catalogEntry
    ? detailForCatalogPlace(catalogEntry)
    : fallbackRatingTargetDetail(type, waypoint.label)

  return {
    id: `waypoint:${waypoint.id}`,
    type,
    label: waypoint.label,
    position: waypoint.position,
    radiusMiles: ratingTargetRadius(waypoint.radiusMiles),
    rating: detail.rating,
    sceneryScore: detail.sceneryScore,
    summary: detail.summary,
  }
}

function ratingTargetForVisitTarget(
  target: LongestTripVisitTarget,
): RatingPlaceTarget | undefined {
  if (target.type === 'state' || !target.position) return undefined

  const catalogEntry = getPlaceCatalogEntry(target.id)
  const type = catalogEntry?.type ?? target.type
  const detail = catalogEntry
    ? detailForCatalogPlace(catalogEntry)
    : fallbackRatingTargetDetail(type, target.label)

  return {
    id: `visit-target:${target.id}`,
    type,
    label: target.label,
    position: target.position,
    radiusMiles: ratingTargetRadius(target.radiusMiles ?? 50),
    rating: detail.rating,
    sceneryScore: detail.sceneryScore,
    summary: detail.summary,
  }
}

function inferWaypointType(waypoint: RouteWaypoint) {
  const value = `${waypoint.id} ${waypoint.reason ?? ''}`.toLowerCase()
  return value.includes('city') ? 'city' : 'landmark'
}

function fallbackRatingTargetDetail(
  type: RatingPlaceTarget['type'],
  label: string,
) {
  if (type === 'city') {
    return {
      rating: 80,
      sceneryScore: 62,
      summary: `${label} is a selected city stop, so the route rating now reflects reaching that planned destination.`,
    }
  }

  return {
    rating: 82,
    sceneryScore: 68,
    summary: `${label} is a selected landmark stop, so the route rating now reflects reaching that planned destination.`,
  }
}

function ratingTargetRadius(radiusMiles: number) {
  return Math.max(35, Math.min(250, radiusMiles))
}

function finalizeDay(
  day: DayPlan,
  config: PlannerConfig,
  ratingTargets: RatingPlaceTarget[] = [],
): DayPlan {
  const warnings = [...day.warnings]
  const advisories = [...day.advisories]
  const overRangeVisits = day.visits.filter((visit) => visit.rangeWarning)
  const densityLongDay =
    config.longDayOptimization &&
    day.longDayOptimized &&
    day.driveHours > config.dailyDriveMaxHours &&
    day.driveHours <= config.longDayMaxHours
  const allowsTransferLongDay =
    config.plannerMode === 'longest_trip' || config.longDayOptimization
  const transferLongDay =
    allowsTransferLongDay &&
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
    uniqueStations: new Set(day.visits.map((visit) => visit.station.id)).size,
    warnings,
    advisories,
    longDayOptimized,
    ...(longDayReason ? { longDayReason } : {}),
    visits: day.visits.map((visit) => ({
      ...visit,
      day: day.day,
    })),
    rating: buildSegmentRating(
      day.visits,
      'day',
      day.miles > 0 || day.driveHours > 0,
      ratingTargets,
    ),
  }
}

/**
 * Rebuild a single route's mileage and day plan from real per-leg road miles
 * (e.g. OSRM). The visiting order is preserved; only the leg distances change,
 * so totals, day boundaries, gaps and range flags all become road-accurate.
 * `legMiles` length must be orderedStations.length + 1 (the last is the return leg).
 */
export function refineRouteWithRoadLegs(
  orderedStations: Station[],
  partialConfig: Partial<PlannerConfig>,
  meta: { id: string; name: string; strategy: string; color: string },
  legMiles: number[],
  /** Optional real drive hours per leg (e.g. ORS speed-limit durations). */
  driveHours?: number[],
): RoutePlan {
  const config = sanitizePlannerConfig(partialConfig)
  const scored: ScoredStation[] = orderedStations.map((station) => ({
    station,
    distanceMiles: 0,
    order: 0,
    segmentIndex: 0,
    segmentProgress: 0,
  }))
  const ratingTargets = ratingTargetsForRefinedRoute(config, meta.id)
  const plans = buildRouteDayPlans(
    scored,
    meta.name,
    config,
    legMiles,
    driveHours,
    ratingTargets,
  )
  const totalDays = Math.max(1, plans.days.length)
  const uniqueStations = plans.totals.uniqueStationCount
  const chargeStops = plans.visits.length
  const totalVisitLegMiles = plans.visits.reduce((sum, v) => sum + v.legMiles, 0)

  return {
    id: meta.id,
    plannerMode: config.plannerMode,
    name: meta.name,
    strategy: meta.strategy,
    color: meta.color,
    uniqueStations,
    totalMiles: plans.totals.totalMiles,
    totalDriveHours: plans.totals.totalDriveHours,
    totalStopHours: plans.totals.totalStopHours,
    totalDays: plans.days.length,
    averageMilesPerDay: round(plans.totals.totalMiles / totalDays),
    averageDriveHoursPerDay: round(plans.totals.totalDriveHours / totalDays, 2),
    averageStopHoursPerDay: round(plans.totals.totalStopHours / totalDays, 2),
    averageDistanceBetweenSuperchargers:
      chargeStops > 0 ? round(totalVisitLegMiles / chargeStops) : 0,
    stationsPerDay: round(uniqueStations / totalDays, 1),
    days: plans.days,
    visits: plans.visits,
    warnings: plans.totals.warnings,
    advisories: plans.totals.advisories,
    longDays: plans.totals.longDays,
    routeLine: buildDisplayRouteLine(scored, config.start),
    rating: buildRouteRating(plans.days, ratingTargets),
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
  const variants =
    config.plannerMode === 'longest_trip'
      ? buildLongestTripVariants(
          config.start,
          config.requiredWaypoints,
          config.customRouteWaypoints,
          config.longestTripTargets,
          config.savedCustomRoutes,
        )
      : buildMostUniqueSiteVariants(
          config.start,
          config.requiredWaypoints,
          config.customRouteWaypoints,
          config.savedCustomRoutes,
        )
  const defaultRouteTarget =
    config.plannerMode === 'longest_trip'
      ? config.longestTripDays
      : config.targetStations

  const stationRatingBonus = buildStationRatingBonus(stations, config)

  const routes: RoutePlan[] = variants.map((variant) => {
    const routeTarget =
      config.plannerMode === 'longest_trip'
        ? variant.targetDays ?? defaultRouteTarget
        : defaultRouteTarget
    const autoStayTargets =
      config.plannerMode === 'longest_trip'
        ? planAutoStays(variant.anchors, variant.corridorMiles, config)
        : []
    const stationChoice = chooseStationsForVariant(
      variant,
      stations,
      routeTarget,
      variant.forcedWaypoints,
      {
        spreadAlongCorridor: config.plannerMode === 'longest_trip',
        visitTargets:
          config.plannerMode === 'longest_trip'
            ? [...config.longestTripTargets, ...autoStayTargets]
            : config.longestTripTargets,
        visitTargetUnit:
          config.plannerMode === 'longest_trip' ? 'streak day' : 'reserved stop',
        ratingBonus: stationRatingBonus,
      },
    )
    const buildOrderedStations = (selected: ScoredStation[]) => {
      const stationOrder =
        config.plannerMode === 'longest_trip'
          ? orderLongestTripStations(selected, config.start, variant.initialHeading)
          : optimizeStationOrder(selected, config.start, variant.initialHeading)
      const expandedStations = insertConnectorStops(
        stationOrder,
        stations,
        config,
        variant.initialHeading,
      )
      return config.plannerMode === 'longest_trip'
        ? repairLongestTripLegSpacing(
            takeRouteSequenceStations(
              expandedStations,
              routeTarget,
              stationChoice.protectedStationIds,
            ),
            stations,
            config,
            routeTarget,
            stationChoice.protectedStationIds,
          )
        : expandedStations
    }

    let orderedStations = buildOrderedStations(stationChoice.selected)

    // Longest Trip: connectors reveal every state the route actually
    // drives through, so guarantee each one's signature stop and rebuild
    // the sequence when new stops were woven in. A rebuild can route new
    // connectors through yet another state, so iterate to a fixpoint
    // (bounded — each state is handled at most once).
    if (config.plannerMode === 'longest_trip') {
      const handledStates = new Set<string>()
      let signatureSelected = stationChoice.selected
      for (let pass = 0; pass < 3; pass += 1) {
        const signatureResult = ensureStateSignatureStations(
          signatureSelected,
          stationChoice.scored,
          stationChoice.protectedStationIds,
          orderedStations.map((item) => item.station),
          handledStates,
        )
        stationChoice.waypointWarnings.push(...signatureResult.warnings)
        if (!signatureResult.forcedAny) break
        signatureSelected = signatureResult.selected.sort(
          (a, b) => a.order - b.order || a.distanceMiles - b.distanceMiles,
        )
        orderedStations = buildOrderedStations(signatureSelected)
      }
    }

    const ratingTargets = ratingTargetsForVariant(
      config,
      variant.forcedWaypoints,
      autoStayTargets,
    )
    const plans = buildRouteDayPlans(
      orderedStations,
      variant.name,
      config,
      undefined,
      undefined,
      ratingTargets,
    )
    const totalDays = plans.days.length
    const uniqueStations = plans.totals.uniqueStationCount
    const chargeStops = plans.visits.length
    const totalVisitLegMiles = plans.visits.reduce(
      (sum, visit) => sum + visit.legMiles,
      0,
    )

    return {
      id: variant.id,
      plannerMode: config.plannerMode,
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
        chargeStops > 0 ? round(totalVisitLegMiles / chargeStops) : 0,
      stationsPerDay: round(uniqueStations / totalDays, 1),
      days: plans.days,
      visits: plans.visits,
      warnings: [...stationChoice.waypointWarnings, ...plans.totals.warnings],
      advisories: plans.totals.advisories,
      longDays: plans.totals.longDays,
      routeLine: buildDisplayRouteLine(orderedStations, config.start),
      rating: buildRouteRating(plans.days, ratingTargets),
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
