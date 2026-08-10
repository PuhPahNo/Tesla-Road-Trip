import { readFile, writeFile } from 'node:fs/promises'
import { bestBookingProperty } from './research-booking-snapshots.mjs'

const HOTEL_FILE = new URL('../src/data/hotelRecommendations.json', import.meta.url)
const BOOKING_FILE = new URL('./data/booking-day-snapshots.json', import.meta.url)
const GEOCODE_FILE = new URL('./data/hotel-geocodes.json', import.meta.url)
const TARGET_OPTIONS = 5
const MIN_OPTIONS = 3
const MAX_DISTANCE_MILES = 65

const LUXURY = [
  'alila',
  'bellagio',
  'cavallo point',
  'cosmopolitan',
  'encore',
  'fairmont',
  'four seasons',
  'ritz-carlton',
  'st. regis',
  'venetian',
  'waldorf astoria',
  'wynn',
]
const UPSCALE = [
  'autograph collection',
  'caesars palace',
  'curio collection',
  'doubletree',
  'embassy suites',
  'grand hyatt',
  'hilton',
  'hyatt centric',
  'hyatt regency',
  'intercontinental',
  'kimpton',
  'marriott',
  'omni',
  'renaissance',
  'sheraton',
  'tapestry collection',
  'westin',
]
const PREMIUM = [
  'ac hotel',
  'aloft',
  'courtyard',
  'crowne plaza',
  'drury',
  'element',
  'homewood suites',
  'hotel indigo',
  'hyatt house',
  'hyatt place',
  'limelight',
  'residence inn',
  'springhill suites',
]
const REPUTABLE = [
  'best western',
  'comfort inn',
  'fairfield',
  'hampton',
  'holiday inn express',
  'la quinta',
  'towneplace suites',
  'tru by hilton',
]
const BASIC = [
  'days inn',
  'econo lodge',
  'motel 6',
  'quality inn',
  'red roof',
  'rodeway',
  'super 8',
  'travelodge',
  'woodspring',
]

