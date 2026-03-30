import { create } from 'zustand'

const initialState = {
  servers: [],
  activeServerId: null,
  channels: [],
  activeChannelId: null,
  directConversations: [],
  activeDirectConversationId: null,
  messages: [],
  messagesByChannel: {},
  messagesByDirectConversation: {},
  lastReadMessageId: {},
  lastReadDirectMessageId: {},
  typingUsers: {},
  isServersLoading: false,
  isChannelsLoading: false,
  isDirectConversationsLoading: false,
  isMessagesLoading: false,
  serversError: '',
  channelsError: '',
  directConversationsError: '',
  messagesError: '',
}

function resolveActiveId(items, currentId) {
  if (currentId == null) {
    return null
  }

  if (items.some((item) => item.id === currentId)) {
    return currentId
  }

  return null
}

function toTimestamp(value) {
  const date = value ? new Date(value) : null
  return date && !Number.isNaN(date.getTime()) ? date.getTime() : 0
}

function sortDirectConversations(conversations) {
  return [...conversations].sort((leftConversation, rightConversation) => {
    const leftTimestamp = Math.max(
      toTimestamp(leftConversation.last_message_at),
      toTimestamp(leftConversation.updated_at),
      toTimestamp(leftConversation.created_at),
    )
    const rightTimestamp = Math.max(
      toTimestamp(rightConversation.last_message_at),
      toTimestamp(rightConversation.updated_at),
      toTimestamp(rightConversation.created_at),
    )

    if (leftTimestamp !== rightTimestamp) {
      return rightTimestamp - leftTimestamp
    }

    return rightConversation.id - leftConversation.id
  })
}

function buildMessagePreview(message) {
  const content = String(message?.content ?? '').trim()
  if (content) {
    return content.slice(0, 120)
  }

  const attachments = Array.isArray(message?.attachments) ? message.attachments : []
  if (attachments.length === 1) {
    return attachments[0]?.file_name || 'Attachment'
  }

  if (attachments.length > 1) {
    return `${attachments.length} attachments`
  }

  return ''
}

function upsertUniqueMessage(messages, message) {
  return messages.some((item) => item.id === message.id) ? messages : [...messages, message]
}

