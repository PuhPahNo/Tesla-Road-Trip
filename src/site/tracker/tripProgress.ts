import type { AnthonyTrip, TripDayLogEntry } from '../../api/siteClient'
import type { DayPlan, RoutePlan } from '../../domain/types'

export type TripPhase = 'pre_trip' | 'live' | 'finished'
export type DayStatus = 'done' | 'today' | 'upcoming'

export interface TripProgress {
  phase: TripPhase
  /** The day Anthony is on right now (only while live). */
  currentDay?: number
  totalDays: number
  departureDate?: string
  completedDays: Set<number>
  milesDriven: number
  superchargersVisited: number
  statesVisited: number
  energyKwh: number
  hasEnergyData: boolean
  planned: {
    miles: number
    superchargers: number
    states: number
    driveHours: number
  }
}

/**
 * Everything the public pages show about progress comes from two manual
 * inputs: the trip's current day (set in admin) and the per-day log of
 * completed days with optional kWh. Nothing is inferred from the calendar,
 * so a rest day or a delay never shows the wrong place.
 */
export function buildTripProgress(
  route: RoutePlan | undefined,
  trip: AnthonyTrip | undefined,
  dayLog: TripDayLogEntry[] = [],
  departureDate?: string | null,
  now = new Date(),
): TripProgress {
  const totalDays = route?.totalDays ?? trip?.totalDays ?? 0
  const completedDays = new Set(dayLog.filter((entry) => entry.completed).map((entry) => entry.dayNumber))
  const doneDays = route?.days.filter((day) => completedDays.has(day.day)) ?? []

  const visitedStations = new Set<string>()
  const visitedStates = new Set<string>()
  for (const day of doneDays) {
    for (const visit of day.visits) {
      visitedStations.add(visit.station.id)
      if (visit.station.address.state) visitedStates.add(visit.station.address.state)
    }
  }

  const energyEntries = dayLog.filter((entry) => entry.energyKwh != null)
  const departure = departureDate ?? route?.tripStartDate ?? trip?.departureDate ?? undefined
  const finished = totalDays > 0 && completedDays.size >= totalDays
  // A tracker switched live early still reads as pre-trip until departure
  // day arrives or a day has actually been finished.
  const departed = completedDays.size > 0 || (daysUntil(departure, now) ?? 0) <= 0
  const live = !finished && departed && Boolean(trip?.active && trip.dayNumber)

  return {
    phase: finished ? 'finished' : live ? 'live' : 'pre_trip',
    currentDay: live ? trip?.dayNumber ?? undefined : undefined,
    totalDays,
    departureDate: departure,
    completedDays,
    milesDriven: doneDays.reduce((sum, day) => sum + day.miles, 0),
    superchargersVisited: visitedStations.size,
    statesVisited: visitedStates.size,
    energyKwh: energyEntries.reduce((sum, entry) => sum + (entry.energyKwh ?? 0), 0),
    hasEnergyData: energyEntries.length > 0,
    planned: {
      miles: route?.totalMiles ?? 0,
      superchargers: route?.uniqueStations ?? 0,
      states: route ? countStates(route) : 0,
      driveHours: route?.totalDriveHours ?? 0,
    },
  }
}

export function dayStatus(progress: TripProgress, dayNumber: number): DayStatus {
  if (progress.completedDays.has(dayNumber)) return 'done'
  if (progress.currentDay === dayNumber) return 'today'
  return 'upcoming'
}

export function countStates(route: RoutePlan) {
  return new Set(route.visits.map((visit) => visit.station.address.state).filter(Boolean)).size
}

export function dayEndLabel(day: DayPlan) {
  const finalStop = day.visits.at(-1)?.station
  if (!finalStop) return day.stay?.label ?? `Day ${day.day}`
  return `${finalStop.address.city}, ${finalStop.address.state}`
}

/** The trip starts and ends at home in Chattanooga. */
export const HOME_LABEL = 'Chattanooga, TN'

export function dayStartLabel(route: RoutePlan, day: DayPlan) {
  const previous = route.days.find((candidate) => candidate.day === day.day - 1)
  return previous ? dayEndLabel(previous) : HOME_LABEL
}

export function landmarksForDay(day: DayPlan) {
  return Array.from(
    new Set(day.rating.places.filter((place) => place.type === 'landmark').map((place) => place.label)),
  )
}

/** Calendar date of trip day N, given the departure date (YYYY-MM-DD). */
export function tripDayDate(departureDate: string | undefined, dayNumber: number) {
  if (!departureDate || !/^\d{4}-\d{2}-\d{2}$/.test(departureDate)) return undefined
  const date = new Date(`${departureDate}T12:00:00`)
  date.setDate(date.getDate() + dayNumber - 1)
  return date
}

export function formatShortDate(date: Date | undefined) {
  if (!date) return undefined
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(date)
}

export function formatLongDate(value: string | Date | undefined | null) {
  if (!value) return undefined
  const date = typeof value === 'string'
    ? new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value)
    : value
  return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(date)
}

export function daysUntil(dateOnly: string | undefined, now = new Date()) {
  if (!dateOnly) return undefined
  const target = new Date(`${dateOnly}T00:00:00`)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((target.getTime() - today.getTime()) / 86_400_000)
}

export function formatMiles(miles: number) {
  return Math.round(miles).toLocaleString('en-US')
}

export function formatRelativeTime(iso: string, now = Date.now()) {
  const seconds = Math.round((now - new Date(iso).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`
  return formatLongDate(iso) ?? ''
}
