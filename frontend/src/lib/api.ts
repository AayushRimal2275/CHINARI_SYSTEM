import axios from 'axios'

const token = localStorage.getItem('chinari_token')

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api',
  headers: {
    'Accept': 'application/json',        // ← add this
    'Content-Type': 'application/json',  // ← add this
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  },
})

export function setApiToken(nextToken: string | null) {
  if (nextToken) {
    api.defaults.headers.common.Authorization = `Bearer ${nextToken}`
  } else {
    delete api.defaults.headers.common.Authorization
  }
}
