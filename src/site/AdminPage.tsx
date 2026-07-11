import { useEffect, useState, type FormEvent } from 'react'
import {
  fetchAdminCommunity,
  moderateMeetup,
  publishAnthonyUpdate,
  saveAnthonyTrip,
  type AnthonyTrip,
  type CommunitySnapshot,
} from '../api/siteClient'

interface PendingMeetup {
  id: string
  state_code: string
  city: string
  proposed_day?: number | null
  message: string
  display_name: string
  created_at: string
}

const EMPTY_TRIP: Omit<AnthonyTrip, 'updatedAt'> = {
  active: false,
  title: "Anthony's Charge Quest",
  routeName: '',
  dayNumber: null,
  totalDays: 60,
  currentLocation: '',
  headline: '',
  body: '',
  latitude: null,
  longitude: null,
  startedAt: null,
}

export function AdminPage() {
  const [community, setCommunity] = useState<CommunitySnapshot>()
  const [pendingMeetups, setPendingMeetups] = useState<PendingMeetup[]>([])
  const [trip, setTrip] = useState(EMPTY_TRIP)
  const [update, setUpdate] = useState({
    dayNumber: '',
    location: '',
    title: '',
    body: '',
    visiting: '',
  })
  const [notice, setNotice] = useState<string>()
  const [error, setError] = useState<string>()

  const load = async () => {
    try {
      const result = await fetchAdminCommunity()
      setCommunity(result.community)
      setPendingMeetups(result.pendingMeetups as unknown as PendingMeetup[])
      const current = result.community.trip
      setTrip({
        active: current.active,
        title: current.title,
        routeName: current.routeName ?? '',
        dayNumber: current.dayNumber ?? null,
        totalDays: current.totalDays ?? 60,
        currentLocation: current.currentLocation ?? '',
        headline: current.headline ?? '',
        body: current.body ?? '',
        latitude: current.latitude ?? null,
        longitude: current.longitude ?? null,
        startedAt: current.startedAt ?? null,
      })
      setError(undefined)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load admin.')
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const saveTrip = async (event: FormEvent) => {
    event.preventDefault()
    try {
      const result = await saveAnthonyTrip(trip)
      setCommunity(result.community)
      setNotice(trip.active ? 'The live tracker is active and updated.' : 'The live tracker is now parked.')
      setError(undefined)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to save trip.')
    }
  }

  const publishUpdate = async (event: FormEvent) => {
    event.preventDefault()
    try {
      const result = await publishAnthonyUpdate({
        ...update,
        dayNumber: update.dayNumber ? Number(update.dayNumber) : undefined,
        visiting: update.visiting || undefined,
      })
      setCommunity(result.community)
      setUpdate({ dayNumber: '', location: '', title: '', body: '', visiting: '' })
      setNotice('Trip update published and the tracker is live.')
      await load()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to publish update.')
    }
  }

  const moderate = async (id: string, status: 'approved' | 'declined') => {
    try {
      await moderateMeetup(id, status)
      setPendingMeetups((current) => current.filter((item) => item.id !== id))
      setNotice(`Meetup ${status}.`)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to moderate meetup.')
    }
  }

  return (
    <div className="mx-auto max-w-[1320px] px-5 py-10 sm:px-7 sm:py-14 lg:px-10 lg:py-16">
      <header className="flex flex-col justify-between gap-7 border-b border-edge pb-8 lg:flex-row lg:items-end">
        <div>
          <div className="site-kicker">Anthony admin</div>
          <h1 className="mt-3 max-w-[780px] text-[clamp(38px,5.6vw,66px)] font-semibold leading-[.98] tracking-[-0.05em]">
            Run the public quest from one place
          </h1>
          <p className="mt-4 max-w-[680px] text-[14px] leading-[1.65] text-dim">
            Control the live tracker, publish field updates, and review meetup invites before they appear publicly
          </p>
        </div>

        <div className="grid grid-cols-3 overflow-hidden rounded-[14px] border border-edge bg-panel2">
          <AdminStat label="Tracker" value={trip.active ? 'Live' : 'Parked'} accent={trip.active} />
          <AdminStat label="Updates" value={community?.updates.length ?? 0} />
          <AdminStat label="Waiting" value={pendingMeetups.length} />
        </div>
      </header>

      {error ? <div className="mt-6 rounded-[11px] border border-warn-bd bg-warn-bg px-4 py-3 text-[13px] text-warn">{error}</div> : null}
      {notice ? <div className="mt-6 rounded-[11px] border border-good-bd bg-good-bg px-4 py-3 text-[13px] text-good">{notice}</div> : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(350px,.85fr)] lg:items-start">
        <form className="admin-surface overflow-hidden" onSubmit={saveTrip}>
          <div className="flex flex-col justify-between gap-5 border-b border-edge px-5 py-5 sm:flex-row sm:items-center sm:px-7">
            <AdminSectionTitle number="01" kicker="Tracker control" title="Public trip profile" />
            <label className={`flex cursor-pointer items-center justify-between gap-4 rounded-full border px-4 py-2.5 text-[11.5px] font-semibold ${trip.active ? 'border-good-bd bg-good-bg text-good' : 'border-edge bg-chip text-dim'}`}>
              <span className={`h-2 w-2 rounded-full ${trip.active ? 'animate-pulse bg-good' : 'bg-faint'}`} />
              {trip.active ? 'Tracker live' : 'Tracker parked'}
              <input
                type="checkbox"
                checked={trip.active}
                onChange={(event) => setTrip((current) => ({ ...current, active: event.target.checked }))}
                className="h-4 w-4 accent-[var(--accent)]"
                aria-label="Tracker active"
              />
            </label>
          </div>

          <div className="space-y-8 p-5 sm:p-7">
            <fieldset className="border-0 p-0">
              <legend className="admin-fieldset-title">Trip identity</legend>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="site-field-label sm:col-span-2">
                  Trip title
                  <input required className="site-input" value={trip.title} onChange={(event) => setTrip((current) => ({ ...current, title: event.target.value }))} />
                </label>
                <label className="site-field-label sm:col-span-2">
                  Route name
                  <input className="site-input" value={trip.routeName ?? ''} onChange={(event) => setTrip((current) => ({ ...current, routeName: event.target.value }))} placeholder="The Long Way Home" />
                </label>
              </div>
            </fieldset>

            <fieldset className="border-0 border-t border-edge p-0 pt-7">
              <legend className="admin-fieldset-title">Live progress</legend>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="site-field-label">
                  Current day
                  <input type="number" min={1} max={365} className="site-input" value={trip.dayNumber ?? ''} onChange={(event) => setTrip((current) => ({ ...current, dayNumber: event.target.value ? Number(event.target.value) : null }))} placeholder="1" />
                </label>
                <label className="site-field-label">
                  Total days
                  <input type="number" min={1} max={365} className="site-input" value={trip.totalDays ?? ''} onChange={(event) => setTrip((current) => ({ ...current, totalDays: event.target.value ? Number(event.target.value) : null }))} />
                </label>
                <label className="site-field-label sm:col-span-2">
                  Current location
                  <input className="site-input" value={trip.currentLocation ?? ''} onChange={(event) => setTrip((current) => ({ ...current, currentLocation: event.target.value }))} placeholder="Boulder, Colorado" />
                </label>
              </div>
            </fieldset>

            <fieldset className="border-0 border-t border-edge p-0 pt-7">
              <legend className="admin-fieldset-title">Public status</legend>
              <div className="mt-4 grid gap-4">
                <label className="site-field-label">
                  Public headline
                  <input className="site-input" value={trip.headline ?? ''} onChange={(event) => setTrip((current) => ({ ...current, headline: event.target.value }))} placeholder="Day 12: heading into the Rockies" />
                </label>
                <label className="site-field-label">
                  Status note
                  <textarea rows={5} className="site-input resize-y" value={trip.body ?? ''} onChange={(event) => setTrip((current) => ({ ...current, body: event.target.value }))} placeholder="What should the public know right now?" />
                </label>
              </div>
            </fieldset>

            <button type="submit" className="site-primary-button min-h-12 w-full">Save tracker profile</button>
          </div>
        </form>

        <div className="space-y-6 lg:sticky lg:top-24">
          <form className="admin-surface overflow-hidden" onSubmit={publishUpdate}>
            <div className="border-b border-edge px-5 py-5 sm:px-6">
              <AdminSectionTitle number="02" kicker="Field update" title="Publish what’s happening now" />
            </div>
            <div className="space-y-4 p-5 sm:p-6">
              <div className="grid gap-4 sm:grid-cols-[110px_1fr]">
                <label className="site-field-label">
                  Day
                  <input type="number" min={1} max={365} className="site-input" value={update.dayNumber} onChange={(event) => setUpdate((current) => ({ ...current, dayNumber: event.target.value }))} />
                </label>
                <label className="site-field-label">
                  Location
                  <input required className="site-input" value={update.location} onChange={(event) => setUpdate((current) => ({ ...current, location: event.target.value }))} placeholder="Boulder, Colorado" />
                </label>
              </div>
              <label className="site-field-label">
                Headline
                <input required minLength={3} maxLength={140} className="site-input" value={update.title} onChange={(event) => setUpdate((current) => ({ ...current, title: event.target.value }))} placeholder="Red Rocks before the snow" />
              </label>
              <label className="site-field-label">
                Update
                <textarea required minLength={10} maxLength={1200} rows={6} className="site-input resize-y" value={update.body} onChange={(event) => setUpdate((current) => ({ ...current, body: event.target.value }))} placeholder="What happened today?" />
              </label>
              <label className="site-field-label">
                Visiting
                <input maxLength={240} className="site-input" value={update.visiting} onChange={(event) => setUpdate((current) => ({ ...current, visiting: event.target.value }))} placeholder="Red Rocks, downtown Denver, two Iconic Chargers" />
              </label>
              <button type="submit" className="site-primary-button min-h-12 w-full">Publish field update</button>
            </div>
          </form>

          {community ? (
            <div className="admin-surface p-5 sm:p-6">
              <div className="font-mono text-[8.5px] uppercase tracking-[0.12em] text-faint">Public snapshot</div>
              <div className="mt-4 grid grid-cols-3 divide-x divide-edge">
                <SnapshotStat label="States" value={community.stateVotes.length} />
                <SnapshotStat label="Ideas" value={community.suggestions.length} />
                <SnapshotStat label="Updates" value={community.updates.length} />
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <section className="mt-12 border-t border-edge pt-10">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <AdminSectionTitle number="03" kicker="Meetup moderation" title="Pending coffee invites" />
          <div className="rounded-full border border-edge bg-chip px-4 py-2 font-mono text-[9px] text-faint">
            {pendingMeetups.length} waiting
          </div>
        </div>

        <div className="mt-6 border-t border-edge">
          {pendingMeetups.map((meetup) => (
            <article key={meetup.id} className="grid gap-5 border-b border-edge py-6 lg:grid-cols-[190px_1fr_260px] lg:items-center">
              <div>
                <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-accent2">
                  {meetup.city}, {meetup.state_code}
                </div>
                <div className="mt-2 text-[11px] text-faint">
                  {meetup.proposed_day ? `Around day ${meetup.proposed_day}` : 'Timing flexible'} · @{meetup.display_name}
                </div>
              </div>
              <p className="m-0 text-[13.5px] leading-[1.65] text-dim">{meetup.message}</p>
              <div className="flex gap-2 lg:justify-end">
                <button type="button" onClick={() => void moderate(meetup.id, 'approved')} className="site-primary-button flex-1 lg:flex-none">Approve</button>
                <button type="button" onClick={() => void moderate(meetup.id, 'declined')} className="site-secondary-button flex-1 lg:flex-none">Decline</button>
              </div>
            </article>
          ))}
          {pendingMeetups.length === 0 ? (
            <div className="border-b border-edge py-10 text-[13px] text-faint">Nothing is waiting for review</div>
          ) : null}
        </div>
      </section>
    </div>
  )
}

function AdminSectionTitle({ number, kicker, title }: { number: string; kicker: string; title: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 font-mono text-[9px] text-accent2">{number}</div>
      <div>
        <div className="font-mono text-[8.5px] uppercase tracking-[0.12em] text-faint">{kicker}</div>
        <h2 className="mt-1 text-[23px] font-semibold tracking-[-0.03em]">{title}</h2>
      </div>
    </div>
  )
}

function AdminStat({ label, value, accent = false }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="min-w-[92px] border-r border-edge px-4 py-3 last:border-r-0">
      <div className="font-mono text-[7.5px] uppercase tracking-[0.1em] text-faint">{label}</div>
      <div className={`mt-1.5 text-[15px] font-semibold ${accent ? 'text-good' : 'text-ink'}`}>{value}</div>
    </div>
  )
}

function SnapshotStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="px-3 text-center first:pl-0 last:pr-0">
      <div className="text-[23px] font-semibold tracking-[-0.035em]">{value}</div>
      <div className="mt-1 font-mono text-[7.5px] uppercase tracking-[0.1em] text-faint">{label}</div>
    </div>
  )
}
