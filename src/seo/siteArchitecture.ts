import {
  SEO_PAGES,
  SEO_PUBLISHED_AT,
  SEO_UPDATED_AT,
  SITE_ORIGIN,
  getSeoPageByPath,
  seoPageStructuredData,
  type SeoPage,
  type SeoPageKind,
} from './seoPages'
import {
  PUBLISHED_ANTHONY_FIELD_NOTES,
  fieldNotePlainText,
} from '../content/anthonyFieldNotes'

export interface PublicArchitectureLink {
  path: string
  label: string
}

export interface SeoBreadcrumb {
  path: string
  name: string
}

interface EditorialImage {
  socialImage: string
  socialImageAlt: string
  socialImageWidth: number
  socialImageHeight: number
  photoCredit?: {
    photographer: string
    sourceUrl: string
  }
}

export interface CustomPublicPageMetadata {
  path: '/' | '/community' | '/track-anthony'
  title: string
  description: string
  type: 'website' | 'article'
  socialImage: string
  socialImageAlt: string
  fallbackHeading: string
  fallbackBody: string
  updatedAt: string
}

export const CUSTOM_PUBLIC_PAGES: readonly CustomPublicPageMetadata[] = [
  {
    path: '/',
    title: 'ChargeQuest CORE | Tesla Supercharger Route Planner for 2026',
    description: 'Meet ChargeQuest CORE, the Charging Optimization & Route Engine for building and saving Tesla Supercharger routes around your vehicle, pace, badge targets, landmarks, and daily limits.',
    type: 'website',
    socialImage: '/social/chargequest-home.jpg',
    socialImageAlt: 'An open highway crossing the painted desert',
    fallbackHeading: 'Tesla Supercharger route planning for a road worth remembering',
    fallbackBody: 'Build a route around your Tesla, practical range, Iconic Charger badges, landmarks, and daily driving limits.',
    updatedAt: '2026-08-10',
  },
  {
    path: '/community',
    title: 'Send Anthony a Route Idea | ChargeQuest Community',
    description: 'Send Anthony a private route suggestion, local stop, charging tip, or challenge as he builds the first ChargeQuest and prepares for the 2026 trip.',
    type: 'website',
    socialImage: '/social/chargequest-home.jpg',
    socialImageAlt: 'An open highway crossing the painted desert',
    fallbackHeading: 'Tell me what the map is missing',
    fallbackBody: 'Send Anthony a stop worth the detour, a route problem to solve, or a useful test for ChargeQuest CORE. Suggestions stay private unless Anthony asks to share them.',
    updatedAt: SEO_UPDATED_AT,
  },
  {
    path: '/track-anthony',
    title: 'My 2026 Tesla Supercharging Competition Route & Map',
    description: 'Explore Anthony’s actual 2026 Tesla Supercharging Competition route plan, map, day-by-day itinerary, charging stops, landmarks, route decisions, and dated field notes.',
    type: 'article',
    socialImage: '/social/chargequest-routes.jpg',
    socialImageAlt: 'Sunlight over the Grand Canyon on a ChargeQuest road trip',
    fallbackHeading: 'Anthony’s 2026 Tesla Supercharging Competition route',
    fallbackBody: 'Follow Anthony’s full mapped trip from departure through the return home, then open each planned day and location for landmarks, blogs, videos, and live road updates.',
    updatedAt: '2026-08-10',
  },
]

export const PUBLIC_ARCHITECTURE_LINKS = {
  home: { path: '/', label: 'ChargeQuest home' },
  competition: {
    path: '/2026-tesla-supercharging-competition',
    label: '2026 Tesla Supercharging Competition guide',
  },
  track: {
    path: '/track-anthony',
    label: 'Anthony’s 73-day competition route and field notes',
  },
  routes: {
    path: '/tesla-road-trip-routes',
    label: 'Tesla Supercharger road-trip routes',
  },
  badges: {
    path: '/tesla-iconic-charger-badges',
    label: 'Tesla Iconic Charger badge guides',
  },
  community: {
    path: '/community',
    label: 'Send Anthony a route idea',
  },
  about: {
    path: '/about-anthony',
    label: 'About Anthony Pappano',
  },
} as const satisfies Record<string, PublicArchitectureLink>

