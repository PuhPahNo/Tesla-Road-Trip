import type { PlannerConfig } from './types'
import { round } from './geo'

const COMPETITION_START = '2026-01-01'
const COMPETITION_END = '2026-12-31'
const PASSPORT_DEADLINE = '2027-01-01'
const CONTEST_YEAR = Number(COMPETITION_START.slice(0, 4))

export const TESLA_CONTEST_RULES = {
  sourceUrl: 'https://www.tesla.com/support/tesla-app/charging-badges/contest',
  competitionStart: COMPETITION_START,
  competitionEnd: COMPETITION_END,
  passportDeadline: PASSPORT_DEADLINE,
  region: 'Americas',
  keyNotes: [
    `Open the ${CONTEST_YEAR} Passport in the Tesla app before ${formatRuleDate(PASSPORT_DEADLINE)}.`,
    'Most Unique Sites is based on distinct Supercharger sites displayed in Tesla app or vehicle navigation.',
    'Longest Trip requires a continuous streak with a new unique Supercharger site inside the required 24-hour continuation window.',
    'Repeat visits can happen but do not add to trip length.',
    'Tesla public contest terms do not publish a minimum charging duration.',
  ],
}

export type ContestPhase = 'upcoming' | 'active' | 'finalizing' | 'complete'

export interface ContestStatus {
  phase: ContestPhase
  contestYear: number
  region: string
  brandLabel: string
  headline: string
  detail: string
  sourceUrl: string
}

/**
 * Date-aware display policy for Tesla's official one-time contest dates.
 * It deliberately does not roll the rules into an unannounced future contest.
 */
export function getTeslaContestStatus(now = new Date()): ContestStatus {
  const today = localDateKey(now)
  const contestYear = Number(TESLA_CONTEST_RULES.competitionStart.slice(0, 4))
  const startLabel = formatRuleDate(TESLA_CONTEST_RULES.competitionStart)
  const deadlineLabel = formatRuleDate(TESLA_CONTEST_RULES.passportDeadline)
  const shared = {
    contestYear,
    region: TESLA_CONTEST_RULES.region,
    sourceUrl: TESLA_CONTEST_RULES.sourceUrl,
  }

  if (today < TESLA_CONTEST_RULES.competitionStart) {
    return {
      ...shared,
      phase: 'upcoming',
      brandLabel: `${contestYear} · ${TESLA_CONTEST_RULES.region}`,
      headline: `${contestYear} competition begins ${startLabel}`,
      detail: `These are Tesla's published ${contestYear} rules. Check the official source for changes before planning a qualifying trip.`,
    }
  }

  if (today <= TESLA_CONTEST_RULES.competitionEnd) {
    return {
      ...shared,
      phase: 'active',
      brandLabel: `${contestYear} · ${TESLA_CONTEST_RULES.region}`,
      headline: `${contestYear} Passport · Enroll by ${deadlineLabel}`,
      detail:
        'Open the Passport in the Tesla app before the deadline. No minimum charge duration is stated in Tesla’s published contest rules.',
    }
  }

  if (today < TESLA_CONTEST_RULES.passportDeadline) {
    return {
      ...shared,
      phase: 'finalizing',
      brandLabel: `${contestYear} · Finalizing`,
      headline: `${contestYear} Passport · Final check by ${deadlineLabel}`,
      detail:
        'The charging window has ended. Open the Passport after your final session and before Tesla’s enrollment deadline.',
    }
  }

  return {
    ...shared,
    phase: 'complete',
    brandLabel: `${TESLA_CONTEST_RULES.region} · Route planner`,
    headline: `${contestYear} competition complete`,
    detail: `The Passport deadline passed ${deadlineLabel}. Check Tesla’s official page for any newly announced competition before relying on these archived rules.`,
  }
}

function localDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatRuleDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00Z`))
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
