import { describe, expect, it } from 'vitest'
import {
  PUBLISHED_ANTHONY_FIELD_NOTES,
  fieldNotePlainText,
  type AnthonyFieldNoteInline,
} from './anthonyFieldNotes'

function linksIn(content: AnthonyFieldNoteInline[]) {
  return content.filter((part) => typeof part !== 'string')
}

describe('published Anthony field notes', () => {
  it('updates the route note without presenting retired itinerary totals as current', () => {
    const note = PUBLISHED_ANTHONY_FIELD_NOTES[0]
    const copy = fieldNotePlainText(note)
    expect(note.id).toBe('route-audible-october-2026')
    expect(note.updatedAt).toBe('2026-10-04')
    expect(copy).toContain('Day 6 · October 9: Omaha')
    expect(copy).toContain('Kentucky Derby Museum')
    expect(copy).toContain('tentative stop')
    expect(copy).not.toMatch(/73|10,107|September 27|October 3|48 days/)
  })

  it('uses intentional internal links and avoids generic AI copy', () => {
    const note = PUBLISHED_ANTHONY_FIELD_NOTES[0]
    const inlineLinks = [
      ...note.lede.flatMap(linksIn),
      ...note.sections.flatMap((section) => [
        ...section.paragraphs.flatMap(linksIn),
        ...(section.afterBullets ?? []).flatMap(linksIn),
      ]),
    ]
    const internalLinks = [...inlineLinks, ...note.closingLinks]
      .filter((link) => !link.external)

    // Internal links only point at live tracker pages.
    expect(new Set(internalLinks.map((link) => link.href))).toEqual(new Set(['/route']))

    const copy = fieldNotePlainText(note).toLowerCase()
    for (const phrase of [
      'game-changer',
      'in today’s landscape',
      'seasoned tesla owner',
      'delve into',
      'unlock your',
      'embark on',
    ]) {
      expect(copy).not.toContain(phrase)
    }
  })
})
