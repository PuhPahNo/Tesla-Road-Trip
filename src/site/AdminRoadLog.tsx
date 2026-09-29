import { useState } from 'react'
import {
  saveTripDayLog,
  type CommunitySnapshot,
  type PublishedAnthonyRoute,
  type TripDayLogEntry,
} from '../api/siteClient'
import type { DayPlan } from '../domain/types'

/**
 * The public tracker's progress comes from here: finishing a day marks it
 * done (miles, Superchargers and states count toward the totals), records
 * optional kWh, and moves the public "current day" forward.
 */
export function AdminRoadLog({
  route,
  community,
  onSaved,
  onError,
}: {
  route: PublishedAnthonyRoute
  community: CommunitySnapshot
  onSaved: (community: CommunitySnapshot, message: string) => void
  onError: (message: string) => void
}) {
  const days = route.route.days
  const dayLog = community.dayLog ?? []
  const log = new Map(dayLog.map((entry) => [entry.dayNumber, entry]))
  const currentDay = community.trip.dayNumber ?? undefined
  const nextToFinish =
    days.find((day) => day.day === currentDay && !log.get(day.day)?.completed) ??
    days.find((day) => !log.get(day.day)?.completed)

  return (
    <div className="space-y-6">
      {nextToFinish ? (
        <FinishDayCard
          key={nextToFinish.day}
          day={nextToFinish}
          isLast={nextToFinish.day === days.at(-1)?.day}
          tripActive={community.trip.active}
          onSaved={onSaved}
          onError={onError}
        />
      ) : (
        <div className="rounded-[13px] border border-good-bd bg-good-bg px-4 py-4 text-[13px] text-good">
          Every day is logged. The tracker shows the trip as complete.
        </div>
      )}

      <details className="rounded-[13px] border border-edge bg-chip">
        <summary className="cursor-pointer list-none px-4 py-3.5 text-[13px] font-semibold">
          Edit any day ({dayLog.filter((entry) => entry.completed).length} of {days.length} done)
        </summary>
        <div className="max-h-[520px] divide-y divide-edge overflow-y-auto border-t border-edge">
          {days.map((day) => (
            <DayLogRow key={day.day} day={day} entry={log.get(day.day)} onSaved={onSaved} onError={onError} />
          ))}
        </div>
      </details>
    </div>
  )
}

function FinishDayCard({
  day,
  isLast,
  tripActive,
  onSaved,
  onError,
}: {
  day: DayPlan
  isLast: boolean
  tripActive: boolean
  onSaved: (community: CommunitySnapshot, message: string) => void
  onError: (message: string) => void
}) {
  const [kwh, setKwh] = useState('')
  const [busy, setBusy] = useState(false)

  const finish = async () => {
    setBusy(true)
    try {
      const lastStop = day.visits.at(-1)?.station
      const result = await saveTripDayLog(day.day, {
        completed: true,
        energyKwh: kwh ? Number(kwh) : null,
        advanceTrip: !isLast,
        currentLocation: dayEnd(day),
        latitude: lastStop?.position.lat,
        longitude: lastStop?.position.lon,
      })
      onSaved(result.community, isLast ? `Day ${day.day} done. That’s the whole trip!` : `Day ${day.day} done. The tracker now shows day ${day.day + 1}.`)
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Unable to finish the day.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-[13px] border border-edge bg-panel p-4 sm:p-5">
      <div className="font-mono text-[8.5px] uppercase tracking-[0.1em] text-accent2">Next to finish</div>
      <div className="mt-1 text-[17px] font-semibold">
        Day {day.day} · {dayEnd(day)}
      </div>
      <div className="mt-1 text-[12px] text-dim">
        {Math.round(day.miles)} mi · {day.visits.length} Supercharger{day.visits.length === 1 ? '' : 's'}
      </div>
      {!tripActive ? (
        <p className="mt-3 text-[12px] leading-[1.5] text-warn">
          The tracker is parked. Switch it live above when you leave so visitors see “On the road”.
        </p>
      ) : null}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="site-field-label sm:w-[180px]">
          kWh added today (optional)
          <input
            type="number"
            inputMode="decimal"
            min={0}
            max={2000}
            step="0.1"
            className="site-input"
            value={kwh}
            onChange={(event) => setKwh(event.target.value)}
            placeholder="e.g. 142"
          />
        </label>
        <button type="button" disabled={busy} onClick={() => void finish()} className="site-primary-button min-h-12 flex-1 disabled:opacity-60">
          {busy ? 'Saving…' : isLast ? `Finish day ${day.day} and the trip` : `Finish day ${day.day} → start day ${day.day + 1}`}
        </button>
      </div>
    </div>
  )
}

function DayLogRow({
  day,
  entry,
  onSaved,
  onError,
}: {
  day: DayPlan
  entry?: TripDayLogEntry
  onSaved: (community: CommunitySnapshot, message: string) => void
  onError: (message: string) => void
}) {
  const [completed, setCompleted] = useState(entry?.completed ?? false)
  const [kwh, setKwh] = useState(entry?.energyKwh != null ? String(entry.energyKwh) : '')
  const [busy, setBusy] = useState(false)
  const dirty = completed !== (entry?.completed ?? false) || kwh !== (entry?.energyKwh != null ? String(entry.energyKwh) : '')

  const save = async () => {
    setBusy(true)
    try {
      const result = await saveTripDayLog(day.day, { completed, energyKwh: kwh ? Number(kwh) : null })
      onSaved(result.community, `Day ${day.day} saved.`)
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Unable to save the day.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid grid-cols-[auto_1fr_88px_auto] items-center gap-3 px-4 py-2.5">
      <input
        type="checkbox"
        checked={completed}
        onChange={(event) => setCompleted(event.target.checked)}
        className="h-5 w-5 accent-[var(--accent)]"
        aria-label={`Day ${day.day} done`}
      />
      <div className="min-w-0">
        <div className="truncate text-[13px] font-medium">Day {day.day} · {dayEnd(day)}</div>
      </div>
      <input
        type="number"
        inputMode="decimal"
        min={0}
        step="0.1"
        className="site-input !min-h-9 !py-1.5 text-[13px]"
        value={kwh}
        onChange={(event) => setKwh(event.target.value)}
        placeholder="kWh"
        aria-label={`Day ${day.day} kWh`}
      />
      <button
        type="button"
        disabled={!dirty || busy}
        onClick={() => void save()}
        className="site-secondary-button !min-h-9 px-3 text-[12px] disabled:opacity-40"
      >
        Save
      </button>
    </div>
  )
}

function dayEnd(day: DayPlan) {
  const stop = day.visits.at(-1)?.station
  return stop ? `${stop.address.city}, ${stop.address.state}` : `Day ${day.day}`
}
