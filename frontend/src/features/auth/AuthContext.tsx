import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { api, setApiToken } from '@/lib/api'

type User = {
  id: number
  name: string
  email: string
}

type AuthContextValue = {
  token: string | null
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('chinari_token'))
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem('chinari_user')
    return raw ? (JSON.parse(raw) as User) : null
  })

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      login: async (email, password) => {
        const response = await api.post('/auth/login', { email, password })
        const payload = response.data.data as { token: string; user: User }
        setToken(payload.token)
        setUser(payload.user)
        setApiToken(payload.token)
        localStorage.setItem('chinari_token', payload.token)
        localStorage.setItem('chinari_user', JSON.stringify(payload.user))
      },
      logout: async () => {
        try {
          await api.post('/auth/logout')
        } catch {
          // ignore API failure during local logout
        }
        setToken(null)
        setUser(null)
        setApiToken(null)
        localStorage.removeItem('chinari_token')
        localStorage.removeItem('chinari_user')
      },
    }),
    [token, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return context
}
