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
    id: 'route-audible-october-2026',
    title: 'I called an audible. The trip is underway.',
    excerpt: 'I left Chattanooga on October 4 and headed to Cave City for Mammoth Cave National Park. Louisville, St. Louis and Kansas City are next, with Omaha locked in for October 9. The route is still allowed to change.',
    phaseLabel: 'On the road',
    publishedAt: '2026-08-10',
    updatedAt: '2026-10-04',
    lede: [
      ['Update, October 4: I called an audible on the opening stretch. I left Chattanooga today and went to Cave City, Kentucky, for Mammoth Cave National Park.'],
      ['The old departure date and opening stops are out. The ', { label: 'current route', href: '/route' }, ' shows the revised itinerary.'],
      ['I still want to keep visiting new Superchargers, but I also want this to be a trip worth taking. That means leaving room to change the plan when something better comes along.'],
    ],
    sections: [
      {
        heading: 'The first six days',
        paragraphs: [['Omaha is the fixed point this week: I need to be there October 9 to meet my dad. Here is how the opening stretch now lines up:']],
        bullets: [
          'Day 1 · October 4: Cave City, Kentucky — Mammoth Cave National Park.',
          'Day 2 · October 5: Louisville, Kentucky — Kentucky Derby Museum at Churchill Downs.',
          'Day 3 · October 6: St. Louis, Missouri.',
          'Day 4 · October 7: Kansas City, Missouri.',
          'Day 5 · October 8: St. Joseph, Missouri — tentative stop for the Pony Express National Museum.',
          'Day 6 · October 9: Omaha, Nebraska — meet Dad.',
        ],
        afterBullets: [
          ['Day 5 is still flexible. St. Joseph gives me a museum stop on the way north from Kansas City to Omaha, without sending me off in another direction.'],
          ['The rest of the loop stays in the plan for now. The map has the current day count, dates and mileage; those numbers will change if I change the itinerary again.'],
        ],
      },
      {
        heading: 'I do not want to spend the whole trip collecting dots',
        paragraphs: [
          ['The competition is what started this. Winning free Supercharging would be incredible.'],
          ['But I could build a route that visits a new charger every day and still make it a bad trip.'],
          ['I want to see the Rocky Mountains. I want enough time around Glacier and the national parks for those stops to mean something. I want some hotels that are part of the experience instead of choosing every night solely because the parking lot is convenient.'],
          ['That is the balance: keep the charging streak going without squeezing everything else out of the trip. Mammoth Cave and the Kentucky Derby Museum are part of that.'],
          ['Sometimes a longer drive is worth the destination. Sometimes a stop needs to come out so the next few days have more breathing room. I am fine changing the route when that makes the trip better.'],
        ],
      },
      {
        heading: 'What still needs checking on the road',
        paragraphs: [
          ['A route on a map leaves out weather, traffic, road closures, a station going offline, and a hotel charger that turns out to be unavailable. I need to keep checking the actual charging options as I go.'],
          ['A hotel advertising EV charging is not the same as a verified, working charger I can use overnight. I want a useful charge in the morning, but I am not counting on it until the individual stay is checked.'],
          ['I also need to keep checking Tesla’s ', { label: 'official competition rules', href: 'https://www.tesla.com/support/tesla-app/charging-badges/contest', external: true }, ' and my session records. A planned stop is not proof that a charge happened or that Tesla counted it.'],
        ],
      },
      {
        heading: 'Follow the plan as it changes',
        paragraphs: [
          ['The route is my working plan. It is not a promise that every mile will happen exactly as displayed.'],
          ['If you spot a museum, landmark or better overnight stop along the way, I want to hear about it. I would rather make the trip better than defend a plan just because I already put it on a map.'],
        ],
      },
    ],
    closingLinks: [{ label: 'See the current route', href: '/route' }],
    sources: [
      { label: 'Kentucky Derby Museum — visitor information', href: 'https://www.derbymuseum.org/visit-guide', external: true },
      { label: 'Pony Express National Museum — hours and admission', href: 'https://www.ponyexpress.org/hours-and-admission', external: true },
      { label: 'Tesla — official competition rules', href: 'https://www.tesla.com/support/tesla-app/charging-badges/contest', external: true },
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
