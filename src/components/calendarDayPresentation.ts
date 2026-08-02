import type { DayPlan } from '../domain/types'

export type CalendarDayFlag = 'transit' | 'highlight' | 'short'
export type CalendarDayTone = CalendarDayFlag | 'standard'

/**
 * Calendar priority is safety first, then destination quality, then easy-drive
 * pacing. Flags remain additive so a great destination on a long drive still
 * shows both facts even though the transit color takes precedence.
 */
export function calendarDayPresentation(
  day: Pick<DayPlan, 'driveHours' | 'rating'>,
) {
  const flags: CalendarDayFlag[] = []
  if (day.driveHours >= 4) flags.push('transit')
  if (day.rating.score >= 90) flags.push('highlight')
  if (day.driveHours < 1.5) flags.push('short')

  const tone: CalendarDayTone = flags.length > 0 ? flags[0] : 'standard'

  return {
    tone,
    flags,
  } satisfies { tone: CalendarDayTone; flags: CalendarDayFlag[] }
}
