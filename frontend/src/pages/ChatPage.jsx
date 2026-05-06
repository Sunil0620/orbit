import { useEffect, useMemo, useState } from 'react'
import { listUsersDirectory } from '../api/auth'
import Sidebar from '../components/layout/Sidebar'
import ChannelList from '../components/layout/ChannelList'
import ChatWindow from '../components/chat/ChatWindow'
import MemberList from '../components/layout/MemberList'
import CreateServerModal from '../components/server/CreateServerModal'
import CreateChannelModal from '../components/server/CreateChannelModal'
import JoinServerModal from '../components/server/JoinServerModal'
import {
  createOrOpenDirectConversation,
  listDirectConversations,
} from '../api/directConversations'
import { deleteChannel, listChannels, listServers } from '../api/servers'
import extractApiErrors from '../utils/extractApiErrors'
import useAuthStore from '../store/useAuthStore'
import useChatStore from '../store/useChatStore'

function MobilePaneButton({ label, isActive = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      className={[
        'min-w-0 truncate rounded-[0.95rem] border px-2 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] transition sm:px-3 sm:text-[11px] sm:tracking-[0.18em]',
        isActive
          ? 'orbit-accent-surface'
          : 'border-[color:var(--orbit-border)] bg-[var(--orbit-surface-soft)] text-[var(--orbit-text-muted)] hover:border-[color:var(--orbit-border-strong)] hover:bg-[var(--orbit-surface-hover)] hover:text-[var(--orbit-text)]',
      ].join(' ')}
    >
      {label}
    </button>
  )
}

