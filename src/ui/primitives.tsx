import {
  useId,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react'
import { ChevronDownIcon } from './icons'

/** Tiny classname joiner. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

export type Tone = 'neutral' | 'good' | 'warn' | 'info' | 'accent'

export function toneClasses(tone: Tone): string {
  switch (tone) {
    case 'good':
      return 'bg-good-bg border-good-bd text-good'
    case 'warn':
      return 'bg-warn-bg border-warn-bd text-warn'
    case 'info':
      return 'bg-info-bg border-info-bd text-info'
    case 'accent':
      return 'bg-accent border-transparent text-on-accent'
    default:
      return 'bg-panel2 border-edge text-dim'
  }
}

/* ------------------------------------------------------------------ */
/* Eyebrow — mono uppercase micro-label                                */
/* ------------------------------------------------------------------ */
export function Eyebrow({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cx(
        'font-mono uppercase text-faint text-[9.5px] tracking-[0.14em]',
        className,
      )}
    >
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Buttons                                                             */
/* ------------------------------------------------------------------ */
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'accent2'
type ButtonSize = 'sm' | 'md' | 'lg'

const VARIANT: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-on-accent border-transparent shadow-[0_1px_2px_rgba(0,0,0,0.18)] hover:brightness-95',
  secondary: 'bg-panel2 text-ink border-edge hover:brightness-95',
  ghost: 'bg-transparent text-dim border-transparent hover:text-ink',
  accent2: 'bg-accent2 text-on-accent2 border-transparent hover:brightness-95',
}

const SIZE: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[12.5px] gap-1.5 rounded-lg',
  md: 'h-[34px] px-3.5 text-[13px] gap-2 rounded-[9px]',
  lg: 'h-[42px] px-4 text-[14px] gap-2 rounded-[11px]',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

export function Button({
  variant = 'secondary',
  size = 'md',
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(
        'inline-flex items-center justify-center border font-medium leading-none transition select-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed',
        SIZE[size],
        VARIANT[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  size?: number
}

export function IconButton({
  label,
  size = 34,
  className,
  children,
  type = 'button',
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      style={{ width: size, height: size }}
      className={cx(
        'inline-flex items-center justify-center rounded-[9px] border border-edge bg-panel2 text-ink hover:brightness-95 transition cursor-pointer disabled:opacity-60',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

/* ------------------------------------------------------------------ */
/* Segmented control                                                   */
/* ------------------------------------------------------------------ */
export interface SegmentOption<T extends string> {
  value: T
  label: ReactNode
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
  tone = 'accent',
  ariaLabel,
}: {
  options: SegmentOption<T>[]
  value: T
  onChange: (value: T) => void
  size?: 'sm' | 'md'
  tone?: 'accent' | 'accent2'
  ariaLabel?: string
}) {
  const onBg = tone === 'accent2' ? 'bg-accent2 text-on-accent2' : 'bg-accent text-on-accent'
  const pad = size === 'sm' ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-[5px] text-[12px]'
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="inline-flex items-center gap-[3px] rounded-[10px] border border-edge bg-panel2 p-[3px]"
    >
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cx(
              'rounded-[7px] font-semibold leading-none transition cursor-pointer',
              pad,
              active ? onBg : 'bg-transparent text-dim hover:text-ink',
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Stat tile                                                           */
/* ------------------------------------------------------------------ */
export function StatTile({
  label,
  value,
  unit,
  icon,
  className,
}: {
  label: ReactNode
  value: ReactNode
  unit?: ReactNode
  icon?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cx(
        'rounded-xl border border-edge bg-panel2 px-3.5 py-[13px]',
        className,
      )}
    >
      <div className="mb-[7px] flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.06em] text-faint">
        {icon}
        {label}
      </div>
      <div className="font-mono text-[21px] font-semibold leading-none text-ink">
        {value}
        {unit ? (
          <span className="ml-[3px] text-[12px] font-normal text-faint">{unit}</span>
        ) : null}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Chip — pill with optional numbered badge                            */
/* ------------------------------------------------------------------ */
export function Chip({
  label,
  index,
  tone = 'neutral',
  className,
}: {
  label: ReactNode
  index?: number
  tone?: Tone
  className?: string
}) {
  return (
    <span
      className={cx(
        'inline-flex flex-none items-center gap-1.5 whitespace-nowrap rounded-full border text-[11.5px]',
        index != null ? 'py-[3px] pr-[9px] pl-[3px]' : 'px-[10px] py-[3px]',
        tone === 'neutral' ? 'border-edge bg-panel2 text-ink' : toneClasses(tone),
        className,
      )}
    >
      {index != null && (
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-accent font-mono text-[9px] text-on-accent">
          {index}
        </span>
      )}
      {label}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Status pill (sites/day, over-cap, aux charge …)                     */
/* ------------------------------------------------------------------ */
export function Pill({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode
  tone?: Tone
  className?: string
}) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 font-mono text-[11.5px]',
        toneClasses(tone),
        className,
      )}
    >
      {children}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Progress bar                                                        */
/* ------------------------------------------------------------------ */
export function ProgressBar({
  pct,
  tone = 'accent',
  className,
}: {
  pct: number
  tone?: 'accent' | 'accent2'
  className?: string
}) {
  const clamped = Math.max(0, Math.min(100, pct))
  return (
    <div className={cx('h-1.5 overflow-hidden rounded bg-chip', className)}>
      <div
        className={cx('h-full rounded', tone === 'accent2' ? 'bg-accent2' : 'bg-accent')}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Collapsible card (sidebar sections)                                 */
/* ------------------------------------------------------------------ */
export function Collapsible({
  eyebrow,
  title,
  meta,
  defaultOpen = false,
  open: controlledOpen,
  onToggle,
  children,
  className,
}: {
  eyebrow: ReactNode
  title: ReactNode
  meta?: ReactNode
  defaultOpen?: boolean
  open?: boolean
  onToggle?: (open: boolean) => void
  children: ReactNode
  className?: string
}) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const isControlled = controlledOpen != null
  const open = isControlled ? controlledOpen : internalOpen
  const panelId = useId()

  const toggle = () => {
    const next = !open
    if (!isControlled) setInternalOpen(next)
    onToggle?.(next)
  }

  return (
    <div
      className={cx('overflow-hidden rounded-xl border border-edge bg-panel', className)}
    >
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center gap-2.5 px-3.5 py-[13px] text-left text-ink cursor-pointer"
      >
        <div className="min-w-0 flex-1">
          <div className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-faint">
            {eyebrow}
          </div>
          <div className="mt-0.5 truncate text-[13.5px] font-semibold">{title}</div>
        </div>
        {meta ? <span className="font-mono text-[11px] text-dim">{meta}</span> : null}
        <ChevronDownIcon
          className={cx('text-faint transition-transform', open ? '' : '-rotate-90')}
        />
      </button>
      {open && (
        <div id={panelId} className="anim-fadeup">
          {children}
        </div>
      )}
    </div>
  )
}
