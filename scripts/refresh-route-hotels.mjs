// Refresh exact live route dates and measure hotel access on the road network.
// Run: node --env-file=.env scripts/refresh-route-hotels.mjs --write
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import {
  hotelPosition,
  hotelWebsite,
  qualityPresentation,
  haversineMiles,
  bookingUrl,
  mapsUrl,
  addDays,
} from './research-hotels.mjs'
const output = new URL('../src/data/hotelRecommendations.json', import.meta.url)
const cache =
  process.env.HOTEL_RESEARCH_CACHE || '/tmp/chargequest-hotel-road-research'
await mkdir(cache, { recursive: true })
const response = await fetch(
  'https://www.teslachargequest.com/api/community/anthony-route',
)
if (!response.ok) throw Error(`Live route unavailable: ${response.status}`)
const live = await response.json()
const route = live.route.route
const old = JSON.parse(
  await readFile(process.env.HOTEL_BASELINE_FILE || output, 'utf8'),
)
const overrides = JSON.parse(
  await readFile(
    new URL('./data/hotel-research-overrides.json', import.meta.url),
    'utf8',
  ),
)
const stops = route.days.map((d) => ({
  day: d.day,
  date: addDays(route.tripStartDate, d.day - 1),
  station: d.visits.at(-1).station,
}))
const stamp = new Date().toISOString()
const oldHotels = old.days.flatMap((d) => d.recommendations)
async function cached(key, work) {
  const file = `${cache}/${createHash('sha256').update(key).digest('hex')}.json`
  try {
    return JSON.parse(await readFile(file, 'utf8'))
  } catch {
    /* fetch missing research */
  }
  let result
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      result = await work()
      break
    } catch (error) {
      if (attempt === 2) throw error
      await new Promise((resolve) => setTimeout(resolve, 2000 * (attempt + 1)))
    }
  }
  await writeFile(file, JSON.stringify(result))
  return result
}
const elements = []
for (const stop of stops.slice(0, -1)) {
  const position = stop.station.position
  const found = await cached(
    'photon-v1:' + JSON.stringify(position),
    async () => {
      const params = new URLSearchParams({
        lat: String(position.lat),
        lon: String(position.lon),
        radius: '32',
        limit: '30',
      })
      params.append('osm_tag', 'tourism:hotel')
      params.append('osm_tag', 'tourism:motel')
      params.append('osm_tag', 'tourism:guest_house')
      const response = await fetch(
        `https://photon.komoot.io/reverse?${params}`,
        { signal: AbortSignal.timeout(25000) },
      )
      if (!response.ok) throw Error(`Hotel inventory ${response.status}`)
      return response.json()
    },
  )
  for (const f of found.features) {
    const p = f.properties,
      [lon, lat] = f.geometry.coordinates
    if (
      p.countrycode?.toLowerCase() !== 'us' ||
      !['hotel', 'motel', 'guest_house'].includes(p.osm_value)
    )
      continue
    elements.push({
      type: p.osm_type,
      id: p.osm_id,
      lat,
      lon,
      tags: {
        name: p.name,
        tourism: p.osm_value,
        'addr:housenumber': p.housenumber,
        'addr:street': p.street,
        'addr:city': p.city,
        website: p.extra?.website,
      },
    })
  }
  console.log(`Hotel inventory D${stop.day}: ${found.features.length}`)
}
const qualityRank = {
  luxury: 44,
  upscale: 36,
  unique: 31,
  premium: 28,
  reputable: 20,
  independent: 14,
  basic: 5,
}
const days = []
for (const [index, stop] of stops.entries()) {
  const station = stop.station,
    next = stops[index + 1]?.station
  const day = {
    day: stop.day,
    date: stop.date,
    checkOut: addDays(stop.date, 1),
    station: {
      sourceId: station.sourceId,
      name: station.name,
      address: [
        station.address.street,
        station.address.city,
        station.address.state,
      ].join(', '),
      city: station.address.city,
      state: station.address.state,
      position: station.position,
    },
    nextStation: next
      ? {
          name: next.name,
          city: next.address.city,
          state: next.address.state,
          position: next.position,
        }
      : null,
    recommendations: [],
    overnightRequired: !!next,
  }
  if (!next) {
    days.push(day)
    continue
  }
  const nearby = elements
    .map((e) => {
      const tags = e.tags || {},
        position = hotelPosition(e),
        name = tags.name
      if (!position || !name) return null
      const q = qualityPresentation(name, tags.brand || '', tags)
      if (q.tier === 'unique') {
        q.tier = 'independent'
        q.label = 'Independent'
      }
      return {
        sourceKey: `${e.type}-${e.id}`,
        name,
        tier: q.tier,
        tierLabel: q.label,
        isUnique: q.tier === 'unique',
        position,
        address: [
          tags['addr:housenumber'],
          tags['addr:street'],
          tags['addr:city'],
        ]
          .filter(Boolean)
          .join(' '),
        officialUrl: hotelWebsite(tags),
        evCharging: { status: 'unverified' },
      }
    })
    .filter(Boolean)
  const byName = new Map()
  for (const h of [...overrides.hotels, ...oldHotels, ...nearby]) {
    if (overrides.excludedNames.includes(h.name)) continue
    if (haversineMiles(station.position, h.position) > 20) continue
    const key = h.name.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (!byName.has(key)) byName.set(key, h)
  }
  const candidates = [...byName.values()]
    .sort(
      (a, b) =>
        haversineMiles(station.position, a.position) -
        haversineMiles(station.position, b.position),
    )
    .slice(0, 20)
  if (!candidates.length) throw Error(`No hotels day ${stop.day}`)
  const locations = [
    station.position,
    next.position,
    ...candidates.map((h) => h.position),
  ].map((p) => [p.lon, p.lat])
  const matrix = await cached(
    'matrix-v1:' + JSON.stringify(locations),
    async () => {
      await new Promise((r) => setTimeout(r, 1600))
      const response = await fetch(
        'https://api.heigit.org/openrouteservice/v2/matrix/driving-car',
        {
          method: 'POST',
          headers: {
            Authorization: process.env.ORS_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            locations,
            metrics: ['distance', 'duration'],
          }),
          signal: AbortSignal.timeout(55000),
        },
      )
      if (!response.ok)
        throw Error(
          `Road matrix day ${stop.day}: ${response.status} ${await response.text()}`,
        )
      return response.json()
    },
  )
  const ranked = candidates.flatMap((h, i) => {
    const j = i + 2,
      meters = matrix.distances[0][j],
      seconds = matrix.durations[0][j],
      onward = matrix.distances[j][1],
      onwardSeconds = matrix.durations[j][1]
    if (
      [
        meters,
        seconds,
        onward,
        onwardSeconds,
        matrix.distances[0][1],
        matrix.durations[0][1],
      ].some((n) => !Number.isFinite(n))
    )
      return []
    return [
      {
        ...h,
        distanceFromSuperchargerMiles:
          Math.round((meters / 1609.344) * 10) / 10,
        driveMinutesFromSupercharger: Math.round((seconds / 60) * 10) / 10,
        routeDetourMiles:
          Math.round(
            (Math.max(0, meters + onward - matrix.distances[0][1]) / 1609.344) *
              10,
          ) / 10,
        routeDetourMinutes:
          Math.round(
            (Math.max(0, seconds + onwardSeconds - matrix.durations[0][1]) /
              60) *
              10,
          ) / 10,
        distanceSource: 'road',
        routingProvider: 'OpenRouteService',
        routedAt: stamp,
        evCharging: h.evCharging ?? { status: 'unverified' },
        bookingUrl: bookingUrl(
          h.name,
          station.address.city,
          station.address.state,
          stop.date,
          day.checkOut,
        ),
        mapsUrl: mapsUrl(h.name, h.position),
        rateSnapshot: {
          provider: 'Booking.com',
          availability: 'not_found',
          nightlyUsd: null,
          observedAt: null,
        },
      },
    ]
  })
  ranked.sort(
    (a, b) =>
      Number(b.driveMinutesFromSupercharger <= 20) -
        Number(a.driveMinutesFromSupercharger <= 20) ||
      (qualityRank[b.tier] || 0) -
        b.driveMinutesFromSupercharger * 0.5 -
        b.routeDetourMinutes * 0.3 -
        ((qualityRank[a.tier] || 0) -
          a.driveMinutesFromSupercharger * 0.5 -
          a.routeDetourMinutes * 0.3),
  )
  const identities = new Set()
  const withinTwenty = ranked.filter(
    (h) => h.driveMinutesFromSupercharger <= 20,
  )
  const selectionPool = withinTwenty.length ? withinTwenty : ranked
  day.recommendations = selectionPool
    .filter((h) => {
      const key = `${h.position.lat.toFixed(4)}:${h.position.lon.toFixed(4)}`
      if (identities.has(key)) return false
      identities.add(key)
      return true
    })
    .slice(0, 5)
  if (!day.recommendations.length)
    throw Error(`No routable hotels day ${stop.day}`)
  days.push(day)
  console.log(
    `D${stop.day} ${station.address.city}: ${day.recommendations[0].name}, ${day.recommendations[0].driveMinutesFromSupercharger} min; ${ranked.filter((h) => h.driveMinutesFromSupercharger <= 20).length} within 20 min`,
  )
}
const dataset = {
  routeName: route.name,
  capturedAt: stamp,
  researchedAt: stamp,
  sources: {
    route: 'Live published CORE itinerary',
    hotelsAndCharging:
      'OpenStreetMap via Photon and previously researched property identities',
    routing: 'OpenRouteService driving-car road matrix, no live traffic',
    prices:
      'Rates and availability not rechecked; booking links use the revised exact dates',
    photos: 'Previously researched property photos; not date-specific',
  },
  days,
}
const latest = await (
  await fetch('https://www.teslachargequest.com/api/community/anthony-route')
).json()
if (
  JSON.stringify(latest.route.savedRoute) !==
  JSON.stringify(live.route.savedRoute)
)
  throw Error('Live route changed during research; rerun before writing')
if (process.argv.includes('--write'))
  await writeFile(output, JSON.stringify(dataset, null, 2) + '\n')
else
  await writeFile(
    `${cache}/preview.json`,
    JSON.stringify(dataset, null, 2) + '\n',
  )
console.log(
  JSON.stringify({
    days: days.length,
    overnights: days.filter((d) => d.overnightRequired).length,
    without20minuteOption: days
      .filter(
        (d) =>
          d.overnightRequired &&
          !d.recommendations.some((h) => h.driveMinutesFromSupercharger <= 20),
      )
      .map((d) => d.day),
  }),
)
