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
  it('publishes the approved 73-day route note as substantial first-person evidence', () => {
    const note = PUBLISHED_ANTHONY_FIELD_NOTES.find(
      (candidate) => candidate.id === '73-day-route-not-finished',
    )
    expect(note).toBeTruthy()
    const copy = fieldNotePlainText(note!)

    expect(note?.title).toBe(
      'The route is 73 days long. I’m still not calling it finished.',
    )
    expect(copy).toContain('10,107.8 road-routed miles')
    expect(copy).toContain('all 73 planned sites show as open')
    expect(copy).toContain('289.7 miles')
    expect(copy).toContain('Those are not the same rule.')
    expect(copy.trim().split(/\s+/).length).toBeGreaterThanOrEqual(850)
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

    expect(new Set(internalLinks.map((link) => link.href))).toEqual(new Set([
      '#full-route',
      '/2026-tesla-supercharging-competition',
      '/competition/longest-trip-strategy',
      '/tesla-road-trip-routes',
      '/signup?returnTo=%2Fplanner',
      '/community',
    ]))

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
