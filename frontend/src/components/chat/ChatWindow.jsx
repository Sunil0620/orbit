import { useEffect, useMemo, useRef, useState } from 'react'
import { listMessages } from '../../api/messages'
import useWebSocket from '../../hooks/useWebSocket'
import useAuthStore from '../../store/useAuthStore'
import useChatStore from '../../store/useChatStore'
import extractApiErrors from '../../utils/extractApiErrors'
import MessageBubble from './MessageBubble'
import MessageInput from './MessageInput'
import MessageSkeleton from './MessageSkeleton'

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

function ChatWindow({ server, channel }) {
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
  const { lastMessage, sendMessage, connectionStatus } = useWebSocket(
    channel?.id,
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
    if (!channel?.id) {
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
        const history = await listMessages(channel.id)
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
    channel?.id,
    clearTypingUsers,
    setMessages,
    setMessagesError,
    setMessagesLoading,
  ])

  useEffect(() => {
    if (!lastMessage || lastMessage.channel_id !== channel?.id) {
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
  }, [appendMessage, channel?.id, currentUserId, lastMessage, setTypingState])

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

  const connectionStateMeta = {
    idle: 'Standby',
    connecting: 'Syncing',
    reconnecting: 'Syncing',
    open: 'Live',
    closed: 'Offline',
  }

  const emptyStateText = useMemo(() => {
    if (!server) {
      return 'Choose or create a server to start chatting.'
    }

    if (!channel) {
      return 'Pick a channel to jump into the conversation.'
    }

    return 'No messages yet. Be the first to say something.'
  }, [channel, server])

  return (
    <section className="flex h-full min-h-[32rem] min-w-0 flex-col overflow-hidden bg-[var(--orbit-chat-bg)] xl:min-h-0">
      <header className="flex items-center justify-between gap-4 border-b border-[color:var(--orbit-border)] bg-[var(--orbit-chat-bg)] px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-[var(--orbit-text-subtle)]">#</span>
            <h2 className="truncate text-lg font-semibold text-[var(--orbit-text)]">
              {channel?.name ?? 'Select a channel'}
            </h2>
          </div>
          <p className="mt-0.5 truncate text-sm text-[var(--orbit-text-muted)]">
            {channel
              ? `Chatting in ${server?.name ?? 'Orbit'}`
              : 'Choose a channel to open the conversation.'}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="orbit-secondary-button hidden items-center gap-2 rounded-lg px-3 py-2 text-sm lg:flex">
            <SearchIcon />
            <span>Search</span>
          </div>
          <IconButton label="Pinned messages">
            <PinIcon />
          </IconButton>
          <IconButton label="Notifications">
            <BellIcon />
          </IconButton>
          <span className="rounded-full border border-[color:var(--orbit-border)] bg-[var(--orbit-surface-soft)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--orbit-text-muted)]">
            {connectionStateMeta[connectionStatus] ?? connectionStateMeta.idle}
          </span>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col justify-between bg-[var(--orbit-chat-bg)]">
        <div
          ref={messageListRef}
          onScroll={handleScroll}
          className="orbit-scrollbar min-h-0 flex-1 space-y-0.5 overflow-y-auto px-4 py-3"
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
              {messages.length > 0 ? (
                messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    shouldAnimate={message.id === animatedMessageId}
                  />
                ))
              ) : !messagesError ? (
                <div className="rounded-3xl border border-dashed border-[color:var(--orbit-border)] bg-[var(--orbit-surface-soft)] px-6 py-6 text-sm leading-7 text-[var(--orbit-text-muted)]">
                  {emptyStateText}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="border-t border-[color:var(--orbit-border)] bg-[var(--orbit-chat-footer-bg)] px-4 py-3">
          {typingIndicatorText ? (
            <p className="mb-2 px-2 text-sm text-cyan-500/90">{typingIndicatorText}</p>
          ) : null}
          <MessageInput
            key={channel?.id ?? 'message-input'}
            channel={channel}
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
      </div>
    </section>
  )
}

export default ChatWindow
