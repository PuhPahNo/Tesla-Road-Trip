import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchCommunity, type CommunitySnapshot } from '../api/siteClient'
import { useAuth } from './AuthContext'
import { usePageMetadata } from './usePageMetadata'

export function LandingPage() {
  const { user } = useAuth()
  const [community, setCommunity] = useState<CommunitySnapshot>()

  usePageMetadata({
    title: 'Charge Quest | Tesla Supercharger Route Planner for 2026',
    description: 'Build and save a Tesla Supercharger route for the 2026 competition. Plan around your Tesla, real-world range, Iconic Charger badges, landmarks, and daily driving limits.',
    path: '/',
  })

  useEffect(() => {
    void fetchCommunity().then(setCommunity).catch(() => undefined)
  }, [])

  const trip = community?.trip
  const plannerHref = user ? '/planner' : '/signup?returnTo=%2Fplanner'
  const plannerCta = user ? 'Build your route' : 'Sign up and build your route'
  const stateVoteCount = useMemo(
    () => community?.stateVotes.reduce((total, state) => total + state.votes, 0) ?? 0,
    [community],
  )

  return (
    <>
      <section className="cq-cinematic-hero relative min-h-[calc(100vh-70px)] overflow-hidden bg-black text-white">
        <img
          src="/landing/desert-road.jpg"
          alt="An open highway running through the painted desert"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="cq-hero-shade absolute inset-0" />
        <div className="relative mx-auto flex min-h-[calc(100vh-70px)] max-w-[1440px] flex-col justify-between px-5 py-8 lg:px-12 lg:py-12">
          <div className="flex items-center justify-between gap-5 font-mono text-[9px] uppercase tracking-[0.14em] text-white/65">
            <span>Anthony · Chattanooga, TN</span>
            <span className="hidden sm:block">2026 Tesla Supercharging Competition</span>
          </div>

          <div className="max-w-[1100px] pb-5">
            <div className="mb-5 font-mono text-[10px] uppercase tracking-[0.16em] text-white/75">
              Tesla Supercharger route planning for the 2026 competition
            </div>
            <h1 className="max-w-[1080px] text-[clamp(58px,9.8vw,150px)] font-semibold leading-[0.82] tracking-[-0.072em] text-white">
              Build a Tesla route that can beat mine
            </h1>
            <div className="mt-8 grid max-w-[980px] gap-7 md:grid-cols-[1fr_auto] md:items-end">
              <p className="max-w-[680px] text-[17px] leading-[1.65] text-white/78 sm:text-[20px]">
                I’m Anthony. I built Charge Quest to plan my own run at the 2026
                Tesla Supercharging Competition. Now every competitor can use the
                same Tesla road trip planner to build, save, and optimize a route
                around Superchargers, landmarks, and Iconic Charger badges
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to={plannerHref} className="rounded-full bg-[#e82127] px-6 py-3.5 text-[13px] font-semibold text-white no-underline shadow-[0_12px_40px_rgba(232,33,39,.48)] ring-1 ring-white/20 transition hover:bg-white hover:text-black">
                  {plannerCta}
                </Link>
                <Link to="/track-anthony" className="rounded-full border border-white/45 bg-black/65 px-6 py-3.5 text-[13px] font-semibold text-white no-underline backdrop-blur-md transition hover:border-white">
                  Follow mine
                </Link>
              </div>
            </div>
            {!user ? (
              <div className="mt-5 font-mono text-[8.5px] uppercase tracking-[0.11em] text-white/55">
                Free account · No email required · Save unlimited route ideas
              </div>
            ) : null}
          </div>

          <div className="flex items-end justify-between gap-5 font-mono text-[8px] uppercase tracking-[0.13em] text-white/45">
            <span>Photo · Pierre Jeanneret / Unsplash</span>
            <span>Scroll to explore ↓</span>
          </div>
        </div>
      </section>

      <section className="cq-editorial-light px-5 py-28 sm:py-36 lg:px-8 lg:py-44">
        <div className="mx-auto max-w-[1320px]">
          <div className="grid gap-10 lg:grid-cols-[1.35fr_.65fr] lg:items-end">
            <h2 className="max-w-[1040px] text-[clamp(56px,9vw,132px)] font-semibold leading-[0.86] tracking-[-0.072em]">
              The charger is not the destination
            </h2>
            <div className="max-w-[430px] pb-2">
              <div className="mb-5 h-1 w-16 bg-[#e82127]" />
              <p className="text-[17px] leading-[1.7] text-black/65">
                Normal planners optimize the trip away. Charge Quest starts with
                parks, cities, badge locations, and the days you actually want—then
                makes the Supercharger network support the experience.
              </p>
            </div>
          </div>
          <div className="mt-24 grid gap-8 border-t border-black/15 pt-8 sm:grid-cols-3">
            <EditorialFact number="17" label="Iconic Charger targets researched" />
            <EditorialFact number="3" label="Steps from idea to optimized route" />
            <EditorialFact number="1" label="Planner shared with the competition" />
          </div>
          {!user ? (
            <div className="mt-16 flex flex-col justify-between gap-6 border-t border-black/15 pt-8 sm:flex-row sm:items-center">
              <div>
                <div className="text-[22px] font-semibold tracking-[-0.03em]">Your competition plan starts with a free account</div>
                <div className="mt-2 text-[13px] text-black/50">Choose a username, set your Tesla, and start building in under a minute</div>
              </div>
              <Link to="/signup?returnTo=%2Fplanner" className="flex-none rounded-full bg-[#e82127] px-7 py-4 text-[13px] font-semibold text-white no-underline shadow-[0_12px_30px_rgba(232,33,39,.22)]">
                Create my Charge Quest account
              </Link>
            </div>
          ) : null}
        </div>
      </section>

      <section className="cq-destination-gallery overflow-hidden bg-[#090a0c] px-5 py-24 text-white lg:px-8 lg:py-32">
        <div className="mx-auto max-w-[1380px]">
          <div className="mb-16 flex flex-col justify-between gap-7 md:flex-row md:items-end">
            <div>
              <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#23d7d1]">Build around the places that matter</div>
              <h2 className="mt-4 max-w-[820px] text-[clamp(44px,6.4vw,92px)] font-semibold leading-[0.91] tracking-[-0.06em]">
                One route. A whole country worth stopping for
              </h2>
            </div>
            <p className="max-w-[390px] text-[14px] leading-[1.7] text-white/55">
              Badge stations, national parks, city nights, local suggestions—pick
              the anchors and let the optimizer solve the charging sequence between them.
            </p>
          </div>

          <div className="cq-photo-grid">
            <PhotoFigure
              className="cq-photo-canyon"
              src="/landing/grand-canyon.jpg"
              alt="Grand Canyon at sunset"
              eyebrow="Arizona"
              title="Grand Canyon"
              credit="Steve Wrzeszczynski / Unsplash"
            />
            <PhotoFigure
              className="cq-photo-bison"
              src="/landing/yellowstone-bison.jpg"
              alt="A herd of bison walking along a Yellowstone road"
              eyebrow="Wyoming"
              title="Yellowstone"
              credit="Zac Bowling / Unsplash"
            />
            <div className="cq-gallery-statement flex flex-col justify-between bg-[#e82127] p-7 sm:p-9">
              <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/60">The route is yours</div>
              <div>
                <div className="text-[clamp(52px,7vw,94px)] font-semibold leading-[.82] tracking-[-0.07em]">48</div>
                <div className="mt-3 max-w-[260px] text-[16px] font-semibold leading-[1.2]">contiguous states competing for a place in your plan</div>
              </div>
            </div>
            <PhotoFigure
              className="cq-photo-bridge"
              src="/landing/golden-gate.jpg"
              alt="Golden Gate Bridge with traffic at dusk"
              eyebrow="California"
              title="Golden Gate Bridge"
              credit="Leo_Visions / Unsplash"
            />
          </div>
        </div>
      </section>

      <section className="cq-product-stage overflow-hidden bg-[#e82127] px-5 py-24 text-white lg:px-8 lg:py-32">
        <div className="mx-auto max-w-[1320px]">
          <div className="grid gap-12 lg:grid-cols-[.75fr_1.25fr] lg:items-end">
            <div className="max-w-[540px]">
              <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-white/65">The actual advantage</div>
              <h2 className="mt-5 text-[clamp(48px,6.4vw,88px)] font-semibold leading-[0.9] tracking-[-0.062em]">
                The tool I’m using is yours
              </h2>
              <p className="mt-7 text-[16px] leading-[1.7] text-white/78">
                Set your Tesla model and real-world range, choose your pace, add the
                places and badges you care about, then optimize a route you can save
                and keep refining. I’m sharing the full tool because without it you’d
                be stitching together chargers and spreadsheets—and honestly, you’d
                have no chance
              </p>
              <Link to={plannerHref} className="mt-8 inline-flex rounded-full bg-black px-6 py-3.5 text-[13px] font-semibold text-white no-underline transition hover:bg-white hover:text-black">
                {user ? 'Open the full planner' : 'Unlock the planner for free'}
              </Link>
            </div>

            <PlannerPreview />
          </div>
        </div>
      </section>

      <section className="grid min-h-[720px] bg-black text-white lg:grid-cols-2">
        <div className="relative min-h-[520px] overflow-hidden lg:min-h-full">
          <img
            src="/landing/tesla-chargers.jpg"
            alt="Tesla Superchargers illuminated at night"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/10" />
          <div className="absolute bottom-6 left-6 font-mono text-[8px] uppercase tracking-[0.12em] text-white/55">
            Photo · Stephen Mease / Unsplash
          </div>
        </div>

        <div className="flex items-center px-5 py-20 lg:px-14 xl:px-20">
          <div className="w-full max-w-[620px]">
            <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#23d7d1]">Compete. Compare. Follow along.</div>
            <h2 className="mt-5 text-[clamp(46px,6vw,82px)] font-semibold leading-[0.9] tracking-[-0.062em]">
              Build yours. Challenge mine
            </h2>
            <p className="mt-7 max-w-[560px] text-[16px] leading-[1.7] text-white/60">
              Vote for where I should go, submit the stop I’m overlooking, or invite
              me for coffee when I pass through. When the trip starts, the community
              can follow the route and every field update live.
            </p>

            <div className="mt-10 grid grid-cols-2 border-y border-white/15 sm:grid-cols-4">
              <DarkMetric label="State votes" value={stateVoteCount} />
              <DarkMetric label="Suggestions" value={community?.suggestions.length ?? 0} />
              <DarkMetric label="Meetups" value={community?.meetups.length ?? 0} />
              <DarkMetric label="Status" value={trip?.active ? `Day ${trip.dayNumber ?? '—'}` : 'Pre-trip'} />
            </div>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link to="/community" className="rounded-full bg-white px-6 py-3.5 text-[13px] font-semibold text-black no-underline">Join the challenge</Link>
              <Link to="/track-anthony" className="rounded-full border border-white/30 px-6 py-3.5 text-[13px] font-semibold text-white no-underline">Track Anthony</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="cq-editorial-light px-5 py-28 text-center sm:py-36 lg:px-8 lg:py-44">
        <div className="mx-auto max-w-[1120px]">
          <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-black/45">Your move</div>
          <h2 className="mt-5 text-[clamp(60px,10vw,148px)] font-semibold leading-[0.82] tracking-[-0.075em]">
            Plan a route worth beating
          </h2>
          <p className="mx-auto mt-9 max-w-[620px] text-[17px] leading-[1.7] text-black/60">
            Create a free Charge Quest account to unlock the Tesla Supercharger route
            planner, save your competition routes, and join the community following
            Anthony’s 2026 run
          </p>
          <Link to={plannerHref} className="mt-9 inline-flex rounded-full bg-black px-8 py-4 text-[14px] font-semibold text-white no-underline transition hover:bg-[#e82127]">
            {user ? 'Start your Charge Quest' : 'Sign up and challenge Anthony'}
          </Link>
          <div className="mx-auto mt-20 max-w-[820px] border-t border-black/15 text-left">
            <FaqItem
              question="Is Charge Quest a Tesla Supercharger route planner"
              answer="Yes. Charge Quest builds multi-day Tesla road trips around Supercharger stops while accounting for your vehicle, practical range, daily driving limits, trip pace, landmarks, and Iconic Charger targets."
            />
            <FaqItem
              question="Do I need an account to use the planner"
              answer="Yes. A free username-based account unlocks the planner and keeps your vehicle preferences and custom routes private to you. No email address or third-party login is required."
            />
            <FaqItem
              question="Can I use Charge Quest for the 2026 Tesla Supercharging Competition"
              answer="That is exactly why Anthony built it. The planner is designed to help competitors compare route ideas, target unique Supercharger sites, account for Iconic Charger badges, and build a trip they can actually sustain."
            />
          </div>
        </div>
      </section>
    </>
  )
}

