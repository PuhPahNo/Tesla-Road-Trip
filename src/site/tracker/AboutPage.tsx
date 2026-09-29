import type { ReactNode } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { usePageMetadata } from '../usePageMetadata'
import { PUBLIC_PAGES } from '../sitePages'
import { ANTHONY_EMAIL, ANTHONY_EMAIL_HREF, ANTHONY_INSTAGRAM_URL } from '../contact'
import { LEGAL_OPERATOR_DISCLOSURE } from '../business'
import { Kicker, PageContainer } from './components'
import { useTripData } from './TripData'
import { formatLongDate, formatMiles } from './tripProgress'

const COMPETITION_RULES_URL = 'https://www.tesla.com/support/tesla-app/charging-badges/contest'

export function AboutPage() {
  usePageMetadata(PUBLIC_PAGES.about)
  const { published, progress } = useTripData()
  const route = published?.route

  return (
    <PageContainer className="max-w-[760px] pb-16 pt-8 sm:pt-12">
      <Kicker>About</Kicker>
      <h1 className="font-display mt-2 text-[clamp(36px,7vw,56px)] font-semibold leading-[1.02] tracking-[-0.03em]">
        Hi, I’m Anthony.
      </h1>

      <Prose>
        <p>
          This fall I’m driving a big loop around the country in my Tesla, charging at a different
          Supercharger every day. This site is where friends, family and anyone else curious can follow along.
        </p>
        {route ? (
          <p>
            The plan: {route.totalDays} days, {route.uniqueStations} Superchargers and about{' '}
            {formatMiles(route.totalMiles)} miles, starting and ending in Chattanooga
            {progress.departureDate ? `, leaving ${formatLongDate(progress.departureDate)}` : ''}.
          </p>
        ) : null}
      </Prose>

      <Section title="Why?">
        <p>
          It started with Tesla’s{' '}
          <a href={COMPETITION_RULES_URL} target="_blank" rel="noreferrer">
            2026 Supercharging Competition
          </a>
          , which rewards the longest streak of new Superchargers, the most unique sites and the most
          energy charged. A route like this one works for all three.
        </p>
        <p>
          The competition is the excuse. The real goal is the trip itself: the Rockies, the national parks,
          the coast, and plenty of small towns in between. I’d rather have a great trip than a perfect score.
        </p>
      </Section>

      <Section title="How the route was built">
        <p>
          I built my own route planner, CORE, to work it out. It picks each day’s Superchargers, keeps the
          drives reasonable and makes sure every day adds a new charger. The route page shows the plan exactly
          as CORE laid it out.
        </p>
        <p>
          Plans change on the road. Weather, closed chargers and good detours all happen, and when they do
          I’ll update the route.
        </p>
      </Section>

      <Section title="How to follow along">
        <ul>
          <li><strong>Tracker</strong>: where I am today, what’s next and the running totals.</li>
          <li><strong>Route</strong>: every planned day on the map, with miles and stops.</li>
          <li><strong>Journal</strong>: posts, photos and videos as the trip happens.</li>
        </ul>
        <p>No account or sign-up needed. Just bookmark the page and check back.</p>
      </Section>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        {ANTHONY_INSTAGRAM_URL ? (
          <a
            href={ANTHONY_INSTAGRAM_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-accent px-6 text-[15px] font-semibold text-on-accent no-underline"
          >
            Instagram <ArrowUpRight size={16} aria-hidden="true" />
          </a>
        ) : null}
        <a
          href={ANTHONY_EMAIL_HREF}
          className="inline-flex min-h-12 items-center justify-center rounded-full border border-edge2 px-6 text-[15px] font-medium text-ink no-underline hover:bg-chip"
        >
          {ANTHONY_EMAIL}
        </a>
      </div>

      <p className="mt-10 text-[13px] leading-[1.6] text-faint">
        {LEGAL_OPERATOR_DISCLOSURE} This is a personal project. It isn’t affiliated with or endorsed by Tesla,
        and Tesla’s own records decide the competition.
      </p>
    </PageContainer>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-[24px] font-semibold leading-[1.2] tracking-[-0.02em]">{title}</h2>
      <Prose>{children}</Prose>
    </section>
  )
}

function Prose({ children }: { children: ReactNode }) {
  return (
    <div className="mt-4 flex flex-col gap-4 text-[17px] leading-[1.7] text-ink/90 [&_a]:font-medium [&_a]:text-accent [&_a]:underline [&_a]:underline-offset-2 [&_li]:mt-1.5 [&_ul]:m-0 [&_ul]:list-disc [&_ul]:pl-5">
      {children}
    </div>
  )
}
