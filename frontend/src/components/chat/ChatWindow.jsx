import { useEffect, useMemo, useRef, useState } from 'react'
import { listMessages, toggleMessageReaction } from '../../api/messages'
import {
  markChannelRead as persistChannelRead,
  markDirectConversationRead as persistDirectConversationRead,
} from '../../api/notifications'
import useWebSocket from '../../hooks/useWebSocket'
import useAuthStore from '../../store/useAuthStore'
import useChatStore from '../../store/useChatStore'
import extractApiErrors from '../../utils/extractApiErrors'
import formatDate, { formatMessageDayLabel } from '../../utils/formatDate'
import MessageBubble from './MessageBubble'
import MessageInput from './MessageInput'
import MessageSkeleton from './MessageSkeleton'

const MESSAGE_GROUP_WINDOW_MS = 5 * 60 * 1000

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  )
}

function StatusDot({ isOnline = false }) {
  return (
    <span
      className={[
        'inline-block h-2.5 w-2.5 rounded-full',
        isOnline ? 'bg-emerald-400 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]' : 'bg-slate-500',
      ].join(' ')}
    />
  )
}

function IconButton({ children, label, onClick, isActive = false }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={[
        'orbit-secondary-button rounded-lg p-2 transition',
        isActive ? 'border-cyan-300/40 bg-cyan-400/10 text-cyan-100' : '',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

function getInitials(name) {
  if (!name) {
    return 'OR'
  }

  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function getAvatarLabel(contact) {
  if (contact?.avatar) {
    return (
      <img
        src={contact.avatar}
        alt={contact.username}
        className="h-full w-full rounded-2xl object-cover"
      />
    )
  }

  return getInitials(contact?.username)
}

function getDirectoryContextLabel(contact) {
  if (Array.isArray(contact?.sharedServers) && contact.sharedServers.length > 0) {
    return `Shared in ${contact.sharedServers[0]}${
      contact.sharedServers.length > 1 ? ` +${contact.sharedServers.length - 1}` : ''
    }`
  }

  const sharedServerCount = Number(contact?.shared_server_count ?? 0)
  if (sharedServerCount > 0) {
    return `Shared in ${sharedServerCount} server${sharedServerCount === 1 ? '' : 's'}`
  }

  return 'No shared server'
}

function toTimestamp(value) {
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.getTime()
}

function isSameCalendarDay(leftValue, rightValue) {
  const leftDate = leftValue instanceof Date ? leftValue : new Date(leftValue)
  const rightDate = rightValue instanceof Date ? rightValue : new Date(rightValue)

  if (Number.isNaN(leftDate.getTime()) || Number.isNaN(rightDate.getTime())) {
    return false
  }

  return (
    leftDate.getFullYear() === rightDate.getFullYear() &&
    leftDate.getMonth() === rightDate.getMonth() &&
    leftDate.getDate() === rightDate.getDate()
  )
}

function shouldGroupWithPrevious(previousMessage, currentMessage) {
  if (!previousMessage || !currentMessage) {
    return false
  }

  if (previousMessage.sender?.id !== currentMessage.sender?.id) {
    return false
  }

  const previousTimestamp = toTimestamp(
    previousMessage.timestamp ?? previousMessage.created_at,
  )
  const currentTimestamp = toTimestamp(
    currentMessage.timestamp ?? currentMessage.created_at,
  )

  if (previousTimestamp == null || currentTimestamp == null) {
    return false
  }

  if (!isSameCalendarDay(previousTimestamp, currentTimestamp)) {
    return false
  }

  return currentTimestamp - previousTimestamp <= MESSAGE_GROUP_WINDOW_MS
}

function normalizeMessageReactions(reactions, currentUserId) {
  return (Array.isArray(reactions) ? reactions : []).map((reaction) => ({
    ...reaction,
    reacted_by_current_user: Array.isArray(reaction.reactor_ids)
      ? reaction.reactor_ids.some((reactorId) => Number(reactorId) === Number(currentUserId))
      : Boolean(reaction.reacted_by_current_user),
  }))
}

function DateDivider({ label }) {
  return (
    <div className="flex items-center gap-3 px-3 py-4">
      <div className="h-px flex-1 bg-[color:var(--orbit-border)]" />
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--orbit-text-subtle)]">
        {label}
      </p>
      <div className="h-px flex-1 bg-[color:var(--orbit-border)]" />
    </div>
  )
}

function ChannelIntro({ channel, server }) {
  if (!channel) {
    return null
  }

  return (
    <div className="px-3 pb-6 pt-2">
      <div className="flex h-16 w-16 items-center justify-center rounded-[1.6rem] bg-[var(--orbit-surface-soft)] text-[32px] font-semibold text-[var(--orbit-text)]">
        #
      </div>
      <h3 className="mt-4 text-[1.75rem] font-semibold leading-none text-[var(--orbit-text)]">
        Welcome to #{channel.name}
      </h3>
      <p className="mt-3 max-w-2xl text-[13px] leading-6 text-[var(--orbit-text-muted)]">
        This is the start of the #{channel.name} channel
        {server?.name ? ` in ${server.name}` : ''}. Share updates, drop context, and move the conversation forward.
      </p>
    </div>
  )
}

function DirectMessageIntro({ participant }) {
  if (!participant) {
    return null
  }

  return (
    <div className="px-3 pb-6 pt-2">
      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-[1.6rem] bg-[var(--orbit-surface-soft)] text-[26px] font-semibold text-[var(--orbit-text)]">
        {getAvatarLabel(participant)}
      </div>
      <h3 className="mt-4 text-[1.75rem] font-semibold leading-none text-[var(--orbit-text)]">
        @{participant.username}
      </h3>
      <p className="mt-3 max-w-2xl text-[13px] leading-6 text-[var(--orbit-text-muted)]">
        This is the start of your direct message history with {participant.username}.
        Personal, simple, and easy to return to.
      </p>
    </div>
  )
}

function ChatWindow({
  server,
  channel,
  directConversation = null,
  directConversations = [],
  homeMode = false,
  friendContacts = [],
  directoryUsers = [],
  onOpenDirectConversation,
}) {
  const currentUser = useAuthStore((state) => state.user)
  const currentUserId = useAuthStore((state) => state.user?.id)
  const accessToken = useAuthStore((state) => state.tokens?.access)
  const messages = useChatStore((state) => state.messages)
  const typingUsers = useChatStore((state) => state.typingUsers)
  const isMessagesLoading = useChatStore((state) => state.isMessagesLoading)
  const messagesError = useChatStore((state) => state.messagesError)
  const setMessages = useChatStore((state) => state.setMessages)
  const appendMessage = useChatStore((state) => state.appendMessage)
  const setTypingState = useChatStore((state) => state.setTypingState)
  const clearTypingUsers = useChatStore((state) => state.clearTypingUsers)
  const markChannelRead = useChatStore((state) => state.markChannelRead)
  const markDirectConversationRead = useChatStore(
    (state) => state.markDirectConversationRead,
  )
  const setMessageReactions = useChatStore((state) => state.setMessageReactions)
  const setMessagesLoading = useChatStore((state) => state.setMessagesLoading)
  const setMessagesError = useChatStore((state) => state.setMessagesError)
  const messageListRef = useRef(null)
  const shouldStickToBottomRef = useRef(true)
  const transitionTimeoutRef = useRef(null)
  const animationTimeoutRef = useRef(null)
  const lastSyncedReadMarkerRef = useRef({})
  const [isChannelTransitioning, setIsChannelTransitioning] = useState(false)
  const [animatedMessageId, setAnimatedMessageId] = useState(null)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [pendingReactionMessageId, setPendingReactionMessageId] = useState(null)
  const conversationType = directConversation ? 'direct' : channel ? 'channel' : null
  const activeConversationId = directConversation?.id ?? channel?.id ?? null
  const directParticipant = directConversation?.participant ?? null
  const { lastMessage, sendMessage, connectionStatus } = useWebSocket(
    conversationType,
    activeConversationId,
    accessToken,
  )

  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        window.clearTimeout(transitionTimeoutRef.current)
      }

      if (animationTimeoutRef.current) {
        window.clearTimeout(animationTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    setIsSearchOpen(false)
    setSearchQuery('')
    setPendingReactionMessageId(null)
  }, [activeConversationId, homeMode])

  useEffect(() => {
    if (!activeConversationId) {
      setMessages([])
      clearTypingUsers()
      setMessagesError('')
      setMessagesLoading(false)
      setIsChannelTransitioning(false)
      setAnimatedMessageId(null)
      return
    }

    let ignore = false
    setIsChannelTransitioning(true)
    setAnimatedMessageId(null)

    async function loadMessages() {
      setMessagesLoading(true)
      setMessagesError('')

      try {
        const history = await listMessages(
          conversationType === 'direct'
            ? { direct_conversation: activeConversationId }
            : { channel: activeConversationId },
        )
        if (!ignore) {
          setMessages(history)
        }
      } catch (error) {
        if (!ignore) {
          setMessages([])
          setMessagesError(
            extractApiErrors(error).form ?? 'Unable to load message history.',
          )
        }
      } finally {
        if (!ignore) {
          setMessagesLoading(false)
          if (transitionTimeoutRef.current) {
            window.clearTimeout(transitionTimeoutRef.current)
          }

          transitionTimeoutRef.current = window.setTimeout(() => {
            setIsChannelTransitioning(false)
            transitionTimeoutRef.current = null
          }, 120)
        }
      }
    }

    loadMessages()

    return () => {
      ignore = true
    }
  }, [
    activeConversationId,
    clearTypingUsers,
    conversationType,
    setMessages,
    setMessagesError,
    setMessagesLoading,
  ])

  useEffect(() => {
    if (!lastMessage || !activeConversationId) {
      return
    }

    const incomingConversationId =
      conversationType === 'direct'
        ? lastMessage.direct_conversation_id
        : lastMessage.channel_id

    if (incomingConversationId !== activeConversationId) {
      return
    }

    if (lastMessage.type === 'typing') {
      if (lastMessage.user_id === currentUserId) {
        return
      }

      setTypingState({
        userId: lastMessage.user_id,
        username: lastMessage.username,
        isTyping: lastMessage.is_typing,
      })
      return
    }

    if (lastMessage.type === 'reaction_update') {
      setMessageReactions({
        messageId: lastMessage.message_id,
        reactions: normalizeMessageReactions(lastMessage.reactions, currentUserId),
      })
      return
    }

    if (lastMessage.type === 'chat_message') {
      appendMessage(lastMessage)
      setAnimatedMessageId(lastMessage.id)

      if (animationTimeoutRef.current) {
        window.clearTimeout(animationTimeoutRef.current)
      }

      animationTimeoutRef.current = window.setTimeout(() => {
        setAnimatedMessageId(null)
        animationTimeoutRef.current = null
      }, 280)
    }
  }, [
    activeConversationId,
    appendMessage,
    conversationType,
    currentUserId,
    lastMessage,
    setMessageReactions,
    setTypingState,
  ])

  useEffect(() => {
    const container = messageListRef.current
    if (!container || !shouldStickToBottomRef.current) {
      return
    }

    container.scrollTop = container.scrollHeight
  }, [messages])

  useEffect(() => {
    if (!activeConversationId || !conversationType || isMessagesLoading || messagesError) {
      return
    }

    const latestMessageId = messages[messages.length - 1]?.id ?? null
    if (latestMessageId == null) {
      return
    }

    const syncKey = `${conversationType}:${activeConversationId}`
    if (lastSyncedReadMarkerRef.current[syncKey] === latestMessageId) {
      return
    }

    let ignore = false

    async function syncReadState() {
      try {
        if (conversationType === 'direct') {
          await persistDirectConversationRead(activeConversationId, latestMessageId)
          if (!ignore) {
            markDirectConversationRead({
              conversationId: activeConversationId,
              lastReadMessageId: latestMessageId,
            })
          }
        } else {
          await persistChannelRead(activeConversationId, latestMessageId)
          if (!ignore) {
            markChannelRead({
              channelId: activeConversationId,
              lastReadMessageId: latestMessageId,
            })
          }
        }

        if (!ignore) {
          lastSyncedReadMarkerRef.current[syncKey] = latestMessageId
        }
      } catch {
        // Keep the local UI responsive even if the read receipt request fails.
      }
    }

    void syncReadState()

    return () => {
      ignore = true
    }
  }, [
    activeConversationId,
    conversationType,
    isMessagesLoading,
    markChannelRead,
    markDirectConversationRead,
    messages,
    messagesError,
  ])

  const handleScroll = () => {
    const container = messageListRef.current
    if (!container) {
      return
    }

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight
    shouldStickToBottomRef.current = distanceFromBottom < 48
  }

  const handleToggleReaction = async (messageId, emoji) => {
    if (!messageId || !emoji) {
      return
    }

    setPendingReactionMessageId(messageId)

    try {
      const response = await toggleMessageReaction(messageId, emoji)
      setMessageReactions({
        messageId: response.message_id,
        reactions: normalizeMessageReactions(response.reactions, currentUserId),
      })
    } catch {
      // Keep the chat usable even if a reaction request fails.
    } finally {
      setPendingReactionMessageId((currentMessageId) =>
        currentMessageId === messageId ? null : currentMessageId,
      )
    }
  }

  const typingNames = useMemo(() => Object.values(typingUsers), [typingUsers])

  const normalizedSearchQuery = searchQuery.trim().toLowerCase()
  const visibleMessages = useMemo(() => {
    if (!normalizedSearchQuery) {
      return messages
    }

    return messages.filter((message) => {
      const messageText = `${message.content ?? ''} ${message.sender?.username ?? ''}`.toLowerCase()
      if (messageText.includes(normalizedSearchQuery)) {
        return true
      }

      const attachments = Array.isArray(message.attachments) ? message.attachments : []
      return attachments.some((attachment) =>
        `${attachment.file_name ?? ''} ${attachment.file_type ?? ''}`
          .toLowerCase()
          .includes(normalizedSearchQuery),
      )
    })
  }, [messages, normalizedSearchQuery])

  const typingIndicatorText = useMemo(() => {
    if (typingNames.length === 0) {
      return ''
    }

    if (typingNames.length === 1) {
      return `${typingNames[0]} is typing...`
    }

    if (typingNames.length === 2) {
      return `${typingNames[0]} and ${typingNames[1]} are typing...`
    }

    return `${typingNames[0]} and ${typingNames.length - 1} others are typing...`
  }, [typingNames])

  const messageItems = useMemo(() => {
    const items = []
    let currentGroup = null

    visibleMessages.forEach((message, index) => {
      const previousMessage = visibleMessages[index - 1] ?? null
      const currentTimestamp = message.timestamp ?? message.created_at
      const previousTimestamp = previousMessage?.timestamp ?? previousMessage?.created_at
      const showDateDivider =
        !previousMessage ||
        !isSameCalendarDay(previousTimestamp, currentTimestamp)
      const dateLabel = formatMessageDayLabel(currentTimestamp)

      if (showDateDivider && dateLabel) {
        items.push({
          type: 'divider',
          key: `divider-${message.id}`,
          label: dateLabel,
        })
        currentGroup = null
      }

      if (shouldGroupWithPrevious(previousMessage, message) && currentGroup) {
        currentGroup.messages.push(message)
        currentGroup.lastMessageId = message.id
        return
      }

      currentGroup = {
        type: 'group',
        key: `group-${message.id}`,
        messages: [message],
        lastMessageId: message.id,
      }

      items.push(currentGroup)
    })

    return items
  }, [visibleMessages])

  const emptyStateText = useMemo(() => {
    if (normalizedSearchQuery) {
      return `No messages match "${searchQuery.trim()}".`
    }

    if (homeMode) {
      return 'Pick someone from the left rail to start a direct message.'
    }

    if (directConversation) {
      return `No messages yet. Start the conversation with ${directParticipant?.username ?? 'this person'}.`
    }

    if (!server) {
      return 'Choose or create a server to start chatting.'
    }

    if (!channel) {
      return 'Pick a channel to jump into the conversation.'
    }

    return 'No messages yet. Be the first to say something.'
  }, [
    channel,
    directConversation,
    directParticipant?.username,
    homeMode,
    normalizedSearchQuery,
    searchQuery,
    server,
  ])

  const shouldShowChannelIntro =
    Boolean(channel) &&
    !isMessagesLoading &&
    !messagesError &&
    visibleMessages.length === 0 &&
    !normalizedSearchQuery
  const shouldShowDirectIntro =
    Boolean(directConversation) &&
    !isMessagesLoading &&
    !messagesError &&
    visibleMessages.length === 0 &&
    !normalizedSearchQuery

  const onlineDirectoryCount = useMemo(
    () => directoryUsers.filter((contact) => contact.is_online).length,
    [directoryUsers],
  )
  const unreadDirectTotal = useMemo(
    () =>
      directConversations.reduce(
        (totalUnread, conversation) => totalUnread + Number(conversation.unread_count ?? 0),
        0,
      ),
    [directConversations],
  )
  const recentDirectConversations = useMemo(
    () => directConversations.slice(0, 4),
    [directConversations],
  )
  const featuredDirectoryUsers = useMemo(
    () =>
      [...directoryUsers]
        .sort((leftContact, rightContact) => {
          if (Boolean(leftContact.can_message) !== Boolean(rightContact.can_message)) {
            return leftContact.can_message ? -1 : 1
          }

          if (leftContact.is_online !== rightContact.is_online) {
            return leftContact.is_online ? -1 : 1
          }

          return leftContact.username.localeCompare(rightContact.username)
        })
        .slice(0, 6),
    [directoryUsers],
  )
  const headerMetaText = directConversation
    ? directParticipant?.is_online
      ? 'Active now'
      : directParticipant?.last_seen
        ? `Last seen ${formatDate(directParticipant.last_seen)}`
        : 'Offline'
    : channel
      ? `${server?.name ?? 'Orbit'}${server?.members?.length ? ` • ${server.members.length} members` : ''}`
      : 'Choose a space to start talking'

  return (
    <section className="flex h-full min-h-[32rem] min-w-0 flex-col overflow-hidden bg-[var(--orbit-chat-bg)] xl:min-h-0">
      <header className="flex items-center justify-between gap-4 border-b border-[color:var(--orbit-border)] bg-[var(--orbit-chat-bg)] px-4 py-3">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-semibold text-[var(--orbit-text-subtle)]">
              {homeMode || directConversation ? '@' : '#'}
            </span>
            <h2 className="truncate text-[15px] font-semibold text-[var(--orbit-text)]">
              {homeMode
                ? 'Home'
                : directConversation
                  ? directParticipant?.username ?? 'Direct message'
                  : channel?.name ?? 'Select a channel'}
            </h2>
            {directConversation ? (
              <StatusDot isOnline={Boolean(directParticipant?.is_online)} />
            ) : null}
          </div>
          <p className="truncate text-[11px] text-[var(--orbit-text-muted)]">
            {homeMode
              ? 'Recent chats and people'
              : headerMetaText}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {homeMode ? (
            <span className="rounded-full border border-[color:var(--orbit-border)] bg-[var(--orbit-surface-soft)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--orbit-text-muted)]">
              {unreadDirectTotal} unread
            </span>
          ) : (
            <>
              {directConversation?.message_count ? (
                <span className="hidden rounded-full border border-[color:var(--orbit-border)] bg-[var(--orbit-surface-soft)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--orbit-text-muted)] lg:inline-flex">
                  {directConversation.message_count} messages
                </span>
              ) : null}
              <IconButton
                label={isSearchOpen ? 'Close search' : 'Search'}
                onClick={() => setIsSearchOpen((value) => !value)}
                isActive={isSearchOpen}
              >
                <SearchIcon />
              </IconButton>
            </>
          )}
        </div>
      </header>

      {!homeMode && isSearchOpen ? (
        <div className="border-b border-[color:var(--orbit-border)] bg-[var(--orbit-chat-bg)] px-4 py-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search this conversation"
              className="w-full rounded-2xl border border-[color:var(--orbit-border)] bg-[var(--orbit-surface-soft)] px-4 py-2.5 text-sm text-[var(--orbit-text)] outline-none transition focus:border-cyan-300/50"
            />
            <p className="shrink-0 text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--orbit-text-subtle)]">
              {normalizedSearchQuery
                ? `${visibleMessages.length} match${visibleMessages.length === 1 ? '' : 'es'}`
                : 'Search ready'}
            </p>
          </div>
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col justify-between bg-[var(--orbit-chat-bg)]">
        {homeMode ? (
          <div className="orbit-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-5">
            <section className="overflow-hidden rounded-[1.55rem] border border-[color:var(--orbit-border)] bg-[linear-gradient(180deg,rgba(11,15,24,0.96),rgba(17,21,32,0.94))] px-5 py-5 shadow-[0_18px_42px_rgba(0,0,0,0.18)]">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-300">
                    Workspace
                  </p>
                  <h3 className="mt-2 text-[1.65rem] font-semibold leading-tight text-[var(--orbit-text)]">
                    {currentUser?.username
                      ? `Welcome back, ${currentUser.username}`
                      : 'Welcome back'}
                  </h3>
                  <p className="mt-2 text-[13px] leading-6 text-slate-300/82">
                    Recent chats, shared people, and unread messages in one place.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:min-w-[20rem]">
                  <div className="rounded-[1rem] border border-white/8 bg-white/[0.04] px-3 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--orbit-text-subtle)]">
                      People
                    </p>
                    <p className="mt-2 text-xl font-semibold text-[var(--orbit-text)]">
                      {directoryUsers.length}
                    </p>
                  </div>
                  <div className="rounded-[1rem] border border-white/8 bg-white/[0.04] px-3 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--orbit-text-subtle)]">
                      Shared
                    </p>
                    <p className="mt-2 text-xl font-semibold text-emerald-300">
                      {friendContacts.length}
                    </p>
                  </div>
                  <div className="rounded-[1rem] border border-white/8 bg-white/[0.04] px-3 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--orbit-text-subtle)]">
                      Unread
                    </p>
                    <p className="mt-2 text-xl font-semibold text-amber-300">
                      {unreadDirectTotal}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.14fr)_minmax(300px,0.86fr)]">
              <section className="rounded-[1.35rem] border border-[color:var(--orbit-border)] bg-[var(--orbit-surface-soft)]">
                <div className="flex items-center justify-between gap-3 border-b border-[color:var(--orbit-border)] px-4 py-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--orbit-text-subtle)]">
                      Direct Messages
                    </p>
                    <p className="mt-1 text-[12px] text-[var(--orbit-text-muted)]">
                      Recent conversations
                    </p>
                  </div>
                  <span className="rounded-full border border-[color:var(--orbit-border)] bg-[var(--orbit-chat-bg)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--orbit-text-muted)]">
                    {recentDirectConversations.length}
                  </span>
                </div>

                <div className="p-2">
                  {recentDirectConversations.length > 0 ? (
                    <div className="space-y-0.5">
                      {recentDirectConversations.map((conversation) => (
                        <button
                          key={conversation.id}
                          type="button"
                          onClick={() => onOpenDirectConversation?.(conversation.participant)}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-[var(--orbit-surface-hover)]"
                        >
                          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[0.95rem] bg-cyan-400/15 text-sm font-semibold text-[var(--orbit-text)]">
                            {getAvatarLabel(conversation.participant)}
                            <span className="absolute -bottom-0.5 -right-0.5">
                              <StatusDot isOnline={Boolean(conversation.participant?.is_online)} />
                            </span>
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-3">
                              <p className="truncate text-[14px] font-semibold text-[var(--orbit-text)]">
                                {conversation.participant?.username ?? 'Unknown'}
                              </p>
                              {Number(conversation.unread_count ?? 0) > 0 ? (
                                <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                                  {conversation.unread_count}
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-1 truncate text-[12px] leading-5 text-[var(--orbit-text-muted)]">
                              {conversation.last_message_sender_username
                                ? `${conversation.last_message_sender_username}: `
                                : ''}
                              {conversation.last_message_preview || 'Open conversation'}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-[1rem] border border-dashed border-[color:var(--orbit-border)] bg-[var(--orbit-chat-bg)] px-5 py-5 text-[12px] leading-5 text-[var(--orbit-text-muted)]">
                      No direct messages yet.
                    </div>
                  )}
                </div>
              </section>

              <section className="rounded-[1.35rem] border border-[color:var(--orbit-border)] bg-[var(--orbit-surface-soft)]">
                <div className="flex items-center justify-between gap-3 border-b border-[color:var(--orbit-border)] px-4 py-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--orbit-text-subtle)]">
                      People
                    </p>
                    <p className="mt-1 text-[12px] text-[var(--orbit-text-muted)]">
                      Available first
                    </p>
                  </div>
                  <span className="rounded-full border border-[color:var(--orbit-border)] bg-[var(--orbit-chat-bg)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--orbit-text-muted)]">
                    {onlineDirectoryCount} online
                  </span>
                </div>

                <div className="p-2">
                  {featuredDirectoryUsers.length > 0 ? (
                    <div className="space-y-0.5">
                      {featuredDirectoryUsers.map((contact) => {
                        const existingConversation = directConversations.find(
                          (conversation) =>
                            Number(conversation.participant?.id) === Number(contact.id),
                        )
                        const canOpenConversation = Boolean(
                          existingConversation || contact.can_message,
                        )

                        return (
                          <button
                            key={contact.id}
                            type="button"
                            onClick={() => {
                              if (canOpenConversation) {
                                onOpenDirectConversation?.(contact)
                              }
                            }}
                            disabled={!canOpenConversation}
                            className={[
                              'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition',
                              canOpenConversation
                                ? 'hover:bg-[var(--orbit-surface-hover)]'
                                : 'cursor-not-allowed opacity-80',
                            ].join(' ')}
                          >
                            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[0.95rem] bg-cyan-400/15 text-sm font-semibold text-[var(--orbit-text)]">
                              {getAvatarLabel(contact)}
                              <span className="absolute -bottom-0.5 -right-0.5">
                                <StatusDot isOnline={Boolean(contact.is_online)} />
                              </span>
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[14px] font-semibold text-[var(--orbit-text)]">
                                {contact.username}
                              </p>
                              <p className="mt-1 truncate text-[12px] leading-5 text-[var(--orbit-text-muted)]">
                                {existingConversation
                                  ? 'In direct messages'
                                  : canOpenConversation
                                    ? getDirectoryContextLabel(contact)
                                    : 'Shared server required'}
                              </p>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="rounded-[1rem] border border-dashed border-[color:var(--orbit-border)] bg-[var(--orbit-chat-bg)] px-5 py-5 text-[12px] leading-5 text-[var(--orbit-text-muted)]">
                      People will appear here automatically.
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        ) : (
          <div
            ref={messageListRef}
            onScroll={handleScroll}
            className="orbit-scrollbar min-h-0 flex-1 space-y-0.5 overflow-y-auto px-4 py-2.5"
          >
            {isMessagesLoading ? (
              <MessageSkeleton count={6} />
            ) : null}

            {messagesError ? (
              <div className="rounded-3xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-100">
                {messagesError}
              </div>
            ) : null}

            {!isMessagesLoading ? (
              <div
                className={[
                  'transition-all duration-200 ease-out',
                  isChannelTransitioning ? 'translate-y-1 opacity-0' : 'translate-y-0 opacity-100',
                ].join(' ')}
              >
                {shouldShowChannelIntro ? (
                  <ChannelIntro channel={channel} server={server} />
                ) : null}
                {shouldShowDirectIntro ? (
                  <DirectMessageIntro participant={directParticipant} />
                ) : null}

                {visibleMessages.length > 0 ? (
                  messageItems.map((item) =>
                    item.type === 'divider' ? (
                      <DateDivider key={item.key} label={item.label} />
                    ) : (
                      <MessageBubble
                        key={item.key}
                        messages={item.messages}
                        shouldAnimate={item.lastMessageId === animatedMessageId}
                        pendingReactionMessageId={pendingReactionMessageId}
                        onToggleReaction={handleToggleReaction}
                      />
                    ),
                  )
                ) : !messagesError ? (
                  <div className="px-3 pb-4">
                    <div className="rounded-[1.6rem] border border-dashed border-[color:var(--orbit-border)] bg-[var(--orbit-surface-soft)] px-5 py-5 text-[13px] leading-6 text-[var(--orbit-text-muted)]">
                      {emptyStateText}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        )}

        {!homeMode ? (
          <div className="border-t border-[color:var(--orbit-border)] bg-[var(--orbit-chat-footer-bg)] px-4 py-2.5">
            {typingIndicatorText ? (
              <p className="mb-2 px-1 text-[11px] text-cyan-500/90">{typingIndicatorText}</p>
            ) : null}
            <MessageInput
              key={activeConversationId ?? 'message-input'}
              channel={channel}
              directConversation={directConversation}
              connectionStatus={connectionStatus}
              onSendMessage={(message) =>
                sendMessage({
                  type: 'chat_message',
                  ...message,
                })
              }
              onSendTypingState={(isTyping) =>
                sendMessage({
                  type: 'typing',
                  is_typing: isTyping,
                })
              }
            />
          </div>
        ) : null}
      </div>
    </section>
  )
}

export default ChatWindow
