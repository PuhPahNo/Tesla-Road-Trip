import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { usePageMetadata } from './usePageMetadata'

afterEach(() => {
  cleanup()
  document.head.querySelectorAll('meta, link[rel="canonical"], script[data-page-schema]').forEach((node) => node.remove())
})

function MetadataHarness(props: Parameters<typeof usePageMetadata>[0]) {
  usePageMetadata(props)
  return null
}

describe('client page metadata', () => {
  it('updates the complete social contract and clears article-only state on navigation', () => {
    const { rerender } = render(
      <MetadataHarness
        title="Competition article"
        description="A complete article description."
        path="/competition/example"
        type="article"
        updatedAt="2026-08-10"
        socialImage="/social/chargequest-competition.jpg"
        socialImageAlt="Tesla Superchargers illuminated at night"
        structuredData={{ '@context': 'https://schema.org', '@type': 'Article' }}
      />,
    )

    expect(document.title).toBe('Competition article')
    expect(document.querySelector('meta[property="og:type"]')?.getAttribute('content')).toBe('article')
    expect(document.querySelector('meta[property="og:image"]')?.getAttribute('content')).toBe(
      'https://www.teslachargequest.com/social/chargequest-competition.jpg',
    )
    expect(document.querySelector('meta[name="twitter:title"]')?.getAttribute('content')).toBe('Competition article')
    expect(document.querySelector('meta[property="article:modified_time"]')?.getAttribute('content')).toBe('2026-08-10')
    expect(document.querySelector('script[data-page-schema]')?.textContent).toContain('Article')

    rerender(
      <MetadataHarness
        title="Community"
        description="A community page description."
        path="/community"
        type="website"
      />,
    )

    expect(document.querySelector('meta[property="og:type"]')?.getAttribute('content')).toBe('website')
    expect(document.querySelector('meta[property="article:modified_time"]')).toBeNull()
    expect(document.querySelector('script[data-page-schema]')).toBeNull()
  })
})
