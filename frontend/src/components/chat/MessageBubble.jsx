import formatDate from '../../utils/formatDate'

function MessageBubble({ message }) {
  const avatar = message.sender?.avatar
  const username = message.sender?.username ?? 'Unknown'

  return (
    <article className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4">
      <div className="flex items-start gap-3">
        {avatar ? (
          <img
            src={avatar}
            alt={username}
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

          {message.file_url ? (
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
