import type { PlannerConfig } from './types'
import { round } from './geo'

export const TESLA_CONTEST_RULES = {
  sourceUrl: 'https://www.tesla.com/support/tesla-app/charging-badges/contest',
  competitionStart: '2026-01-01',
  competitionEnd: '2026-12-31',
  passportDeadline: '2027-01-01',
  region: 'Americas',
  keyNotes: [
    'Open the 2026 Passport in the Tesla app before January 1, 2027.',
    'Most Unique Sites is based on distinct Supercharger sites displayed in Tesla app or vehicle navigation.',
    'Longest Trip requires a continuous streak with a new unique Supercharger site inside the required 24-hour continuation window.',
    'Repeat visits can happen but do not add to trip length.',
    'Tesla public contest terms do not publish a minimum charging duration.',
  ],
}

export function estimateAllSitesFeasibility(
  totalStations: number,
  config: PlannerConfig,
) {
  const availableDays = Math.max(1, Math.round(config.tripWeeks * 7))
  const requiredStationsPerDay = totalStations / availableDays
  const minimumStopHours =
    (totalStations * config.closeStationStopMinutes) / 60
  const distanceStopHours =
    (totalStations * config.distanceChargeStopMinutes) / 60

  let verdict: 'not_plausible' | 'aggressive' | 'plausible' = 'plausible'
  let explanation = 'The selected target is within a normal daily station pace.'

  if (requiredStationsPerDay > 20) {
    verdict = 'not_plausible'
    explanation =
      'Every open station would require far too many unique stops per day before routing, charging, meals, traffic, or sleep.'
  } else if (requiredStationsPerDay > 10) {
    verdict = 'aggressive'
    explanation =
      'The target is possible only with dense corridor sweeps, short sessions, and very little schedule slack.'
  }

  return {
    totalStations,
    availableDays,
    requiredStationsPerDay: round(requiredStationsPerDay, 1),
    minimumStopHours: round(minimumStopHours, 1),
    distanceStopHours: round(distanceStopHours, 1),
    verdict,
    explanation,
  }
}