function normalize(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replaceAll('&', 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function presentation(name) {
  const value = normalize(name)
  const matches = (brands) => brands.some((brand) => value.includes(brand))
  if (matches(LUXURY)) return { tier: 'luxury', tierLabel: 'Luxury', score: 44 }
  if (matches(UPSCALE)) return { tier: 'upscale', tierLabel: 'Higher end', score: 36 }
  if (matches(PREMIUM)) return { tier: 'premium', tierLabel: 'Premium select', score: 28 }
  if (matches(REPUTABLE)) return { tier: 'reputable', tierLabel: 'Reputable', score: 20 }
  if (matches(BASIC)) return { tier: 'basic', tierLabel: 'Practical', score: 5 }
  const isUnique = /(hotel|inn|lodge|resort|ranch|historic|house)/i.test(name)
  return isUnique
    ? { tier: 'unique', tierLabel: 'Unique stay', score: 31 }
    : { tier: 'independent', tierLabel: 'Independent', score: 14 }
}

function haversineMiles(a, b) {
  const radians = (value) => (value * Math.PI) / 180
  const dLat = radians(b.lat - a.lat)
  const dLon = radians(b.lon - a.lon)
  const lat1 = radians(a.lat)
  const lat2 = radians(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return 3958.8 * 2 * Math.asin(Math.sqrt(h))
}

function mapsUrl(name, position) {
  const params = new URLSearchParams({
    api: '1',
    query: `${name} ${position.lat},${position.lon}`,
  })
  return `https://www.google.com/maps/search/?${params}`
}

function bookingSourceKey(property) {
  try {
    const slug = new URL(property.propertyUrl).pathname.split('/').at(-1)
    if (slug) return `booking-${slug.replace(/\.html$/, '')}`
  } catch {
    // Fall through to the normalized property name.
  }
  return `booking-${normalize(property.name).replaceAll(' ', '-')}`
}

function shouldUseProperty(property) {
  if (!property.nightlyUsd || !property.photoUrl || !property.propertyUrl) return false
  return !/(apartment|backpacker|campground|hostel|private room|vacation home|villa)/i.test(
    property.name,
  )
}

function currentMatch(property, recommendations) {
  return recommendations
    .filter((hotel) => !hotel.sourceKey.startsWith('booking-'))
    .map((hotel) => ({
      hotel,
      match: bestBookingProperty(hotel.name, [property]),
    }))
    .filter((candidate) => candidate.match?.score >= 70)
    .sort((a, b) => b.match.score - a.match.score)[0]?.hotel
}

function curatedMatch(property, day) {
  if (day.day !== 73 || !/read house/i.test(property.name)) return undefined
  return {
    sourceKey: 'curated-read-house',
    name: 'The Read House',
    tier: 'unique',
    tierLabel: 'Unique stay',
    isUnique: true,
    curatorNote:
      'Anthony-style pick · historic Jazz Age landmark with a polished, higher-end feel.',
    position: { lat: 35.0461746, lon: -85.3110951 },
    address: '107 W MLK Blvd Chattanooga TN 37402',
    evCharging: { status: 'unverified' },
    officialUrl: 'https://www.thereadhousehotel.com/hotel/',
  }
}

function geocodeKey(property, day) {
  return `v2:${normalize(`${property.name}:${day.station.city}:${day.station.state}`)}`
}

async function geocodeProperty(property, day, cache) {
  const key = geocodeKey(property, day)
  if (key in cache) return cache[key]
  const query = new URLSearchParams({
    q: `${property.name}, ${day.station.city}, ${day.station.state}, USA`,
    limit: '8',
    lat: String(day.station.position.lat),
    lon: String(day.station.position.lon),
  })
  try {
    const response = await fetch(`https://photon.komoot.io/api/?${query}`, {
      headers: { 'User-Agent': 'ChargeQuest hotel planning research' },
      signal: AbortSignal.timeout(15000),
    })
    if (!response.ok) throw new Error(`${response.status}`)
    const payload = await response.json()
    const choices = payload.features
      .map((feature) => {
        const [lon, lat] = feature.geometry?.coordinates ?? []
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
        const position = { lat, lon }
        const nameMatch = bestBookingProperty(property.name, [
          { name: feature.properties?.name ?? '' },
        ])
        if (!nameMatch) return null
        return {
          position,
          distance: haversineMiles(day.station.position, position),
          properties: feature.properties ?? {},
          nameScore: nameMatch.score,
        }
      })
      .filter(Boolean)
      .filter((choice) =>
        ['us', 'usa', 'united states'].includes(
          String(choice.properties.countrycode ?? choice.properties.country ?? '')
            .toLowerCase(),
        ),
      )
      .sort((a, b) => b.nameScore - a.nameScore || a.distance - b.distance)
    const match = choices[0]
    if (!match || match.distance > MAX_DISTANCE_MILES) {
      cache[key] = null
      return null
    }
    const details = {
      position: match.position,
      address: [
        match.properties.housenumber,
        match.properties.street,
        match.properties.city ?? match.properties.town ?? match.properties.village,
        match.properties.state,
        match.properties.postcode,
      ]
        .filter(Boolean)
        .join(' '),
    }
    cache[key] = details
    return details
  } catch {
    cache[key] = null
    return null
  }
}

async function mapLimit(items, concurrency, worker) {
  const output = new Array(items.length)
  let cursor = 0
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (cursor < items.length) {
        const index = cursor
        cursor += 1
        output[index] = await worker(items[index], index)
      }
    }),
  )
  return output
}

const data = JSON.parse(await readFile(HOTEL_FILE, 'utf8'))
const booking = JSON.parse(await readFile(BOOKING_FILE, 'utf8'))
let geocodes = {}
try {
  geocodes = JSON.parse(await readFile(GEOCODE_FILE, 'utf8'))
  geocodes = Object.fromEntries(
    Object.entries(geocodes).filter(([key]) => key.startsWith('v2:')),
  )
} catch {
  // The first rebuild creates the generated geocode cache.
}

const dayCandidates = data.days.map((day) => {
  const snapshot = booking.days[day.day]
  const properties = (snapshot?.properties ?? [])
    .filter(shouldUseProperty)
    .map((property, index) => {
      const existing =
        currentMatch(property, day.recommendations) ?? curatedMatch(property, day)
      const quality = presentation(property.name)
      return { property, existing, quality, resultIndex: index }
    })
    .sort(
      (a, b) =>
        b.quality.score - a.quality.score || a.resultIndex - b.resultIndex,
    )
    .slice(0, 10)
  return { day, snapshot, properties }
})

const geocodeWork = []
const seenGeocodes = new Set()
for (const item of dayCandidates) {
  for (const candidate of item.properties) {
    if (candidate.existing) continue
    const key = geocodeKey(candidate.property, item.day)
    if (seenGeocodes.has(key) || key in geocodes) continue
    seenGeocodes.add(key)
    geocodeWork.push({ candidate, day: item.day })
  }
}

let completed = 0
await mapLimit(geocodeWork, 4, async ({ candidate, day }) => {
  await geocodeProperty(candidate.property, day, geocodes)
  completed += 1
  if (completed % 25 === 0 || completed === geocodeWork.length) {
    console.error(`geocoded ${completed}/${geocodeWork.length} Booking properties`)
  }
})
await writeFile(GEOCODE_FILE, `${JSON.stringify(geocodes, null, 2)}\n`)

