import { useState, type FormEvent, type ReactNode } from 'react'
import { ArrowRight, Lightbulb, MapPinned, Route } from 'lucide-react'
import { Link } from 'react-router-dom'
import { createSuggestion } from '../api/siteClient'
import { STATE_CODE_TO_NAME } from '../domain/usStates'
import { useAuth } from './AuthContext'
import { ANTHONY_EMAIL_HREF } from './contact'
import { usePageMetadata } from './usePageMetadata'

const STATE_OPTIONS = Object.entries(STATE_CODE_TO_NAME).sort((a, b) =>
  a[1].localeCompare(b[1]),
)

export function CommunityPage() {
  const { user } = useAuth()
  const [error, setError] = useState<string>()
  const [notice, setNotice] = useState<string>()
  const [busy, setBusy] = useState(false)
  const [suggestion, setSuggestion] = useState({
    category: 'route',
    title: '',
    body: '',
    stateCode: '',
  })

  usePageMetadata({
    title: 'Send Anthony a Route Idea | ChargeQuest Community',
    description: 'Send Anthony a private route suggestion, local stop, charging tip, or challenge as he builds the first ChargeQuest and prepares for the 2026 trip.',
    path: '/community',
  })

  const submitSuggestion = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    try {
      await createSuggestion({
        ...suggestion,
        stateCode: suggestion.stateCode || undefined,
      })
      setSuggestion({ category: 'route', title: '', body: '', stateCode: '' })
      setNotice('Sent. Your idea is now in Anthony’s private review inbox.')
      setError(undefined)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to send your idea.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="bg-[#f1eee6] text-[#0a0b0d]">
      <section className="grid min-h-[650px] bg-black text-white lg:grid-cols-[1.06fr_.94fr]">
        <div className="flex items-center px-4 py-16 sm:px-6 sm:py-24 lg:px-12 xl:px-[max(5rem,calc((100vw-1440px)/2))]">
          <div className="max-w-[760px]">
            <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#23d7d1]">Help shape the first ChargeQuest</div>
            <h1 className="mt-5 text-[clamp(44px,11vw,108px)] font-semibold leading-[0.88] tracking-[-0.065em]">
              Tell me what the map is missing
            </h1>
            <p className="mt-7 max-w-[660px] text-[17px] leading-[1.72] text-white/62">
              ChargeQuest is just getting started. There is no giant community feed to
              pretend otherwise. If you know a road, stop, charger, risk, or better route
              I should consider, send it directly to me.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a href="#send-an-idea" className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#e82127] px-6 py-3.5 text-[13px] font-semibold text-white no-underline">
                Send a route idea <ArrowRight size={15} aria-hidden="true" />
              </a>
              <Link to="/track-anthony" className="flex min-h-12 items-center justify-center rounded-full border border-white/35 px-6 py-3.5 text-[13px] font-semibold text-white no-underline hover:border-white">
                Follow what I’m building
              </Link>
            </div>
          </div>
        </div>
        <div className="relative min-h-[360px] overflow-hidden lg:min-h-full">
          <img src="/landing/desert-road.jpg" alt="A long desert road stretching toward the mountains" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent lg:bg-gradient-to-r lg:from-black/50 lg:via-transparent" />
          <div className="absolute bottom-6 right-6 max-w-[250px] text-right font-mono text-[8px] uppercase tracking-[0.1em] text-white/45">
            The route is still open to better ideas
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1320px] px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
        <div className="max-w-[860px]">
          <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-black/42">Useful beats popular</div>
          <h2 className="mt-5 text-[clamp(40px,8vw,82px)] font-semibold leading-[0.92] tracking-[-0.058em]">
            Three ways you can genuinely change the trip
          </h2>
        </div>
        <div className="mt-12 grid border border-black/14 md:grid-cols-3">
          <IdeaLane icon={<MapPinned size={22} />} number="01" title="Share local knowledge">
            A road worth taking, a stop worth the detour, or a place that looks better on a map than it works in real life.
          </IdeaLane>
          <IdeaLane icon={<Route size={22} />} number="02" title="Challenge the route">
            Point out a weak leg, a bad assumption, a missed badge, or a route alternative I should put through CORE.
          </IdeaLane>
          <IdeaLane icon={<Lightbulb size={22} />} number="03" title="Suggest what I test">
            Give me a comparison, constraint, or question worth turning into the next public route-build entry.
          </IdeaLane>
        </div>
      </section>

      <section id="send-an-idea" className="bg-[#090a0c] px-4 py-20 text-white sm:px-6 sm:py-28 lg:px-8 lg:py-36">
        <div className="mx-auto grid max-w-[1180px] gap-12 lg:grid-cols-[.82fr_1.18fr] lg:gap-20">
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#23d7d1]">Anthony’s suggestion inbox</div>
            <h2 className="mt-5 text-[clamp(42px,8vw,78px)] font-semibold leading-[0.92] tracking-[-0.058em]">Make the case</h2>
            <p className="mt-7 max-w-[480px] text-[15px] leading-[1.75] text-white/55">
              Suggestions go to a private admin inbox. They are not automatically posted,
              ranked, or made public. If an idea changes the plan, I may discuss it later
              on Track Anthony and credit the source when appropriate.
            </p>
            <div className="mt-9 border-t border-white/15 pt-6 text-[12px] leading-[1.7] text-white/42">
              Need account help, want to discuss a partnership, or would rather send something directly?{' '}
              <a href={ANTHONY_EMAIL_HREF} className="font-semibold text-white no-underline">Email me</a>.
            </div>
          </div>

          <div>
            {error ? <div className="mb-5 rounded-[10px] bg-[#e82127] px-4 py-3 text-[13px] text-white">{error}</div> : null}
            {notice ? <div className="mb-5 rounded-[10px] bg-[#23d7d1] px-4 py-3 text-[13px] font-semibold text-black">{notice}</div> : null}
            {user ? (
              <form className="grid gap-5 border border-white/15 bg-white/[.045] p-5 sm:p-8" onSubmit={submitSuggestion}>
                <div className="font-mono text-[8px] uppercase tracking-[0.12em] text-white/35">Sending as @{user.username}</div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <DarkField label="What kind of idea?">
                    <select value={suggestion.category} onChange={(event) => setSuggestion((current) => ({ ...current, category: event.target.value }))}>
                      <option value="route">Route challenge</option>
                      <option value="stop">Must-see stop</option>
                      <option value="charging">Charging evidence</option>
                      <option value="scenery">Scenic road</option>
                      <option value="food">Food or coffee</option>
                      <option value="other">Something else</option>
                    </select>
                  </DarkField>
                  <DarkField label="State, if relevant">
                    <select value={suggestion.stateCode} onChange={(event) => setSuggestion((current) => ({ ...current, stateCode: event.target.value }))}>
                      <option value="">Not tied to one state</option>
                      {STATE_OPTIONS.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
                    </select>
                  </DarkField>
                </div>
                <DarkField label="Give the idea a clear title">
                  <input required minLength={3} maxLength={100} value={suggestion.title} onChange={(event) => setSuggestion((current) => ({ ...current, title: event.target.value }))} placeholder="Put the Million Dollar Highway on trial" />
                </DarkField>
                <DarkField label="Why should I consider it?">
                  <textarea required minLength={10} maxLength={800} rows={7} value={suggestion.body} onChange={(event) => setSuggestion((current) => ({ ...current, body: event.target.value }))} placeholder="Tell me what the route gains, what it costs, and anything I should verify." />
                </DarkField>
                <button type="submit" disabled={busy} className="min-h-12 rounded-full bg-[#e82127] px-6 py-3.5 text-[13px] font-semibold text-white disabled:opacity-55">
                  {busy ? 'Sending…' : 'Send privately to Anthony'}
                </button>
              </form>
            ) : (
              <div className="border border-white/15 bg-white/[.045] p-7 sm:p-10">
                <div className="font-mono text-[9px] uppercase tracking-[0.13em] text-[#23d7d1]">Free account required</div>
                <h3 className="mt-4 text-[32px] font-semibold tracking-[-0.045em]">Keep suggestions connected to real people</h3>
                <p className="mt-4 text-[14px] leading-[1.7] text-white/52">Create a username-based account to send the idea. ChargeQuest does not require your email address.</p>
                <Link to="/signup?returnTo=%2Fcommunity" className="mt-7 flex min-h-12 w-full items-center justify-center rounded-full bg-white px-6 py-3.5 text-[13px] font-semibold text-black no-underline sm:w-fit">
                  Create an account and send an idea
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

function IdeaLane({ icon, number, title, children }: { icon: ReactNode; number: string; title: string; children: ReactNode }) {
  return (
    <article className="border-b border-black/14 p-6 last:border-b-0 md:min-h-[280px] md:border-b-0 md:border-r md:p-8 md:last:border-r-0">
      <div className="flex items-center justify-between text-[#e82127]">{icon}<span className="font-mono text-[8px] text-black/30">{number}</span></div>
      <h3 className="mt-10 text-[25px] font-semibold tracking-[-0.035em]">{title}</h3>
      <p className="mt-4 text-[13.5px] leading-[1.7] text-black/55">{children}</p>
    </article>
  )
}

function DarkField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-2 font-mono text-[8px] font-semibold uppercase tracking-[0.1em] text-white/42 [&_input]:min-h-12 [&_input]:border [&_input]:border-white/16 [&_input]:bg-black/35 [&_input]:px-4 [&_input]:font-sans [&_input]:text-[13px] [&_input]:normal-case [&_input]:tracking-normal [&_input]:text-white [&_select]:min-h-12 [&_select]:border [&_select]:border-white/16 [&_select]:bg-black [&_select]:px-4 [&_select]:font-sans [&_select]:text-[13px] [&_select]:normal-case [&_select]:tracking-normal [&_select]:text-white [&_textarea]:border [&_textarea]:border-white/16 [&_textarea]:bg-black/35 [&_textarea]:p-4 [&_textarea]:font-sans [&_textarea]:text-[13px] [&_textarea]:leading-[1.6] [&_textarea]:normal-case [&_textarea]:tracking-normal [&_textarea]:text-white">
      {label}
      {children}
    </label>
  )
}
