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
import { Overlay, OverlayHeader } from '../ui/Overlay'
import { Button, SegmentedControl, cx } from '../ui/primitives'

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
  { value: 'longest_trip', label: 'Longest Trip' },
  { value: 'most_unique_sites', label: 'Most Unique Sites' },
]

const LONGEST_TRIP_TARGETS: SliderSpec[] = [
  {
    key: 'longestTripDays',
    label: 'Streak days',
    hint: 'Unique Supercharger days',
    min: 1,
    max: 365,
    step: 1,
    unit: 'days',
  },
  {
    key: 'practicalRangeMiles',
    label: 'Practical range',
    hint: 'Practical range',
    min: 80,
    max: 350,
    step: 5,
    unit: 'mi',
  },
  {
    key: 'averageMph',
    label: 'Average speed',
    hint: 'Average moving speed',
    min: 25,
    max: 85,
    step: 1,
    unit: 'mph',
  },
]

const UNIQUE_SITE_TARGETS: SliderSpec[] = [
  {
    key: 'targetStations',
    label: 'Target stations',
    hint: 'Target unique sites',
    min: 25,
    max: 5000,
    step: 25,
  },
  {
    key: 'tripWeeks',
    label: 'Trip length',
    hint: 'Trip length',
    min: 1,
    max: 52,
    step: 0.5,
    unit: 'wks',
  },
  {
    key: 'averageMph',
    label: 'Average speed',
    hint: 'Average moving speed',
    min: 25,
    max: 85,
    step: 1,
    unit: 'mph',
  },
  {
    key: 'practicalRangeMiles',
    label: 'Practical range',
    hint: 'Practical range',
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
    hint: 'Daily drive target',
    min: 1,
    max: 14,
    step: 0.25,
    unit: 'h',
  },
  {
    key: 'dailyDriveMaxHours',
    label: 'Normal-day cap',
    hint: 'Normal-day cap',
    min: 1,
    max: 16,
    step: 0.25,
    unit: 'h',
  },
  {
    key: 'longDayMaxHours',
    label: 'Long-day cap',
    hint: 'Long-day cap',
    min: 2,
    max: 14,
    step: 0.25,
    unit: 'h',
  },
  {
    key: 'longDayMinSitesPerExtraHour',
    label: 'Long-day min return',
    hint: 'Long-day min return',
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
    hint: 'Cluster hop allowance',
    min: 0.5,
    max: 25,
    step: 0.5,
    unit: 'mi',
  },
  {
    key: 'closeStationStopMinutes',
    label: 'Close-site stop',
    hint: 'Close-site stop',
    min: 1,
    max: 60,
    step: 1,
    unit: 'min',
  },
  {
    key: 'distanceChargeStopMinutes',
    label: 'Distance-charge stop',
    hint: 'Distance-charge stop',
    min: 2,
    max: 90,
    step: 1,
    unit: 'min',
  },
  {
    key: 'roadDistanceFactor',
    label: 'Road distance factor',
    hint: 'Road distance factor',
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
    hint: 'Allow longer days when the return is worth it',
  },
  {
    key: 'includeCanada',
    label: 'Include Canada',
    hint: 'Count eligible Canadian sites',
  },
  {
    key: 'includeMexico',
    label: 'Include Mexico',
    hint: 'Count eligible Mexican sites',
  },
  {
    key: 'showAllStations',
    label: 'Show all station dots',
    hint: 'Render every filtered site on the map',
  },
]

/** Format a numeric value compactly for the mono readout. */
function formatValue(value: number, step: number): string {
  if (Number.isInteger(value)) return value.toLocaleString('en-US')
  const decimals = step < 0.1 ? 2 : 1
  return value.toFixed(decimals)
}

