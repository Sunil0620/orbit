import { useEffect, useRef, useState } from 'react'
import FileUpload from './FileUpload'

function MessageInput({
  channel,
  connectionStatus,
  onSendMessage,
  onSendTypingState,
}) {
  const [draft, setDraft] = useState('')
  const [attachedFile, setAttachedFile] = useState(null)
  const [composerError, setComposerError] = useState('')
  const fileUploadRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const isConnectionReady = connectionStatus === 'open'
  const helperText = !channel
    ? 'Pick a channel to start chatting.'
    : !isConnectionReady
      ? 'Reconnecting to this channel...'
      : ''

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
    if (!content && !attachedFile) {
      return
    }

    const wasSent = onSendMessage({
      content,
      file_url: attachedFile?.url ?? '',
      file_name: attachedFile?.file_name ?? '',
      file_type: attachedFile?.file_type ?? '',
    })
    if (!wasSent) {
      setComposerError('WebSocket connection is not ready yet.')
      return
    }

    clearTypingTimeout()
    onSendTypingState(false)
    setDraft('')
    setAttachedFile(null)
    fileUploadRef.current?.clearUpload()
    setComposerError('')
  }

  return (
    <form
      className="rounded-[1.4rem] border border-white/10 bg-[#383a40] px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
      onSubmit={handleSubmit}
    >
      {composerError ? (
        <p className="mb-3 text-xs uppercase tracking-[0.28em] text-red-300">
          {composerError}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
        <FileUpload
          ref={fileUploadRef}
          channel={channel}
          onUploadComplete={setAttachedFile}
        />
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
          className="w-full rounded-2xl border border-white/10 bg-[#313338] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!channel || !isConnectionReady}
          className="rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Send
        </button>
      </div>

      {helperText ? (
        <div className="mt-3 px-1">
          <p className="text-xs text-slate-500">{helperText}</p>
        </div>
      ) : null}
    </form>
  )
}

export default MessageInput
