import { Link } from 'react-router-dom'

function getInitials(name) {
  if (!name) {
    return 'OR'
  }

  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function ChannelList({
  server,
  channels = [],
  activeChannelId,
  unreadCountByChannel = {},
  onSelectChannel,
  settingsHref,
  isLoading = false,
  error = '',
}) {
  return (
    <aside className="flex h-full min-h-0 flex-col border-b border-[color:var(--orbit-border)] bg-[var(--orbit-channel-bg)] xl:border-b-0 xl:border-r">
      <div className="flex items-center justify-between gap-3 border-b border-[color:var(--orbit-border)] px-4 py-4 shadow-[0_1px_0_rgba(255,255,255,0.03)]">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[var(--orbit-text-subtle)]">
            Server
          </p>
          <div className="mt-1 flex min-w-0 items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[color:var(--orbit-border)] bg-[var(--orbit-surface-soft)] text-[11px] font-semibold text-[var(--orbit-text)]">
              {server?.icon ? (
                <img
                  src={server.icon}
                  alt={server.name}
                  className="h-full w-full rounded-xl object-cover"
                />
              ) : (
                getInitials(server?.name)
              )}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-[15px] font-semibold text-[var(--orbit-text)]">
                {server?.name ?? 'Select a server'}
              </h2>
              <p className="truncate text-xs text-[var(--orbit-text-muted)]">
                {server
                  ? `${channels.length} channel${channels.length === 1 ? '' : 's'}`
                  : 'Choose a server from the rail.'}
              </p>
            </div>
          </div>
        </div>

        {settingsHref ? (
          <Link
            className="orbit-secondary-button rounded-lg px-2.5 py-2 text-[10px] font-semibold uppercase tracking-[0.24em]"
            to={settingsHref}
          >
            Manage
          </Link>
        ) : null}
      </div>

      <div className="orbit-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto px-2 py-3">
        {error ? (
          <div className="mx-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-4 text-sm leading-6 text-red-100">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="mx-2 rounded-2xl border border-dashed border-[color:var(--orbit-border)] bg-[var(--orbit-surface-soft)] px-4 py-5 text-sm leading-6 text-[var(--orbit-text-muted)]">
            Loading channels for the selected server.
          </div>
        ) : null}

        {channels.length > 0 ? (
          <div className="mb-2 mt-1 flex items-center justify-between px-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--orbit-text-subtle)]">
              Text Channels
            </p>
            <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--orbit-text-subtle)]">
              {channels.length}
            </span>
          </div>
        ) : null}

        {channels.length > 0 ? (
          channels.map((channel) => {
            const isActive = channel.id === activeChannelId
            const unreadCount = unreadCountByChannel[channel.id] ?? 0

            return (
              <button
                key={channel.id}
                type="button"
                onClick={() => onSelectChannel?.(channel.id)}
                className={[
                  'group mb-0.5 flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left transition',
                  isActive
                    ? 'border border-[color:var(--orbit-border)] bg-[var(--orbit-surface-hover)] text-[var(--orbit-text)]'
                    : 'text-[var(--orbit-text-muted)] hover:bg-[var(--orbit-surface-soft)] hover:text-[var(--orbit-text)]',
                ].join(' ')}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className={[
                      'text-base leading-none transition',
                      isActive
                        ? 'text-[var(--orbit-text)]'
                        : 'text-[var(--orbit-text-subtle)] group-hover:text-[var(--orbit-text-muted)]',
                    ].join(' ')}
                  >
                    #
                  </span>
                  <span className="truncate text-[15px] font-medium">
                    {channel.name}
                  </span>
                  {unreadCount > 0 ? (
                    <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                      {unreadCount}
                    </span>
                  ) : null}
                </div>
              </button>
            )
          })
        ) : !isLoading && !error ? (
          <div className="mx-2 rounded-2xl border border-dashed border-[color:var(--orbit-border)] bg-[var(--orbit-surface-soft)] px-4 py-5 text-sm leading-6 text-[var(--orbit-text-muted)]">
            {server
              ? 'No channels yet.'
              : 'Pick a server to see its channels.'}
          </div>
        ) : null}
      </div>
    </aside>
  )
}

export default ChannelList
