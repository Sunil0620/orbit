import axiosInstance from './axiosInstance'

export const registerUser = async (data) => {
  const response = await axiosInstance.post('/auth/register/', data)
  return response.data
}

export const loginUser = async (data) => {
  const response = await axiosInstance.post('/auth/token/', data)
  return response.data
}

export const fetchProfile = async (accessToken) => {
  const response = await axiosInstance.get('/auth/profile/', {
    headers: accessToken
      ? {
          Authorization: `Bearer ${accessToken}`,
        }
      : undefined,
  })
  return response.data
}
