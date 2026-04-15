import BauhausEmptyState from '../ui/BauhausEmptyState'

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

function HomeIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6.25 8.5A2.25 2.25 0 0 1 8.5 6.25h7a2.25 2.25 0 0 1 2.25 2.25v5A2.25 2.25 0 0 1 15.5 15.75h-4.4l-2.85 2.4v-2.4H8.5a2.25 2.25 0 0 1-2.25-2.25Z" />
      <path d="M9.25 10.25h5.5" />
      <path d="M9.25 12.9h3.75" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  )
}

function CompassIcon() {
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
      <circle cx="12" cy="12" r="8.5" />
      <path d="m14.9 9.1-2.7 5.8-3-3 5.7-2.8Z" />
    </svg>
  )
}

function getAvatarLabel(entity) {
  if (entity?.avatar) {
    return (
      <img
        src={entity.avatar}
        alt={entity.username}
        className="h-full w-full rounded-[1rem] object-cover"
      />
    )
  }

  return getInitials(entity?.username)
}

function getServerLabel(server) {
  if (server?.icon) {
    return (
      <img
        src={server.icon}
        alt={server.name}
        className="h-full w-full rounded-[1.15rem] object-cover"
      />
    )
  }

  return getInitials(server?.name)
}

function RailButton({
  children,
  isActive = false,
  label,
  onClick,
}) {
  return (
    <div className="relative">
      <span
        className={[
          'absolute -left-2 top-1/2 hidden h-7 w-1 -translate-y-1/2 rounded-full transition xl:block',
          isActive ? 'bg-cyan-300' : 'bg-transparent',
        ].join(' ')}
      />
      <button
        type="button"
        onClick={onClick}
        title={label}
        aria-label={label}
        className={[
          'flex h-12 w-12 items-center justify-center rounded-[1rem] border text-[13px] font-semibold transition',
          isActive
            ? 'orbit-accent-surface shadow-[var(--orbit-accent-shadow)]'
            : 'border-[color:var(--orbit-border)] bg-[var(--orbit-surface-soft)] text-[var(--orbit-text-muted)] hover:border-[color:var(--orbit-border-strong)] hover:bg-[var(--orbit-surface-hover)] hover:text-[var(--orbit-text)]',
        ].join(' ')}
      >
        {children}
      </button>
    </div>
  )
}

function Sidebar({
  user = null,
  servers = [],
  activeServerId,
  isHomeActive = false,
  onOpenHome,
  onSelectServer,
  onOpenCreate,
  onOpenJoin,
  isLoading = false,
  emptyMessage = 'No servers yet.',
}) {
  return (
    <aside className="flex min-h-0 flex-row items-center gap-2 border-b border-[color:var(--orbit-border)] bg-[var(--orbit-sidebar-bg)] px-2 py-2.5 xl:h-full xl:flex-col xl:border-b-0 xl:border-r xl:px-2 xl:py-2 xl:overflow-hidden">
      <div className="flex min-h-0 min-w-0 flex-1 items-center gap-2 xl:w-full xl:flex-col xl:items-center xl:overflow-hidden">
        <div className="flex shrink-0 items-center gap-2 xl:w-full xl:flex-col xl:gap-2.5">
          <RailButton
            isActive={isHomeActive}
            label="Friends and messages"
            onClick={onOpenHome}
          >
            <HomeIcon />
          </RailButton>
        </div>

        <div className="hidden h-px w-8 bg-[var(--orbit-border)] xl:block" />

        <div className="orbit-scrollbar flex min-w-0 flex-1 items-center gap-2 overflow-x-auto pb-1 xl:min-h-0 xl:w-full xl:flex-col xl:overflow-x-visible xl:overflow-y-auto xl:justify-start xl:gap-2.5 xl:pb-1">
          {isLoading ? (
            <BauhausEmptyState message="Loading" className="p-2 text-xs" />
          ) : null}

          {!isLoading && servers.length === 0 ? (
            <div className="max-w-[8rem] text-center text-[10px] leading-4 text-[var(--orbit-text-subtle)] xl:max-w-[4.5rem]">
              {emptyMessage}
            </div>
          ) : null}

          {servers.map((server) => {
            const isActive = server.id === activeServerId

            return (
              <RailButton
                key={server.id}
                isActive={isActive}
                label={server.name}
                onClick={() => onSelectServer?.(server.id)}
              >
                {getServerLabel(server)}
              </RailButton>
            )
          })}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 xl:w-full xl:flex-col xl:items-center xl:gap-2 xl:pt-1.5">
        <button
          type="button"
          onClick={onOpenCreate}
          className="orbit-accent-surface flex h-8 w-8 items-center justify-center rounded-[0.85rem] border border-dashed transition sm:h-9 sm:w-9 sm:rounded-[0.9rem]"
          aria-label="Create server"
          title="Create server"
        >
          <PlusIcon />
        </button>

        <button
          type="button"
          onClick={onOpenJoin}
          className="orbit-secondary-button flex h-8 w-8 items-center justify-center rounded-[0.85rem] sm:h-9 sm:w-9 sm:rounded-[0.9rem]"
          aria-label="Join server"
          title="Join server"
        >
          <CompassIcon />
        </button>

        <div className="hidden h-px w-8 bg-[var(--orbit-border)] xl:block" />

        <div className="hidden xl:flex flex-col items-center gap-1.5">
          <div
            title={`${user?.username ?? 'Profile'} • ${user?.is_online ? 'Online' : 'Offline'}`}
            className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-[1rem] border border-[color:var(--orbit-border)] bg-[var(--orbit-surface-soft)] text-[13px] font-semibold text-[var(--orbit-text)]"
          >
            {getAvatarLabel(user)}
            <span
              className={[
                'absolute bottom-1 right-1 h-3 w-3 rounded-full border-2 border-[var(--orbit-surface-soft)]',
                user?.is_online ? 'bg-emerald-400' : 'bg-slate-500',
              ].join(' ')}
            />
          </div>
        </div>

        <div className="min-w-0 max-w-[9.5rem] rounded-[0.95rem] border border-[color:var(--orbit-border)] bg-[var(--orbit-surface-soft)] px-1.5 py-1.5 sm:max-w-[11rem] sm:px-2 sm:py-2 xl:hidden xl:w-full">
          <div className="flex items-center gap-2">
            <div className="relative h-9 w-9 shrink-0">
              <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-[0.95rem] bg-[var(--orbit-accent-soft)] text-[13px] font-semibold text-[var(--orbit-accent-ink)]">
                {getAvatarLabel(user)}
              </div>
              <span
                className={[
                  'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[var(--orbit-surface-soft)]',
                  user?.is_online ? 'bg-emerald-400' : 'bg-slate-500',
                ].join(' ')}
              />
            </div>

            <div className="min-w-0 flex-1 hidden sm:block">
              <p className="truncate text-[12px] font-medium text-[var(--orbit-text)]">
                {user?.username ?? 'Profile'}
              </p>
              <p className="truncate text-[9px] font-medium uppercase tracking-[0.12em] text-[var(--orbit-text-subtle)]">
                {user?.is_online ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
