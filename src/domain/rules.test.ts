import { describe, expect, it } from 'vitest'
import { defaultPlannerConfig } from './config'
import { estimateAllSitesFeasibility, getTeslaContestStatus } from './rules'

describe('Tesla contest feasibility math', () => {
  it('marks every lower-48 station as not plausible in a nine-week trip', () => {
    const result = estimateAllSitesFeasibility(3116, {
      ...defaultPlannerConfig,
      tripWeeks: 9,
    })

    expect(result.availableDays).toBe(63)
    expect(result.requiredStationsPerDay).toBeGreaterThan(49)
    expect(result.verdict).toBe('not_plausible')
    expect(result.minimumStopHours).toBeGreaterThan(100)
  })

  it('marks a moderate target as plausible under the same assumptions', () => {
    const result = estimateAllSitesFeasibility(400, {
      ...defaultPlannerConfig,
      tripWeeks: 9,
    })

    expect(result.requiredStationsPerDay).toBeLessThan(7)
    expect(result.verdict).toBe('plausible')
  })
})

describe('Tesla contest date messaging', () => {
  it('shows the published Passport deadline during the 2026 competition', () => {
    const status = getTeslaContestStatus(new Date(2026, 6, 11, 12))

    expect(status.phase).toBe('active')
    expect(status.brandLabel).toBe('2026 · Americas')
    expect(status.headline).toBe('2026 Passport · Enroll by Jan 1, 2027')
  })

  it('keeps the competition active through local December 31', () => {
    expect(getTeslaContestStatus(new Date(2026, 11, 31, 23, 59)).phase).toBe(
      'active',
    )
  })

  it('archives the rules instead of inventing a new contest on January 1', () => {
    const status = getTeslaContestStatus(new Date(2027, 0, 1, 0, 0))

    expect(status.phase).toBe('complete')
    expect(status.brandLabel).toBe('Americas · Route planner')
    expect(status.headline).toBe('2026 competition complete')
    expect(status.detail).toContain('deadline passed Jan 1, 2027')
  })
})
