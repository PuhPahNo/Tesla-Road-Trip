import type { Coordinate } from './types'

/**
 * A "must-see" destination that certifies a state as properly visited.
 * If a Longest Trip route stops in the state, it should also pass within
 * `radiusMiles` of at least one of the state's signatures.
 */
export interface StateSignature {
  id: string
  label: string
  position: Coordinate
  radiusMiles: number
}

/**
 * Signature landmarks and cities per state (lower 48 + DC). Ordered by
 * preference; the optimizer weaves in whichever is cheapest to reach from
 * the route corridor when none is already covered.
 *
 * Radii are deliberately generous for remote parks (a gateway-town stop
 * "counts") and tight for metros (a suburb 100 miles out does not).
 */
export const STATE_SIGNATURES: Record<string, StateSignature[]> = {
  AL: [
    {
      id: 'al-space-rocket-center',
      label: 'U.S. Space & Rocket Center (Huntsville)',
      position: { lat: 34.7104, lon: -86.6528 },
      radiusMiles: 45,
    },
    {
      id: 'al-uss-alabama',
      label: 'USS Alabama / Mobile Bay',
      position: { lat: 30.6818, lon: -88.0145 },
      radiusMiles: 45,
    },
  ],
  AR: [
    {
      id: 'ar-hot-springs',
      label: 'Hot Springs National Park',
      position: { lat: 34.5217, lon: -93.0424 },
      radiusMiles: 50,
    },
  ],
  AZ: [
    {
      id: 'az-grand-canyon',
      label: 'Grand Canyon',
      position: { lat: 36.1069, lon: -112.1129 },
      radiusMiles: 95,
    },
    {
      id: 'az-sedona',
      label: 'Sedona red rocks',
      position: { lat: 34.8697, lon: -111.7609 },
      radiusMiles: 55,
    },
  ],
  CA: [
    {
      id: 'ca-golden-gate',
      label: 'Golden Gate / San Francisco',
      position: { lat: 37.8199, lon: -122.4783 },
      radiusMiles: 50,
    },
    {
      id: 'ca-yosemite',
      label: 'Yosemite gateway',
      position: { lat: 37.8651, lon: -119.5383 },
      radiusMiles: 90,
    },
    {
      id: 'ca-santa-monica',
      label: 'Santa Monica Pier / Los Angeles',
      position: { lat: 34.0089, lon: -118.4973 },
      radiusMiles: 50,
    },
  ],
  CO: [
    {
      id: 'co-rocky-mountain',
      label: 'Rocky Mountain National Park',
      position: { lat: 40.3428, lon: -105.6836 },
      radiusMiles: 80,
    },
    {
      id: 'co-garden-of-the-gods',
      label: 'Garden of the Gods / Pikes Peak',
      position: { lat: 38.8784, lon: -104.8698 },
      radiusMiles: 50,
    },
  ],
  CT: [
    {
      id: 'ct-mystic',
      label: 'Mystic Seaport',
      position: { lat: 41.3623, lon: -71.9662 },
      radiusMiles: 45,
    },
  ],
  DC: [
    {
      id: 'dc-national-mall',
      label: 'National Mall',
      position: { lat: 38.8895, lon: -77.0353 },
      radiusMiles: 35,
    },
  ],
  DE: [
    {
      id: 'de-rehoboth',
      label: 'Rehoboth Beach boardwalk',
      position: { lat: 38.7168, lon: -75.076 },
      radiusMiles: 45,
    },
  ],
  FL: [
    {
      id: 'fl-space-coast',
      label: 'Kennedy Space Center',
      position: { lat: 28.5729, lon: -80.649 },
      radiusMiles: 55,
    },
    {
      id: 'fl-disney',
      label: 'Walt Disney World (Orlando)',
      position: { lat: 28.3852, lon: -81.5639 },
      radiusMiles: 50,
    },
    {
      id: 'fl-south-beach',
      label: 'South Beach (Miami)',
      position: { lat: 25.7907, lon: -80.13 },
      radiusMiles: 45,
    },
  ],
  GA: [
    {
      id: 'ga-savannah',
      label: 'Savannah Historic District',
      position: { lat: 32.0809, lon: -81.0912 },
      radiusMiles: 45,
    },
    {
      id: 'ga-atlanta',
      label: 'Downtown Atlanta',
      position: { lat: 33.7625, lon: -84.3928 },
      radiusMiles: 45,
    },
  ],
  IA: [
    {
      id: 'ia-field-of-dreams',
      label: 'Field of Dreams (Dyersville)',
      position: { lat: 42.4972, lon: -91.0554 },
      radiusMiles: 65,
    },
    {
      id: 'ia-des-moines',
      label: 'Des Moines',
      position: { lat: 41.5868, lon: -93.625 },
      radiusMiles: 45,
    },
  ],
  ID: [
    {
      id: 'id-shoshone-falls',
      label: 'Shoshone Falls',
      position: { lat: 42.5947, lon: -114.4009 },
      radiusMiles: 55,
    },
    {
      id: 'id-sawtooth',
      label: 'Sawtooth / Sun Valley',
      position: { lat: 43.6971, lon: -114.3517 },
      radiusMiles: 80,
    },
  ],
  IL: [
    {
      id: 'il-chicago',
      label: 'Millennium Park (Chicago)',
      position: { lat: 41.8826, lon: -87.6226 },
      radiusMiles: 45,
    },
  ],
  IN: [
    {
      id: 'in-indy-speedway',
      label: 'Indianapolis Motor Speedway',
      position: { lat: 39.7954, lon: -86.2353 },
      radiusMiles: 45,
    },
  ],
  KS: [
    {
      id: 'ks-monument-rocks',
      label: 'Monument Rocks',
      position: { lat: 38.792, lon: -100.7626 },
      radiusMiles: 85,
    },
    {
      id: 'ks-tallgrass',
      label: 'Tallgrass Prairie Preserve',
      position: { lat: 38.4332, lon: -96.558 },
      radiusMiles: 70,
    },
  ],
  KY: [
    {
      id: 'ky-mammoth-cave',
      label: 'Mammoth Cave',
      position: { lat: 37.1862, lon: -86.1005 },
      radiusMiles: 55,
    },
    {
      id: 'ky-bourbon-trail',
      label: 'Bourbon Trail (Louisville)',
      position: { lat: 38.2527, lon: -85.7585 },
      radiusMiles: 45,
    },
  ],
  LA: [
    {
      id: 'la-french-quarter',
      label: 'French Quarter (New Orleans)',
      position: { lat: 29.9584, lon: -90.0644 },
      radiusMiles: 45,
    },
  ],
  MA: [
    {
      id: 'ma-freedom-trail',
      label: 'Freedom Trail (Boston)',
      position: { lat: 42.3601, lon: -71.0589 },
      radiusMiles: 45,
    },
    {
      id: 'ma-cape-cod',
      label: 'Cape Cod',
      position: { lat: 41.6688, lon: -70.2962 },
      radiusMiles: 60,
    },
  ],
  MD: [
    {
      id: 'md-annapolis',
      label: 'Annapolis / Chesapeake Bay',
      position: { lat: 38.9784, lon: -76.4922 },
      radiusMiles: 45,
    },
  ],
  ME: [
    {
      id: 'me-acadia',
      label: 'Acadia / Bar Harbor',
      position: { lat: 44.3386, lon: -68.2733 },
      radiusMiles: 95,
    },
  ],
  MI: [
    {
      id: 'mi-detroit',
      label: 'Detroit riverfront',
      position: { lat: 42.3314, lon: -83.0458 },
      radiusMiles: 45,
    },
    {
      id: 'mi-sleeping-bear',
      label: 'Sleeping Bear Dunes',
      position: { lat: 44.8834, lon: -86.0189 },
      radiusMiles: 85,
    },
  ],
  MN: [
    {
      id: 'mn-minneapolis',
      label: 'Minneapolis lakes',
      position: { lat: 44.9778, lon: -93.265 },
      radiusMiles: 45,
    },
    {
      id: 'mn-north-shore',
      label: 'North Shore / Duluth',
      position: { lat: 46.7867, lon: -92.1005 },
      radiusMiles: 65,
    },
  ],
  MO: [
    {
      id: 'mo-gateway-arch',
      label: 'Gateway Arch (St. Louis)',
      position: { lat: 38.6247, lon: -90.1848 },
      radiusMiles: 40,
    },
    {
      id: 'mo-kansas-city',
      label: 'Kansas City jazz district',
      position: { lat: 39.0997, lon: -94.5786 },
      radiusMiles: 45,
    },
  ],
  MS: [
    {
      id: 'ms-vicksburg',
      label: 'Vicksburg battlefield',
      position: { lat: 32.3526, lon: -90.8779 },
      radiusMiles: 50,
    },
    {
      id: 'ms-gulf-coast',
      label: 'Mississippi Gulf Coast (Biloxi)',
      position: { lat: 30.396, lon: -88.8853 },
      radiusMiles: 50,
    },
  ],
  MT: [
    {
      id: 'mt-glacier',
      label: 'Glacier National Park gateway',
      position: { lat: 48.4966, lon: -113.9931 },
      radiusMiles: 120,
    },
    {
      id: 'mt-yellowstone-north',
      label: 'Yellowstone north gateway (Bozeman)',
      position: { lat: 45.0293, lon: -110.701 },
      radiusMiles: 95,
    },
  ],
  NC: [
    {
      id: 'nc-blue-ridge',
      label: 'Blue Ridge Parkway (Asheville)',
      position: { lat: 35.5951, lon: -82.5515 },
      radiusMiles: 60,
    },
    {
      id: 'nc-outer-banks',
      label: 'Outer Banks',
      position: { lat: 35.9582, lon: -75.6201 },
      radiusMiles: 85,
    },
  ],
  ND: [
    {
      id: 'nd-theodore-roosevelt',
      label: 'Theodore Roosevelt National Park',
      position: { lat: 46.979, lon: -103.5387 },
      radiusMiles: 95,
    },
  ],
  NE: [
    {
      id: 'ne-chimney-rock',
      label: 'Chimney Rock',
      position: { lat: 41.7036, lon: -103.348 },
      radiusMiles: 85,
    },
    {
      id: 'ne-omaha',
      label: 'Omaha Old Market',
      position: { lat: 41.2565, lon: -95.9345 },
      radiusMiles: 45,
    },
  ],
  NH: [
    {
      id: 'nh-white-mountains',
      label: 'White Mountains',
      position: { lat: 44.2706, lon: -71.3033 },
      radiusMiles: 70,
    },
  ],
  NJ: [
    {
      id: 'nj-liberty-state-park',
      label: 'Liberty State Park (Statue of Liberty)',
      position: { lat: 40.7053, lon: -74.055 },
      radiusMiles: 40,
    },
    {
      id: 'nj-atlantic-city',
      label: 'Atlantic City boardwalk',
      position: { lat: 39.3643, lon: -74.4229 },
      radiusMiles: 45,
    },
  ],
  NM: [
    {
      id: 'nm-white-sands',
      label: 'White Sands',
      position: { lat: 32.7797, lon: -106.1717 },
      radiusMiles: 85,
    },
    {
      id: 'nm-santa-fe',
      label: 'Santa Fe Plaza',
      position: { lat: 35.687, lon: -105.9378 },
      radiusMiles: 50,
    },
  ],
  NV: [
    {
      id: 'nv-las-vegas',
      label: 'Las Vegas Strip',
      position: { lat: 36.1147, lon: -115.1728 },
      radiusMiles: 45,
    },
    {
      id: 'nv-hoover-dam',
      label: 'Hoover Dam',
      position: { lat: 36.0161, lon: -114.7377 },
      radiusMiles: 50,
    },
  ],
  NY: [
    {
      id: 'ny-statue-of-liberty',
      label: 'Statue of Liberty / Lower Manhattan',
      position: { lat: 40.6892, lon: -74.0445 },
      radiusMiles: 45,
    },
    {
      id: 'ny-niagara-falls',
      label: 'Niagara Falls',
      position: { lat: 43.0962, lon: -79.0377 },
      radiusMiles: 50,
    },
  ],
  OH: [
    {
      id: 'oh-rock-hall',
      label: 'Rock & Roll Hall of Fame (Cleveland)',
      position: { lat: 41.5085, lon: -81.6954 },
      radiusMiles: 45,
    },
  ],
  OK: [
    {
      id: 'ok-bricktown',
      label: 'Bricktown (Oklahoma City)',
      position: { lat: 35.4676, lon: -97.5164 },
      radiusMiles: 45,
    },
  ],
  OR: [
    {
      id: 'or-columbia-gorge',
      label: 'Columbia River Gorge',
      position: { lat: 45.5762, lon: -122.1158 },
      radiusMiles: 55,
    },
    {
      id: 'or-crater-lake',
      label: 'Crater Lake',
      position: { lat: 42.9446, lon: -122.109 },
      radiusMiles: 95,
    },
  ],
  PA: [
    {
      id: 'pa-liberty-bell',
      label: 'Liberty Bell (Philadelphia)',
      position: { lat: 39.9496, lon: -75.1503 },
      radiusMiles: 45,
    },
    {
      id: 'pa-gettysburg',
      label: 'Gettysburg',
      position: { lat: 39.8309, lon: -77.2311 },
      radiusMiles: 50,
    },
  ],
  RI: [
    {
      id: 'ri-newport',
      label: 'Newport mansions',
      position: { lat: 41.4901, lon: -71.3128 },
      radiusMiles: 40,
    },
  ],
  SC: [
    {
      id: 'sc-charleston',
      label: 'Charleston historic district',
      position: { lat: 32.7765, lon: -79.9311 },
      radiusMiles: 50,
    },
    {
      id: 'sc-myrtle-beach',
      label: 'Myrtle Beach',
      position: { lat: 33.6891, lon: -78.8867 },
      radiusMiles: 50,
    },
  ],
  SD: [
    {
      id: 'sd-mount-rushmore',
      label: 'Mount Rushmore / Black Hills',
      position: { lat: 43.8791, lon: -103.4591 },
      radiusMiles: 90,
    },
    {
      id: 'sd-badlands',
      label: 'Badlands',
      position: { lat: 43.8554, lon: -102.3397 },
      radiusMiles: 85,
    },
  ],
  TN: [
    {
      id: 'tn-smokies',
      label: 'Great Smoky Mountains (Gatlinburg)',
      position: { lat: 35.7086, lon: -83.5227 },
      radiusMiles: 60,
    },
    {
      id: 'tn-nashville',
      label: 'Broadway (Nashville)',
      position: { lat: 36.1627, lon: -86.7816 },
      radiusMiles: 45,
    },
    {
      id: 'tn-graceland',
      label: 'Graceland (Memphis)',
      position: { lat: 35.0477, lon: -90.026 },
      radiusMiles: 45,
    },
  ],
  TX: [
    {
      id: 'tx-alamo',
      label: 'The Alamo (San Antonio)',
      position: { lat: 29.4259, lon: -98.4861 },
      radiusMiles: 35,
    },
    {
      id: 'tx-space-center',
      label: 'Space Center Houston',
      position: { lat: 29.5519, lon: -95.091 },
      radiusMiles: 50,
    },
    {
      id: 'tx-stockyards',
      label: 'Fort Worth Stockyards',
      position: { lat: 32.7891, lon: -97.3463 },
      radiusMiles: 45,
    },
  ],
  UT: [
    {
      id: 'ut-zion',
      label: 'Zion',
      position: { lat: 37.2982, lon: -113.0263 },
      radiusMiles: 85,
    },
    {
      id: 'ut-arches',
      label: 'Arches / Moab',
      position: { lat: 38.7331, lon: -109.5925 },
      radiusMiles: 85,
    },
    {
      id: 'ut-bonneville',
      label: 'Bonneville Salt Flats',
      position: { lat: 40.7969, lon: -113.8622 },
      radiusMiles: 85,
    },
  ],
  VA: [
    {
      id: 'va-shenandoah',
      label: 'Shenandoah / Skyline Drive',
      position: { lat: 38.4755, lon: -78.4535 },
      radiusMiles: 70,
    },
    {
      id: 'va-williamsburg',
      label: 'Colonial Williamsburg',
      position: { lat: 37.2707, lon: -76.7075 },
      radiusMiles: 50,
    },
  ],
  VT: [
    {
      id: 'vt-green-mountains',
      label: 'Green Mountains / Stowe',
      position: { lat: 44.4654, lon: -72.6874 },
      radiusMiles: 65,
    },
  ],
  WA: [
    {
      id: 'wa-pike-place',
      label: 'Pike Place Market (Seattle)',
      position: { lat: 47.6097, lon: -122.3422 },
      radiusMiles: 45,
    },
    {
      id: 'wa-mount-rainier',
      label: 'Mount Rainier gateway',
      position: { lat: 46.7924, lon: -121.7361 },
      radiusMiles: 75,
    },
  ],
  WI: [
    {
      id: 'wi-dells',
      label: 'Wisconsin Dells',
      position: { lat: 43.6275, lon: -89.771 },
      radiusMiles: 55,
    },
    {
      id: 'wi-door-county',
      label: 'Door County',
      position: { lat: 45.0153, lon: -87.265 },
      radiusMiles: 85,
    },
  ],
  WV: [
    {
      id: 'wv-new-river-gorge',
      label: 'New River Gorge',
      position: { lat: 37.9393, lon: -81.0676 },
      radiusMiles: 70,
    },
    {
      id: 'wv-harpers-ferry',
      label: 'Harpers Ferry',
      position: { lat: 39.3254, lon: -77.7397 },
      radiusMiles: 45,
    },
  ],
  WY: [
    {
      id: 'wy-yellowstone',
      label: 'Yellowstone gateway',
      position: { lat: 44.428, lon: -110.5885 },
      radiusMiles: 120,
    },
    {
      id: 'wy-grand-teton',
      label: 'Grand Teton (Jackson)',
      position: { lat: 43.4799, lon: -110.7624 },
      radiusMiles: 95,
    },
    {
      id: 'wy-devils-tower',
      label: 'Devils Tower',
      position: { lat: 44.5902, lon: -104.7146 },
      radiusMiles: 85,
    },
  ],
}
