import useAuthStore from '../../store/useAuthStore'
import formatDate from '../../utils/formatDate'

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

function MessageBubble({ message, shouldAnimate = false }) {
  const currentUsername = useAuthStore((state) => state.user?.username ?? '')
  const avatar = message.sender?.avatar
  const username = message.sender?.username ?? 'Unknown'
  const fileType = message.file_type ?? ''
  const isImageAttachment = fileType.startsWith('image/')
  const isDownloadableFile = fileType === 'application/pdf' || fileType === 'text/plain'
  const normalizedCurrentUsername = currentUsername.toLowerCase()
  const mentionPattern = currentUsername
    ? new RegExp(`(@${currentUsername.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}\\b)`, 'gi')
    : null
  const contentSegments = mentionPattern
    ? (message.content ?? '').split(mentionPattern)
    : [message.content ?? '']

  return (
    <article
      className={[
        'group rounded-2xl px-3 py-2 transition hover:bg-[var(--orbit-surface-soft)]',
        shouldAnimate ? 'orbit-message-enter' : '',
      ].join(' ')}
    >
      <div className="flex items-start gap-3">
        {avatar ? (
          <img
            src={avatar}
            alt={username}
            loading="lazy"
            className="h-11 w-11 rounded-2xl object-cover"
          />
        ) : (
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/15 text-sm font-semibold text-[var(--orbit-text)]">
            {username.slice(0, 1).toUpperCase()}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-[var(--orbit-text)]">{username}</p>
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--orbit-text-subtle)]">
              {formatDate(message.timestamp ?? message.created_at)}
            </p>
          </div>

          {message.content ? (
            <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-7 text-[var(--orbit-text-muted)] [overflow-wrap:anywhere]">
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

          {message.file_url && isImageAttachment ? (
            <img
              src={message.file_url}
              alt={message.file_name || 'Chat attachment'}
              loading="lazy"
              className="mt-3 max-h-[26rem] w-auto max-w-full rounded-2xl border border-[color:var(--orbit-border)] bg-[var(--orbit-surface-0)] object-cover shadow-lg shadow-black/15"
            />
          ) : null}

          {message.file_url && isDownloadableFile ? (
            <div className="mt-3 flex max-w-xl items-center justify-between gap-3 rounded-2xl border border-[color:var(--orbit-border)] bg-[var(--orbit-surface-soft)] px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="rounded-xl bg-cyan-400/10 p-2 text-[var(--orbit-text)]">
                  <AttachmentIcon />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[var(--orbit-text)]">
                    {message.file_name || 'Attachment'}
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--orbit-text-subtle)]">
                    {fileType === 'application/pdf' ? 'PDF' : 'Text file'}
                  </p>
                </div>
              </div>

              <a
                href={message.file_url}
                download={message.file_name || true}
                target="_blank"
                rel="noreferrer"
                className="orbit-secondary-button shrink-0 rounded-full px-3 py-2 text-[10px] font-medium uppercase tracking-[0.24em]"
              >
                Download
              </a>
            </div>
          ) : null}

          {message.file_url && !isImageAttachment && !isDownloadableFile ? (
            <a
              href={message.file_url}
              target="_blank"
              rel="noreferrer"
              className="orbit-secondary-button mt-3 inline-flex rounded-full px-3 py-2 text-xs font-medium uppercase tracking-[0.24em]"
            >
              {message.file_name || 'Open attachment'}
            </a>
          ) : null}
        </div>
      </div>
    </article>
  )
}

export default MessageBubble
