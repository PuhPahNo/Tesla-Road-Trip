import { readFile, writeFile } from 'node:fs/promises'

const HOTEL_DATA_FILE = new URL(
  '../src/data/hotelRecommendations.json',
  import.meta.url,
)
const SNAPSHOT_FILE = new URL(
  './data/booking-hotel-snapshots.json',
  import.meta.url,
)
const DAY_SNAPSHOT_FILE = new URL(
  './data/booking-day-snapshots.json',
  import.meta.url,
)

const STOP_WORDS = new Set([
  'and',
  'at',
  'by',
  'hotel',
  'hotels',
  'inn',
  'of',
  'resort',
  'suites',
  'the',
])
const STATE_NAMES = {
  AZ: 'Arizona',
  CA: 'California',
  CO: 'Colorado',
  IA: 'Iowa',
  ID: 'Idaho',
  IL: 'Illinois',
  KY: 'Kentucky',
  LA: 'Louisiana',
  MO: 'Missouri',
  MS: 'Mississippi',
  MT: 'Montana',
  NE: 'Nebraska',
  NM: 'New Mexico',
  NV: 'Nevada',
  OR: 'Oregon',
  SD: 'South Dakota',
  TN: 'Tennessee',
  TX: 'Texas',
  UT: 'Utah',
  WA: 'Washington',
  WY: 'Wyoming',
}

