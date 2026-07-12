import type { ReactNode } from 'react'
import { useTheme } from '../theme/theme'
import { cx } from '../ui/primitives'
import {
  BarsIcon,
  CalendarIcon,
  ChevronDownIcon,
  CompassIcon,
  GridIcon,
  MapPinIcon,
  MoonIcon,
  RefreshIcon,
  ShieldIcon,
  SlidersIcon,
  SparkleIcon,
  SunIcon,
} from '../ui/icons'

export type PanelKey = 'overview' | 'days' | 'coverage' | 'stats' | 'status'

export const RAIL_ITEMS: Array<{ key: PanelKey; label: string; icon: typeof GridIcon }> = [
  { key: 'overview', label: 'Overview', icon: GridIcon },
  { key: 'days', label: 'Daily plan', icon: CalendarIcon },
  { key: 'coverage', label: 'Coverage', icon: MapPinIcon },
  { key: 'stats', label: 'Trip stats', icon: BarsIcon },
  { key: 'status', label: 'Guardrails', icon: ShieldIcon },
]

/* ------------------------------------------------------------------ */
/* Top-left island — brand + route picker                              */
/* ------------------------------------------------------------------ */
export function BrandIsland({
  routeName,
  routeColor,
  onOpenRoutePicker,
}: {
  routeName: string
  routeColor?: string
  onOpenRoutePicker: () => void
}) {
  return (
    // Below sm the island yields to the actions island (~108px + gap) so the
    // two never overlap; the route chip shrinks and truncates instead.
    <div className="glass fixed left-3 top-3 z-40 flex h-11 max-w-[calc(100vw-152px)] items-center gap-1.5 rounded-[12px] py-0 pl-2 pr-1 sm:left-4 sm:top-4 sm:h-12 sm:max-w-none sm:gap-2.5 sm:rounded-[13px] sm:pl-3 sm:pr-1.5">
      <a href="/account" aria-label="Open ChargeQuest account and navigation" className="flex flex-none rounded-[8px]">
        <img
          src="/chargequest-logo.png?v=4"
          alt="ChargeQuest"
          className="h-[25px] w-[112px] rounded-[7px] object-contain sm:h-[30px] sm:w-[190px] sm:rounded-[8px]"
        />
      </a>
      <button
        type="button"
        onClick={onOpenRoutePicker}
        aria-label="Choose route"
        className="flex h-8 min-w-0 cursor-pointer items-center gap-1.5 rounded-[8px] border border-glass-bd bg-chip px-2 text-ink transition hover:brightness-110 sm:h-[34px] sm:max-w-[210px] sm:gap-2 sm:rounded-[9px] sm:px-[11px]"
      >
        <span
          className="h-2 w-2 flex-none rounded-full"
          style={{ background: routeColor ?? 'var(--accent)' }}
        />
        <span className="min-w-0 truncate text-[11.5px] font-medium sm:text-[12.5px]">{routeName}</span>
        <ChevronDownIcon size={11} className="flex-none opacity-50" />
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Top-right island — ask / refresh / theme / travel preferences       */
/* ------------------------------------------------------------------ */
export function ActionsIsland({
  onOpenCopilot,
  onRefresh,
  isRefreshing,
  onOpenConfig,
  showAsk,
}: {
  onOpenCopilot: () => void
  onRefresh: () => void
  isRefreshing: boolean
  onOpenConfig: () => void
  showAsk: boolean
}) {
  const { isDark, toggleTheme } = useTheme()
  return (
    <div className="glass fixed right-3 top-3 z-40 flex h-11 items-center gap-0.5 rounded-[12px] px-1 sm:right-4 sm:top-4 sm:h-12 sm:gap-1.5 sm:rounded-[13px] sm:px-[7px]">
      {showAsk && (
        <button
          type="button"
          onClick={onOpenCopilot}
          className="flex h-[34px] cursor-pointer items-center gap-2 rounded-[9px] border border-glass-bd bg-chip py-0 pl-2.5 pr-3 text-ink transition hover:brightness-110"
        >
          <span className="flex text-accent2">
            <SparkleIcon size={14} />
          </span>
          <span className="text-[12px] font-medium">Ask</span>
          <span className="rounded-[5px] border border-glass-bd px-[5px] py-[2px] font-mono text-[9.5px] text-faint">
            ⌘K
          </span>
        </button>
      )}
      <button
        type="button"
        onClick={onRefresh}
        disabled={isRefreshing}
        aria-label="Refresh from Supercharge.info"
        title="Refresh from Supercharge.info"
        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-[8px] border border-transparent bg-transparent text-dim transition hover:text-ink disabled:opacity-60 sm:h-[34px] sm:w-[34px] sm:rounded-[9px]"
      >
        <RefreshIcon size={15} className={isRefreshing ? 'anim-spin' : ''} />
      </button>
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
        title="Toggle theme"
        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-[8px] border border-transparent bg-transparent text-dim transition hover:text-ink sm:h-[34px] sm:w-[34px] sm:rounded-[9px]"
      >
        {isDark ? <SunIcon size={16} /> : <MoonIcon size={16} />}
      </button>
      <button
        type="button"
        onClick={onOpenConfig}
        aria-label="Travel preferences"
        className="flex h-8 w-8 cursor-pointer items-center justify-center gap-[7px] rounded-[8px] border border-glass-bd bg-chip text-ink transition hover:brightness-110 sm:h-[34px] sm:w-auto sm:justify-start sm:rounded-[9px] sm:px-3"
      >
        <SlidersIcon size={14} />
        <span className="hidden text-[12px] font-medium sm:inline">Preferences</span>
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Left icon rail (desktop)                                            */
/* ------------------------------------------------------------------ */
export function IconRail({
  activePanel,
  onSelect,
}: {
  activePanel: PanelKey | null
  onSelect: (key: PanelKey) => void
}) {
  return (
    <div className="glass fixed left-4 top-20 z-[38] flex flex-col gap-1 rounded-[13px] p-1.5">
      {RAIL_ITEMS.map((item) => {
        const active = activePanel === item.key
        const Icon = item.icon
        return (
          <button
            key={item.key}
            type="button"
            title={item.label}
            aria-label={item.label}
            aria-pressed={active}
            onClick={() => onSelect(item.key)}
            className={cx(
              'flex h-11 w-11 cursor-pointer items-center justify-center rounded-[10px] border-none transition',
              active ? 'bg-accent text-on-accent' : 'bg-transparent text-dim hover:text-ink',
            )}
          >
            <Icon size={17} />
          </button>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Mobile bottom tab bar (glass)                                       */
/* ------------------------------------------------------------------ */
export type MobileTab = 'trip' | 'days' | 'coverage' | 'copilot' | null

const MOBILE_TABS: Array<{
  key: Exclude<MobileTab, null>
  label: string
  icon: typeof GridIcon
}> = [
  { key: 'trip', label: 'Trip', icon: GridIcon },
  { key: 'days', label: 'Days', icon: CalendarIcon },
  { key: 'coverage', label: 'States', icon: MapPinIcon },
  { key: 'copilot', label: 'Copilot', icon: SparkleIcon },
]

export function MobileTabBar({
  active,
  onSelect,
}: {
  active: MobileTab
  onSelect: (tab: MobileTab) => void
}) {
  const tab = (key: Exclude<MobileTab, null> | null, label: string, icon: ReactNode) => {
    const isActive = active === key
    return (
      <button
        key={label}
        type="button"
        onClick={() => onSelect(key)}
        aria-pressed={isActive}
        className={cx(
          'flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-[10px] py-1.5 transition',
          isActive ? 'text-accent' : 'text-faint hover:text-ink',
        )}
      >
        {icon}
        <span className="text-[10px] font-medium">{label}</span>
      </button>
    )
  }

  return (
    <nav className="glass pb-safe fixed inset-x-2 bottom-2 z-40 grid grid-cols-5 rounded-[15px] px-1 py-1 sm:inset-x-3 sm:bottom-3 sm:px-1.5">
      {tab(null, 'Map', <CompassIcon size={19} />)}
      {MOBILE_TABS.map((t) => {
        const Icon = t.icon
        return tab(t.key, t.label, <Icon size={19} />)
      })}
    </nav>
  )
}
