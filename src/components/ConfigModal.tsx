import {
  Gauge,
  Globe2,
  MapPinned,
  Route,
  Timer,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react'
import type { PlannerConfig } from '../domain/types'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'

interface ConfigModalProps {
  config: PlannerConfig
  open: boolean
  isOptimizing: boolean
  onClose: () => void
  onChange: (config: PlannerConfig) => void
  onOptimize: () => void
}

export function ConfigModal({
  config,
  open,
  isOptimizing,
  onClose,
  onChange,
  onOptimize,
}: ConfigModalProps) {
  useBodyScrollLock(open)

  if (!open) return null

  const setNumber = (key: keyof PlannerConfig, value: string) => {
    onChange({
      ...config,
      [key]: Number(value),
    })
  }

  const setBoolean = (key: keyof PlannerConfig, value: boolean) => {
    onChange({
      ...config,
      [key]: value,
    })
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section
        aria-modal="true"
        className="config-modal"
        role="dialog"
        aria-labelledby="config-title"
      >
        <header className="modal-header">
          <div>
            <p className="eyebrow">Route configuration</p>
            <h2 id="config-title">Competition planner settings</h2>
          </div>
          <button
            aria-label="Close configuration"
            className="icon-button"
            type="button"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </header>

        <div className="config-grid">
          <NumberField
            icon={<MapPinned size={16} />}
            label="Target unique sites"
            min={25}
            max={5000}
            step={25}
            value={config.targetStations}
            onChange={(value) => setNumber('targetStations', value)}
          />
          <NumberField
            icon={<Timer size={16} />}
            label="Trip weeks"
            min={1}
            max={52}
            step={0.5}
            value={config.tripWeeks}
            onChange={(value) => setNumber('tripWeeks', value)}
          />
          <NumberField
            icon={<Route size={16} />}
            label="Daily drive target"
            suffix="hours"
            min={1}
            max={14}
            step={0.25}
            value={config.dailyDriveTargetHours}
            onChange={(value) => setNumber('dailyDriveTargetHours', value)}
          />
          <NumberField
            icon={<Route size={16} />}
            label="Normal-day cap"
            suffix="hours"
            min={1}
            max={16}
            step={0.25}
            value={config.dailyDriveMaxHours}
            onChange={(value) => setNumber('dailyDriveMaxHours', value)}
          />
          <NumberField
            icon={<Timer size={16} />}
            label="Long-day cap"
            suffix="hours"
            min={2}
            max={14}
            step={0.25}
            value={config.longDayMaxHours}
            onChange={(value) => setNumber('longDayMaxHours', value)}
          />
          <NumberField
            icon={<TrendingUp size={16} />}
            label="Long-day min return"
            suffix="sites/hr"
            min={0.1}
            max={30}
            step={0.1}
            value={config.longDayMinSitesPerExtraHour}
            onChange={(value) =>
              setNumber('longDayMinSitesPerExtraHour', value)
            }
          />
          <NumberField
            icon={<Gauge size={16} />}
            label="Average moving speed"
            suffix="mph"
            min={25}
            max={85}
            step={1}
            value={config.averageMph}
            onChange={(value) => setNumber('averageMph', value)}
          />
          <NumberField
            icon={<Zap size={16} />}
            label="Practical range"
            suffix="miles"
            min={80}
            max={350}
            step={5}
            value={config.practicalRangeMiles}
            onChange={(value) => setNumber('practicalRangeMiles', value)}
          />
          <NumberField
            icon={<MapPinned size={16} />}
            label="Close-site radius"
            suffix="miles"
            min={0.5}
            max={25}
            step={0.5}
            value={config.closeStationRadiusMiles}
            onChange={(value) => setNumber('closeStationRadiusMiles', value)}
          />
          <NumberField
            icon={<Timer size={16} />}
            label="Close-site stop"
            suffix="minutes"
            min={1}
            max={60}
            step={1}
            value={config.closeStationStopMinutes}
            onChange={(value) => setNumber('closeStationStopMinutes', value)}
          />
          <NumberField
            icon={<Zap size={16} />}
            label="Distance-charge stop"
            suffix="minutes"
            min={2}
            max={90}
            step={1}
            value={config.distanceChargeStopMinutes}
            onChange={(value) => setNumber('distanceChargeStopMinutes', value)}
          />
          <NumberField
            icon={<Route size={16} />}
            label="Road distance factor"
            min={1}
            max={1.8}
            step={0.01}
            value={config.roadDistanceFactor}
            onChange={(value) => setNumber('roadDistanceFactor', value)}
          />
        </div>

        <div className="toggle-grid">
          <ToggleRow
            icon={<Globe2 size={16} />}
            label="Include Canada"
            checked={config.includeCanada}
            onChange={(checked) => setBoolean('includeCanada', checked)}
          />
          <ToggleRow
            icon={<Globe2 size={16} />}
            label="Include Mexico"
            checked={config.includeMexico}
            onChange={(checked) => setBoolean('includeMexico', checked)}
          />
          <ToggleRow
            icon={<MapPinned size={16} />}
            label="Show all station dots"
            checked={config.showAllStations}
            onChange={(checked) => setBoolean('showAllStations', checked)}
          />
          <ToggleRow
            icon={<TrendingUp size={16} />}
            label="Long-day optimization"
            checked={config.longDayOptimization}
            onChange={(checked) => setBoolean('longDayOptimization', checked)}
          />
        </div>

        <footer className="modal-actions">
          <button className="secondary-button" type="button" onClick={onClose}>
            Close
          </button>
          <button
            className="primary-button"
            type="button"
            disabled={isOptimizing}
            onClick={onOptimize}
          >
            <Route size={18} />
            {isOptimizing ? 'Optimizing...' : 'Optimize routes'}
          </button>
        </footer>
      </section>
    </div>
  )
}

interface NumberFieldProps {
  icon: React.ReactNode
  label: string
  value: number
  min: number
  max: number
  step: number
  suffix?: string
  onChange: (value: string) => void
}

function NumberField({
  icon,
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: NumberFieldProps) {
  return (
    <label className="field">
      <span className="field-label">
        {icon}
        {label}
      </span>
      <span className="input-row">
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        {suffix && <span className="suffix">{suffix}</span>}
      </span>
    </label>
  )
}

interface ToggleRowProps {
  icon: React.ReactNode
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}

function ToggleRow({ icon, label, checked, onChange }: ToggleRowProps) {
  return (
    <label className="toggle-row">
      <span className="field-label">
        {icon}
        {label}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  )
}
