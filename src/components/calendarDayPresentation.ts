import type { DayPlan, PlaceRating } from '../domain/types'

export type CalendarDayFlag = 'transit' | 'highlight' | 'short'
export type CalendarDayTone = CalendarDayFlag | 'standard'
export const CALENDAR_LANDMARK_DAY_MIN_SCORE = 85

/**
 * Calendar priority is safety first, then destination quality, then easy-drive
 * pacing. Flags remain additive so a great destination on a long drive still
 * shows both facts even though the transit color takes precedence. Landmark
 * metadata is separate so its outline can coexist with every day tone. Only
 * strong 85+ days receive the landmark treatment.
 */
export function calendarDayPresentation(
  day: Pick<DayPlan, 'driveHours' | 'rating'>,
) {
  const flags: CalendarDayFlag[] = []
  if (day.driveHours >= 4) flags.push('transit')
  if (day.rating.score >= 90) flags.push('highlight')
  if (day.driveHours < 1.5) flags.push('short')

  const tone: CalendarDayTone = flags.length > 0 ? flags[0] : 'standard'
  const landmark =
    day.rating.score >= CALENDAR_LANDMARK_DAY_MIN_SCORE
      ? day.rating.places
          .filter((place) => place.type === 'landmark')
          .reduce<PlaceRating | undefined>(
            (best, place) =>
              !best ||
              place.rating > best.rating ||
              (place.rating === best.rating &&
                place.sceneryScore > best.sceneryScore)
                ? place
                : best,
            undefined,
          )
      : undefined

  return {
    tone,
    flags,
    landmark,
  } satisfies {
    tone: CalendarDayTone
    flags: CalendarDayFlag[]
    landmark: PlaceRating | undefined
  }
}