type PublicArchitectureLinkKey = keyof typeof PUBLIC_ARCHITECTURE_LINKS

const customPageByPath = new Map<string, CustomPublicPageMetadata>(
  CUSTOM_PUBLIC_PAGES.map((page) => [page.path, page]),
)

const DEFAULT_SEO_EDITORIAL_IMAGE: EditorialImage = {
  socialImage: '/social/chargequest-home.jpg',
  socialImageAlt: 'An open highway crossing the painted desert',
  socialImageWidth: 1200,
  socialImageHeight: 630,
}

// Keep editorial pages visually independent from the fixed landing-page image system.
// Every published story has its own licensed Unsplash cover, so a page can never quietly
// inherit the same image as its hub, card, or home-page section.
const SEO_EDITORIAL_IMAGES: Readonly<Record<string, EditorialImage>> = {
  '/2026-tesla-supercharging-competition': {
    socialImage: '/editorial/competition-supercharger-row.jpg',
    socialImageAlt: 'Tesla Superchargers glowing in a row at night',
    socialImageWidth: 1600,
    socialImageHeight: 1000,
    photoCredit: {
      photographer: 'Jonathan Ikemura',
      sourceUrl: 'https://unsplash.com/photos/b6pS6OCmewc',
    },
  },
  '/competition/longest-trip-strategy': {
    socialImage: '/editorial/longest-trip-night-highway.jpg',
    socialImageAlt: 'A car traveling a dark highway at night',
    socialImageWidth: 1600,
    socialImageHeight: 1000,
    photoCredit: {
      photographer: 'Kristaps Solims',
      sourceUrl: 'https://unsplash.com/photos/dDJIv_kNr_g',
    },
  },
  '/competition/most-unique-supercharger-sites': {
    socialImage: '/editorial/unique-sites-interchange.jpg',
    socialImageAlt: 'A city freeway interchange illuminated at night',
    socialImageWidth: 1600,
    socialImageHeight: 1000,
    photoCredit: {
      photographer: 'Pang Yuhao',
      sourceUrl: 'https://unsplash.com/photos/X00ZafKUdBo',
    },
  },
  '/competition/most-energy-supercharged': {
    socialImage: '/editorial/most-energy-charging.jpg',
    socialImageAlt: 'Tesla Superchargers in a parking lot after dark',
    socialImageWidth: 1600,
    socialImageHeight: 1000,
    photoCredit: {
      photographer: 'Prometheus',
      sourceUrl: 'https://unsplash.com/photos/OcFDX9_kfLg',
    },
  },
  '/tesla-iconic-charger-badges': {
    socialImage: '/editorial/badge-hub-red-rock-road.jpg',
    socialImageAlt: 'A winding road through red desert rock',
    socialImageWidth: 1600,
    socialImageHeight: 1000,
    photoCredit: {
      photographer: 'Daniel Shapiro',
      sourceUrl: 'https://unsplash.com/photos/Fu5KC8bxgeg',
    },
  },
  '/badges/grand-canyon': {
    socialImage: '/editorial/grand-canyon-south-rim.jpg',
    socialImageAlt: 'The Grand Canyon stretching into the distance from the South Rim',
    socialImageWidth: 1600,
    socialImageHeight: 1000,
    photoCredit: {
      photographer: 'Brad Weaver',
      sourceUrl: 'https://unsplash.com/photos/6WDdCJnbiPQ',
    },
  },
  '/badges/yellowstone': {
    socialImage: '/editorial/yellowstone-bison.jpg',
    socialImageAlt: 'A bison standing in a Yellowstone field at golden hour',
    socialImageWidth: 1600,
    socialImageHeight: 1000,
    photoCredit: {
      photographer: 'Leon LEE',
      sourceUrl: 'https://unsplash.com/photos/gyJuGLI0JFw',
    },
  },
  '/badges/yosemite': {
    socialImage: '/editorial/yosemite-valley-road.jpg',
    socialImageAlt: 'A road through Yosemite Valley beneath granite cliffs',
    socialImageWidth: 1600,
    socialImageHeight: 1000,
    photoCredit: {
      photographer: 'Jay Carpio',
      sourceUrl: 'https://unsplash.com/photos/0vdIGGJPd9A',
    },
  },
  '/badges/tesla-diner': {
    socialImage: '/editorial/tesla-diner-neon.jpg',
    socialImageAlt: 'A classic diner sign glowing at night',
    socialImageWidth: 1600,
    socialImageHeight: 1000,
    photoCredit: {
      photographer: 'John Matychuk',
      sourceUrl: 'https://unsplash.com/photos/fX2WyHHeAUY',
    },
  },
  '/tesla-road-trip-routes': {
    socialImage: '/editorial/route-hub-coastal-drive.jpg',
    socialImageAlt: 'A car driving beside the ocean on a coastal road',
    socialImageWidth: 1600,
    socialImageHeight: 1000,
    photoCredit: {
      photographer: 'Luke Miller',
      sourceUrl: 'https://unsplash.com/photos/p9uN_1sNyTM',
    },
  },
  '/routes/tesla-route-66-supercharger-road-trip': {
    socialImage: '/editorial/route-66-neon-motel.jpg',
    socialImageAlt: 'A vintage Route 66 motel sign shining at night',
    socialImageWidth: 1600,
    socialImageHeight: 1000,
    photoCredit: {
      photographer: 'Jacob Brogdon',
      sourceUrl: 'https://unsplash.com/photos/teG3fkUvXTk',
    },
  },
  '/routes/tesla-national-parks-road-trip': {
    socialImage: '/editorial/national-parks-desert-drive.jpg',
    socialImageAlt: 'The view through a windshield on a desert highway',
    socialImageWidth: 1600,
    socialImageHeight: 1000,
    photoCredit: {
      photographer: 'Alex Holt',
      sourceUrl: 'https://unsplash.com/photos/wCzA3s4k--0',
    },
  },
  '/routes/great-american-icons': {
    socialImage: '/editorial/great-american-icons-golden-gate-night.jpg',
    socialImageAlt: 'The Golden Gate Bridge illuminated above San Francisco at night',
    socialImageWidth: 1600,
    socialImageHeight: 1000,
    photoCredit: {
      photographer: 'Stefan Petersen',
      sourceUrl: 'https://unsplash.com/photos/T5b1ARmXtFY',
    },
  },
  '/about-anthony': {
    socialImage: '/editorial/about-desert-highway.jpg',
    socialImageAlt: 'A car following a long desert highway',
    socialImageWidth: 1600,
    socialImageHeight: 1000,
    photoCredit: {
      photographer: 'Tobias Pfeifer',
      sourceUrl: 'https://unsplash.com/photos/l-EgL6BA5r0',
    },
  },
}

