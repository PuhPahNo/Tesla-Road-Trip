import { Database, RefreshCw } from 'lucide-react'
import type { StationsResponse } from '../api/client'

interface StationSourceBarProps {
  stationStatus?: StationsResponse
  isLoading: boolean
  error?: string
  onRefresh: () => void
}

export function StationSourceBar({
  stationStatus,
  isLoading,
  error,
  onRefresh,
}: StationSourceBarProps) {
  return (
    <section className="source-bar" aria-label="Station source status">
      <div>
        <p className="eyebrow">Station source</p>
        <h2>
          {stationStatus
            ? `${stationStatus.filteredStations.toLocaleString()} filtered open sites`
            : 'Loading station feed'}
        </h2>
        <p>
          {error
            ? error
            : stationStatus
              ? `Supercharge.info fetched ${new Date(stationStatus.source.fetchedAt).toLocaleString()}`
              : 'Connecting to local API'}
        </p>
      </div>
      <button
        className="icon-text-button"
        type="button"
        disabled={isLoading}
        onClick={onRefresh}
      >
        {isLoading ? <RefreshCw className="spin" size={17} /> : <Database size={17} />}
        Refresh
      </button>
    </section>
  )
}
