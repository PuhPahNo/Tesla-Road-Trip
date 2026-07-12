import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  fetchCommunity,
  sendMeetupInvite,
  type CommunitySnapshot,
} from '../api/siteClient'
import { STATE_CODE_TO_NAME } from '../domain/usStates'
import { useAuth } from './AuthContext'

const STATES = Object.entries(STATE_CODE_TO_NAME).sort((a, b) =>
  a[1].localeCompare(b[1]),
)

export function TrackAnthonyPage() {
  const { user } = useAuth()
  const [community, setCommunity] = useState<CommunitySnapshot>()
  const [error, setError] = useState<string>()
  const [notice, setNotice] = useState<string>()
  const [invite, setInvite] = useState({
    stateCode: 'CO',
    city: '',
    proposedDay: '',
    message: '',
  })

  useEffect(() => {
    void fetchCommunity().then(setCommunity).catch((requestError) => {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load trip tracker.')
    })
  }, [])

  const trip = community?.trip
  const progress = useMemo(() => {
    if (!trip?.dayNumber || !trip.totalDays) return 0
    return Math.max(0, Math.min(100, (trip.dayNumber / trip.totalDays) * 100))
  }, [trip])

  const submitInvite = async (event: FormEvent) => {
    event.preventDefault()
    try {
      const result = await sendMeetupInvite({
        stateCode: invite.stateCode,
        city: invite.city,
        proposedDay: invite.proposedDay ? Number(invite.proposedDay) : undefined,
        message: invite.message,
      })
      setInvite({ stateCode: 'CO', city: '', proposedDay: '', message: '' })
      setNotice(result.message)
      setError(undefined)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to send invite.')
    }
  }

  if (!community && !error) {
    return <div className="mx-auto min-h-[65vh] max-w-[1240px] px-4 py-16 text-faint sm:px-5 sm:py-20">Loading Anthony’s quest…</div>
  }

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-10 sm:px-5 sm:py-14 lg:px-8 lg:py-20">
      {error ? <div className="site-alert mb-6 text-warn">{error}</div> : null}
      {notice ? <div className="site-alert mb-6 text-good">{notice}</div> : null}

      {!trip?.active ? (
        <section className="mx-auto flex min-h-[52vh] max-w-[760px] flex-col items-center justify-center py-8 text-center sm:min-h-[58vh] sm:py-0">
          <div className="flex h-16 w-16 items-center justify-center rounded-[20px] border border-edge bg-chip text-[30px]">⚡</div>
          <div className="site-kicker mt-7">Track Anthony</div>
          <h1 className="mt-4 text-[clamp(36px,10vw,76px)] font-semibold leading-[.98] tracking-[-0.05em]">
            The live quest hasn’t started yet.
          </h1>
          <p className="mt-6 max-w-[640px] text-[16px] leading-[1.65] text-dim">
            When I hit the road, this page will show my current day, location,
            latest stop, progress, and community meetups. For now, you can build your
            own route or help shape the community map.
          </p>
          <div className="mt-8 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
            <Link to="/planner" className="site-primary-button w-full no-underline sm:w-auto">Plan your trip</Link>
            <Link to="/community" className="site-secondary-button w-full no-underline sm:w-auto">Visit the community</Link>
          </div>
        </section>
      ) : (
        <>
          <section className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
            <div className="site-card overflow-hidden p-5 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] text-good">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-good" /> Live quest
                </div>
                <div className="font-mono text-[10px] text-faint">
                  Updated {formatTimestamp(trip.updatedAt)}
                </div>
              </div>
              <h1 className="mt-5 text-[clamp(38px,6vw,68px)] font-semibold leading-[.98] tracking-[-0.05em]">
                {trip.headline || trip.title}
              </h1>
              <p className="mt-5 max-w-[700px] text-[16px] leading-[1.65] text-dim">
                {trip.body || 'Anthony is on the road. The next field update is coming soon.'}
              </p>
              <div className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <TrackerMetric label="Day" value={`${trip.dayNumber ?? '—'} / ${trip.totalDays ?? '—'}`} />
                <TrackerMetric label="Current location" value={trip.currentLocation || 'En route'} />
                <TrackerMetric label="Route" value={trip.routeName || 'ChargeQuest'} />
                <TrackerMetric label="Progress" value={`${Math.round(progress)}%`} />
              </div>
              <div className="mt-7 h-2 overflow-hidden rounded-full bg-chip">
                <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <div className="site-card p-5 sm:p-7">
              <div className="site-kicker">Meet along the route</div>
              <h2 className="mt-3 text-[26px] font-semibold">“Coffee on me when you hit Colorado.”</h2>
              <p className="mt-3 text-[13.5px] leading-[1.6] text-dim">
                Send a city, possible trip day, and a short note. Invites stay private
                until I approve them for the public tracker.
              </p>
              {user ? (
                <form className="mt-5 flex flex-col gap-3" onSubmit={submitInvite}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="site-field-label">
                      State
                      <select className="site-input" value={invite.stateCode} onChange={(event) => setInvite((current) => ({ ...current, stateCode: event.target.value }))}>
                        {STATES.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
                      </select>
                    </label>
                    <label className="site-field-label">
                      City
                      <input required minLength={2} maxLength={80} className="site-input" value={invite.city} onChange={(event) => setInvite((current) => ({ ...current, city: event.target.value }))} placeholder="Denver" />
                    </label>
                  </div>
                  <label className="site-field-label">
                    Possible trip day (optional)
                    <input type="number" min={1} max={365} className="site-input" value={invite.proposedDay} onChange={(event) => setInvite((current) => ({ ...current, proposedDay: event.target.value }))} placeholder="47" />
                  </label>
                  <label className="site-field-label">
                    Message
                    <textarea required minLength={10} maxLength={600} rows={4} className="site-input resize-y" value={invite.message} onChange={(event) => setInvite((current) => ({ ...current, message: event.target.value }))} placeholder="I’m local and know a coffee shop right off your route…" />
                  </label>
                  <button type="submit" className="site-primary-button w-full">Send invite to Anthony</button>
                </form>
              ) : (
                <div className="mt-5 rounded-[12px] border border-dashed border-edge p-5 text-[13px] text-dim">
                  <Link to="/login" className="font-semibold text-accent no-underline">Sign in</Link> to send Anthony a meetup invite.
                </div>
              )}
            </div>
          </section>

          <section className="mt-14 grid gap-6 lg:grid-cols-[1fr_360px]">
            <div>
              <div className="site-kicker">Field log</div>
              <h2 className="mt-3 text-[34px] font-semibold tracking-[-0.04em]">Latest trip updates</h2>
              <div className="mt-6 flex flex-col gap-3">
                {(community?.updates ?? []).map((update) => (
                  <article key={update.id} className="site-card p-5 sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-accent2">
                        {update.day_number ? `Day ${update.day_number} · ` : ''}{update.location}
                      </div>
                      <div className="text-[10.5px] text-faint">{formatTimestamp(update.created_at)}</div>
                    </div>
                    <h3 className="mt-3 text-[21px] font-semibold">{update.title}</h3>
                    <p className="mt-3 text-[14px] leading-[1.65] text-dim">{update.body}</p>
                    {update.visiting ? <div className="mt-4 rounded-[10px] border border-edge bg-chip px-3 py-2 text-[12px] text-dim">Visiting: {update.visiting}</div> : null}
                  </article>
                ))}
              </div>
            </div>

            <aside>
              <div className="site-card p-6">
                <div className="site-kicker">Approved meetups</div>
                <div className="mt-5 flex flex-col gap-3">
                  {(community?.meetups ?? []).map((meetup) => (
                    <div key={meetup.id} className="rounded-[12px] border border-edge bg-chip p-4">
                      <div className="text-[13px] font-semibold">{meetup.city}, {meetup.state_code}</div>
                      <div className="mt-1 font-mono text-[9px] text-accent2">{meetup.proposed_day ? `Around day ${meetup.proposed_day}` : 'Timing flexible'}</div>
                      <p className="mt-3 text-[12px] leading-[1.5] text-dim">{meetup.message}</p>
                      <div className="mt-3 text-[10px] text-faint">— {meetup.display_name}</div>
                    </div>
                  ))}
                  {community?.meetups.length === 0 ? <div className="text-[12.5px] leading-[1.6] text-faint">No approved meetups yet. Send the first invite.</div> : null}
                </div>
              </div>
            </aside>
          </section>
        </>
      )}
    </div>
  )
}

function TrackerMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[12px] border border-edge bg-chip p-3">
      <div className="font-mono text-[8px] uppercase tracking-[0.09em] text-faint">{label}</div>
      <div className="mt-2 line-clamp-2 text-[13px] font-semibold">{value}</div>
    </div>
  )
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}
