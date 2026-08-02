import { describe, expect, it } from 'vitest'
import { calendarDayPresentation } from './calendarDayPresentation'

function day(driveHours: number, score: number) {
  return {
    driveHours,
    rating: { score },
  } as Parameters<typeof calendarDayPresentation>[0]
}

describe('calendarDayPresentation', () => {
  it('prioritizes 4+ hour transit days while retaining a 90+ highlight flag', () => {
    expect(calendarDayPresentation(day(4, 95))).toEqual({
      tone: 'transit',
      flags: ['transit', 'highlight'],
    })
  })

  it('uses the highlight tone for 90+ destination days', () => {
    expect(calendarDayPresentation(day(2.5, 90))).toEqual({
      tone: 'highlight',
      flags: ['highlight'],
    })
  })

  it('uses the easy-drive tone only below 1.5 hours', () => {
    expect(calendarDayPresentation(day(1.49, 82))).toEqual({
      tone: 'short',
      flags: ['short'],
    })
    expect(calendarDayPresentation(day(1.5, 82))).toEqual({
      tone: 'standard',
      flags: [],
    })
  })

  it('leaves every other day visually standard', () => {
    expect(calendarDayPresentation(day(3.9, 89))).toEqual({
      tone: 'standard',
      flags: [],
    })
  })
})