for (const item of dayCandidates) {
  const { day, snapshot } = item
  const nextStop = day.nextStation
  const directToNext = nextStop
    ? haversineMiles(day.station.position, nextStop.position)
    : 0
  const enriched = []
  for (const candidate of item.properties) {
    const { property, existing, quality } = candidate
    const location = existing
      ? { position: existing.position, address: existing.address }
      : geocodes[geocodeKey(property, day)]
    if (!location) continue
    const distance = haversineMiles(day.station.position, location.position)
    if (distance > MAX_DISTANCE_MILES) continue
    const detour = nextStop
      ? Math.max(
          0,
          distance + haversineMiles(location.position, nextStop.position) - directToNext,
        )
      : distance
    enriched.push({
      sourceKey: existing?.sourceKey ?? bookingSourceKey(property),
      name: property.name,
      brand: existing?.brand,
      tier: quality.tier,
      tierLabel: quality.tierLabel,
      isUnique: existing?.isUnique ?? quality.tier === 'unique',
      curatorNote: existing?.curatorNote,
      position: location.position,
      address: location.address,
      distanceFromSuperchargerMiles: Number(distance.toFixed(1)),
      routeDetourMiles: Number(detour.toFixed(1)),
      evCharging: existing?.evCharging ?? { status: 'unverified' },
      officialUrl: existing?.officialUrl,
      bookingUrl: property.propertyUrl,
      mapsUrl: mapsUrl(property.name, location.position),
      photoUrl: property.photoUrl,
      photoSource: 'Booking.com',
      rateSnapshot: {
        provider: 'Booking.com',
        availability: 'available',
        nightlyUsd: property.nightlyUsd,
        observedAt: snapshot?.observedAt ?? booking.researchedAt,
      },
      _score:
        quality.score +
        (existing?.curatorNote ? 80 : 0) +
        (existing?.evCharging.status === 'nearby' ? 12 : 0) -
        Math.min(32, distance * 0.8) -
        Math.min(24, detour * 0.45),
    })
  }

  enriched.sort((a, b) => b._score - a._score)
  const selected = []
  const names = new Set()
  const identities = new Set()
  for (const hotel of enriched) {
    const name = normalize(hotel.name)
    const identity = `${hotel.position.lat.toFixed(4)}:${hotel.position.lon.toFixed(4)}`
    if (names.has(name) || identities.has(identity)) continue
    const { _score, ...recommendation } = hotel
    selected.push(recommendation)
    names.add(name)
    identities.add(identity)
    if (selected.length >= TARGET_OPTIONS) break
  }

  for (const existing of day.recommendations) {
    if (selected.length >= MIN_OPTIONS) break
    if (existing.sourceKey.startsWith('booking-')) continue
    if (names.has(normalize(existing.name))) continue
    const identity = `${existing.position.lat.toFixed(4)}:${existing.position.lon.toFixed(4)}`
    if (identities.has(identity)) continue
    const { estimatedNightlyUsd: _estimate, ...fallback } = existing
    selected.push({
      ...fallback,
      rateSnapshot: {
        provider: 'Booking.com',
        availability: 'not_found',
        nightlyUsd: null,
        observedAt: snapshot?.observedAt ?? booking.researchedAt,
      },
    })
    names.add(normalize(existing.name))
    identities.add(identity)
  }
  day.recommendations = selected
}

data.bookingResearchedAt = booking.researchedAt
data.sources.prices =
  'Booking.com dated rate snapshot for one adult, one room, one night; taxes and fees may be excluded'
data.sources.photos =
  'Booking.com property result image matched to the same dated listing'
await writeFile(HOTEL_FILE, `${JSON.stringify(data, null, 2)}\n`)

const all = data.days.flatMap((day) => day.recommendations)
console.log(
  JSON.stringify(
    {
      nights: data.days.length,
      recommendations: all.length,
      priced: all.filter((hotel) => hotel.rateSnapshot?.nightlyUsd).length,
      photos: all.filter((hotel) => hotel.photoUrl).length,
      minPerNight: Math.min(...data.days.map((day) => day.recommendations.length)),
      maxPerNight: Math.max(...data.days.map((day) => day.recommendations.length)),
      nightsWithThreePrices: data.days.filter(
        (day) => day.recommendations.filter((hotel) => hotel.rateSnapshot?.nightlyUsd).length >= 3,
      ).length,
    },
    null,
    2,
  ),
)
