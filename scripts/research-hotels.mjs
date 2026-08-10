import { readFile, writeFile } from 'node:fs/promises'
import { bestBookingProperty } from './research-booking-snapshots.mjs'

const ROUTE_FILE = new URL('./data/2026-competition-stops.json', import.meta.url)
const BOOKING_FILE = new URL('./data/booking-day-snapshots.json', import.meta.url)
const OUTPUT_FILE = new URL('../src/data/hotelRecommendations.json', import.meta.url)
const SUPERCHARGE_INFO_URL =
  'https://supercharge.info/service/supercharge/allSites'
const OVERPASS_ENDPOINTS = [
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass-api.de/api/interpreter',
]
const RESEARCH_BATCH_SIZE = 3
const SEARCH_RADIUS_METERS = 24000
const FALLBACK_RADIUS_METERS = 52000
const TARGET_OPTIONS = 5
const MIN_OPTIONS = 3

const UPSCALE_BRANDS = [
  'andaz',
  'autograph collection',
  'canopy',
  'curio collection',
  'doubletree',
  'embassy suites',
  'fairmont',
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
  'thompson',
  'tribute portfolio',
  'viceroy',
  'westin',
]
const LUXURY_BRANDS = [
  '1 hotel',
  'alila',
  'aman',
  'auberge',
  'four seasons',
  'luxury collection',
  'mandarin oriental',
  'montage',
  'park hyatt',
  'ritz-carlton',
  'rosewood',
  'st. regis',
  'waldorf astoria',
]
const PREMIUM_BRANDS = [
  'ac hotel',
  'aloft',
  'courtyard',
  'crowne plaza',
  'delta hotels',
  'element',
  'homewood suites',
  'hotel indigo',
  'hyatt house',
  'hyatt place',
  'residence inn',
  'springhill suites',
]
const REPUTABLE_BRANDS = [
  'best western',
  'comfort inn',
  'fairfield inn',
  'hampton',
  'holiday inn express',
  'la quinta',
  'towneplace suites',
]
const LOW_PRIORITY_BRANDS = [
  'americas best value',
  'days inn',
  'econo lodge',
  'motel 6',
  'quality inn',
  'red roof',
  'rodeway inn',
  'super 8',
  'travelodge',
  'woodspring suites',
]

function normalize(value) {
  return String(value ?? '')
    .toLowerCase()
    .replaceAll('&', 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function stationAddress(site) {
  return [
    site.address?.street,
    site.address?.city,
    [site.address?.state, site.address?.zip].filter(Boolean).join(' '),
  ]
    .filter(Boolean)
    .join(', ')
}

function haversineMiles(a, b) {
  const toRad = (value) => (value * Math.PI) / 180
  const earthRadiusMiles = 3958.8
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lon - a.lon)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return 2 * earthRadiusMiles * Math.asin(Math.sqrt(h))
}

function hotelPosition(element) {
  const lat = element.lat ?? element.center?.lat
  const lon = element.lon ?? element.center?.lon
  return Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon } : undefined
}

function hotelWebsite(tags) {
  const value = tags.website ?? tags['contact:website'] ?? tags.url
  return typeof value === 'string' && /^https?:\/\//i.test(value)
    ? value
    : undefined
}

function hotelIdentityName(name) {
  const normalized = normalize(name)
  if (
    normalized === 'ventana inn and spa' ||
    normalized === 'alila ventana big sur'
  ) {
    return 'alila ventana big sur'
  }
  return normalized
}

function photoUrl(tags) {
  const value = tags.image ?? tags['wikimedia_commons']
  return typeof value === 'string' && /^https?:\/\//i.test(value)
    ? value
    : undefined
}

function qualityPresentation(name, brand, tags) {
  const haystack = normalize(`${name} ${brand}`)
  const stars = Number.parseFloat(tags.stars ?? '')
  const matches = (items) => items.some((item) => haystack.includes(item))
  if (matches(LUXURY_BRANDS) || stars >= 4.5) {
    return { tier: 'luxury', label: 'Luxury', score: 44 }
  }
  if (matches(UPSCALE_BRANDS) || stars >= 4) {
    return { tier: 'upscale', label: 'Higher end', score: 36 }
  }
  if (matches(PREMIUM_BRANDS) || stars >= 3.5) {
    return { tier: 'premium', label: 'Premium select', score: 28 }
  }
  if (matches(REPUTABLE_BRANDS) || stars >= 3) {
    return { tier: 'reputable', label: 'Reputable', score: 20 }
  }
  if (matches(LOW_PRIORITY_BRANDS) || tags.tourism === 'motel') {
    return { tier: 'basic', label: 'Practical', score: 5 }
  }
  const unique =
    !brand &&
    /(hotel|inn|lodge|resort|ranch|cabins|historic|house|casino)/i.test(name)
  return unique
    ? { tier: 'unique', label: 'Unique stay', score: 31 }
    : { tier: 'independent', label: 'Independent', score: 14 }
}