const useChatStore = create((set) => ({
  ...initialState,
  setServers: (servers) =>
    set((state) => {
      const nextActiveServerId = resolveActiveId(servers, state.activeServerId)

      return {
        servers,
        activeServerId: nextActiveServerId,
        channels: nextActiveServerId == null ? [] : state.channels,
        activeChannelId: nextActiveServerId == null ? null : state.activeChannelId,
        serversError: '',
      }
    }),
  openHome: () =>
    set(() => ({
      activeServerId: null,
      activeChannelId: null,
      activeDirectConversationId: null,
      channels: [],
      messages: [],
      typingUsers: {},
      channelsError: '',
      messagesError: '',
      isChannelsLoading: false,
      isMessagesLoading: false,
    })),
  setActiveServer: (serverId) =>
    set((state) => {
      if (serverId == null) {
        return {
          activeServerId: null,
          activeChannelId: null,
          activeDirectConversationId: null,
          channels: [],
          messages: [],
          typingUsers: {},
          channelsError: '',
          messagesError: '',
          isChannelsLoading: false,
          isMessagesLoading: false,
        }
      }

      const isSameServer = state.activeServerId === serverId

      return {
        activeServerId: serverId,
        activeDirectConversationId: null,
        channels: isSameServer ? state.channels : [],
        activeChannelId: isSameServer ? state.activeChannelId : null,
        channelsError: '',
        messages: isSameServer ? state.messages : [],
        typingUsers: isSameServer ? state.typingUsers : {},
      }
    }),
  setChannels: (channels) =>
    set((state) => ({
      channels,
      activeChannelId: resolveActiveId(channels, state.activeChannelId),
      channelsError: '',
      typingUsers: {},
    })),
  setActiveChannel: (channelId) =>
    set((state) => ({
      activeChannelId: channelId,
      activeDirectConversationId: null,
      messages:
        state.activeChannelId === channelId
          ? state.messages
          : state.messagesByChannel[channelId] ?? [],
      messagesError: '',
      typingUsers: state.activeChannelId === channelId ? state.typingUsers : {},
      lastReadMessageId:
        channelId == null
          ? state.lastReadMessageId
          : {
              ...state.lastReadMessageId,
              [channelId]:
                state.messagesByChannel[channelId]?.[state.messagesByChannel[channelId].length - 1]
                  ?.id ?? state.lastReadMessageId[channelId] ?? null,
            },
    })),
  setDirectConversations: (directConversations) =>
    set((state) => ({
      directConversations: sortDirectConversations(directConversations),
      activeDirectConversationId: resolveActiveId(
        directConversations,
        state.activeDirectConversationId,
      ),
      directConversationsError: '',
    })),
  upsertDirectConversation: (conversation) =>
    set((state) => {
      const existingIndex = state.directConversations.findIndex(
        (item) => item.id === conversation.id,
      )
      const nextDirectConversations = [...state.directConversations]

      if (existingIndex === -1) {
        nextDirectConversations.push(conversation)
      } else {
        nextDirectConversations[existingIndex] = {
          ...nextDirectConversations[existingIndex],
          ...conversation,
        }
      }

      return {
        directConversations: sortDirectConversations(nextDirectConversations),
      }
    }),
  setActiveDirectConversation: (conversationId) =>
    set((state) => ({
      activeServerId: null,
      activeChannelId: null,
      activeDirectConversationId: conversationId,
      messages:
        state.activeDirectConversationId === conversationId
          ? state.messages
          : state.messagesByDirectConversation[conversationId] ?? [],
      messagesError: '',
      typingUsers:
        state.activeDirectConversationId === conversationId ? state.typingUsers : {},
      lastReadDirectMessageId:
        conversationId == null
          ? state.lastReadDirectMessageId
          : {
              ...state.lastReadDirectMessageId,
              [conversationId]:
                state.messagesByDirectConversation[conversationId]?.[
                  state.messagesByDirectConversation[conversationId].length - 1
                ]?.id ?? state.lastReadDirectMessageId[conversationId] ?? null,
            },
    })),
  setServersLoading: (isServersLoading) =>
    set(() => ({
      isServersLoading,
    })),
  setChannelsLoading: (isChannelsLoading) =>
    set(() => ({
      isChannelsLoading,
    })),
  setDirectConversationsLoading: (isDirectConversationsLoading) =>
    set(() => ({
      isDirectConversationsLoading,
    })),
  setServersError: (serversError) =>
    set(() => ({
      serversError,
    })),
  setChannelsError: (channelsError) =>
    set(() => ({
      channelsError,
    })),
  setDirectConversationsError: (directConversationsError) =>
    set(() => ({
      directConversationsError,
    })),
  setMessagesLoading: (isMessagesLoading) =>
    set(() => ({
      isMessagesLoading,
    })),
  setMessagesError: (messagesError) =>
    set(() => ({
      messagesError,
    })),
  upsertServer: (server) =>
    set((state) => {
      const existingIndex = state.servers.findIndex((item) => item.id === server.id)
      const nextServers = [...state.servers]

      if (existingIndex === -1) {
        nextServers.push(server)
      } else {
        nextServers[existingIndex] = {
          ...nextServers[existingIndex],
          ...server,
        }
      }

      return {
        servers: nextServers,
        activeServerId: state.activeServerId ?? server.id,
      }
    }),
  removeServer: (serverId) =>
    set((state) => {
      const nextServers = state.servers.filter((server) => server.id !== serverId)
      const isRemovingActiveServer = state.activeServerId === serverId

      return {
        servers: nextServers,
        activeServerId: isRemovingActiveServer
          ? null
          : resolveActiveId(nextServers, state.activeServerId),
        channels: isRemovingActiveServer ? [] : state.channels,
        activeChannelId: isRemovingActiveServer ? null : state.activeChannelId,
        messages: isRemovingActiveServer ? [] : state.messages,
        messagesByChannel: isRemovingActiveServer ? {} : state.messagesByChannel,
        lastReadMessageId: isRemovingActiveServer ? {} : state.lastReadMessageId,
      }
    }),
  setMessages: (messages) =>
    set((state) => {
      if (state.activeDirectConversationId != null) {
        return {
          messages,
          messagesByDirectConversation: {
            ...state.messagesByDirectConversation,
            [state.activeDirectConversationId]: messages,
          },
          lastReadDirectMessageId: {
            ...state.lastReadDirectMessageId,
            [state.activeDirectConversationId]:
              messages[messages.length - 1]?.id ??
              state.lastReadDirectMessageId[state.activeDirectConversationId] ??
              null,
          },
          messagesError: '',
          typingUsers: {},
        }
      }

      return {
        messages,
        messagesByChannel:
          state.activeChannelId == null
            ? state.messagesByChannel
            : {
                ...state.messagesByChannel,
                [state.activeChannelId]: messages,
              },
        lastReadMessageId:
          state.activeChannelId == null
            ? state.lastReadMessageId
            : {
                ...state.lastReadMessageId,
                [state.activeChannelId]:
                  messages[messages.length - 1]?.id ??
                  state.lastReadMessageId[state.activeChannelId] ??
                  null,
              },
        messagesError: '',
        typingUsers: {},
      }
    }),
  appendMessage: (message) =>
    set((state) => {
      const directConversationId =
        message.direct_conversation_id ?? message.direct_conversation ?? null
      const channelId = message.channel_id ?? message.channel ?? null

      if (directConversationId != null) {
        const nextMessages = upsertUniqueMessage(
          state.messagesByDirectConversation[directConversationId] ?? [],
          message,
        )
        const nextDirectConversations = state.directConversations.map((conversation) =>
          conversation.id === directConversationId
            ? {
                ...conversation,
                last_message_preview: buildMessagePreview(message),
                last_message_at:
                  message.timestamp ?? message.created_at ?? conversation.last_message_at,
                updated_at: message.timestamp ?? message.created_at ?? conversation.updated_at,
              }
            : conversation,
        )

        return {
          messages:
            state.activeDirectConversationId === directConversationId
              ? upsertUniqueMessage(state.messages, message)
              : state.messages,
          messagesByDirectConversation: {
            ...state.messagesByDirectConversation,
            [directConversationId]: nextMessages,
          },
          lastReadDirectMessageId:
            state.activeDirectConversationId === directConversationId
              ? {
                  ...state.lastReadDirectMessageId,
                  [directConversationId]: message.id,
                }
              : state.lastReadDirectMessageId,
          directConversations: sortDirectConversations(nextDirectConversations),
          typingUsers:
            message?.sender?.id == null
              ? state.typingUsers
              : Object.fromEntries(
                  Object.entries(state.typingUsers).filter(
                    ([userId]) => Number(userId) !== message.sender.id,
                  ),
                ),
        }
      }

      if (channelId == null) {
        return state
      }

      return {
        messages:
          state.activeChannelId === channelId
            ? upsertUniqueMessage(state.messages, message)
            : state.messages,
        messagesByChannel: {
          ...state.messagesByChannel,
          [channelId]: upsertUniqueMessage(
            state.messagesByChannel[channelId] ?? [],
            message,
          ),
        },
        lastReadMessageId:
          state.activeChannelId === channelId
            ? {
                ...state.lastReadMessageId,
                [channelId]: message.id,
              }
            : state.lastReadMessageId,
        typingUsers:
          message?.sender?.id == null
            ? state.typingUsers
            : Object.fromEntries(
                Object.entries(state.typingUsers).filter(
                  ([userId]) => Number(userId) !== message.sender.id,
                ),
              ),
      }
    }),
  setTypingState: ({ userId, username, isTyping }) =>
    set((state) => {
      if (!userId) {
        return state
      }

      if (!isTyping) {
        return {
          typingUsers: Object.fromEntries(
            Object.entries(state.typingUsers).filter(
              ([entryUserId]) => Number(entryUserId) !== Number(userId),
            ),
          ),
        }
      }

      return {
        typingUsers: {
          ...state.typingUsers,
          [userId]: username,
        },
      }
    }),
  clearTypingUsers: () =>
    set(() => ({
      typingUsers: {},
    })),
  updateMemberPresence: ({ userId, isOnline }) =>
    set((state) => ({
      servers: state.servers.map((server) => {
        let hasPresenceChange = false
        const nextMembers = (server.members ?? []).map((member) => {
          if (Number(member.id) !== Number(userId) || member.is_online === isOnline) {
            return member
          }

          hasPresenceChange = true
          return {
            ...member,
            is_online: isOnline,
          }
        })

        return hasPresenceChange
          ? {
              ...server,
              members: nextMembers,
            }
          : server
      }),
      directConversations: state.directConversations.map((conversation) =>
        Number(conversation.participant?.id) === Number(userId)
          ? {
              ...conversation,
              participant: {
                ...conversation.participant,
                is_online: isOnline,
              },
            }
          : conversation,
      ),
    })),
  resetChatState: () =>
    set(() => ({
      ...initialState,
    })),
}))

export default useChatStore
