import axiosInstance from './axiosInstance'

export async function listDirectConversations() {
  const response = await axiosInstance.get('/messages/direct-conversations/')
  return Array.isArray(response.data) ? response.data : []
}

export async function createOrOpenDirectConversation(recipientId) {
  const response = await axiosInstance.post('/messages/direct-conversations/', {
    recipient_id: recipientId,
  })
  return response.data
}
