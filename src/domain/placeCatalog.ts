import type { Coordinate, RouteWaypoint } from './types'

export type CatalogPlaceType = 'city' | 'landmark'

export type PlaceCategory =
  | 'metro'
  | 'capital'
  | 'national-park'
  | 'state-park'
  | 'history'
  | 'civil-rights'
  | 'culture'
  | 'music'
  | 'sports'
  | 'entertainment'
  | 'science'
  | 'coast'
  | 'scenic'
  | 'roadside'
  | 'theme-park'
  | 'food'

export interface PlaceCatalogEntry {
  id: string
  type: CatalogPlaceType
  label: string
  state: string
  position: Coordinate
  radiusMiles: number
  categories: PlaceCategory[]
  priority: number
  signature?: boolean
}

export const PLACE_CATEGORY_LABELS: Record<PlaceCategory, string> = {
  metro: 'Cities',
  capital: 'Capitals',
  'national-park': 'National parks',
  'state-park': 'State parks',
  history: 'History',
  'civil-rights': 'Civil rights',
  culture: 'Culture',
  music: 'Music',
  sports: 'Sports',
  entertainment: 'Entertainment',
  science: 'Science',
  coast: 'Coasts',
  scenic: 'Scenic',
  roadside: 'Roadside',
  'theme-park': 'Theme parks',
  food: 'Food',
}

export const PLACE_CATEGORY_OPTIONS = Object.entries(PLACE_CATEGORY_LABELS).map(
  ([value, label]) => ({ value: value as PlaceCategory, label }),
)

function city(
  id: string,
  label: string,
  state: string,
  lat: number,
  lon: number,
  categories: PlaceCategory[] = ['metro'],
  priority = 70,
  radiusMiles = 45,
  signature = false,
): PlaceCatalogEntry {
  return {
    id: `city-${id}`,
    type: 'city',
    label,
    state,
    position: { lat, lon },
    radiusMiles,
    categories,
    priority,
    ...(signature ? { signature } : {}),
  }
}

function landmark(
  id: string,
  label: string,
  state: string,
  lat: number,
  lon: number,
  categories: PlaceCategory[],
  priority = 78,
  radiusMiles = 55,
  signature = false,
): PlaceCatalogEntry {
  return {
    id: `landmark-${id}`,
    type: 'landmark',
    label,
    state,
    position: { lat, lon },
    radiusMiles,
    categories,
    priority,
    ...(signature ? { signature } : {}),
  }
}

