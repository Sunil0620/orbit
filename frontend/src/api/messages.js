import axiosInstance from './axiosInstance'

function unwrapMessages(payload) {
  if (Array.isArray(payload)) {
    return payload
  }

  if (Array.isArray(payload?.results)) {
    return payload.results
  }

  return []
}

export async function listMessages(channelId) {
  const response = await axiosInstance.get('/messages/', {
    params: { channel: channelId },
  })
  return unwrapMessages(response.data)
}
