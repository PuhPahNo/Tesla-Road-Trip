import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'
import { useIsMobile } from '../hooks/useMediaQuery'
import { cx } from './primitives'
import { CloseIcon } from './icons'

type OverlaySize = 'detail' | 'compact' | 'picker' | 'wide'
type OverlayVariant = 'center' | 'top' | 'slideover'

const MAX_W: Record<OverlaySize, string> = {
  compact: 'md:max-w-[440px]',
  picker: 'md:max-w-[560px]',
  detail: 'md:max-w-[600px]',
  wide: 'md:max-w-[1060px]',
}

/**
 * Responsive overlay. Desktop → centered/top modal card or right
 * slide-over. Mobile → slide-up bottom sheet with a drag handle.
 * Portal-rendered, Escape to close, backdrop click to close, body
 * scroll locked while open.
 */
export function Overlay({
  open,
  onClose,
  size = 'detail',
  variant = 'center',
  children,
  labelledBy,
  className,
}: {
  open: boolean
  onClose: () => void
  size?: OverlaySize
  variant?: OverlayVariant
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

  const slideover = variant === 'slideover' && !isMobile

  return createPortal(
    <div
      className={cx(
        'fixed inset-0 z-[1000] flex',
        isMobile
          ? 'items-end justify-center'
          : slideover
            ? 'justify-end'
            : variant === 'top'
              ? 'items-start justify-center px-6 pt-[88px] pb-6'
              : 'items-center justify-center p-6',
      )}
    >
      <div
        className="anim-fadeup absolute inset-0 bg-[var(--backdrop)] backdrop-blur-[3px]"
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
          'relative flex max-h-full flex-col overflow-hidden bg-panel outline-none',
          isMobile
            ? 'anim-sheet max-h-[92vh] w-full rounded-t-2xl border border-edge2 shadow-card'
            : slideover
              ? 'anim-slideover h-full w-[min(420px,94vw)] border-l border-edge2 shadow-card'
              : cx(
                  'anim-pop w-full rounded-2xl border border-edge2 shadow-card',
                  MAX_W[size],
                ),
          className,
        )}
      >
        {isMobile && (
          <div className="flex flex-none justify-center pt-2.5 pb-1" aria-hidden>
            <span className="h-1 w-9 rounded-full bg-edge2" />
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body,
  )
}

/** Shared overlay header: mono kicker + title + optional meta + close. */
export function OverlayHeader({
  kicker,
  title,
  meta,
  titleId,
  onClose,
}: {
  kicker?: ReactNode
  title: ReactNode
  meta?: ReactNode
  titleId?: string
  onClose: () => void
}) {
  return (
    <div className="flex flex-none items-start justify-between gap-4 border-b border-edge px-[18px] py-4">
      <div className="min-w-0 flex-1">
        {kicker ? (
          <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-faint">
            {kicker}
          </div>
        ) : null}
        <div
          id={titleId}
          className="mt-1 text-[16px] font-semibold leading-tight tracking-[-0.01em] text-ink"
        >
          {title}
        </div>
        {meta ? (
          <div className="mt-[5px] font-mono text-[11px] text-faint">{meta}</div>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="flex h-8 w-8 flex-none cursor-pointer items-center justify-center rounded-[9px] border border-edge bg-transparent text-dim transition hover:text-ink"
      >
        <CloseIcon size={14} />
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
    <div className="pointer-events-none fixed inset-x-0 bottom-[max(20px,env(safe-area-inset-bottom))] z-[1100] flex justify-center px-4">
      <div className="anim-fadeup pointer-events-auto rounded-[11px] border border-edge2 bg-panel px-[18px] py-3 text-[13px] font-medium text-ink shadow-card">
        {message}
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
    <div
      className="anim-fadeup fixed inset-0 z-[1050] flex flex-col items-center justify-center gap-[18px] backdrop-blur-[6px]"
      style={{ background: 'color-mix(in srgb, var(--app-bg) 78%, transparent)' }}
    >
      <div className="h-[46px] w-[46px] animate-spin rounded-full border-[3px] border-edge border-t-accent" />
      <div className="font-mono text-[12px] text-dim">{step}</div>
    </div>,
    document.body,
  )
}

/* ------------------------------------------------------------------ */
/* Splash — boot screen while the first optimization loads             */
/* ------------------------------------------------------------------ */
export function SplashScreen({ subtitle }: { subtitle: string }) {
  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-5 bg-app">
      <div
        className="anim-pulse flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-on-accent"
        style={{ boxShadow: '0 0 40px color-mix(in srgb, var(--accent) 55%, transparent)' }}
      >
        <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor">
          <path d="M13 2 4 14h6l-1 8 9-12h-6z" />
        </svg>
      </div>
      <div className="text-center">
        <div className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
          Supercharger Quest Planner
        </div>
        <div className="mt-1.5 font-mono text-[11px] text-faint">
          {subtitle}
        </div>
      </div>
    </div>
  )
}
