import { useTheme, type ThemeName } from '../theme/theme'
import {
  Button,
  Eyebrow,
  IconButton,
  SegmentedControl,
} from '../ui/primitives'
import {
  BoltIcon,
  ChevronDownIcon,
  MoonIcon,
  OptimizeIcon,
  SlidersIcon,
  SunIcon,
} from '../ui/icons'

export interface TopBarProps {
  selectedRouteName: string
  onOpenRoutePicker: () => void
  onOpenConfig: () => void
  onOptimize: () => void
  isOptimizing: boolean
}

const THEME_OPTIONS: { value: ThemeName; label: string }[] = [
  { value: 'tesla', label: 'Tesla' },
  { value: 'dash', label: 'Dashboard' },
]

export function TopBar({
  selectedRouteName,
  onOpenRoutePicker,
  onOpenConfig,
  onOptimize,
  isOptimizing,
}: TopBarProps) {
  const { theme, isDark, setTheme, toggleTheme } = useTheme()

  return (
    <header className="flex h-[62px] flex-none items-center gap-2.5 border-b border-edge bg-panel px-3.5 md:gap-[18px] md:px-[18px]">
      {/* Brand cluster */}
      <div className="flex min-w-0 items-center gap-2.5 md:gap-3">
        <div className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-[9px] bg-accent text-on-accent shadow-[inset_0_0_0_1px_var(--border)]">
          <BoltIcon size={15} />
        </div>
        <div className="min-w-0">
          <Eyebrow className="hidden md:block">2026 Americas Competition</Eyebrow>
          <h1 className="truncate text-[14px] font-semibold leading-tight tracking-[-0.01em] text-ink md:text-[16px]">
            Supercharger Quest Planner
          </h1>
        </div>
      </div>

      <div className="flex-1" />

      {/* Route selector — desktop only (mobile lives in Routes tab) */}
      <button
        type="button"
        onClick={onOpenRoutePicker}
        className="hidden h-[34px] min-w-0 max-w-[260px] items-center gap-[9px] rounded-[9px] border border-edge bg-panel2 px-[13px] text-[13px] text-ink transition hover:brightness-95 cursor-pointer md:flex"
      >
        <span className="h-[7px] w-[7px] flex-none rounded-full bg-accent" />
        <span className="truncate font-medium">{selectedRouteName}</span>
        <ChevronDownIcon size={11} className="flex-none opacity-50" />
      </button>

      {/* Theme: segmented on desktop, icon toggle on mobile */}
      <div className="hidden md:flex">
        <SegmentedControl<ThemeName>
          options={THEME_OPTIONS}
          value={theme}
          onChange={setTheme}
          tone="accent"
          ariaLabel="Theme"
        />
      </div>
      <IconButton
        label={isDark ? 'Switch to Tesla light theme' : 'Switch to Dashboard dark theme'}
        size={44}
        className="flex-none md:hidden"
        onClick={toggleTheme}
      >
        {isDark ? <SunIcon size={16} /> : <MoonIcon size={16} />}
      </IconButton>

      {/* Configure — icon-only on mobile, labelled at md */}
      <IconButton
        label="Configure"
        size={44}
        className="flex-none md:hidden"
        onClick={onOpenConfig}
      >
        <SlidersIcon size={15} />
      </IconButton>
      <div className="hidden md:flex">
        <Button variant="secondary" onClick={onOpenConfig}>
          <SlidersIcon size={15} />
          Configure
        </Button>
      </div>

      {/* Optimize — icon-only on mobile, labelled at md */}
      <IconButton
        label={isOptimizing ? 'Optimizing route' : 'Optimize route'}
        size={44}
        disabled={isOptimizing}
        className="flex-none border-transparent bg-accent text-on-accent shadow-[0_1px_2px_rgba(0,0,0,0.18)] hover:brightness-95 md:hidden"
        onClick={onOptimize}
      >
        <OptimizeIcon size={15} className={isOptimizing ? 'anim-spin' : undefined} />
      </IconButton>
      <div className="hidden md:flex">
        <Button
          variant="primary"
          disabled={isOptimizing}
          onClick={onOptimize}
        >
          <OptimizeIcon size={15} className={isOptimizing ? 'anim-spin' : undefined} />
          {isOptimizing ? 'Optimizing...' : 'Optimize'}
        </Button>
      </div>
    </header>
  )
}
