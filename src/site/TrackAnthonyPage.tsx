import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { ArrowUpRight, CalendarDays, MapPin, Route } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  fetchCommunity,
  sendMeetupInvite,
  type AnthonyUpdate,
  type AnthonyUpdatePhase,
  type CommunitySnapshot,
} from '../api/siteClient'
import { STATE_CODE_TO_NAME } from '../domain/usStates'
import { useAuth } from './AuthContext'
import { usePageMetadata } from './usePageMetadata'

const STATES = Object.entries(STATE_CODE_TO_NAME).sort((a, b) =>
  a[1].localeCompare(b[1]),
)

const PHASE_LABELS: Record<AnthonyUpdatePhase, string> = {
  planning: 'Planning the quest',
  'route-decision': 'Route decision',
  'build-note': 'Building CORE',
  milestone: 'Milestone',
  'on-the-road': 'On the road',
}

export function TrackAnthonyPage() {
  const { user } = useAuth()
  const [community, setCommunity] = useState<CommunitySnapshot>()
  const [error, setError] = useState<string>()
  const [notice, setNotice] = useState<string>()
  const [invite, setInvite] = useState({ stateCode: 'CO', city: '', proposedDay: '', message: '' })

  usePageMetadata({
    title: 'Track Anthony’s ChargeQuest | From Route Build to the Road',
    description: 'Follow Anthony’s chronological ChargeQuest build log: CORE development, route decisions, planning artifacts, milestones, and live Tesla road-trip updates.',
    path: '/track-anthony',
  })

  useEffect(() => {
    void fetchCommunity().then(setCommunity).catch((requestError) => {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load Anthony’s timeline.')
    })
  }, [])

  const trip = community?.trip
  const updates = community?.updates ?? []
  const progress = useMemo(() => {
    if (!trip?.active || !trip.dayNumber || !trip.totalDays) return 0
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
    return <div className="min-h-[65vh] bg-black px-5 py-20 text-white/40">Loading Anthony’s quest…</div>
  }

  return (
    <div className="bg-[#f1eee6] text-[#0a0b0d]">
      <section className="relative overflow-hidden bg-black px-4 py-16 text-white sm:px-6 sm:py-24 lg:px-12 lg:py-32">
        <div className="pointer-events-none absolute -right-40 -top-52 h-[680px] w-[680px] rounded-full bg-[#e82127]/18 blur-[150px]" />
        <div className="relative mx-auto max-w-[1240px]">
          {error ? <div className="mb-6 rounded-[10px] bg-[#e82127] px-4 py-3 text-[13px] text-white">{error}</div> : null}
          {notice ? <div className="mb-6 rounded-[10px] bg-[#23d7d1] px-4 py-3 text-[13px] font-semibold text-black">{notice}</div> : null}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.15em] text-[#23d7d1]">
              <span className={`h-2 w-2 rounded-full ${trip?.active ? 'animate-pulse bg-[#23d7d1]' : 'bg-[#e82127]'}`} />
              {trip?.active ? 'The quest is live' : 'The road to ChargeQuest'}
            </div>
            {trip?.updatedAt ? <div className="font-mono text-[8px] uppercase tracking-[0.1em] text-white/32">Latest activity {formatTimestamp(trip.updatedAt)}</div> : null}
          </div>

          <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_340px] lg:items-end">
            <div>
              <h1 className="max-w-[880px] text-[clamp(48px,10vw,112px)] font-semibold leading-[0.86] tracking-[-0.068em]">
                {trip?.active ? (trip.headline || trip.title) : 'I’m building the route in public'}
              </h1>
              <p className="mt-8 max-w-[720px] text-[17px] leading-[1.75] text-white/62">
                {trip?.active
                  ? (trip.body || 'I’m on the road. The next field update is coming soon.')
                  : 'This is the chronological record—from building CORE and comparing route ideas to making the final cuts and, eventually, testing the plan on the road.'}
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <a href="#journey-log" className="flex min-h-12 items-center justify-center rounded-full bg-[#e82127] px-6 py-3.5 text-[13px] font-semibold text-white no-underline">Read the journey log</a>
                <Link to="/community" className="flex min-h-12 items-center justify-center rounded-full border border-white/35 px-6 py-3.5 text-[13px] font-semibold text-white no-underline hover:border-white">Send me a route idea</Link>
              </div>
            </div>

            <div className="border-y border-white/15">
              <HeroFact icon={<Route size={15} />} label="Current route" value={trip?.routeName || 'Still being decided'} />
              <HeroFact icon={<CalendarDays size={15} />} label={trip?.active ? 'Trip progress' : 'Departure'} value={trip?.active ? `Day ${trip.dayNumber ?? '—'} of ${trip.totalDays ?? '—'}` : formatDeparture(trip?.departureDate)} />
              <HeroFact icon={<MapPin size={15} />} label={trip?.active ? 'Current area' : 'Current stage'} value={trip?.active ? (trip.currentLocation || 'En route') : (updates[0] ? PHASE_LABELS[updates[0].phase] : 'Planning')} />
              {trip?.active ? (
                <div className="py-5">
                  <div className="mb-2 flex justify-between font-mono text-[7.5px] uppercase tracking-[0.09em] text-white/35"><span>Quest progress</span><span>{Math.round(progress)}%</span></div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/12"><div className="h-full bg-[#e82127]" style={{ width: `${progress}%` }} /></div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section id="journey-log" className="mx-auto grid max-w-[1240px] gap-12 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-[minmax(0,1fr)_330px] lg:px-8 lg:py-36">
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-black/42">Chronological journey log</div>
          <h2 className="mt-4 max-w-[760px] text-[clamp(40px,7vw,74px)] font-semibold leading-[0.92] tracking-[-0.058em]">The decisions before the miles</h2>
          <p className="mt-6 max-w-[700px] text-[15px] leading-[1.75] text-black/55">
            These entries can be route decisions, CORE build notes, planning artifacts,
            milestones, or road updates. It is one story in order—not a separate blog and
            not a fake community feed.
          </p>

          <div className="relative mt-12 border-t border-black/15">
            {updates.map((update, index) => <TimelineEntry key={update.id} update={update} index={index} />)}
            {updates.length === 0 ? (
              <div className="border-b border-black/15 py-12">
                <div className="font-mono text-[8px] uppercase tracking-[0.12em] text-[#e82127]">The first entry is coming</div>
                <p className="mt-4 max-w-[620px] text-[14px] leading-[1.7] text-black/55">I’m organizing the first route comparison and build notes now. Send me a route idea if there is something you think belongs in the first test.</p>
              </div>
            ) : null}
          </div>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-28 lg:h-fit">
          <div className="bg-black p-6 text-white">
            <div className="font-mono text-[8px] uppercase tracking-[0.13em] text-[#23d7d1]">How this page works</div>
            <ol className="mt-5 space-y-5">
              <AsideStep number="01" title="Before the trip">Route battles, product decisions, maps, vlogs, and the final plan.</AsideStep>
              <AsideStep number="02" title="On the road">Current progress, field notes, charging evidence, and approved meetups.</AsideStep>
              <AsideStep number="03" title="Afterward">What held up, what broke, and what another driver can actually use.</AsideStep>
            </ol>
          </div>

          <div className="border border-black/14 bg-white/45 p-6">
            <div className="font-mono text-[8px] uppercase tracking-[0.13em] text-black/38">You can influence the next entry</div>
            <h3 className="mt-3 text-[25px] font-semibold tracking-[-0.04em]">See a route problem I missed?</h3>
            <p className="mt-4 text-[13px] leading-[1.65] text-black/55">Suggestions go to me privately. Nothing is posted automatically.</p>
            <Link to="/community" className="mt-6 flex min-h-11 items-center justify-between rounded-full bg-[#e82127] px-5 py-3 text-[12px] font-semibold text-white no-underline">Send the idea <ArrowUpRight size={15} /></Link>
          </div>
        </aside>
      </section>

      {trip?.active ? (
        <section className="bg-[#090a0c] px-4 py-20 text-white sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto grid max-w-[1120px] gap-10 lg:grid-cols-[.8fr_1.2fr]">
            <div>
              <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#23d7d1]">Meet along the route</div>
              <h2 className="mt-4 text-[clamp(38px,7vw,68px)] font-semibold leading-[.93] tracking-[-0.055em]">Coffee when our routes cross?</h2>
              <p className="mt-6 text-[14px] leading-[1.7] text-white/52">Invites stay private until I approve them. Public entries show only what the sender intended to share.</p>
            </div>
            {user ? (
              <form className="grid gap-4 border border-white/15 bg-white/[.04] p-5 sm:grid-cols-2 sm:p-7" onSubmit={submitInvite}>
                <label className="site-field-label text-white/42">State<select className="site-input" value={invite.stateCode} onChange={(event) => setInvite((current) => ({ ...current, stateCode: event.target.value }))}>{STATES.map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select></label>
                <label className="site-field-label text-white/42">City<input required minLength={2} maxLength={80} className="site-input" value={invite.city} onChange={(event) => setInvite((current) => ({ ...current, city: event.target.value }))} /></label>
                <label className="site-field-label text-white/42 sm:col-span-2">Possible trip day<input type="number" min={1} max={365} className="site-input" value={invite.proposedDay} onChange={(event) => setInvite((current) => ({ ...current, proposedDay: event.target.value }))} /></label>
                <label className="site-field-label text-white/42 sm:col-span-2">Message<textarea required minLength={10} maxLength={600} rows={4} className="site-input resize-y" value={invite.message} onChange={(event) => setInvite((current) => ({ ...current, message: event.target.value }))} /></label>
                <button type="submit" className="site-primary-button sm:col-span-2">Send invite to Anthony</button>
              </form>
            ) : (
              <div className="border border-white/15 p-7 text-[14px] text-white/55"><Link to="/login" className="font-semibold text-white">Sign in</Link> to send a meetup invite.</div>
            )}
          </div>
        </section>
      ) : null}
    </div>
  )
}

function TimelineEntry({ update, index }: { update: AnthonyUpdate; index: number }) {
  const showLocation = update.location && update.location !== 'Pre-trip'
  return (
    <article className="grid gap-4 border-b border-black/15 py-8 sm:grid-cols-[54px_minmax(0,1fr)] sm:py-10">
      <div className="font-mono text-[9px] text-black/28">{String(index + 1).padStart(2, '0')}</div>
      <div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-[8px] uppercase tracking-[0.1em]">
          <span className="text-[#e82127]">{PHASE_LABELS[update.phase]}</span>
          <span className="text-black/25">{formatTimestamp(update.created_at)}</span>
          {update.day_number ? <span className="text-black/35">Day {update.day_number}</span> : null}
          {showLocation ? <span className="text-black/35">{update.location}</span> : null}
        </div>
        <h3 className="mt-3 text-[clamp(25px,4vw,36px)] font-semibold leading-[1.02] tracking-[-0.045em]">{update.title}</h3>
        <p className="mt-5 whitespace-pre-line text-[14.5px] leading-[1.75] text-black/60">{update.body}</p>
        {update.visiting ? <div className="mt-5 border-l-2 border-[#e82127] pl-4 text-[12px] leading-[1.6] text-black/52">On the list: {update.visiting}</div> : null}
        {update.artifact_url ? (
          <a href={update.artifact_url} target="_blank" rel="noreferrer" className="mt-6 flex min-h-12 items-center justify-between border border-black/15 bg-white/50 px-4 py-3 text-[12px] font-semibold text-black no-underline hover:border-black/35">
            <span><span className="mr-2 font-mono text-[7px] uppercase text-[#e82127]">{update.artifact_type ?? 'link'}</span>{update.artifact_label || 'Open the attached artifact'}</span>
            <ArrowUpRight size={15} aria-hidden="true" />
          </a>
        ) : null}
      </div>
    </article>
  )
}

function HeroFact({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="grid grid-cols-[22px_110px_minmax(0,1fr)] items-center gap-2 border-b border-white/15 py-5 last:border-b-0"><span className="text-[#23d7d1]">{icon}</span><span className="font-mono text-[7.5px] uppercase tracking-[0.09em] text-white/35">{label}</span><span className="text-right text-[12.5px] font-semibold">{value}</span></div>
}

function AsideStep({ number, title, children }: { number: string; title: string; children: ReactNode }) {
  return <li className="grid list-none grid-cols-[26px_1fr] gap-3"><span className="font-mono text-[8px] text-[#e82127]">{number}</span><div><div className="text-[13px] font-semibold">{title}</div><p className="mt-1 text-[11.5px] leading-[1.55] text-white/42">{children}</p></div></li>
}

function formatDeparture(value?: string | null) {
  if (!value) return 'Not announced yet'
  return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(`${value}T12:00:00`))
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
}
