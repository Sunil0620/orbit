function MemberList({ server }) {
  const members = server?.members ?? []
  const onlineCount = members.filter((member) => member.is_online).length
  const activeMembers = members.filter((member) => member.is_online)
  const offlineMembers = members.filter((member) => !member.is_online)
  const memberCountLabel =
    members.length === 1 ? `1 member in ${server?.name}` : `${members.length} members in ${server?.name}`

  const renderMember = (member) => {
    const isOwner = member.id === server.owner?.id

    return (
      <div
        key={member.id}
        className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition hover:bg-white/5"
      >
        <div className="relative">
          {member.avatar ? (
            <img
              src={member.avatar}
              alt={member.username}
              className="h-8 w-8 rounded-xl object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-400/15 text-sm font-semibold text-cyan-100">
              {member.username.slice(0, 1).toUpperCase()}
            </div>
          )}
          <span
            className={[
              'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#2b2d31]',
              member.is_online ? 'bg-emerald-400' : 'bg-slate-500',
            ].join(' ')}
          />
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">
            {member.username}
          </p>
          <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500">
            {isOwner ? 'Owner' : member.is_online ? 'Active' : 'Offline'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <aside className="hidden h-full min-h-0 flex-col bg-[#23262d] xl:flex xl:border-l xl:border-white/5">
      <div className="border-b border-white/5 px-4 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-500">
          Members
        </p>
        <h2 className="mt-2 text-lg font-semibold text-white">
          {server ? memberCountLabel : 'No server selected'}
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          {server
            ? `${onlineCount} online right now`
            : 'Select a server to see who is here.'}
        </p>
      </div>

      <div className="orbit-scrollbar flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {members.length > 0 ? (
          <>
            <section>
              <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                Active — {activeMembers.length}
              </p>
              <div className="space-y-1">
                {activeMembers.map(renderMember)}
              </div>
            </section>

            <section>
              <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                Offline — {offlineMembers.length}
              </p>
              <div className="space-y-1">
                {offlineMembers.map(renderMember)}
              </div>
            </section>
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-5 text-sm leading-6 text-slate-400">
            No members to show yet.
          </div>
        )}
      </div>
    </aside>
  )
}

export default MemberList
