import { useEffect } from 'react'
import { SITE_ORIGIN } from '../seo/seoPages'

export function usePageMetadata({
  title,
  description,
  path,
  robots = 'index,follow',
  structuredData,
}: {
  title: string
  description: string
  path: string
  robots?: 'index,follow' | 'noindex,nofollow'
  structuredData?: Record<string, unknown>
}) {
  useEffect(() => {
    document.title = title
    setMeta('meta[name="description"]', 'name', 'description', description)
    setMeta('meta[property="og:title"]', 'property', 'og:title', title)
    setMeta('meta[property="og:description"]', 'property', 'og:description', description)
    setMeta('meta[property="og:url"]', 'property', 'og:url', `${SITE_ORIGIN}${path}`)
    setMeta('meta[name="robots"]', 'name', 'robots', robots)
    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    canonical?.setAttribute('href', `${SITE_ORIGIN}${path}`)

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
  }, [description, path, robots, structuredData, title])
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
