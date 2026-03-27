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

function MessageBubble({ message }) {
  const avatar = message.sender?.avatar
  const username = message.sender?.username ?? 'Unknown'
  const fileType = message.file_type ?? ''
  const isImageAttachment = fileType.startsWith('image/')
  const isDownloadableFile = fileType === 'application/pdf' || fileType === 'text/plain'

  return (
    <article className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4">
      <div className="flex items-start gap-3">
        {avatar ? (
          <img
            src={avatar}
            alt={username}
            loading="lazy"
            className="h-11 w-11 rounded-2xl object-cover"
          />
        ) : (
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/15 text-sm font-semibold text-cyan-100">
            {username.slice(0, 1).toUpperCase()}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-white">{username}</p>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
              {formatDate(message.timestamp ?? message.created_at)}
            </p>
          </div>

          {message.content ? (
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-200">
              {message.content}
            </p>
          ) : null}

          {message.file_url && isImageAttachment ? (
            <img
              src={message.file_url}
              alt={message.file_name || 'Chat attachment'}
              loading="lazy"
              className="mt-3 max-w-xs rounded-lg object-cover"
            />
          ) : null}

          {message.file_url && isDownloadableFile ? (
            <div className="mt-3 flex max-w-sm items-center justify-between gap-3 rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="rounded-xl bg-cyan-950/60 p-2 text-cyan-100">
                  <AttachmentIcon />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-cyan-50">
                    {message.file_name || 'Attachment'}
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.28em] text-cyan-200/75">
                    {fileType === 'application/pdf' ? 'PDF' : 'Text file'}
                  </p>
                </div>
              </div>

              <a
                href={message.file_url}
                download={message.file_name || true}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 rounded-full border border-cyan-300/30 px-3 py-2 text-[10px] font-medium uppercase tracking-[0.24em] text-cyan-100 transition hover:border-cyan-300/50 hover:bg-cyan-400/10"
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
              className="mt-3 inline-flex rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-2 text-xs font-medium uppercase tracking-[0.24em] text-cyan-100 transition hover:border-cyan-300/40 hover:bg-cyan-400/15"
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
