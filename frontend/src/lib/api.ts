import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('chinari_token')
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('chinari_token')
      localStorage.removeItem('chinari_user')
      delete api.defaults.headers.common.Authorization
    }
    return Promise.reject(error)
  },
)

export function setApiToken(nextToken: string | null) {
  if (nextToken) {
    api.defaults.headers.common.Authorization = `Bearer ${nextToken}`
  } else {
    delete api.defaults.headers.common.Authorization
  }
}
