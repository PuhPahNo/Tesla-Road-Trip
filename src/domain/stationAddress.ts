import type { StationAddress } from './types'

export function formatStationAddress(address: StationAddress): string {
  const street = address.street?.trim()
  const city = address.city.trim()
  const region = [address.state.trim(), address.zip?.trim()].filter(Boolean).join(' ')
  const locality = [city, region].filter(Boolean).join(', ')
  const country = address.country.trim()

  return [street, locality, country && country !== 'USA' ? country : undefined]
    .filter(Boolean)
    .join(', ')
}
