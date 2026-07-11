export const VEHICLE_PROFILES = [
  {
    id: 'model-3-rwd',
    label: 'Tesla Model 3 RWD',
    practicalRangeMiles: 240,
  },
  {
    id: 'model-3-long-range',
    label: 'Tesla Model 3 Long Range',
    practicalRangeMiles: 270,
  },
  {
    id: 'model-3-performance',
    label: 'Tesla Model 3 Performance',
    practicalRangeMiles: 225,
  },
  {
    id: 'model-y-rwd',
    label: 'Tesla Model Y RWD',
    practicalRangeMiles: 240,
  },
  {
    id: 'model-y-long-range-awd',
    label: 'Tesla Model Y Long Range AWD',
    practicalRangeMiles: 245,
  },
  {
    id: 'model-y-performance',
    label: 'Tesla Model Y Performance',
    practicalRangeMiles: 230,
  },
  {
    id: 'model-s-awd',
    label: 'Tesla Model S AWD',
    practicalRangeMiles: 305,
  },
  {
    id: 'model-s-plaid',
    label: 'Tesla Model S Plaid',
    practicalRangeMiles: 275,
  },
  {
    id: 'model-x-awd',
    label: 'Tesla Model X AWD',
    practicalRangeMiles: 265,
  },
  {
    id: 'model-x-plaid',
    label: 'Tesla Model X Plaid',
    practicalRangeMiles: 250,
  },
  {
    id: 'cybertruck-awd',
    label: 'Tesla Cybertruck AWD',
    practicalRangeMiles: 245,
  },
  {
    id: 'cyberbeast',
    label: 'Tesla Cyberbeast',
    practicalRangeMiles: 225,
  },
  {
    id: 'other-tesla',
    label: 'Other / older Tesla',
    practicalRangeMiles: 220,
  },
] as const

export type VehicleProfileId = (typeof VEHICLE_PROFILES)[number]['id']

export const VEHICLE_PROFILE_IDS = VEHICLE_PROFILES.map((profile) => profile.id) as [
  VehicleProfileId,
  ...VehicleProfileId[],
]

export const DEFAULT_VEHICLE_PROFILE_ID: VehicleProfileId =
  'model-y-long-range-awd'

export function getVehicleProfile(id: VehicleProfileId) {
  return (
    VEHICLE_PROFILES.find((profile) => profile.id === id) ??
    VEHICLE_PROFILES.find((profile) => profile.id === DEFAULT_VEHICLE_PROFILE_ID)!
  )
}

export function practicalRangeForVehicle(id: VehicleProfileId) {
  return getVehicleProfile(id).practicalRangeMiles
}
