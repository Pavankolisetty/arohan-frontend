import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api } from '../shared/api'
import type { PreferencesInput, User } from '../shared/types'

const TOKEN_KEY = 'arohan.session.token'

interface AuthContextValue {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<User>
  register: (
    displayName: string,
    email: string,
    password: string,
  ) => Promise<User>
  updatePreferences: (input: PreferencesInput) => Promise<User>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    sessionStorage.getItem(TOKEN_KEY),
  )
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(Boolean(token))

  const keepSession = useCallback((nextToken: string, nextUser: User) => {
    sessionStorage.setItem(TOKEN_KEY, nextToken)
    setToken(nextToken)
    setUser(nextUser)
  }, [])

  const logout = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
  }, [])

  useEffect(() => {
    if (!token || user) return
    api
      .me(token)
      .then(setUser)
      .catch(logout)
      .finally(() => setLoading(false))
  }, [logout, token, user])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      login: async (email, password) => {
        const response = await api.login({ email, password })
        keepSession(response.accessToken, response.user)
        return response.user
      },
      register: async (displayName, email, password) => {
        const response = await api.register({ displayName, email, password })
        keepSession(response.accessToken, response.user)
        return response.user
      },
      updatePreferences: async (input) => {
        if (!token) throw new Error('Your session has ended. Please sign in.')
        const updated = await api.updatePreferences(token, input)
        setUser(updated)
        return updated
      },
      logout,
    }),
    [keepSession, loading, logout, token, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// The hook intentionally shares this module with its provider so they cannot
// drift into incompatible context contracts.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
