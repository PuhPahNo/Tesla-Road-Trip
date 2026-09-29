import { describe, expect, it } from 'vitest'
import type { AnthonyTrip, TripDayLogEntry } from '../../api/siteClient'
import type { DayPlan, RoutePlan, RouteStationVisit } from '../../domain/types'
import { buildJournal, classifyMedia } from './journal'
import { buildTripProgress, dayStatus } from './tripProgress'

function visit(id: string, state: string, day: number): RouteStationVisit {
  return {
    sequence: 0,
    day,
    legMiles: 0,
    driveHours: 0,
    stopMinutes: 0,
    rangeWarning: false,
    station: {
      id,
      sourceId: id,
      source: 'supercharge.info',
      name: id,
      status: 'OPEN',
      position: { lat: 0, lon: 0 },
      address: { street: '', city: `City ${id}`, state, country: 'USA' },
      stallCount: null,
      powerKw: null,
      counted: null,
      otherEvs: null,
    },
  } as RouteStationVisit
}

function day(number: number, miles: number, visits: RouteStationVisit[]): DayPlan {
  return { day: number, miles, visits } as unknown as DayPlan
}

const days = [
  day(1, 100, [visit('a', 'TN', 1)]),
  day(2, 200, [visit('b', 'KY', 2), visit('c', 'IL', 2)]),
  day(3, 300, [visit('d', 'IL', 3)]),
]
const route = {
  totalDays: 3,
  totalMiles: 600,
  uniqueStations: 4,
  totalDriveHours: 10,
  days,
  visits: days.flatMap((entry) => entry.visits),
} as unknown as RoutePlan

const trip = (overrides: Partial<AnthonyTrip> = {}): AnthonyTrip => ({
  active: true,
  title: 'Trip',
  dayNumber: 2,
  updatedAt: '2026-10-04T12:00:00Z',
  ...overrides,
})

const log = (dayNumber: number, energyKwh?: number): TripDayLogEntry => ({
  dayNumber,
  completed: true,
  energyKwh,
  updatedAt: '2026-10-04T12:00:00Z',
})

describe('trip progress', () => {
  it('is pre-trip until the tracker is live', () => {
    const progress = buildTripProgress(route, trip({ active: false }), [])
    expect(progress.phase).toBe('pre_trip')
    expect(progress.currentDay).toBeUndefined()
    expect(progress.planned).toMatchObject({ miles: 600, superchargers: 4, states: 3 })
  })

  it('stays pre-trip before departure even if the tracker is switched live', () => {
    const progress = buildTripProgress(route, trip({ dayNumber: 1 }), [], '2026-10-04', new Date('2026-09-29T12:00:00'))
    expect(progress.phase).toBe('pre_trip')
    expect(buildTripProgress(route, trip({ dayNumber: 1 }), [], '2026-10-04', new Date('2026-10-04T08:00:00')).phase).toBe('live')
  })

  it('totals only the days Anthony has finished', () => {
    const progress = buildTripProgress(route, trip(), [log(1, 120.5)])
    expect(progress.phase).toBe('live')
    expect(progress.currentDay).toBe(2)
    expect(progress.milesDriven).toBe(100)
    expect(progress.superchargersVisited).toBe(1)
    expect(progress.statesVisited).toBe(1)
    expect(progress.energyKwh).toBe(120.5)
    expect(dayStatus(progress, 1)).toBe('done')
    expect(dayStatus(progress, 2)).toBe('today')
    expect(dayStatus(progress, 3)).toBe('upcoming')
  })

  it('is finished once every day is logged', () => {
    const progress = buildTripProgress(route, trip({ dayNumber: 3 }), [log(1), log(2), log(3)])
    expect(progress.phase).toBe('finished')
    expect(progress.milesDriven).toBe(600)
    expect(progress.superchargersVisited).toBe(4)
    expect(progress.hasEnergyData).toBe(false)
  })
})

describe('journal media', () => {
  it('embeds Instagram posts and reels', () => {
    expect(classifyMedia('https://www.instagram.com/reel/C8xYz_12/?igsh=abc')).toMatchObject({
      kind: 'instagram',
      embedUrl: 'https://www.instagram.com/reel/C8xYz_12/embed/',
    })
    expect(classifyMedia('https://instagram.com/p/AbC-123/')).toMatchObject({
      kind: 'instagram',
      embedUrl: 'https://www.instagram.com/p/AbC-123/embed/',
    })
  })

  it('embeds YouTube videos and falls back to links', () => {
    expect(classifyMedia('https://youtu.be/dQw4w9WgXcQ')).toMatchObject({
      kind: 'youtube',
      embedUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    })
    expect(classifyMedia('https://example.com/photo.jpg').kind).toBe('image')
    expect(classifyMedia('https://example.com/story').kind).toBe('link')
  })

  it('lists posts newest first, including the field note', () => {
    const journal = buildJournal([
      {
        id: 'u1',
        phase: 'on-the-road',
        day_number: 2,
        location: 'Nashville, TN',
        title: 'Day two',
        body: '',
        artifact_url: 'https://www.instagram.com/reel/XYZ123/',
        created_at: '2026-10-04T18:00:00Z',
      },
    ])
    expect(journal[0]).toMatchObject({ id: 'u1', label: 'Day 2', media: { kind: 'instagram' } })
    expect(journal.some((entry) => entry.fieldNote)).toBe(true)
  })
})
