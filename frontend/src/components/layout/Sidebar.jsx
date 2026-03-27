import useThemeStore from '../../store/useThemeStore'

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

function SunIcon() {
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
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2.5" />
      <path d="M12 19.5V22" />
      <path d="m4.93 4.93 1.77 1.77" />
      <path d="m17.3 17.3 1.77 1.77" />
      <path d="M2 12h2.5" />
      <path d="M19.5 12H22" />
      <path d="m4.93 19.07 1.77-1.77" />
      <path d="m17.3 6.7 1.77-1.77" />
    </svg>
  )
}

function MoonIcon() {
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
      <path d="M21 12.8A9 9 0 1 1 11.2 3c-.1.4-.2.9-.2 1.4a8 8 0 0 0 8 8c.5 0 1-.1 1.5-.2Z" />
    </svg>
  )
}

function Sidebar({
  servers = [],
  activeServerId,
  onSelectServer,
  onOpenCreate,
  onOpenJoin,
  isLoading = false,
  emptyMessage = 'No servers yet.',
}) {
  const theme = useThemeStore((state) => state.theme)
  const toggleTheme = useThemeStore((state) => state.toggleTheme)

  return (
    <aside className="flex min-h-0 flex-row items-center gap-3 border-b border-[color:var(--orbit-border)] bg-[var(--orbit-sidebar-bg)] px-3 py-3 xl:h-full xl:flex-col xl:justify-between xl:border-b-0 xl:border-r">
      <div className="flex min-h-0 min-w-0 flex-1 items-center gap-3 xl:w-full xl:flex-col xl:items-center">
        <div className="flex shrink-0 items-center gap-3 xl:w-full xl:flex-col xl:gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-[1rem] bg-gradient-to-br from-cyan-400/20 to-sky-400/5 text-sm font-semibold uppercase tracking-[0.32em] text-[var(--orbit-text)] shadow-lg shadow-cyan-950/20">
            O
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="orbit-secondary-button flex h-10 w-10 items-center justify-center rounded-[0.95rem]"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>

        <div className="hidden h-px w-10 bg-[var(--orbit-border)] xl:block" />

        <div className="orbit-scrollbar flex min-w-0 flex-1 items-center gap-3 overflow-x-auto pb-1 xl:min-h-0 xl:w-full xl:flex-col xl:overflow-x-visible xl:overflow-y-auto xl:pb-0">
          {isLoading ? (
            <div className="rounded-2xl border border-dashed border-[color:var(--orbit-border)] bg-[var(--orbit-surface-soft)] px-3 py-4 text-center text-[11px] uppercase tracking-[0.28em] text-[var(--orbit-text-muted)]">
              Loading
            </div>
          ) : null}

          {!isLoading && servers.length === 0 ? (
            <div className="max-w-[8rem] text-center text-[11px] leading-5 text-[var(--orbit-text-subtle)] xl:max-w-[4.5rem]">
              {emptyMessage}
            </div>
          ) : null}

          {servers.map((server) => {
            const isActive = server.id === activeServerId

            return (
              <div key={server.id} className="relative">
                <span
                  className={[
                    'absolute -left-2 top-1/2 hidden h-8 w-1 -translate-y-1/2 rounded-full transition xl:block',
                    isActive ? 'bg-cyan-300' : 'bg-transparent',
                  ].join(' ')}
                />
                <button
                  type="button"
                  onClick={() => onSelectServer?.(server.id)}
                  className={[
                    'flex h-14 w-14 items-center justify-center rounded-[1.15rem] border text-sm font-semibold transition',
                    isActive
                      ? 'border-cyan-300/60 bg-cyan-400/15 text-[var(--orbit-text)] shadow-lg shadow-cyan-900/20'
                      : 'border-[color:var(--orbit-border)] bg-[var(--orbit-surface-soft)] text-[var(--orbit-text-muted)] hover:border-[color:var(--orbit-border-strong)] hover:bg-[var(--orbit-surface-hover)] hover:text-[var(--orbit-text)]',
                  ].join(' ')}
                  title={server.name}
                >
                  {getServerLabel(server)}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex shrink-0 gap-3 xl:flex-col">
        <button
          type="button"
          onClick={onOpenCreate}
          className="flex h-10 w-10 items-center justify-center rounded-[0.95rem] border border-dashed border-cyan-300/25 bg-cyan-400/10 text-lg text-cyan-100 transition hover:border-cyan-300/60 hover:bg-cyan-400/15"
          aria-label="Create server"
        >
          +
        </button>
        <button
          type="button"
          onClick={onOpenJoin}
          className="orbit-secondary-button rounded-[0.95rem] px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.3em]"
        >
          Join
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
