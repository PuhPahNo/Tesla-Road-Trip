import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchCommunity, type CommunitySnapshot } from '../api/siteClient'

const BUILD_NOTES = [
  {
    date: 'July 11 · Planner build',
    title: 'Route building finally feels like an actual conversation.',
    body: 'I split custom routes into three steps: set up the trip, choose the places that matter, then review the order before optimizing. It is the flow I wanted when I started planning my own run.',
  },
  {
    date: 'July 11 · Badge research',
    title: 'Seventeen Iconic Charger targets, mapped to real stations.',
    body: 'I went back through the Tesla badge list and tied each destination to an open Supercharger where public station data was available. I want these to be real route targets, not vague pins on a map.',
  },
  {
    date: 'Next up · My route',
    title: 'I am still arguing with my own itinerary.',
    body: 'North first or south first, how many long days are actually worth it, and which places deserve an overnight stay—those are the same decisions Charge Quest is built to help everyone make.',
  },
]

const PLANNER_RULES = [
  {
    label: 'Your actual Tesla',
    body: 'Vehicle-specific range, plus a manual override when real highway range disagrees with the brochure.',
  },
  {
    label: 'A human driving day',
    body: 'Comfortable hours, a hard daily maximum, and a pace that can sprint or make room for the good stuff.',
  },
  {
    label: 'Places before charger math',
    body: 'Start with parks, cities, landmarks, and Iconic Chargers. Then build a viable charging sequence around them.',
  },
]

