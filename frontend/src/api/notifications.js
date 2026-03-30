import axiosInstance from './axiosInstance'

export async function markChannelRead(channelId, lastReadMessageId) {
  const response = await axiosInstance.post(`/notifications/channels/${channelId}/read/`, {
    last_read_message_id: lastReadMessageId,
  })
  return response.data
}

export async function markDirectConversationRead(conversationId, lastReadMessageId) {
  const response = await axiosInstance.post(
    `/notifications/direct-conversations/${conversationId}/read/`,
    {
      last_read_message_id: lastReadMessageId,
    },
  )
  return response.data
}
