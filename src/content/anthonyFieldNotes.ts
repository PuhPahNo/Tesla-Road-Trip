export interface AnthonyFieldNoteLink {
  label: string
  href: string
  external?: boolean
}

export type AnthonyFieldNoteInline = string | AnthonyFieldNoteLink

export interface AnthonyFieldNoteSection {
  heading: string
  paragraphs: AnthonyFieldNoteInline[][]
  bullets?: string[]
  afterBullets?: AnthonyFieldNoteInline[][]
}

export interface AnthonyFieldNote {
  id: string
  title: string
  excerpt: string
  phaseLabel: string
  publishedAt: string
  updatedAt: string
  lede: AnthonyFieldNoteInline[][]
  sections: AnthonyFieldNoteSection[]
  closingLinks: AnthonyFieldNoteLink[]
  sources: AnthonyFieldNoteLink[]
}

export const PUBLISHED_ANTHONY_FIELD_NOTES: readonly AnthonyFieldNote[] = [
  {
    id: '73-day-route-not-finished',
    title: 'The route is 73 days long. I’m still not calling it finished.',
    excerpt:
      'I’ve mapped 73 unique Superchargers across 10,107.8 road miles. The numbers currently work. Now I’m checking whether the route works for an actual person driving it for 73 straight days.',
    phaseLabel: 'Planning the quest',
    publishedAt: '2026-08-10',
    updatedAt: '2026-08-10',
    lede: [
      [
        'On September 27, I plan to leave Chattanooga and begin a ',
        { label: '73-day loop through 73 different Tesla Superchargers', href: '#full-route' },
        '.',
      ],
      [
        'The current route covers 10,107.8 road-routed miles and about 187 hours of driving. Day 1 is a short run to Cleveland, Tennessee. Day 73 brings me back to the Manufacturers Road Supercharger in Chattanooga.',
      ],
      [
        'All 73 stations currently show as open in the Supercharge.info data, and CORE does not flag any of the planned charging legs as outside its modeled range.',
      ],
      ['That is the clean version of the trip.'],
      [
        'It leaves out weather, traffic, road closures, a station going offline, a hotel charger that turns out to be unavailable, and the possibility that something perfectly reasonable on a map becomes a terrible idea after several weeks of driving.',
      ],
      ['So no, I’m not calling the route finished yet.'],
    ],
    sections: [
      {
        heading: 'The longest legs are where the plan stops feeling theoretical',
        paragraphs: [
          ['Five charging legs stand out in the current route:'],
        ],
        bullets: [
          'Day 12 to Murdo, South Dakota: 289.7 miles',
          'Day 32 to McKinleyville, California: 282 miles',
          'Day 41 to Beatty, Nevada: 280.1 miles',
          'Day 50 to Toquerville, Utah: 265.3 miles',
          'Day 64 to Alamogordo, New Mexico: 263.2 miles',
        ],
        afterBullets: [
          [
            'The longest driving day is the run to Beatty at about 5.56 hours. Toquerville and McKinleyville are both over five hours as well.',
          ],
          [
            'None of those days looks impossible by itself. The harder question is what they look like inside a 73-day trip.',
          ],
          [
            'A 280-mile day after a good night of sleep is one thing. The same day after a hotel problem, bad weather, a late start or three weeks of constantly packing and unpacking is another. CORE can expose the difficult legs. It cannot tell me how I will feel when I reach them.',
          ],
          ['That is part of what I’m trying to stress-test now.'],
        ],
      },
      {
        heading: 'The competition clock is still less clear than it should be',
        paragraphs: [
          [
            'Tesla’s ',
            {
              label: '2026 competition rules',
              href: '/2026-tesla-supercharging-competition',
            },
            ' describe the Longest Trip category as a continuous streak of unique Supercharger locations.',
          ],
          [
            'The category summary says each new site must be visited within 24 hours of the previous charging session’s start time. The more detailed trip definition measures the clock from the previous session’s end.',
          ],
          ['Those are not the same rule.'],
          [
            'I’m planning around the ',
            {
              label: 'stricter start-to-start interpretation',
              href: '/competition/longest-trip-strategy',
            },
            '. If I begin charging at 3 p.m. on one day, I want the next qualifying session at a new site to begin before 3 p.m. the following day.',
          ],
          [
            'A repeat visit can help me charge, but Tesla says it does not add another unique site or reset the Longest Trip timer. That means every overnight stop needs to work with the next day’s actual charging session, not merely put me somewhere near the route.',
          ],
          [
            'Tesla will make the final determination. ChargeQuest cannot resolve the wording for Tesla, and I do not want the trip to depend on assuming the more generous interpretation.',
          ],
        ],
      },
      {
        heading: 'Seventy-three open stations today does not mean seventy-three open stations this fall',
        paragraphs: [
          ['The current station snapshot is encouraging: all 73 planned sites show as open.'],
          [
            'I still need to verify them again closer to departure and continue checking the Tesla app during the trip. A route this long is a moving target. Stations open, close, change access or temporarily become a bad choice.',
          ],
          ['The same honesty needs to apply to hotels.'],
          [
            'I have hotel options mapped for each night, including properties that advertise EV charging or have charging nearby. Those are not automatically the same thing. I still need to distinguish between a hotel-owned charger that guests can actually use and a public charger that happens to appear close on a map.',
          ],
          [
            'I would love to begin as many mornings as possible with a useful overnight charge. I’m not going to pretend every hotel can provide that until the individual stay is verified.',
          ],
        ],
      },
      {
        heading: 'I do not want to spend 73 days collecting dots',
        paragraphs: [
          ['The competition is what started this. Winning free Supercharging would be incredible.'],
          [
            'But I could technically build a route that visits a new charger every day and still make it a bad trip.',
          ],
          [
            'I want to see the Rocky Mountains. I want enough time around Glacier and the national parks for the stop to mean something. I want some hotels that are part of the experience instead of choosing every night solely because the parking lot is convenient. I do not want to reach the end with 73 qualifying sessions and realize I spent the entire trip watching a countdown clock.',
          ],
          [
            'That is the balance I’m trying to hold: keep the charging streak alive without optimizing everything human out of the route.',
          ],
          [
            'Sometimes that means accepting a longer drive because the destination is worth it. Sometimes it means cutting time from a place I like because the next several days need more breathing room. The route has already changed repeatedly as those tradeoffs became visible.',
          ],
          ['It will probably change again.'],
        ],
      },
      {
        heading: 'What I’m checking over the next 48 days',
        paragraphs: [],
        bullets: [
          'Recheck every planned Supercharger and identify practical backups.',
          'Review the five longest legs against weather, elevation and real charging options.',
          'Verify hotels using the actual stay dates instead of generic nightly estimates.',
          'Confirm which hotels have guest-accessible overnight charging.',
          'Keep watching Tesla’s official competition language for clarification of the 24-hour clock.',
          'Freeze the route late enough to use current information without waiting so long that the best hotel options disappear.',
          'Decide what evidence I need to preserve from each charging session in case something is missing from Tesla’s competition statistics.',
        ],
      },
      {
        heading: 'Why I’m publishing the route before I leave',
        paragraphs: [
          [
            'The route shown on ChargeQuest is the plan as it exists now. It is road-routed, dated and tied to specific Supercharger locations. It is not a promise that every mile will happen exactly as displayed.',
          ],
          ['That is why I’m publishing the route before I leave.'],
          [
            'If someone sees a weak link, a seasonal problem, a bad overnight choice or a stop that looks much easier on a map than it is in real life, I want to know now. I would rather change the route than defend it just because it looks finished.',
          ],
        ],
      },
    ],
    closingLinks: [
      { label: 'Explore the complete 73-day route', href: '#full-route' },
      {
        label: 'Understand the 2026 competition rules',
        href: '/2026-tesla-supercharging-competition',
      },
      {
        label: 'Read the Longest Trip strategy',
        href: '/competition/longest-trip-strategy',
      },
      { label: 'Compare other Tesla route ideas', href: '/tesla-road-trip-routes' },
      { label: 'Build your own route with CORE', href: '/signup?returnTo=%2Fplanner' },
      { label: 'Send me a route problem', href: '/community' },
    ],
    sources: [
      {
        label: 'Tesla — 2026 Free Supercharging Competition rules',
        href: 'https://www.tesla.com/support/tesla-app/charging-badges/contest',
        external: true,
      },
    ],
  },
]

export function fieldNotePlainText(note: AnthonyFieldNote) {
  return [
    note.title,
    note.excerpt,
    ...note.lede.map(inlinePlainText),
    ...note.sections.flatMap((section) => [
      section.heading,
      ...section.paragraphs.map(inlinePlainText),
      ...(section.bullets ?? []),
      ...(section.afterBullets ?? []).map(inlinePlainText),
    ]),
  ].join(' ')
}

export function inlinePlainText(content: AnthonyFieldNoteInline[]) {
  return content.map((part) => typeof part === 'string' ? part : part.label).join('')
}
