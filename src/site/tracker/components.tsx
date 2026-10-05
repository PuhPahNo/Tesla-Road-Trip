import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, MapPin } from 'lucide-react'
import type { AnthonyFieldNoteInline, AnthonyFieldNoteLink } from '../../content/anthonyFieldNotes'
import { cx } from '../../ui/primitives'
import type { JournalEntry, JournalMedia } from './journal'
import { formatLongDate, formatRelativeTime, type DayStatus } from './tripProgress'

export function Kicker({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cx('font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-faint', className)}>
      {children}
    </div>
  )
}

export function SectionHeading({
  kicker,
  title,
  action,
}: {
  kicker: string
  title: string
  action?: ReactNode
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <Kicker>{kicker}</Kicker>
        <h2 className="font-display mt-2 text-[26px] font-semibold leading-[1.1] tracking-[-0.02em] sm:text-[30px]">
          {title}
        </h2>
      </div>
      {action}
    </div>
  )
}

export function TextLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="inline-flex flex-none items-center gap-1 text-[14px] font-medium text-accent no-underline hover:underline"
    >
      {children}
    </Link>
  )
}

export function StatBlock({
  label,
  value,
  of,
  hint,
  accent = false,
}: {
  label: string
  value: string
  of?: string
  hint?: string
  accent?: boolean
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5 rounded-2xl border border-edge bg-panel p-4 sm:p-5">
      <div className="text-[12.5px] font-medium text-dim">{label}</div>
      <div className="flex items-baseline gap-1.5">
        <span
          className={cx(
            'font-display text-[28px] font-semibold leading-none tracking-[-0.03em] tabular-nums sm:text-[34px]',
            accent ? 'text-accent' : 'text-ink',
          )}
        >
          {value}
        </span>
        {of ? <span className="text-[13px] text-faint tabular-nums">/ {of}</span> : null}
      </div>
      {hint ? <div className="text-[12px] text-faint">{hint}</div> : null}
    </div>
  )
}

export function ProgressTrack({ value, max }: { value: number; max: number }) {
  const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-chip"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
    >
      <div className="h-full rounded-full bg-accent transition-[width] duration-700" style={{ width: `${percent}%` }} />
    </div>
  )
}

export function DayStatusBadge({ status }: { status: DayStatus }) {
  if (status === 'today') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold text-on-accent">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-on-accent" />
        Today
      </span>
    )
  }
  if (status === 'done') {
    return (
      <span className="inline-flex items-center rounded-full border border-good-bd bg-good-bg px-2.5 py-1 text-[11px] font-semibold text-good">
        Done
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full border border-edge px-2.5 py-1 text-[11px] font-medium text-faint">
      Planned
    </span>
  )
}

export function LiveDot() {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent" />
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Journal                                                             */
/* ------------------------------------------------------------------ */

export function JournalMeta({ entry }: { entry: JournalEntry }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12.5px] text-faint">
      <span className="font-semibold text-accent">{entry.label}</span>
      <span aria-hidden="true">·</span>
      <time dateTime={entry.date}>{entry.date.includes('T') ? formatRelativeTime(entry.date) : formatLongDate(entry.date)}</time>
      {entry.fieldNote && entry.fieldNote.updatedAt !== entry.fieldNote.publishedAt ? (
        <>
          <span aria-hidden="true">·</span>
          <span>Updated <time dateTime={entry.fieldNote.updatedAt}>{formatLongDate(entry.fieldNote.updatedAt)}</time></span>
        </>
      ) : null}
      {entry.location ? (
        <>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1">
            <MapPin size={12} aria-hidden="true" />
            {entry.location}
          </span>
        </>
      ) : null}
    </div>
  )
}

/** Compact card for lists; links to the full post. */
export function JournalCard({ entry, showMedia = true }: { entry: JournalEntry; showMedia?: boolean }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-edge bg-panel">
      {showMedia && entry.media ? <MediaEmbed media={entry.media} compact /> : null}
      <div className="p-5 sm:p-6">
        <JournalMeta entry={entry} />
        <h3 className="font-display mt-2.5 text-[20px] font-semibold leading-[1.25] tracking-[-0.015em] sm:text-[22px]">
          <Link to={`/journal/${entry.id}`} className="text-ink no-underline hover:text-accent">
            {entry.title}
          </Link>
        </h3>
        {entry.body ? (
          <p className="mt-2.5 line-clamp-4 whitespace-pre-line text-[15px] leading-[1.65] text-dim">{entry.body}</p>
        ) : null}
        {entry.fieldNote ? (
          <Link to={`/journal/${entry.id}`} className="mt-4 inline-flex items-center gap-1 text-[14px] font-medium text-accent no-underline">
            Read the full note <ArrowUpRight size={14} aria-hidden="true" />
          </Link>
        ) : null}
      </div>
    </article>
  )
}

export function MediaEmbed({ media, compact = false }: { media: JournalMedia; compact?: boolean }) {
  if (media.kind === 'instagram') {
    return (
      <div className={cx('flex justify-center bg-canvas', compact ? 'max-h-[640px] overflow-hidden' : '')}>
        <iframe
          src={media.embedUrl}
          title={media.label ?? 'Instagram post'}
          className="block h-[620px] w-full max-w-[480px] border-0 bg-white sm:h-[680px]"
          loading="lazy"
          allowFullScreen
          scrolling="no"
        />
      </div>
    )
  }
  if (media.kind === 'youtube') {
    return (
      <div className="aspect-video w-full bg-black">
        <iframe
          src={media.embedUrl}
          title={media.label ?? 'Video'}
          className="h-full w-full border-0"
          loading="lazy"
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    )
  }
  if (media.kind === 'image') {
    return (
      <a href={media.url} target="_blank" rel="noreferrer" className="block bg-canvas">
        <img
          src={media.url}
          alt={media.label ?? ''}
          loading="lazy"
          className={cx('block w-full object-cover', compact ? 'max-h-[420px]' : 'max-h-[80vh] object-contain')}
        />
      </a>
    )
  }
  return (
    <a
      href={media.url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center justify-between gap-3 border-b border-edge bg-chip px-5 py-4 text-[14px] font-medium text-ink no-underline hover:text-accent sm:px-6"
    >
      <span className="min-w-0 truncate">{media.label || hostOf(media.url)}</span>
      <ArrowUpRight size={16} className="flex-none" aria-hidden="true" />
    </a>
  )
}

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export function FieldNoteParagraph({ content }: { content: AnthonyFieldNoteInline[] }) {
  return (
    <p className="text-[16.5px] leading-[1.75] text-ink/90">
      {content.map((part, index) =>
        typeof part === 'string' ? part : <FieldNoteLink key={index} link={part} />,
      )}
    </p>
  )
}

export function FieldNoteLink({ link }: { link: AnthonyFieldNoteLink }) {
  const className = 'font-medium text-accent underline decoration-accent/40 underline-offset-2'
  if (link.external || /^https?:/.test(link.href)) {
    return (
      <a href={link.href} target="_blank" rel="noreferrer" className={className}>
        {link.label}
      </a>
    )
  }
  return (
    <Link to={link.href} className={className}>
      {link.label}
    </Link>
  )
}

export function PageContainer({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('mx-auto w-full max-w-[1200px] px-4 sm:px-6', className)}>{children}</div>
}

export function LoadingBlock({ label }: { label: string }) {
  return (
    <div role="status" className="flex min-h-[50vh] items-center justify-center text-[14px] text-faint">
      {label}
    </div>
  )
}
