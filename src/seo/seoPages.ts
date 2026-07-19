import { TESLA_ICONIC_BADGES } from '../domain/teslaBadges'

export const SITE_ORIGIN = 'https://www.teslachargequest.com'
export const SEO_UPDATED_AT = '2026-07-19'
export const SEO_AUTHOR = {
  name: 'Anthony Pappano',
  path: '/about-anthony',
  url: `${SITE_ORIGIN}/about-anthony`,
}

export type SeoPageKind = 'hub' | 'guide' | 'badge' | 'route' | 'about'

export interface SeoTableCell {
  text: string
  href?: string
  links?: Array<{ text: string; href: string }>
}

export interface SeoTable {
  caption: string
  columns: string[]
  rows: Array<Array<string | SeoTableCell>>
}

export interface SeoSection {
  heading: string
  paragraphs: string[]
  bullets?: string[]
  table?: SeoTable
}

export interface SeoFact {
  label: string
  value: string
}

export interface SeoSource {
  label: string
  url: string
}

export interface SeoPage {
  path: string
  kind: SeoPageKind
  eyebrow: string
  title: string
  description: string
  headline: string
  intro: string
  updatedAt: string
  facts: SeoFact[]
  sections: SeoSection[]
  note?: string
  sources: SeoSource[]
  relatedPaths: string[]
  cta: {
    title: string
    body: string
    label: string
    path: string
  }
}

const competitionSource: SeoSource = {
  label: 'Tesla — 2026 Free Supercharging Competition rules',
  url: 'https://www.tesla.com/support/tesla-app/charging-badges/contest',
}

const badgeSource: SeoSource = {
  label: 'Tesla — Charging Badges',
  url: 'https://www.tesla.com/support/tesla-app/charging-badges',
}

const buildRouteCta = {
  title: 'Turn the idea into your route',
  body: 'CORE can recalculate around your Tesla, practical range, daily driving limit, badge targets, and the places you refuse to skip.',
  label: 'Build your route with CORE',
  path: '/signup?returnTo=%2Fplanner',
}

const competitionComparisonTable: SeoTable = {
  caption: 'How the three 2026 Tesla Supercharging Competition categories differ',
  columns: ['Category', 'Tesla measures', 'Route-planning implication', 'Where CORE helps'],
  rows: [
    [
      'Longest Trip',
      'The longest continuous streak of unique Supercharger locations under Tesla’s stated timing rule.',
      'Continuity, recoverable sequencing, and a backup site matter more than drawing the longest-looking line.',
      'Compare multi-day streak routes, daily limits, required stops, and alternate candidates.',
    ],
    [
      'Most Unique Sites',
      'The highest number of different qualifying Supercharger sites visited during 2026.',
      'Dense corridors and low-cost detours can produce more new sites per hour than a scenic national loop.',
      'Model site coverage, preserve route history, and compare the cost of different corridors.',
    ],
    [
      'Most Energy Supercharged',
      'The highest total qualifying energy delivered at Superchargers in 2026.',
      'Your real vehicle, driving volume, efficiency, weather, and charging behavior matter more than site count alone.',
      'Plan from a vehicle profile and practical range while keeping energy output clearly labeled as an estimate.',
    ],
  ],
}

const badgeReferenceTable: SeoTable = {
  caption: 'The 17 North American Iconic Charger badge targets currently mapped in ChargeQuest',
  columns: ['Badge', 'Region', 'ChargeQuest mapped target', 'Official location'],
  rows: TESLA_ICONIC_BADGES.map((badge) => [
    badge.label,
    `${badge.state}, ${badge.country}`,
    badge.summary,
    {
      text: badge.officialLocationUrls.length > 1 ? 'Tesla locations' : 'Tesla location',
      links: badge.officialLocationUrls.map((href, index) => ({
        text: badge.officialLocationUrls.length > 1 ? `Location ${index + 1}` : 'Open location',
        href,
      })),
    },
  ]),
}

const coreExampleAssumptions =
  'To make this concrete, I ran the template through CORE on July 19, 2026 using the same fixed setup for all three examples: Chattanooga start, September 1 departure, 60-day Longest Trip target, Tesla Model Y Long Range AWD, 245-mile practical range, balanced pace, five target driving hours with a 6.5-hour maximum, automatic stays off, and U.S. Superchargers only. The run used 3,146 eligible stations from the Supercharge.info feed.'

function coreExampleTable({
  routeName,
  totalMiles,
  averageMilesPerDay,
  averageDriveHoursPerDay,
}: {
  routeName: string
  totalMiles: string
  averageMilesPerDay: string
  averageDriveHoursPerDay: string
}): SeoTable {
  return {
    caption: `${routeName} — fixed CORE example output`,
    columns: ['Metric', 'Example output', 'How to read it'],
    rows: [
      ['Planning distance', totalMiles, 'CORE estimate before live turn-by-turn road refinement.'],
      ['Planned streak', '60 days / 60 unique sites', 'One new qualifying site is planned for each route day.'],
      ['Average distance', `${averageMilesPerDay} per day`, 'The mean hides harder and easier individual days.'],
      ['Average drive time', `${averageDriveHoursPerDay} per day`, 'Based on the disclosed 60 mph planning assumption.'],
      ['Average site spacing', averageMilesPerDay, 'Average route distance associated with each planned unique site.'],
    ],
  }
}

