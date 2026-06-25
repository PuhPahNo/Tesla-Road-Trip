import {
  useEffect,
  useRef,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'
import { useIsMobile } from '../hooks/useMediaQuery'
import { cx } from './primitives'
import { CheckIcon, CloseIcon } from './icons'

type OverlaySize = 'detail' | 'config' | 'wide'

const MAX_W: Record<OverlaySize, string> = {
  detail: 'md:max-w-[640px]',
  config: 'md:max-w-[560px]',
  wide: 'md:max-w-[880px]',
}

/**
 * Responsive overlay. Desktop → centered modal card. Mobile → slide-up
 * bottom sheet with a drag handle. Portal-rendered, Escape to close,
 * backdrop click to close, body scroll locked while open.
 */
export function Overlay({
  open,
  onClose,
  size = 'detail',
  children,
  labelledBy,
  className,
}: {
  open: boolean
  onClose: () => void
  size?: OverlaySize
  children: ReactNode
  labelledBy?: string
  className?: string
}) {
  const isMobile = useIsMobile()
  const panelRef = useRef<HTMLDivElement>(null)
  useBodyScrollLock(open)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const t = window.setTimeout(() => panelRef.current?.focus(), 0)
    return () => {
      document.removeEventListener('keydown', onKey)
      window.clearTimeout(t)
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      className={cx(
        'fixed inset-0 z-[1000] flex',
        isMobile ? 'items-end justify-center' : 'items-center justify-center p-6',
      )}
    >
      <div
        className="absolute inset-0 anim-fadeup bg-[var(--backdrop)] backdrop-blur-[3px]"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className={cx(
          'relative flex max-h-full w-full flex-col overflow-hidden border border-edge2 bg-panel shadow-card outline-none',
          isMobile
            ? 'anim-sheet max-h-[92vh] rounded-t-2xl'
            : cx('anim-pop rounded-2xl', MAX_W[size]),
          className,
        )}
      >
        {isMobile && (
          <div className="flex justify-center pt-2.5 pb-1" aria-hidden>
            <span className="h-1 w-9 rounded-full bg-edge2" />
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body,
  )
}

/** Shared overlay header: kicker + title + optional subtitle + close. */
export function OverlayHeader({
  badge,
  kicker,
  title,
  subtitle,
  titleId,
  onClose,
}: {
  badge?: ReactNode
  kicker?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  titleId?: string
  onClose: () => void
}) {
  return (
    <div className="flex items-start gap-3.5 border-b border-edge px-5 py-4 md:px-6 md:py-5">
      {badge}
      <div className="min-w-0 flex-1">
        {kicker ? (
          <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
            {kicker}
          </div>
        ) : null}
        <div
          id={titleId}
          className="mt-0.5 text-[19px] font-semibold leading-tight tracking-[-0.01em] text-ink md:text-[21px]"
        >
          {title}
        </div>
        {subtitle ? <div className="mt-0.5 text-[13px] text-dim">{subtitle}</div> : null}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="flex h-8 w-8 flex-none items-center justify-center rounded-[9px] bg-panel2 text-dim hover:text-ink transition cursor-pointer"
      >
        <CloseIcon size={16} />
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Toast                                                               */
/* ------------------------------------------------------------------ */
export function Toast({ message }: { message: string | null }) {
  if (!message) return null
  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-[max(22px,env(safe-area-inset-bottom))] z-[1100] flex justify-center px-4">
      <div className="anim-fadeup pointer-events-auto flex items-center gap-2.5 rounded-xl border border-edge2 bg-panel px-4 py-3 shadow-card">
        <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full border border-good-bd bg-good-bg text-good">
          <CheckIcon size={13} />
        </span>
        <span className="text-[13.5px] font-medium text-ink">{message}</span>
      </div>
    </div>,
    document.body,
  )
}

/* ------------------------------------------------------------------ */
/* Optimize overlay                                                    */
/* ------------------------------------------------------------------ */
export function OptimizeOverlay({ step }: { step: string }) {
  return createPortal(
    <div className="anim-fadeup fixed inset-0 z-[1050] flex items-center justify-center bg-[var(--backdrop)] backdrop-blur-[4px]">
      <div className="flex flex-col items-center gap-[18px] rounded-2xl border border-edge2 bg-panel px-11 py-9 shadow-card">
        <div className="h-[46px] w-[46px] animate-spin rounded-full border-[3px] border-edge border-t-accent" />
        <div className="text-center">
          <div className="text-[16px] font-semibold text-ink">Optimizing route…</div>
          <div className="anim-pulse mt-1.5 font-mono text-[11.5px] text-faint">{step}</div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
