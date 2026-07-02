import type { ButtonHTMLAttributes, ReactNode } from 'react'

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

/** Day-rating color ramp from the design: ≥80 good, ≥62 accent2, else warn. */
export function scoreColor(score: number): string {
  if (score >= 80) return 'var(--good-tx)'
  if (score >= 62) return 'var(--accent-2)'
  return 'var(--warn-tx)'
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
        'font-mono uppercase text-faint text-[9px] tracking-[0.12em]',
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
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'chip'
type ButtonSize = 'sm' | 'md' | 'lg'

const VARIANT: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-on-accent border-transparent hover:brightness-95',
  secondary: 'bg-panel2 text-ink border-edge hover:brightness-95',
  ghost: 'bg-transparent text-dim border-transparent hover:text-ink',
  chip: 'bg-chip text-ink border-glass-bd hover:brightness-110',
}

const SIZE: Record<ButtonSize, string> = {
  sm: 'h-[30px] px-3 text-[11.5px] gap-1.5 rounded-[8px]',
  md: 'h-[34px] px-3 text-[12px] gap-2 rounded-[9px]',
  lg: 'h-[42px] px-[22px] text-[13px] gap-2 rounded-[11px]',
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
  variant?: 'plain' | 'chip' | 'accent'
}

export function IconButton({
  label,
  size = 34,
  variant = 'plain',
  className,
  children,
  type = 'button',
  ...props
}: IconButtonProps) {
  const look =
    variant === 'accent'
      ? 'border-transparent bg-accent text-on-accent hover:brightness-95'
      : variant === 'chip'
        ? 'border-glass-bd bg-chip text-ink hover:brightness-110'
        : 'border-transparent bg-transparent text-dim hover:text-ink'
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      style={{ width: size, height: size }}
      className={cx(
        'inline-flex items-center justify-center rounded-[9px] border transition cursor-pointer disabled:opacity-60',
        look,
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

/* ------------------------------------------------------------------ */
/* Segmented control — pill group from the config slide-over          */
/* ------------------------------------------------------------------ */
export interface SegmentOption<T extends string> {
  value: T
  label: ReactNode
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className,
}: {
  options: SegmentOption<T>[]
  value: T
  onChange: (value: T) => void
  ariaLabel?: string
  className?: string
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cx(
        'flex items-center gap-1.5 rounded-[11px] border border-edge bg-panel2 p-1',
        className,
      )}
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
              'h-[34px] flex-1 rounded-lg px-2 text-[11.5px] font-semibold leading-none transition cursor-pointer',
              active ? 'bg-accent text-on-accent' : 'bg-transparent text-dim hover:text-ink',
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
/* Stat tile — chip-background mono tile from the glass panel         */
/* ------------------------------------------------------------------ */
export function StatTile({
  label,
  value,
  unit,
  className,
}: {
  label: ReactNode
  value: ReactNode
  unit?: ReactNode
  className?: string
}) {
  return (
    <div className={cx('rounded-[11px] border border-edge bg-chip p-3', className)}>
      <div className="font-mono text-[9px] uppercase tracking-[0.06em] text-faint">
        {label}
      </div>
      <div className="mt-1.5 font-mono text-[23px] font-semibold leading-none tracking-[-0.02em] text-ink">
        {value}
        {unit ? (
          <span className="ml-[3px] text-[11px] font-normal text-dim">{unit}</span>
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
        tone === 'neutral' ? 'border-edge bg-chip text-ink' : toneClasses(tone),
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
/* Status pill (issues, long days, aux legs …)                         */
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
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 font-mono text-[10.5px]',
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
  tone = 'accent2',
  className,
}: {
  pct: number
  tone?: 'accent' | 'accent2'
  className?: string
}) {
  const clamped = Math.max(0, Math.min(100, pct))
  return (
    <div className={cx('h-[5px] overflow-hidden rounded-[3px] bg-chip', className)}>
      <div
        className={cx(
          'h-full rounded-[3px]',
          tone === 'accent2' ? 'bg-accent2' : 'bg-accent',
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
