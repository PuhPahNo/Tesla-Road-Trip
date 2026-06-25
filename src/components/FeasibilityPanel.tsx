import { AlertTriangle, CheckCircle2, Info } from 'lucide-react'
import type { OptimizeResponse } from '../domain/types'

export function FeasibilityPanel({ result }: { result?: OptimizeResponse }) {
  if (!result) return null

  const feasibility = result.universe.allSitesFeasibility
  const Icon =
    feasibility.verdict === 'plausible'
      ? CheckCircle2
      : feasibility.verdict === 'aggressive'
        ? Info
        : AlertTriangle

  return (
    <section className={`feasibility ${feasibility.verdict}`}>
      <Icon size={19} />
      <div>
        <p className="eyebrow">All-sites reality check</p>
        <h2>
          {feasibility.totalStations.toLocaleString()} open filtered sites ·{' '}
          {feasibility.requiredStationsPerDay} sites/day needed
        </h2>
        <p>{feasibility.explanation}</p>
        <p>
          Minimum stop-only time is {feasibility.minimumStopHours}h if every
          station were treated as a close-site stop; distance-charge stop time is{' '}
          {feasibility.distanceStopHours}h.
        </p>
      </div>
    </section>
  )
}
