import { useId, type ReactNode } from 'react'
import type {
  PlannerConfig,
  PlannerMode,
  TripPace,
} from '../domain/types'
import { TRIP_PACE_DESCRIPTIONS, TRIP_PACE_LABELS } from '../domain/stays'
import {
  PLACE_CATEGORY_OPTIONS,
  type PlaceCategory,
} from '../domain/placeCatalog'
import { Overlay } from '../ui/Overlay'
import { Button, SegmentedControl, cx } from '../ui/primitives'
import { CloseIcon } from '../ui/icons'

export interface ConfigModalProps {
  config: PlannerConfig
  open: boolean
  isOptimizing: boolean
  /** When a routing engine is live, drive times come from real durations, so the
   *  averageMph slider is bypassed and hidden in favor of a read-only note. */
  roadRoutingEnabled: boolean
  onClose: () => void
  onChange: (config: PlannerConfig) => void
  onApply: () => void
}

/** Numeric config keys that drive a slider. */
type SliderKey = {
  [K in keyof PlannerConfig]: PlannerConfig[K] extends number ? K : never
}[keyof PlannerConfig]

/** Boolean config keys that drive a toggle. */
type ToggleKey = {
  [K in keyof PlannerConfig]: PlannerConfig[K] extends boolean ? K : never
}[keyof PlannerConfig]

interface SliderSpec {
  key: SliderKey
  label: string
  hint: string
  min: number
  max: number
  step: number
  unit?: string
}

interface ToggleSpec {
  key: ToggleKey
  label: string
  hint: string
}

const PLANNER_MODE_OPTIONS: Array<{ value: PlannerMode; label: string }> = [
  { value: 'most_unique_sites', label: 'Most Unique Sites' },
  { value: 'longest_trip', label: 'Longest Trip' },
]

const TRIP_PACE_OPTIONS: Array<{ value: TripPace; label: string }> = (
  ['sprint', 'balanced', 'savor'] as const
).map((value) => ({ value, label: TRIP_PACE_LABELS[value] }))

const AUTO_STAYS_TOGGLE: ToggleSpec = {
  key: 'autoStays',
  label: 'Rating-based stays',
  hint: 'Top-rated places earn extra basecamp nights, each on a new unique Supercharger.',
}

type CategoryPreferenceState = 'neutral' | 'favorite' | 'muted'

