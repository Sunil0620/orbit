import axiosInstance from './axiosInstance'

function unwrapCollection(payload) {
  if (Array.isArray(payload)) {
    return payload
  }

  if (Array.isArray(payload?.results)) {
    return payload.results
  }

  return []
}

export async function listServers() {
  const response = await axiosInstance.get('/servers/')
  return unwrapCollection(response.data)
}

export async function createServer(data) {
  const isFormData = typeof FormData !== 'undefined' && data instanceof FormData
  const response = await axiosInstance.post('/servers/', data, {
    headers: isFormData
      ? {
          'Content-Type': 'multipart/form-data',
        }
      : undefined,
  })
  return response.data
}

export async function joinServer(inviteCode) {
  const response = await axiosInstance.post('/servers/join/', {
    invite_code: inviteCode,
  })
  return response.data
}

export async function listChannels(serverId) {
  const response = await axiosInstance.get('/channels/', {
    params: { server: serverId },
  })
  return unwrapCollection(response.data)
}

export async function getServer(serverId) {
  const response = await axiosInstance.get(`/servers/${serverId}/`)
  return response.data
}

export async function updateServer(serverId, data) {
  const response = await axiosInstance.patch(`/servers/${serverId}/`, data)
  return response.data
}

export async function deleteServer(serverId) {
  await axiosInstance.delete(`/servers/${serverId}/`)
}

export async function leaveServer(serverId) {
  await axiosInstance.post(`/servers/${serverId}/leave/`)
}
