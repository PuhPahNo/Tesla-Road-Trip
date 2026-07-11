import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  createSuggestion,
  fetchCommunity,
  saveStateVote,
  toggleSuggestionVote,
  type CommunitySnapshot,
} from '../api/siteClient'
import { STATE_CODE_TO_NAME } from '../domain/usStates'
import { useAuth } from './AuthContext'

const STATE_OPTIONS = Object.entries(STATE_CODE_TO_NAME).sort((a, b) =>
  a[1].localeCompare(b[1]),
)

export function CommunityPage() {
  const { user } = useAuth()
  const [community, setCommunity] = useState<CommunitySnapshot>()
  const [error, setError] = useState<string>()
  const [notice, setNotice] = useState<string>()
  const [stateCode, setStateCode] = useState('CO')
  const [stateNote, setStateNote] = useState('')
  const [suggestion, setSuggestion] = useState({
    category: 'stop',
    title: '',
    body: '',
    stateCode: '',
  })

  const load = async () => {
    try {
      setCommunity(await fetchCommunity())
      setError(undefined)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load community.')
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const totalStateVotes = useMemo(
    () => community?.stateVotes.reduce((sum, item) => sum + Number(item.votes), 0) ?? 0,
    [community],
  )

  const submitStateVote = async (event: FormEvent) => {
    event.preventDefault()
    try {
      const result = await saveStateVote({ stateCode, note: stateNote || undefined })
      setCommunity(result.community)
      setStateNote('')
      setNotice(`You put ${STATE_CODE_TO_NAME[stateCode]} on Anthony’s community map.`)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to save vote.')
    }
  }

  const submitSuggestion = async (event: FormEvent) => {
    event.preventDefault()
    try {
      const result = await createSuggestion({
        ...suggestion,
        stateCode: suggestion.stateCode || undefined,
      })
      setCommunity(result.community)
      setSuggestion({ category: 'stop', title: '', body: '', stateCode: '' })
      setNotice('Your trip suggestion is now in the community feed.')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to share suggestion.')
    }
  }

  const voteSuggestion = async (id: string) => {
    try {
      setCommunity((await toggleSuggestionVote(id)).community)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to vote.')
    }
  }

  return (
    <div className="mx-auto max-w-[1240px] px-5 py-14 lg:px-8 lg:py-20">
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="site-kicker">Charge Quest community</div>
          <h1 className="mt-3 max-w-[760px] text-[clamp(42px,6vw,72px)] font-semibold leading-[0.98] tracking-[-0.05em]">
            Help shape the miles between the chargers.
          </h1>
          <p className="mt-6 max-w-[760px] text-[17px] leading-[1.65] text-dim">
            Share the stop only a local would know, vote for Anthony to come through
            your state, compare route ideas, and celebrate the trips people actually finish.
          </p>
        </div>
        <div className="site-card p-6">
          <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-faint">Community pulse</div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <CommunityMetric label="State votes" value={totalStateVotes} />
            <CommunityMetric label="Suggestions" value={community?.suggestions.length ?? 0} />
            <CommunityMetric label="Meetups" value={community?.meetups.length ?? 0} />
            <CommunityMetric label="Achievements" value={community?.achievements.length ?? 0} />
          </div>
        </div>
      </div>

      {error ? <div className="site-alert mt-7 text-warn">{error}</div> : null}
      {notice ? <div className="site-alert mt-7 text-good">{notice}</div> : null}

      <section className="mt-16 grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
        <div className="site-card p-6 sm:p-7">
          <div className="site-kicker">Put your state on the map</div>
          <h2 className="mt-3 text-[28px] font-semibold tracking-[-0.03em]">
            Where should Anthony make time for people?
          </h2>
          <p className="mt-3 text-[13.5px] leading-[1.6] text-dim">
            This is a signal, not a route demand. Vote for a state and add a short note
            about why you’d like him to pass through.
          </p>
          {user ? (
            <form className="mt-6" onSubmit={submitStateVote}>
              <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
                <label className="site-field-label">
                  State
                  <select value={stateCode} onChange={(event) => setStateCode(event.target.value)} className="site-input">
                    {STATE_OPTIONS.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
                  </select>
                </label>
                <label className="site-field-label">
                  Why this state?
                  <input
                    value={stateNote}
                    onChange={(event) => setStateNote(event.target.value)}
                    maxLength={240}
                    placeholder="Coffee in Denver, a route tip near Moab..."
                    className="site-input"
                  />
                </label>
              </div>
              <button className="site-primary-button mt-4" type="submit">Add my state vote</button>
            </form>
          ) : (
            <SignInPrompt text="Sign in to add your state to the map." />
          )}
        </div>

        <div className="site-card p-6 sm:p-7">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="site-kicker">Most requested states</div>
              <h2 className="mt-3 text-[28px] font-semibold tracking-[-0.03em]">The community map</h2>
            </div>
            <div className="font-mono text-[10px] text-faint">{totalStateVotes} total votes</div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {(community?.stateVotes ?? []).slice(0, 12).map((item) => (
              <div key={item.state_code} className="rounded-[12px] border border-edge bg-chip p-3">
                <div className="text-[13px] font-semibold">{STATE_CODE_TO_NAME[item.state_code] ?? item.state_code}</div>
                <div className="mt-1 font-mono text-[10px] text-accent2">{Number(item.votes)} vote{Number(item.votes) === 1 ? '' : 's'}</div>
              </div>
            ))}
            {community?.stateVotes.length === 0 ? (
              <div className="col-span-full rounded-[12px] border border-dashed border-edge p-6 text-center text-[13px] text-faint">
                No state votes yet. Be the first local on the map.
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mt-16 grid gap-5 lg:grid-cols-[1fr_380px]">
        <div>
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="site-kicker">Trip suggestions</div>
              <h2 className="mt-3 text-[32px] font-semibold tracking-[-0.035em]">Ideas worth rerouting for</h2>
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-3">
            {(community?.suggestions ?? []).map((item) => (
              <article key={item.id} className="site-card p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-accent2">
                      {item.category}{item.state_code ? ` · ${item.state_code}` : ''}
                    </div>
                    <h3 className="mt-2 text-[19px] font-semibold">{item.title}</h3>
                  </div>
                  <button
                    type="button"
                    disabled={!user}
                    onClick={() => void voteSuggestion(item.id)}
                    aria-label={`Vote for ${item.title}`}
                    className={`cursor-pointer rounded-full border px-3 py-1.5 font-mono text-[10px] ${item.viewer_voted ? 'border-accent2 bg-good-bg text-accent2' : 'border-edge bg-chip text-dim'} disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    ▲ {Number(item.votes)}
                  </button>
                </div>
                <p className="mt-3 text-[13.5px] leading-[1.6] text-dim">{item.body}</p>
                <div className="mt-4 text-[10.5px] text-faint">Shared by {item.display_name} · {formatDate(item.created_at)}</div>
              </article>
            ))}
            {community?.suggestions.length === 0 ? (
              <div className="site-card p-8 text-center text-[13px] text-faint">No suggestions yet. Start the useful part of the conversation.</div>
            ) : null}
          </div>
        </div>

        <aside className="site-card h-fit p-6 lg:sticky lg:top-24">
          <div className="site-kicker">Share a suggestion</div>
          <h2 className="mt-3 text-[24px] font-semibold">What would you tell a friend?</h2>
          {user ? (
            <form className="mt-5 flex flex-col gap-3" onSubmit={submitSuggestion}>
              <label className="site-field-label">
                Category
                <select className="site-input" value={suggestion.category} onChange={(event) => setSuggestion((current) => ({ ...current, category: event.target.value }))}>
                  <option value="stop">Must-see stop</option>
                  <option value="food">Food</option>
                  <option value="scenery">Scenery</option>
                  <option value="charging">Charging</option>
                  <option value="route">Route idea</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <label className="site-field-label">
                State (optional)
                <select className="site-input" value={suggestion.stateCode} onChange={(event) => setSuggestion((current) => ({ ...current, stateCode: event.target.value }))}>
                  <option value="">Anywhere</option>
                  {STATE_OPTIONS.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
                </select>
              </label>
              <label className="site-field-label">
                Title
                <input required minLength={3} maxLength={100} className="site-input" value={suggestion.title} onChange={(event) => setSuggestion((current) => ({ ...current, title: event.target.value }))} placeholder="The sunrise pullout locals use" />
              </label>
              <label className="site-field-label">
                Details
                <textarea required minLength={10} maxLength={800} rows={5} className="site-input resize-y" value={suggestion.body} onChange={(event) => setSuggestion((current) => ({ ...current, body: event.target.value }))} placeholder="Why it is worth the time and what to know before going." />
              </label>
              <button className="site-primary-button" type="submit">Publish suggestion</button>
            </form>
          ) : (
            <SignInPrompt text="Sign in to publish suggestions and vote on the best ones." />
          )}
        </aside>
      </section>

      <section className="mt-16 border-t border-edge pt-14">
        <div className="site-kicker">Community achievements</div>
        <h2 className="mt-3 text-[32px] font-semibold tracking-[-0.035em]">Trips people are proud of</h2>
        <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {(community?.achievements ?? []).map((item) => (
            <article key={item.id} className="site-card p-5">
              <div className="text-[22px]">⚡</div>
              <h3 className="mt-3 text-[17px] font-semibold">{item.title}</h3>
              <p className="mt-2 text-[13px] leading-[1.55] text-dim">{item.description}</p>
              <div className="mt-4 text-[10.5px] text-faint">{item.display_name}{item.route_name ? ` · ${item.route_name}` : ''}</div>
            </article>
          ))}
          {community?.achievements.length === 0 ? (
            <div className="site-card p-7 text-[13px] text-faint">Achievements will show up as members share them from their account page.</div>
          ) : null}
        </div>
      </section>
    </div>
  )
}

function CommunityMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[11px] border border-edge bg-chip p-3">
      <div className="text-[24px] font-semibold">{value}</div>
      <div className="mt-1 font-mono text-[8.5px] uppercase tracking-[0.08em] text-faint">{label}</div>
    </div>
  )
}

function SignInPrompt({ text }: { text: string }) {
  return (
    <div className="mt-6 rounded-[12px] border border-dashed border-edge p-5 text-[13px] text-dim">
      {text}{' '}
      <Link to="/login" className="font-semibold text-accent no-underline">Sign in</Link>
      {' '}or{' '}
      <Link to="/signup" className="font-semibold text-accent no-underline">create a free account</Link>.
    </div>
  )
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(value))
}
