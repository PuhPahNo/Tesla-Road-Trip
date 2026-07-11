import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchCommunity, type CommunitySnapshot } from '../api/siteClient'

const FEATURES = [
  {
    number: '01',
    title: 'Build around the places you want to visit',
    body: 'Choose parks, cities, landmarks, and Tesla Iconic Chargers first. Charge Quest works out a viable Supercharger sequence around them.',
  },
  {
    number: '02',
    title: 'Plan for your Tesla and your tolerance',
    body: 'Set your vehicle, practical highway range, trip pace, comfortable drive time, and absolute daily maximum.',
  },
  {
    number: '03',
    title: 'Save routes and come back ready to compete',
    body: 'Keep multiple route ideas, override preferences per trip, reorder important stops, and optimize again without starting over.',
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

  return (
    <>
      <section className="cq-home-hero relative isolate overflow-hidden border-b border-edge">
        <div className="cq-hero-backdrop pointer-events-none absolute inset-0 -z-10" />
        <div className="mx-auto grid min-h-[700px] max-w-[1240px] items-center gap-12 px-5 py-16 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:py-24">
          <div className="max-w-[720px]">
            <div className="inline-flex rounded-full border border-accent/35 bg-accent/10 px-3 py-1.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-accent">
              Built for the 2026 Tesla Supercharging Competition
            </div>
            <h1 className="mt-7 max-w-[800px] text-[clamp(48px,7vw,88px)] font-semibold leading-[0.93] tracking-[-0.058em] text-ink">
              Think you can build a better quest than mine?
            </h1>
            <p className="mt-7 max-w-[660px] text-[18px] leading-[1.65] text-dim">
              I’m Anthony. I’m planning my own run at the 2026 competition, and I
              built Charge Quest to turn a giant list of Superchargers into a road
              trip actually worth driving.
            </p>
            <p className="mt-4 max-w-[640px] text-[15px] leading-[1.7] text-faint">
              Now I’m giving fellow competitors the same planner I’m using. Build
              your route around your Tesla, your pace, the places you care about,
              and the Iconic Charger badges you want—then come see how your plan
              stacks up against mine.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link to="/planner" className="site-primary-button min-h-12 px-5 text-[14px] no-underline">
                Build your competition route
              </Link>
              <Link to="/track-anthony" className="site-secondary-button min-h-12 px-5 text-[14px] no-underline">
                Follow my quest
              </Link>
            </div>
            <div className="mt-6 font-mono text-[9.5px] uppercase tracking-[0.1em] text-faint">
              Anthony · 26 · Chattanooga, Tennessee · Fellow competitor
            </div>
          </div>

          <PlannerPreview />
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-5 py-24 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[.78fr_1.22fr]">
          <div>
            <div className="site-kicker">The same tool I’m using</div>
            <h2 className="mt-4 text-[clamp(34px,4.8vw,58px)] font-semibold leading-[1.02] tracking-[-0.047em]">
              I built the advantage. I’m sharing it with the competition.
            </h2>
            <p className="mt-5 max-w-[520px] text-[14.5px] leading-[1.7] text-dim">
              Charge Quest is not a stripped-down demo for visitors. You get the
              same route builder, vehicle settings, badge targets, and optimizer
              I’m using to plan my own trip.
            </p>
          </div>

          <div>
            {FEATURES.map((feature) => (
              <article key={feature.number} className="grid gap-4 border-t border-edge py-7 sm:grid-cols-[64px_1fr] last:border-b">
                <div className="font-mono text-[11px] text-accent2">{feature.number}</div>
                <div>
                  <h3 className="text-[22px] font-semibold tracking-[-0.025em]">{feature.title}</h3>
                  <p className="mt-3 max-w-[680px] text-[14px] leading-[1.7] text-dim">{feature.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-edge bg-panel/40">
        <div className="mx-auto grid max-w-[1240px] gap-10 px-5 py-20 lg:grid-cols-[.9fr_1.1fr] lg:px-8">
          <div>
            <div className="site-kicker">Why I made it</div>
            <h2 className="mt-4 text-[clamp(34px,5vw,58px)] font-semibold leading-[1.02] tracking-[-0.047em]">
              The fastest route is not always the best quest.
            </h2>
          </div>
          <div className="max-w-[700px] text-[16px] leading-[1.75] text-dim">
            <p>
              Every normal planner wanted to move me between chargers as efficiently
              as possible. That is useful, but it misses the point of spending weeks
              on the road. I want national parks, cities, Tesla badges, and driving
              days I can sustain without hating the trip by week three.
            </p>
            <p className="mt-5">
              Charge Quest lets the experiences define the route and uses the
              Supercharger network to make it possible. If that helps someone build
              a route good enough to beat mine, fair play—that makes the competition
              more interesting.
            </p>
          </div>
        </div>
      </section>

      <section className="cq-challenge-band border-b border-edge">
        <div className="mx-auto grid max-w-[1240px] gap-10 px-5 py-20 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:py-24">
          <div>
            <div className="site-kicker">Compete, compare, follow along</div>
            <h2 className="mt-4 max-w-[720px] text-[clamp(38px,5.6vw,68px)] font-semibold leading-[.98] tracking-[-0.052em]">
              Build your route. Challenge mine. Follow the run.
            </h2>
            <p className="mt-6 max-w-[650px] text-[16px] leading-[1.7] text-dim">
              Vote for a state I should spend more time in, tell me which stop I’m
              missing, or invite me to grab coffee when I pass through. Once the trip
              starts, the live tracker will show exactly where I am and how the quest
              is going.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/community" className="site-primary-button no-underline">Join the community</Link>
              <Link to="/track-anthony" className="site-secondary-button no-underline">Track Anthony</Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 self-center">
            <CommunityMetric label="State votes" value={stateVoteCount} note="Lobbying for a visit" />
            <CommunityMetric label="Suggestions" value={community?.suggestions.length ?? 0} note="Stops and route ideas" />
            <CommunityMetric label="Meetups" value={community?.meetups.length ?? 0} note="Approved along the route" />
            <CommunityMetric
              label="Anthony’s status"
              value={trip?.active ? `Day ${trip.dayNumber ?? '—'}` : 'Pre-trip'}
              note={trip?.active ? trip.currentLocation || 'On the road' : 'Planning the 2026 run'}
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[940px] px-5 py-24 text-center lg:py-28">
        <div className="site-kicker">Your move</div>
        <h2 className="mt-4 text-[clamp(38px,6vw,70px)] font-semibold leading-[.97] tracking-[-0.055em]">
          See if you can plan a better one.
        </h2>
        <p className="mx-auto mt-6 max-w-[650px] text-[16px] leading-[1.7] text-dim">
          Open the full planner for free. Create an account when you want to save
          routes, keep your preferences, and join the competition community.
        </p>
        <Link to="/planner" className="site-primary-button mt-8 min-h-12 px-6 text-[14px] no-underline">
          Start building your route
        </Link>
      </section>
    </>
  )
}

function PlannerPreview() {
  return (
    <div className="cq-planner-preview mx-auto w-full max-w-[540px] overflow-hidden rounded-[22px] border border-edge2 bg-panel shadow-card">
      <div className="flex items-center justify-between border-b border-edge bg-panel2 px-5 py-4">
        <div>
          <div className="font-mono text-[8.5px] uppercase tracking-[0.12em] text-accent2">Inside Charge Quest</div>
          <div className="mt-1 text-[17px] font-semibold">Create a custom route</div>
        </div>
        <div className="font-mono text-[9px] text-faint">Step 2 of 3</div>
      </div>

      <div className="grid grid-cols-3 border-b border-edge bg-app/40 p-2">
        {['Trip setup', 'Destinations', 'Review & optimize'].map((step, index) => (
          <div key={step} className={`cq-preview-step ${index === 1 ? 'cq-preview-step-active' : ''}`}>
            <span>{index + 1}</span>
            <strong>{step}</strong>
          </div>
        ))}
      </div>

      <div className="p-5 sm:p-6">
        <div className="grid grid-cols-2 gap-3">
          <PreviewField label="Vehicle" value="Model Y Long Range" />
          <PreviewField label="Trip length" value="60 days" />
          <PreviewField label="Pace" value="Balanced" />
          <PreviewField label="First heading" value="Season-smart" />
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[12px] font-semibold text-ink">Places that matter</div>
            <div className="font-mono text-[8.5px] uppercase tracking-[0.08em] text-faint">17 Iconic Chargers available</div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {['Yellowstone', 'Grand Canyon', 'Tesla Diner', 'Miami Beach'].map((place) => (
              <span key={place} className="rounded-full border border-edge bg-chip px-3 py-2 text-[10.5px] font-medium text-dim">
                {place}
              </span>
            ))}
            <span className="rounded-full border border-dashed border-edge2 px-3 py-2 text-[10.5px] text-faint">+ Add destination</span>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-4 rounded-[12px] border border-edge bg-app/55 p-4">
          <div>
            <div className="text-[12px] font-semibold text-ink">Ready when your route is.</div>
            <div className="mt-1 text-[10.5px] text-faint">Charging sequence and daily plan come next.</div>
          </div>
          <div className="flex-none rounded-[9px] bg-accent px-4 py-2.5 text-[11px] font-semibold text-white">Review route</div>
        </div>
      </div>
    </div>
  )
}

function PreviewField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[11px] border border-edge bg-chip p-3">
      <div className="font-mono text-[8px] uppercase tracking-[0.09em] text-faint">{label}</div>
      <div className="mt-1.5 truncate text-[12px] font-semibold text-ink">{value}</div>
    </div>
  )
}

function CommunityMetric({ label, value, note }: { label: string; value: string | number; note: string }) {
  return (
    <div className="rounded-[16px] border border-edge bg-app/55 p-4 sm:p-5">
      <div className="font-mono text-[8.5px] uppercase tracking-[0.11em] text-faint">{label}</div>
      <div className="mt-2 text-[clamp(22px,4vw,34px)] font-semibold tracking-[-0.04em] text-ink">{value}</div>
      <div className="mt-1 text-[11px] leading-[1.45] text-faint">{note}</div>
    </div>
  )
}
