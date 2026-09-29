import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight, MapPin } from 'lucide-react'
import { instagramHandle } from '../contact'
import { usePageMetadata } from '../usePageMetadata'
import { PUBLIC_PAGES } from '../sitePages'
import { NotFoundPage } from '../SearchBoundaryPages'
import {
  FieldNoteLink,
  FieldNoteParagraph,
  JournalCard,
  JournalMeta,
  Kicker,
  LoadingBlock,
  MediaEmbed,
  PageContainer,
} from './components'
import type { JournalEntry } from './journal'
import { useTripData } from './TripData'

export function JournalPage() {
  usePageMetadata(PUBLIC_PAGES.journal)
  const { community, journal, loading } = useTripData()
  const instagramUrl = community?.trip.instagramUrl
  if (loading) return <LoadingBlock label="Loading the journal…" />

  return (
    <PageContainer className="max-w-[760px] pb-16 pt-8 sm:pt-12">
      <Kicker>Journal</Kicker>
      <h1 className="font-display mt-2 text-[clamp(36px,7vw,56px)] font-semibold leading-[1.02] tracking-[-0.03em]">
        Notes from the road
      </h1>
      <p className="mt-3 text-[16px] leading-[1.6] text-dim">
        Updates, photos and videos from the trip, newest first.
      </p>
      {instagramUrl ? (
        <a
          href={instagramUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex min-h-11 items-center gap-1.5 rounded-full border border-edge2 px-4 text-[14px] font-medium text-ink no-underline hover:bg-chip"
        >
          More videos at {instagramHandle(instagramUrl)} <ArrowUpRight size={15} aria-hidden="true" />
        </a>
      ) : null}
      <div className="mt-8 flex flex-col gap-5">
        {journal.map((entry) => (
          <JournalCard key={entry.id} entry={entry} />
        ))}
        {journal.length === 0 ? (
          <p className="rounded-2xl border border-edge bg-panel p-6 text-[15px] text-dim">
            Nothing here yet. The first posts will show up once the trip gets going.
          </p>
        ) : null}
      </div>
    </PageContainer>
  )
}

export function JournalPostPage() {
  const { postId } = useParams()
  const { journal, loading } = useTripData()
  const entry = journal.find((candidate) => candidate.id === postId)

  if (loading) return <LoadingBlock label="Loading the post…" />
  if (!entry) return <NotFoundPage />
  return <JournalPost entry={entry} />
}

function JournalPost({ entry }: { entry: JournalEntry }) {
  usePageMetadata({
    title: `${entry.title} · ChargeQuest`,
    description: entry.body.slice(0, 180) || PUBLIC_PAGES.journal.description,
    path: `/journal/${entry.id}`,
    type: 'article',
  })
  const note = entry.fieldNote

  return (
    <article className="pb-16 pt-6 sm:pt-10">
      <PageContainer className="max-w-[760px]">
        <Link to="/journal" className="inline-flex min-h-10 items-center gap-1.5 text-[14px] font-medium text-dim no-underline hover:text-ink">
          <ArrowLeft size={16} aria-hidden="true" /> All posts
        </Link>
        <div className="mt-4">
          <JournalMeta entry={entry} />
        </div>
        <h1 className="font-display mt-3 text-[clamp(32px,6.5vw,52px)] font-semibold leading-[1.06] tracking-[-0.03em]">
          {entry.title}
        </h1>
        {entry.visiting ? (
          <p className="mt-3 inline-flex items-start gap-1.5 text-[14.5px] text-dim">
            <MapPin size={15} className="mt-0.5 flex-none" aria-hidden="true" /> {entry.visiting}
          </p>
        ) : null}
      </PageContainer>

      {entry.media ? (
        <PageContainer className="mt-6 max-w-[760px]">
          <div className="overflow-hidden rounded-2xl border border-edge">
            <MediaEmbed media={entry.media} />
          </div>
          {entry.media.kind === 'instagram' ? (
            <a
              href={entry.media.url}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-[13px] text-faint no-underline hover:text-ink"
            >
              Open on Instagram <ArrowUpRight size={13} aria-hidden="true" />
            </a>
          ) : null}
        </PageContainer>
      ) : null}

      <PageContainer className="mt-6 max-w-[760px]">
        {note ? (
          <div className="flex flex-col gap-5">
            {note.lede.map((paragraph, index) => (
              <FieldNoteParagraph key={index} content={paragraph} />
            ))}
            {note.sections.map((section) => (
              <section key={section.heading} className="mt-4 flex flex-col gap-4">
                <h2 className="font-display text-[24px] font-semibold leading-[1.2] tracking-[-0.02em]">{section.heading}</h2>
                {section.paragraphs.map((paragraph, index) => (
                  <FieldNoteParagraph key={index} content={paragraph} />
                ))}
                {section.bullets?.length ? (
                  <ul className="m-0 flex list-disc flex-col gap-2 pl-5 text-[16.5px] leading-[1.65] text-ink/90">
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                ) : null}
                {section.afterBullets?.map((paragraph, index) => (
                  <FieldNoteParagraph key={`after-${index}`} content={paragraph} />
                ))}
              </section>
            ))}
            {note.closingLinks.length || note.sources.length ? (
              <div className="mt-6 flex flex-col gap-2 border-t border-edge pt-5 text-[14.5px]">
                {[...note.closingLinks, ...note.sources].map((link) => (
                  <FieldNoteLink key={link.href} link={link} />
                ))}
              </div>
            ) : null}
          </div>
        ) : entry.body ? (
          <p className="whitespace-pre-line text-[17px] leading-[1.75] text-ink/90">{entry.body}</p>
        ) : null}

        {entry.dayNumber ? (
          <Link
            to={`/route?day=${entry.dayNumber}`}
            className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-full border border-edge px-4 text-[14px] font-medium text-ink no-underline hover:bg-chip"
          >
            See day {entry.dayNumber} on the route
          </Link>
        ) : null}
      </PageContainer>
    </article>
  )
}
