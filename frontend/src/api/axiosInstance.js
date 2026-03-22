import axios from 'axios'

export const apiBaseUrl = (
  import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'
).replace(/\/$/, '')

const axiosInstance = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
})

export default axiosInstance
