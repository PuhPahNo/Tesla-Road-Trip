import { useEffect, useMemo, useState } from 'react'
import { MapPinned, Route, UsersRound, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { fetchCommunity, type CommunitySnapshot } from '../api/siteClient'
import { useAuth } from './AuthContext'
import { usePageMetadata } from './usePageMetadata'

export function LandingPage() {
  const { user } = useAuth()
  const [community, setCommunity] = useState<CommunitySnapshot>()

  usePageMetadata({
    title: 'ChargeQuest CORE | Tesla Supercharger Route Planner for 2026',
    description: 'Meet ChargeQuest CORE, the Charging Optimization & Route Engine for building and saving Tesla Supercharger routes around your vehicle, pace, badge targets, landmarks, and daily limits.',
    path: '/',
  })

  useEffect(() => {
    void fetchCommunity().then(setCommunity).catch(() => undefined)
  }, [])

  const trip = community?.trip
  const plannerHref = user ? '/planner' : '/signup?returnTo=%2Fplanner'
  const plannerCta = 'Build Your Route'
  const stateVoteCount = useMemo(
    () => community?.stateVotes.reduce((total, state) => total + state.votes, 0) ?? 0,
    [community],
  )

  return (
    <>
      <section className="cq-cinematic-hero relative min-h-[calc(100svh-117px)] overflow-hidden bg-black text-white sm:min-h-[calc(100vh-78px)]">
        <img
          src="/landing/desert-road.jpg"
          alt="An open highway running through the painted desert"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="cq-hero-shade absolute inset-0" />
        <div className="relative mx-auto flex min-h-[calc(100svh-117px)] max-w-[1440px] flex-col justify-between px-4 py-6 sm:min-h-[calc(100vh-78px)] sm:px-5 sm:py-8 lg:px-12 lg:py-12">
          <div className="flex items-start justify-between gap-5 font-mono uppercase">
            <span className="max-w-[650px] text-[11px] font-bold leading-[1.4] tracking-[0.11em] text-white/88 sm:text-[12px]">
              One shared challenge. Countless possible journeys.
            </span>
            <span className="hidden pt-0.5 text-[9px] tracking-[0.14em] text-white/60 sm:block">2026 Tesla Supercharging Competition</span>
          </div>

          <div className="max-w-[1160px] pb-5">
            <h1 className="max-w-[1120px] text-[clamp(43px,9vw,116px)] font-semibold leading-[0.9] tracking-[-0.055em] text-white sm:leading-[0.86] sm:tracking-[-0.065em]">
              I’m building a route. Think you can build a better one?
            </h1>
            <div className="mt-7 flex max-w-[1040px] flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <p className="max-w-[690px] text-[16px] leading-[1.6] text-white/88 sm:text-[18px] sm:leading-[1.6]">
                ChargeQuest began with one ambitious competition route. Now it is a
                place to plan yours—around your Tesla, your pace, and the stops that
                make the drive worth remembering.
              </p>
              <Link to={plannerHref} className="flex min-h-12 w-full flex-none items-center justify-center rounded-full bg-[#e82127] px-7 py-3.5 text-center text-[13px] font-semibold text-white no-underline shadow-[0_12px_40px_rgba(232,33,39,.48)] ring-1 ring-white/20 transition hover:bg-white hover:text-black sm:w-auto">
                {plannerCta}
              </Link>
            </div>

            <div className="mt-7 grid max-w-[1120px] border-y border-white/20 md:grid-cols-3">
              <HeroBenefit
                icon={MapPinned}
                title="Map the stops that matter"
                body="Plan through Superchargers, landmarks, cities, and badge locations."
              />
              <HeroBenefit
                icon={Route}
                title="Save multiple route ideas"
                body="Compare different strategies without losing a promising plan."
              />
              <HeroBenefit
                icon={UsersRound}
                title="Shape the quest together"
                body="Vote on states, suggest stops, and follow the first route."
              />
            </div>
            {!user ? (
              <div className="mt-4 font-mono text-[8.5px] uppercase tracking-[0.11em] text-white/55">
                Free account · No email required · Save and refine your route ideas
              </div>
            ) : null}
          </div>

          <div className="flex items-end justify-between gap-5 font-mono text-[8px] uppercase tracking-[0.13em] text-white/45">
            <span>Photo · Pierre Jeanneret / Unsplash</span>
            <span>Scroll to explore ↓</span>
          </div>
        </div>
      </section>

      <section className="cq-editorial-light px-4 py-20 sm:px-5 sm:py-36 lg:px-8 lg:py-44">
        <div className="mx-auto max-w-[1320px]">
          <div className="grid gap-10 lg:grid-cols-[1.35fr_.65fr] lg:items-end">
            <div>
              <div className="mb-5 font-mono text-[9px] uppercase tracking-[0.16em] text-black/45">How ChargeQuest began</div>
              <h2 className="max-w-[1040px] text-[clamp(42px,12vw,112px)] font-semibold leading-[0.9] tracking-[-0.06em] sm:leading-[0.86] sm:tracking-[-0.072em]">
                The challenge started the journey. The road became the reward.
              </h2>
            </div>
            <div className="max-w-[430px] pb-2">
              <div className="mb-5 h-1 w-16 bg-[#e82127]" />
              <p className="text-[17px] leading-[1.7] text-black/65">
                I built ChargeQuest to give myself the best possible shot at an
                ambitious goal. But the more I mapped the trip, the clearer it
                became: winning would be incredible, but it would not be the only
                win. The places between charging stops, the unexpected detours, and
                the people following along would become the story.
              </p>
              <p className="mt-5 text-[17px] leading-[1.7] text-black/65">
                So the personal route engine became something shared—a place to follow
                the first quest, compare ideas, and build a journey of your own.
              </p>
            </div>
          </div>
          <div className="mt-16 grid gap-7 border-t border-black/15 pt-7 sm:mt-24 sm:grid-cols-3 sm:gap-8 sm:pt-8">
            <EditorialFact number="17" label="Tesla Iconic Charger badge locations mapped" />
            <EditorialFact number="48" label="Contiguous states full of possible stories" />
            <EditorialFact number="∞" label="Possible routes to make your own" />
          </div>
          {!user ? (
            <div className="mt-16 flex flex-col justify-between gap-6 border-t border-black/15 pt-8 sm:flex-row sm:items-center">
              <div>
                <div className="text-[22px] font-semibold tracking-[-0.03em]">I may be taking the first ChargeQuest. I do not plan to take it alone.</div>
                <div className="mt-2 text-[13px] text-black/50">Choose a username, add your Tesla, and start shaping a route of your own.</div>
              </div>
              <Link to="/signup?returnTo=%2Fplanner" className="flex min-h-12 w-full flex-none items-center justify-center rounded-full bg-[#e82127] px-7 py-4 text-center text-[13px] font-semibold text-white no-underline shadow-[0_12px_30px_rgba(232,33,39,.22)] sm:w-auto">
                Start your quest
              </Link>
            </div>
          ) : null}
        </div>
      </section>

      <section className="cq-destination-gallery overflow-hidden bg-[#090a0c] px-4 py-20 text-white sm:px-5 sm:py-24 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-[1380px]">
          <div className="mb-16 flex flex-col justify-between gap-7 md:flex-row md:items-end">
            <div>
              <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#23d7d1]">Make the route worth remembering</div>
              <h2 className="mt-4 max-w-[820px] text-[clamp(39px,11vw,92px)] font-semibold leading-[0.94] tracking-[-0.052em] sm:leading-[0.91] sm:tracking-[-0.06em]">
                Your route should feel like yours
              </h2>
            </div>
            <p className="max-w-[390px] text-[14px] leading-[1.7] text-white/55">
              Start with the parks, cities, badge locations, and local stops you
              would hate to miss. ChargeQuest connects those ideas through the
              Supercharger network without losing what made you want to go.
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
              <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/60">Every state makes a case</div>
              <div>
                <div className="text-[clamp(52px,7vw,94px)] font-semibold leading-[.82] tracking-[-0.07em]">48</div>
                <div className="mt-3 max-w-[260px] text-[16px] font-semibold leading-[1.2]">contiguous states full of reasons to change the plan</div>
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

      <section className="cq-product-stage overflow-hidden bg-[#e82127] px-4 py-20 text-white sm:px-5 sm:py-24 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-[1320px]">
          <div className="grid gap-12 lg:grid-cols-[.82fr_1.18fr] lg:items-end">
            <div className="max-w-[540px]">
              <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-white/65">Under the hood</div>
              <h2 className="mt-5 text-[clamp(40px,11vw,88px)] font-semibold leading-[0.93] tracking-[-0.055em] sm:leading-[0.9] sm:tracking-[-0.062em]">
                Meet CORE.
              </h2>
              <div className="mt-5 font-mono text-[11px] font-semibold uppercase tracking-[0.11em] text-white">
                Charging Optimization &amp; Route Engine
              </div>
              <p className="mt-7 text-[16px] leading-[1.7] text-white/78">
                ChargeQuest CORE turns your Tesla, practical range, preferred pace,
                required stops, and Iconic Charger targets into a multi-day route you
                could actually drive. It connects the places that matter through the
                Supercharger network and helps you compare, save, and refine different
                strategies.
              </p>
              <div className="mt-7 border-y border-white/20">
                <CoreStep number="01" title="Tell CORE what matters" body="Tesla, range, pace, dates, destinations, and badge targets." />
                <CoreStep number="02" title="CORE connects the journey" body="Charging sequence, route direction, daily limits, and tradeoffs." />
                <CoreStep number="03" title="You choose and refine" body="Compare candidates, save versions, and keep improving the trip." />
              </div>
              <Link to={plannerHref} className="mt-8 flex min-h-12 w-full items-center justify-center rounded-full bg-black px-6 py-3.5 text-center text-[13px] font-semibold text-white no-underline transition hover:bg-white hover:text-black sm:inline-flex sm:w-auto">
                {user ? 'Open CORE' : 'Build Your Route with CORE'}
              </Link>
            </div>

            <CorePreview />
          </div>
        </div>
      </section>

      <section className="grid min-h-[720px] bg-black text-white lg:grid-cols-2">
        <div className="relative min-h-[360px] overflow-hidden sm:min-h-[520px] lg:min-h-full">
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

        <div className="flex items-center px-4 py-16 sm:px-5 sm:py-20 lg:px-14 xl:px-20">
          <div className="w-full max-w-[620px]">
            <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#23d7d1]">The first route is taking shape in public</div>
            <h2 className="mt-5 text-[clamp(40px,11vw,82px)] font-semibold leading-[0.93] tracking-[-0.055em] sm:leading-[0.9] sm:tracking-[-0.062em]">
              Follow the quest. Help shape what comes next.
            </h2>
            <p className="mt-7 max-w-[560px] text-[16px] leading-[1.7] text-white/60">
              Vote for states that deserve a place on the route, share a stop that
              should not be missed, or offer a local meetup along the way. Then follow
              the live tracker as the plan becomes a real trip—with the wins, setbacks,
              detours, and discoveries included.
            </p>

            <div className="mt-10 grid grid-cols-2 border-y border-white/15 sm:grid-cols-4">
              <DarkMetric label="State votes" value={stateVoteCount} />
              <DarkMetric label="Suggestions" value={community?.suggestions.length ?? 0} />
              <DarkMetric label="Meetups" value={community?.meetups.length ?? 0} />
              <DarkMetric label="Status" value={trip?.active ? `Day ${trip.dayNumber ?? '—'}` : 'Pre-trip'} />
            </div>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link to="/track-anthony" className="flex min-h-12 w-full items-center justify-center rounded-full bg-white px-6 py-3.5 text-center text-[13px] font-semibold text-black no-underline sm:w-auto">See the latest progress</Link>
              <Link to="/community" className="flex min-h-12 w-full items-center justify-center rounded-full border border-white/40 bg-black/40 px-6 py-3.5 text-center text-[13px] font-semibold text-white no-underline sm:w-auto">Shape the route together</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="cq-editorial-light px-4 py-20 text-center sm:px-5 sm:py-36 lg:px-8 lg:py-44">
        <div className="mx-auto max-w-[1120px]">
          <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-black/45">What ChargeQuest is becoming</div>
          <h2 className="mt-5 text-[clamp(44px,13vw,148px)] font-semibold leading-[0.88] tracking-[-0.062em] sm:leading-[0.82] sm:tracking-[-0.075em]">
            The road is the reward.
          </h2>
          <p className="mx-auto mt-9 max-w-[620px] text-[17px] leading-[1.7] text-black/60">
            ChargeQuest is starting with one competition route. The larger idea is a
            home for EV adventures of every size: an ambitious national challenge, a
            historic road, every Supercharger in your state, a first cross-country
            trip, or simply taking the long way home.
          </p>
          <p className="mx-auto mt-5 max-w-[620px] text-[17px] font-semibold leading-[1.7] text-black/72">
            There isn’t one way to win a ChargeQuest. Start with a road worth remembering.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
            <Link to={plannerHref} className="flex min-h-12 w-full items-center justify-center rounded-full bg-black px-8 py-4 text-center text-[14px] font-semibold text-white no-underline transition hover:bg-[#e82127] sm:w-auto">
              {user ? 'Build another route' : 'Start your quest'}
            </Link>
            <Link to="/track-anthony" className="flex min-h-12 w-full items-center justify-center rounded-full border border-black/25 bg-transparent px-8 py-4 text-center text-[14px] font-semibold text-black no-underline transition hover:border-black sm:w-auto">
              Follow the first quest
            </Link>
          </div>
          <div className="mx-auto mt-14 max-w-[820px] border-t border-black/15 text-left sm:mt-20">
            <FaqItem
              question="Is ChargeQuest a Tesla Supercharger route planner"
              answer="Yes. ChargeQuest CORE is a Tesla Supercharger route planner and optimization engine for multi-day trips. It accounts for your vehicle, practical range, daily driving limits, trip pace, landmarks, and Iconic Charger targets."
            />
            <FaqItem
              question="Do I need an account to use CORE"
              answer="Yes. A free username-based account unlocks CORE and keeps your vehicle preferences and custom routes private to you. No email address or third-party login is required."
            />
            <FaqItem
              question="Can I use ChargeQuest for the 2026 Tesla Supercharging Competition"
              answer="Yes. CORE helps competitors compare route ideas, target unique Supercharger sites, account for Iconic Charger badges, and shape an ambitious trip around a pace they can actually sustain."
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

function HeroBenefit({
  icon: Icon,
  title,
  body,
}: {
  icon: LucideIcon
  title: string
  body: string
}) {
  return (
    <div className="grid grid-cols-[34px_1fr] gap-3 border-b border-white/15 py-3 last:border-b-0 md:border-b-0 md:border-l md:px-5 md:py-4 md:first:border-l-0 md:first:pl-0">
      <Icon aria-hidden="true" className="mt-0.5 h-6 w-6 text-[#ff4c4c]" strokeWidth={1.8} />
      <div>
        <div className="text-[12.5px] font-semibold leading-[1.35] text-white">{title}</div>
        <div className="mt-1 max-w-[270px] text-[11px] leading-[1.5] text-white/58">{body}</div>
      </div>
    </div>
  )
}

function CoreStep({
  number,
  title,
  body,
}: {
  number: string
  title: string
  body: string
}) {
  return (
    <div className="grid grid-cols-[32px_1fr] gap-3 border-b border-white/15 py-3.5 last:border-b-0">
      <span className="pt-0.5 font-mono text-[8px] tracking-[0.1em] text-white/45">{number}</span>
      <div>
        <div className="text-[12.5px] font-semibold text-white">{title}</div>
        <div className="mt-1 text-[11.5px] leading-[1.5] text-white/60">{body}</div>
      </div>
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
        <div className="hidden max-w-[150px] text-right font-mono text-[7px] uppercase tracking-[0.08em] text-white/35 sm:block">{credit}</div>
      </figcaption>
    </figure>
  )
}

function CorePreview() {
  return (
    <div className="cq-planner-preview overflow-hidden rounded-[20px] border border-white/15 bg-[#0d1016] text-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/10 bg-[#131821] px-5 py-4 sm:px-6">
        <div>
          <div className="font-mono text-[8px] uppercase tracking-[0.13em] text-[#23d7d1]">ChargeQuest CORE</div>
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
    <div className="cq-mobile-metric border-r border-white/15 px-3 py-5 first:pl-0 last:border-r-0 sm:px-4">
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