export const SEO_PAGES: SeoPage[] = [
  {
    path: '/2026-tesla-supercharging-competition',
    kind: 'hub',
    eyebrow: '2026 competition field guide',
    title: '2026 Tesla Supercharging Competition Guide | ChargeQuest',
    description: 'A plain-English guide to the 2026 Tesla Supercharging Competition categories, dates, rules, and the route decisions that matter.',
    headline: 'The 2026 Tesla Supercharging Competition, without the guesswork',
    intro: 'The competition is what pushed me to build ChargeQuest in the first place. This guide is my working map of the challenge: what Tesla has announced, what each category actually rewards, and where route planning can help without pretending the road will cooperate perfectly.',
    updatedAt: SEO_UPDATED_AT,
    facts: [
      { label: 'Competition window', value: 'January 1–December 31, 2026' },
      { label: 'Categories', value: '3 in each global region' },
      { label: 'Total winners', value: '9 worldwide' },
    ],
    sections: [
      {
        heading: 'Three different competitions hiding inside one challenge',
        paragraphs: [
          'Tesla is tracking Longest Trip, Most Unique Supercharger Sites Visited, and Most Energy Supercharged. Those sound related, but they reward different behavior. A route built to extend a continuous streak is not automatically the best route for collecting the largest number of unique sites. A high-energy strategy may favor different driving, charging, and vehicle decisions again.',
          'That is why I do not think there is one “best” national route. There are routes that fit a category, a vehicle, a pace, a starting point, and a person’s tolerance for very long days. The honest work begins by choosing which score you actually care about.',
        ],
        bullets: [
          'Longest Trip: keep a continuous streak alive by starting at a new Supercharger site within Tesla’s stated 24-hour window.',
          'Most Unique Sites: visit as many different qualifying Supercharger sites as possible during the competition window.',
          'Most Energy: accumulate the largest amount of energy delivered through qualifying Supercharging sessions.',
        ],
        table: competitionComparisonTable,
      },
      {
        heading: 'What route planning can solve—and what it cannot',
        paragraphs: [
          'A planner can help sequence stops, test a realistic driving pace, identify badge locations, and reveal where a beautiful detour costs too much time. It cannot guarantee a charger will be open, traffic will behave, weather will stay friendly, or a session will qualify exactly as expected. Tesla owns the scoreboard and the final rules.',
          'My approach is to build a strong plan with room to recover. I would rather know the next two or three viable moves than chase a brittle route that only works if every minute lands perfectly. The competition may reward a number, but the trip still has to be lived.',
        ],
      },
      {
        heading: 'The dates and enrollment detail worth remembering',
        paragraphs: [
          'Tesla says competition activity runs through the 2026 calendar year. Enrollment is expected through the 2026 Passport in December 2026, and Tesla says participants need to visit that Passport before January 1, 2027. That is unusual enough that I would not rely on memory or a third-party summary when the deadline gets close.',
          'Use this field guide to think through the strategy, then confirm the current language in Tesla’s app and official rules page. I will keep ChargeQuest aligned with what Tesla publishes, but Tesla can change eligibility, badge locations, or competition details.',
        ],
      },
    ],
    note: 'ChargeQuest is independent and is not affiliated with or endorsed by Tesla. Tesla controls eligibility, scoring, official results, and any rule changes.',
    sources: [competitionSource],
    relatedPaths: [
      '/competition/longest-trip-strategy',
      '/competition/most-unique-supercharger-sites',
      '/competition/most-energy-supercharged',
      '/tesla-road-trip-routes',
    ],
    cta: buildRouteCta,
  },
  {
    path: '/competition/longest-trip-strategy',
    kind: 'guide',
    eyebrow: 'Competition strategy',
    title: 'Tesla Longest Trip Competition Strategy | ChargeQuest',
    description: 'How to think about the Longest Trip category: the 24-hour continuity rule, route resilience, pacing, recovery options, and honest tradeoffs.',
    headline: 'Longest Trip is a continuity problem before it is a distance problem',
    intro: 'The dramatic version of this category is a giant line across the map. The practical version is quieter: can you keep reaching a new Supercharger site before the continuity window closes, day after day, without designing a trip that falls apart after one delay?',
    updatedAt: SEO_UPDATED_AT,
    facts: [
      { label: 'Primary constraint', value: 'A new site inside the stated 24-hour window' },
      { label: 'Planning priority', value: 'Continuity and recovery' },
      { label: 'Biggest trap', value: 'A brittle perfect-day schedule' },
    ],
    sections: [
      {
        heading: 'Treat every stop as a link in the chain',
        paragraphs: [
          'Tesla describes Longest Trip as a continuous streak of unique Supercharger sites, with a charging session at a new site beginning within 24 hours of the previous session ending. That makes the clock between sessions more important than the shape of the route on a poster.',
          'I would track the session end time, the next planned site, and at least one backup site. A stop is not just where you charge; it is the point that resets the next decision window. The plan should make that relationship obvious.',
        ],
      },
      {
        heading: 'Build slack where a delay can do the most damage',
        paragraphs: [
          'A route with no margin can look efficient in a spreadsheet and still be a bad road plan. Weather, queues, hotel sleep, road closures, a missed exit, or a charger issue can consume the buffer you thought you had. The answer is not to make every day timid. It is to identify the handful of legs where missing one site leaves no reasonable recovery.',
          'For those legs, I want shorter commitments, alternate sites, and an earlier target arrival. On denser corridors, the route can be more aggressive because the network offers choices. In sparse country, resilience is part of the score strategy.',
        ],
      },
      {
        heading: 'Do not confuse endurance with exhaustion',
        paragraphs: [
          'This category tempts people to optimize every human need out of the plan. I think that is a mistake. A sustainable pace gives you a better chance of making good decisions deep into the trip, and it leaves enough attention to experience the places you are driving through.',
          'CORE lets you set daily limits and compare route candidates because the correct pace is personal. I am building my own ambitious plan, but I still want a trip I can remember for something besides a countdown clock.',
        ],
      },
    ],
    note: 'Always confirm the current continuity language and qualifying-session requirements in Tesla’s official rules before acting on a competition plan.',
    sources: [competitionSource],
    relatedPaths: [
      '/2026-tesla-supercharging-competition',
      '/competition/most-unique-supercharger-sites',
      '/routes/great-american-icons',
    ],
    cta: buildRouteCta,
  },
  {
    path: '/competition/most-unique-supercharger-sites',
    kind: 'guide',
    eyebrow: 'Competition strategy',
    title: 'Most Unique Tesla Supercharger Sites Strategy | ChargeQuest',
    description: 'A practical strategy guide for visiting more unique Tesla Supercharger sites while balancing network density, detours, pace, and memorable stops.',
    headline: 'Unique sites reward coverage, not a pretty line on the map',
    intro: 'If the goal is to visit the most different Supercharger sites, the route needs to produce new stops efficiently. But “efficient” cannot mean blindly zigzagging through every dense cluster. The trip still has a driver, a clock, a vehicle, and a life around it.',
    updatedAt: SEO_UPDATED_AT,
    facts: [
      { label: 'Score idea', value: 'Different qualifying sites visited' },
      { label: 'Strong terrain', value: 'Dense corridors with multiple exits' },
      { label: 'Planning tension', value: 'Site count versus detour cost' },
    ],
    sections: [
      {
        heading: 'Measure the cost of the next unique stop',
        paragraphs: [
          'The useful question is not simply “how many chargers are nearby?” It is “how much time and distance does the next new site add compared with continuing?” Two sites that appear close on a national map can sit on opposite sides of traffic, tolls, or an awkward road pattern.',
          'I would prioritize runs where several new sites line up along the direction of travel. A small detour can be worthwhile when it opens another dense corridor. A large out-and-back for one isolated site deserves more skepticism unless the place itself matters to the journey.',
        ],
      },
      {
        heading: 'Keep the site history clean',
        paragraphs: [
          'This category depends on uniqueness, so recordkeeping matters. Display names can change, nearby locations can sound alike, and a return visit can feel new after a long trip. Keep a reliable log of Tesla’s location identity, the session time, and enough context to recognize a duplicate.',
          'ChargeQuest plans with a live Supercharger feed and preserves the route sequence, but Tesla’s own account and competition records remain the authority. I would compare the plan with the actual charging history throughout the year rather than wait until December to find a mismatch.',
        ],
      },
      {
        heading: 'Use memorable stops to make an aggressive route human',
        paragraphs: [
          'A pure site-count route can become a blur of parking lots. That may be the correct competitive choice for someone, but it is not the only way to pursue the category. I like using a few national parks, cities, roadside landmarks, or Iconic Charger badges as anchors, then letting the dense network between them do the counting work.',
          'You may give up a handful of theoretical stops. You may also build a trip you still care about halfway through. That trade is worth seeing clearly before the first mile.',
        ],
      },
    ],
    note: 'Tesla determines whether a session and site qualify. ChargeQuest route counts are planning estimates, not an official competition score.',
    sources: [competitionSource],
    relatedPaths: [
      '/2026-tesla-supercharging-competition',
      '/competition/longest-trip-strategy',
      '/tesla-iconic-charger-badges',
    ],
    cta: buildRouteCta,
  },
  {
    path: '/competition/most-energy-supercharged',
    kind: 'guide',
    eyebrow: 'Competition strategy',
    title: 'Most Energy Supercharged Strategy for Tesla Drivers | ChargeQuest',
    description: 'What the Most Energy Supercharged category rewards, which assumptions matter, and why an honest plan starts with your actual Tesla and driving pattern.',
    headline: 'Most Energy is not the same contest with a different scoreboard',
    intro: 'The energy category sounds simple: receive more energy through Supercharging. Turning that into a responsible plan is harder. Vehicle efficiency, battery size, weather, speed, elevation, charging behavior, and the amount you actually drive can all change the result.',
    updatedAt: SEO_UPDATED_AT,
    facts: [
      { label: 'Score idea', value: 'Qualifying energy delivered' },
      { label: 'Core input', value: 'Your real vehicle and usage' },
      { label: 'Important boundary', value: 'Tesla owns the official measurement' },
    ],
    sections: [
      {
        heading: 'Start with the car you actually have',
        paragraphs: [
          'A Model 3, Model Y, Model S, Model X, and Cybertruck do not consume energy the same way. Even two versions of the same model can have different practical ranges. A route estimate that ignores the vehicle is not a serious estimate.',
          'CORE begins with a vehicle profile and practical range because those inputs affect where the route needs to charge. They do not predict an official energy total. Think of the result as a way to compare route behavior, not as a promise of kilowatt-hours.',
        ],
      },
      {
        heading: 'Avoid fake precision',
        paragraphs: [
          'It is easy to produce a large-looking energy number by stacking assumptions. The road will expose those assumptions quickly. Temperature, headwinds, speed, elevation, payload, HVAC use, arrival state of charge, and charger performance all move the real result.',
          'I would rather plan a route with transparent estimates and update it from actual sessions than advertise a decimal point the trip has not earned. Tesla’s records are the competition truth. ChargeQuest is there to help you decide where a plausible journey could go.',
        ],
      },
      {
        heading: 'Make sure the effort still has a reason',
        paragraphs: [
          'More energy generally means more driving and more charging. That is a real commitment of time, cost, and attention. Before optimizing the route, decide why you want to take it and what would make the year worthwhile if someone else finishes ahead of you.',
          'For me, the answer is the road itself: the national parks, cities, local stops, badge locations, and people who become part of the story. A competition goal can push the journey forward without being the only way the journey succeeds.',
        ],
      },
    ],
    note: 'ChargeQuest does not calculate or certify Tesla’s official competition energy total. Confirm category eligibility and scoring directly with Tesla.',
    sources: [competitionSource],
    relatedPaths: [
      '/2026-tesla-supercharging-competition',
      '/competition/most-unique-supercharger-sites',
      '/tesla-road-trip-routes',
    ],
    cta: buildRouteCta,
  },
  {
    path: '/tesla-iconic-charger-badges',
    kind: 'hub',
    eyebrow: 'Iconic Charger field guide',
    title: 'Tesla Iconic Charger Badges and Road Trip Planning | ChargeQuest',
    description: 'Plan a Tesla road trip around Iconic Charger badges, understand the location caveats, and explore badge stops near Grand Canyon, Yellowstone, Yosemite, and Hollywood.',
    headline: 'A charging stop can be part of the destination',
    intro: 'Tesla’s Iconic Charger badges are one of my favorite route-planning constraints. They turn a necessary stop into a reason to choose one road over another. ChargeQuest currently maps 17 North American badge locations, then lets you place those targets beside the parks, cities, and landmarks you already want to see.',
    updatedAt: SEO_UPDATED_AT,
    facts: [
      { label: 'Mapped in CORE', value: '17 North American badges' },
      { label: 'Mainland planning', value: 'Lower 48 plus optional Canada' },
      { label: 'Official source', value: 'Tesla app and location pages' },
    ],
    sections: [
      {
        heading: 'How the badge layer works in ChargeQuest',
        paragraphs: [
          'Each mapped badge points to a specific qualifying Supercharger location or a small set of locations Tesla associates with the destination. CORE can make selected badges required route anchors, so they are not quietly dropped when a shorter path appears.',
          'That matters because the attraction and the qualifying charger are not always the same point. The Grand Canyon badge is tied to Tusayan near the South Rim. Yellowstone uses West Yellowstone. Yosemite has gateway options at El Portal and Fish Camp. The badge name tells the story; the location record tells the planner where to go.',
        ],
      },
      {
        heading: 'The complete North American badge reference mapped today',
        paragraphs: [
          'The table below comes from the same 17-record catalog CORE uses for route targeting. It is a planning reference, not a permanent promise from Tesla. A badge can be connected to one site or several qualifying sites, and Tesla’s app remains the final place to check the current requirement.',
          'I included every mapped target rather than publishing a separate thin page for each one. The detail guides exist only where the route decision deserves more explanation.',
        ],
        table: badgeReferenceTable,
      },
      {
        heading: 'Badges are targets, not guarantees',
        paragraphs: [
          'Tesla says badge details live in the app and that awards may take time to appear. Locations and eligibility can change. ChargeQuest uses Tesla location links and narrow matching against the live station feed, but it cannot issue a badge or overrule Tesla’s records.',
          'Before making a long detour, check the current badge in the Tesla app and open the official location page. After charging, keep the session in your own trip log until the badge appears. The route can be adventurous without being careless.',
        ],
      },
      {
        heading: 'Build a badge trip around places you already care about',
        paragraphs: [
          'Collecting every badge is a fun quest, but it is not the only worthwhile plan. A western parks loop can pair Grand Canyon, Yellowstone, Yosemite, Arches, Bryce Canyon, and Joshua Tree. A California drive can connect Tesla Diner, Santa Monica, Golden Gate Bridge, Yosemite, and Oasis.',
          'Start with the stops that would make you regret passing nearby. Then let the route engine connect them at a pace you can actually drive. The badge should add meaning to the journey, not flatten the journey into a checklist.',
        ],
      },
    ],
    note: 'ChargeQuest is independent from Tesla. Badge eligibility, qualifying locations, and award timing are controlled by Tesla and may change.',
    sources: [badgeSource],
    relatedPaths: [
      '/badges/grand-canyon',
      '/badges/yellowstone',
      '/badges/yosemite',
      '/badges/tesla-diner',
    ],
    cta: buildRouteCta,
  },
  {
    path: '/badges/grand-canyon',
    kind: 'badge',
    eyebrow: 'Iconic Charger badge',
    title: 'Grand Canyon Tesla Iconic Charger Badge Guide | ChargeQuest',
    description: 'Plan for Tesla’s Grand Canyon Iconic Charger badge at the Tusayan Supercharger near the South Rim, with practical route context and official links.',
    headline: 'The Grand Canyon badge belongs on more than a charging checklist',
    intro: 'The qualifying target mapped in ChargeQuest is the Tusayan Supercharger at The Grand Hotel, just south of the park’s South Rim entrance. It is a natural anchor for a Route 66 trip, a desert parks loop, or a longer western competition route.',
    updatedAt: SEO_UPDATED_AT,
    facts: [
      { label: 'Qualifying target', value: 'Tusayan Supercharger' },
      { label: 'Route region', value: 'Grand Canyon South Rim gateway' },
      { label: 'ChargeQuest use', value: 'Required badge anchor' },
    ],
    sections: [
      {
        heading: 'Plan to the charger, then plan the park',
        paragraphs: [
          'The badge target and the overlook are different stops. CORE routes to the qualifying Supercharger location; your park time, lodging, shuttle plan, and viewpoints still need their own place in the day. That separation keeps a routing shortcut from pretending the attraction happened because you charged nearby.',
          'Tusayan works well as a hinge between Flagstaff or Williams to the south and desert routes toward Las Vegas, Page, or southern Utah. In busy seasons, the miles may be predictable while the park entrance and shuttle timing are not. Give the experience room.',
        ],
      },
      {
        heading: 'A useful anchor for several different quests',
        paragraphs: [
          'For a Route 66-inspired trip, Grand Canyon is the big northern departure from the historic corridor around Flagstaff and Williams. For a badge route, it can connect toward Las Vegas Strip, Joshua Tree, Bryce Canyon, or Arches. For a competition route, it is a memorable reason to pass through a relatively sparse part of the network.',
          'I would choose the surrounding route based on season and available time, not on a national map alone. The canyon is not a place I want to squeeze between two aggressive drive blocks simply because the geometry looks neat.',
        ],
      },
      {
        heading: 'Confirm before the detour',
        paragraphs: [
          'Open the badge in Tesla’s app and the official Tusayan location page before relying on it. ChargeQuest maps the current target and can keep it required in CORE, but Tesla decides whether the session qualifies and when the badge appears.',
        ],
      },
    ],
    note: 'Badge information can change. Verify the current qualifying location in the Tesla app before travel.',
    sources: [
      badgeSource,
      { label: 'Tesla — Tusayan Supercharger', url: 'https://www.tesla.com/findus/location/supercharger/tusayanazsupercharger' },
    ],
    relatedPaths: ['/tesla-iconic-charger-badges', '/routes/tesla-route-66-supercharger-road-trip', '/badges/yellowstone'],
    cta: buildRouteCta,
  },
  {
    path: '/badges/yellowstone',
    kind: 'badge',
    eyebrow: 'Iconic Charger badge',
    title: 'Yellowstone Tesla Iconic Charger Badge Guide | ChargeQuest',
    description: 'Plan for Tesla’s Yellowstone Iconic Charger badge at West Yellowstone, with route context, seasonal caution, and the official charger link.',
    headline: 'West Yellowstone is the badge stop. The park is the journey.',
    intro: 'ChargeQuest maps the Yellowstone badge to the West Yellowstone Supercharger at the Grizzly & Wolf Discovery Center. It is a practical western gateway, but Yellowstone’s size, traffic, weather, and seasonal roads mean the charge is only one part of the plan.',
    updatedAt: SEO_UPDATED_AT,
    facts: [
      { label: 'Qualifying target', value: 'West Yellowstone Supercharger' },
      { label: 'Gateway', value: 'West entrance corridor' },
      { label: 'Planning issue', value: 'Season and park travel time' },
    ],
    sections: [
      {
        heading: 'Do not use straight-line thinking inside Yellowstone',
        paragraphs: [
          'The park is enormous, and a stop that looks nearby can sit hours away once speed limits, wildlife traffic, construction, and the road network enter the picture. Build the charging plan around the entrance you intend to use and the part of the park you actually want to experience.',
          'West Yellowstone can connect toward Idaho, Montana, and the northern Rockies. The correct next charging move depends on where the park day ends, not merely where it began. I would keep the park itinerary and the competition clock visible together.',
        ],
      },
      {
        heading: 'Season is part of the route',
        paragraphs: [
          'A summer map is not automatically a spring or late-fall map. Road access, weather, crowds, and services change across the year. CORE can sequence known charging locations, but it does not replace current park road status or a weather check.',
          'The badge is a strong anchor for the National Parks and Western Icons route because it creates a natural northern turn between the Pacific Northwest, the Dakotas, and the central Rockies. It also deserves more than a rushed photo between long driving days.',
        ],
      },
      {
        heading: 'Protect the badge attempt',
        paragraphs: [
          'Check Tesla’s app for the current badge requirements, then open the official West Yellowstone location page. Charge at the mapped site and preserve the session details. Tesla may take time to award a badge and remains the final authority on qualification.',
        ],
      },
    ],
    note: 'Check current park roads, weather, and Tesla badge eligibility before relying on any Yellowstone route.',
    sources: [
      badgeSource,
      { label: 'Tesla — West Yellowstone Supercharger', url: 'https://www.tesla.com/findus/location/supercharger/westyellowstonesupercharger' },
    ],
    relatedPaths: ['/tesla-iconic-charger-badges', '/routes/tesla-national-parks-road-trip', '/badges/grand-canyon'],
    cta: buildRouteCta,
  },
  {
    path: '/badges/yosemite',
    kind: 'badge',
    eyebrow: 'Iconic Charger badge',
    title: 'Yosemite Tesla Iconic Charger Badge Guide | ChargeQuest',
    description: 'Plan for Tesla’s Yosemite Iconic Charger badge using the El Portal or Fish Camp gateway Superchargers, with route and access context.',
    headline: 'Yosemite gives you two gateway choices—and a reason to choose carefully',
    intro: 'ChargeQuest currently maps two qualifying Yosemite gateway targets from Tesla: El Portal and Fish Camp. That is useful flexibility, but the better stop depends on the road you are already traveling, the park access you expect, and what comes after Yosemite.',
    updatedAt: SEO_UPDATED_AT,
    facts: [
      { label: 'Mapped targets', value: 'El Portal and Fish Camp' },
      { label: 'Route role', value: 'Western parks or California anchor' },
      { label: 'Decision', value: 'Choose the gateway that fits the trip' },
    ],
    sections: [
      {
        heading: 'Pick the gateway before the optimizer picks for you',
        paragraphs: [
          'El Portal sits on the Highway 140 approach west of Yosemite Valley. Fish Camp serves the Highway 41 corridor near the south entrance. They are not interchangeable dots. Your lodging, next destination, seasonal access, and desired park day should decide which one becomes required.',
          'CORE can route through a selected badge location, but it cannot know whether you wanted Mariposa Grove, Yosemite Valley, or a specific entrance experience unless you make that intention clear. The route is strongest when the human decision comes first.',
        ],
      },
      {
        heading: 'Yosemite fits several western stories',
        paragraphs: [
          'From Yosemite, a longer route can continue toward Lake Tahoe and the Pacific Northwest, or turn south toward Los Angeles, Tesla Diner, Joshua Tree, and the desert. A California badge run can connect Golden Gate Bridge, Santa Monica, Oasis, and Yosemite without pretending they are all one easy weekend.',
          'Mountain conditions and seasonal road closures can radically change the usable path. I would recalculate close to departure and check official road status rather than lock a national route months ahead and assume every pass stays open.',
        ],
      },
      {
        heading: 'Use Tesla’s current location record',
        paragraphs: [
          'Open the Yosemite badge in Tesla’s app and verify the qualifying locations before travel. ChargeQuest links both current gateway records and can require the one you select, but only Tesla can confirm that the session earned the badge.',
        ],
      },
    ],
    note: 'Mountain access changes. Confirm current roads, the selected charger, and badge eligibility before the trip.',
    sources: [
      badgeSource,
      { label: 'Tesla — El Portal Supercharger', url: 'https://www.tesla.com/findus/location/supercharger/elportalcasupercharger' },
      { label: 'Tesla — Fish Camp Supercharger', url: 'https://www.tesla.com/findus/location/supercharger/fishcampsupercharger' },
    ],
    relatedPaths: ['/tesla-iconic-charger-badges', '/routes/tesla-national-parks-road-trip', '/badges/tesla-diner'],
    cta: buildRouteCta,
  },
  {
    path: '/badges/tesla-diner',
    kind: 'badge',
    eyebrow: 'Iconic Charger badge',
    title: 'Tesla Diner Iconic Charger Badge Guide | ChargeQuest',
    description: 'Plan the Tesla Diner Iconic Charger badge stop at 7001 Santa Monica Boulevard in Hollywood and connect it to a wider California road trip.',
    headline: 'Tesla Diner is the rare badge stop built to be a stop',
    intro: 'Most charging locations are pauses on the way to somewhere else. Tesla Diner at 7001 Santa Monica Boulevard in Hollywood is different: the charging site is part of the attraction. That makes it an easy anchor for a California badge route—and a place where timing still matters.',
    updatedAt: SEO_UPDATED_AT,
    facts: [
      { label: 'Location', value: '7001 Santa Monica Blvd, Hollywood' },
      { label: 'Route region', value: 'Los Angeles and Southern California' },
      { label: 'Natural pairings', value: 'Santa Monica, Joshua Tree, Yosemite' },
    ],
    sections: [
      {
        heading: 'Treat Los Angeles time as real route time',
        paragraphs: [
          'A few miles across Los Angeles can consume more of the day than a national route preview suggests. If Tesla Diner is required, place it in the schedule intentionally instead of letting the optimizer tuck it between two distant anchors.',
          'The stop can pair with the Santa Monica badge and continue toward San Diego, Joshua Tree, Las Vegas, or the Central Valley. The right sequence depends on traffic, where you plan to sleep, and whether the city itself is part of the trip.',
        ],
      },
      {
        heading: 'A badge route does not need to be a badge sprint',
        paragraphs: [
          'Tesla Diner is a good example of why I like building routes around memorable charging locations. It gives the day a story beyond energy added. The same California journey can reach the coast, national parks, roadside history, and several other Iconic Charger targets.',
          'If you are competing for unique sites, the Los Angeles network may create useful density. If you are building a personal ChargeQuest, the better question may be which stops make Southern California worth the traffic. Both can be valid plans.',
        ],
      },
      {
        heading: 'Confirm the current badge in the app',
        paragraphs: [
          'ChargeQuest maps Tesla’s official location record and can hold the diner as a required target. Tesla still controls badge eligibility and award timing. Verify the current app details before travel, especially if the stop would change a larger route.',
        ],
      },
    ],
    note: 'Hours, access, charging availability, and badge eligibility can change. Check Tesla’s current location details before visiting.',
    sources: [
      badgeSource,
      { label: 'Tesla — Tesla Diner Supercharger', url: 'https://www.tesla.com/findus/location/supercharger/26139' },
    ],
    relatedPaths: ['/tesla-iconic-charger-badges', '/routes/great-american-icons', '/badges/yosemite'],
    cta: buildRouteCta,
  },
  {
    path: '/tesla-road-trip-routes',
    kind: 'hub',
    eyebrow: 'ChargeQuest route library',
    title: 'Tesla Supercharger Road Trip Route Ideas | ChargeQuest',
    description: 'Explore Tesla road trip route ideas built around Route 66, national parks, American icons, Supercharger access, and places worth remembering.',
    headline: 'Start with a road worth remembering',
    intro: 'There is no single correct ChargeQuest. I keep a route library because a strong starting idea is more useful than an empty map. Each route below is a set of meaningful anchors—not a fixed itinerary, a mileage promise, or a substitute for recalculating around your Tesla.',
    updatedAt: SEO_UPDATED_AT,
    facts: [
      { label: 'CORE templates', value: '42 starting route ideas' },
      { label: 'Mapped places', value: '459 cities and landmarks' },
      { label: 'Signature places', value: '193 across 49 state areas' },
    ],
    sections: [
      {
        heading: 'Route 66 and Desert Icons',
        paragraphs: [
          'This route follows the pull of Route 66 without forcing a museum-perfect trace. St. Louis, Oklahoma City, Amarillo, Albuquerque, Santa Fe, Flagstaff, Grand Canyon, Las Vegas, and Los Angeles give the journey its spine, with room to connect from farther east or continue through the Southwest.',
          'It is a road-history trip, a desert trip, and a strong badge opportunity. It is also a route where heat, long gaps, and seasonal park demand deserve respect.',
        ],
      },
      {
        heading: 'National Parks and Western Icons',
        paragraphs: [
          'The western parks route links the central Rockies, Moab, Zion, Grand Canyon, Yosemite, the Pacific Northwest, Yellowstone, and the Badlands. It is intentionally ambitious. The point of the template is to reveal the full shape, then let you cut, reorder, or slow it until the trip becomes yours.',
          'Season decides a great deal here. A beautiful line can cross mountain roads that are not open when you need them. Recalculate near departure and keep the park experience separate from the charging sequence.',
        ],
      },
      {
        heading: 'Great American Icons',
        paragraphs: [
          'This is the broad national story: music cities, the Rockies, desert history, Grand Canyon, Hollywood, San Francisco, the Pacific Northwest, Yellowstone, the Black Hills, Chicago, Washington, and more. It is the kind of route that made me build ChargeQuest.',
          'Nobody needs to drive every anchor. Use the template to discover what you would hate to miss, then remove the stops that belong to someone else’s trip. Your route should feel like yours before CORE ever optimizes it.',
        ],
      },
    ],
    note: 'Every route idea needs live validation for road access, weather, charger status, vehicle range, and current travel conditions.',
    sources: [],
    relatedPaths: [
      '/routes/tesla-route-66-supercharger-road-trip',
      '/routes/tesla-national-parks-road-trip',
      '/routes/great-american-icons',
      '/tesla-iconic-charger-badges',
    ],
    cta: buildRouteCta,
  },
  {
    path: '/routes/tesla-route-66-supercharger-road-trip',
    kind: 'route',
    eyebrow: 'Route idea',
    title: 'Tesla Route 66 Supercharger Road Trip Idea | ChargeQuest',
    description: 'A Tesla Route 66 and desert road trip idea connecting St. Louis, Oklahoma City, Amarillo, New Mexico, Grand Canyon, Las Vegas, and Los Angeles.',
    headline: 'Route 66, with enough freedom to leave Route 66',
    intro: 'The Route 66 and Desert Icons template uses the historic road as a direction, not a cage. It connects familiar Route 66 cities with Santa Fe, Grand Canyon, Las Vegas, Los Angeles, and optional approaches from Nashville, Memphis, Little Rock, Dallas, Phoenix, or San Diego.',
    updatedAt: SEO_UPDATED_AT,
    facts: [
      { label: 'Core spine', value: 'St. Louis to Los Angeles' },
      { label: 'Major anchors', value: 'Route 66 cities plus Grand Canyon and Vegas' },
      { label: 'Best for', value: 'Road history, desert scenery, badge stops' },
    ],
    sections: [
      {
        heading: 'The anchors in the current ChargeQuest template',
        paragraphs: [
          'The full starting set includes Nashville, Memphis, Little Rock, Oklahoma City, Amarillo, Albuquerque, Santa Fe, Flagstaff, Grand Canyon, Las Vegas, Los Angeles, San Diego, Phoenix, Dallas, and St. Louis. CORE reorders and connects those intentions through usable charging stops based on the trip settings.',
          'That is more than most people need in one loop. The list is meant to show possible branches. A purer Route 66 plan can begin in St. Louis and keep moving west. A larger southern loop can use the extra cities to make the journey round-trip shaped.',
        ],
        bullets: [
          'Historic-road spine: St. Louis, Oklahoma City, Amarillo, Albuquerque, Flagstaff, Los Angeles.',
          'Scenic departures: Santa Fe, Grand Canyon, Las Vegas.',
          'Optional loop builders: Nashville, Memphis, Little Rock, Dallas, Phoenix, San Diego.',
        ],
      },
      {
        heading: 'Why Grand Canyon changes the route for the better',
        paragraphs: [
          'Grand Canyon is not on the historic alignment, but it is close enough to become one of the trip’s defining choices. It also creates an Iconic Charger badge target at Tusayan. I think that is a worthy detour, provided the schedule leaves time to see the canyon rather than only collect the stop.',
          'From Flagstaff, the route can return west toward Kingman and Las Vegas or continue through other desert parks. This is where the planner should serve your priorities instead of enforcing a rigid theme.',
        ],
      },
      {
        heading: 'Recalculate for heat, range, and the season you chose',
        paragraphs: [
          'Desert conditions can change practical range and the cost of a delay. Set CORE to your actual Tesla and a conservative range you trust. Then check the live route, road conditions, and charger status close to departure.',
          'This page describes a route idea, not a turn-by-turn itinerary. The actual mileage, time, and charging sequence depend on your start, required stops, travel pace, and current network.',
        ],
      },
      {
        heading: 'A fixed CORE example, so the numbers have context',
        paragraphs: [
          coreExampleAssumptions,
          'That run produced the snapshot below for Route 66 and Desert Icons. The relatively light daily average comes from designing a 60-day charging streak, not from claiming the full loop is a 60-day sightseeing itinerary. Park time, city time, weather, and live road routing still belong in the real plan.',
        ],
        table: coreExampleTable({
          routeName: 'Route 66 and Desert Icons',
          totalMiles: '6,077 miles',
          averageMilesPerDay: '101 miles',
          averageDriveHoursPerDay: '1.69 hours',
        }),
      },
    ],
    note: 'Historic Route 66 access and road conditions vary. Confirm local roads and live charging details before travel.',
    sources: [],
    relatedPaths: ['/tesla-road-trip-routes', '/badges/grand-canyon', '/competition/most-unique-supercharger-sites'],
    cta: buildRouteCta,
  },
  {
    path: '/routes/tesla-national-parks-road-trip',
    kind: 'route',
    eyebrow: 'Route idea',
    title: 'Tesla National Parks Supercharger Road Trip Idea | ChargeQuest',
    description: 'A western Tesla national parks route idea connecting the Rockies, Moab, Zion, Grand Canyon, Yosemite, Yellowstone, the Pacific Northwest, and Badlands.',
    headline: 'A western parks route should follow the season, not fight it',
    intro: 'The National Parks and Western Icons template is the most scenery-heavy route in ChargeQuest. It connects a huge wish list across the Rockies, canyon country, California, the Pacific Northwest, Yellowstone, and the Badlands. Its first job is to inspire. Its second is to be edited.',
    updatedAt: SEO_UPDATED_AT,
    facts: [
      { label: 'Park anchors', value: 'Rocky Mountain, Zion, Grand Canyon, Yosemite, Yellowstone' },
      { label: 'Western cities', value: 'Denver, Las Vegas, Portland, Seattle' },
      { label: 'Main constraint', value: 'Seasonal access and realistic park time' },
    ],
    sections: [
      {
        heading: 'The full template is intentionally bigger than one easy trip',
        paragraphs: [
          'ChargeQuest starts this idea with St. Louis, Denver, Rocky Mountain National Park, Moab, Zion, Grand Canyon, Las Vegas, Yosemite, Lake Tahoe, Portland, Seattle, Yellowstone, Badlands, Minneapolis, and Chicago. CORE then connects the selected anchors through the charging network.',
          'You can treat that as a grand loop or as three smaller journeys: Rockies and canyon country, California and the Pacific Northwest, or Yellowstone and the northern return. Cutting the route is not giving up. It is deciding what deserves real time.',
        ],
        bullets: [
          'Rockies and canyon country: Denver, Rocky Mountain, Moab, Zion, Grand Canyon.',
          'Western turn: Las Vegas, Yosemite, Lake Tahoe, Portland, Seattle.',
          'Northern return: Yellowstone, Badlands, Minneapolis, Chicago.',
        ],
      },
      {
        heading: 'Badge targets fit naturally—but still need verification',
        paragraphs: [
          'Grand Canyon, Yellowstone, and Yosemite each have mapped Iconic Charger targets. Moab can support the Arches badge, and the wider region opens Bryce Canyon and other possibilities. Required targets keep those chargers in the plan when a shorter alternative appears.',
          'Tesla can change badge eligibility. Park roads can close. A route created today should be checked again before departure, and a mountain itinerary should never depend on a seasonal road simply because it made the preview shorter.',
        ],
      },
      {
        heading: 'Budget days for being out of the car',
        paragraphs: [
          'National parks are poor “drive-by” anchors. Arrival traffic, shuttles, trail time, wildlife, and the distance inside the park all sit outside a simple charging calculation. I would rather remove one park than turn five parks into parking-lot photographs.',
          'Set a daily driving limit that leaves space for the reason you came. CORE will still show the tradeoff. The route may become longer on the calendar and better in every other way.',
        ],
      },
      {
        heading: 'A fixed CORE example, so the numbers have context',
        paragraphs: [
          coreExampleAssumptions,
          'For National Parks and Western Icons, CORE returned the snapshot below. It is a charging-streak model across the template anchors. It does not pretend that 1.83 average driving hours tells you how much time Yellowstone, Yosemite, or Grand Canyon deserves outside the car.',
        ],
        table: coreExampleTable({
          routeName: 'National Parks and Western Icons',
          totalMiles: '6,587 miles',
          averageMilesPerDay: '110 miles',
          averageDriveHoursPerDay: '1.83 hours',
        }),
      },
    ],
    note: 'Check National Park Service road status, reservations, weather, and Tesla’s current charger details before travel.',
    sources: [],
    relatedPaths: ['/tesla-road-trip-routes', '/badges/yellowstone', '/badges/yosemite', '/badges/grand-canyon'],
    cta: buildRouteCta,
  },
  {
    path: '/routes/great-american-icons',
    kind: 'route',
    eyebrow: 'Route idea',
    title: 'Great American Icons Tesla Road Trip Idea | ChargeQuest',
    description: 'A coast-to-coast Tesla road trip idea connecting music cities, national parks, Route 66 country, California, the Pacific Northwest, Yellowstone, Chicago, and Washington.',
    headline: 'The big American route is really a collection of smaller stories',
    intro: 'Great American Icons is the template closest to the original ChargeQuest idea: cross the country through places with a story, then keep going until the route becomes a story of its own. It is ambitious by design and personal by necessity.',
    updatedAt: SEO_UPDATED_AT,
    facts: [
      { label: 'Route shape', value: 'A broad national loop' },
      { label: 'Themes', value: 'Music, parks, cities, road history, badges' },
      { label: 'Best use', value: 'Choose a spine, then make it yours' },
    ],
    sections: [
      {
        heading: 'What the current template connects',
        paragraphs: [
          'The starting anchors are Nashville, St. Louis, Kansas City, Denver, Santa Fe, Grand Canyon, Las Vegas, Los Angeles and Hollywood, San Francisco, Portland, Seattle, Yellowstone, Rapid City, Chicago, Canton, Washington, and Charlotte. That sequence touches several different versions of America rather than chasing only the shortest coast-to-coast line.',
          'The template can support music history, Route 66 country, western scenery, Iconic Charger badges, the Pacific coast, national parks, football history, and the capital. Your job is to decide which of those themes actually belongs in your trip.',
        ],
        bullets: [
          'Heartland and Rockies: Nashville, St. Louis, Kansas City, Denver.',
          'Southwest and California: Santa Fe, Grand Canyon, Las Vegas, Hollywood, San Francisco.',
          'North and east: Portland, Seattle, Yellowstone, Rapid City, Chicago, Canton, Washington, Charlotte.',
        ],
      },
      {
        heading: 'Choose the emotional anchors first',
        paragraphs: [
          'A route this large can become a collection of famous names with no personal center. Before optimizing, mark the three or four stops you would be genuinely disappointed to miss. Those are the route’s emotional anchors. Everything else should earn its place by connecting them or adding a story you care about.',
          'For me, a national quest needs moments that feel different from each other: a music city, open desert, a major park, a coast, and a meetup that could not happen at home. Your list may be entirely different. That is the point.',
        ],
      },
      {
        heading: 'Use competition strategy as a layer, not the whole identity',
        paragraphs: [
          'A broad loop can collect many unique sites and keep a long trip moving, but category strategy may pull the route away from the famous anchors. CORE can compare versions so you can see the cost of the competitive choice instead of hiding it.',
          'Winning would be incredible. It is not the only win available. The strongest Great American Icons route is one you would still be grateful to have driven if the final leaderboard went another way.',
        ],
      },
      {
        heading: 'A fixed CORE example, so the numbers have context',
        paragraphs: [
          coreExampleAssumptions,
          'Great American Icons is the broadest of these three templates, and the fixed run reflects that. The example is useful for comparing route shape, not for promising an exact odometer reading. A route saved in CORE should be recalculated with your real start, dates, range, stops, and current road data.',
        ],
        table: coreExampleTable({
          routeName: 'Great American Icons',
          totalMiles: '7,890 miles',
          averageMilesPerDay: '132 miles',
          averageDriveHoursPerDay: '2.19 hours',
        }),
      },
    ],
    note: 'This is a planning framework, not a fixed itinerary. Recalculate around your vehicle, dates, pace, and current road and charging conditions.',
    sources: [],
    relatedPaths: ['/tesla-road-trip-routes', '/2026-tesla-supercharging-competition', '/badges/tesla-diner'],
    cta: buildRouteCta,
  },
  {
    path: '/about-anthony',
    kind: 'about',
    eyebrow: 'About the builder',
    title: 'About Anthony Pappano, Creator of ChargeQuest',
    description: 'Meet Anthony Pappano, why he built ChargeQuest for the 2026 Tesla Supercharging Competition, and how its route guides are researched and tested.',
    headline: 'I built ChargeQuest because I needed the route to answer better questions',
    intro: 'I’m Anthony Pappano. ChargeQuest started while I was trying to plan an ambitious run at the 2026 Tesla Supercharging Competition. The existing tools could tell me how to reach a destination. I wanted to compare entire journeys: different competition strategies, practical range, daily pace, badge targets, places worth seeing, and the tradeoffs hiding between them.',
    updatedAt: SEO_UPDATED_AT,
    facts: [
      { label: 'Role', value: 'Creator and route builder' },
      { label: 'Starting point', value: 'The 2026 competition' },
      { label: 'Operating rule', value: 'Show the assumptions' },
    ],
    sections: [
      {
        heading: 'The competition started it. The road made it bigger.',
        paragraphs: [
          'I originally built CORE to give myself a better way to think through a very specific challenge. A long competition route is not one navigation request. It is a sequence of decisions about continuity, unique charging sites, the car, the season, the amount of driving I can sustain, and the places I would regret passing.',
          'Once those decisions became visible, the project stopped feeling useful only to me. A driver planning Route 66, a western parks loop, or a first cross-country Tesla trip faces many of the same questions even if a leaderboard never enters the picture. ChargeQuest became a place to start with a meaningful road and build a version that fits the person driving it.',
        ],
      },
      {
        heading: 'How I build the field guides',
        paragraphs: [
          'Competition and badge facts are linked back to Tesla’s current support and location pages. Route examples come from the same CORE engine available in the planner, with the vehicle, range, dates, pace, and station-feed snapshot stated on the page. When a number is an estimate, I call it an estimate.',
          'The guides are intentionally connected to the product. I do not want a separate pile of travel articles that could belong to any website. Each page should explain a real route decision, clarify an official rule, identify a badge target, or help someone make a better choice inside CORE.',
        ],
      },
      {
        heading: 'What I am—and am not—claiming',
        paragraphs: [
          'I am the builder taking the route problem seriously, not an official voice for Tesla. ChargeQuest is independent and cannot award a badge, certify a competition score, guarantee a charger, or know what weather and traffic will do on your travel day. Tesla owns its competition and charging records. Road, park, and charger conditions still need current verification.',
          'I will add first-hand route notes as my own plan develops and, eventually, as the road tests the assumptions. Those notes should make the existing guides more useful. They will not be used to pretend one person’s trip is the correct route for everyone.',
        ],
      },
      {
        heading: 'The standard I want ChargeQuest to keep',
        paragraphs: [
          'A page should be worth reading even if it never ranks first. A route should show why its stops are there. A metric should carry enough context to be challenged. And the visitor should remain the person making the final decision.',
          'Winning the competition would be incredible. Building a road worth remembering is the larger goal. ChargeQuest exists to make both ambitions easier to see clearly.',
        ],
      },
    ],
    note: 'ChargeQuest is independently built by Anthony Pappano and is not affiliated with or endorsed by Tesla.',
    sources: [],
    relatedPaths: [
      '/2026-tesla-supercharging-competition',
      '/tesla-iconic-charger-badges',
      '/tesla-road-trip-routes',
    ],
    cta: buildRouteCta,
  },
]

