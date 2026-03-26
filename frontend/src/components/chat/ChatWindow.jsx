import { useEffect, useRef, useState } from 'react'
import { listMessages } from '../../api/messages'
import useWebSocket from '../../hooks/useWebSocket'
import useAuthStore from '../../store/useAuthStore'
import useChatStore from '../../store/useChatStore'
import extractApiErrors from '../../utils/extractApiErrors'
import MessageBubble from './MessageBubble'

function ChatWindow({ server, channel }) {
  const accessToken = useAuthStore((state) => state.tokens?.access)
  const {
    messages,
    isMessagesLoading,
    messagesError,
    setMessages,
    appendMessage,
    setMessagesLoading,
    setMessagesError,
  } = useChatStore((state) => ({
    messages: state.messages,
    isMessagesLoading: state.isMessagesLoading,
    messagesError: state.messagesError,
    setMessages: state.setMessages,
    appendMessage: state.appendMessage,
    setMessagesLoading: state.setMessagesLoading,
    setMessagesError: state.setMessagesError,
  }))
  const [draft, setDraft] = useState('')
  const [composerError, setComposerError] = useState('')
  const messageListRef = useRef(null)
  const shouldStickToBottomRef = useRef(true)
  const { lastMessage, sendMessage, connectionStatus } = useWebSocket(
    channel?.id,
    accessToken,
  )

  useEffect(() => {
    if (!channel?.id) {
      setMessages([])
      setMessagesError('')
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
    setMessages,
    setMessagesError,
    setMessagesLoading,
  ])

  useEffect(() => {
    if (!lastMessage || lastMessage.channel_id !== channel?.id) {
      return
    }

    appendMessage(lastMessage)
  }, [appendMessage, channel?.id, lastMessage])

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

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!draft.trim()) {
      return
    }

    const wasSent = sendMessage({
      type: 'chat_message',
      content: draft.trim(),
    })

    if (!wasSent) {
      setComposerError('WebSocket connection is not ready yet.')
      return
    }

    setDraft('')
    setComposerError('')
  }

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

        <form
          className="rounded-3xl border border-white/10 bg-slate-950/70 px-5 py-4"
          onSubmit={handleSubmit}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-500">
              Connection {connectionStatus}
            </p>
            {composerError ? (
              <p className="text-xs uppercase tracking-[0.28em] text-red-300">
                {composerError}
              </p>
            ) : null}
          </div>

          <div className="mt-4 flex gap-3">
            <input
              type="text"
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value)
                setComposerError('')
              }}
              disabled={!channel}
              placeholder={
                channel
                  ? `Message #${channel.name}`
                  : 'Choose a channel before sending messages'
              }
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!channel}
              className="rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}

export default ChatWindow
