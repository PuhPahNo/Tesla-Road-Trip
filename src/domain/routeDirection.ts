import type {
  CompassDirection,
  Coordinate,
  RouteDirectionPreference,
} from './types'

export const MONTH_OPTIONS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
].map((label, index) => ({ value: index + 1, label }))

export const ROUTE_DIRECTION_OPTIONS: Array<{
  value: RouteDirectionPreference
  label: string
}> = [
  { value: 'seasonal', label: 'Season-smart' },
  { value: 'north', label: 'North first' },
  { value: 'south', label: 'South first' },
  { value: 'west', label: 'West first' },
  { value: 'east', label: 'East first' },
]

export function resolveInitialDirection(
  preference: RouteDirectionPreference | undefined,
  startMonth: number | undefined,
  start: Coordinate,
): CompassDirection | undefined {
  if (!preference) return undefined
  if (preference !== 'seasonal') return preference
  if (!startMonth) return undefined

  // In winter, leave cold weather behind first. Chattanooga and most other
  // continental starts still have meaningful territory to the south.
  if ((startMonth === 12 || startMonth <= 2) && start.lat > 25) return 'south'
  // In summer, take advantage of the northern states before the season turns.
  if (startMonth >= 6 && startMonth <= 8 && start.lat < 48) return 'north'

  // Spring and fall keep the efficient anchor order unless the user explicitly
  // chooses a heading.
  return undefined
}

export function directionPreferenceDescription(
  preference: RouteDirectionPreference,
  startMonth: number,
  start: Coordinate,
) {
  const resolved = resolveInitialDirection(preference, startMonth, start)
  const month = MONTH_OPTIONS[startMonth - 1]?.label ?? 'Selected month'

  if (preference === 'seasonal') {
    return resolved
      ? `${month} starts ${resolved} first to use the season well.`
      : `${month} keeps the most efficient loop unless you choose a heading.`
  }

  return `The optimized loop starts ${preference} first.`
}
