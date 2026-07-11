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
  contestLabel,
  onOpenRoutePicker,
}: {
  routeName: string
  routeColor?: string
  contestLabel: string
  onOpenRoutePicker: () => void
}) {
  return (
    // Below sm the island yields to the actions island (~148px + gap) so the
    // two never overlap; the route chip shrinks and truncates instead.
    <div className="glass fixed left-4 top-4 z-40 flex h-12 max-w-[calc(100vw-172px)] items-center gap-2.5 rounded-[13px] py-0 pl-3 pr-1.5 sm:max-w-none">
      <a href="/" aria-label="Return to Charge Quest home" className="flex flex-none">
        <img
          src="/brand-mark.svg?v=2"
          alt=""
          aria-hidden="true"
          className="h-[30px] w-[30px] rounded-[9px]"
        />
      </a>
      <div className="hidden flex-none pr-1 leading-[1.05] sm:block">
        <div className="whitespace-nowrap font-mono text-[8.5px] uppercase tracking-[0.14em] text-faint">
          {contestLabel}
        </div>
        <div className="whitespace-nowrap text-[13px] font-semibold tracking-[-0.01em] text-ink">
          Charge Quest
        </div>
      </div>
      <button
        type="button"
        onClick={onOpenRoutePicker}
        aria-label="Choose route"
        className="flex h-[34px] min-w-0 cursor-pointer items-center gap-2 rounded-[9px] border border-glass-bd bg-chip px-[11px] text-ink transition hover:brightness-110 sm:max-w-[210px]"
      >
        <span
          className="h-2 w-2 flex-none rounded-full"
          style={{ background: routeColor ?? 'var(--accent)' }}
        />
        <span className="min-w-0 truncate text-[12.5px] font-medium">{routeName}</span>
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
    <div className="glass fixed right-4 top-4 z-40 flex h-12 items-center gap-1.5 rounded-[13px] px-[7px]">
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
        className="flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-[9px] border border-transparent bg-transparent text-dim transition hover:text-ink disabled:opacity-60"
      >
        <RefreshIcon size={15} className={isRefreshing ? 'anim-spin' : ''} />
      </button>
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
        title="Toggle theme"
        className="flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-[9px] border border-transparent bg-transparent text-dim transition hover:text-ink"
      >
        {isDark ? <SunIcon size={16} /> : <MoonIcon size={16} />}
      </button>
      <button
        type="button"
        onClick={onOpenConfig}
        aria-label="Travel preferences"
        className="flex h-[34px] cursor-pointer items-center gap-[7px] rounded-[9px] border border-glass-bd bg-chip px-3 text-ink transition hover:brightness-110"
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
    <nav className="glass pb-safe fixed inset-x-3 bottom-3 z-40 grid grid-cols-5 rounded-[15px] px-1.5 py-1">
      {tab(null, 'Map', <CompassIcon size={19} />)}
      {MOBILE_TABS.map((t) => {
        const Icon = t.icon
        return tab(t.key, t.label, <Icon size={19} />)
      })}
    </nav>
  )
}
