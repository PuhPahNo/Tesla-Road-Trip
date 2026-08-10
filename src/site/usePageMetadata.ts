import { useEffect } from 'react'
import { SITE_ORIGIN } from '../seo/seoPages'

export function usePageMetadata({
  title,
  description,
  path,
  robots = 'index,follow',
  type = 'website',
  socialImage = '/social/chargequest-home.jpg',
  socialImageAlt = 'An open highway crossing the painted desert',
  updatedAt,
  structuredData,
}: {
  title: string
  description: string
  path: string
  robots?: 'index,follow' | 'noindex,nofollow'
  type?: 'website' | 'article' | 'profile'
  socialImage?: string
  socialImageAlt?: string
  updatedAt?: string
  structuredData?: Record<string, unknown>
}) {
  useEffect(() => {
    const canonicalUrl = `${SITE_ORIGIN}${path}`
    const socialImageUrl = `${SITE_ORIGIN}${socialImage}`
    document.title = title
    setMeta('meta[name="description"]', 'name', 'description', description)
    setMeta('meta[property="og:title"]', 'property', 'og:title', title)
    setMeta('meta[property="og:description"]', 'property', 'og:description', description)
    setMeta('meta[property="og:url"]', 'property', 'og:url', canonicalUrl)
    setMeta('meta[property="og:type"]', 'property', 'og:type', type === 'profile' ? 'profile' : type)
    setMeta('meta[property="og:image"]', 'property', 'og:image', socialImageUrl)
    setMeta('meta[property="og:image:alt"]', 'property', 'og:image:alt', socialImageAlt)
    setMeta('meta[property="og:image:width"]', 'property', 'og:image:width', '1200')
    setMeta('meta[property="og:image:height"]', 'property', 'og:image:height', '630')
    setMeta('meta[property="og:image:type"]', 'property', 'og:image:type', 'image/jpeg')
    setMeta('meta[property="og:locale"]', 'property', 'og:locale', 'en_US')
    setMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image')
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title)
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description)
    setMeta('meta[name="twitter:image"]', 'name', 'twitter:image', socialImageUrl)
    setMeta('meta[name="twitter:image:alt"]', 'name', 'twitter:image:alt', socialImageAlt)
    setMeta('meta[name="robots"]', 'name', 'robots', robots)
    if (type === 'article' && updatedAt) {
      setMeta('meta[property="article:modified_time"]', 'property', 'article:modified_time', updatedAt)
    } else {
      document.querySelector('meta[property="article:modified_time"]')?.remove()
    }
    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    canonical?.setAttribute('href', canonicalUrl)

    let schema = document.querySelector<HTMLScriptElement>('script[data-page-schema]')
    if (structuredData) {
      if (!schema) {
        schema = document.createElement('script')
        schema.type = 'application/ld+json'
        schema.dataset.pageSchema = 'true'
        document.head.appendChild(schema)
      }
      schema.textContent = JSON.stringify(structuredData)
    } else {
      schema?.remove()
    }
  }, [description, path, robots, socialImage, socialImageAlt, structuredData, title, type, updatedAt])
}

function setMeta(
  selector: string,
  attribute: 'name' | 'property',
  key: string,
  content: string,
) {
  let element = document.querySelector<HTMLMetaElement>(selector)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}
