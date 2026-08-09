import { stationStatusPresentation } from '../domain/stationStatus'
import { cx, toneClasses } from '../ui/primitives'

export function StationStatusBadge({
  status,
  compact = false,
}: {
  status: string
  compact?: boolean
}) {
  const presentation = stationStatusPresentation(status)
  return (
    <span
      aria-label={`Supercharge.info status: ${presentation.label}`}
      data-station-status={presentation.code}
      title={`Supercharge.info status: ${presentation.label}`}
      className={cx(
        'inline-flex flex-none items-center rounded-full border font-mono font-semibold uppercase tracking-[0.04em]',
        compact ? 'gap-1 px-1.5 py-0.5 text-[7.5px]' : 'gap-1.5 px-2 py-0.5 text-[8.5px]',
        toneClasses(presentation.tone),
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {presentation.label}
    </span>
  )
}
