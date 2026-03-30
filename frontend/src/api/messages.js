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
  const params =
    typeof channelId === 'object' && channelId !== null
      ? channelId
      : { channel: channelId }
  const response = await axiosInstance.get('/messages/', {
    params,
  })
  return unwrapMessages(response.data)
}

export async function uploadMessageFile(file, onUploadProgress) {
  const payload = new FormData()
  payload.append('file', file)

  const response = await axiosInstance.post('/messages/upload/', payload, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress,
  })

  return response.data
}
