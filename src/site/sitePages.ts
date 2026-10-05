// Shared by the client router and the server document renderer so both agree
// on which paths exist, what they're called, and where retired URLs now go.

export const SITE_ORIGIN = 'https://www.teslachargequest.com'

export interface SitePageMetadata {
  path: string
  title: string
  description: string
}

export const PUBLIC_PAGES = {
  tracker: {
    path: '/',
    title: 'ChargeQuest · Follow Anthony’s Supercharger road trip',
    description:
      'Follow along as Anthony drives a loop of Tesla Superchargers across the country: where he is today, the full route, and notes and videos from the road.',
  },
  route: {
    path: '/route',
    title: 'The route · ChargeQuest',
    description:
      'Every planned day of Anthony’s Supercharger road trip: the map, daily stops, miles, and states along the way.',
  },
  journal: {
    path: '/journal',
    title: 'Journal · ChargeQuest',
    description: 'Posts, photos, and videos from Anthony’s Supercharger road trip.',
  },
  about: {
    path: '/about',
    title: 'About the trip · ChargeQuest',
    description:
      'Who Anthony is, why he’s driving to as many Tesla Superchargers as he can, and how the trip works.',
  },
} as const satisfies Record<string, SitePageMetadata>

export const PRIVATE_PATHS = new Set([
  '/login',
  '/change-password',
  '/admin',
  '/admin/hotels',
  '/planner',
])

const LEGACY_EXACT: Record<string, string> = {
  '/journal/73-day-route-not-finished': '/journal/route-audible-october-2026',
  '/track-anthony': '/',
  '/about-anthony': '/about',
  '/community': '/',
  '/signup': '/',
  '/dashboard': '/admin',
  '/account': '/admin',
  '/2026-tesla-supercharging-competition': '/',
  '/tesla-iconic-charger-badges': '/',
  '/tesla-road-trip-routes': '/route',
}

const LEGACY_PREFIXES: Array<[string, string]> = [
  ['/competition/', '/'],
  ['/badges/', '/'],
  ['/routes/', '/route'],
]

/** Where a retired URL (old SEO pages, member pages) should now send people. */
export function legacyRedirectTarget(pathname: string): string | undefined {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
  if (LEGACY_EXACT[path]) return LEGACY_EXACT[path]
  for (const [prefix, target] of LEGACY_PREFIXES) {
    if (path.startsWith(prefix)) return target
  }
  return undefined
}

export function isJournalPostPath(pathname: string) {
  return /^\/journal\/[A-Za-z0-9_-]{1,96}$/.test(pathname)
}
