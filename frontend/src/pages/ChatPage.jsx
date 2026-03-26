import { useEffect, useMemo, useState } from 'react'
import Sidebar from '../components/layout/Sidebar'
import ChannelList from '../components/layout/ChannelList'
import ChatWindow from '../components/chat/ChatWindow'
import MemberList from '../components/layout/MemberList'
import CreateServerModal from '../components/server/CreateServerModal'
import JoinServerModal from '../components/server/JoinServerModal'
import { listChannels, listServers } from '../api/servers'
import extractApiErrors from '../utils/extractApiErrors'
import useAuthStore from '../store/useAuthStore'
import useChatStore from '../store/useChatStore'

function ChatPage() {
  const user = useAuthStore((state) => state.user)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false)
  const [actionNotice, setActionNotice] = useState('')
  const servers = useChatStore((state) => state.servers)
  const activeServerId = useChatStore((state) => state.activeServerId)
  const channels = useChatStore((state) => state.channels)
  const activeChannelId = useChatStore((state) => state.activeChannelId)
  const isServersLoading = useChatStore((state) => state.isServersLoading)
  const isChannelsLoading = useChatStore((state) => state.isChannelsLoading)
  const serversError = useChatStore((state) => state.serversError)
  const channelsError = useChatStore((state) => state.channelsError)
  const setServers = useChatStore((state) => state.setServers)
  const setActiveServer = useChatStore((state) => state.setActiveServer)
  const setChannels = useChatStore((state) => state.setChannels)
  const setActiveChannel = useChatStore((state) => state.setActiveChannel)
  const setServersLoading = useChatStore((state) => state.setServersLoading)
  const setChannelsLoading = useChatStore((state) => state.setChannelsLoading)
  const setServersError = useChatStore((state) => state.setServersError)
  const setChannelsError = useChatStore((state) => state.setChannelsError)
  const upsertServer = useChatStore((state) => state.upsertServer)
  const setMessages = useChatStore((state) => state.setMessages)
  const setMessagesError = useChatStore((state) => state.setMessagesError)
  const setMessagesLoading = useChatStore((state) => state.setMessagesLoading)

  const activeServer = useMemo(
    () => servers.find((server) => server.id === activeServerId) ?? null,
    [servers, activeServerId],
  )
  const activeChannel = useMemo(
    () => channels.find((channel) => channel.id === activeChannelId) ?? null,
    [channels, activeChannelId],
  )

  useEffect(() => {
    if (!user?.id) {
      setServers([])
      setServersError('')
      setServersLoading(false)
      return undefined
    }

    let ignore = false

    async function loadServers() {
      setServersLoading(true)
      setServersError('')

      try {
        const nextServers = await listServers()

        if (ignore) {
          return
        }

        setServers(nextServers)
      } catch (error) {
        if (ignore) {
          return
        }

        setServersError(
          extractApiErrors(error).form ?? 'Unable to load servers right now.',
        )
        setServers([])
      } finally {
        if (!ignore) {
          setServersLoading(false)
        }
      }
    }

    loadServers()

    return () => {
      ignore = true
    }
  }, [setServers, setServersError, setServersLoading, user?.id])

  useEffect(() => {
    if (!activeServerId) {
      setChannels([])
      setChannelsError('')
      setChannelsLoading(false)
      setMessages([])
      setMessagesError('')
      setMessagesLoading(false)
      return
    }

    let ignore = false

    async function loadChannels() {
      setChannelsLoading(true)
      setChannelsError('')

      try {
        const nextChannels = await listChannels(activeServerId)

        if (ignore) {
          return
        }

        setChannels(nextChannels)
      } catch (error) {
        if (ignore) {
          return
        }

        setChannelsError(
          extractApiErrors(error).form ?? 'Unable to load channels right now.',
        )
        setChannels([])
      } finally {
        if (!ignore) {
          setChannelsLoading(false)
        }
      }
    }

    loadChannels()

    return () => {
      ignore = true
    }
  }, [
    activeServerId,
    setChannels,
    setChannelsError,
    setChannelsLoading,
    setMessages,
    setMessagesError,
    setMessagesLoading,
  ])

  return (
    <div className="space-y-5">
      <div className="rounded-[2rem] border border-cyan-300/20 bg-cyan-400/10 px-5 py-4 text-sm text-cyan-50">
        Logged in as <span className="font-semibold">{user?.username ?? 'orbit-user'}</span>.
        Server and channel state now hydrates from the backend.
      </div>

      {actionNotice ? (
        <div className="rounded-[2rem] border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-100">
          {actionNotice}
        </div>
      ) : null}

      {serversError ? (
        <div className="rounded-[2rem] border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-100">
          {serversError}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[84px_280px_minmax(0,1fr)_260px]">
        <Sidebar
          servers={servers}
          activeServerId={activeServerId}
          onSelectServer={setActiveServer}
          onOpenCreate={() => setIsCreateModalOpen(true)}
          onOpenJoin={() => setIsJoinModalOpen(true)}
          isLoading={isServersLoading}
          emptyMessage="No servers yet. Create or join one next."
        />
        <ChannelList
          server={activeServer}
          channels={channels}
          activeChannelId={activeChannelId}
          onSelectChannel={setActiveChannel}
          settingsHref={activeServer ? `/app/servers/${activeServer.id}/settings` : null}
          isLoading={isChannelsLoading}
          error={channelsError}
        />
        <ChatWindow server={activeServer} channel={activeChannel} />
        <MemberList server={activeServer} />
      </div>

      <CreateServerModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={(server) => {
          upsertServer(server)
          setActiveServer(server.id)
          setActionNotice(`Created ${server.name} and set it as your active server.`)
        }}
      />

      <JoinServerModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        onSuccess={(server) => {
          upsertServer(server)
          setActiveServer(server.id)
          setActionNotice(`Joined ${server.name} and switched into it.`)
        }}
      />
    </div>
  )
}

export default ChatPage