const pageByPath = new Map(SEO_PAGES.map((page) => [page.path, page]))

export function getSeoPageByPath(pathname: string) {
  const normalized = pathname !== '/' ? pathname.replace(/\/$/, '') : pathname
  return pageByPath.get(normalized)
}

export function getRelatedSeoPages(page: SeoPage) {
  return page.relatedPaths.flatMap((path) => {
    const related = getSeoPageByPath(path)
    return related ? [related] : []
  })
}

export function formatSeoDate(date: string) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function seoPageStructuredData(page: SeoPage) {
  const segments = page.path.split('/').filter(Boolean)
  const breadcrumbItems = [
    { '@type': 'ListItem', position: 1, name: 'ChargeQuest', item: `${SITE_ORIGIN}/` },
    ...segments.map((segment, index) => ({
      '@type': 'ListItem',
      position: index + 2,
      name: index === segments.length - 1 ? page.headline : readableSegment(segment),
      item: `${SITE_ORIGIN}/${segments.slice(0, index + 1).join('/')}`,
    })),
  ]
  const author = {
    '@type': 'Person',
    name: SEO_AUTHOR.name,
    url: SEO_AUTHOR.url,
  }
  const primaryPage = page.kind === 'about'
    ? {
        '@type': 'ProfilePage',
        name: page.headline,
        headline: page.headline,
        description: page.description,
        url: `${SITE_ORIGIN}${page.path}`,
        dateModified: page.updatedAt,
        inLanguage: 'en-US',
        mainEntity: author,
      }
    : {
        '@type': page.kind === 'hub' ? 'CollectionPage' : 'Article',
        headline: page.headline,
        name: page.headline,
        description: page.description,
        url: `${SITE_ORIGIN}${page.path}`,
        dateModified: page.updatedAt,
        inLanguage: 'en-US',
        author,
        publisher: { '@type': 'Organization', name: 'ChargeQuest', url: SITE_ORIGIN },
      }

  return {
    '@context': 'https://schema.org',
    '@graph': [
      primaryPage,
      {
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbItems,
      },
    ],
  }
}

function readableSegment(segment: string) {
  return segment
    .replace(/^2026-/, '')
    .split('-')
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(' ')
}
