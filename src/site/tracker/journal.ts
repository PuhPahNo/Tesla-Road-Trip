import type { AnthonyArtifactType, AnthonyUpdate, AnthonyUpdatePhase } from '../../api/siteClient'
import {
  PUBLISHED_ANTHONY_FIELD_NOTES,
  type AnthonyFieldNote,
} from '../../content/anthonyFieldNotes'

export type JournalMedia =
  | { kind: 'instagram'; url: string; embedUrl: string; label?: string }
  | { kind: 'youtube'; url: string; embedUrl: string; label?: string }
  | { kind: 'image'; url: string; label?: string }
  | { kind: 'link'; url: string; label?: string }

export interface JournalEntry {
  id: string
  /** ISO timestamp or YYYY-MM-DD. */
  date: string
  title: string
  body: string
  label: string
  dayNumber?: number
  location?: string
  visiting?: string
  media?: JournalMedia
  /** Long-form field notes carry their structured sections. */
  fieldNote?: AnthonyFieldNote
}

const PHASE_LABELS: Record<AnthonyUpdatePhase, string> = {
  planning: 'Planning',
  'route-decision': 'Route decision',
  'build-note': 'Behind the scenes',
  milestone: 'Milestone',
  'on-the-road': 'On the road',
}

export function buildJournal(updates: AnthonyUpdate[]): JournalEntry[] {
  return [
    ...PUBLISHED_ANTHONY_FIELD_NOTES.map(fieldNoteEntry),
    ...updates.map(updateEntry),
  ].sort((left, right) => right.date.localeCompare(left.date))
}

function fieldNoteEntry(note: AnthonyFieldNote): JournalEntry {
  return {
    id: note.id,
    date: note.publishedAt,
    title: note.title,
    body: note.excerpt,
    label: 'Field note',
    fieldNote: note,
  }
}

function updateEntry(update: AnthonyUpdate): JournalEntry {
  const location = update.location && update.location !== 'Pre-trip' ? update.location : undefined
  return {
    id: update.id,
    date: update.created_at,
    title: update.title,
    body: update.body,
    label: update.day_number ? `Day ${update.day_number}` : PHASE_LABELS[update.phase] ?? 'Update',
    dayNumber: update.day_number ?? undefined,
    location,
    visiting: update.visiting ?? undefined,
    media: update.artifact_url
      ? classifyMedia(update.artifact_url, update.artifact_type ?? undefined, update.artifact_label ?? undefined)
      : undefined,
  }
}

/**
 * Turns a pasted link into something embeddable. Instagram and YouTube links
 * are recognized from the URL itself, so the admin type picker is optional.
 */
export function classifyMedia(
  url: string,
  declaredType?: AnthonyArtifactType,
  label?: string,
): JournalMedia {
  const instagram = url.match(/instagram\.com\/(?:[A-Za-z0-9_.]+\/)?(p|reel|reels|tv)\/([A-Za-z0-9_-]+)/i)
  if (instagram) {
    const kind = instagram[1].toLowerCase() === 'p' ? 'p' : 'reel'
    return {
      kind: 'instagram',
      url,
      embedUrl: `https://www.instagram.com/${kind}/${instagram[2]}/embed/`,
      label,
    }
  }
  const youtube =
    url.match(/youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/)([A-Za-z0-9_-]{6,})/i) ??
    url.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/i)
  if (youtube) {
    return {
      kind: 'youtube',
      url,
      embedUrl: `https://www.youtube-nocookie.com/embed/${youtube[1]}`,
      label,
    }
  }
  if (declaredType === 'image' || /\.(?:jpe?g|png|webp|avif|gif)(?:\?|$)/i.test(url)) {
    return { kind: 'image', url, label }
  }
  return { kind: 'link', url, label }
}

export function entriesForDay(journal: JournalEntry[], dayNumber: number) {
  return journal.filter((entry) => entry.dayNumber === dayNumber)
}
