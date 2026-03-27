import { create } from 'zustand'

const initialState = {
  servers: [],
  activeServerId: null,
  channels: [],
  activeChannelId: null,
  messages: [],
  messagesByChannel: {},
  lastReadMessageId: {},
  typingUsers: {},
  isServersLoading: false,
  isChannelsLoading: false,
  isMessagesLoading: false,
  serversError: '',
  channelsError: '',
  messagesError: '',
}

function resolveActiveId(items, currentId) {
  if (items.some((item) => item.id === currentId)) {
    return currentId
  }

  return items[0]?.id ?? null
}

const useChatStore = create((set) => ({
  ...initialState,
  setServers: (servers) =>
    set((state) => ({
      servers,
      activeServerId: resolveActiveId(servers, state.activeServerId),
      channels: servers.length > 0 ? state.channels : [],
      activeChannelId: servers.length > 0 ? state.activeChannelId : null,
      serversError: '',
    })),
  setActiveServer: (serverId) =>
    set((state) => ({
      activeServerId: serverId,
      channels: state.activeServerId === serverId ? state.channels : [],
      activeChannelId: state.activeServerId === serverId ? state.activeChannelId : null,
      channelsError: '',
      messages: state.activeServerId === serverId ? state.messages : [],
      typingUsers: state.activeServerId === serverId ? state.typingUsers : {},
    })),
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
  setServersLoading: (isServersLoading) =>
    set(() => ({
      isServersLoading,
    })),
  setChannelsLoading: (isChannelsLoading) =>
    set(() => ({
      isChannelsLoading,
    })),
  setServersError: (serversError) =>
    set(() => ({
      serversError,
    })),
  setChannelsError: (channelsError) =>
    set(() => ({
      channelsError,
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
          ? nextServers[0]?.id ?? null
          : resolveActiveId(nextServers, state.activeServerId),
        channels: isRemovingActiveServer ? [] : state.channels,
        activeChannelId: isRemovingActiveServer ? null : state.activeChannelId,
        messages: isRemovingActiveServer ? [] : state.messages,
        messagesByChannel: isRemovingActiveServer ? {} : state.messagesByChannel,
        lastReadMessageId: isRemovingActiveServer ? {} : state.lastReadMessageId,
      }
    }),
  setMessages: (messages) =>
    set((state) => ({
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
    })),
  appendMessage: (message) =>
    set((state) => ({
      messages:
        state.activeChannelId === message.channel_id
          ? state.messages.some((item) => item.id === message.id)
            ? state.messages
            : [...state.messages, message]
          : state.messages,
      messagesByChannel: {
        ...state.messagesByChannel,
        [message.channel_id]: (state.messagesByChannel[message.channel_id] ?? []).some(
          (item) => item.id === message.id,
        )
          ? state.messagesByChannel[message.channel_id] ?? []
          : [...(state.messagesByChannel[message.channel_id] ?? []), message],
      },
      lastReadMessageId:
        state.activeChannelId === message.channel_id
          ? {
              ...state.lastReadMessageId,
              [message.channel_id]: message.id,
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
    })),
  resetChatState: () =>
    set(() => ({
      ...initialState,
    })),
}))

export default useChatStore
