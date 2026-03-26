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

function Sidebar({
  servers = [],
  activeServerId,
  onSelectServer,
  onOpenCreate,
  onOpenJoin,
}) {
  return (
    <aside className="flex h-full flex-col items-center gap-4 rounded-[2rem] border border-white/10 bg-slate-950/90 px-3 py-5">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/10 text-xs font-semibold uppercase tracking-[0.35em] text-cyan-100">
        Orb
      </div>

      <div className="h-px w-10 bg-white/10" />

      <div className="flex flex-1 flex-col items-center gap-3">
        {servers.map((server) => {
          const isActive = server.id === activeServerId

          return (
            <button
              key={server.id}
              type="button"
              onClick={() => onSelectServer?.(server.id)}
              className={[
                'flex h-14 w-14 items-center justify-center rounded-2xl border text-sm font-semibold transition',
                isActive
                  ? 'border-cyan-300/60 bg-cyan-400/15 text-cyan-100 shadow-lg shadow-cyan-900/40'
                  : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10 hover:text-white',
              ].join(' ')}
              title={server.name}
            >
              {server.icon ? (
                <img
                  src={server.icon}
                  alt={server.name}
                  className="h-full w-full rounded-2xl object-cover"
                />
              ) : (
                getInitials(server.name)
              )}
            </button>
          )
        })}
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={onOpenCreate}
          className="flex h-12 w-12 items-center justify-center rounded-2xl border border-dashed border-cyan-300/30 bg-cyan-400/10 text-xl text-cyan-100 transition hover:border-cyan-300/60 hover:bg-cyan-400/15"
          aria-label="Create server"
        >
          +
        </button>
        <button
          type="button"
          onClick={onOpenJoin}
          className="rounded-2xl border border-white/10 bg-white/5 px-2 py-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-300 transition hover:border-white/20 hover:text-white"
        >
          Join
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