const parentHubByKind: Partial<Record<SeoPageKind, string>> = {
  guide: PUBLIC_ARCHITECTURE_LINKS.competition.path,
  badge: PUBLIC_ARCHITECTURE_LINKS.badges.path,
  route: PUBLIC_ARCHITECTURE_LINKS.routes.path,
}

const exactContextKeys: Record<string, PublicArchitectureLinkKey[]> = {
  '/': ['competition', 'track', 'routes', 'badges', 'community', 'about'],
  '/community': ['home', 'track', 'competition', 'routes', 'badges'],
  '/track-anthony': ['home', 'competition', 'routes', 'badges', 'community'],
  '/2026-tesla-supercharging-competition': ['track', 'routes', 'badges', 'community'],
  '/tesla-road-trip-routes': ['track', 'competition', 'badges', 'community'],
  '/tesla-iconic-charger-badges': ['track', 'competition', 'routes', 'community'],
  '/about-anthony': ['track', 'competition', 'routes', 'badges', 'community'],
}

export const PUBLIC_INDEXABLE_PATHS = [
  ...CUSTOM_PUBLIC_PAGES.map((page) => page.path),
  ...SEO_PAGES.map((page) => page.path),
]

export function getCustomPublicPage(pathname: string) {
  return customPageByPath.get(normalizePath(pathname))
}

