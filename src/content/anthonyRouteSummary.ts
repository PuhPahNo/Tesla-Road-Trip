export const ANTHONY_ROUTE_PUBLIC_SUMMARY = {
  routeName: '2026 Competition',
  capturedAt: '2026-08-10T00:07:02.969Z',
  plannedDays: 73,
  uniqueSuperchargers: 73,
  roadRoutedMiles: 10_107.8,
  driveHours: 187,
} as const

export function formatAnthonyRouteMiles() {
  return ANTHONY_ROUTE_PUBLIC_SUMMARY.roadRoutedMiles.toLocaleString('en-US', {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  })
}