export const PLACE_CATALOG: PlaceCatalogEntry[] = [
  city('birmingham', 'Birmingham', 'AL', 33.5186, -86.8104, ['metro', 'civil-rights'], 80, 42, true),
  city('huntsville', 'Huntsville', 'AL', 34.7304, -86.5861, ['metro', 'science'], 76),
  city('montgomery', 'Montgomery', 'AL', 32.3668, -86.3, ['capital', 'civil-rights', 'history'], 80),
  city('mobile', 'Mobile', 'AL', 30.6954, -88.0399, ['metro', 'coast', 'history'], 74),
  landmark('al-space-rocket-center', 'U.S. Space & Rocket Center (Huntsville)', 'AL', 34.7104, -86.6528, ['science', 'culture'], 86, 45, true),
  landmark('al-birmingham-civil-rights', 'Birmingham Civil Rights Institute', 'AL', 33.5162, -86.8146, ['civil-rights', 'history'], 88, 35, true),
  landmark('al-edmund-pettus-bridge', 'Edmund Pettus Bridge (Selma)', 'AL', 32.4076, -87.0184, ['civil-rights', 'history'], 86, 40, true),
  landmark('al-uss-alabama', 'USS Alabama / Mobile Bay', 'AL', 30.6818, -88.0145, ['history', 'coast'], 80, 45, true),
  landmark('al-legacy-museum', 'The Legacy Museum (Montgomery)', 'AL', 32.3824, -86.3127, ['civil-rights', 'history'], 88, 35),

  city('phoenix', 'Phoenix', 'AZ', 33.4484, -112.074, ['metro', 'capital', 'scenic'], 78, 55),
  city('tucson', 'Tucson', 'AZ', 32.2226, -110.9747, ['metro', 'scenic', 'food'], 76),
  city('flagstaff', 'Flagstaff', 'AZ', 35.1983, -111.6513, ['metro', 'scenic'], 78, 45, true),
  city('sedona', 'Sedona', 'AZ', 34.8697, -111.7609, ['scenic', 'culture'], 88, 55, true),
  landmark('az-grand-canyon', 'Grand Canyon', 'AZ', 36.1069, -112.1129, ['national-park', 'scenic'], 99, 95, true),
  landmark('az-saguaro', 'Saguaro National Park', 'AZ', 32.2967, -111.1666, ['national-park', 'scenic'], 88, 70, true),
  landmark('az-monument-valley', 'Monument Valley', 'AZ', 36.998, -110.0985, ['scenic', 'culture'], 92, 90, true),
  landmark('az-horseshoe-bend', 'Horseshoe Bend / Page', 'AZ', 36.8791, -111.5104, ['scenic'], 90, 70),
  landmark('az-lowell-observatory', 'Lowell Observatory (Flagstaff)', 'AZ', 35.2029, -111.6647, ['science', 'history'], 80, 35),

  city('little-rock', 'Little Rock', 'AR', 34.7465, -92.2896, ['capital', 'history'], 72),
  city('hot-springs', 'Hot Springs', 'AR', 34.5037, -93.0552, ['history', 'scenic'], 78, 45, true),
  city('fayetteville', 'Fayetteville', 'AR', 36.0626, -94.1574, ['metro', 'culture'], 70),
  city('bentonville', 'Bentonville', 'AR', 36.3729, -94.2088, ['culture', 'food'], 72),
  landmark('ar-hot-springs', 'Hot Springs National Park', 'AR', 34.5217, -93.0424, ['national-park', 'history'], 86, 50, true),
  landmark('ar-crystal-bridges', 'Crystal Bridges Museum of American Art', 'AR', 36.3816, -94.2031, ['culture'], 80, 40, true),
  landmark('ar-buffalo-river', 'Buffalo National River', 'AR', 35.9855, -92.7577, ['scenic', 'state-park'], 84, 75, true),
  landmark('ar-little-rock-central-high', 'Little Rock Central High School NHS', 'AR', 34.7367, -92.2994, ['civil-rights', 'history'], 86, 35),

  city('los-angeles', 'Los Angeles', 'CA', 34.0522, -118.2437, ['metro', 'entertainment', 'coast'], 86, 55, true),
  city('san-francisco', 'San Francisco Bay Area', 'CA', 37.7749, -122.4194, ['metro', 'coast', 'culture'], 93, 55, true),
  city('san-diego', 'San Diego', 'CA', 32.7157, -117.1611, ['metro', 'coast'], 84, 50),
  city('sacramento', 'Sacramento', 'CA', 38.5816, -121.4944, ['capital', 'history'], 72),
  city('monterey', 'Monterey', 'CA', 36.6002, -121.8947, ['coast', 'history', 'scenic'], 84, 45),
  city('palm-springs', 'Palm Springs', 'CA', 33.8303, -116.5453, ['scenic', 'culture'], 78),
  landmark('ca-santa-monica-pier', 'Santa Monica Pier', 'CA', 34.0100, -118.4962, ['coast', 'culture', 'roadside'], 90, 35, true),
  landmark('ca-tesla-diner', 'Tesla Diner (Hollywood)', 'CA', 34.0908, -118.3440, ['food', 'entertainment', 'roadside'], 90, 25, true),
  landmark('ca-tesla-oasis', 'Tesla Oasis (Lost Hills)', 'CA', 35.6163, -119.6943, ['roadside', 'science'], 88, 30, true),
  landmark('ca-hollywood-walk-of-fame', 'Hollywood Walk of Fame (Los Angeles)', 'CA', 34.1016, -118.3267, ['entertainment', 'culture'], 86, 35, true),
  landmark('ca-golden-gate', 'Golden Gate / San Francisco', 'CA', 37.8199, -122.4783, ['coast', 'scenic', 'history'], 93, 50, true),
  landmark('ca-yosemite', 'Yosemite gateway', 'CA', 37.8651, -119.5383, ['national-park', 'scenic'], 98, 90, true),
  landmark('ca-disneyland', 'Disneyland Resort', 'CA', 33.8121, -117.919, ['theme-park', 'entertainment'], 82, 40),
  landmark('ca-big-sur', 'Big Sur Coast', 'CA', 36.2704, -121.8081, ['coast', 'scenic'], 92, 75, true),
  landmark('ca-redwood', 'Redwood National and State Parks', 'CA', 41.2132, -124.0046, ['national-park', 'scenic'], 94, 95, true),
  landmark('ca-joshua-tree', 'Joshua Tree National Park', 'CA', 33.8734, -115.901, ['national-park', 'scenic'], 90, 80),
  landmark('ca-lake-tahoe', 'Lake Tahoe', 'CA', 39.0968, -120.0324, ['scenic'], 90, 75),

  city('denver', 'Denver', 'CO', 39.7392, -104.9903, ['metro', 'capital', 'scenic'], 87, 55, true),
  city('colorado-springs', 'Colorado Springs', 'CO', 38.8339, -104.8214, ['metro', 'scenic'], 82),
  city('boulder', 'Boulder', 'CO', 40.015, -105.2705, ['scenic', 'culture'], 80),
  city('aspen', 'Aspen', 'CO', 39.1911, -106.8175, ['scenic', 'culture'], 78, 55),
  city('durango', 'Durango', 'CO', 37.2753, -107.8801, ['scenic', 'history'], 80, 55),
  landmark('co-rocky-mountain', 'Rocky Mountain National Park', 'CO', 40.3428, -105.6836, ['national-park', 'scenic'], 96, 80, true),
  landmark('co-garden-of-the-gods', 'Garden of the Gods / Pikes Peak', 'CO', 38.8784, -104.8698, ['scenic', 'state-park'], 90, 50, true),
  landmark('co-mesa-verde', 'Mesa Verde National Park', 'CO', 37.2309, -108.4618, ['national-park', 'history', 'culture'], 90, 75, true),
  landmark('co-great-sand-dunes', 'Great Sand Dunes National Park', 'CO', 37.7916, -105.5943, ['national-park', 'scenic'], 88, 80),
  landmark('co-red-rocks', 'Red Rocks Amphitheatre', 'CO', 39.6654, -105.2057, ['music', 'scenic'], 84, 45),

  city('hartford', 'Hartford', 'CT', 41.7658, -72.6734, ['capital', 'history'], 70),
  city('new-haven', 'New Haven', 'CT', 41.3083, -72.9279, ['culture', 'food'], 74, 40),
  city('mystic', 'Mystic', 'CT', 41.3543, -71.9665, ['coast', 'history'], 78, 45, true),
  city('stamford', 'Stamford', 'CT', 41.0534, -73.5387, ['metro', 'coast'], 68),
  landmark('ct-mystic-seaport', 'Mystic Seaport Museum', 'CT', 41.3623, -71.9662, ['history', 'coast'], 82, 45, true),
  landmark('ct-yale', 'Yale University / New Haven Green', 'CT', 41.3111, -72.9279, ['culture', 'history'], 80, 35, true),
  landmark('ct-mark-twain-house', 'Mark Twain House', 'CT', 41.7671, -72.7019, ['history', 'culture'], 78, 35),
  landmark('ct-gillette-castle', 'Gillette Castle State Park', 'CT', 41.424, -72.4292, ['state-park', 'history', 'scenic'], 76, 45),

  city('wilmington', 'Wilmington', 'DE', 39.7391, -75.5398, ['metro', 'history'], 68),
  city('dover', 'Dover', 'DE', 39.1582, -75.5244, ['capital', 'history'], 68),
  city('rehoboth-beach', 'Rehoboth Beach', 'DE', 38.7209, -75.076, ['coast', 'food'], 76, 45, true),
  landmark('de-rehoboth-boardwalk', 'Rehoboth Beach Boardwalk', 'DE', 38.7168, -75.076, ['coast', 'roadside'], 78, 45, true),
  landmark('de-winterthur', 'Winterthur Museum and Gardens', 'DE', 39.8078, -75.6099, ['culture', 'history'], 76, 35, true),
  landmark('de-first-state', 'First State National Historical Park', 'DE', 39.8307, -75.5638, ['history'], 74, 45),
  landmark('de-hagley', 'Hagley Museum', 'DE', 39.7732, -75.5783, ['history', 'science'], 72, 35),

  city('washington-dc', 'Washington, DC', 'DC', 38.9072, -77.0369, ['capital', 'history', 'culture'], 92, 35, true),
  landmark('dc-national-mall', 'National Mall', 'DC', 38.8895, -77.0353, ['history', 'culture'], 95, 35, true),
  landmark('dc-smithsonian', 'Smithsonian Museums', 'DC', 38.8888, -77.026, ['culture', 'science'], 90, 30, true),
  landmark('dc-lincoln-memorial', 'Lincoln Memorial', 'DC', 38.8893, -77.0502, ['history'], 92, 30),
  landmark('dc-us-capitol', 'U.S. Capitol', 'DC', 38.8899, -77.0091, ['history'], 90, 30),
  landmark('dc-mlk-memorial', 'Martin Luther King Jr. Memorial', 'DC', 38.8862, -77.0442, ['civil-rights', 'history'], 90, 30),

  city('miami', 'Miami', 'FL', 25.7617, -80.1918, ['metro', 'coast', 'culture'], 84, 50, true),
  city('orlando', 'Orlando', 'FL', 28.5383, -81.3792, ['metro', 'theme-park'], 82, 50, true),
  city('tampa', 'Tampa', 'FL', 27.9506, -82.4572, ['metro', 'coast'], 78),
  city('jacksonville', 'Jacksonville', 'FL', 30.3322, -81.6557, ['metro', 'coast'], 72),
  city('st-augustine', 'St. Augustine', 'FL', 29.9012, -81.3124, ['history', 'coast'], 82, 45),
  city('key-west', 'Key West', 'FL', 24.5551, -81.78, ['coast', 'culture'], 84, 80),
  landmark('fl-space-coast', 'Kennedy Space Center', 'FL', 28.5729, -80.649, ['science', 'coast'], 88, 55, true),
  landmark('fl-disney', 'Walt Disney World (Orlando)', 'FL', 28.3852, -81.5639, ['theme-park', 'entertainment'], 88, 50, true),
  landmark('fl-south-beach', 'South Beach (Miami)', 'FL', 25.7907, -80.13, ['coast', 'culture'], 84, 45, true),
  landmark('fl-everglades', 'Everglades National Park', 'FL', 25.2866, -80.8987, ['national-park', 'scenic'], 90, 90, true),
  landmark('fl-st-augustine-historic', 'St. Augustine Historic District', 'FL', 29.8947, -81.3145, ['history', 'coast'], 84, 45),
  landmark('fl-key-west', 'Key West / Southernmost Point', 'FL', 24.5465, -81.7975, ['coast', 'roadside'], 84, 85),

  city('atlanta', 'Atlanta', 'GA', 33.749, -84.388, ['metro', 'civil-rights', 'culture'], 84, 50, true),
  city('savannah', 'Savannah', 'GA', 32.0809, -81.0912, ['history', 'coast', 'food'], 86, 45, true),
  city('augusta', 'Augusta', 'GA', 33.4735, -82.0105, ['sports', 'history'], 70),
  city('macon', 'Macon', 'GA', 32.8407, -83.6324, ['music', 'history'], 70),
  landmark('ga-mlk-nhs', 'Martin Luther King Jr. National Historical Park', 'GA', 33.7552, -84.3725, ['civil-rights', 'history'], 90, 35, true),
  landmark('ga-savannah-historic', 'Savannah Historic District', 'GA', 32.0809, -81.0912, ['history', 'coast'], 86, 45, true),
  landmark('ga-georgia-aquarium', 'Georgia Aquarium / Centennial Park', 'GA', 33.7634, -84.3951, ['culture', 'science'], 78, 35),
  landmark('ga-augusta-national', 'Augusta National Golf Club', 'GA', 33.503, -82.02, ['sports'], 78, 35),
  landmark('ga-okefenokee', 'Okefenokee Swamp', 'GA', 30.7366, -82.1401, ['scenic', 'state-park'], 82, 75),

  city('boise', 'Boise', 'ID', 43.615, -116.2023, ['capital', 'scenic'], 74, 45, true),
  city('coeur-dalene', "Coeur d'Alene", 'ID', 47.6777, -116.7805, ['scenic', 'coast'], 78, 45),
  city('idaho-falls', 'Idaho Falls', 'ID', 43.4927, -112.0408, ['metro', 'scenic'], 72),
  city('sun-valley', 'Sun Valley', 'ID', 43.6971, -114.3517, ['scenic', 'culture'], 80, 80, true),
  landmark('id-shoshone-falls', 'Shoshone Falls', 'ID', 42.5947, -114.4009, ['scenic'], 84, 55, true),
  landmark('id-craters-of-the-moon', 'Craters of the Moon National Monument', 'ID', 43.4167, -113.5167, ['scenic', 'history'], 82, 85, true),
  landmark('id-sawtooth', 'Sawtooth / Sun Valley', 'ID', 43.6971, -114.3517, ['scenic'], 86, 80, true),
  landmark('id-lake-coeur-dalene', "Lake Coeur d'Alene", 'ID', 47.6735, -116.7811, ['scenic', 'coast'], 80, 45),

  city('chicago', 'Chicago', 'IL', 41.8781, -87.6298, ['metro', 'food', 'culture'], 90, 45, true),
  city('springfield', 'Springfield', 'IL', 39.7817, -89.6501, ['capital', 'history'], 72),
  city('galena', 'Galena', 'IL', 42.4167, -90.429, ['history', 'scenic'], 74),
  city('champaign', 'Champaign', 'IL', 40.1164, -88.2434, ['metro', 'culture'], 68),
  landmark('il-millennium-park', 'Millennium Park (Chicago)', 'IL', 41.8826, -87.6226, ['culture', 'metro'], 86, 45, true),
  landmark('il-route-66-begin', 'Route 66 Begin Sign (Chicago)', 'IL', 41.8788, -87.6277, ['roadside', 'history'], 78, 35),
  landmark('il-lincoln-library', 'Abraham Lincoln Presidential Library', 'IL', 39.801, -89.6476, ['history', 'culture'], 82, 35, true),
  landmark('il-starved-rock', 'Starved Rock State Park', 'IL', 41.3125, -88.9969, ['state-park', 'scenic'], 78, 55),
  landmark('il-cahokia-mounds', 'Cahokia Mounds', 'IL', 38.6544, -90.0618, ['history', 'culture'], 84, 45, true),

  city('indianapolis', 'Indianapolis', 'IN', 39.7684, -86.1581, ['capital', 'sports'], 80, 45, true),
  city('south-bend', 'South Bend', 'IN', 41.6764, -86.252, ['sports', 'culture'], 72),
  city('bloomington', 'Bloomington', 'IN', 39.1653, -86.5264, ['culture', 'food'], 70),
  city('fort-wayne', 'Fort Wayne', 'IN', 41.0793, -85.1394, ['metro'], 68),
  landmark('in-indy-speedway', 'Indianapolis Motor Speedway', 'IN', 39.7954, -86.2353, ['sports', 'history'], 86, 45, true),
  landmark('in-indiana-dunes', 'Indiana Dunes National Park', 'IN', 41.6533, -87.0524, ['national-park', 'coast'], 84, 60, true),
  landmark('in-notre-dame', 'University of Notre Dame', 'IN', 41.7056, -86.2353, ['sports', 'culture'], 78, 35),
  landmark('in-brown-county', 'Brown County State Park', 'IN', 39.1831, -86.2164, ['state-park', 'scenic'], 76, 55),

  city('des-moines', 'Des Moines', 'IA', 41.5868, -93.625, ['capital', 'metro'], 72, 45, true),
  city('iowa-city', 'Iowa City', 'IA', 41.6611, -91.5302, ['culture', 'history'], 70),
  city('cedar-rapids', 'Cedar Rapids', 'IA', 41.9779, -91.6656, ['metro'], 68),
  city('dubuque', 'Dubuque', 'IA', 42.5006, -90.6646, ['history', 'scenic'], 72),
  landmark('ia-field-of-dreams', 'Field of Dreams (Dyersville)', 'IA', 42.4972, -91.0554, ['sports', 'culture'], 80, 65, true),
  landmark('ia-state-capitol', 'Iowa State Capitol', 'IA', 41.5912, -93.6037, ['history', 'capital'], 74, 35, true),
  landmark('ia-effigy-mounds', 'Effigy Mounds National Monument', 'IA', 43.0833, -91.1833, ['history', 'scenic'], 78, 60),
  landmark('ia-amana-colonies', 'Amana Colonies', 'IA', 41.8, -91.868, ['history', 'food'], 74, 45),

  city('wichita', 'Wichita', 'KS', 37.6872, -97.3301, ['metro'], 70, 45),
  city('topeka', 'Topeka', 'KS', 39.0473, -95.6752, ['capital', 'history'], 70),
  city('lawrence', 'Lawrence', 'KS', 38.9717, -95.2353, ['culture', 'food'], 72),
  city('kansas-city-ks', 'Kansas City, KS', 'KS', 39.1142, -94.6275, ['metro', 'food'], 72),
  landmark('ks-monument-rocks', 'Monument Rocks', 'KS', 38.792, -100.7626, ['scenic', 'roadside'], 78, 85, true),
  landmark('ks-tallgrass', 'Tallgrass Prairie National Preserve', 'KS', 38.4332, -96.558, ['scenic', 'history'], 82, 70, true),
  landmark('ks-eisenhower-library', 'Eisenhower Presidential Library', 'KS', 38.9108, -97.2139, ['history'], 78, 45),
  landmark('ks-cosmosphere', 'Cosmosphere (Hutchinson)', 'KS', 38.0655, -97.9173, ['science', 'culture'], 78, 45),
  landmark('ks-brown-v-board', 'Brown v. Board of Education NHS', 'KS', 39.0377, -95.6767, ['civil-rights', 'history'], 84, 35, true),

  city('louisville', 'Louisville', 'KY', 38.2527, -85.7585, ['metro', 'food', 'sports'], 80, 45, true),
  city('lexington', 'Lexington', 'KY', 38.0406, -84.5037, ['sports', 'culture'], 74),
  city('bowling-green', 'Bowling Green', 'KY', 36.9685, -86.4808, ['culture', 'history'], 70),
  city('paducah', 'Paducah', 'KY', 37.0834, -88.6001, ['culture', 'history'], 68),
  landmark('ky-mammoth-cave', 'Mammoth Cave National Park', 'KY', 37.1862, -86.1005, ['national-park', 'scenic'], 88, 55, true),
  landmark('ky-churchill-downs', 'Churchill Downs', 'KY', 38.2029, -85.7702, ['sports', 'history'], 82, 35, true),
  landmark('ky-bourbon-trail', 'Bourbon Trail (Louisville)', 'KY', 38.2527, -85.7585, ['food', 'culture'], 80, 45),
  landmark('ky-muhammad-ali-center', 'Muhammad Ali Center', 'KY', 38.2576, -85.7604, ['sports', 'culture', 'civil-rights'], 80, 35),
  landmark('ky-cumberland-falls', 'Cumberland Falls State Resort Park', 'KY', 36.8381, -84.3452, ['state-park', 'scenic'], 78, 60),

  city('new-orleans', 'New Orleans', 'LA', 29.9511, -90.0715, ['metro', 'music', 'food'], 90, 45, true),
  city('baton-rouge', 'Baton Rouge', 'LA', 30.4515, -91.1871, ['capital', 'history'], 70),
  city('lafayette', 'Lafayette', 'LA', 30.2241, -92.0198, ['music', 'food', 'culture'], 74),
  city('shreveport', 'Shreveport', 'LA', 32.5252, -93.7502, ['metro'], 68),
  landmark('la-french-quarter', 'French Quarter (New Orleans)', 'LA', 29.9584, -90.0644, ['music', 'food', 'history'], 90, 45, true),
  landmark('la-wwii-museum', 'National WWII Museum', 'LA', 29.943, -90.0703, ['history', 'culture'], 86, 35, true),
  landmark('la-avery-island', 'Avery Island / TABASCO', 'LA', 29.9036, -91.9108, ['food', 'culture'], 76, 55),
  landmark('la-oak-alley', 'Oak Alley Plantation', 'LA', 30.0059, -90.7797, ['history', 'scenic'], 76, 45),
  landmark('la-poverty-point', 'Poverty Point World Heritage Site', 'LA', 32.6367, -91.4098, ['history', 'culture'], 82, 60, true),

  city('portland-me', 'Portland', 'ME', 43.6591, -70.2568, ['coast', 'food'], 82, 45, true),
  city('bar-harbor', 'Bar Harbor', 'ME', 44.3876, -68.2039, ['coast', 'scenic'], 86, 80, true),
  city('bangor', 'Bangor', 'ME', 44.8016, -68.7712, ['metro', 'culture'], 68),
  city('kennebunkport', 'Kennebunkport', 'ME', 43.3618, -70.4767, ['coast', 'food'], 74),
  landmark('me-acadia', 'Acadia / Bar Harbor', 'ME', 44.3386, -68.2733, ['national-park', 'coast', 'scenic'], 94, 95, true),
  landmark('me-portland-head-light', 'Portland Head Light', 'ME', 43.6231, -70.2079, ['coast', 'history'], 82, 45, true),
  landmark('me-baxter', 'Baxter State Park / Katahdin', 'ME', 45.9044, -68.9213, ['state-park', 'scenic'], 86, 100),
  landmark('me-ll-bean', 'L.L.Bean Flagship (Freeport)', 'ME', 43.8572, -70.1031, ['roadside', 'culture'], 72, 40),

  city('baltimore', 'Baltimore', 'MD', 39.2904, -76.6122, ['metro', 'history', 'coast'], 78, 45),
  city('annapolis', 'Annapolis', 'MD', 38.9784, -76.4922, ['capital', 'coast', 'history'], 80, 45, true),
  city('frederick', 'Frederick', 'MD', 39.4143, -77.4105, ['history', 'food'], 70),
  city('ocean-city', 'Ocean City', 'MD', 38.3365, -75.0849, ['coast', 'roadside'], 76, 50),
  landmark('md-fort-mchenry', 'Fort McHenry', 'MD', 39.2631, -76.5794, ['history', 'coast'], 82, 40, true),
  landmark('md-annapolis-chesapeake', 'Annapolis / Chesapeake Bay', 'MD', 38.9784, -76.4922, ['history', 'coast'], 80, 45, true),
  landmark('md-antietam', 'Antietam National Battlefield', 'MD', 39.467, -77.738, ['history'], 80, 50),
  landmark('md-assateague', 'Assateague Island', 'MD', 38.0559, -75.2452, ['coast', 'scenic'], 82, 65),

  city('boston', 'Boston', 'MA', 42.3601, -71.0589, ['metro', 'history', 'culture'], 90, 45, true),
  city('salem', 'Salem', 'MA', 42.5195, -70.8967, ['history', 'coast'], 78, 40),
  city('cape-cod', 'Cape Cod', 'MA', 41.6688, -70.2962, ['coast', 'scenic'], 84, 60, true),
  city('worcester', 'Worcester', 'MA', 42.2626, -71.8023, ['metro'], 68),
  landmark('ma-freedom-trail', 'Freedom Trail (Boston)', 'MA', 42.3601, -71.0589, ['history'], 90, 45, true),
  landmark('ma-fenway-park', 'Fenway Park', 'MA', 42.3467, -71.0972, ['sports', 'history'], 84, 35),
  landmark('ma-plimoth-patuxet', 'Plimoth Patuxet Museums', 'MA', 41.9389, -70.6252, ['history', 'culture'], 78, 45),
  landmark('ma-harvard-square', 'Harvard Square', 'MA', 42.3734, -71.1189, ['culture', 'history'], 80, 35),
  landmark('ma-cape-cod-seashore', 'Cape Cod National Seashore', 'MA', 41.957, -70.0086, ['coast', 'national-park'], 86, 70, true),
  landmark('ma-salem-witch-museum', 'Salem Witch Museum', 'MA', 42.5225, -70.8911, ['history', 'culture'], 76, 35),

  city('detroit', 'Detroit', 'MI', 42.3314, -83.0458, ['metro', 'music', 'history'], 80, 45, true),
  city('ann-arbor', 'Ann Arbor', 'MI', 42.2808, -83.743, ['culture', 'food'], 72),
  city('grand-rapids', 'Grand Rapids', 'MI', 42.9634, -85.6681, ['metro', 'culture'], 72),
  city('traverse-city', 'Traverse City', 'MI', 44.7631, -85.6206, ['coast', 'food', 'scenic'], 78, 50),
  city('mackinaw-city', 'Mackinaw City', 'MI', 45.7775, -84.7278, ['coast', 'history'], 76, 55, true),
  landmark('mi-henry-ford', 'The Henry Ford Museum', 'MI', 42.303, -83.234, ['history', 'science'], 84, 40, true),
  landmark('mi-mackinac-island', 'Mackinac Island', 'MI', 45.8492, -84.6189, ['history', 'coast'], 84, 65, true),
  landmark('mi-sleeping-bear', 'Sleeping Bear Dunes', 'MI', 44.8804, -86.0467, ['scenic', 'coast'], 88, 75),
  landmark('mi-pictured-rocks', 'Pictured Rocks National Lakeshore', 'MI', 46.5646, -86.3162, ['coast', 'scenic'], 86, 95),
  landmark('mi-motown-museum', 'Motown Museum', 'MI', 42.3642, -83.0888, ['music', 'culture'], 82, 35),

  city('minneapolis', 'Minneapolis', 'MN', 44.9778, -93.265, ['metro', 'culture'], 82, 45, true),
  city('duluth', 'Duluth', 'MN', 46.7867, -92.1005, ['coast', 'scenic'], 78, 55),
  city('rochester-mn', 'Rochester', 'MN', 44.0121, -92.4802, ['metro'], 68),
  city('mankato', 'Mankato', 'MN', 44.1636, -93.9994, ['metro', 'scenic'], 66),
  landmark('mn-mall-of-america', 'Mall of America', 'MN', 44.8549, -93.2422, ['entertainment', 'roadside'], 78, 40, true),
  landmark('mn-boundary-waters', 'Boundary Waters Canoe Area', 'MN', 47.8807, -91.8671, ['scenic'], 86, 100, true),
  landmark('mn-split-rock', 'Split Rock Lighthouse', 'MN', 47.2004, -91.3671, ['coast', 'history', 'scenic'], 82, 65),
  landmark('mn-voyageurs', 'Voyageurs National Park', 'MN', 48.4839, -92.8386, ['national-park', 'scenic'], 84, 100),
  landmark('mn-paisley-park', 'Paisley Park', 'MN', 44.8629, -93.5629, ['music', 'culture'], 80, 40),

  city('jackson-ms', 'Jackson', 'MS', 32.2988, -90.1848, ['capital', 'civil-rights'], 72, 45, true),
  city('oxford', 'Oxford', 'MS', 34.3665, -89.5192, ['culture', 'food'], 70),
  city('natchez', 'Natchez', 'MS', 31.5604, -91.4032, ['history', 'scenic'], 76, 45),
  city('biloxi', 'Biloxi', 'MS', 30.396, -88.8853, ['coast', 'food'], 74),
  landmark('ms-vicksburg', 'Vicksburg National Military Park', 'MS', 32.345, -90.8512, ['history'], 82, 55, true),
  landmark('ms-natchez-trace', 'Natchez Trace Parkway', 'MS', 32.3113, -90.0718, ['scenic', 'history'], 82, 75, true),
  landmark('ms-bb-king', 'B.B. King Museum', 'MS', 33.4504, -90.6488, ['music', 'culture'], 78, 45),
  landmark('ms-elvis-birthplace', 'Elvis Presley Birthplace (Tupelo)', 'MS', 34.2576, -88.7034, ['music', 'culture'], 78, 45),
  landmark('ms-gulf-islands', 'Gulf Islands National Seashore', 'MS', 30.39, -88.931, ['coast', 'scenic'], 80, 70),

  city('st-louis', 'St. Louis', 'MO', 38.627, -90.1994, ['metro', 'history', 'sports'], 82, 45, true),
  city('kansas-city-mo', 'Kansas City', 'MO', 39.0997, -94.5786, ['metro', 'food', 'music'], 80, 45),
  city('branson', 'Branson', 'MO', 36.6437, -93.2185, ['entertainment', 'music'], 72, 45),
  city('springfield-mo', 'Springfield', 'MO', 37.209, -93.2923, ['metro', 'roadside'], 68),
  landmark('mo-gateway-arch', 'Gateway Arch', 'MO', 38.6247, -90.1848, ['history', 'scenic'], 84, 35, true),
  landmark('mo-wwi-museum', 'National WWI Museum and Memorial', 'MO', 39.0806, -94.5861, ['history', 'culture'], 84, 40, true),
  landmark('mo-mark-twain', 'Mark Twain Boyhood Home', 'MO', 39.7084, -91.3573, ['history', 'culture'], 76, 50),
  landmark('mo-lake-of-the-ozarks', 'Lake of the Ozarks', 'MO', 38.1986, -92.6388, ['scenic', 'coast'], 76, 65),
  landmark('mo-wilsons-creek', "Wilson's Creek National Battlefield", 'MO', 37.1167, -93.42, ['history'], 74, 45),

  city('billings', 'Billings', 'MT', 45.7833, -108.5007, ['metro', 'scenic'], 72),
  city('bozeman', 'Bozeman', 'MT', 45.677, -111.0429, ['scenic', 'culture'], 78, 55, true),
  city('missoula', 'Missoula', 'MT', 46.8721, -113.994, ['scenic', 'culture'], 76, 55),
  city('whitefish', 'Whitefish', 'MT', 48.4111, -114.3376, ['scenic', 'coast'], 78, 65),
  landmark('mt-glacier', 'Glacier National Park', 'MT', 48.7596, -113.787, ['national-park', 'scenic'], 96, 110, true),
  landmark('mt-little-bighorn', 'Little Bighorn Battlefield', 'MT', 45.5706, -107.4275, ['history'], 80, 55, true),
  landmark('mt-yellowstone-north', 'Yellowstone North Gateway (Gardiner)', 'MT', 45.0319, -110.7058, ['national-park', 'scenic'], 90, 100, true),
  landmark('mt-going-to-the-sun', 'Going-to-the-Sun Road', 'MT', 48.6957, -113.7183, ['scenic'], 94, 105),

  city('omaha', 'Omaha', 'NE', 41.2565, -95.9345, ['metro', 'food'], 74, 45, true),
  city('lincoln', 'Lincoln', 'NE', 40.8136, -96.7026, ['capital', 'culture'], 70),
  city('kearney', 'Kearney', 'NE', 40.6995, -99.0815, ['metro', 'roadside'], 68),
  city('scottsbluff', 'Scottsbluff', 'NE', 41.8666, -103.6672, ['history', 'scenic'], 70, 55),
  landmark('ne-chimney-rock', 'Chimney Rock', 'NE', 41.7033, -103.348, ['history', 'scenic'], 80, 70, true),
  landmark('ne-scotts-bluff', 'Scotts Bluff National Monument', 'NE', 41.8356, -103.7072, ['history', 'scenic'], 78, 65, true),
  landmark('ne-carhenge', 'Carhenge', 'NE', 42.142, -102.8586, ['roadside'], 74, 75),
  landmark('ne-sac-museum', 'Strategic Air Command & Aerospace Museum', 'NE', 41.017, -96.3201, ['science', 'history'], 76, 45),

  city('las-vegas', 'Las Vegas', 'NV', 36.1699, -115.1398, ['metro', 'entertainment', 'food'], 84, 45, true),
  city('reno', 'Reno', 'NV', 39.5296, -119.8138, ['metro', 'scenic'], 74, 45),
  city('carson-city', 'Carson City', 'NV', 39.1638, -119.7674, ['capital', 'history'], 70),
  city('virginia-city', 'Virginia City', 'NV', 39.3096, -119.6496, ['history', 'roadside'], 74, 40),
  landmark('nv-las-vegas-strip', 'Las Vegas Strip', 'NV', 36.1147, -115.1728, ['entertainment', 'roadside'], 86, 40, true),
  landmark('nv-hoover-dam', 'Hoover Dam', 'NV', 36.0161, -114.7377, ['history', 'science', 'scenic'], 84, 55, true),
  landmark('nv-valley-of-fire', 'Valley of Fire State Park', 'NV', 36.485, -114.532, ['state-park', 'scenic'], 88, 65, true),
  landmark('nv-great-basin', 'Great Basin National Park', 'NV', 38.9833, -114.3, ['national-park', 'scenic'], 86, 100),
  landmark('nv-lake-tahoe', 'Lake Tahoe Nevada Shore', 'NV', 39.0968, -119.939, ['scenic', 'coast'], 86, 65),

  city('manchester', 'Manchester', 'NH', 42.9956, -71.4548, ['metro'], 68),
  city('portsmouth', 'Portsmouth', 'NH', 43.0718, -70.7626, ['coast', 'history'], 76, 40),
  city('concord', 'Concord', 'NH', 43.2081, -71.5376, ['capital', 'history'], 68),
  city('north-conway', 'North Conway', 'NH', 44.0537, -71.1284, ['scenic'], 78, 55, true),
  landmark('nh-mount-washington', 'Mount Washington', 'NH', 44.2706, -71.3033, ['scenic'], 88, 80, true),
  landmark('nh-white-mountains', 'White Mountain National Forest', 'NH', 44.1484, -71.4018, ['scenic'], 88, 80, true),
  landmark('nh-strawbery-banke', 'Strawbery Banke (Portsmouth)', 'NH', 43.0753, -70.7545, ['history', 'coast'], 76, 40),
  landmark('nh-franconia-notch', 'Franconia Notch State Park', 'NH', 44.167, -71.686, ['state-park', 'scenic'], 84, 65),

  city('newark-jersey-city', 'Newark / Jersey City', 'NJ', 40.7357, -74.1724, ['metro', 'coast'], 76, 45, true),
  city('atlantic-city', 'Atlantic City', 'NJ', 39.3643, -74.4229, ['coast', 'entertainment'], 78, 45),
  city('princeton', 'Princeton', 'NJ', 40.3573, -74.6672, ['culture', 'history'], 76),
  city('cape-may', 'Cape May', 'NJ', 38.9351, -74.906, ['coast', 'history'], 78, 45),
  landmark('nj-liberty-state-park', 'Liberty State Park / Statue views', 'NJ', 40.7033, -74.0524, ['history', 'coast', 'scenic'], 84, 35, true),
  landmark('nj-atlantic-city-boardwalk', 'Atlantic City Boardwalk', 'NJ', 39.355, -74.4384, ['coast', 'roadside'], 78, 45, true),
  landmark('nj-princeton', 'Princeton University', 'NJ', 40.3431, -74.6551, ['culture', 'history'], 78, 35),
  landmark('nj-cape-may-lighthouse', 'Cape May Lighthouse', 'NJ', 38.933, -74.9616, ['coast', 'history'], 76, 45),
  landmark('nj-edison', 'Thomas Edison National Historical Park', 'NJ', 40.7854, -74.2387, ['history', 'science'], 78, 35),

  city('albuquerque', 'Albuquerque', 'NM', 35.0844, -106.6504, ['metro', 'culture', 'food'], 78, 50),
  city('santa-fe', 'Santa Fe', 'NM', 35.687, -105.9378, ['capital', 'culture', 'food'], 86, 45, true),
  city('taos', 'Taos', 'NM', 36.4072, -105.5731, ['culture', 'scenic'], 80, 55),
  city('las-cruces', 'Las Cruces', 'NM', 32.3199, -106.7637, ['metro', 'scenic'], 70),
  landmark('nm-white-sands', 'White Sands National Park', 'NM', 32.7797, -106.1717, ['national-park', 'scenic'], 90, 85, true),
  landmark('nm-carlsbad-caverns', 'Carlsbad Caverns National Park', 'NM', 32.1479, -104.5567, ['national-park', 'scenic'], 88, 85, true),
  landmark('nm-taos-pueblo', 'Taos Pueblo', 'NM', 36.4386, -105.5444, ['history', 'culture'], 86, 55, true),
  landmark('nm-bandelier', 'Bandelier National Monument', 'NM', 35.778, -106.2706, ['history', 'scenic'], 84, 65),
  landmark('nm-okeeffe-museum', "Georgia O'Keeffe Museum", 'NM', 35.6888, -105.938, ['culture'], 78, 35),

  city('new-york', 'New York City', 'NY', 40.7128, -74.006, ['metro', 'culture', 'food'], 94, 45, true),
  city('buffalo', 'Buffalo', 'NY', 42.8864, -78.8784, ['metro', 'food', 'coast'], 76, 45),
  city('rochester', 'Rochester', 'NY', 43.1566, -77.6088, ['metro', 'culture'], 70),
  city('albany', 'Albany', 'NY', 42.6526, -73.7562, ['capital', 'history'], 72),
  city('saratoga-springs', 'Saratoga Springs', 'NY', 43.0831, -73.7846, ['history', 'culture'], 74),
  city('ithaca', 'Ithaca', 'NY', 42.443, -76.5019, ['scenic', 'culture'], 74),
  landmark('ny-statue-of-liberty', 'Statue of Liberty / New York Harbor', 'NY', 40.6892, -74.0445, ['history', 'coast'], 94, 45, true),
  landmark('ny-times-square', 'Times Square', 'NY', 40.758, -73.9855, ['entertainment', 'culture'], 86, 35),
  landmark('ny-niagara-falls', 'Niagara Falls', 'NY', 43.0962, -79.0377, ['scenic', 'coast'], 92, 55, true),
  landmark('ny-adirondacks', 'Adirondack Park', 'NY', 44.1127, -74.2032, ['scenic', 'state-park'], 86, 100, true),
  landmark('ny-baseball-hall-of-fame', 'National Baseball Hall of Fame (Cooperstown)', 'NY', 42.7006, -74.923, ['sports', 'history'], 82, 60),
  landmark('ny-watkins-glen', 'Watkins Glen State Park', 'NY', 42.3709, -76.8855, ['state-park', 'scenic'], 84, 55),

  city('charlotte', 'Charlotte', 'NC', 35.2271, -80.8431, ['metro', 'sports'], 78, 45),
  city('asheville', 'Asheville', 'NC', 35.5951, -82.5515, ['scenic', 'food', 'culture'], 84, 55, true),
  city('raleigh', 'Raleigh', 'NC', 35.7796, -78.6382, ['capital', 'metro', 'culture'], 74),
  city('wilmington-nc', 'Wilmington', 'NC', 34.2104, -77.8868, ['coast', 'history'], 76),
  city('outer-banks', 'Outer Banks', 'NC', 35.5585, -75.4665, ['coast', 'scenic'], 82, 85),
  landmark('nc-biltmore', 'Biltmore Estate', 'NC', 35.5406, -82.5521, ['history', 'culture'], 84, 45, true),
  landmark('nc-smokies-gateway', 'Great Smoky Mountains gateway', 'NC', 35.6118, -83.4895, ['national-park', 'scenic'], 90, 85, true),
  landmark('nc-wright-brothers', 'Wright Brothers National Memorial', 'NC', 36.0182, -75.6713, ['history', 'science', 'coast'], 82, 80, true),
  landmark('nc-blue-ridge-parkway', 'Blue Ridge Parkway', 'NC', 35.5656, -82.486, ['scenic'], 88, 85),
  landmark('nc-outer-banks', 'Outer Banks / Cape Hatteras', 'NC', 35.249, -75.528, ['coast', 'scenic'], 84, 90),

  city('fargo', 'Fargo', 'ND', 46.8772, -96.7898, ['metro', 'culture'], 70, 45, true),
  city('bismarck', 'Bismarck', 'ND', 46.8083, -100.7837, ['capital', 'history'], 70),
  city('medora', 'Medora', 'ND', 46.9139, -103.5244, ['scenic', 'history'], 76, 65, true),
  city('grand-forks', 'Grand Forks', 'ND', 47.9253, -97.0329, ['metro'], 66),
  landmark('nd-theodore-roosevelt', 'Theodore Roosevelt National Park', 'ND', 46.979, -103.5387, ['national-park', 'scenic'], 88, 95, true),
  landmark('nd-enchanted-highway', 'Enchanted Highway', 'ND', 46.3667, -102.3333, ['roadside', 'scenic'], 74, 90, true),
  landmark('nd-fort-abraham-lincoln', 'Fort Abraham Lincoln State Park', 'ND', 46.7622, -100.846, ['history', 'state-park'], 76, 45),
  landmark('nd-fargo-theatre', 'Fargo Theatre', 'ND', 46.8773, -96.7892, ['culture', 'history'], 70, 35),

  city('cleveland', 'Cleveland', 'OH', 41.4993, -81.6944, ['metro', 'music', 'sports'], 80, 45, true),
  city('columbus', 'Columbus', 'OH', 39.9612, -82.9988, ['capital', 'metro', 'sports'], 76, 45),
  city('cincinnati', 'Cincinnati', 'OH', 39.1031, -84.512, ['metro', 'food', 'history'], 78, 45),
  city('canton', 'Canton', 'OH', 40.7989, -81.3784, ['sports', 'history'], 78, 40, true),
  city('dayton', 'Dayton', 'OH', 39.7589, -84.1916, ['science', 'history'], 74),
  landmark('oh-pro-football-hall-of-fame', 'Pro Football Hall of Fame (Canton)', 'OH', 40.8212, -81.3978, ['sports', 'history'], 86, 45, true),
  landmark('oh-rock-hall', 'Rock & Roll Hall of Fame (Cleveland)', 'OH', 41.5086, -81.6954, ['music', 'culture'], 84, 40, true),
  landmark('oh-air-force-museum', 'National Museum of the U.S. Air Force', 'OH', 39.7811, -84.1101, ['science', 'history'], 84, 45),
  landmark('oh-cedar-point', 'Cedar Point', 'OH', 41.4822, -82.6834, ['theme-park', 'coast'], 80, 55),
  landmark('oh-hocking-hills', 'Hocking Hills State Park', 'OH', 39.4266, -82.5493, ['state-park', 'scenic'], 82, 60, true),
  landmark('oh-cuyahoga-valley', 'Cuyahoga Valley National Park', 'OH', 41.2808, -81.5678, ['national-park', 'scenic'], 82, 55),

  city('oklahoma-city', 'Oklahoma City', 'OK', 35.4676, -97.5164, ['capital', 'history'], 76, 45, true),
  city('tulsa', 'Tulsa', 'OK', 36.154, -95.9928, ['metro', 'music', 'culture'], 76),
  city('norman', 'Norman', 'OK', 35.2226, -97.4395, ['culture', 'sports'], 68),
  city('lawton', 'Lawton', 'OK', 34.6036, -98.3959, ['metro', 'scenic'], 66),
  landmark('ok-okc-memorial', 'Oklahoma City National Memorial', 'OK', 35.4727, -97.5171, ['history'], 84, 35, true),
  landmark('ok-route-66-museum', 'Oklahoma Route 66 Museum', 'OK', 35.5156, -98.9675, ['roadside', 'history'], 76, 55, true),
  landmark('ok-philbrook', 'Philbrook Museum of Art', 'OK', 36.1236, -95.9706, ['culture'], 76, 35),
  landmark('ok-wichita-mountains', 'Wichita Mountains Wildlife Refuge', 'OK', 34.7442, -98.7139, ['scenic'], 82, 65, true),

  city('portland-or', 'Portland', 'OR', 45.5152, -122.6784, ['metro', 'food', 'culture'], 82, 45, true),
  city('bend', 'Bend', 'OR', 44.0582, -121.3153, ['scenic', 'food'], 78, 55),
  city('eugene', 'Eugene', 'OR', 44.0521, -123.0868, ['culture', 'scenic'], 72),
  city('astoria', 'Astoria', 'OR', 46.1879, -123.8313, ['coast', 'history'], 76, 50),
  city('ashland', 'Ashland', 'OR', 42.1946, -122.7095, ['culture', 'scenic'], 72),
  landmark('or-crater-lake', 'Crater Lake National Park', 'OR', 42.9446, -122.109, ['national-park', 'scenic'], 94, 95, true),
  landmark('or-columbia-gorge', 'Columbia River Gorge / Multnomah Falls', 'OR', 45.5775, -122.117, ['scenic'], 90, 65, true),
  landmark('or-cannon-beach', 'Cannon Beach / Haystack Rock', 'OR', 45.8848, -123.9677, ['coast', 'scenic'], 86, 65, true),
  landmark('or-mount-hood', 'Mount Hood', 'OR', 45.3735, -121.6959, ['scenic'], 88, 75),
  landmark('or-shakespeare', 'Oregon Shakespeare Festival', 'OR', 42.1946, -122.7095, ['culture'], 76, 40),

  city('philadelphia', 'Philadelphia', 'PA', 39.9526, -75.1652, ['metro', 'history', 'food'], 86, 45, true),
  city('pittsburgh', 'Pittsburgh', 'PA', 40.4406, -79.9959, ['metro', 'sports', 'history'], 80, 45),
  city('gettysburg', 'Gettysburg', 'PA', 39.8309, -77.2311, ['history'], 80, 45, true),
  city('lancaster', 'Lancaster', 'PA', 40.0379, -76.3055, ['history', 'food'], 72),
  city('erie', 'Erie', 'PA', 42.1292, -80.0851, ['coast'], 70),
  landmark('pa-independence-hall', 'Independence Hall', 'PA', 39.9489, -75.1503, ['history'], 90, 35, true),
  landmark('pa-gettysburg', 'Gettysburg National Military Park', 'PA', 39.8309, -77.2311, ['history'], 88, 50, true),
  landmark('pa-fallingwater', 'Fallingwater', 'PA', 39.9009, -79.4664, ['culture', 'scenic'], 82, 60),
  landmark('pa-hersheypark', 'Hersheypark', 'PA', 40.2888, -76.6536, ['theme-park', 'food'], 76, 45),
  landmark('pa-liberty-bell', 'Liberty Bell', 'PA', 39.9496, -75.1503, ['history'], 88, 35),
  landmark('pa-valley-forge', 'Valley Forge National Historical Park', 'PA', 40.1009, -75.4457, ['history'], 82, 45),

  city('providence', 'Providence', 'RI', 41.824, -71.4128, ['capital', 'food', 'culture'], 76, 35, true),
  city('newport', 'Newport', 'RI', 41.49, -71.3128, ['coast', 'history'], 82, 40, true),
  city('block-island', 'Block Island', 'RI', 41.1612, -71.5843, ['coast', 'scenic'], 76, 50),
  landmark('ri-newport-mansions', 'Newport Mansions', 'RI', 41.4665, -71.305, ['history', 'coast'], 84, 40, true),
  landmark('ri-block-island', 'Block Island', 'RI', 41.1612, -71.5843, ['coast', 'scenic'], 78, 55, true),
  landmark('ri-roger-williams-park', 'Roger Williams Park', 'RI', 41.785, -71.4181, ['culture', 'state-park'], 72, 35),
  landmark('ri-the-breakers', 'The Breakers (Newport)', 'RI', 41.4699, -71.2982, ['history', 'coast'], 82, 40),

  city('charleston', 'Charleston', 'SC', 32.7765, -79.9311, ['history', 'coast', 'food'], 86, 45, true),
  city('columbia-sc', 'Columbia', 'SC', 34.0007, -81.0348, ['capital', 'history'], 70),
  city('greenville', 'Greenville', 'SC', 34.8526, -82.394, ['food', 'scenic'], 74),
  city('myrtle-beach', 'Myrtle Beach', 'SC', 33.6891, -78.8867, ['coast', 'entertainment'], 76, 45),
  city('hilton-head', 'Hilton Head Island', 'SC', 32.2163, -80.7526, ['coast', 'scenic'], 78, 45),
  landmark('sc-fort-sumter', 'Fort Sumter', 'SC', 32.7523, -79.8747, ['history', 'coast'], 82, 45, true),
  landmark('sc-magnolia-plantation', 'Magnolia Plantation and Gardens', 'SC', 32.8755, -80.0848, ['history', 'scenic'], 78, 45),
  landmark('sc-congaree', 'Congaree National Park', 'SC', 33.7919, -80.7487, ['national-park', 'scenic'], 82, 70, true),
  landmark('sc-myrtle-boardwalk', 'Myrtle Beach Boardwalk', 'SC', 33.6891, -78.8867, ['coast', 'roadside'], 76, 45),
  landmark('sc-hilton-head', 'Hilton Head Island', 'SC', 32.2163, -80.7526, ['coast', 'scenic'], 78, 45),

  city('sioux-falls', 'Sioux Falls', 'SD', 43.5446, -96.7311, ['metro', 'scenic'], 72, 45),
  city('rapid-city', 'Rapid City', 'SD', 44.0805, -103.231, ['scenic', 'history'], 80, 55, true),
  city('deadwood', 'Deadwood', 'SD', 44.3767, -103.7296, ['history', 'roadside'], 76, 50),
  city('pierre', 'Pierre', 'SD', 44.3683, -100.351, ['capital', 'history'], 66),
  landmark('sd-mount-rushmore', 'Mount Rushmore / Black Hills', 'SD', 43.8791, -103.4591, ['history', 'scenic'], 88, 90, true),
  landmark('sd-badlands', 'Badlands National Park', 'SD', 43.8554, -102.3397, ['national-park', 'scenic'], 90, 90, true),
  landmark('sd-crazy-horse', 'Crazy Horse Memorial', 'SD', 43.8365, -103.6231, ['history', 'culture'], 80, 75),
  landmark('sd-custer-state-park', 'Custer State Park', 'SD', 43.7601, -103.4246, ['state-park', 'scenic'], 86, 80),
  landmark('sd-wall-drug', 'Wall Drug', 'SD', 43.9925, -102.2416, ['roadside'], 74, 55),
  landmark('sd-wind-cave', 'Wind Cave National Park', 'SD', 43.5724, -103.4416, ['national-park', 'scenic'], 82, 75),

  city('nashville', 'Nashville', 'TN', 36.1627, -86.7816, ['capital', 'music', 'food'], 86, 45, true),
  city('memphis', 'Memphis', 'TN', 35.1495, -90.049, ['music', 'civil-rights', 'food'], 86, 45, true),
  city('chattanooga', 'Chattanooga', 'TN', 35.0456, -85.3097, ['scenic', 'culture'], 78, 40),
  city('knoxville', 'Knoxville', 'TN', 35.9606, -83.9207, ['metro', 'scenic'], 72),
  city('gatlinburg', 'Gatlinburg', 'TN', 35.7143, -83.5102, ['scenic', 'entertainment'], 78, 60),
  landmark('tn-civil-rights-museum', 'National Civil Rights Museum (Memphis)', 'TN', 35.1345, -90.0576, ['civil-rights', 'history'], 92, 40, true),
  landmark('tn-great-smoky-mountains', 'Great Smoky Mountains National Park', 'TN', 35.6118, -83.4895, ['national-park', 'scenic'], 92, 85, true),
  landmark('tn-graceland', 'Graceland (Memphis)', 'TN', 35.0477, -90.026, ['music', 'culture'], 84, 40),
  landmark('tn-grand-ole-opry', 'Grand Ole Opry', 'TN', 36.2069, -86.6923, ['music', 'culture'], 84, 35, true),
  landmark('tn-country-music-hall', 'Country Music Hall of Fame', 'TN', 36.1583, -86.7761, ['music', 'culture'], 82, 35),
  landmark('tn-ruby-falls', 'Ruby Falls (Chattanooga)', 'TN', 35.0192, -85.3392, ['scenic', 'roadside'], 76, 35),

  city('dallas', 'Dallas', 'TX', 32.7767, -96.797, ['metro', 'food', 'sports'], 80, 50),
  city('austin', 'Austin', 'TX', 30.2672, -97.7431, ['capital', 'music', 'food'], 84, 45, true),
  city('san-antonio', 'San Antonio', 'TX', 29.4241, -98.4936, ['history', 'food'], 84, 45, true),
  city('houston', 'Houston', 'TX', 29.7604, -95.3698, ['metro', 'science', 'food'], 78, 50),
  city('fort-worth', 'Fort Worth', 'TX', 32.7555, -97.3308, ['metro', 'culture', 'sports'], 76),
  city('el-paso', 'El Paso', 'TX', 31.7619, -106.485, ['metro', 'scenic', 'food'], 74),
  city('amarillo', 'Amarillo', 'TX', 35.222, -101.8313, ['roadside', 'food'], 70),
  landmark('tx-alamo', 'The Alamo', 'TX', 29.4259, -98.4861, ['history'], 84, 30, true),
  landmark('tx-space-center-houston', 'Space Center Houston', 'TX', 29.5518, -95.0982, ['science', 'history'], 84, 45, true),
  landmark('tx-big-bend', 'Big Bend National Park', 'TX', 29.1275, -103.2425, ['national-park', 'scenic'], 90, 110, true),
  landmark('tx-fort-worth-stockyards', 'Fort Worth Stockyards', 'TX', 32.7881, -97.3486, ['history', 'food'], 78, 40),
  landmark('tx-palo-duro', 'Palo Duro Canyon', 'TX', 34.9376, -101.6596, ['state-park', 'scenic'], 84, 70),
  landmark('tx-uss-lexington', 'USS Lexington (Corpus Christi)', 'TX', 27.8159, -97.3897, ['history', 'coast'], 78, 60),

  city('salt-lake-city', 'Salt Lake City', 'UT', 40.7608, -111.891, ['capital', 'scenic'], 80, 50, true),
  city('moab', 'Moab', 'UT', 38.5733, -109.5498, ['scenic', 'food'], 88, 60, true),
  city('st-george', 'St. George', 'UT', 37.0965, -113.5684, ['scenic', 'metro'], 76, 55),
  city('park-city', 'Park City', 'UT', 40.6461, -111.498, ['scenic', 'culture'], 76),
  city('provo', 'Provo', 'UT', 40.2338, -111.6585, ['metro', 'scenic'], 70),
  landmark('ut-zion', 'Zion / southern Utah', 'UT', 37.2982, -113.0263, ['national-park', 'scenic'], 98, 85, true),
  landmark('ut-arches', 'Arches National Park', 'UT', 38.7331, -109.5925, ['national-park', 'scenic'], 94, 75, true),
  landmark('ut-bryce-canyon', 'Bryce Canyon National Park', 'UT', 37.593, -112.1871, ['national-park', 'scenic'], 92, 75, true),
  landmark('ut-canyonlands', 'Canyonlands National Park', 'UT', 38.3269, -109.8783, ['national-park', 'scenic'], 92, 85),
  landmark('ut-capitol-reef', 'Capitol Reef National Park', 'UT', 38.367, -111.2615, ['national-park', 'scenic'], 90, 85),
  landmark('ut-temple-square', 'Temple Square', 'UT', 40.7705, -111.8919, ['history', 'culture'], 76, 35),

  city('burlington', 'Burlington', 'VT', 44.4759, -73.2121, ['coast', 'food', 'culture'], 76, 45, true),
  city('montpelier', 'Montpelier', 'VT', 44.2601, -72.5754, ['capital', 'history'], 68),
  city('stowe', 'Stowe', 'VT', 44.4654, -72.6874, ['scenic', 'food'], 78, 45),
  city('woodstock-vt', 'Woodstock', 'VT', 43.6242, -72.518, ['history', 'scenic'], 74),
  landmark('vt-ben-jerrys', "Ben & Jerry's Factory", 'VT', 44.3543, -72.7401, ['food', 'roadside'], 74, 45, true),
  landmark('vt-shelburne-museum', 'Shelburne Museum', 'VT', 44.3781, -73.232, ['culture', 'history'], 76, 35, true),
  landmark('vt-quechee-gorge', 'Quechee Gorge', 'VT', 43.6466, -72.4185, ['scenic'], 76, 45),
  landmark('vt-green-mountains', 'Green Mountain Byway', 'VT', 44.4759, -72.6981, ['scenic'], 82, 70, true),

  city('richmond', 'Richmond', 'VA', 37.5407, -77.436, ['capital', 'history', 'food'], 76, 45),
  city('virginia-beach', 'Virginia Beach', 'VA', 36.8529, -75.978, ['coast', 'entertainment'], 76, 45),
  city('charlottesville', 'Charlottesville', 'VA', 38.0293, -78.4767, ['history', 'food'], 78, 45),
  city('alexandria', 'Alexandria', 'VA', 38.8048, -77.0469, ['history', 'coast'], 76, 35),
  city('williamsburg', 'Williamsburg', 'VA', 37.2707, -76.7075, ['history', 'culture'], 80, 45, true),
  landmark('va-shenandoah', 'Shenandoah National Park', 'VA', 38.2928, -78.6796, ['national-park', 'scenic'], 88, 80, true),
  landmark('va-colonial-williamsburg', 'Colonial Williamsburg', 'VA', 37.2707, -76.7075, ['history', 'culture'], 84, 45, true),
  landmark('va-monticello', 'Monticello', 'VA', 38.0086, -78.4532, ['history'], 82, 45),
  landmark('va-arlington', 'Arlington National Cemetery', 'VA', 38.8799, -77.0713, ['history'], 84, 35, true),
  landmark('va-mount-vernon', 'Mount Vernon', 'VA', 38.7079, -77.0861, ['history'], 82, 35),
  landmark('va-appomattox', 'Appomattox Court House', 'VA', 37.3779, -78.7975, ['history'], 78, 45),

  city('seattle', 'Seattle', 'WA', 47.6062, -122.3321, ['metro', 'coast', 'food'], 88, 55, true),
  city('spokane', 'Spokane', 'WA', 47.6588, -117.426, ['metro', 'scenic'], 72),
  city('tacoma', 'Tacoma', 'WA', 47.2529, -122.4443, ['coast', 'culture'], 72),
  city('vancouver-wa', 'Vancouver', 'WA', 45.628, -122.672, ['metro', 'scenic'], 68),
  city('leavenworth', 'Leavenworth', 'WA', 47.5962, -120.6615, ['scenic', 'food'], 76),
  landmark('wa-mount-rainier', 'Mount Rainier National Park', 'WA', 46.8523, -121.7603, ['national-park', 'scenic'], 94, 95, true),
  landmark('wa-olympic', 'Olympic National Park', 'WA', 47.8021, -123.6044, ['national-park', 'coast', 'scenic'], 94, 100, true),
  landmark('wa-pike-place', 'Pike Place Market', 'WA', 47.6097, -122.3425, ['food', 'culture'], 82, 40),
  landmark('wa-north-cascades', 'North Cascades National Park', 'WA', 48.7718, -121.2985, ['national-park', 'scenic'], 92, 100),
  landmark('wa-space-needle', 'Space Needle', 'WA', 47.6205, -122.3493, ['culture', 'science'], 80, 40),
  landmark('wa-san-juan-islands', 'San Juan Islands', 'WA', 48.5514, -123.0781, ['coast', 'scenic'], 86, 85),

  city('charleston-wv', 'Charleston', 'WV', 38.3498, -81.6326, ['capital', 'history'], 70, 45),
  city('morgantown', 'Morgantown', 'WV', 39.6295, -79.9559, ['culture', 'scenic'], 68),
  city('harpers-ferry', 'Harpers Ferry', 'WV', 39.3254, -77.7389, ['history', 'scenic'], 80, 45, true),
  city('fayetteville-wv', 'Fayetteville', 'WV', 38.0529, -81.1037, ['scenic', 'food'], 74),
  landmark('wv-new-river-gorge', 'New River Gorge National Park', 'WV', 38.0706, -81.0757, ['national-park', 'scenic'], 88, 75, true),
  landmark('wv-harpers-ferry', 'Harpers Ferry National Historical Park', 'WV', 39.3162, -77.7564, ['history', 'scenic'], 84, 45, true),
  landmark('wv-greenbrier', 'The Greenbrier', 'WV', 37.7865, -80.3033, ['history', 'culture'], 76, 55),
  landmark('wv-seneca-rocks', 'Seneca Rocks', 'WV', 38.8348, -79.3756, ['scenic'], 80, 65),

  city('milwaukee', 'Milwaukee', 'WI', 43.0389, -87.9065, ['metro', 'food', 'coast'], 78, 45),
  city('madison', 'Madison', 'WI', 43.0731, -89.4012, ['capital', 'food', 'culture'], 78, 45, true),
  city('green-bay', 'Green Bay', 'WI', 44.5133, -88.0133, ['sports', 'coast'], 76, 45, true),
  city('door-county', 'Door County', 'WI', 44.8342, -87.377, ['coast', 'food', 'scenic'], 78, 70),
  city('wisconsin-dells', 'Wisconsin Dells', 'WI', 43.6275, -89.7709, ['entertainment', 'roadside'], 74, 45),
  landmark('wi-lambeau-field', 'Lambeau Field', 'WI', 44.5013, -88.0622, ['sports', 'history'], 84, 45, true),
  landmark('wi-wisconsin-dells', 'Wisconsin Dells', 'WI', 43.6275, -89.7709, ['entertainment', 'scenic'], 76, 45, true),
  landmark('wi-apostle-islands', 'Apostle Islands National Lakeshore', 'WI', 46.965, -90.6646, ['coast', 'scenic'], 86, 90),
  landmark('wi-house-on-the-rock', 'House on the Rock', 'WI', 43.1007, -90.1365, ['roadside', 'culture'], 76, 45),
  landmark('wi-harley-museum', 'Harley-Davidson Museum', 'WI', 43.0315, -87.9168, ['history', 'culture'], 76, 35),

  city('cheyenne', 'Cheyenne', 'WY', 41.14, -104.8202, ['capital', 'history'], 70),
  city('jackson', 'Jackson', 'WY', 43.4799, -110.7624, ['scenic', 'food'], 84, 75, true),
  city('cody', 'Cody', 'WY', 44.5263, -109.0565, ['history', 'scenic'], 76, 60),
  city('casper', 'Casper', 'WY', 42.8666, -106.3131, ['metro', 'history'], 68),
  city('sheridan', 'Sheridan', 'WY', 44.7972, -106.9562, ['history', 'scenic'], 70),
  landmark('wy-yellowstone', 'Yellowstone gateway', 'WY', 44.428, -110.5885, ['national-park', 'scenic'], 97, 120, true),
  landmark('wy-grand-teton', 'Grand Teton National Park', 'WY', 43.7904, -110.6818, ['national-park', 'scenic'], 95, 95, true),
  landmark('wy-devils-tower', 'Devils Tower National Monument', 'WY', 44.5902, -104.7156, ['scenic', 'history'], 84, 75, true),
  landmark('wy-jackson-hole', 'Jackson Hole', 'WY', 43.4799, -110.7624, ['scenic', 'culture'], 86, 75),
  landmark('wy-fossil-butte', 'Fossil Butte National Monument', 'WY', 41.856, -110.762, ['history', 'scenic'], 76, 75),
]

