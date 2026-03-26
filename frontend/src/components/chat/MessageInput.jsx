import { useEffect, useRef, useState } from 'react'
import FileUpload from './FileUpload'

function MessageInput({
  channel,
  connectionStatus,
  onSendMessage,
  onSendTypingState,
}) {
  const [draft, setDraft] = useState('')
  const [composerError, setComposerError] = useState('')
  const typingTimeoutRef = useRef(null)

  const clearTypingTimeout = () => {
    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }
  }

  useEffect(() => {
    return () => {
      clearTypingTimeout()
    }
  }, [])

  const scheduleTypingStop = () => {
    clearTypingTimeout()
    typingTimeoutRef.current = window.setTimeout(() => {
      onSendTypingState(false)
      typingTimeoutRef.current = null
    }, 2000)
  }

  const handleChange = (event) => {
    const nextValue = event.target.value
    setDraft(nextValue)
    setComposerError('')

    if (!channel) {
      return
    }

    onSendTypingState(true)

    if (!nextValue.trim()) {
      clearTypingTimeout()
      onSendTypingState(false)
      return
    }

    scheduleTypingStop()
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    const content = draft.trim()
    if (!content) {
      return
    }

    const wasSent = onSendMessage(content)
    if (!wasSent) {
      setComposerError('WebSocket connection is not ready yet.')
      return
    }

    clearTypingTimeout()
    onSendTypingState(false)
    setDraft('')
    setComposerError('')
  }

  return (
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

      <div className="mt-4 grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3">
        <FileUpload channel={channel} />
        <input
          type="text"
          value={draft}
          onChange={handleChange}
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
  )
}

export default MessageInput
