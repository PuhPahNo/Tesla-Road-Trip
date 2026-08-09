import { describe, expect, it } from 'vitest'
import type { RoutePlan, Station } from './types'
import {
  routeStationAvailability,
  stationStatusPresentation,
} from './stationStatus'

function station(id: string, status: string): Station {
  return {
    id,
    sourceId: id,
    source: 'supercharge.info',
    name: `Station ${id}`,
    status,
    position: { lat: 35, lon: -85 },
    address: { city: 'Chattanooga', state: 'TN', country: 'USA' },
    stallCount: 12,
    powerKw: 250,
    counted: true,
    otherEvs: false,
  }
}

describe('stationStatusPresentation', () => {
  it.each([
    ['OPEN', 'Open', true],
    ['CONSTRUCTION', 'Under construction', false],
    ['CLOSED_TEMP', 'Temporarily closed', false],
    ['CLOSED_PERM', 'Permanently closed', false],
    ['EXPANDING', 'Expanding', false],
    ['PERMIT', 'Permit', false],
    ['PLAN', 'Planned', false],
    ['VOTING', 'Voting', false],
  ])('presents %s as %s', (status, label, isOpen) => {
    expect(stationStatusPresentation(status)).toMatchObject({
      code: status,
      label,
      isOpen,
    })
  })

  it('humanizes an unknown source status without treating it as open', () => {
    expect(stationStatusPresentation('future_status')).toEqual({
      code: 'FUTURE_STATUS',
      label: 'Future Status',
      tone: 'neutral',
      isOpen: false,
    })
  })
})

describe('routeStationAvailability', () => {
  it('counts unique route sites and does not double-count repeat visits', () => {
    const open = station('open', 'OPEN')
    const closed = station('closed', 'CLOSED_TEMP')
    const route = {
      visits: [
        { station: open },
        { station: open },
        { station: closed },
      ],
    } as Pick<RoutePlan, 'visits'>

    expect(routeStationAvailability(route)).toEqual({
      total: 2,
      open: 1,
      notOpen: 1,
      statusCounts: { OPEN: 1, CLOSED_TEMP: 1 },
    })
  })
})
