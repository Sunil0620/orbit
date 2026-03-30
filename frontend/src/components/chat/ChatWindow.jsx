import { useEffect, useMemo, useRef, useState } from 'react'
import { listMessages } from '../../api/messages'
import useWebSocket from '../../hooks/useWebSocket'
import useAuthStore from '../../store/useAuthStore'
import useChatStore from '../../store/useChatStore'
import extractApiErrors from '../../utils/extractApiErrors'
import { formatMessageDayLabel } from '../../utils/formatDate'
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

function BellIcon() {
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
      <path d="M15 17H5l1.4-1.4A2 2 0 0 0 7 14.2V11a5 5 0 1 1 10 0v3.2a2 2 0 0 0 .6 1.4L19 17h-4" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  )
}

function PinIcon() {
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
      <path d="m15 3 6 6-4 1-4 4-1 4-2-2 4-4 1-4-4 1 4-6Z" />
      <path d="m5 19 4-4" />
    </svg>
  )
}

function IconButton({ children, label }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="orbit-secondary-button rounded-lg p-2"
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
        {server?.name ? ` in ${server.name}` : ''}. Share updates, drop context, and keep the conversation moving.
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
        Keep it personal, fast, and easy to pick back up.
      </p>
    </div>
  )
}

function ChatWindow({
  server,
  channel,
  directConversation = null,
  homeMode = false,
  friendContacts = [],
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
  const setMessagesLoading = useChatStore((state) => state.setMessagesLoading)
  const setMessagesError = useChatStore((state) => state.setMessagesError)
  const messageListRef = useRef(null)
  const shouldStickToBottomRef = useRef(true)
  const transitionTimeoutRef = useRef(null)
  const animationTimeoutRef = useRef(null)
  const [isChannelTransitioning, setIsChannelTransitioning] = useState(false)
  const [animatedMessageId, setAnimatedMessageId] = useState(null)
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
    setTypingState,
  ])

  useEffect(() => {
    const container = messageListRef.current
    if (!container || !shouldStickToBottomRef.current) {
      return
    }

    container.scrollTop = container.scrollHeight
  }, [messages])

  const handleScroll = () => {
    const container = messageListRef.current
    if (!container) {
      return
    }

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight
    shouldStickToBottomRef.current = distanceFromBottom < 48
  }

  const typingNames = useMemo(() => Object.values(typingUsers), [typingUsers])

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

    messages.forEach((message, index) => {
      const previousMessage = messages[index - 1] ?? null
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
  }, [messages])

  const emptyStateText = useMemo(() => {
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
  }, [channel, directConversation, directParticipant?.username, homeMode, server])

  const shouldShowChannelIntro =
    Boolean(channel) &&
    !isMessagesLoading &&
    !messagesError &&
    messages.length === 0
  const shouldShowDirectIntro =
    Boolean(directConversation) &&
    !isMessagesLoading &&
    !messagesError &&
    messages.length === 0

  return (
    <section className="flex h-full min-h-[32rem] min-w-0 flex-col overflow-hidden bg-[var(--orbit-chat-bg)] xl:min-h-0">
      <header className="flex items-center justify-between gap-4 border-b border-[color:var(--orbit-border)] bg-[var(--orbit-chat-bg)] px-4 py-2.5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-semibold text-[var(--orbit-text-subtle)]">
              {homeMode || directConversation ? '@' : '#'}
            </span>
            <h2 className="truncate text-[15px] font-semibold text-[var(--orbit-text)]">
              {homeMode
                ? 'Friends & Messages'
                : directConversation
                  ? directParticipant?.username ?? 'Direct message'
                  : channel?.name ?? 'Select a channel'}
            </h2>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {homeMode ? (
            <span className="rounded-full border border-[color:var(--orbit-border)] bg-[var(--orbit-surface-soft)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--orbit-text-muted)]">
              {friendContacts.length} contact{friendContacts.length === 1 ? '' : 's'}
            </span>
          ) : (
            <>
              <IconButton label="Search">
                <SearchIcon />
              </IconButton>
              <IconButton label="Pinned messages">
                <PinIcon />
              </IconButton>
              <IconButton label="Notifications">
                <BellIcon />
              </IconButton>
            </>
          )}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col justify-between bg-[var(--orbit-chat-bg)]">
        {homeMode ? (
          <div className="orbit-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-5">
            <div className="rounded-[2rem] border border-[color:var(--orbit-border)] bg-[var(--orbit-surface-soft)] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300">
                Friends Home
              </p>
              <h3 className="mt-3 text-3xl font-semibold text-[var(--orbit-text)]">
                Talk with the people in your orbit
              </h3>
              <p className="mt-3 max-w-2xl text-[13px] leading-6 text-[var(--orbit-text-muted)]">
                {currentUser?.username ?? 'You'} can use this home space to keep an eye on shared contacts,
                then jump into any server on the left when it is time to chat.
              </p>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-2">
              {friendContacts.length > 0 ? (
                friendContacts.map((contact) => (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => onOpenDirectConversation?.(contact)}
                    className="rounded-[1.6rem] border border-[color:var(--orbit-border)] bg-[var(--orbit-surface-soft)] p-5 text-left transition hover:border-[color:var(--orbit-border-strong)] hover:bg-[var(--orbit-surface-hover)]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-cyan-400/15 text-base font-semibold text-[var(--orbit-text)]">
                        {getAvatarLabel(contact)}
                        <span
                          className={[
                            'absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[var(--orbit-surface-soft)]',
                            contact.is_online ? 'bg-emerald-400' : 'bg-slate-500',
                          ].join(' ')}
                        />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-semibold text-[var(--orbit-text)]">
                          {contact.username}
                        </p>
                        <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--orbit-text-subtle)]">
                          {contact.is_online ? 'Online now' : 'Offline'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-[1.2rem] border border-[color:var(--orbit-border)] bg-[var(--orbit-chat-bg)] px-4 py-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--orbit-text-subtle)]">
                        Shared servers
                      </p>
                      <p className="mt-2 text-[12px] leading-5 text-[var(--orbit-text-muted)]">
                        {contact.sharedServers?.join(', ') ?? 'Orbit'}
                      </p>
                    </div>
                  </button>
                ))
              ) : (
                <div className="rounded-[1.6rem] border border-dashed border-[color:var(--orbit-border)] bg-[var(--orbit-surface-soft)] px-6 py-6 text-[12px] leading-5 text-[var(--orbit-text-muted)] xl:col-span-2">
                  Join or create a server with friends and their shared profile cards will show up here.
                </div>
              )}
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

                {messages.length > 0 ? (
                  messageItems.map((item) =>
                    item.type === 'divider' ? (
                      <DateDivider key={item.key} label={item.label} />
                    ) : (
                      <MessageBubble
                        key={item.key}
                        messages={item.messages}
                        shouldAnimate={item.lastMessageId === animatedMessageId}
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
