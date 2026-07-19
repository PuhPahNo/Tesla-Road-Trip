import { useEffect, useState, type FormEvent } from 'react'
import {
  deleteAnthonyUpdate,
  deleteSuggestion,
  fetchAdminCommunity,
  moderateMeetup,
  publishAnthonyUpdate,
  reviewSuggestion,
  saveAnthonyTrip,
  updateAnthonyUpdate,
  type AnthonyUpdate,
  type AnthonyUpdatePhase,
  type AnthonyTrip,
  type CommunitySnapshot,
  type SuggestionInboxItem,
} from '../api/siteClient'
import { AdminAccountsSection } from './AdminAccountsSection'

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
  title: "Anthony's ChargeQuest",
  routeName: '',
  dayNumber: null,
  totalDays: 60,
  currentLocation: '',
  headline: '',
  body: '',
  latitude: null,
  longitude: null,
  startedAt: null,
  departureDate: null,
}

const EMPTY_UPDATE = {
  phase: 'planning' as AnthonyUpdatePhase,
  dayNumber: '',
  location: '',
  title: '',
  body: '',
  visiting: '',
  artifactUrl: '',
  artifactLabel: '',
  artifactType: 'link' as 'image' | 'video' | 'link',
}

export function AdminPage() {
  const [community, setCommunity] = useState<CommunitySnapshot>()
  const [pendingMeetups, setPendingMeetups] = useState<PendingMeetup[]>([])
  const [suggestionInbox, setSuggestionInbox] = useState<SuggestionInboxItem[]>([])
  const [trip, setTrip] = useState(EMPTY_TRIP)
  const [update, setUpdate] = useState(EMPTY_UPDATE)
  const [editingUpdateId, setEditingUpdateId] = useState<string>()
  const [notice, setNotice] = useState<string>()
  const [error, setError] = useState<string>()

  const load = async () => {
    try {
      const result = await fetchAdminCommunity()
      setCommunity(result.community)
      setPendingMeetups(result.pendingMeetups as unknown as PendingMeetup[])
      setSuggestionInbox(result.suggestionInbox ?? [])
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
        departureDate: current.departureDate ?? null,
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
      const input = {
        phase: update.phase,
        dayNumber: update.dayNumber ? Number(update.dayNumber) : undefined,
        location: update.location || undefined,
        title: update.title,
        body: update.body,
        visiting: update.visiting || undefined,
        artifactUrl: update.artifactUrl || undefined,
        artifactLabel: update.artifactLabel || undefined,
        artifactType: update.artifactUrl ? update.artifactType : undefined,
      }
      const result = editingUpdateId
        ? await updateAnthonyUpdate(editingUpdateId, input)
        : await publishAnthonyUpdate(input)
      setCommunity(result.community)
      setUpdate(EMPTY_UPDATE)
      setEditingUpdateId(undefined)
      setNotice(editingUpdateId ? 'Journey entry updated.' : 'Journey entry published.')
      await load()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to publish update.')
    }
  }

  const editUpdate = (entry: AnthonyUpdate) => {
    setEditingUpdateId(entry.id)
    setUpdate({
      phase: entry.phase,
      dayNumber: entry.day_number ? String(entry.day_number) : '',
      location: entry.location === 'Pre-trip' ? '' : entry.location,
      title: entry.title,
      body: entry.body,
      visiting: entry.visiting ?? '',
      artifactUrl: entry.artifact_url ?? '',
      artifactLabel: entry.artifact_label ?? '',
      artifactType: entry.artifact_type ?? 'link',
    })
    window.setTimeout(() => document.getElementById('journey-publisher')?.scrollIntoView({ behavior: 'smooth' }), 0)
  }

  const removeUpdate = async (id: string) => {
    try {
      const result = await deleteAnthonyUpdate(id)
      setCommunity(result.community)
      if (editingUpdateId === id) {
        setEditingUpdateId(undefined)
        setUpdate(EMPTY_UPDATE)
      }
      setNotice('Journey entry deleted.')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to delete the entry.')
    }
  }

  const updateSuggestionStatus = async (id: string, status: 'pending' | 'reviewed' | 'archived') => {
    try {
      await reviewSuggestion(id, status)
      setSuggestionInbox((current) => current.map((item) => item.id === id ? { ...item, review_status: status } : item))
      setNotice(`Suggestion marked ${status}.`)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to update the suggestion.')
    }
  }

  const removeSuggestion = async (id: string) => {
    try {
      await deleteSuggestion(id)
      setSuggestionInbox((current) => current.filter((item) => item.id !== id))
      setNotice('Suggestion deleted.')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to delete the suggestion.')
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
    <div className="mx-auto max-w-[1320px] px-4 py-8 sm:px-7 sm:py-14 lg:px-10 lg:py-16">
      <header className="flex flex-col justify-between gap-7 border-b border-edge pb-8 lg:flex-row lg:items-end">
        <div>
          <div className="site-kicker">Anthony admin</div>
          <h1 className="mt-3 max-w-[780px] text-[clamp(38px,5.6vw,66px)] font-semibold leading-[.98] tracking-[-0.05em]">
            Run the entire site from one place
          </h1>
          <p className="mt-4 max-w-[680px] text-[14px] leading-[1.65] text-dim">
            Manage users and their route activity, publish the full ChargeQuest journey,
            review private suggestions, and switch the tracker into live-trip mode when you leave.
          </p>
        </div>

        <div className="grid w-full grid-cols-3 overflow-hidden rounded-[14px] border border-edge bg-panel2 lg:w-auto">
          <AdminStat label="Tracker" value={trip.active ? 'Live' : 'Parked'} accent={trip.active} />
          <AdminStat label="Updates" value={community?.updates.length ?? 0} />
          <AdminStat label="Inbox" value={suggestionInbox.filter((item) => item.review_status === 'pending').length + pendingMeetups.length} />
        </div>
      </header>

      {error ? <div className="mt-6 rounded-[11px] border border-warn-bd bg-warn-bg px-4 py-3 text-[13px] text-warn">{error}</div> : null}
      {notice ? <div className="mt-6 rounded-[11px] border border-good-bd bg-good-bg px-4 py-3 text-[13px] text-good">{notice}</div> : null}

      <AdminAccountsSection />

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
                <label className="site-field-label sm:col-span-2">
                  Planned departure date
                  <input type="date" className="site-input" value={trip.departureDate ?? ''} onChange={(event) => setTrip((current) => ({ ...current, departureDate: event.target.value || null }))} />
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
          <form id="journey-publisher" className="admin-surface overflow-hidden" onSubmit={publishUpdate}>
            <div className="border-b border-edge px-5 py-5 sm:px-6">
              <AdminSectionTitle number="02" kicker="Journey publisher" title={editingUpdateId ? 'Edit timeline entry' : 'Publish progress'} />
            </div>
            <div className="space-y-4 p-5 sm:p-6">
              <label className="site-field-label">
                Entry type
                <select className="site-input" value={update.phase} onChange={(event) => setUpdate((current) => ({ ...current, phase: event.target.value as AnthonyUpdatePhase }))}>
                  <option value="planning">Planning the quest</option>
                  <option value="route-decision">Route decision</option>
                  <option value="build-note">Building CORE</option>
                  <option value="milestone">Milestone</option>
                  <option value="on-the-road">On the road</option>
                </select>
              </label>
              <div className="grid gap-4 sm:grid-cols-[110px_1fr]">
                <label className="site-field-label">
                  Day
                  <input type="number" min={1} max={365} className="site-input" value={update.dayNumber} onChange={(event) => setUpdate((current) => ({ ...current, dayNumber: event.target.value }))} />
                </label>
                <label className="site-field-label">
                  Location or context
                  <input className="site-input" value={update.location} onChange={(event) => setUpdate((current) => ({ ...current, location: event.target.value }))} placeholder="Optional before the trip" />
                </label>
              </div>
              <label className="site-field-label">
                Headline
                <input required minLength={3} maxLength={140} className="site-input" value={update.title} onChange={(event) => setUpdate((current) => ({ ...current, title: event.target.value }))} placeholder="Red Rocks before the snow" />
              </label>
              <label className="site-field-label">
                Update
                <textarea required minLength={10} maxLength={4000} rows={7} className="site-input resize-y" value={update.body} onChange={(event) => setUpdate((current) => ({ ...current, body: event.target.value }))} placeholder="What changed, what did you decide, or what should people see?" />
              </label>
              <label className="site-field-label">
                Visiting
                <input maxLength={240} className="site-input" value={update.visiting} onChange={(event) => setUpdate((current) => ({ ...current, visiting: event.target.value }))} placeholder="Red Rocks, downtown Denver, two Iconic Chargers" />
              </label>
              <fieldset className="grid gap-4 border-0 border-t border-edge p-0 pt-4 sm:grid-cols-[130px_1fr]">
                <label className="site-field-label">
                  Artifact type
                  <select className="site-input" value={update.artifactType} onChange={(event) => setUpdate((current) => ({ ...current, artifactType: event.target.value as 'image' | 'video' | 'link' }))}>
                    <option value="link">Link</option>
                    <option value="image">Image</option>
                    <option value="video">Video / vlog</option>
                  </select>
                </label>
                <label className="site-field-label">
                  Artifact URL
                  <input type="url" maxLength={500} className="site-input" value={update.artifactUrl} onChange={(event) => setUpdate((current) => ({ ...current, artifactUrl: event.target.value }))} placeholder="https://…" />
                </label>
                <label className="site-field-label sm:col-span-2">
                  Artifact label
                  <input maxLength={120} className="site-input" value={update.artifactLabel} onChange={(event) => setUpdate((current) => ({ ...current, artifactLabel: event.target.value }))} placeholder="Open the route comparison map" />
                </label>
              </fieldset>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button type="submit" className="site-primary-button min-h-12 flex-1">{editingUpdateId ? 'Save timeline entry' : 'Publish to Track Anthony'}</button>
                {editingUpdateId ? <button type="button" onClick={() => { setEditingUpdateId(undefined); setUpdate(EMPTY_UPDATE) }} className="site-secondary-button min-h-12">Cancel edit</button> : null}
              </div>
            </div>
          </form>

          {community ? (
            <div className="admin-surface p-5 sm:p-6">
              <div className="font-mono text-[8.5px] uppercase tracking-[0.12em] text-faint">Public snapshot</div>
              <div className="mt-4 grid grid-cols-3 divide-x divide-edge">
                <SnapshotStat label="Inbox" value={suggestionInbox.filter((item) => item.review_status === 'pending').length} />
                <SnapshotStat label="Meetups" value={pendingMeetups.length} />
                <SnapshotStat label="Updates" value={community.updates.length} />
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <section className="mt-12 border-t border-edge pt-10">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <AdminSectionTitle number="03" kicker="Published journey" title="Manage the Track Anthony timeline" />
          <div className="rounded-full border border-edge bg-chip px-4 py-2 font-mono text-[9px] text-faint">{community?.updates.length ?? 0} entries</div>
        </div>
        <div className="mt-6 border-t border-edge">
          {(community?.updates ?? []).map((entry) => (
            <JourneyAdminRow key={entry.id} entry={entry} onEdit={() => editUpdate(entry)} onDelete={() => removeUpdate(entry.id)} />
          ))}
          {community?.updates.length === 0 ? <div className="border-b border-edge py-10 text-[13px] text-faint">No public journey entries yet.</div> : null}
        </div>
      </section>

      <section className="mt-12 border-t border-edge pt-10">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <AdminSectionTitle number="04" kicker="Private community inbox" title="Route ideas sent to you" />
          <div className="rounded-full border border-edge bg-chip px-4 py-2 font-mono text-[9px] text-faint">
            {suggestionInbox.filter((item) => item.review_status === 'pending').length} unread
          </div>
        </div>
        <p className="mt-4 max-w-[720px] text-[13px] leading-[1.65] text-dim">Suggestions are private by default. Reviewing one does not publish it or promise that it will change the route.</p>
        <div className="mt-6 grid gap-4">
          {suggestionInbox.map((suggestion) => (
            <SuggestionAdminCard key={suggestion.id} suggestion={suggestion} onStatus={(status) => updateSuggestionStatus(suggestion.id, status)} onDelete={() => removeSuggestion(suggestion.id)} />
          ))}
          {suggestionInbox.length === 0 ? <div className="admin-surface p-6 text-[13px] text-faint">No route suggestions have arrived yet.</div> : null}
        </div>
      </section>

      <section className="mt-12 border-t border-edge pt-10">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <AdminSectionTitle number="05" kicker="Meetup moderation" title="Pending coffee invites" />
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

function JourneyAdminRow({ entry, onEdit, onDelete }: { entry: AnthonyUpdate; onEdit: () => void; onDelete: () => Promise<void> }) {
  const [deleteArmed, setDeleteArmed] = useState(false)
  return (
    <article className="grid gap-5 border-b border-edge py-6 lg:grid-cols-[190px_minmax(0,1fr)_230px] lg:items-center">
      <div>
        <div className="font-mono text-[8px] uppercase tracking-[0.1em] text-accent2">{entry.phase.replaceAll('-', ' ')}</div>
        <div className="mt-2 text-[10px] text-faint">{formatAdminDate(entry.created_at)}{entry.day_number ? ` · Day ${entry.day_number}` : ''}</div>
      </div>
      <div>
        <h3 className="text-[16px] font-semibold">{entry.title}</h3>
        <p className="mt-2 line-clamp-2 text-[12.5px] leading-[1.6] text-dim">{entry.body}</p>
        {entry.artifact_url ? <div className="mt-2 font-mono text-[7px] uppercase text-faint">Attached {entry.artifact_type ?? 'link'}</div> : null}
      </div>
      <div className="flex gap-2 lg:justify-end">
        <button type="button" onClick={onEdit} className="site-secondary-button flex-1 lg:flex-none">Edit</button>
        <button type="button" onClick={() => deleteArmed ? void onDelete() : setDeleteArmed(true)} onBlur={() => setDeleteArmed(false)} className={`min-h-11 flex-1 rounded-full border px-4 text-[11px] font-semibold lg:flex-none ${deleteArmed ? 'border-warn-bd bg-warn-bg text-warn' : 'border-edge text-faint'}`}>{deleteArmed ? 'Confirm delete' : 'Delete'}</button>
      </div>
    </article>
  )
}

function SuggestionAdminCard({ suggestion, onStatus, onDelete }: { suggestion: SuggestionInboxItem; onStatus: (status: 'pending' | 'reviewed' | 'archived') => Promise<void>; onDelete: () => Promise<void> }) {
  const [deleteArmed, setDeleteArmed] = useState(false)
  return (
    <article className={`admin-surface overflow-hidden ${suggestion.review_status === 'pending' ? 'ring-1 ring-accent2/35' : ''}`}>
      <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[180px_minmax(0,1fr)_220px] lg:items-start">
        <div>
          <div className="font-mono text-[8px] uppercase tracking-[0.1em] text-accent2">{suggestion.category}{suggestion.state_code ? ` · ${suggestion.state_code}` : ''}</div>
          <div className="mt-2 text-[11px] text-faint">@{suggestion.display_name}</div>
          <div className="mt-1 text-[10px] text-faint">{formatAdminDate(suggestion.created_at)}</div>
        </div>
        <div>
          <h3 className="text-[18px] font-semibold">{suggestion.title}</h3>
          <p className="mt-3 whitespace-pre-line text-[13px] leading-[1.65] text-dim">{suggestion.body}</p>
        </div>
        <div className="flex flex-col gap-2">
          <label className="site-field-label">
            Review status
            <select className="site-input" value={suggestion.review_status} onChange={(event) => void onStatus(event.target.value as 'pending' | 'reviewed' | 'archived')}>
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="archived">Archived</option>
            </select>
          </label>
          <button type="button" onClick={() => deleteArmed ? void onDelete() : setDeleteArmed(true)} onBlur={() => setDeleteArmed(false)} className={`min-h-11 rounded-full border px-4 text-[11px] font-semibold ${deleteArmed ? 'border-warn-bd bg-warn-bg text-warn' : 'border-edge text-faint'}`}>{deleteArmed ? 'Confirm delete' : 'Delete suggestion'}</button>
        </div>
      </div>
    </article>
  )
}

function formatAdminDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
}
