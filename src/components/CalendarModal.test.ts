import { describe, expect, it } from 'vitest'
import { calendarDayPresentation } from './calendarDayPresentation'

function day(
  driveHours: number,
  score: number,
): Parameters<typeof calendarDayPresentation>[0] {
  return {
    driveHours,
    rating: {
      score,
      sceneryScore: score,
      cityScore: 0,
      landmarkScore: 0,
      places: [],
      summary: 'Test calendar day.',
    },
  }
}

describe('calendarDayPresentation', () => {
  it('prioritizes 4+ hour transit days while retaining a 90+ highlight flag', () => {
    expect(calendarDayPresentation(day(4, 95))).toEqual({
      tone: 'transit',
      flags: ['transit', 'highlight'],
      landmark: undefined,
    })
  })

  it('uses the highlight tone for 90+ destination days', () => {
    expect(calendarDayPresentation(day(2.5, 90))).toEqual({
      tone: 'highlight',
      flags: ['highlight'],
      landmark: undefined,
    })
  })

  it('uses the easy-drive tone only below 1.5 hours', () => {
    expect(calendarDayPresentation(day(1.49, 82))).toEqual({
      tone: 'short',
      flags: ['short'],
      landmark: undefined,
    })
    expect(calendarDayPresentation(day(1.5, 82))).toEqual({
      tone: 'standard',
      flags: [],
      landmark: undefined,
    })
  })

  it('leaves every other day visually standard', () => {
    expect(calendarDayPresentation(day(3.9, 89))).toEqual({
      tone: 'standard',
      flags: [],
      landmark: undefined,
    })
  })

  it('selects the highest-rated landmark independently of the day tone', () => {
    const landmarkDay = day(4.25, 88)
    landmarkDay.rating.places = [
      {
        id: 'city:test',
        type: 'city',
        label: 'Test City',
        rating: 99,
        sceneryScore: 70,
        visits: 1,
        summary: 'A city is not a landmark.',
      },
      {
        id: 'landmark:first',
        type: 'landmark',
        label: 'Scenic Landmark',
        rating: 92,
        sceneryScore: 96,
        visits: 1,
        summary: 'The best landmark on this day.',
      },
      {
        id: 'landmark:second',
        type: 'landmark',
        label: 'Other Landmark',
        rating: 84,
        sceneryScore: 90,
        visits: 1,
        summary: 'Another landmark on this day.',
      },
    ]

    expect(calendarDayPresentation(landmarkDay)).toEqual({
      tone: 'transit',
      flags: ['transit'],
      landmark: expect.objectContaining({ label: 'Scenic Landmark' }),
    })
  })
})
