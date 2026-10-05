/** Planning proxy calibrated against the October 4 comparison of 69 road legs. */
export const DRIVE_TIME_MULTIPLIER = 0.90

export const DRIVE_TIME_NOTE = 'Driving estimates use a 10% planning adjustment. Charging is separate; traffic and road conditions can change the actual time.'

/** Apply once when turning provider hours or mileage estimates into a day plan. */
export function planningDriveHours(miles: number, averageMph: number, providerHours?: number) {
  return (providerHours ?? miles / averageMph) * DRIVE_TIME_MULTIPLIER
}
