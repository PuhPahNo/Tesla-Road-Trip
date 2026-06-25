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
    <svg {...base({ size, ...props })} fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

/** Sliders / configure. */
export function SlidersIcon({ size = 15, ...props }: IconProps) {
  return (
    <svg {...base({ size, ...props })} fill="none" stroke="currentColor" strokeWidth={2}>
      <line x1="4" y1="8" x2="20" y2="8" />
      <circle cx="9" cy="8" r="2.4" fill="var(--panel-2)" />
      <line x1="4" y1="16" x2="20" y2="16" />
      <circle cx="15" cy="16" r="2.4" fill="var(--panel-2)" />
    </svg>
  )
}

/** Optimize — looping arrow. */
export function OptimizeIcon({ size = 15, ...props }: IconProps) {
  return (
    <svg {...base({ size, ...props })} fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M3 12a9 9 0 1 1 3 6.7" />
      <path d="M3 19v-4h4" />
    </svg>
  )
}

export function RefreshIcon(props: IconProps) {
  return OptimizeIcon(props)
}

export function SendIcon({ size = 15, ...props }: IconProps) {
  return (
    <svg {...base({ size, ...props })} fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M5 12h13M13 6l6 6-6 6" />
    </svg>
  )
}

export function SparkleIcon({ size = 13, ...props }: IconProps) {
  return (
    <svg {...base({ size, ...props })} fill="currentColor">
      <path d="M12 2l1.8 5.4L19 9l-5.2 1.6L12 16l-1.8-5.4L5 9l5.2-1.6z" />
    </svg>
  )
}

export function CloseIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg {...base({ size, ...props })} fill="none" stroke="currentColor" strokeWidth={2.2}>
      <path d="M6 6l12 12M18 6l-12 12" />
    </svg>
  )
}

export function CheckIcon({ size = 14, ...props }: IconProps) {
  return (
    <svg {...base({ size, ...props })} fill="none" stroke="currentColor" strokeWidth={2.4}>
      <path d="M4 12.5l5 5 11-12" />
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
      <circle cx="12" cy="12" r="9.2" />
      <line x1="12" y1="11" x2="12" y2="16.5" />
      <circle cx="12" cy="7.6" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function MapPinIcon({ size = 14, ...props }: IconProps) {
  return (
    <svg {...base({ size, ...props })} fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  )
}

export function SunIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg {...base({ size, ...props })} fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2v2.5M12 19.5V22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M2 12h2.5M19.5 12H22M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
    </svg>
  )
}

export function MoonIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg {...base({ size, ...props })} fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.6 6.6 0 0 0 9.8 9.8z" />
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

export function LayersIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg {...base({ size, ...props })} fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M12 3l9 5-9 5-9-5 9-5z" />
      <path d="M3 13l9 5 9-5" />
    </svg>
  )
}

export function CalendarIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg {...base({ size, ...props })} fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="3.5" y="5" width="17" height="16" rx="2.5" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" />
    </svg>
  )
}

export function CompassIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg {...base({ size, ...props })} fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="9.2" />
      <path d="M15.5 8.5l-2 5-5 2 2-5 5-2z" />
    </svg>
  )
}
