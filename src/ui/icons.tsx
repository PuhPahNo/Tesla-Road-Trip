import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function base({ size = 16, ...props }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    ...props,
  }
}

/** Brand lightning bolt (filled). */
export function BoltIcon({ size = 15, ...props }: IconProps) {
  return (
    <svg {...base({ size, ...props })} fill="currentColor">
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" />
    </svg>
  )
}

export function ChevronDownIcon({ size = 12, ...props }: IconProps) {
  return (
    <svg {...base({ size, ...props })} fill="none" stroke="currentColor" strokeWidth={2.5}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

export function ChevronLeftIcon({ size = 15, ...props }: IconProps) {
  return (
    <svg {...base({ size, ...props })} fill="none" stroke="currentColor" strokeWidth={2.4}>
      <path d="M15 6l-6 6 6 6" />
    </svg>
  )
}

export function ChevronRightIcon({ size = 15, ...props }: IconProps) {
  return (
    <svg {...base({ size, ...props })} fill="none" stroke="currentColor" strokeWidth={2.4}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  )
}

/** Sliders / configure — from the cockpit design. */
export function SlidersIcon({ size = 14, ...props }: IconProps) {
  return (
    <svg {...base({ size, ...props })} fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M4 6h11M4 12h16M4 18h9" />
      <circle cx="18" cy="6" r="2.2" />
      <circle cx="9" cy="12" r="2.2" />
      <circle cx="16" cy="18" r="2.2" />
    </svg>
  )
}

/** Refresh — looping arrow from the cockpit design. */
export function RefreshIcon({ size = 15, ...props }: IconProps) {
  return (
    <svg {...base({ size, ...props })} fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M21 12a9 9 0 1 1-2.6-6.4M21 3v6h-6" />
    </svg>
  )
}

/** Paper-plane send from the cockpit design. */
export function SendIcon({ size = 15, ...props }: IconProps) {
  return (
    <svg {...base({ size, ...props })} fill="currentColor" stroke="none">
      <path d="M3 11l18-8-8 18-2-7-8-3z" />
    </svg>
  )
}

export function SparkleIcon({ size = 14, ...props }: IconProps) {
  return (
    <svg {...base({ size, ...props })} fill="currentColor">
      <path d="M12 2l1.7 5.3L19 9l-5.3 1.7L12 16l-1.7-5.3L5 9l5.3-1.7z" />
    </svg>
  )
}

export function CloseIcon({ size = 14, ...props }: IconProps) {
  return (
    <svg {...base({ size, ...props })} fill="none" stroke="currentColor" strokeWidth={2.2}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

export function CheckIcon({ size = 14, ...props }: IconProps) {
  return (
    <svg {...base({ size, ...props })} fill="none" stroke="currentColor" strokeWidth={2.4}>
      <path d="M5 12l5 5 9-11" />
    </svg>
  )
}

export function AlertIcon({ size = 14, ...props }: IconProps) {
  return (
    <svg {...base({ size, ...props })} fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M12 3 2 20h20L12 3z" />
      <line x1="12" y1="9" x2="12" y2="14" />
      <circle cx="12" cy="17.2" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function InfoIcon({ size = 14, ...props }: IconProps) {
  return (
    <svg {...base({ size, ...props })} fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 7.5v.5" />
    </svg>
  )
}

export function MapPinIcon({ size = 17, ...props }: IconProps) {
  return (
    <svg {...base({ size, ...props })} fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M12 21s-7-6.5-7-11a7 7 0 0 1 14 0c0 4.5-7 11-7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  )
}

export function SunIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg {...base({ size, ...props })} fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
    </svg>
  )
}

export function MoonIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg {...base({ size, ...props })} fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z" />
    </svg>
  )
}

/** Overview — 2x2 grid from the rail. */
export function GridIcon({ size = 17, ...props }: IconProps) {
  return (
    <svg {...base({ size, ...props })} fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  )
}

export function CalendarIcon({ size = 17, ...props }: IconProps) {
  return (
    <svg {...base({ size, ...props })} fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M3 9h18M8 2v4M16 2v4" />
    </svg>
  )
}

/** Trip stats — bar chart from the rail. */
export function BarsIcon({ size = 17, ...props }: IconProps) {
  return (
    <svg {...base({ size, ...props })} fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </svg>
  )
}

/** Guardrails — shield from the rail. */
export function ShieldIcon({ size = 17, ...props }: IconProps) {
  return (
    <svg {...base({ size, ...props })} fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" />
    </svg>
  )
}

export function PlayIcon({ size = 13, ...props }: IconProps) {
  return (
    <svg {...base({ size, ...props })} fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

export function PauseIcon({ size = 13, ...props }: IconProps) {
  return (
    <svg {...base({ size, ...props })} fill="currentColor">
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  )
}

export function PlusIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg {...base({ size, ...props })} fill="none" stroke="currentColor" strokeWidth={2.2}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function MinusIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg {...base({ size, ...props })} fill="none" stroke="currentColor" strokeWidth={2.2}>
      <path d="M5 12h14" />
    </svg>
  )
}

export function CompassIcon({ size = 17, ...props }: IconProps) {
  return (
    <svg {...base({ size, ...props })} fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="9.2" />
      <path d="M15.5 8.5l-2 5-5 2 2-5 5-2z" />
    </svg>
  )
}
