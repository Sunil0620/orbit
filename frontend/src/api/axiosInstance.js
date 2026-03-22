import axios from 'axios'
import useAuthStore from '../store/useAuthStore'

export const apiBaseUrl = (
  import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'
).replace(/\/$/, '')

const axiosInstance = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
})

const refreshClient = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
})

let refreshPromise = null

function redirectToLogin() {
  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    window.location.replace('/login')
  }
}

axiosInstance.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().tokens?.access

  if (accessToken) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${accessToken}`
  }

  return config
})

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const statusCode = error.response?.status
    const requestUrl = originalRequest?.url ?? ''
    const isTokenRequest = requestUrl.includes('/auth/token/')

    if (
      statusCode !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      isTokenRequest
    ) {
      return Promise.reject(error)
    }

    const refreshToken = useAuthStore.getState().tokens?.refresh

    if (!refreshToken) {
      useAuthStore.getState().logout()
      redirectToLogin()
      return Promise.reject(error)
    }

    originalRequest._retry = true

    try {
      if (!refreshPromise) {
        refreshPromise = refreshClient
          .post('/auth/token/refresh/', { refresh: refreshToken })
          .then((response) => response.data)
          .finally(() => {
            refreshPromise = null
          })
      }

      const refreshedTokens = await refreshPromise
      const nextTokens = {
        access: refreshedTokens.access,
        refresh: refreshedTokens.refresh ?? refreshToken,
      }

      useAuthStore.getState().updateTokens(nextTokens)
      originalRequest.headers = originalRequest.headers ?? {}
      originalRequest.headers.Authorization = `Bearer ${nextTokens.access}`

      return axiosInstance(originalRequest)
    } catch (refreshError) {
      useAuthStore.getState().logout()
      redirectToLogin()
      return Promise.reject(refreshError)
    }
  },
)

export default axiosInstance
