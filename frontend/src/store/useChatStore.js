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
  const clientId = message?.client_id
  const existingIndex = messages.findIndex(
    (item) =>
      item.id === message.id ||
      (clientId && item.client_id === clientId),
  )

  if (existingIndex === -1) {
    return [...messages, message]
  }

  const nextMessages = [...messages]
  nextMessages[existingIndex] = {
    ...nextMessages[existingIndex],
    ...message,
    is_pending: false,
  }
  return nextMessages
}

function updateMessageCollectionReactions(messages, messageId, reactions) {
  let hasChanged = false

  const nextMessages = messages.map((message) => {
    if (message.id !== messageId) {
      return message
    }

    hasChanged = true
    return {
      ...message,
      reactions,
    }
  })

  return hasChanged ? nextMessages : messages
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
    set((state) => {
      if (
        channels.length === 0 &&
        state.activeServerId != null &&
        state.channels.length > 0
      ) {
        return {
          channelsError: '',
          typingUsers: {},
        }
      }

      const nextActiveChannelId =
        resolveActiveId(channels, state.activeChannelId) ?? channels[0]?.id ?? null

      return {
        channels: channels.map((channel) =>
          channel.id === nextActiveChannelId
            ? {
                ...channel,
                unread_count: 0,
              }
            : channel,
        ),
        activeChannelId: nextActiveChannelId,
        messages:
          nextActiveChannelId == null
            ? []
            : state.activeChannelId === nextActiveChannelId
              ? state.messages
              : state.messagesByChannel[nextActiveChannelId] ?? [],
        channelsError: '',
        typingUsers: {},
      }
    }),
  setActiveChannel: (channelId) =>
    set((state) => ({
      activeChannelId: channelId,
      activeDirectConversationId: null,
      channels: state.channels.map((channel) =>
        channel.id === channelId
          ? {
              ...channel,
              unread_count: 0,
            }
          : channel,
      ),
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
      directConversations: sortDirectConversations(
        directConversations.map((conversation) =>
          conversation.id === state.activeDirectConversationId
            ? {
                ...conversation,
                unread_count: 0,
              }
            : conversation,
        ),
      ),
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
      directConversations: sortDirectConversations(
        state.directConversations.map((conversation) =>
          conversation.id === conversationId
            ? {
                ...conversation,
                unread_count: 0,
              }
            : conversation,
        ),
      ),
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
          directConversations: state.directConversations.map((conversation) =>
            conversation.id === state.activeDirectConversationId
              ? {
                  ...conversation,
                  unread_count: 0,
                }
              : conversation,
          ),
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
        channels:
          state.activeChannelId == null
            ? state.channels
            : state.channels.map((channel) =>
                channel.id === state.activeChannelId
                  ? {
                      ...channel,
                      unread_count: 0,
                    }
                  : channel,
              ),
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
        const existingMessages = state.messagesByDirectConversation[directConversationId] ?? []
        const nextMessages = upsertUniqueMessage(
          existingMessages,
          message,
        )
        const didAppendNewMessage = nextMessages.length > existingMessages.length
        const nextDirectConversations = state.directConversations.map((conversation) =>
          conversation.id === directConversationId
            ? {
                ...conversation,
                last_message_preview: buildMessagePreview(message),
                last_message_at:
                  message.timestamp ?? message.created_at ?? conversation.last_message_at,
                updated_at: message.timestamp ?? message.created_at ?? conversation.updated_at,
                message_count: didAppendNewMessage
                  ? Number(conversation.message_count ?? 0) + 1
                  : conversation.message_count,
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
          directConversations: sortDirectConversations(
            nextDirectConversations.map((conversation) =>
              conversation.id === directConversationId &&
              state.activeDirectConversationId === directConversationId
                ? {
                    ...conversation,
                    unread_count: 0,
                  }
                : conversation,
            ),
          ),
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
        channels: state.channels.map((channel) =>
          channel.id === channelId && state.activeChannelId === channelId
            ? {
                ...channel,
                unread_count: 0,
              }
            : channel,
        ),
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
  setMessageReactions: ({ messageId, reactions }) =>
    set((state) => ({
      messages: updateMessageCollectionReactions(state.messages, messageId, reactions),
      messagesByChannel: Object.fromEntries(
        Object.entries(state.messagesByChannel).map(([channelId, channelMessages]) => [
          channelId,
          updateMessageCollectionReactions(channelMessages, messageId, reactions),
        ]),
      ),
      messagesByDirectConversation: Object.fromEntries(
        Object.entries(state.messagesByDirectConversation).map(
          ([conversationId, conversationMessages]) => [
            conversationId,
            updateMessageCollectionReactions(conversationMessages, messageId, reactions),
          ],
        ),
      ),
    })),
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
  markChannelRead: ({ channelId, lastReadMessageId = null }) =>
    set((state) => ({
      channels: state.channels.map((channel) =>
        channel.id === channelId
          ? {
              ...channel,
              unread_count: 0,
            }
          : channel,
      ),
      lastReadMessageId:
        channelId == null
          ? state.lastReadMessageId
          : {
              ...state.lastReadMessageId,
              [channelId]: lastReadMessageId ?? state.lastReadMessageId[channelId] ?? null,
            },
    })),
  markDirectConversationRead: ({ conversationId, lastReadMessageId = null }) =>
    set((state) => ({
      directConversations: sortDirectConversations(
        state.directConversations.map((conversation) =>
          conversation.id === conversationId
            ? {
                ...conversation,
                unread_count: 0,
              }
            : conversation,
        ),
      ),
      lastReadDirectMessageId:
        conversationId == null
          ? state.lastReadDirectMessageId
          : {
              ...state.lastReadDirectMessageId,
              [conversationId]:
                lastReadMessageId ??
                state.lastReadDirectMessageId[conversationId] ??
                null,
            },
    })),
  syncDirectConversation: (conversation) =>
    set((state) => {
      const existingIndex = state.directConversations.findIndex(
        (item) => item.id === conversation.id,
      )

      if (existingIndex === -1) {
        return {
          directConversations: sortDirectConversations([
            ...state.directConversations,
            conversation,
          ]),
        }
      }

      const nextDirectConversations = [...state.directConversations]
      nextDirectConversations[existingIndex] = {
        ...nextDirectConversations[existingIndex],
        ...conversation,
      }

      return {
        directConversations: sortDirectConversations(nextDirectConversations),
      }
    }),
  resetChatState: () =>
    set(() => ({
      ...initialState,
    })),
}))

export default useChatStore
