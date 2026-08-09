import type { RoutePlan } from './types'

export type StationStatusTone = 'good' | 'warn' | 'info' | 'neutral'

export interface StationStatusPresentation {
  code: string
  label: string
  tone: StationStatusTone
  isOpen: boolean
}

const KNOWN_STATUSES: Record<
  string,
  Omit<StationStatusPresentation, 'code'>
> = {
  OPEN: { label: 'Open', tone: 'good', isOpen: true },
  EXPANDING: { label: 'Expanding', tone: 'info', isOpen: false },
  CLOSED_TEMP: {
    label: 'Temporarily closed',
    tone: 'warn',
    isOpen: false,
  },
  CLOSED_PERM: {
    label: 'Permanently closed',
    tone: 'warn',
    isOpen: false,
  },
  CONSTRUCTION: {
    label: 'Under construction',
    tone: 'warn',
    isOpen: false,
  },
  PERMIT: { label: 'Permit', tone: 'info', isOpen: false },
  PLAN: { label: 'Planned', tone: 'neutral', isOpen: false },
  VOTING: { label: 'Voting', tone: 'neutral', isOpen: false },
}

function humanizeStatus(code: string) {
  return code
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ')
}

export function stationStatusPresentation(
  status: string,
): StationStatusPresentation {
  const code = status.trim().toUpperCase()
  const known = KNOWN_STATUSES[code]
  const fallbackLabel = humanizeStatus(code)
  return {
    code,
    label: known?.label ?? (fallbackLabel || 'Unknown'),
    tone: known?.tone ?? 'neutral',
    isOpen: known?.isOpen ?? false,
  }
}

export function routeStationAvailability(
  route: Pick<RoutePlan, 'visits'>,
) {
  const stations = new Map(
    route.visits.map((visit) => [visit.station.id, visit.station]),
  )
  const statusCounts: Record<string, number> = {}
  let open = 0

  stations.forEach((station) => {
    const presentation = stationStatusPresentation(station.status)
    statusCounts[presentation.code] =
      (statusCounts[presentation.code] ?? 0) + 1
    if (presentation.isOpen) open += 1
  })

  return {
    total: stations.size,
    open,
    notOpen: stations.size - open,
    statusCounts,
  }
}