function bookingUrl(name, city, state, checkIn, checkOut) {
  const params = new URLSearchParams({
    ss: `${name}, ${city}, ${state}`,
    checkin: checkIn,
    checkout: checkOut,
    group_adults: '1',
    no_rooms: '1',
    group_children: '0',
  })
  return `https://www.booking.com/searchresults.html?${params}`
}

function mapsUrl(name, position) {
  const params = new URLSearchParams({
    api: '1',
    query: `${name} ${position.lat},${position.lon}`,
  })
  return `https://www.google.com/maps/search/?${params}`
}

function curatedHotelsForStop(stop, bookingDay) {
  if (stop.day !== 73) return []
  const name = 'The Read House'
  const position = { lat: 35.0461746, lon: -85.3110951 }
  const booking = bestBookingProperty(name, bookingDay?.properties)
  return [
    {
      sourceKey: 'curated-read-house',
      name,
      tier: 'unique',
      tierLabel: 'Unique stay',
      isUnique: true,
      curatorNote:
        'Anthony-style pick · historic Jazz Age landmark with a polished, higher-end feel.',
      position,
      address: '107 W MLK Blvd Chattanooga TN 37402',
      distanceFromSuperchargerMiles: Number(
        haversineMiles(stop.position, position).toFixed(1),
      ),
      routeDetourMiles: Number(
        haversineMiles(stop.position, position).toFixed(1),
      ),
      evCharging: { status: 'unverified' },
      officialUrl: 'https://www.thereadhousehotel.com/hotel/',
      bookingUrl:
        booking?.propertyUrl ??
        bookingUrl(
          name,
          stop.city,
          stop.state,
          stop.date,
          addDays(stop.date, 1),
        ),
      mapsUrl: mapsUrl(name, position),
      photoUrl: booking?.photoUrl ?? undefined,
      photoSource: booking?.photoUrl ? 'Booking.com' : undefined,
      rateSnapshot: {
        provider: 'Booking.com',
        availability: booking?.nightlyUsd
          ? 'available'
          : booking
            ? 'unavailable'
            : 'not_found',
        nightlyUsd: booking?.nightlyUsd ?? null,
        observedAt: bookingDay?.observedAt ?? null,
      },
      score: 120 + (booking?.nightlyUsd ? 20 : 0),
    },
  ]
}

function addDays(date, amount) {
  const value = new Date(`${date}T12:00:00Z`)
  value.setUTCDate(value.getUTCDate() + amount)
  return value.toISOString().slice(0, 10)
}

async function fetchJson(url, init) {
  const response = await fetch(url, init)
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
  return response.json()
}

async function fetchOverpass(query) {
  let lastError
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      return await fetchJson(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          'User-Agent': 'ChargeQuest hotel planning research',
        },
        body: new URLSearchParams({ data: query }),
        signal: AbortSignal.timeout(90000),
      })
    } catch (error) {
      lastError = error
    }
  }
  throw lastError
}

function overpassQuery(stops, radiusMeters, includeChargers) {
  const clauses = stops.flatMap((stop) => [
    `nwr(around:${radiusMeters},${stop.position.lat},${stop.position.lon})[tourism~"hotel|motel|guest_house"];`,
    ...(includeChargers
      ? [
          `nwr(around:${radiusMeters},${stop.position.lat},${stop.position.lon})[amenity=charging_station];`,
        ]
      : []),
  ])
  return `[out:json][timeout:80];(${clauses.join('')});out center tags;`
}

function dedupeHotels(elements) {
  const byIdentity = new Map()
  for (const element of elements) {
    const tags = element.tags ?? {}
    const position = hotelPosition(element)
    const name = String(tags.name ?? '').trim()
    if (!name || !position) continue
    const key = `${hotelIdentityName(name)}:${position.lat.toFixed(2)}:${position.lon.toFixed(2)}`
    const existing = byIdentity.get(key)
    if (!existing || Object.keys(tags).length > Object.keys(existing.tags ?? {}).length) {
      byIdentity.set(key, element)
    }
  }
  return [...byIdentity.values()]
}

