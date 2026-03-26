import axios from 'axios'
import useAuthStore from '../store/useAuthStore'
import useChatStore from '../store/useChatStore'

function normalizeApiBaseUrl(value) {
  const fallbackUrl = 'http://localhost:8000/api'
  const rawValue = value ?? fallbackUrl

  try {
    const parsedUrl = new URL(rawValue, window.location.origin)
    const normalizedPath = parsedUrl.pathname.replace(/\/$/, '')

    if (!normalizedPath || normalizedPath === '') {
      parsedUrl.pathname = '/api'
    } else if (normalizedPath === '/') {
      parsedUrl.pathname = '/api'
    } else {
      parsedUrl.pathname = normalizedPath
    }

    return parsedUrl.toString().replace(/\/$/, '')
  } catch {
    return rawValue.replace(/\/$/, '')
  }
}

export const apiBaseUrl = normalizeApiBaseUrl(import.meta.env.VITE_API_URL)

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
  const hasAuthorizationHeader =
    Boolean(config.headers?.Authorization) || Boolean(config.headers?.authorization)

  if (accessToken && !hasAuthorizationHeader) {
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
      useChatStore.getState().resetChatState()
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
      useChatStore.getState().resetChatState()
      redirectToLogin()
      return Promise.reject(refreshError)
    }
  },
)

export default axiosInstance