export function LandingPage() {
  const [community, setCommunity] = useState<CommunitySnapshot>()

  useEffect(() => {
    void fetchCommunity().then(setCommunity).catch(() => undefined)
  }, [])

  const trip = community?.trip
  const stateVoteCount = useMemo(
    () => community?.stateVotes.reduce((total, state) => total + state.votes, 0) ?? 0,
    [community],
  )
  const totalDays = trip?.totalDays ?? 60

  return (
    <>
      <section className="cq-home-hero relative isolate overflow-hidden border-b border-edge">
        <div className="cq-hero-backdrop pointer-events-none absolute inset-0 -z-10" />
        <div className="mx-auto grid min-h-[760px] max-w-[1240px] items-center gap-12 px-5 py-16 lg:grid-cols-[1.08fr_.92fr] lg:px-8 lg:py-24">
          <div className="max-w-[720px]">
            <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-[0.12em] text-accent2">
              <span className="rounded-full border border-accent2/35 bg-app/50 px-3 py-1.5">
                Anthony’s 2026 Quest HQ
              </span>
              <span className="text-faint">Age 26 · Chattanooga, TN</span>
            </div>

            <h1 className="mt-7 max-w-[820px] text-[clamp(48px,7.3vw,92px)] font-semibold leading-[0.91] tracking-[-0.06em] text-ink">
              I’m building my Tesla quest in public.
            </h1>
            <p className="cq-editorial-copy mt-7 max-w-[680px] text-[clamp(19px,2.1vw,25px)] leading-[1.5] text-dim">
              Hey—I’m Anthony. I’m 26, I’m competing in 2026, and I want to make
              one hell of a road trip out of it instead of blindly chasing the next
              charger.
            </p>
            <p className="mt-5 max-w-[640px] text-[15px] leading-[1.7] text-faint">
              I built Charge Quest because every tool could get me to a charger, but
              none of them could plan the trip I actually wanted: national parks,
              cities, Tesla badges, realistic driving days, and reasons to stop along
              the way. This is the planner I’m using for my own run—and you can use it
              to build yours.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link to="/planner" className="site-primary-button min-h-12 px-5 text-[14px] no-underline">
                Build your quest
              </Link>
              <Link to="/community" className="site-secondary-button min-h-12 px-5 text-[14px] no-underline">
                Challenge my route
              </Link>
            </div>

            <div className="mt-7 flex items-center gap-3 text-[11.5px] text-faint">
              <span className="anthony-signature text-[22px] text-ink">Anthony</span>
              <span className="h-px w-8 bg-edge2" />
              <span>No company voice. No planning subscription. Just the tool I wanted.</span>
            </div>
          </div>

          <QuestBoard
            active={Boolean(trip?.active)}
            routeName={trip?.routeName || trip?.title || 'Anthony’s 2026 Charge Quest'}
            totalDays={totalDays}
            currentLocation={trip?.currentLocation}
          />
        </div>

        <div className="mx-auto flex max-w-[1240px] items-center gap-3 px-5 pb-8 font-mono text-[9px] uppercase tracking-[0.12em] text-faint lg:px-8">
          <span>Keep scrolling</span>
          <span className="cq-road-rule h-px flex-1" />
          <span>Chattanooga → wherever this gets interesting → home</span>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1120px] gap-10 px-5 py-24 lg:grid-cols-[1.1fr_.9fr] lg:px-8 lg:py-32">
        <div>
          <div className="site-kicker">The honest version</div>
          <h2 className="cq-editorial-copy mt-4 max-w-[720px] text-[clamp(36px,5.4vw,66px)] leading-[1.04] tracking-[-0.035em] text-ink">
            I didn’t start this because the world needed another trip-planning app.
          </h2>
          <div className="mt-8 max-w-[700px] space-y-5 text-[16px] leading-[1.75] text-dim">
            <p>
              I started it because I was trying to plan one ridiculous, ambitious
              Supercharging run and kept finding tools that treated the trip like a
              math problem. Fastest route. Fewest stops. Get there and get home.
            </p>
            <p>
              That is useful—but it is not why I want to spend weeks on the road. I
              want the Grand Canyon and Yellowstone. I want the weird roadside stop
              somebody in Wyoming swears is worth the detour. I want other competitors
              to look at my plan, tell me where it is wrong, and build something better.
            </p>
            <p>
              So I’m building the planner, the trip, and the community at the same
              time. You’re early. That’s part of the fun.
            </p>
          </div>
          <div className="mt-8 anthony-signature text-[30px] text-ink">— Anthony</div>
        </div>

        <aside className="cq-note-paper h-fit p-6 sm:p-8 lg:mt-16 lg:-rotate-1">
          <div className="cq-tape" aria-hidden="true" />
          <div className="font-mono text-[9px] uppercase tracking-[0.13em] text-faint">
            What I’m optimizing for
          </div>
          <ul className="mt-6 space-y-5">
            {[
              'A route I will still be excited about on day 40.',
              'Driving days that work in the real world, not just a spreadsheet.',
              'Iconic Chargers, parks, cities, and stops with an actual story.',
              'A fair challenge with other Tesla people—not a private victory lap.',
              'Coffee, suggestions, and friendly arguments from people along the route.',
            ].map((item) => (
              <li key={item} className="flex gap-3 text-[14px] leading-[1.55] text-dim">
                <span className="mt-1 text-accent">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="mt-7 border-t border-dashed border-edge2 pt-5 text-[12px] leading-[1.6] text-faint">
            Not optimizing for: turning the entire country into one long highway exit.
          </div>
        </aside>
      </section>

      <section className="border-y border-edge bg-panel/35">
        <div className="mx-auto max-w-[1240px] px-5 py-24 lg:px-8">
          <div className="grid gap-7 lg:grid-cols-[.72fr_1.28fr]">
            <div className="lg:sticky lg:top-28 lg:h-fit">
              <div className="site-kicker">Built from the road-trip questions</div>
              <h2 className="mt-4 text-[clamp(34px,4.6vw,56px)] font-semibold leading-[1.02] tracking-[-0.045em]">
                The planner works the way I actually think about the trip.
              </h2>
              <p className="mt-5 max-w-[520px] text-[14.5px] leading-[1.7] text-dim">
                Start with the experience. Let the charger math support it. Every
                setting here exists because I needed it for the route I’m preparing to drive.
              </p>
              <Link to="/planner" className="site-secondary-button mt-7 no-underline">
                See the actual planner
              </Link>
            </div>

            <div className="cq-rule-list">
              {PLANNER_RULES.map((rule, index) => (
                <article key={rule.label} className="grid gap-4 border-t border-edge py-7 sm:grid-cols-[64px_1fr]">
                  <div className="font-mono text-[11px] text-accent2">0{index + 1}</div>
                  <div>
                    <h3 className="text-[23px] font-semibold tracking-[-0.025em]">{rule.label}</h3>
                    <p className="mt-3 max-w-[660px] text-[14px] leading-[1.7] text-dim">{rule.body}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-5 py-24 lg:px-8 lg:py-28">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="site-kicker">Anthony’s build log</div>
            <h2 className="mt-3 text-[clamp(34px,5vw,58px)] font-semibold leading-[1] tracking-[-0.045em]">
              I’m showing the work, too.
            </h2>
          </div>
          <p className="max-w-[430px] text-[13.5px] leading-[1.65] text-dim">
            These are not release notes written by a marketing team. They are the
            decisions I’m making while the planner and my own route take shape.
          </p>
        </div>

        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {BUILD_NOTES.map((note, index) => (
            <article key={note.title} className={`cq-log-card p-6 sm:p-7 ${index === 1 ? 'lg:translate-y-5' : ''}`}>
              <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-accent2">{note.date}</div>
              <h3 className="mt-5 text-[21px] font-semibold leading-[1.2] tracking-[-0.025em]">{note.title}</h3>
              <p className="mt-4 text-[13.5px] leading-[1.7] text-dim">{note.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="cq-community-band relative overflow-hidden border-y border-edge">
        <div className="mx-auto grid max-w-[1240px] gap-10 px-5 py-20 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:py-24">
          <div>
            <div className="site-kicker">This gets better when you disagree with me</div>
            <h2 className="mt-4 max-w-[720px] text-[clamp(38px,5.6vw,68px)] font-semibold leading-[.98] tracking-[-0.05em]">
              Think my route is wrong? Good. Tell me why.
            </h2>
            <p className="mt-6 max-w-[660px] text-[16px] leading-[1.7] text-dim">
              Vote for the state I should spend more time in. Drop a stop I would
              never find on my own. If I’m passing through your city, tell me where
              we should grab coffee. Or build your own route and come compete.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/community" className="site-primary-button no-underline">Join the route debate</Link>
              <Link to="/track-anthony" className="site-secondary-button no-underline">Follow Anthony’s run</Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 self-center">
            <CommunityMetric label="State votes" value={stateVoteCount} note="People lobbying for a stop" />
            <CommunityMetric label="Suggestions" value={community?.suggestions.length ?? 0} note="Places and route ideas" />
            <CommunityMetric label="Meetups" value={community?.meetups.length ?? 0} note="Approved along the route" />
            <CommunityMetric
              label="Trip status"
              value={trip?.active ? `Day ${trip.dayNumber ?? '—'}` : 'Pre-trip'}
              note={trip?.active ? trip.currentLocation || 'On the road' : 'Still building in public'}
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[980px] px-5 py-24 text-center lg:py-32">
        <div className="anthony-signature text-[28px] text-accent">Your turn.</div>
        <h2 className="mt-5 text-[clamp(38px,6vw,72px)] font-semibold leading-[.96] tracking-[-0.055em]">
          Build the trip you would actually want to drive.
        </h2>
        <p className="mx-auto mt-6 max-w-[650px] text-[16px] leading-[1.7] text-dim">
          Try the full planner first. Make an account when you want to save routes,
          join the community, and keep your preferences. I’ll see you out there.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link to="/planner" className="site-primary-button min-h-12 px-6 text-[14px] no-underline">Open Charge Quest</Link>
          <Link to="/signup" className="site-secondary-button min-h-12 px-6 text-[14px] no-underline">Create a free account</Link>
        </div>
      </section>
    </>
  )
}

function QuestBoard({
  active,
  routeName,
  totalDays,
  currentLocation,
}: {
  active: boolean
  routeName: string
  totalDays: number
  currentLocation?: string | null
}) {
  return (
    <div className="cq-quest-board relative mx-auto w-full max-w-[520px] p-5 sm:p-7 lg:rotate-[1deg]">
      <div className="cq-board-tab">Anthony’s working route</div>
      <div className="flex items-start justify-between gap-5 border-b border-dashed border-edge2 pb-5">
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[0.13em] text-faint">2026 quest file</div>
          <h2 className="mt-2 text-[24px] font-semibold leading-[1.1] tracking-[-0.03em]">{routeName}</h2>
        </div>
        <span className={`mt-1 h-3 w-3 flex-none rounded-full ${active ? 'animate-pulse bg-good' : 'bg-amber'}`} />
      </div>

      <div className="cq-route-sketch mt-7" aria-hidden="true">
        <span className="cq-sketch-stop cq-sketch-stop-a" />
        <span className="cq-sketch-stop cq-sketch-stop-b" />
        <span className="cq-sketch-stop cq-sketch-stop-c" />
        <span className="cq-sketch-stop cq-sketch-stop-d" />
        <span className="cq-sketch-stop cq-sketch-stop-e" />
      </div>

      <div className="mt-7 grid grid-cols-2 gap-x-6 gap-y-5">
        <BoardFact label="Starting line" value="Chattanooga, TN" />
        <BoardFact label="Trip window" value={`${totalDays} days`} />
        <BoardFact label="Iconic targets" value="17 researched" />
        <BoardFact label="Status" value={active ? currentLocation || 'On the road' : 'Still planning'} />
      </div>

      <div className="mt-7 rotate-[-1deg] rounded-[8px] bg-accent/10 px-4 py-3 text-[12px] leading-[1.55] text-dim">
        <span className="font-semibold text-ink">Current question:</span> Which parts of
        the country deserve the best weather—and which ones should I get out of the
        way first?
      </div>
    </div>
  )
}

function BoardFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-[8.5px] uppercase tracking-[0.11em] text-faint">{label}</div>
      <div className="mt-1.5 text-[13.5px] font-semibold text-ink">{value}</div>
    </div>
  )
}

function CommunityMetric({
  label,
  value,
  note,
}: {
  label: string
  value: string | number
  note: string
}) {
  return (
    <div className="rounded-[16px] border border-edge bg-app/55 p-4 backdrop-blur-sm sm:p-5">
      <div className="font-mono text-[8.5px] uppercase tracking-[0.11em] text-faint">{label}</div>
      <div className="mt-2 text-[clamp(22px,4vw,34px)] font-semibold tracking-[-0.04em] text-ink">{value}</div>
      <div className="mt-1 text-[11px] leading-[1.45] text-faint">{note}</div>
    </div>
  )
}
