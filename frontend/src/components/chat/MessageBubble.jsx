import useAuthStore from '../../store/useAuthStore'
import formatDate, { formatMessageTime } from '../../utils/formatDate'

const QUICK_REACTIONS = ['👍', '❤️', '🔥', '😂', '🎉']

function AttachmentIcon() {
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
      <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z" />
      <path d="M14 2v5h5" />
      <path d="M9 15h6" />
      <path d="M9 11h3" />
    </svg>
  )
}

function resolveMessageAttachments(message) {
  if (Array.isArray(message.attachments) && message.attachments.length > 0) {
    return message.attachments
  }

  if (message.file_url) {
    return [
      {
        url: message.file_url,
        file_name: message.file_name || 'Attachment',
        file_type: message.file_type || '',
      },
    ]
  }

  return []
}

function ReactionChip({ reaction, disabled = false, onToggleReaction }) {
  const isActive = Boolean(reaction.reacted_by_current_user)

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onToggleReaction?.(reaction.emoji)}
      className={[
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition',
        isActive
          ? 'orbit-accent-surface'
          : 'border-[color:var(--orbit-border)] bg-[var(--orbit-surface-soft)] text-[var(--orbit-text-muted)] hover:border-[color:var(--orbit-border-strong)] hover:text-[var(--orbit-text)]',
        disabled ? 'cursor-not-allowed opacity-70' : '',
      ].join(' ')}
    >
      <span>{reaction.emoji}</span>
      <span>{reaction.count}</span>
    </button>
  )
}

function QuickReactionStrip({ disabled = false, onToggleReaction }) {
  if (!onToggleReaction) {
    return null
  }

  return (
    <div className="mt-1.5 hidden flex-wrap gap-1 group-hover:flex">
      {QUICK_REACTIONS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          disabled={disabled}
          onClick={() => onToggleReaction(emoji)}
          className={[
            'rounded-full border border-[color:var(--orbit-border)] bg-[var(--orbit-surface-soft)] px-2.5 py-1 text-[12px] transition hover:border-[color:var(--orbit-border-strong)] hover:bg-[var(--orbit-surface-hover)]',
            disabled ? 'cursor-not-allowed opacity-70' : '',
          ].join(' ')}
          aria-label={`React with ${emoji}`}
        >
          {emoji}
        </button>
      ))}
    </div>
  )
}

function MessageContent({
  message,
  currentUsername = '',
  hasHeader = false,
  disableReactions = false,
  onToggleReaction,
}) {
  const attachments = resolveMessageAttachments(message)
  const reactions = Array.isArray(message.reactions) ? message.reactions : []
  const normalizedCurrentUsername = currentUsername.toLowerCase()
  const mentionPattern = currentUsername
    ? new RegExp(`(@${currentUsername.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}\\b)`, 'gi')
    : null
  const contentSegments = mentionPattern
    ? (message.content ?? '').split(mentionPattern)
    : [message.content ?? '']

  return (
    <>
      {message.content ? (
        <p
          className={[
            'whitespace-pre-wrap break-words text-[14px] leading-[1.28rem] text-[var(--orbit-text-muted)] [overflow-wrap:anywhere]',
            hasHeader ? 'mt-[1px]' : 'mt-0',
          ].join(' ')}
        >
          {contentSegments.map((segment, index) =>
            normalizedCurrentUsername &&
            segment.toLowerCase() === `@${normalizedCurrentUsername}` ? (
              <span
                key={`${message.id}-mention-${index}`}
                className="rounded bg-yellow-500/20 px-1 text-yellow-300"
              >
                {segment}
              </span>
            ) : (
              <span key={`${message.id}-text-${index}`}>{segment}</span>
            ),
          )}
        </p>
      ) : null}

      {attachments.length > 0 ? (
        <div
          className={[
            'space-y-2.5',
            message.content || hasHeader ? 'mt-1.5' : 'mt-0',
          ].join(' ')}
        >
          {attachments.map((attachment, index) => {
            const fileType = attachment.file_type ?? ''
            const isImageAttachment = fileType.startsWith('image/')
            const isDownloadableFile =
              fileType === 'application/pdf' || fileType === 'text/plain'

            if (isImageAttachment) {
              return (
                <img
                  key={`${message.id}-attachment-image-${index}`}
                  src={attachment.url}
                  alt={attachment.file_name || 'Chat attachment'}
                  loading="lazy"
                  className="max-h-[14rem] w-auto max-w-[min(100%,14rem)] rounded-2xl border border-[color:var(--orbit-border)] bg-[var(--orbit-surface-0)] object-cover shadow-lg shadow-black/15 sm:max-h-[15rem] sm:max-w-[min(100%,15rem)]"
                />
              )
            }

            if (isDownloadableFile) {
              return (
                <div
                  key={`${message.id}-attachment-file-${index}`}
                  className="flex max-w-xl items-center justify-between gap-3 rounded-2xl border border-[color:var(--orbit-border)] bg-[var(--orbit-surface-soft)] px-4 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="rounded-xl bg-cyan-400/10 p-2 text-[var(--orbit-text)]">
                      <AttachmentIcon />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-[var(--orbit-text)]">
                        {attachment.file_name || 'Attachment'}
                      </p>
                      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--orbit-text-subtle)]">
                        {fileType === 'application/pdf' ? 'PDF' : 'Text file'}
                      </p>
                    </div>
                  </div>

                  <a
                    href={attachment.url}
                    download={attachment.file_name || true}
                    target="_blank"
                    rel="noreferrer"
                    className="orbit-secondary-button shrink-0 rounded-full px-3 py-2 text-[10px] font-medium uppercase tracking-[0.14em]"
                  >
                    Download
                  </a>
                </div>
              )
            }

            return (
              <a
                key={`${message.id}-attachment-link-${index}`}
                href={attachment.url}
                target="_blank"
                rel="noreferrer"
                className="orbit-secondary-button inline-flex rounded-full px-3 py-2 text-[10px] font-medium uppercase tracking-[0.14em]"
              >
                {attachment.file_name || 'Open attachment'}
              </a>
            )
          })}
        </div>
      ) : null}

      {reactions.length > 0 ? (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {reactions.map((reaction) => (
            <ReactionChip
              key={`${message.id}-${reaction.emoji}`}
              reaction={reaction}
              disabled={disableReactions}
              onToggleReaction={onToggleReaction}
            />
          ))}
        </div>
      ) : null}

      <QuickReactionStrip
        disabled={disableReactions}
        onToggleReaction={onToggleReaction}
      />
    </>
  )
}