function ChatPage() {
  const user = useAuthStore((state) => state.user)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isCreateChannelModalOpen, setIsCreateChannelModalOpen] = useState(false)
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false)
  const [actionNotice, setActionNotice] = useState('')
  const [mobilePane, setMobilePane] = useState('browse')
  const [directoryUsers, setDirectoryUsers] = useState([])
  const [isDirectoryLoading, setIsDirectoryLoading] = useState(false)
  const [directoryError, setDirectoryError] = useState('')
  const servers = useChatStore((state) => state.servers)
  const activeServerId = useChatStore((state) => state.activeServerId)
  const channels = useChatStore((state) => state.channels)
  const activeChannelId = useChatStore((state) => state.activeChannelId)
  const directConversations = useChatStore((state) => state.directConversations)
  const activeDirectConversationId = useChatStore(
    (state) => state.activeDirectConversationId,
  )
  const isServersLoading = useChatStore((state) => state.isServersLoading)
  const isChannelsLoading = useChatStore((state) => state.isChannelsLoading)
  const isDirectConversationsLoading = useChatStore(
    (state) => state.isDirectConversationsLoading,
  )
  const serversError = useChatStore((state) => state.serversError)
  const channelsError = useChatStore((state) => state.channelsError)
  const directConversationsError = useChatStore(
    (state) => state.directConversationsError,
  )
  const setServers = useChatStore((state) => state.setServers)
  const openHome = useChatStore((state) => state.openHome)
  const setActiveServer = useChatStore((state) => state.setActiveServer)
  const setChannels = useChatStore((state) => state.setChannels)
  const setActiveChannel = useChatStore((state) => state.setActiveChannel)
  const setDirectConversations = useChatStore((state) => state.setDirectConversations)
  const setActiveDirectConversation = useChatStore(
    (state) => state.setActiveDirectConversation,
  )
  const setServersLoading = useChatStore((state) => state.setServersLoading)
  const setChannelsLoading = useChatStore((state) => state.setChannelsLoading)
  const setDirectConversationsLoading = useChatStore(
    (state) => state.setDirectConversationsLoading,
  )
  const setServersError = useChatStore((state) => state.setServersError)
  const setChannelsError = useChatStore((state) => state.setChannelsError)
  const setDirectConversationsError = useChatStore(
    (state) => state.setDirectConversationsError,
  )
  const upsertServer = useChatStore((state) => state.upsertServer)
  const upsertDirectConversation = useChatStore(
    (state) => state.upsertDirectConversation,
  )
  const setMessages = useChatStore((state) => state.setMessages)
  const setMessagesError = useChatStore((state) => state.setMessagesError)
  const setMessagesLoading = useChatStore((state) => state.setMessagesLoading)

  useEffect(() => {
    if (!actionNotice) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      setActionNotice('')
    }, 3600)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [actionNotice])

  const activeServer = useMemo(
    () => servers.find((server) => server.id === activeServerId) ?? null,
    [servers, activeServerId],
  )
  const activeDirectConversation = useMemo(
    () =>
      directConversations.find(
        (conversation) => conversation.id === activeDirectConversationId,
      ) ?? null,
    [activeDirectConversationId, directConversations],
  )
  const directMessageMode = activeServerId == null
  const homeMode = directMessageMode && activeDirectConversation == null
  const canManageChannels = Boolean(activeServer?.permissions?.can_manage_channels)
  const canInviteMembers = Boolean(activeServer?.permissions?.can_invite_members)
  const mobileBrowseLabel = directMessageMode ? 'Inbox' : 'Channels'
  const mobileChatLabel = 'Chat'
  const mobilePeopleLabel = directMessageMode ? 'People' : 'Members'

  useEffect(() => {
    if (activeDirectConversationId != null || activeChannelId != null) {
      setMobilePane('chat')
      return
    }

    if (activeServerId != null) {
      setMobilePane('browse')
    }
  }, [activeChannelId, activeDirectConversationId, activeServerId])

  const friendContacts = useMemo(() => {
    const contactsById = new Map()

    servers.forEach((server) => {
      ;(server.members ?? []).forEach((member) => {
        if (Number(member.id) === Number(user?.id)) {
          return
        }

        const existingContact = contactsById.get(member.id)
        const sharedServers = existingContact?.sharedServers ?? []

        if (!sharedServers.includes(server.name)) {
          sharedServers.push(server.name)
        }

        contactsById.set(member.id, {
          ...existingContact,
          ...member,
          sharedServers,
        })
      })
    })

    return Array.from(contactsById.values()).sort((leftContact, rightContact) => {
      if (leftContact.is_online !== rightContact.is_online) {
        return leftContact.is_online ? -1 : 1
      }

      return leftContact.username.localeCompare(rightContact.username)
    })
  }, [servers, user?.id])
  const friendContactsById = useMemo(
    () =>
      new Map(friendContacts.map((contact) => [Number(contact.id), contact])),
    [friendContacts],
  )
  const directConversationIdsByParticipant = useMemo(
    () =>
      new Set(
        directConversations.map((conversation) => Number(conversation.participant?.id)),
      ),
    [directConversations],
  )
  const directoryContacts = useMemo(
    () =>
      directoryUsers.map((directoryUser) => {
        const sharedContact = friendContactsById.get(Number(directoryUser.id))

        return {
          ...sharedContact,
          ...directoryUser,
          sharedServers: sharedContact?.sharedServers ?? [],
          hasDirectConversation: directConversationIdsByParticipant.has(
            Number(directoryUser.id),
          ),
        }
      }),
    [directoryUsers, directConversationIdsByParticipant, friendContactsById],
  )
  const activeChannel = useMemo(
    () => channels.find((channel) => channel.id === activeChannelId) ?? null,
    [channels, activeChannelId],
  )
  const unreadCountByChannel = useMemo(
    () =>
      Object.fromEntries(
        channels.map((channel) => {
          return [
            channel.id,
            channel.id === activeChannelId ? 0 : Number(channel.unread_count ?? 0),
          ]
        }),
      ),
    [activeChannelId, channels],
  )

  useEffect(() => {
    if (!user?.id) {
      setServers([])
      setServersError('')
      setServersLoading(false)
      setDirectConversations([])
      setDirectConversationsError('')
      setDirectConversationsLoading(false)
      setDirectoryUsers([])
      setDirectoryError('')
      setIsDirectoryLoading(false)
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
  }, [
    setDirectConversations,
    setDirectConversationsError,
    setDirectConversationsLoading,
    setServers,
    setServersError,
    setServersLoading,
    user?.id,
  ])

  useEffect(() => {
    if (!user?.id) {
      return undefined
    }

    let ignore = false

    async function loadDirectory({ silent = false } = {}) {
      if (!silent) {
        setIsDirectoryLoading(true)
      }
      setDirectoryError('')

      try {
        const nextDirectoryUsers = await listUsersDirectory()

        if (ignore) {
          return
        }

        setDirectoryUsers(nextDirectoryUsers)
      } catch {
        if (ignore) {
          return
        }

        setDirectoryError('People are unavailable right now.')
        setDirectoryUsers([])
      } finally {
        if (!ignore && !silent) {
          setIsDirectoryLoading(false)
        }
      }
    }

    loadDirectory()

    const intervalId = window.setInterval(() => {
      void loadDirectory({ silent: true })
    }, 30000)

    const handleRefresh = () => {
      if (document.visibilityState === 'visible') {
        void loadDirectory({ silent: true })
      }
    }

    window.addEventListener('focus', handleRefresh)
    document.addEventListener('visibilitychange', handleRefresh)

    return () => {
      ignore = true
      window.clearInterval(intervalId)
      window.removeEventListener('focus', handleRefresh)
      document.removeEventListener('visibilitychange', handleRefresh)
    }
  }, [user?.id])

  useEffect(() => {
    if (!user?.id) {
      return undefined
    }

    let ignore = false

    async function loadDirectConversations({ silent = false } = {}) {
      if (!silent) {
        setDirectConversationsLoading(true)
      }
      setDirectConversationsError('')

      try {
        const nextConversations = await listDirectConversations()

        if (ignore) {
          return
        }

        setDirectConversations(nextConversations)
      } catch (error) {
        if (ignore) {
          return
        }

        setDirectConversationsError(
          extractApiErrors(error).form ??
            'Unable to load your direct messages right now.',
        )
        setDirectConversations([])
      } finally {
        if (!ignore && !silent) {
          setDirectConversationsLoading(false)
        }
      }
    }

    loadDirectConversations()

    const intervalId = window.setInterval(() => {
      void loadDirectConversations({ silent: true })
    }, 15000)

    const handleRefresh = () => {
      if (document.visibilityState === 'visible') {
        void loadDirectConversations({ silent: true })
      }
    }

    window.addEventListener('focus', handleRefresh)
    document.addEventListener('visibilitychange', handleRefresh)

    return () => {
      ignore = true
      window.clearInterval(intervalId)
      window.removeEventListener('focus', handleRefresh)
      document.removeEventListener('visibilitychange', handleRefresh)
    }
  }, [
    setDirectConversations,
    setDirectConversationsError,
    setDirectConversationsLoading,
    user?.id,
  ])

  useEffect(() => {
    if (!activeServerId) {
      setChannels([])
      setChannelsError('')
      setChannelsLoading(false)
      if (activeDirectConversationId == null) {
        setMessages([])
        setMessagesError('')
        setMessagesLoading(false)
      }
      return
    }

    let ignore = false

    async function loadChannels({ silent = false } = {}) {
      if (!silent) {
        setChannelsLoading(true)
      }
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
        if (!ignore && !silent) {
          setChannelsLoading(false)
        }
      }
    }

    loadChannels()

    const intervalId = window.setInterval(() => {
      void loadChannels({ silent: true })
    }, 15000)

    const handleRefresh = () => {
      if (document.visibilityState === 'visible') {
        void loadChannels({ silent: true })
      }
    }

    window.addEventListener('focus', handleRefresh)
    document.addEventListener('visibilitychange', handleRefresh)

    return () => {
      ignore = true
      window.clearInterval(intervalId)
      window.removeEventListener('focus', handleRefresh)
      document.removeEventListener('visibilitychange', handleRefresh)
    }
  }, [
    activeDirectConversationId,
    activeServerId,
    setChannels,
    setChannelsError,
    setChannelsLoading,
    setMessages,
    setMessagesError,
    setMessagesLoading,
  ])

  const handleDeleteChannel = async (channel) => {
    if (!activeServer?.id) {
      return
    }

    if (!window.confirm(`Delete #${channel.name}?`)) {
      return
    }

    setChannelsLoading(true)
    setChannelsError('')

    try {
      await deleteChannel(channel.id)
      const nextChannels = await listChannels(activeServer.id)
      setChannels(nextChannels)
      setActionNotice(`Deleted #${channel.name} from ${activeServer.name}.`)
    } catch (error) {
      setChannelsError(
        extractApiErrors(error).form ?? 'Unable to delete the selected channel.',
      )
    } finally {
      setChannelsLoading(false)
    }
  }

  const handleCopyInviteCode = async () => {
    if (!canInviteMembers || !activeServer?.invite_code || !navigator?.clipboard) {
      return
    }

    try {
      await navigator.clipboard.writeText(activeServer.invite_code)
      setActionNotice(`Invite code for ${activeServer.name} copied to your clipboard.`)
    } catch {
      setActionNotice('Unable to copy the invite code right now.')
    }
  }

  const handleOpenHome = () => {
    openHome()
    setMobilePane('chat')
  }

  const handleSelectServer = (serverId) => {
    setActiveServer(serverId)
    setMobilePane('browse')
  }

  const handleSelectChannel = (channelId) => {
    setActiveChannel(channelId)
    setMobilePane('chat')
  }

  const handleSelectDirectConversation = (conversationId) => {
    setActiveDirectConversation(conversationId)
    setMobilePane('chat')
  }

  const handleOpenDirectConversation = async (contact) => {
    if (!contact?.id) {
      return
    }

    const existingConversation = directConversations.find(
      (conversation) => Number(conversation.participant?.id) === Number(contact.id),
    )

    if (existingConversation) {
      setActiveDirectConversation(existingConversation.id)
      setMobilePane('chat')
      return
    }

    setDirectConversationsError('')
    setDirectConversationsLoading(true)

    try {
      const conversation = await createOrOpenDirectConversation(contact.id)
      upsertDirectConversation(conversation)
      setActiveDirectConversation(conversation.id)
      setMobilePane('chat')
      setActionNotice(`Opened a direct message with ${contact.username}.`)
    } catch (error) {
      setDirectConversationsError(
        extractApiErrors(error).form ??
          'Unable to open a direct message with that person.',
      )
    } finally {
      setDirectConversationsLoading(false)
    }
  }

  return (
    <div className="orbit-workspace relative flex h-full min-h-0 w-full min-w-0 flex-1 flex-col">
      {actionNotice || serversError ? (
        <div className="pointer-events-none absolute right-3 top-3 z-20 space-y-2">
          {actionNotice ? (
            <div className="orbit-success-banner w-[min(24rem,calc(100vw-2rem))] rounded-2xl border px-4 py-3 text-sm shadow-[0_18px_32px_rgba(0,0,0,0.22)] backdrop-blur">
              {actionNotice}
            </div>
          ) : null}

          {serversError ? (
            <div className="orbit-danger-banner w-[min(24rem,calc(100vw-2rem))] rounded-2xl border px-4 py-3 text-sm shadow-[0_18px_32px_rgba(0,0,0,0.22)] backdrop-blur">
              {serversError}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="flex h-full min-h-0 flex-1 overflow-hidden rounded-[1.2rem] border border-[color:var(--orbit-border)] bg-[var(--orbit-shell-bg)] shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
        <div className="flex h-full w-full min-w-0 flex-col bg-[var(--orbit-shell-bg)] xl:grid xl:grid-cols-[64px_236px_minmax(0,1fr)_220px] xl:grid-rows-1 2xl:grid-cols-[68px_248px_minmax(0,1fr)_228px]">
          <div className="sticky top-0 z-20 flex shrink-0 flex-col bg-[var(--orbit-shell-bg)] shadow-[0_8px_18px_rgba(0,0,0,0.08)] xl:contents xl:shadow-none">
            <Sidebar
              servers={servers}
              activeServerId={activeServerId}
              user={user}
              isHomeActive={directMessageMode}
              onOpenHome={handleOpenHome}
              onSelectServer={handleSelectServer}
              onOpenCreate={() => setIsCreateModalOpen(true)}
              onOpenJoin={() => setIsJoinModalOpen(true)}
              isLoading={isServersLoading}
              emptyMessage="No servers yet. Create or join one next."
            />
            <div className="min-w-0 border-b border-[color:var(--orbit-border)] bg-[var(--orbit-shell-bg)] px-2.5 py-2 backdrop-blur xl:hidden">
              <div className="grid min-w-0 grid-cols-3 gap-2">
                <MobilePaneButton
                  label={mobileBrowseLabel}
                  isActive={mobilePane === 'browse'}
                  onClick={() => setMobilePane('browse')}
                />
                <MobilePaneButton
                  label={mobileChatLabel}
                  isActive={mobilePane === 'chat'}
                  onClick={() => setMobilePane('chat')}
                />
                <MobilePaneButton
                  label={mobilePeopleLabel}
                  isActive={mobilePane === 'people'}
                  onClick={() => setMobilePane('people')}
                />
              </div>
            </div>
          </div>
          <ChannelList
            key={directMessageMode ? 'direct-inbox' : activeServer?.id ?? 'empty-server'}
            server={activeServer}
            homeMode={directMessageMode}
            directConversations={directConversations}
            activeDirectConversationId={activeDirectConversationId}
            channels={channels}
            activeChannelId={activeChannelId}
            unreadCountByChannel={unreadCountByChannel}
            onSelectChannel={handleSelectChannel}
            onSelectDirectConversation={handleSelectDirectConversation}
            onOpenCreateChannel={() => setIsCreateChannelModalOpen(true)}
            onDeleteChannel={handleDeleteChannel}
            onCopyInviteCode={handleCopyInviteCode}
            settingsHref={activeServer ? `/app/servers/${activeServer.id}/settings` : null}
            canManageChannels={canManageChannels}
            canInviteMembers={canInviteMembers}
            isLoading={directMessageMode ? isDirectConversationsLoading : isChannelsLoading}
            error={directMessageMode ? directConversationsError : channelsError}
            isMobileVisible={mobilePane === 'browse'}
          />
          <ChatWindow
            server={activeServer}
            channel={activeChannel}
            directConversation={activeDirectConversation}
            directConversations={directConversations}
            homeMode={homeMode}
            isMobileVisible={mobilePane === 'chat'}
          />
          <MemberList
            server={activeServer}
            directConversation={activeDirectConversation}
            homeMode={homeMode}
            contacts={homeMode ? directoryContacts : friendContacts}
            isLoading={homeMode ? isDirectoryLoading : false}
            error={homeMode ? directoryError : ''}
            onOpenContact={handleOpenDirectConversation}
            isMobileVisible={mobilePane === 'people'}
          />
        </div>
      </div>

      <CreateServerModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={(server) => {
          upsertServer(server)
          handleSelectServer(server.id)
          setActionNotice(`Created ${server.name} and set it as your active server.`)
        }}
      />

      <CreateChannelModal
        isOpen={isCreateChannelModalOpen}
        onClose={() => setIsCreateChannelModalOpen(false)}
        server={activeServer}
        onSuccess={(channel) => {
          setChannels([...channels, channel])
          handleSelectChannel(channel.id)
          setActionNotice(`Created #${channel.name} in ${activeServer?.name ?? 'your server'}.`)
        }}
      />

      <JoinServerModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        onSuccess={(server) => {
          upsertServer(server)
          handleSelectServer(server.id)
          setActionNotice(`Joined ${server.name} and switched into it.`)
        }}
      />
    </div>
  )
}

export default ChatPage
