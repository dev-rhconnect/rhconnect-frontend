import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('rhconnect-auth')
      if (raw) {
        const parsed = JSON.parse(raw)
        const token = parsed?.state?.token
        if (token) config.headers.Authorization = `Bearer ${token}`
      }
    } catch {
      // localStorage parse error — ignore
    }
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('rhconnect-auth')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  },
)

export { api }
export default api
