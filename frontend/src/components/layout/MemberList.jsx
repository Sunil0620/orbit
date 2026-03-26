function MemberList({ server }) {
  const members = server?.members ?? []

  return (
    <aside className="flex h-full flex-col rounded-[2rem] border border-white/10 bg-slate-900/90 p-5">
      <div className="border-b border-white/10 pb-4">
        <p className="text-xs uppercase tracking-[0.35em] text-slate-400">
          Members
        </p>
        <h2 className="mt-2 text-xl font-semibold text-white">
          {server ? `${members.length} in ${server.name}` : 'No server selected'}
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Placeholder presence dots land here before realtime status wiring.
        </p>
      </div>

      <div className="mt-5 flex-1 space-y-3 overflow-y-auto pr-1">
        {members.length > 0 ? (
          members.map((member) => {
            const isOwner = member.id === server.owner?.id

            return (
              <div
                key={member.id}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
              >
                <div className="relative">
                  {member.avatar ? (
                    <img
                      src={member.avatar}
                      alt={member.username}
                      className="h-10 w-10 rounded-2xl object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-400/15 text-sm font-semibold text-cyan-100">
                      {member.username.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <span
                    className={[
                      'absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-slate-900',
                      member.is_online ? 'bg-emerald-400' : 'bg-slate-500',
                    ].join(' ')}
                  />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">
                    {member.username}
                  </p>
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
                    {isOwner ? 'Owner' : member.is_online ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>
            )
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-5 text-sm leading-6 text-slate-400">
            Choose a server to inspect its members.
          </div>
        )}
      </div>
    </aside>
  )
}

export default MemberList
