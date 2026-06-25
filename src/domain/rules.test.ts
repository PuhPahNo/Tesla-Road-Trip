import { describe, expect, it } from 'vitest'
import { defaultPlannerConfig } from './config'
import { estimateAllSitesFeasibility } from './rules'

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
