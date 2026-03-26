import { useEffect, useMemo, useRef } from 'react'
import { listMessages } from '../../api/messages'
import useWebSocket from '../../hooks/useWebSocket'
import useAuthStore from '../../store/useAuthStore'
import useChatStore from '../../store/useChatStore'
import extractApiErrors from '../../utils/extractApiErrors'
import MessageBubble from './MessageBubble'
import MessageInput from './MessageInput'

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
  const { lastMessage, sendMessage, connectionStatus } = useWebSocket(
    channel?.id,
    accessToken,
  )

  useEffect(() => {
    if (!channel?.id) {
      setMessages([])
      clearTypingUsers()
      setMessagesError('')
      setMessagesLoading(false)
      return
    }

    let ignore = false

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

  return (
    <section className="flex h-full min-h-[32rem] flex-col rounded-[2rem] border border-white/10 bg-slate-800/80">
      <header className="border-b border-white/10 px-6 py-5">
        <p className="text-xs uppercase tracking-[0.35em] text-slate-400">
          Chat window
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-white">
          {channel?.name ? `# ${channel.name}` : 'Workspace preview'}
        </h2>
        <p className="mt-2 text-sm text-slate-300">
          {server && channel
            ? `History and live websocket messages are now rendered for ${server.name}.`
            : 'Choose a channel to load history and open the live websocket feed.'}
        </p>
      </header>

      <div className="flex flex-1 flex-col justify-between gap-6 px-6 py-6">
        <div
          ref={messageListRef}
          onScroll={handleScroll}
          className="space-y-4 overflow-y-auto pr-2"
        >
          {isMessagesLoading ? (
            <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-slate-300">
              <span className="h-3 w-3 animate-pulse rounded-full bg-cyan-300" />
              Loading message history...
            </div>
          ) : null}

          {messagesError ? (
            <div className="rounded-3xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-100">
              {messagesError}
            </div>
          ) : null}

          {messages.length > 0 ? (
            messages.map((message) => <MessageBubble key={message.id} message={message} />)
          ) : !isMessagesLoading && !messagesError ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 px-6 py-6 text-sm leading-7 text-slate-300">
              No messages yet. Send the first one once the websocket is open.
            </div>
          ) : null}
        </div>

        <div className="space-y-3">
          <MessageInput
            key={channel?.id ?? 'message-input'}
            channel={channel}
            connectionStatus={connectionStatus}
            onSendMessage={(content) =>
              sendMessage({
                type: 'chat_message',
                content,
              })
            }
            onSendTypingState={(isTyping) =>
              sendMessage({
                type: 'typing',
                is_typing: isTyping,
              })
            }
          />
          {typingIndicatorText ? (
            <p className="px-2 text-sm text-cyan-100/80">{typingIndicatorText}</p>
          ) : null}
        </div>
      </div>
    </section>
  )
}

export default ChatWindow