function CategoryPreferencesSection({
  config,
  onChange,
}: {
  config: PlannerConfig
  onChange: (config: PlannerConfig) => void
}) {
  const stateFor = (value: PlaceCategory): CategoryPreferenceState =>
    config.favoriteCategories.includes(value)
      ? 'favorite'
      : config.mutedCategories.includes(value)
        ? 'muted'
        : 'neutral'

  const cycle = (value: PlaceCategory) => {
    const state = stateFor(value)
    const favoriteCategories = config.favoriteCategories.filter(
      (category) => category !== value,
    )
    const mutedCategories = config.mutedCategories.filter(
      (category) => category !== value,
    )
    if (state === 'neutral') favoriteCategories.push(value)
    else if (state === 'favorite') mutedCategories.push(value)
    onChange({ ...config, favoriteCategories, mutedCategories })
  }

  return (
    <div className="flex flex-col gap-[9px]">
      <SectionLabel>Place preferences</SectionLabel>
      <div className="text-[11px] leading-[1.5] text-faint">
        Tap to cycle: neutral → ★ favorite (rated higher for stays and stops) →
        ✕ muted (rated lower).
      </div>
      <div className="flex flex-wrap gap-1.5">
        {PLACE_CATEGORY_OPTIONS.map(({ value, label }) => {
          const state = stateFor(value)
          return (
            <button
              key={value}
              type="button"
              onClick={() => cycle(value)}
              aria-label={`${label} preference: ${state}`}
              className={cx(
                'cursor-pointer rounded-full border px-3 py-1.5 text-[11.5px] font-medium transition',
                state === 'favorite'
                  ? 'border-accent2 text-accent2'
                  : state === 'muted'
                    ? 'border-edge text-faint line-through'
                    : 'border-edge bg-chip text-dim hover:text-ink',
              )}
              style={
                state === 'favorite'
                  ? {
                      background:
                        'color-mix(in srgb, var(--accent-2) 10%, transparent)',
                    }
                  : undefined
              }
            >
              {state === 'favorite' ? '★ ' : state === 'muted' ? '✕ ' : ''}
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

const LONGEST_TRIP_DEFAULTS: SliderSpec[] = [
  {
    key: 'longestTripDays',
    label: 'Default streak length',
    hint: 'Used for generated routes. Saved custom routes keep their own trip length.',
    min: 1,
    max: 365,
    step: 1,
    unit: 'days',
  },
]

const VEHICLE_MODEL: SliderSpec[] = [
  {
    key: 'practicalRangeMiles',
    label: 'Practical range',
    hint: 'Conservative real-world range used to plan charging legs.',
    min: 80,
    max: 350,
    step: 5,
    unit: 'mi',
  },
  {
    key: 'averageMph',
    label: 'Average speed',
    hint: 'Used to estimate leg drive time.',
    min: 25,
    max: 85,
    step: 1,
    unit: 'mph',
  },
]

const UNIQUE_SITE_DEFAULTS: SliderSpec[] = [
  {
    key: 'targetStations',
    label: 'Default site target',
    hint: 'Used for generated Most Unique Sites candidates.',
    min: 25,
    max: 5000,
    step: 25,
  },
  {
    key: 'tripWeeks',
    label: 'Default trip length',
    hint: 'Used for generated routes, not saved custom routes.',
    min: 1,
    max: 52,
    step: 0.5,
    unit: 'wks',
  },
]

const DRIVING_DAY: SliderSpec[] = [
  {
    key: 'dailyDriveTargetHours',
    label: 'Daily drive target',
    hint: 'Comfortable hours behind the wheel per day.',
    min: 1,
    max: 14,
    step: 0.25,
    unit: 'h',
  },
  {
    key: 'dailyDriveMaxHours',
    label: 'Maximum drive time',
    hint: 'Hard cap for a normal driving day before the route is split.',
    min: 1,
    max: 16,
    step: 0.25,
    unit: 'h',
  },
]

const LONG_DAY_LIMITS: SliderSpec[] = [
  {
    key: 'longDayMaxHours',
    label: 'Long-day cap',
    hint: 'Ceiling for opt-in long days.',
    min: 2,
    max: 14,
    step: 0.25,
    unit: 'h',
  },
  {
    key: 'longDayMinSitesPerExtraHour',
    label: 'Long-day min return',
    hint: 'Extra sites per added hour to justify a long day.',
    min: 0.1,
    max: 30,
    step: 0.1,
    unit: 'sites/h',
  },
]

const STOP_MODEL: SliderSpec[] = [
  {
    key: 'closeStationRadiusMiles',
    label: 'Cluster radius',
    hint: 'Hops within this radius use quick stops.',
    min: 0.5,
    max: 25,
    step: 0.5,
    unit: 'mi',
  },
  {
    key: 'closeStationStopMinutes',
    label: 'Close-site stop',
    hint: 'Assumed minutes at clustered sites.',
    min: 1,
    max: 60,
    step: 1,
    unit: 'min',
  },
  {
    key: 'distanceChargeStopMinutes',
    label: 'Charge stop time',
    hint: 'Assumed minutes per distance-charge stop.',
    min: 2,
    max: 90,
    step: 1,
    unit: 'min',
  },
  {
    key: 'roadDistanceFactor',
    label: 'Road distance factor',
    hint: 'Straight-line to road-mile multiplier.',
    min: 1,
    max: 1.8,
    step: 0.01,
    unit: 'x',
  },
]

const COVERAGE_OPTIONS: ToggleSpec[] = [
  {
    key: 'includeCanada',
    label: 'Include Canada',
    hint: 'Add Canadian Supercharger sites.',
  },
  {
    key: 'includeMexico',
    label: 'Include Mexico',
    hint: 'Add Mexican Supercharger sites.',
  },
  {
    key: 'showAllStations',
    label: 'Show all sites on map',
    hint: 'Plot the full filtered station universe.',
  },
]

const LONG_DAY_TOGGLE: ToggleSpec = {
  key: 'longDayOptimization',
  label: 'Allow occasional long days',
  hint: 'Exceed the normal-day maximum only when the route gains enough sites.',
}

/** Format a numeric value compactly for the mono readout. */
function formatValue(value: number, step: number): string {
  if (Number.isInteger(value)) return value.toLocaleString('en-US')
  const decimals = step < 0.1 ? 2 : 1
  return value.toFixed(decimals)
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-faint">
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Slider row                                                          */
/* ------------------------------------------------------------------ */
function SliderRow({
  spec,
  value,
  onChange,
}: {
  spec: SliderSpec
  value: number
  onChange: (next: number) => void
}) {
  const inputId = useId()
  return (
    <div>
      <div className="mb-[7px] flex items-baseline justify-between gap-3">
        <label htmlFor={inputId} className="min-w-0 cursor-pointer text-[12.5px] font-medium text-ink">
          {spec.label}
        </label>
        <span className="flex-none whitespace-nowrap font-mono text-[12px] text-accent2">
          {formatValue(value, spec.step)}
          {spec.unit ? ` ${spec.unit}` : ''}
        </span>
      </div>
      <div className="flex min-h-8 items-center">
        <input
          id={inputId}
          type="range"
          min={spec.min}
          max={spec.max}
          step={spec.step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={spec.label}
          className="w-full cursor-pointer"
          style={{ accentColor: 'var(--accent)' }}
        />
      </div>
      <div className="mt-1 text-[11px] leading-[1.4] text-faint">{spec.hint}</div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Toggle row                                                          */
/* ------------------------------------------------------------------ */
function ToggleRow({
  spec,
  checked,
  onChange,
}: {
  spec: ToggleSpec
  checked: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={spec.label}
      onClick={() => onChange(!checked)}
      className="flex cursor-pointer items-center justify-between gap-3 rounded-[11px] border border-edge bg-panel2 px-[13px] py-3 text-left transition hover:brightness-95"
    >
      <span className="min-w-0">
        <span className="block text-[12.5px] font-medium text-ink">{spec.label}</span>
        <span className="mt-0.5 block text-[11px] text-faint">{spec.hint}</span>
      </span>
      <span
        className="relative h-[23px] w-10 flex-none rounded-xl transition-colors"
        style={{ background: checked ? 'var(--accent)' : 'var(--border-2)' }}
        aria-hidden
      >
        <span
          className="absolute top-[2px] h-[19px] w-[19px] rounded-full bg-white transition-all"
          style={{ left: checked ? 19 : 2 }}
        />
      </span>
    </button>
  )
}

/* ------------------------------------------------------------------ */
/* Read-only info row (e.g. averageMph bypassed by a live engine)      */
/* ------------------------------------------------------------------ */
function InfoRow({ label, hint, badge }: { label: string; hint: string; badge: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[11px] border border-edge bg-panel2 px-[13px] py-3">
      <div className="min-w-0">
        <div className="text-[12.5px] font-medium text-ink">{label}</div>
        <div className="mt-0.5 text-[11px] text-faint">{hint}</div>
      </div>
      <span className="flex-none whitespace-nowrap rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-accent">
        {badge}
      </span>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Config slide-over                                                   */
/* ------------------------------------------------------------------ */
export function ConfigModal({
  config,
  open,
  isOptimizing,
  roadRoutingEnabled,
  onClose,
  onChange,
  onApply,
}: ConfigModalProps) {
  const titleId = useId()

  const setNumber = (key: SliderKey, value: number) => onChange({ ...config, [key]: value })
  const setBool = (key: ToggleKey, value: boolean) => onChange({ ...config, [key]: value })
  const setMode = (plannerMode: PlannerMode) => onChange({ ...config, plannerMode })
  const routeDefaultSpecs =
    config.plannerMode === 'longest_trip'
      ? LONGEST_TRIP_DEFAULTS
      : UNIQUE_SITE_DEFAULTS

  const renderSliders = (specs: SliderSpec[]) =>
    specs.map((spec) =>
      spec.key === 'averageMph' && roadRoutingEnabled ? (
        <InfoRow
          key={spec.key}
          label="Average speed"
          hint="Bypassed — drive times use real road speed limits"
          badge="Live road times"
        />
      ) : (
        <SliderRow
          key={spec.key}
          spec={spec}
          value={config[spec.key]}
          onChange={(next) => setNumber(spec.key, next)}
        />
      ),
    )

  return (
    <Overlay open={open} onClose={onClose} variant="slideover" labelledBy={titleId}>
      {/* Header */}
      <div className="flex flex-none items-start justify-between gap-4 border-b border-edge px-[18px] py-4">
        <div className="min-w-0">
          <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-faint">
            Travel preferences
          </div>
          <div id={titleId} className="mt-[3px] text-[16px] font-semibold text-ink">
            Set defaults for every route
          </div>
          <div className="mt-1.5 text-[11px] leading-[1.45] text-faint">
            Vehicle, comfort, and charging assumptions live here. Custom route
            length and must-see stops are set in the route builder.
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex h-[30px] w-[30px] flex-none cursor-pointer items-center justify-center rounded-lg border border-edge bg-transparent text-dim transition hover:text-ink"
        >
          <CloseIcon size={14} />
        </button>
      </div>

      {/* Body */}
      <div className="flex min-h-0 flex-1 flex-col gap-[18px] overflow-y-auto p-[18px]">
        <div className="flex flex-col gap-4">
          <SectionLabel>Vehicle & range</SectionLabel>
          <div className="flex items-center justify-between gap-3 rounded-[11px] border border-edge bg-panel2 px-[13px] py-3">
            <div className="min-w-0">
              <div className="text-[12.5px] font-medium text-ink">Vehicle profile</div>
              <div className="mt-0.5 text-[11px] text-faint">
                Charge Quest is calibrated for the owner’s car.
              </div>
            </div>
            <span className="flex-none whitespace-nowrap rounded-[9px] border border-edge bg-chip px-3 py-1.5 font-mono text-[12px] text-ink">
              Tesla Model Y LR
            </span>
          </div>
          {renderSliders(VEHICLE_MODEL)}
        </div>

        <div className="flex flex-col gap-4">
          <SectionLabel>Driving preferences</SectionLabel>
          <div className="flex flex-col gap-[9px]">
            <SegmentedControl<TripPace>
              options={TRIP_PACE_OPTIONS}
              value={config.tripPace}
              onChange={(tripPace) => onChange({ ...config, tripPace })}
              ariaLabel="Default trip pace"
            />
            <div className="text-[11px] leading-[1.5] text-faint">
              {TRIP_PACE_DESCRIPTIONS[config.tripPace]}
            </div>
          </div>
          {renderSliders(DRIVING_DAY)}
          {config.plannerMode === 'longest_trip' ? (
            <ToggleRow
              spec={AUTO_STAYS_TOGGLE}
              checked={config.autoStays}
              onChange={(next) => setBool('autoStays', next)}
            />
          ) : null}
        </div>

        <div className="flex flex-col gap-[9px]">
          <SectionLabel>Generated route defaults</SectionLabel>
          <div className="text-[11px] leading-[1.5] text-faint">
            These controls shape the built-in route candidates. A saved custom
            route keeps its own duration and must-see stops.
          </div>
          <SegmentedControl<PlannerMode>
            options={PLANNER_MODE_OPTIONS}
            value={config.plannerMode}
            onChange={setMode}
            ariaLabel="Generated route goal"
          />
          <div className="mt-1 flex flex-col gap-4">
            {renderSliders(routeDefaultSpecs)}
          </div>
        </div>

        <CategoryPreferencesSection config={config} onChange={onChange} />

        <div className="flex flex-col gap-2.5">
          <SectionLabel>Route coverage</SectionLabel>
          {COVERAGE_OPTIONS.map((spec) => (
            <ToggleRow
              key={spec.key}
              spec={spec}
              checked={config[spec.key]}
              onChange={(next) => setBool(spec.key, next)}
            />
          ))}
        </div>

        <details className="group rounded-[11px] border border-edge bg-panel2">
          <summary className="cursor-pointer list-none px-[13px] py-3 text-[12.5px] font-medium text-ink">
            Advanced planning assumptions
            <span className="float-right font-mono text-[10px] text-faint group-open:hidden">
              Show
            </span>
            <span className="float-right hidden font-mono text-[10px] text-faint group-open:inline">
              Hide
            </span>
          </summary>
          <div className="flex flex-col gap-4 border-t border-edge px-[13px] py-4">
            <ToggleRow
              spec={LONG_DAY_TOGGLE}
              checked={config.longDayOptimization}
              onChange={(next) => setBool('longDayOptimization', next)}
            />
            {config.longDayOptimization ? renderSliders(LONG_DAY_LIMITS) : null}
            <SectionLabel>Charging & stop model</SectionLabel>
            {renderSliders(STOP_MODEL)}
          </div>
        </details>
      </div>

      {/* Footer */}
      <div className="flex flex-none items-center gap-2.5 border-t border-edge px-[18px] py-3.5">
        <div className="min-w-0 flex-1 font-mono text-[10.5px] leading-[1.4] text-faint">
          Applies to generated and custom routes · Start: Chattanooga, TN
        </div>
        <Button variant="primary" size="lg" onClick={onApply} disabled={isOptimizing}>
          {isOptimizing ? 'Reoptimizing…' : 'Save & reoptimize'}
        </Button>
      </div>
    </Overlay>
  )
}
