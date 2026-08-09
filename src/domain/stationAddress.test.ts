import { describe, expect, it } from 'vitest'
import { formatStationAddress } from './stationAddress'

describe('formatStationAddress', () => {
  it('formats a complete US Supercharger address without a redundant country', () => {
    expect(
      formatStationAddress({
        street: '1350 Travis Blvd',
        city: 'Fairfield',
        state: 'CA',
        zip: '94533',
        country: 'USA',
      }),
    ).toBe('1350 Travis Blvd, Fairfield, CA 94533')
  })

  it('falls back to city and state when the source has no street or ZIP', () => {
    expect(
      formatStationAddress({
        city: 'Kalispell',
        state: 'MT',
        country: 'USA',
      }),
    ).toBe('Kalispell, MT')
  })

  it('retains the country for stations outside the United States', () => {
    expect(
      formatStationAddress({
        street: '123 Example Rd',
        city: 'Calgary',
        state: 'AB',
        zip: 'T2P 1J9',
        country: 'Canada',
      }),
    ).toBe('123 Example Rd, Calgary, AB T2P 1J9, Canada')
  })
})
