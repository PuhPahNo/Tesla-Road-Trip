import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  fetchSession,
  login as loginRequest,
  logout as logoutRequest,
  signup as signupRequest,
  type AuthUser,
} from '../api/siteClient'

interface AuthContextValue {
  user?: AuthUser
  loading: boolean
  login: (input: { username: string; password: string }) => Promise<AuthUser>
  signup: (input: { username: string; password: string }) => Promise<AuthUser>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser>()
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      setUser((await fetchSession()).user)
    } catch {
      setUser(undefined)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login: async (input) => {
        const next = (await loginRequest(input)).user
        setUser(next)
        return next
      },
      signup: async (input) => {
        const next = (await signupRequest(input)).user
        setUser(next)
        return next
      },
      logout: async () => {
        await logoutRequest()
        setUser(undefined)
      },
      refresh,
    }),
    [loading, refresh, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider.')
  return context
}
