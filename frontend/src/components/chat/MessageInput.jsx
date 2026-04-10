import { useEffect, useRef, useState } from 'react'
import FileUpload from './FileUpload'

function MessageInput({
  channel,
  directConversation,
  connectionStatus,
  onSendMessage,
  onSendTypingState,
}) {
  const [draft, setDraft] = useState('')
  const [attachedFiles, setAttachedFiles] = useState([])
  const [isUploadingAttachments, setIsUploadingAttachments] = useState(false)
  const [composerError, setComposerError] = useState('')
  const fileUploadRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const hasConversationTarget = Boolean(channel || directConversation)
  const conversationLabel = directConversation
    ? `@${directConversation.participant?.username ?? 'direct-message'}`
    : channel
      ? `#${channel.name}`
      : ''
  const isConnectionReady = connectionStatus === 'open'
  const helperText = !hasConversationTarget
    ? 'Pick a conversation to start chatting.'
    : isUploadingAttachments
      ? 'Finish uploading attachments before sending.'
    : !isConnectionReady
      ? 'Reconnecting to this conversation...'
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

    if (!hasConversationTarget) {
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
    if (!content && attachedFiles.length === 0) {
      return
    }

    if (isUploadingAttachments) {
      setComposerError('Wait for the attachments to finish uploading.')
      return
    }

    const wasSent = onSendMessage({
      content,
      attachments: attachedFiles,
      file_url: attachedFiles[0]?.url ?? '',
      file_name: attachedFiles[0]?.file_name ?? '',
      file_type: attachedFiles[0]?.file_type ?? '',
    })
    if (!wasSent) {
      setComposerError('WebSocket connection is not ready yet.')
      return
    }

    clearTypingTimeout()
    onSendTypingState(false)
    setDraft('')
    setAttachedFiles([])
    setIsUploadingAttachments(false)
    fileUploadRef.current?.clearUpload()
    setComposerError('')
  }

  return (
    <form
      className="rounded-[1rem] border border-[color:var(--orbit-border)] bg-[var(--orbit-composer-bg)] px-2.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
      onSubmit={handleSubmit}
    >
      {composerError ? (
        <p className="orbit-danger-text mb-3 text-[11px] font-medium uppercase tracking-[0.14em]">
          {composerError}
        </p>
      ) : null}

      <div className="grid gap-2.5 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
        <FileUpload
          ref={fileUploadRef}
          channel={channel}
          directConversation={directConversation}
          onUploadComplete={setAttachedFiles}
          onUploadStateChange={setIsUploadingAttachments}
        />
        <input
          type="text"
          value={draft}
          onChange={handleChange}
          disabled={!hasConversationTarget}
          placeholder={
          hasConversationTarget
              ? `Message ${conversationLabel}`
              : 'Choose a conversation before sending messages'
          }
          className="orbit-input w-full rounded-[0.95rem] px-4 py-2.5 text-[13px] transition disabled:cursor-not-allowed disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!hasConversationTarget || !isConnectionReady || isUploadingAttachments}
          className="rounded-[0.95rem] bg-cyan-500 px-4 py-2.5 text-[12px] font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Send
        </button>
      </div>

      {helperText ? (
        <div className="mt-3 px-1">
          <p className="text-[11px] text-[var(--orbit-text-subtle)]">{helperText}</p>
        </div>
      ) : null}
    </form>
  )
}

export default MessageInput