export function buildCustomPublicStructuredData(page: CustomPublicPageMetadata) {
  const pageUrl = `${SITE_ORIGIN}${page.path}`
  const imageUrl = `${SITE_ORIGIN}${page.socialImage}`
  const fieldNotes = page.path === '/track-anthony'
    ? PUBLISHED_ANTHONY_FIELD_NOTES
    : []
  const breadcrumbs = page.path === '/'
    ? [{ path: '/', name: 'ChargeQuest' }]
    : [
        { path: '/', name: 'ChargeQuest' },
        { path: page.path, name: customBreadcrumbLabel(page.path) },
      ]

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${pageUrl}#webpage`,
        url: pageUrl,
        name: page.title,
        description: page.description,
        dateModified: page.updatedAt,
        isPartOf: { '@id': `${SITE_ORIGIN}/#website` },
        primaryImageOfPage: { '@id': `${pageUrl}#primaryimage` },
        ...(fieldNotes.length
          ? {
              hasPart: fieldNotes.map((note) => ({
                '@id': `${pageUrl}#journal-${note.id}`,
              })),
            }
          : {}),
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${pageUrl}#breadcrumb`,
        itemListElement: breadcrumbs.map((breadcrumb, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: breadcrumb.name,
          item: `${SITE_ORIGIN}${breadcrumb.path}`,
        })),
      },
      {
        '@type': 'ImageObject',
        '@id': `${pageUrl}#primaryimage`,
        url: imageUrl,
        contentUrl: imageUrl,
        width: 1200,
        height: 630,
        caption: page.socialImageAlt,
      },
      ...fieldNotes.map((note) => ({
        '@type': 'Article',
        '@id': `${pageUrl}#journal-${note.id}`,
        url: `${pageUrl}#journal-${note.id}`,
        headline: note.title,
        description: note.excerpt,
        datePublished: note.publishedAt,
        dateModified: note.updatedAt,
        articleSection: 'Track Anthony trip journal',
        articleBody: fieldNotePlainText(note),
        mainEntityOfPage: { '@id': `${pageUrl}#webpage` },
        isPartOf: { '@id': `${pageUrl}#webpage` },
        author: {
          '@type': 'Person',
          '@id': `${SITE_ORIGIN}/about-anthony#person`,
          name: 'Anthony Pappano',
          url: `${SITE_ORIGIN}/about-anthony`,
        },
        publisher: { '@id': `${SITE_ORIGIN}/#organization` },
        image: { '@id': `${pageUrl}#primaryimage` },
      })),
    ],
  }
}

export function getSeoBreadcrumbs(page: SeoPage): SeoBreadcrumb[] {
  const breadcrumbs: SeoBreadcrumb[] = [
    { path: PUBLIC_ARCHITECTURE_LINKS.home.path, name: 'ChargeQuest' },
  ]
  const parentPath = parentHubByKind[page.kind]
  const parentPage = parentPath ? getSeoPageByPath(parentPath) : undefined

  if (parentPage && parentPage.path !== page.path) {
    breadcrumbs.push({
      path: parentPage.path,
      name: breadcrumbLabel(parentPage),
    })
  }

  breadcrumbs.push({ path: page.path, name: breadcrumbLabel(page) })
  return breadcrumbs
}