function EditorialFact({ number, label }: { number: string; label: string }) {
  return (
    <div>
      <div className="text-[clamp(42px,5vw,70px)] font-semibold leading-none tracking-[-0.055em]">{number}</div>
      <div className="mt-3 max-w-[220px] text-[12px] font-medium uppercase tracking-[0.08em] text-black/45">{label}</div>
    </div>
  )
}

function PhotoFigure({
  className,
  src,
  alt,
  eyebrow,
  title,
  credit,
}: {
  className: string
  src: string
  alt: string
  eyebrow: string
  title: string
  credit: string
}) {
  return (
    <figure className={`${className} group relative m-0 overflow-hidden bg-panel`}>
      <img src={src} alt={alt} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.025]" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/5 to-transparent" />
      <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-5 p-5 sm:p-7">
        <div>
          <div className="font-mono text-[8px] uppercase tracking-[0.13em] text-white/55">{eyebrow}</div>
          <div className="mt-1 text-[22px] font-semibold tracking-[-0.03em] text-white">{title}</div>
        </div>
        <div className="max-w-[150px] text-right font-mono text-[7px] uppercase tracking-[0.08em] text-white/35">{credit}</div>
      </figcaption>
    </figure>
  )
}

function PlannerPreview() {
  return (
    <div className="cq-planner-preview overflow-hidden rounded-[20px] border border-white/15 bg-[#0d1016] text-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/10 bg-[#131821] px-5 py-4 sm:px-6">
        <div>
          <div className="font-mono text-[8px] uppercase tracking-[0.13em] text-[#23d7d1]">Charge Quest planner</div>
          <div className="mt-1 text-[17px] font-semibold">Create a custom route</div>
        </div>
        <div className="font-mono text-[8px] uppercase tracking-[0.1em] text-white/35">Step 2 of 3</div>
      </div>

      <div className="grid grid-cols-3 border-b border-white/10 p-2">
        {['Trip setup', 'Destinations', 'Review'].map((step, index) => (
          <div key={step} className={`cq-preview-step ${index === 1 ? 'cq-preview-step-active' : ''}`}>
            <span>{index + 1}</span>
            <strong>{step}</strong>
          </div>
        ))}
      </div>

      <div className="grid gap-6 p-5 sm:grid-cols-[.9fr_1.1fr] sm:p-6">
        <div>
          <div className="grid grid-cols-2 gap-2">
            <PreviewField label="Vehicle" value="Model Y LR" />
            <PreviewField label="Trip" value="60 days" />
            <PreviewField label="Pace" value="Balanced" />
            <PreviewField label="Heading" value="Season-smart" />
          </div>
          <div className="mt-4 rounded-[11px] border border-white/10 bg-white/[.04] p-3">
            <div className="font-mono text-[8px] uppercase tracking-[0.1em] text-white/35">Practical range</div>
            <div className="mt-2 flex items-center justify-between text-[12px]">
              <span className="font-semibold">230 miles</span>
              <span className="text-white/35">Vehicle preset</span>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3">
            <div className="text-[11px] font-semibold">Selected destinations</div>
            <div className="font-mono text-[7.5px] uppercase tracking-[0.08em] text-white/35">4 anchors</div>
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {['Yellowstone', 'Grand Canyon', 'Tesla Diner', 'Miami Beach'].map((place, index) => (
              <div key={place} className="flex items-center gap-3 rounded-[10px] border border-white/10 bg-white/[.04] px-3 py-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#e82127] text-[9px] font-semibold">{index + 1}</span>
                <span className="text-[11.5px] font-semibold">{place}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-[9px] bg-[#e82127] px-4 py-3 text-center text-[11px] font-semibold">Review and optimize</div>
        </div>
      </div>
    </div>
  )
}

function PreviewField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[10px] border border-white/10 bg-white/[.04] p-3">
      <div className="font-mono text-[7.5px] uppercase tracking-[0.09em] text-white/35">{label}</div>
      <div className="mt-1.5 truncate text-[11px] font-semibold text-white">{value}</div>
    </div>
  )
}

function DarkMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border-r border-white/15 px-3 py-5 first:pl-0 last:border-r-0 sm:px-4">
      <div className="font-mono text-[7.5px] uppercase tracking-[0.1em] text-white/35">{label}</div>
      <div className="mt-2 text-[20px] font-semibold tracking-[-0.03em]">{value}</div>
    </div>
  )
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group border-b border-black/15 py-6">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-[18px] font-semibold tracking-[-0.02em]">
        {question}
        <span className="text-[24px] font-normal text-black/35 transition group-open:rotate-45">+</span>
      </summary>
      <p className="mt-4 max-w-[700px] text-[14px] leading-[1.7] text-black/55">{answer}</p>
    </details>
  )
}
