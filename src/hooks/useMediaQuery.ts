import { useEffect, useState } from 'react'

/**
 * Subscribe to a CSS media query. SSR/first-paint safe: defaults to `false`
 * and syncs on mount.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mql = window.matchMedia(query)
    const onChange = () => setMatches(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])

  return matches
}

/**
 * True for phone-shaped viewports: at/below the Tailwind `md` breakpoint
 * (768px), or a touch device in landscape too short for the desktop
 * rail + panel chrome (e.g. a phone rotated sideways).
 */
export function useIsMobile(): boolean {
  return useMediaQuery(
    '(max-width: 767px), (pointer: coarse) and (max-height: 480px)',
  )
}