/* ------------------------------------------------------------------ */
/* Section heading — mono uppercase micro-label                        */
/* ------------------------------------------------------------------ */
function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <div className="px-5 pt-5 pb-1 font-mono text-[10px] uppercase tracking-[0.12em] text-faint md:px-6">
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
    <div className="border-b border-edge px-5 py-3.5 md:px-6">
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <label htmlFor={inputId} className="min-w-0 cursor-pointer">
          <div className="truncate text-[13.5px] font-semibold text-ink">
            {spec.label}
          </div>
          <div className="mt-0.5 truncate text-[11.5px] text-faint">{spec.hint}</div>
        </label>
        <div className="flex-none whitespace-nowrap font-mono text-[15px] font-semibold text-accent">
          {formatValue(value, spec.step)}
          {spec.unit ? (
            <span className="ml-1 text-[11.5px] font-normal text-faint">{spec.unit}</span>
          ) : null}
        </div>
      </div>
      {/* >=44px tap area via vertical centering around the native range input */}
      <div className="flex min-h-11 items-center">
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
  last,
}: {
  spec: ToggleSpec
  checked: boolean
  onChange: (next: boolean) => void
  last?: boolean
}) {
  return (
    <div
      className={cx(
        'flex min-h-11 items-center justify-between gap-4 px-5 py-3.5 md:px-6',
        last ? '' : 'border-b border-edge',
      )}
    >
      <div className="min-w-0">
        <div className="truncate text-[13.5px] font-semibold text-ink">{spec.label}</div>
        <div className="mt-0.5 truncate text-[11.5px] text-faint">{spec.hint}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={spec.label}
        onClick={() => onChange(!checked)}
        className={cx(
          'relative inline-flex h-[26px] w-11 flex-none cursor-pointer items-center rounded-full border border-edge transition-colors',
          checked ? 'bg-accent' : 'bg-chip',
        )}
      >
        <span
          className={cx(
            'inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform',
            checked ? 'translate-x-[19px]' : 'translate-x-[2px]',
          )}
        />
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Read-only info row (e.g. averageMph bypassed by a live engine)      */
/* ------------------------------------------------------------------ */
function InfoRow({
  label,
  hint,
  badge,
}: {
  label: string
  hint: string
  badge: string
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-edge px-5 py-3.5 md:px-6">
      <div className="min-w-0">
        <div className="truncate text-[13.5px] font-semibold text-ink">{label}</div>
        <div className="mt-0.5 text-[11.5px] text-faint">{hint}</div>
      </div>
      <span className="flex-none whitespace-nowrap rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.08em] text-accent">
        {badge}
      </span>
    </div>
  )
}

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
    () =>
      LONGEST_TRIP_STATE_TARGETS.filter(
        (target) => !selectedIds.has(target.id),
      ),
    [selectedIds],
  )
  const availableDestinations = useMemo(
    () =>
      LONGEST_TRIP_DESTINATIONS.filter(
        (target) => !selectedIds.has(target.id),
      ),
    [selectedIds],
  )
  const [selectedStateId, setSelectedStateId] = useState(
    availableStates[0]?.id ?? '',
  )
  const [selectedDestinationId, setSelectedDestinationId] = useState(
    availableDestinations[0]?.id ?? '',
  )
  useEffect(() => {
    if (availableStates.some((target) => target.id === selectedStateId)) return
    setSelectedStateId(availableStates[0]?.id ?? '')
  }, [availableStates, selectedStateId])
  useEffect(() => {
    if (
      availableDestinations.some(
        (target) => target.id === selectedDestinationId,
      )
    ) {
      return
    }
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
          ? {
              ...target,
              stayDays: Math.max(1, Math.min(21, Math.round(stayDays))),
            }
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
      LONGEST_TRIP_DESTINATIONS.find(
        (item) => item.id === selectedDestinationId,
      ) ?? availableDestinations[0]
    if (!target) return

    addTarget(destinationTarget(target))
    const nextAvailable = availableDestinations.find(
      (item) => item.id !== target.id,
    )
    setSelectedDestinationId(nextAvailable?.id ?? '')
  }

  return (
    <>
      <SectionHeading>Must-visit targets</SectionHeading>
      <div className="border-b border-edge px-5 py-4 md:px-6">
        <div className="grid gap-3 md:grid-cols-2">
          <TargetSelect
            label="State"
            value={selectedStateId}
            options={availableStates.map((target) => ({
              value: target.id,
              label: target.label,
            }))}
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
        </div>
        <div
          className={cx(
            'mt-3 rounded-lg border px-3 py-2 text-[12px]',
            exceedsTarget
              ? 'border-warn-bd bg-warn-bg text-warn'
              : 'border-edge bg-panel2 text-faint',
          )}
        >
          {targetDays.toLocaleString()} of {config.longestTripDays.toLocaleString()}{' '}
          streak days reserved for selected targets.
        </div>
      </div>

      {config.longestTripTargets.length > 0 ? (
        <div className="border-b border-edge">
          {config.longestTripTargets.map((target) => (
            <TargetStayRow
              key={target.id}
              target={target}
              onStayDaysChange={(stayDays) => updateStayDays(target.id, stayDays)}
              onRemove={() => removeTarget(target.id)}
            />
          ))}
        </div>
      ) : null}
    </>
  )
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
      <label
        htmlFor={selectId}
        className="mb-1.5 block text-[12px] font-semibold text-dim"
      >
        {label}
      </label>
      <div className="flex min-w-0 gap-2">
        <select
          id={selectId}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-11 min-w-0 flex-1 rounded-lg border border-edge bg-panel2 px-3 text-[13px] text-ink disabled:opacity-60"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Button
          variant="secondary"
          size="lg"
          className="min-h-11 flex-none"
          onClick={onAdd}
          disabled={disabled}
        >
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
    <div className="flex min-h-14 items-center gap-3 border-t border-edge px-5 py-3 md:px-6">
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13.5px] font-semibold text-ink">
          {target.label}
        </div>
        <div className="mt-0.5 font-mono text-[10.5px] uppercase tracking-[0.08em] text-faint">
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
        className="h-10 w-20 rounded-lg border border-edge bg-panel2 px-2 text-center font-mono text-[13px] text-ink"
      />
      <span className="flex-none text-[12px] text-faint">days</span>
      <Button variant="ghost" size="sm" onClick={onRemove}>
        Remove
      </Button>
    </div>
  )
}

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

  const setNumber = (key: SliderKey, value: number) =>
    onChange({ ...config, [key]: value })
  const setBool = (key: ToggleKey, value: boolean) =>
    onChange({ ...config, [key]: value })
  const setMode = (plannerMode: PlannerMode) =>
    onChange({ ...config, plannerMode })
  const tripTargetSpecs =
    config.plannerMode === 'longest_trip'
      ? LONGEST_TRIP_TARGETS
      : UNIQUE_SITE_TARGETS

  const renderSliders = (specs: SliderSpec[]) =>
    specs.map((spec) => (
      <SliderRow
        key={spec.key}
        spec={spec}
        value={config[spec.key]}
        onChange={(next) => setNumber(spec.key, next)}
      />
    ))

  return (
    <Overlay open={open} onClose={onClose} size="config" labelledBy={titleId}>
      <OverlayHeader
        kicker="Planner assumptions"
        title="Configure optimization"
        titleId={titleId}
        onClose={onClose}
      />

      <div className="min-h-0 flex-1 overflow-y-auto pb-2">
        {/* Objective */}
        <SectionHeading>Trip objective</SectionHeading>
        <div className="border-b border-edge px-5 py-3.5 md:px-6">
          <div className="mb-2.5 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-[13.5px] font-semibold text-ink">
                Planner mode
              </div>
              <div className="mt-0.5 truncate text-[11.5px] text-faint">
                Contest objective
              </div>
            </div>
          </div>
          <SegmentedControl<PlannerMode>
            options={PLANNER_MODE_OPTIONS}
            value={config.plannerMode}
            onChange={setMode}
            tone="accent"
            ariaLabel="Planner mode"
          />
        </div>

        {/* Vehicle */}
        <SectionHeading>Vehicle</SectionHeading>
        <div className="flex items-center justify-between gap-4 border-b border-edge px-5 py-3.5 md:px-6">
          <div className="min-w-0">
            <div className="truncate text-[13.5px] font-semibold text-ink">Vehicle</div>
            <div className="mt-0.5 truncate text-[11.5px] text-faint">
              Range model used for legs
            </div>
          </div>
          <span className="flex-none whitespace-nowrap rounded-lg border border-edge bg-panel2 px-3 py-1.5 font-mono text-[12.5px] text-ink">
            Tesla Model Y LR
          </span>
        </div>

        {/* Trip targets */}
        <SectionHeading>Trip targets</SectionHeading>
        {tripTargetSpecs.map((spec) =>
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
        )}

        {config.plannerMode === 'longest_trip' ? (
          <LongestTripTargetsSection config={config} onChange={onChange} />
        ) : null}

        {/* Daily limits */}
        <SectionHeading>Daily limits</SectionHeading>
        {renderSliders(DAILY_LIMITS)}

        {/* Stop model */}
        <SectionHeading>Stop model</SectionHeading>
        {renderSliders(STOP_MODEL)}

        {/* Options */}
        <SectionHeading>Options</SectionHeading>
        {OPTIONS.map((spec, i) => (
          <ToggleRow
            key={spec.key}
            spec={spec}
            checked={config[spec.key]}
            onChange={(next) => setBool(spec.key, next)}
            last={i === OPTIONS.length - 1}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="flex flex-none gap-3 border-t border-edge px-6 py-5">
        <Button
          variant="secondary"
          size="lg"
          className="min-h-11 flex-1"
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          size="lg"
          className="min-h-11 flex-1"
          onClick={onApply}
          disabled={isOptimizing}
        >
          {isOptimizing ? 'Optimizing…' : 'Apply & re-optimize'}
        </Button>
      </div>
    </Overlay>
  )
}
