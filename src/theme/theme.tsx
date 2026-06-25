import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type ThemeName = 'tesla' | 'dash'

const STORAGE_KEY = 'sqp-theme'
const DEFAULT_THEME: ThemeName = 'dash'

interface ThemeContextValue {
  theme: ThemeName
  isDark: boolean
  setTheme: (theme: ThemeName) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

function readInitialTheme(): ThemeName {
  if (typeof document !== 'undefined') {
    const attr = document.documentElement.getAttribute('data-theme')
    if (attr === 'tesla' || attr === 'dash') return attr
  }
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'tesla' || stored === 'dash') return stored
  }
  return DEFAULT_THEME
}

function applyTheme(theme: ThemeName) {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-theme', theme)
  const meta = document.getElementById('theme-color-meta')
  if (meta) meta.setAttribute('content', theme === 'tesla' ? '#ffffff' : '#0a0d12')
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(readInitialTheme)

  useEffect(() => {
    applyTheme(theme)
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // ignore storage failures (private mode, etc.)
    }
  }, [theme])

  const setTheme = useCallback((next: ThemeName) => setThemeState(next), [])
  const toggleTheme = useCallback(
    () => setThemeState((current) => (current === 'dash' ? 'tesla' : 'dash')),
    [],
  )

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, isDark: theme === 'dash', setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider')
  return ctx
}
