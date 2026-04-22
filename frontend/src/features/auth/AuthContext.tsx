import { useMemo, useState, type ReactNode } from 'react'
import { api, setApiToken } from '@/lib/api'
import { AuthContext, type AuthContextValue, type User } from './context'

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
