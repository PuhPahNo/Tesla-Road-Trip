import { useId, type ReactNode } from 'react'
import type { PlannerConfig } from '../domain/types'
import { Overlay, OverlayHeader } from '../ui/Overlay'
import { Button, cx } from '../ui/primitives'

export interface ConfigModalProps {
  config: PlannerConfig
  open: boolean
  isOptimizing: boolean
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

const TRIP_TARGETS: SliderSpec[] = [
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
    label: 'Close-site radius',
    hint: 'Close-site radius',
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

export function ConfigModal({
  config,
  open,
  isOptimizing,
  onClose,
  onChange,
  onApply,
}: ConfigModalProps) {
  const titleId = useId()

  const setNumber = (key: SliderKey, value: number) =>
    onChange({ ...config, [key]: value })
  const setBool = (key: ToggleKey, value: boolean) =>
    onChange({ ...config, [key]: value })

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
        {renderSliders(TRIP_TARGETS)}

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
