import { create } from 'zustand'

const initialState = {
  servers: [],
  activeServerId: null,
  channels: [],
  activeChannelId: null,
  messages: [],
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
      messages: state.activeChannelId === channelId ? state.messages : [],
      messagesError: '',
      typingUsers: state.activeChannelId === channelId ? state.typingUsers : {},
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
      }
    }),
  setMessages: (messages) =>
    set(() => ({
      messages,
      messagesError: '',
      typingUsers: {},
    })),
  appendMessage: (message) =>
    set((state) => ({
      messages: state.messages.some((item) => item.id === message.id)
        ? state.messages
        : [...state.messages, message],
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
  resetChatState: () =>
    set(() => ({
      ...initialState,
    })),
}))

export default useChatStore
