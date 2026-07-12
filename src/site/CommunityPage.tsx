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
import { usePageMetadata } from './usePageMetadata'

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

  usePageMetadata({
    title: 'ChargeQuest Community | Tesla Route Ideas and 2026 Trip Updates',
    description: 'Join Tesla road-trip competitors sharing Supercharger route ideas, must-see stops, state votes, meetup invitations, achievements, and live 2026 ChargeQuest updates.',
    path: '/community',
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
      setNotice(`You put ${STATE_CODE_TO_NAME[stateCode]} on the community map.`)
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
    <>
      <section className="grid min-h-[650px] bg-black text-white lg:grid-cols-[1.08fr_.92fr]">
        <div className="flex items-center px-4 py-16 sm:px-5 sm:py-20 lg:px-12 xl:px-[max(5rem,calc((100vw-1440px)/2))]">
          <div className="max-w-[760px]">
            <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#23d7d1]">A route-planning community</div>
            <h1 className="mt-5 text-[clamp(42px,12vw,112px)] font-semibold leading-[0.9] tracking-[-0.06em] sm:leading-[0.86] sm:tracking-[-0.07em]">
              Better routes start with local knowledge
            </h1>
            <p className="mt-7 max-w-[650px] text-[17px] leading-[1.7] text-white/62">
              Bring the stop only a local would know, make the case for a state worth
              more time, and compare strategies with other 2026 competitors. Every
              good idea can strengthen the first live route—or inspire your own.
            </p>

            {!user ? (
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link to="/signup?returnTo=%2Fcommunity" className="flex min-h-12 w-full items-center justify-center rounded-full bg-[#e82127] px-6 py-3.5 text-center text-[13px] font-semibold text-white no-underline shadow-[0_12px_35px_rgba(232,33,39,.32)] transition hover:bg-white hover:text-black sm:w-auto">
                  Create an account and share an idea
                </Link>
                <Link to="/login?returnTo=%2Fcommunity" className="flex min-h-12 w-full items-center justify-center rounded-full border border-white/40 bg-black/35 px-6 py-3.5 text-center text-[13px] font-semibold text-white no-underline transition hover:border-white sm:w-auto">
                  Sign in
                </Link>
              </div>
            ) : (
              <div className="mt-9 font-mono text-[9px] uppercase tracking-[0.12em] text-white/45">
                Signed in as {user.username} · Your ideas help everyone plan
              </div>
            )}

            <div className="mt-12 grid grid-cols-2 border-y border-white/15 sm:grid-cols-4">
              <PulseMetric label="State votes" value={totalStateVotes} />
              <PulseMetric label="Suggestions" value={community?.suggestions.length ?? 0} />
              <PulseMetric label="Meetups" value={community?.meetups.length ?? 0} />
              <PulseMetric label="Achievements" value={community?.achievements.length ?? 0} />
            </div>
          </div>
        </div>

        <div className="relative min-h-[360px] overflow-hidden sm:min-h-[500px] lg:min-h-full">
          <img
            src="/landing/yellowstone-bison.jpg"
            alt="Bison walking along a road in Yellowstone National Park"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/15 lg:bg-gradient-to-r lg:from-black/45 lg:via-transparent lg:to-transparent" />
          <div className="absolute bottom-6 right-6 font-mono text-[8px] uppercase tracking-[0.1em] text-white/45">
            Yellowstone · Zac Bowling / Unsplash
          </div>
        </div>
      </section>

      <div className="bg-[#f1eee6] text-[#0a0b0d]">
        {(error || notice) ? (
          <div className="mx-auto max-w-[1320px] px-5 pt-8 lg:px-8">
            {error ? <div className="rounded-[10px] bg-[#e82127] px-4 py-3 text-[13px] text-white">{error}</div> : null}
            {notice ? <div className="rounded-[10px] bg-[#0a0b0d] px-4 py-3 text-[13px] text-white">{notice}</div> : null}
          </div>
        ) : null}

        <section className="mx-auto grid max-w-[1320px] gap-12 px-4 py-20 sm:gap-16 sm:px-5 sm:py-28 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:py-36">
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-black/45">Where should a great route lead?</div>
            <h2 className="mt-5 max-w-[760px] text-[clamp(40px,11vw,98px)] font-semibold leading-[0.92] tracking-[-0.055em] sm:leading-[0.87] sm:tracking-[-0.067em]">
              Put your state on the community map
            </h2>
            <p className="mt-7 max-w-[620px] text-[16px] leading-[1.7] text-black/60">
              Pick a state and make the local case for it. The leaderboard shows where
              the community sees the strongest reasons to stop, explore, and reroute.
            </p>

            {user ? (
              <form className="mt-10 max-w-[700px] border-t border-black/15 pt-7" onSubmit={submitStateVote}>
                <div className="grid gap-4 sm:grid-cols-[190px_1fr]">
                  <label className="cq-light-field">
                    State
                    <select value={stateCode} onChange={(event) => setStateCode(event.target.value)}>
                      {STATE_OPTIONS.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
                    </select>
                  </label>
                  <label className="cq-light-field">
                    What makes it worth the drive
                    <input
                      value={stateNote}
                      onChange={(event) => setStateNote(event.target.value)}
                      maxLength={240}
                      placeholder="Coffee in Denver, a route tip near Moab…"
                    />
                  </label>
                </div>
                <button className="mt-5 min-h-12 w-full rounded-full bg-[#e82127] px-6 py-3.5 text-center text-[13px] font-semibold text-white shadow-[0_12px_30px_rgba(232,33,39,.25)] sm:w-auto" type="submit">
                  Add my state to the map
                </button>
              </form>
            ) : (
              <CommunityJoinPrompt text="Create a free account to vote for your state and help the community find its next detour" />
            )}
          </div>

          <div className="lg:pt-10">
            <div className="flex items-end justify-between border-b border-black/15 pb-5">
              <div>
                <div className="font-mono text-[9px] uppercase tracking-[0.13em] text-black/40">Most requested</div>
                <h3 className="mt-2 text-[28px] font-semibold tracking-[-0.035em]">States making a case</h3>
              </div>
              <div className="font-mono text-[9px] text-black/40">{totalStateVotes} votes</div>
            </div>
            <div>
              {(community?.stateVotes ?? []).slice(0, 10).map((item, index) => (
                <div key={item.state_code} className="grid min-w-0 grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-2 border-b border-black/12 py-4 sm:grid-cols-[48px_minmax(0,1fr)_auto] sm:gap-0">
                  <div className="font-mono text-[10px] text-black/30">{String(index + 1).padStart(2, '0')}</div>
                  <div className="min-w-0 truncate text-[16px] font-semibold sm:text-[18px]">{STATE_CODE_TO_NAME[item.state_code] ?? item.state_code}</div>
                  <div className="whitespace-nowrap font-mono text-[9px] text-[#e82127] sm:text-[10px]">{Number(item.votes)} vote{Number(item.votes) === 1 ? '' : 's'}</div>
                </div>
              ))}
              {community?.stateVotes.length === 0 ? (
                <div className="border-b border-black/15 py-10 text-[14px] text-black/45">No state votes yet. Claim the first spot on the leaderboard</div>
              ) : null}
            </div>
          </div>
        </section>
      </div>

      <section className="bg-[#090a0c] px-4 py-20 text-white sm:px-5 sm:py-24 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-[1320px]">
          <div className="grid gap-12 lg:grid-cols-[1fr_390px]">
            <div>
              <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#23d7d1]">Ideas worth rerouting for</div>
              <h2 className="mt-5 max-w-[820px] text-[clamp(40px,11vw,88px)] font-semibold leading-[0.93] tracking-[-0.055em] sm:leading-[0.9] sm:tracking-[-0.063em]">
                Give every route a local advantage
              </h2>
              <div className="mt-12 border-t border-white/15">
                {(community?.suggestions ?? []).map((item, index) => (
                  <article key={item.id} className="grid gap-5 border-b border-white/15 py-7 sm:grid-cols-[52px_1fr_auto]">
                    <div className="font-mono text-[9px] text-white/25">{String(index + 1).padStart(2, '0')}</div>
                    <div>
                      <div className="font-mono text-[8px] uppercase tracking-[0.12em] text-[#23d7d1]">
                        {item.category}{item.state_code ? ` · ${item.state_code}` : ''}
                      </div>
                      <h3 className="mt-2 text-[22px] font-semibold tracking-[-0.025em]">{item.title}</h3>
                      <p className="mt-3 max-w-[700px] text-[13.5px] leading-[1.65] text-white/55">{item.body}</p>
                      <div className="mt-4 font-mono text-[8px] uppercase tracking-[0.08em] text-white/25">
                        {item.display_name} · {formatDate(item.created_at)}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={!user}
                      onClick={() => void voteSuggestion(item.id)}
                      aria-label={`Vote for ${item.title}`}
                      className={`h-11 w-full rounded-full border px-4 py-2 font-mono text-[10px] sm:h-fit sm:w-auto ${item.viewer_voted ? 'border-[#23d7d1] bg-[#23d7d1] text-black' : 'border-white/30 bg-black/30 text-white/75'} disabled:cursor-not-allowed disabled:opacity-35`}
                    >
                      ▲ {Number(item.votes)}
                    </button>
                  </article>
                ))}
                {community?.suggestions.length === 0 ? (
                  <div className="border-b border-white/15 py-12 text-[14px] text-white/40">No suggestions yet. Be the local who changes someone’s route</div>
                ) : null}
              </div>
            </div>

            <aside className="h-fit bg-[#e82127] p-6 sm:p-8 lg:sticky lg:top-24">
              <div className="font-mono text-[8px] uppercase tracking-[0.14em] text-white/60">Share what another driver would miss</div>
              <h3 className="mt-4 text-[32px] font-semibold leading-[1] tracking-[-0.045em]">What would you tell a friend?</h3>
              {user ? (
                <form className="cq-red-form mt-7 flex flex-col gap-4" onSubmit={submitSuggestion}>
                  <label>
                    Category
                    <select value={suggestion.category} onChange={(event) => setSuggestion((current) => ({ ...current, category: event.target.value }))}>
                      <option value="stop">Must-see stop</option>
                      <option value="food">Food</option>
                      <option value="scenery">Scenery</option>
                      <option value="charging">Charging</option>
                      <option value="route">Route idea</option>
                      <option value="other">Other</option>
                    </select>
                  </label>
                  <label>
                    State
                    <select value={suggestion.stateCode} onChange={(event) => setSuggestion((current) => ({ ...current, stateCode: event.target.value }))}>
                      <option value="">Anywhere</option>
                      {STATE_OPTIONS.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
                    </select>
                  </label>
                  <label>
                    Title
                    <input required minLength={3} maxLength={100} value={suggestion.title} onChange={(event) => setSuggestion((current) => ({ ...current, title: event.target.value }))} placeholder="The sunrise pullout locals use" />
                  </label>
                  <label>
                    Why it is worth the time
                    <textarea required minLength={10} maxLength={800} rows={5} value={suggestion.body} onChange={(event) => setSuggestion((current) => ({ ...current, body: event.target.value }))} />
                  </label>
                  <button className="min-h-12 w-full rounded-full bg-black px-5 py-3.5 text-center text-[12px] font-semibold text-white" type="submit">Publish suggestion</button>
                </form>
              ) : (
                <div className="mt-7 border-t border-white/25 pt-6 text-[13px] leading-[1.6] text-white/75">
                  Create an account to publish suggestions and vote on the ideas that could make any route better.
                  <Link to="/signup?returnTo=%2Fcommunity" className="mt-5 flex min-h-12 w-full items-center justify-center rounded-full bg-white px-5 py-3 text-center text-[12px] font-semibold text-black no-underline sm:w-fit">
                    Join the community
                  </Link>
                </div>
              )}
            </aside>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-black px-4 py-20 text-white sm:px-5 sm:py-24 lg:px-8 lg:py-32">
        <img src="/landing/golden-gate.jpg" alt="Golden Gate Bridge at dusk" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-35" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/35" />
        <div className="relative mx-auto max-w-[1320px]">
          <div className="max-w-[760px]">
            <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#23d7d1]">Community achievements</div>
            <h2 className="mt-5 text-[clamp(40px,11vw,92px)] font-semibold leading-[0.93] tracking-[-0.055em] sm:leading-[0.9] sm:tracking-[-0.065em]">Routes worth talking about</h2>
          </div>
          <div className="mt-12 grid gap-px overflow-hidden border border-white/15 bg-white/15 md:grid-cols-2 lg:grid-cols-3">
            {(community?.achievements ?? []).map((item) => (
              <article key={item.id} className="min-h-[220px] bg-black/80 p-6 backdrop-blur-md">
                <div className="font-mono text-[9px] text-[#23d7d1]">ACHIEVEMENT</div>
                <h3 className="mt-5 text-[21px] font-semibold">{item.title}</h3>
                <p className="mt-3 text-[13px] leading-[1.6] text-white/55">{item.description}</p>
                <div className="mt-6 font-mono text-[8px] uppercase text-white/30">{item.display_name}{item.route_name ? ` · ${item.route_name}` : ''}</div>
              </article>
            ))}
            {community?.achievements.length === 0 ? (
              <div className="min-h-[220px] bg-black/80 p-7 text-[14px] leading-[1.7] text-white/45 backdrop-blur-md">
                The first community achievements will appear here when members share them from their accounts
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </>
  )
}

function PulseMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="cq-mobile-metric border-r border-white/15 px-3 py-5 first:pl-0 last:border-r-0 sm:px-4">
      <div className="text-[24px] font-semibold tracking-[-0.035em]">{value}</div>
      <div className="mt-1 font-mono text-[7.5px] uppercase tracking-[0.09em] text-white/35">{label}</div>
    </div>
  )
}

function CommunityJoinPrompt({ text }: { text: string }) {
  return (
    <div className="mt-9 border-t border-black/15 pt-6 text-[14px] text-black/55">
      {text}
      <Link to="/signup?returnTo=%2Fcommunity" className="mt-5 flex min-h-12 w-full items-center justify-center rounded-full bg-[#e82127] px-6 py-3.5 text-center text-[12px] font-semibold text-white no-underline sm:w-fit">
        Create a free account
      </Link>
    </div>
  )
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(value))
}
