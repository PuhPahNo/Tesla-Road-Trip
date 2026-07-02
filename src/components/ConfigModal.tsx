import { useEffect, useId, useMemo, useState, type ReactNode } from 'react'
import type {
  LongestTripVisitTarget,
  PlannerConfig,
  PlannerMode,
} from '../domain/types'
import {
  LONGEST_TRIP_DESTINATIONS,
  LONGEST_TRIP_STATE_TARGETS,
  type LongestTripDestination,
  type LongestTripStateTarget,
} from '../domain/visitTargets'
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

const LONGEST_TRIP_TARGETS: SliderSpec[] = [
  {
    key: 'longestTripDays',
    label: 'Target streak days',
    hint: 'Consecutive unique-Supercharger days to chase.',
    min: 1,
    max: 365,
    step: 1,
    unit: 'days',
  },
  {
    key: 'practicalRangeMiles',
    label: 'Practical range',
    hint: 'Below this, legs avoid range warnings.',
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

const UNIQUE_SITE_TARGETS: SliderSpec[] = [
  {
    key: 'targetStations',
    label: 'Target unique sites',
    hint: 'How many unique Superchargers to bag.',
    min: 25,
    max: 5000,
    step: 25,
  },
  {
    key: 'tripWeeks',
    label: 'Trip length',
    hint: 'Total weeks on the road.',
    min: 1,
    max: 52,
    step: 0.5,
    unit: 'wks',
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
  {
    key: 'practicalRangeMiles',
    label: 'Practical range',
    hint: 'Below this, legs avoid range warnings.',
    min: 80,
    max: 350,
    step: 5,
    unit: 'mi',
  },
]

const DAILY_LIMITS: SliderSpec[] = [
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
    label: 'Daily drive max',
    hint: 'Hard cap before a day is split.',
    min: 1,
    max: 16,
    step: 0.25,
    unit: 'h',
  },
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

const OPTIONS: ToggleSpec[] = [
  {
    key: 'longDayOptimization',
    label: 'Long-day optimization',
    hint: 'Allow 8–9h days when they add enough sites.',
  },
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
/* Must-visit targets (Longest Trip)                                   */
/* ------------------------------------------------------------------ */
function destinationTarget(
  destination: LongestTripDestination,
): LongestTripVisitTarget {
  return {
    id: destination.id,
    type: destination.type,
    label: destination.label,
    state: destination.state,
    position: destination.position,
    radiusMiles: destination.radiusMiles,
    stayDays: 1,
  }
}

function stateTarget(target: LongestTripStateTarget): LongestTripVisitTarget {
  return {
    id: target.id,
    type: 'state',
    label: target.label,
    state: target.state,
    position: target.position,
    stayDays: 1,
  }
}

function TargetSelect({
  label,
  value,
  options,
  disabled,
  onChange,
  onAdd,
}: {
  label: string
  value: string
  options: Array<{ value: string; label: string }>
  disabled: boolean
  onChange: (value: string) => void
  onAdd: () => void
}) {
  const selectId = useId()
  return (
    <div className="min-w-0">
      <label htmlFor={selectId} className="mb-1.5 block text-[11.5px] font-medium text-dim">
        {label}
      </label>
      <div className="flex min-w-0 gap-2">
        <select
          id={selectId}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-10 min-w-0 flex-1 rounded-[9px] border border-edge bg-panel2 px-2.5 text-[12.5px] text-ink disabled:opacity-60"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Button variant="secondary" className="min-h-10 flex-none" onClick={onAdd} disabled={disabled}>
          Add
        </Button>
      </div>
    </div>
  )
}

function TargetStayRow({
  target,
  onStayDaysChange,
  onRemove,
}: {
  target: LongestTripVisitTarget
  onStayDaysChange: (stayDays: number) => void
  onRemove: () => void
}) {
  const inputId = useId()
  const targetType =
    target.type === 'state'
      ? target.state ?? 'State'
      : target.type === 'city'
        ? 'City'
        : 'Landmark'

  return (
    <div className="flex items-center gap-2.5 rounded-[11px] border border-edge bg-panel2 px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <div className="truncate text-[12.5px] font-medium text-ink">{target.label}</div>
        <div className="mt-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-faint">
          {targetType}
        </div>
      </div>
      <label htmlFor={inputId} className="sr-only">
        Days in {target.label}
      </label>
      <input
        id={inputId}
        type="number"
        min={1}
        max={21}
        step={1}
        value={target.stayDays}
        onChange={(event) => onStayDaysChange(Number(event.target.value))}
        className="h-9 w-16 rounded-[9px] border border-edge bg-chip px-1 text-center font-mono text-[12.5px] text-ink"
      />
      <span className="flex-none text-[11px] text-faint">days</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${target.label}`}
        className="flex h-7 w-7 flex-none cursor-pointer items-center justify-center rounded-lg border border-edge bg-transparent text-dim transition hover:text-ink"
      >
        <CloseIcon size={12} />
      </button>
    </div>
  )
}

function LongestTripTargetsSection({
  config,
  onChange,
}: {
  config: PlannerConfig
  onChange: (config: PlannerConfig) => void
}) {
  const selectedIds = useMemo(
    () => new Set(config.longestTripTargets.map((target) => target.id)),
    [config.longestTripTargets],
  )
  const availableStates = useMemo(
    () => LONGEST_TRIP_STATE_TARGETS.filter((target) => !selectedIds.has(target.id)),
    [selectedIds],
  )
  const availableDestinations = useMemo(
    () => LONGEST_TRIP_DESTINATIONS.filter((target) => !selectedIds.has(target.id)),
    [selectedIds],
  )
  const [selectedStateId, setSelectedStateId] = useState(availableStates[0]?.id ?? '')
  const [selectedDestinationId, setSelectedDestinationId] = useState(
    availableDestinations[0]?.id ?? '',
  )
  useEffect(() => {
    if (availableStates.some((target) => target.id === selectedStateId)) return
    setSelectedStateId(availableStates[0]?.id ?? '')
  }, [availableStates, selectedStateId])
  useEffect(() => {
    if (availableDestinations.some((target) => target.id === selectedDestinationId)) return
    setSelectedDestinationId(availableDestinations[0]?.id ?? '')
  }, [availableDestinations, selectedDestinationId])

  const targetDays = config.longestTripTargets.reduce(
    (sum, target) => sum + target.stayDays,
    0,
  )
  const exceedsTarget = targetDays > config.longestTripDays

  const setTargets = (longestTripTargets: LongestTripVisitTarget[]) =>
    onChange({ ...config, longestTripTargets })

  const addTarget = (target: LongestTripVisitTarget) => {
    if (selectedIds.has(target.id)) return
    setTargets([...config.longestTripTargets, target])
  }

  const updateStayDays = (id: string, stayDays: number) => {
    setTargets(
      config.longestTripTargets.map((target) =>
        target.id === id
          ? { ...target, stayDays: Math.max(1, Math.min(21, Math.round(stayDays))) }
          : target,
      ),
    )
  }

  const removeTarget = (id: string) => {
    setTargets(config.longestTripTargets.filter((target) => target.id !== id))
  }

  const addSelectedState = () => {
    const target =
      LONGEST_TRIP_STATE_TARGETS.find((item) => item.id === selectedStateId) ??
      availableStates[0]
    if (!target) return
    addTarget(stateTarget(target))
    const nextAvailable = availableStates.find((item) => item.id !== target.id)
    setSelectedStateId(nextAvailable?.id ?? '')
  }

  const addSelectedDestination = () => {
    const target =
      LONGEST_TRIP_DESTINATIONS.find((item) => item.id === selectedDestinationId) ??
      availableDestinations[0]
    if (!target) return
    addTarget(destinationTarget(target))
    const nextAvailable = availableDestinations.find((item) => item.id !== target.id)
    setSelectedDestinationId(nextAvailable?.id ?? '')
  }

  return (
    <div className="flex flex-col gap-3">
      <SectionLabel>Must-visit targets</SectionLabel>
      <TargetSelect
        label="State"
        value={selectedStateId}
        options={availableStates.map((target) => ({ value: target.id, label: target.label }))}
        onChange={setSelectedStateId}
        onAdd={addSelectedState}
        disabled={availableStates.length === 0}
      />
      <TargetSelect
        label="City or landmark"
        value={selectedDestinationId}
        options={availableDestinations.map((target) => ({
          value: target.id,
          label: target.label,
        }))}
        onChange={setSelectedDestinationId}
        onAdd={addSelectedDestination}
        disabled={availableDestinations.length === 0}
      />
      <div
        className={cx(
          'rounded-[9px] border px-3 py-2 text-[11.5px]',
          exceedsTarget
            ? 'border-warn-bd bg-warn-bg text-warn'
            : 'border-edge bg-panel2 text-faint',
        )}
      >
        {targetDays.toLocaleString()} of {config.longestTripDays.toLocaleString()} streak
        days reserved for selected targets.
      </div>
      {config.longestTripTargets.map((target) => (
        <TargetStayRow
          key={target.id}
          target={target}
          onStayDaysChange={(stayDays) => updateStayDays(target.id, stayDays)}
          onRemove={() => removeTarget(target.id)}
        />
      ))}
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
  const tripTargetSpecs =
    config.plannerMode === 'longest_trip' ? LONGEST_TRIP_TARGETS : UNIQUE_SITE_TARGETS

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
      <div className="flex flex-none items-center justify-between gap-4 border-b border-edge px-[18px] py-4">
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-faint">
            Planner config
          </div>
          <div id={titleId} className="mt-[3px] text-[16px] font-semibold text-ink">
            Tune the optimizer
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
        <div className="flex flex-col gap-[9px]">
          <SectionLabel>Planner mode</SectionLabel>
          <SegmentedControl<PlannerMode>
            options={PLANNER_MODE_OPTIONS}
            value={config.plannerMode}
            onChange={setMode}
            ariaLabel="Planner mode"
          />
        </div>

        <div className="flex items-center justify-between gap-3 rounded-[11px] border border-edge bg-panel2 px-[13px] py-3">
          <div className="min-w-0">
            <div className="text-[12.5px] font-medium text-ink">Vehicle</div>
            <div className="mt-0.5 text-[11px] text-faint">Range model used for legs</div>
          </div>
          <span className="flex-none whitespace-nowrap rounded-[9px] border border-edge bg-chip px-3 py-1.5 font-mono text-[12px] text-ink">
            Tesla Model Y LR
          </span>
        </div>

        <div className="flex flex-col gap-4">
          <SectionLabel>Trip targets</SectionLabel>
          {renderSliders(tripTargetSpecs)}
        </div>

        {config.plannerMode === 'longest_trip' ? (
          <LongestTripTargetsSection config={config} onChange={onChange} />
        ) : null}

        <div className="flex flex-col gap-4">
          <SectionLabel>Daily limits</SectionLabel>
          {renderSliders(DAILY_LIMITS)}
        </div>

        <div className="flex flex-col gap-4">
          <SectionLabel>Stop model</SectionLabel>
          {renderSliders(STOP_MODEL)}
        </div>

        <div className="flex flex-col gap-2.5">
          <SectionLabel>Options</SectionLabel>
          {OPTIONS.map((spec) => (
            <ToggleRow
              key={spec.key}
              spec={spec}
              checked={config[spec.key]}
              onChange={(next) => setBool(spec.key, next)}
            />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-none items-center gap-2.5 border-t border-edge px-[18px] py-3.5">
        <div className="min-w-0 flex-1 font-mono text-[10.5px] leading-[1.4] text-faint">
          Start · Chattanooga, TN 37405
        </div>
        <Button variant="primary" size="lg" onClick={onApply} disabled={isOptimizing}>
          {isOptimizing ? 'Optimizing…' : 'Optimize route'}
        </Button>
      </div>
    </Overlay>
  )
}
