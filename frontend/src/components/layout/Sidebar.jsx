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

function Sidebar({
  servers = [],
  activeServerId,
  onSelectServer,
  onOpenCreate,
  onOpenJoin,
  isLoading = false,
  emptyMessage = 'No servers yet.',
}) {
  return (
    <aside className="flex min-h-0 flex-row items-center gap-3 border-b border-white/5 bg-[#1d2028] px-3 py-3 xl:h-full xl:flex-col xl:justify-between xl:border-b-0 xl:border-r">
      <div className="flex min-h-0 min-w-0 flex-1 items-center gap-3 xl:w-full xl:flex-col xl:items-center">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1rem] bg-gradient-to-br from-cyan-400/20 to-sky-400/5 text-sm font-semibold uppercase tracking-[0.32em] text-cyan-100 shadow-lg shadow-cyan-950/30">
          O
        </div>

        <div className="hidden h-px w-10 bg-white/10 xl:block" />

        <div className="orbit-scrollbar flex min-w-0 flex-1 items-center gap-3 overflow-x-auto pb-1 xl:min-h-0 xl:w-full xl:flex-col xl:overflow-x-visible xl:overflow-y-auto xl:pb-0">
          {isLoading ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-3 py-4 text-center text-[11px] uppercase tracking-[0.28em] text-slate-400">
              Loading
            </div>
          ) : null}

          {!isLoading && servers.length === 0 ? (
            <div className="max-w-[8rem] text-center text-[11px] leading-5 text-slate-500 xl:max-w-[4.5rem]">
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
                      ? 'border-cyan-300/60 bg-cyan-400/15 text-cyan-100 shadow-lg shadow-cyan-900/40'
                      : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10 hover:text-white',
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
          className="rounded-[0.95rem] border border-white/10 bg-white/5 px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-300 transition hover:border-white/20 hover:text-white"
        >
          Join
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