function MessageRow({
  message,
  avatar,
  username,
  currentUsername,
  showHeader = false,
  disableReactions = false,
  onToggleReaction,
}) {
  return (
    <div
      className={[
        'group grid grid-cols-[2.65rem_minmax(0,1fr)] items-start gap-x-2.5 rounded-xl transition hover:bg-[rgba(255,255,255,0.035)]',
        showHeader ? 'px-4 py-1' : 'px-4 py-[1px]',
      ].join(' ')}
    >
      {showHeader ? (
        avatar ? (
          <img
            src={avatar}
            alt={username}
            loading="lazy"
            className="h-9 w-9 rounded-[0.95rem] object-cover"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-[0.95rem] bg-cyan-400/15 text-[13px] font-semibold text-[var(--orbit-text)]">
            {username.slice(0, 1).toUpperCase()}
          </div>
        )
      ) : (
        <div className="flex h-[1.28rem] w-11 items-center justify-end pr-1.5 text-[10px] leading-none text-[var(--orbit-text-subtle)] opacity-0 transition group-hover:opacity-100">
          {formatMessageTime(message.timestamp ?? message.created_at)}
        </div>
      )}

      <div className="min-w-0 pt-px">
        {showHeader ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-[13px] font-semibold leading-none text-[var(--orbit-text)]">
              {username}
            </p>
            <p className="pt-px text-[10px] leading-none text-[var(--orbit-text-subtle)]">
              {formatDate(message.timestamp ?? message.created_at)}
            </p>
            {message.is_pending ? (
              <p className="pt-px text-[10px] font-medium leading-none text-[var(--orbit-text-subtle)]">
                Sending...
              </p>
            ) : null}
          </div>
        ) : null}

        <MessageContent
          message={message}
          currentUsername={currentUsername}
          hasHeader={showHeader}
          disableReactions={disableReactions}
          onToggleReaction={(emoji) => onToggleReaction?.(message.id, emoji)}
        />
      </div>
    </div>
  )
}

function MessageBubble({
  message,
  messages = null,
  shouldAnimate = false,
  pendingReactionMessageId = null,
  onToggleReaction,
}) {
  const currentUsername = useAuthStore((state) => state.user?.username ?? '')
  const messageList = messages?.length ? messages : message ? [message] : []

  if (messageList.length === 0) {
    return null
  }

  const firstMessage = messageList[0]
  const avatar = firstMessage.sender?.avatar
  const username = firstMessage.sender?.username ?? 'Unknown'

  return (
    <article className="rounded-xl">
      <div className={shouldAnimate ? 'orbit-message-enter rounded-xl' : ''}>
        {messageList.map((groupedMessage, index) => (
          <MessageRow
            key={groupedMessage.id}
            message={groupedMessage}
            avatar={avatar}
            username={username}
            currentUsername={currentUsername}
            showHeader={index === 0}
            disableReactions={pendingReactionMessageId === groupedMessage.id}
            onToggleReaction={onToggleReaction}
          />
        ))}
      </div>
    </article>
  )
}

export default MessageBubble
