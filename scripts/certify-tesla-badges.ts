import { filterOpenStations, normalizeSuperchargeSites } from '../src/domain/stations'
import {
  TESLA_ICONIC_BADGES,
  TESLA_SPECIAL_EVENT_BADGES,
  iconicBadgesForStation,
} from '../src/domain/teslaBadges'

const response = await fetch('https://supercharge.info/service/supercharge/allSites')
if (!response.ok) {
  throw new Error(`Supercharge.info returned ${response.status}.`)
}

const stations = filterOpenStations(
  normalizeSuperchargeSites(await response.json() as unknown[]),
)
const verified = TESLA_ICONIC_BADGES.map((badge) => {
  const matches = stations.filter((station) =>
    iconicBadgesForStation(station).some((candidate) => candidate.id === badge.id),
  )
  if (matches.length === 0) {
    throw new Error(`No currently open qualifying station matched ${badge.label}.`)
  }
  return {
    badge: badge.label,
    stations: matches.map((station) => ({
      name: station.name,
      locationId: station.teslaLocationId,
      city: station.address.city,
      state: station.address.state,
    })),
  }
})

console.log(JSON.stringify({
  iconicBadgeCount: TESLA_ICONIC_BADGES.length,
  everyIconicBadgeHasAnOpenStation: true,
  specialEvents: TESLA_SPECIAL_EVENT_BADGES.map((badge) => ({
    label: badge.label,
    date: badge.date,
  })),
  verified,
}))
