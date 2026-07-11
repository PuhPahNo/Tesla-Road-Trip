import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchCommunity, type CommunitySnapshot } from '../api/siteClient'

const FEATURES = [
  {
    number: '01',
    title: 'Route around the trip you actually want',
    body: 'Choose cities, national parks, roadside stops, researched Tesla Iconic Chargers, an exact trip date, and your preferred first heading. The charger sequence gets built around the experience—not the other way around.',
  },
  {
    number: '02',
    title: 'Plan for your car and your pace',
    body: 'Set your Tesla model, practical highway range, comfortable daily driving time, hard daily cap, and whether you want to sprint or linger at the best places.',
  },
  {
    number: '03',
    title: 'Save more than one version',
    body: 'Create an account, keep your routes and preferences private to you, make route-specific overrides, and come back without rebuilding your whole trip.',
  },
]

export function LandingPage() {
  const [community, setCommunity] = useState<CommunitySnapshot>()

  useEffect(() => {
    void fetchCommunity().then(setCommunity).catch(() => undefined)
  }, [])

  const trip = community?.trip

  return (
    <>
      <section className="relative overflow-hidden border-b border-edge">
        <div className="site-grid pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative mx-auto grid min-h-[680px] max-w-[1240px] items-center gap-12 px-5 py-20 lg:grid-cols-[1.05fr_.95fr] lg:px-8">
          <div className="max-w-[700px]">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-accent">
              Built by a fellow Supercharging competitor
            </div>
            <h1 className="mt-7 max-w-[760px] text-[clamp(46px,7vw,88px)] font-semibold leading-[0.94] tracking-[-0.055em] text-ink">
              Your Tesla trip should be worth the miles.
            </h1>
            <p className="mt-7 max-w-[650px] text-[18px] leading-[1.65] text-dim">
              Hey, I’m Anthony. I built Charge Quest for my own long-distance
              Supercharging contest run because I wanted more than the fastest line
              between chargers. I wanted the landmarks, cities, scenery, badge stops,
              and a daily plan I could actually live with.
            </p>
            <p className="mt-4 max-w-[620px] text-[15px] leading-[1.65] text-faint">
              I’m sharing the same planner I use—not sending you into a generic route
              generator. Start with my assumptions, replace them with yours, and build
              a quest that fits your Tesla and your time.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                to="/planner"
                className="rounded-[11px] bg-accent px-5 py-3.5 text-[14px] font-semibold text-white no-underline transition hover:brightness-110"
              >
                Open the planner
              </Link>
              <Link
                to="/signup"
                className="rounded-[11px] border border-edge2 bg-chip px-5 py-3.5 text-[14px] font-semibold text-ink no-underline transition hover:brightness-110"
              >
                Create a free account
              </Link>
            </div>
            <div className="mt-6 font-mono text-[10px] uppercase tracking-[0.09em] text-faint">
              No OAuth · no ads · no trip-planning subscription
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[540px]">
            <div className="quest-orbit absolute -inset-14 rounded-full" />
            <div className="glass relative overflow-hidden rounded-[24px] p-4 sm:p-5">
              <div className="rounded-[18px] border border-edge bg-panel2 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-faint">
                      Route profile
                    </div>
                    <div className="mt-1 text-[18px] font-semibold">A trip with a point</div>
                  </div>
                  <div className="h-3 w-3 rounded-full bg-accent shadow-[0_0_24px_var(--accent)]" />
                </div>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <HeroMetric label="Vehicle" value="Your Tesla" />
                  <HeroMetric label="Pace" value="Your call" />
                  <HeroMetric label="Daily max" value="Configurable" />
                  <HeroMetric label="Must-see stops" value="Up to 16" />
                </div>
                <div className="mt-5 rounded-[15px] border border-edge bg-app/60 p-4">
                  <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.1em] text-faint">
                    <span>Chattanooga</span>
                    <span>Back home</span>
                  </div>
                  <div className="relative mt-5 h-24">
                    <div className="absolute left-[4%] top-[45%] h-3 w-3 rounded-full border-2 border-white bg-accent" />
                    <div className="route-thread absolute left-[7%] right-[7%] top-1/2 h-1 -translate-y-1/2" />
                    {[22, 40, 61, 78].map((left, index) => (
                      <div
                        key={left}
                        className="absolute h-2.5 w-2.5 rounded-full border border-accent2 bg-panel shadow-[0_0_15px_var(--accent-2)]"
                        style={{ left: `${left}%`, top: `${index % 2 ? 30 : 62}%` }}
                      />
                    ))}
                    <div className="absolute right-[4%] top-[45%] h-3 w-3 rounded-full border-2 border-white bg-accent" />
                  </div>
                  <div className="mt-2 text-[12px] leading-[1.5] text-dim">
                    Cities, parks, Iconic Chargers, and a unique Supercharger plan for
                    every day of the quest.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-5 py-24 lg:px-8">
        <div className="max-w-[720px]">
          <div className="site-kicker">Why I built it</div>
          <h2 className="mt-3 text-[clamp(32px,5vw,58px)] font-semibold leading-[1.02] tracking-[-0.045em]">
            Charger-aware without making chargers the whole trip.
          </h2>
        </div>
        <div className="mt-14 grid gap-4 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <article key={feature.number} className="site-card p-6 sm:p-7">
              <div className="font-mono text-[11px] text-accent2">{feature.number}</div>
              <h3 className="mt-7 text-[20px] font-semibold tracking-[-0.02em]">
                {feature.title}
              </h3>
              <p className="mt-3 text-[14px] leading-[1.65] text-dim">{feature.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-edge bg-panel/40">
        <div className="mx-auto grid max-w-[1240px] gap-10 px-5 py-20 lg:grid-cols-[.8fr_1.2fr] lg:px-8">
          <div>
            <div className="site-kicker">Follow my run</div>
            <h2 className="mt-3 text-[38px] font-semibold leading-[1.05] tracking-[-0.04em]">
              I’ll publish the real trip here.
            </h2>
            <p className="mt-5 text-[15px] leading-[1.65] text-dim">
              When my quest is active, you’ll be able to see the day, location, latest
              stop, and progress. If I’m heading through your state, tell me what I
              shouldn’t miss—or offer to grab coffee when the route lines up.
            </p>
          </div>
          <div className="site-card p-6 sm:p-8">
            {trip?.active ? (
              <div className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end">
                <div>
                  <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] text-good">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-good" /> Live quest
                  </div>
                  <h3 className="mt-3 text-[26px] font-semibold">
                    {trip.headline || trip.title}
                  </h3>
                  <p className="mt-2 text-[14px] text-dim">
                    Day {trip.dayNumber ?? '—'} of {trip.totalDays ?? '—'} ·{' '}
                    {trip.currentLocation || 'Location update coming soon'}
                  </p>
                </div>
                <Link to="/track-anthony" className="site-secondary-button no-underline">
                  Track Anthony
                </Link>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-faint">
                    Pre-trip status
                  </div>
                  <h3 className="mt-2 text-[24px] font-semibold">The live tracker is parked—for now.</h3>
                  <p className="mt-2 text-[14px] leading-[1.6] text-dim">
                    Check back when the trip begins. The planner and community are open now.
                  </p>
                </div>
                <Link to="/community" className="site-secondary-button no-underline">
                  Join the community
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[980px] px-5 py-24 text-center">
        <div className="site-kicker">Your turn</div>
        <h2 className="mt-4 text-[clamp(36px,6vw,68px)] font-semibold leading-[0.98] tracking-[-0.05em]">
          Build a route you’ll still be excited about on day 40.
        </h2>
        <p className="mx-auto mt-6 max-w-[650px] text-[16px] leading-[1.65] text-dim">
          Try the planner first. Create a free account when you want to save your
          routes, join the conversation, and keep your preferences across trips.
        </p>
        <Link to="/planner" className="mt-8 inline-flex rounded-[11px] bg-accent px-6 py-4 text-[15px] font-semibold text-white no-underline">
          Start planning
        </Link>
      </section>
    </>
  )
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[12px] border border-edge bg-chip p-3">
      <div className="font-mono text-[8px] uppercase tracking-[0.1em] text-faint">{label}</div>
      <div className="mt-1.5 text-[13px] font-semibold">{value}</div>
    </div>
  )
}