export function getContextualPublicLinks(pathname: string): PublicArchitectureLink[] {
  const normalizedPath = normalizePath(pathname)
  let keys = exactContextKeys[normalizedPath]

  if (!keys && normalizedPath.startsWith('/competition/')) {
    keys = ['competition', 'track', 'routes', 'community']
  } else if (!keys && normalizedPath.startsWith('/badges/')) {
    keys = ['badges', 'routes', 'competition', 'track']
  } else if (!keys && normalizedPath.startsWith('/routes/')) {
    keys = ['routes', 'competition', 'track', 'badges']
  }

  return (keys ?? ['home', 'competition', 'track', 'routes', 'badges', 'community'])
    .map((key) => PUBLIC_ARCHITECTURE_LINKS[key])
    .filter((link) => link.path !== normalizedPath)
}

export function buildSeoPageStructuredData(page: SeoPage): Record<string, unknown> {
  const base = seoPageStructuredData(page) as {
    '@context': string
    '@graph': Array<Record<string, unknown>>
  }
  const pageUrl = `${SITE_ORIGIN}${page.path}`
  const primaryPage = base['@graph'][0]
  const isArticle = page.kind === 'guide' || page.kind === 'badge' || page.kind === 'route'
  const presentation = getSeoPagePresentation(page)
  const imageUrl = `${SITE_ORIGIN}${presentation.socialImage}`

  return {
    '@context': base['@context'],
    '@graph': [
      {
        ...primaryPage,
        '@id': isArticle ? `${pageUrl}#article` : pageUrl,
        ...(isArticle ? { datePublished: SEO_PUBLISHED_AT } : {}),
        dateModified: page.updatedAt,
        image: { '@id': `${pageUrl}#primaryimage` },
        ...(page.kind === 'about'
          ? {
              mainEntity: {
                '@type': 'Person',
                '@id': `${SITE_ORIGIN}/about-anthony#person`,
                name: 'Anthony Pappano',
                url: `${SITE_ORIGIN}/about-anthony`,
              },
            }
          : {}),
        isPartOf: {
          '@type': 'WebSite',
          '@id': `${SITE_ORIGIN}/#website`,
          name: 'ChargeQuest',
          url: `${SITE_ORIGIN}/`,
        },
        ...(isArticle
          ? {
              author: { '@id': `${SITE_ORIGIN}/about-anthony#person` },
              publisher: { '@id': `${SITE_ORIGIN}/#organization` },
              mainEntityOfPage: {
                '@type': 'WebPage',
                '@id': pageUrl,
              },
            }
          : {}),
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${pageUrl}#breadcrumb`,
        itemListElement: getSeoBreadcrumbs(page).map((breadcrumb, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: breadcrumb.name,
          item: `${SITE_ORIGIN}${breadcrumb.path}`,
        })),
      },
      {
        '@type': 'ImageObject',
        '@id': `${pageUrl}#primaryimage`,
        url: imageUrl,
        contentUrl: imageUrl,
        width: presentation.socialImageWidth,
        height: presentation.socialImageHeight,
        caption: presentation.socialImageAlt,
      },
    ],
  }
}

export function getSeoPagePresentation(page: SeoPage) {
  const social = SEO_EDITORIAL_IMAGES[page.path] ?? DEFAULT_SEO_EDITORIAL_IMAGE

  return {
    title: page.title,
    description: page.description,
    path: page.path,
    type: page.kind === 'hub'
      ? 'website' as const
      : page.kind === 'about'
        ? 'profile' as const
        : 'article' as const,
    updatedAt: page.updatedAt,
    ...social,
  }
}

function breadcrumbLabel(page: SeoPage) {
  return page.title.replace(/\s+\|\s+ChargeQuest$/, '')
}

function customBreadcrumbLabel(pathname: CustomPublicPageMetadata['path']) {
  if (pathname === '/community') return 'Community'
  if (pathname === '/track-anthony') return 'Track Anthony'
  return 'ChargeQuest'
}

function normalizePath(pathname: string) {
  return pathname === '/' ? pathname : pathname.replace(/\/$/, '')
}
