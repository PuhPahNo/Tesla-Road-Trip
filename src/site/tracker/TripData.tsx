import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  fetchAnthonyRoute,
  fetchCommunity,
  type CommunitySnapshot,
  type PublishedAnthonyRoute,
} from '../../api/siteClient'
import { buildJournal, type JournalEntry } from './journal'
import { buildTripProgress, type TripProgress } from './tripProgress'

interface TripData {
  community?: CommunitySnapshot
  /** undefined while loading, null when no route is published. */
  published?: PublishedAnthonyRoute | null
  progress: TripProgress
  journal: JournalEntry[]
  loading: boolean
  error?: string
  routeError?: string
}

const TripDataContext = createContext<TripData | null>(null)

/** Loads the public trip once for every tracker page. */
export function TripDataProvider({ children }: { children: ReactNode }) {
  const [community, setCommunity] = useState<CommunitySnapshot>()
  const [published, setPublished] = useState<PublishedAnthonyRoute | null>()
  const [error, setError] = useState<string>()
  const [routeError, setRouteError] = useState<string>()

  useEffect(() => {
    let cancelled = false
    void fetchCommunity()
      // Older servers don't send the day log; treat that as "nothing logged".
      .then((result) => !cancelled && setCommunity({ ...result, dayLog: result.dayLog ?? [] }))
      .catch((requestError) => {
        if (!cancelled) setError(messageOf(requestError, 'Unable to load the trip.'))
      })
    void fetchAnthonyRoute()
      .then((result) => !cancelled && setPublished(result.route))
      .catch((requestError) => {
        if (cancelled) return
        setPublished(null)
        setRouteError(messageOf(requestError, 'Unable to load the route.'))
      })
    return () => {
      cancelled = true
    }
  }, [])

  const value = useMemo<TripData>(() => {
    const route = published?.route
    return {
      community,
      published,
      progress: buildTripProgress(
        route,
        community?.trip,
        community?.dayLog,
        published?.savedRoute.startDate ?? community?.trip.departureDate,
      ),
      journal: buildJournal(community?.updates ?? []),
      loading: (!community && !error) || published === undefined,
      error,
      routeError,
    }
  }, [community, error, published, routeError])

  return <TripDataContext.Provider value={value}>{children}</TripDataContext.Provider>
}

export function useTripData() {
  const value = useContext(TripDataContext)
  if (!value) throw new Error('useTripData must be used inside TripDataProvider')
  return value
}

function messageOf(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}
