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
    <div className="mx-auto max-w-[1180px] px-5 py-14 lg:px-8 lg:py-20">
      <div className="site-kicker">Anthony admin</div>
      <h1 className="mt-3 text-[clamp(40px,6vw,68px)] font-semibold leading-[1] tracking-[-0.05em]">
        Run the public quest from here.
      </h1>
      <p className="mt-5 max-w-[720px] text-[15px] leading-[1.65] text-dim">
        Turn the tracker on or off, publish field updates, and decide which meetup
        invites become part of the public community page.
      </p>

      {error ? <div className="site-alert mt-7 text-warn">{error}</div> : null}
      {notice ? <div className="site-alert mt-7 text-good">{notice}</div> : null}

      <div className="mt-10 grid gap-5 lg:grid-cols-2">
        <form className="site-card p-6 sm:p-7" onSubmit={saveTrip}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="site-kicker">Tracker status</div>
              <h2 className="mt-2 text-[25px] font-semibold">Public trip profile</h2>
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-[12px] font-medium text-dim">
              <input type="checkbox" checked={trip.active} onChange={(event) => setTrip((current) => ({ ...current, active: event.target.checked }))} className="h-4 w-4 accent-[var(--accent)]" />
              Tracker active
            </label>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <label className="site-field-label sm:col-span-2">Trip title<input required className="site-input" value={trip.title} onChange={(event) => setTrip((current) => ({ ...current, title: event.target.value }))} /></label>
            <label className="site-field-label sm:col-span-2">Route name<input className="site-input" value={trip.routeName ?? ''} onChange={(event) => setTrip((current) => ({ ...current, routeName: event.target.value }))} /></label>
            <label className="site-field-label">Current day<input type="number" min={1} max={365} className="site-input" value={trip.dayNumber ?? ''} onChange={(event) => setTrip((current) => ({ ...current, dayNumber: event.target.value ? Number(event.target.value) : null }))} /></label>
            <label className="site-field-label">Total days<input type="number" min={1} max={365} className="site-input" value={trip.totalDays ?? ''} onChange={(event) => setTrip((current) => ({ ...current, totalDays: event.target.value ? Number(event.target.value) : null }))} /></label>
            <label className="site-field-label sm:col-span-2">Current location<input className="site-input" value={trip.currentLocation ?? ''} onChange={(event) => setTrip((current) => ({ ...current, currentLocation: event.target.value }))} /></label>
            <label className="site-field-label sm:col-span-2">Public headline<input className="site-input" value={trip.headline ?? ''} onChange={(event) => setTrip((current) => ({ ...current, headline: event.target.value }))} /></label>
            <label className="site-field-label sm:col-span-2">Status note<textarea rows={4} className="site-input resize-y" value={trip.body ?? ''} onChange={(event) => setTrip((current) => ({ ...current, body: event.target.value }))} /></label>
          </div>
          <button type="submit" className="site-primary-button mt-5">Save tracker</button>
        </form>

        <form className="site-card p-6 sm:p-7" onSubmit={publishUpdate}>
          <div className="site-kicker">Field update</div>
          <h2 className="mt-2 text-[25px] font-semibold">Publish what’s happening now</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <label className="site-field-label">Day<input type="number" min={1} max={365} className="site-input" value={update.dayNumber} onChange={(event) => setUpdate((current) => ({ ...current, dayNumber: event.target.value }))} /></label>
            <label className="site-field-label">Location<input required className="site-input" value={update.location} onChange={(event) => setUpdate((current) => ({ ...current, location: event.target.value }))} placeholder="Boulder, Colorado" /></label>
            <label className="site-field-label sm:col-span-2">Headline<input required minLength={3} maxLength={140} className="site-input" value={update.title} onChange={(event) => setUpdate((current) => ({ ...current, title: event.target.value }))} placeholder="Red Rocks before the snow" /></label>
            <label className="site-field-label sm:col-span-2">Update<textarea required minLength={10} maxLength={1200} rows={5} className="site-input resize-y" value={update.body} onChange={(event) => setUpdate((current) => ({ ...current, body: event.target.value }))} /></label>
            <label className="site-field-label sm:col-span-2">Visiting (optional)<input maxLength={240} className="site-input" value={update.visiting} onChange={(event) => setUpdate((current) => ({ ...current, visiting: event.target.value }))} placeholder="Red Rocks, downtown Denver, two Iconic Chargers" /></label>
          </div>
          <button type="submit" className="site-primary-button mt-5">Publish update</button>
        </form>
      </div>

      <section className="mt-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="site-kicker">Meetup moderation</div>
            <h2 className="mt-3 text-[31px] font-semibold tracking-[-0.04em]">Pending coffee invites</h2>
          </div>
          <div className="font-mono text-[10px] text-faint">{pendingMeetups.length} waiting</div>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {pendingMeetups.map((meetup) => (
            <article key={meetup.id} className="site-card p-5">
              <div className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-accent2">
                {meetup.city}, {meetup.state_code}{meetup.proposed_day ? ` · Day ${meetup.proposed_day}` : ''}
              </div>
              <p className="mt-3 text-[13.5px] leading-[1.6] text-dim">{meetup.message}</p>
              <div className="mt-4 text-[10.5px] text-faint">@{meetup.display_name}</div>
              <div className="mt-5 flex gap-2">
                <button type="button" onClick={() => void moderate(meetup.id, 'approved')} className="site-primary-button flex-1">Approve publicly</button>
                <button type="button" onClick={() => void moderate(meetup.id, 'declined')} className="site-secondary-button flex-1">Decline</button>
              </div>
            </article>
          ))}
          {pendingMeetups.length === 0 ? <div className="site-card p-7 text-[13px] text-faint">Nothing waiting for review.</div> : null}
        </div>
      </section>

      {community ? (
        <div className="mt-12 rounded-[12px] border border-edge bg-chip p-4 font-mono text-[10px] text-faint">
          Public snapshot: {community.updates.length} updates · {community.stateVotes.length} states · {community.suggestions.length} suggestions
        </div>
      ) : null}
    </div>
  )
}