async function researchBatch(stops, radiusMeters, includeChargers = true) {
  const payload = await fetchOverpass(
    overpassQuery(stops, radiusMeters, includeChargers),
  )
  return {
    hotels: dedupeHotels(
      payload.elements.filter((element) =>
        ['hotel', 'motel', 'guest_house'].includes(element.tags?.tourism),
      ),
    ),
    chargers: payload.elements.filter(
      (element) => element.tags?.amenity === 'charging_station',
    ),
  }
}

async function main() {
  const snapshot = JSON.parse(await readFile(ROUTE_FILE, 'utf8'))
  const bookingSnapshots = JSON.parse(await readFile(BOOKING_FILE, 'utf8'))
  const rawSites = await fetchJson(SUPERCHARGE_INFO_URL, {
    headers: { 'User-Agent': 'ChargeQuest hotel planning research' },
  })
  const sitesByAddress = new Map(
    rawSites.map((site) => [normalize(stationAddress(site)), site]),
  )
  const stops = snapshot.stops.map((stop) => {
    const site = sitesByAddress.get(normalize(stop.address))
    if (!site?.gps) throw new Error(`Supercharger not matched: ${stop.address}`)
    return {
      ...stop,
      sourceId: String(site.id),
      city: site.address.city,
      state: site.address.state,
      position: {
        lat: site.gps.latitude,
        lon: site.gps.longitude,
      },
    }
  })

  const hotelElements = []
  const chargerElements = []
  for (let index = 0; index < stops.length; index += RESEARCH_BATCH_SIZE) {
    const batch = stops.slice(index, index + RESEARCH_BATCH_SIZE)
    const result = await researchBatch(batch, SEARCH_RADIUS_METERS)
    hotelElements.push(...result.hotels)
    chargerElements.push(...result.chargers)
    console.error(
      `researched days ${batch[0].day}-${batch.at(-1).day}: ${result.hotels.length} hotels`,
    )
  }

  let allHotels = dedupeHotels(hotelElements)
  const chargers = chargerElements
    .map((element) => ({
      position: hotelPosition(element),
      tags: element.tags ?? {},
    }))
    .filter((charger) => charger.position)

  const sparseStops = stops.filter(
    (stop) =>
      allHotels.filter(
        (hotel) =>
          haversineMiles(stop.position, hotelPosition(hotel)) <=
          SEARCH_RADIUS_METERS / 1609.344,
      ).length < MIN_OPTIONS,
  )
  for (
    let index = 0;
    index < sparseStops.length;
    index += RESEARCH_BATCH_SIZE
  ) {
    const batch = sparseStops.slice(index, index + RESEARCH_BATCH_SIZE)
    const result = await researchBatch(batch, FALLBACK_RADIUS_METERS, false)
    hotelElements.push(...result.hotels)
    console.error(
      `expanded days ${batch[0].day}-${batch.at(-1).day}: ${result.hotels.length} hotels`,
    )
  }
  allHotels = dedupeHotels(hotelElements)

  const days = stops.map((stop, index) => {
    const bookingDay = bookingSnapshots.days[stop.day]
    const nextStop = stops[index + 1]
    const directToNext = nextStop
      ? haversineMiles(stop.position, nextStop.position)
      : 0
    const candidates = [
      ...curatedHotelsForStop(stop, bookingDay),
      ...allHotels.map((element) => {
        const tags = element.tags ?? {}
        const position = hotelPosition(element)
        const name = String(tags.name ?? '').trim()
        const brand = String(tags.brand ?? tags.operator ?? '').trim()
        const distanceFromSupercharger = haversineMiles(stop.position, position)
        if (distanceFromSupercharger > FALLBACK_RADIUS_METERS / 1609.344) {
          return undefined
        }
        const detourMiles = nextStop
          ? Math.max(
              0,
              distanceFromSupercharger +
                haversineMiles(position, nextStop.position) -
                directToNext,
            )
          : distanceFromSupercharger
        const quality = qualityPresentation(name, brand, tags)
        const booking = bestBookingProperty(name, bookingDay?.properties)
        const nearestCharger = chargers
          .map((charger) => ({
            ...charger,
            distanceMiles: haversineMiles(position, charger.position),
          }))
          .sort((a, b) => a.distanceMiles - b.distanceMiles)[0]
        const evCharging =
          nearestCharger && nearestCharger.distanceMiles <= 0.3
            ? {
                status: 'nearby',
                distanceMiles: Number(nearestCharger.distanceMiles.toFixed(2)),
                label:
                  nearestCharger.tags.name ??
                  nearestCharger.tags.operator ??
                  'Mapped EV charging',
              }
            : { status: 'unverified' }
        const unique = quality.tier === 'unique'
        const score =
          quality.score -
          Math.min(26, distanceFromSupercharger * 1.2) -
          Math.min(22, detourMiles * 0.8) +
          (evCharging.status === 'nearby' ? 13 : 0) +
          (booking?.nightlyUsd ? 20 : 0) +
          (hotelWebsite(tags) ? 3 : 0) +
          (booking?.photoUrl || photoUrl(tags) ? 2 : 0)
        return {
          sourceKey: `${element.type}-${element.id}`,
          name,
          brand: brand || undefined,
          tier: quality.tier,
          tierLabel: quality.label,
          isUnique: unique,
          position,
          address: [
            tags['addr:housenumber'],
            tags['addr:street'],
            tags['addr:city'],
            tags['addr:state'],
            tags['addr:postcode'],
          ]
            .filter(Boolean)
            .join(' '),
          distanceFromSuperchargerMiles: Number(
            distanceFromSupercharger.toFixed(1),
          ),
          routeDetourMiles: Number(detourMiles.toFixed(1)),
          evCharging,
          officialUrl: hotelWebsite(tags),
          bookingUrl:
            booking?.propertyUrl ??
            bookingUrl(
              name,
              stop.city,
              stop.state,
              stop.date,
              addDays(stop.date, 1),
            ),
          mapsUrl: mapsUrl(name, position),
          photoUrl: booking?.photoUrl ?? photoUrl(tags),
          photoSource: booking?.photoUrl ? 'Booking.com' : undefined,
          rateSnapshot: {
            provider: 'Booking.com',
            availability: booking?.nightlyUsd
              ? 'available'
              : booking
                ? 'unavailable'
                : 'not_found',
            nightlyUsd: booking?.nightlyUsd ?? null,
            observedAt: bookingDay?.observedAt ?? null,
          },
          score: Number(score.toFixed(2)),
        }
      }),
    ]
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)

    const pricedCandidates = candidates.filter(
      (hotel) => hotel.rateSnapshot?.nightlyUsd,
    )
    const selectionPool =
      pricedCandidates.length >= MIN_OPTIONS
        ? [
            ...pricedCandidates,
            ...candidates.filter((hotel) => !hotel.rateSnapshot?.nightlyUsd),
          ]
        : candidates
    const selected = []
    const usedNames = new Set()
    const tiers = new Set()
    for (const hotel of selectionPool) {
      const key = normalize(hotel.name)
      if (usedNames.has(key)) continue
      const addsVariety = !tiers.has(hotel.tier)
      if (
        selected.length < MIN_OPTIONS ||
        addsVariety ||
        selected.length < TARGET_OPTIONS
      ) {
        selected.push(hotel)
        usedNames.add(key)
        tiers.add(hotel.tier)
      }
      if (selected.length >= TARGET_OPTIONS) break
    }

    return {
      day: stop.day,
      date: stop.date,
      checkOut: addDays(stop.date, 1),
      station: {
        sourceId: stop.sourceId,
        name: stop.stationName,
        address: stop.address,
        city: stop.city,
        state: stop.state,
        position: stop.position,
      },
      nextStation: nextStop
        ? {
            name: nextStop.stationName,
            city: nextStop.city,
            state: nextStop.state,
            position: nextStop.position,
          }
        : null,
      recommendations: selected.map(({ score: _score, ...hotel }) => hotel),
    }
  })

  const result = {
    routeName: snapshot.routeName,
    capturedAt: snapshot.capturedAt,
    researchedAt: new Date().toISOString(),
    sources: {
      route: 'ChargeQuest signed-in saved route',
      stations: SUPERCHARGE_INFO_URL,
      hotelsAndCharging: 'OpenStreetMap via Overpass',
      prices:
        'Booking.com dated search results for one adult, one room, one night',
      bookingSnapshots:
        'Booking.com dated search results for one adult, one room, one night',
      photos: 'Booking.com result image when a confident hotel match was found',
    },
    days,
  }
  if (process.argv.includes('--write')) {
    await writeFile(OUTPUT_FILE, `${JSON.stringify(result, null, 2)}\n`)
    process.stdout.write(
      `Wrote ${days.length} hotel nights to ${OUTPUT_FILE.pathname}\n`,
    )
  } else {
    process.stdout.write(`__HOTEL_JSON__\n${JSON.stringify(result, null, 2)}\n`)
  }
}

await main()
