import { create } from 'zustand'

const initialState = {
  servers: [],
  activeServerId: null,
  channels: [],
  activeChannelId: null,
  messages: [],
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
    })),
  setChannels: (channels) =>
    set((state) => ({
      channels,
      activeChannelId: resolveActiveId(channels, state.activeChannelId),
      channelsError: '',
    })),
  setActiveChannel: (channelId) =>
    set((state) => ({
      activeChannelId: channelId,
      messages: state.activeChannelId === channelId ? state.messages : [],
      messagesError: '',
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
    })),
  appendMessage: (message) =>
    set((state) => ({
      messages: state.messages.some((item) => item.id === message.id)
        ? state.messages
        : [...state.messages, message],
    })),
  resetChatState: () =>
    set(() => ({
      ...initialState,
    })),
}))

export default useChatStore
