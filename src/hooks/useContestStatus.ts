import { useEffect, useMemo, useState } from 'react'
import { getTeslaContestStatus } from '../domain/rules'

/** Refreshes rule messaging at the user's next local midnight. */
export function useContestStatus() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    let timeoutId = 0

    const scheduleNextDay = () => {
      const current = new Date()
      const nextDay = new Date(
        current.getFullYear(),
        current.getMonth(),
        current.getDate() + 1,
      )
      timeoutId = window.setTimeout(() => {
        setNow(new Date())
        scheduleNextDay()
      }, nextDay.getTime() - current.getTime() + 100)
    }

    scheduleNextDay()
    return () => window.clearTimeout(timeoutId)
  }, [])

  return useMemo(() => getTeslaContestStatus(now), [now])
}
