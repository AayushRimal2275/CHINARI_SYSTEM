import { createContext } from 'react'

export type User = {
  id: number
  name: string
  email: string
}

export type AuthContextValue = {
  token: string | null
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
