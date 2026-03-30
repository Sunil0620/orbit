function MemberList({
  server,
  directConversation = null,
  homeMode = false,
  contacts = [],
}) {
  const dmMode = Boolean(directConversation)
  const members = homeMode
    ? contacts
    : dmMode
      ? directConversation?.participant
        ? [directConversation.participant]
        : []
      : server?.members ?? []
  const activeMembers = members.filter((member) => member.is_online)
  const offlineMembers = members.filter((member) => !member.is_online)

  const renderMember = (member) => {
    const roleLabel =
      member.role === 'owner'
        ? 'Owner'
        : member.role === 'admin'
          ? 'Admin'
          : 'Member'

    return (
      <div
        key={member.id}
        className="flex items-center gap-2.5 rounded-[0.8rem] px-2 py-1.5 transition hover:bg-[var(--orbit-surface-soft)]"
      >
        <div className="relative">
          {member.avatar ? (
            <img
              src={member.avatar}
              alt={member.username}
              className="h-8 w-8 rounded-[0.85rem] object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-[0.85rem] bg-cyan-400/15 text-[13px] font-semibold text-[var(--orbit-text)]">
              {member.username.slice(0, 1).toUpperCase()}
            </div>
          )}
          <span
            style={{ borderColor: 'var(--orbit-member-bg)' }}
            className={[
              'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2',
              member.is_online ? 'bg-emerald-400' : 'bg-slate-500',
            ].join(' ')}
          />
        </div>

        <div className="min-w-0">
          <p className="truncate text-[12px] font-medium text-[var(--orbit-text)]">
            {member.username}
          </p>
          <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[var(--orbit-text-subtle)]">
            {homeMode || dmMode ? (member.is_online ? 'Online' : 'Offline') : roleLabel}
          </p>
        </div>
      </div>
    )
  }

  return (
    <aside className="hidden h-full min-h-0 flex-col bg-[var(--orbit-member-bg)] xl:flex xl:border-l xl:border-[color:var(--orbit-border)]">
      <div className="orbit-scrollbar flex-1 space-y-5 overflow-y-auto px-3 py-3">
        {members.length > 0 ? (
          <>
            <section>
              <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--orbit-text-subtle)]">
                Online — {activeMembers.length}
              </p>
              <div className="space-y-1">
                {activeMembers.map(renderMember)}
              </div>
            </section>

            <section>
              <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--orbit-text-subtle)]">
                Offline — {offlineMembers.length}
              </p>
              <div className="space-y-1">
                {offlineMembers.map(renderMember)}
              </div>
            </section>
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-[color:var(--orbit-border)] bg-[var(--orbit-surface-soft)] px-4 py-5 text-[12px] leading-5 text-[var(--orbit-text-muted)]">
            {homeMode ? 'No people to show yet.' : 'No members to show yet.'}
          </div>
        )}
      </div>
    </aside>
  )
}

export default MemberList