function normalize(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replaceAll('&', 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function nameScore(expected, actual) {
  const left = normalize(expected)
  const right = normalize(actual)
  if (!left || !right) return 0
  if (left === right) return 100
  if (left.includes(right) || right.includes(left)) return 80
  const leftTokens = new Set(
    left.split(' ').filter((token) => token.length > 1 && !STOP_WORDS.has(token)),
  )
  const rightTokens = new Set(
    right.split(' ').filter((token) => token.length > 1 && !STOP_WORDS.has(token)),
  )
  const overlap = [...leftTokens].filter((token) => rightTokens.has(token)).length
  return (overlap / Math.max(leftTokens.size, rightTokens.size, 1)) * 100
}

export function bestBookingProperty(name, properties) {
  const ranked = (properties ?? [])
    .map((property) => ({
      ...property,
      score: nameScore(name, property.name),
    }))
    .sort((a, b) => b.score - a.score)
  return ranked[0]?.score >= 50 ? ranked[0] : null
}

function parseUsd(value) {
  const match = String(value ?? '').match(/\$([\d,]+)/)
  return match ? Number(match[1].replaceAll(',', '')) : null
}

export async function loadBookingQueue() {
  const data = JSON.parse(await readFile(HOTEL_DATA_FILE, 'utf8'))
  let snapshots = { researchedAt: null, hotels: {} }
  try {
    snapshots = JSON.parse(await readFile(SNAPSHOT_FILE, 'utf8'))
  } catch {
    // The first browser research pass creates this generated snapshot file.
  }
  return data.days.flatMap((day) =>
    day.recommendations
      .filter((hotel) => !snapshots.hotels[`${day.day}:${hotel.sourceKey}`])
      .map((hotel) => ({
        key: `${day.day}:${hotel.sourceKey}`,
        day: day.day,
        date: day.date,
        name: hotel.name,
        bookingUrl: hotel.bookingUrl,
      })),
  )
}

export async function researchBookingBatch(tab, items) {
  const snapshots = []
  for (const item of items) {
    await tab.goto(item.bookingUrl)
    await new Promise((resolve) => setTimeout(resolve, 450))
    const title = await tab.title()
    if (/captcha|verify|human|robot/i.test(title)) {
      throw new Error(`Booking.com verification interrupted day ${item.day}.`)
    }

    const cards = tab.playwright.locator('[data-testid="property-card"]')
    const matches = []
    for (let index = 0; index < Math.min(await cards.count(), 8); index += 1) {
      const card = cards.nth(index)
      const titleLocator = card.locator('[data-testid="title"]')
      if (!(await titleLocator.count())) continue
      const resultName = (await titleLocator.first().textContent())?.trim() ?? ''
      matches.push({ card, resultName, score: nameScore(item.name, resultName) })
    }
    matches.sort((a, b) => b.score - a.score)
    const match = matches[0]?.score >= 50 ? matches[0] : undefined
    const observedAt = new Date().toISOString()
    if (!match) {
      snapshots.push({
        ...item,
        observedAt,
        availability: 'not_found',
        nightlyUsd: null,
      })
      continue
    }

    const priceLocator = match.card.locator(
      '[data-testid="price-and-discounted-price"]',
    )
    const priceText = (await priceLocator.count())
      ? await priceLocator.first().textContent()
      : null
    const imageLocator = match.card.locator('img')
    const linkLocator = match.card.locator('a')
    snapshots.push({
      ...item,
      observedAt,
      availability: priceText ? 'available' : 'unavailable',
      nightlyUsd: parseUsd(priceText),
      matchedName: match.resultName,
      photoUrl: (await imageLocator.count())
        ? await imageLocator.first().getAttribute('src')
        : null,
      propertyUrl: (await linkLocator.count())
        ? await linkLocator.first().getAttribute('href')
        : null,
    })
  }
  return snapshots
}

export async function loadBookingDayQueue() {
  const data = JSON.parse(await readFile(HOTEL_DATA_FILE, 'utf8'))
  let snapshots = { researchedAt: null, days: {} }
  try {
    snapshots = JSON.parse(await readFile(DAY_SNAPSHOT_FILE, 'utf8'))
  } catch {
    // The first browser research pass creates this generated snapshot file.
  }
  return data.days
    .filter((day) => !snapshots.days[day.day])
    .map((day) => ({
      day: day.day,
      date: day.date,
      checkOut: day.checkOut,
      city: day.station.city,
      state: day.station.state,
    }))
}

export async function researchBookingDayBatch(tab, days) {
  const snapshots = []
  for (const day of days) {
    const params = new URLSearchParams({
      ss: `${day.city}, ${STATE_NAMES[day.state] ?? day.state}, United States of America`,
      checkin: day.date,
      checkout: day.checkOut,
      group_adults: '1',
      no_rooms: '1',
      group_children: '0',
    })
    await tab.goto(`https://www.booking.com/searchresults.html?${params}`)
    await new Promise((resolve) => setTimeout(resolve, 500))
    const title = await tab.title()
    if (/captcha|verify|human|robot/i.test(title)) {
      throw new Error(`Booking.com verification interrupted day ${day.day}.`)
    }
    const cards = tab.playwright.locator('[data-testid="property-card"]')
    const properties = []
    for (let index = 0; index < Math.min(await cards.count(), 25); index += 1) {
      const card = cards.nth(index)
      const titleLocator = card.locator('[data-testid="title"]')
      if (!(await titleLocator.count())) continue
      const priceLocator = card.locator(
        '[data-testid="price-and-discounted-price"]',
      )
      const imageLocator = card.locator('img')
      const linkLocator = card.locator('a')
      properties.push({
        name: (await titleLocator.first().textContent())?.trim() ?? '',
        nightlyUsd: (await priceLocator.count())
          ? parseUsd(await priceLocator.first().textContent())
          : null,
        photoUrl: (await imageLocator.count())
          ? await imageLocator.first().getAttribute('src')
          : null,
        propertyUrl: (await linkLocator.count())
          ? await linkLocator.first().getAttribute('href')
          : null,
      })
    }
    snapshots.push({
      ...day,
      observedAt: new Date().toISOString(),
      searchUrl: await tab.url(),
      properties,
    })
  }
  return snapshots
}

export async function saveBookingDaySnapshots(batch) {
  let current = { researchedAt: null, days: {} }
  try {
    current = JSON.parse(await readFile(DAY_SNAPSHOT_FILE, 'utf8'))
  } catch {
    // Create the generated file below.
  }
  for (const snapshot of batch) current.days[snapshot.day] = snapshot
  current.researchedAt = new Date().toISOString()
  await writeFile(DAY_SNAPSHOT_FILE, `${JSON.stringify(current, null, 2)}\n`)
  return Object.keys(current.days).length
}

export async function bookingDayMatchCoverage() {
  const data = JSON.parse(await readFile(HOTEL_DATA_FILE, 'utf8'))
  const snapshots = JSON.parse(await readFile(DAY_SNAPSHOT_FILE, 'utf8'))
  const days = data.days.map((day) => {
    const snapshot = snapshots.days[day.day]
    const matches = day.recommendations.map((hotel) => {
      return bestBookingProperty(hotel.name, snapshot?.properties)
    })
    return {
      day: day.day,
      options: day.recommendations.length,
      matched: matches.filter(Boolean).length,
      priced: matches.filter((match) => match?.nightlyUsd).length,
      photos: matches.filter((match) => match?.photoUrl).length,
    }
  })
  return {
    days,
    totalMatched: days.reduce((sum, day) => sum + day.matched, 0),
    totalPriced: days.reduce((sum, day) => sum + day.priced, 0),
    totalPhotos: days.reduce((sum, day) => sum + day.photos, 0),
    daysWithThreePrices: days.filter((day) => day.priced >= 3).length,
  }
}

export async function saveBookingSnapshots(batch) {
  let current = { researchedAt: null, hotels: {} }
  try {
    current = JSON.parse(await readFile(SNAPSHOT_FILE, 'utf8'))
  } catch {
    // Create the generated file below.
  }
  for (const snapshot of batch) current.hotels[snapshot.key] = snapshot
  current.researchedAt = new Date().toISOString()
  await writeFile(SNAPSHOT_FILE, `${JSON.stringify(current, null, 2)}\n`)
  return Object.keys(current.hotels).length
}

export async function applyBookingSnapshots() {
  const data = JSON.parse(await readFile(HOTEL_DATA_FILE, 'utf8'))
  const snapshots = JSON.parse(await readFile(SNAPSHOT_FILE, 'utf8'))
  for (const day of data.days) {
    for (const hotel of day.recommendations) {
      const snapshot = snapshots.hotels[`${day.day}:${hotel.sourceKey}`]
      delete hotel.estimatedNightlyUsd
      if (!snapshot) continue
      if (snapshot.nightlyUsd) {
        hotel.rateSnapshot = {
          provider: 'Booking.com',
          availability: 'available',
          nightlyUsd: snapshot.nightlyUsd,
          observedAt: snapshot.observedAt,
        }
      }
      if (snapshot.photoUrl) {
        hotel.photoUrl = snapshot.photoUrl
        hotel.photoSource = 'Booking.com'
      }
      if (snapshot.propertyUrl) hotel.bookingUrl = snapshot.propertyUrl
    }
  }
  data.sources.prices =
    'Booking.com dated rate snapshot for one adult, one room, one night; taxes and fees may be excluded and rates can change'
  data.sources.photos =
    'Booking.com property result image when a confident hotel match was found'
  data.bookingResearchedAt = snapshots.researchedAt
  await writeFile(HOTEL_DATA_FILE, `${JSON.stringify(data, null, 2)}\n`)
}