const PLACE_CATALOG_BY_ID = new Map(PLACE_CATALOG.map((entry) => [entry.id, entry]))

export function getPlaceCatalogEntry(id: string) {
  return PLACE_CATALOG_BY_ID.get(id)
}

export function catalogEntryToWaypoint(entry: PlaceCatalogEntry): RouteWaypoint {
  return {
    id: entry.id,
    label: entry.label,
    position: entry.position,
    radiusMiles: entry.radiusMiles,
    reason: `Curated ${entry.type} stop from the ${entry.categories.map((category) => PLACE_CATEGORY_LABELS[category]).join(', ')} catalog.`,
  }
}

export function searchPlaceCatalog({
  query = '',
  state,
  type,
  category,
  limit = 20,
  excludeIds = new Set<string>(),
}: {
  query?: string
  state?: string
  type?: CatalogPlaceType
  category?: PlaceCategory
  limit?: number
  excludeIds?: Set<string>
}) {
  const normalized = query.trim().toLowerCase()
  const stateFilter = state?.trim().toUpperCase()

  return PLACE_CATALOG.filter((entry) => !excludeIds.has(entry.id))
    .filter((entry) => (stateFilter ? entry.state === stateFilter : true))
    .filter((entry) => (type ? entry.type === type : true))
    .filter((entry) => (category ? entry.categories.includes(category) : true))
    .filter((entry) =>
      normalized
        ? `${entry.label} ${entry.state} ${entry.type} ${entry.categories.join(' ')}`.toLowerCase().includes(normalized)
        : true,
    )
    .sort((a, b) => b.priority - a.priority || a.label.localeCompare(b.label))
    .slice(0, Math.max(1, Math.min(100, limit)))
}
