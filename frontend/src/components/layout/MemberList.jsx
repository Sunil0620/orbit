import BauhausEmptyState from '../ui/BauhausEmptyState'

function MemberList({
  server,
  directConversation = null,
  homeMode = false,
  contacts = [],
  isLoading = false,
  error = '',
  onOpenContact,
  isMobileVisible = true,
}) {
  const dmMode = Boolean(directConversation)
  const visibilityClass = isMobileVisible ? 'flex' : 'hidden'
  const panelTitle = homeMode ? 'People' : dmMode ? 'Conversation' : 'Members'
  const panelDescription = homeMode
    ? 'Start a new direct message from here.'
    : dmMode
      ? 'Profile for this direct message.'
      : `${server?.members?.length ?? 0} member${(server?.members?.length ?? 0) === 1 ? '' : 's'} in this server.`
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
    const canOpenConversation = Boolean(member.hasDirectConversation || member.can_message)
    const memberMeta = homeMode
      ? member.hasDirectConversation
        ? 'In direct messages'
        : canOpenConversation
          ? 'Start conversation'
          : 'Shared server required'
      : dmMode
        ? member.is_online
          ? 'Online'
          : 'Offline'
        : roleLabel
    const content = (
      <>
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
            {memberMeta}
          </p>
        </div>
      </>
    )

    if (homeMode) {
      return (
        <button
          key={member.id}
          type="button"
          onClick={() => {
            if (canOpenConversation) {
              onOpenContact?.(member)
            }
          }}
          disabled={!canOpenConversation}
          className={[
            'flex w-full items-center gap-2.5 rounded-[0.8rem] px-2 py-1.5 text-left transition',
            canOpenConversation
              ? 'hover:bg-[var(--orbit-surface-soft)]'
              : 'cursor-not-allowed opacity-75',
          ].join(' ')}
        >
          {content}
        </button>
      )
    }

    return (
      <div
        key={member.id}
        className="flex items-center gap-2.5 rounded-[0.8rem] px-2 py-1.5 transition hover:bg-[var(--orbit-surface-soft)]"
      >
        {content}
      </div>
    )
  }

  return (
    <aside
      className={[
        visibilityClass,
        'min-h-0 min-w-0 flex-1 flex-col bg-[var(--orbit-member-bg)] xl:flex xl:h-full xl:border-l xl:border-[color:var(--orbit-border)]',
      ].join(' ')}
    >
      <div className="border-b border-[color:var(--orbit-border)] px-3 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--orbit-text-subtle)]">
          {panelTitle}
        </p>
        <p className="mt-2 text-[12px] leading-5 text-[var(--orbit-text-muted)]">
          {panelDescription}
        </p>
      </div>

      <div className="orbit-scrollbar flex-1 space-y-5 overflow-y-auto px-3 py-3">
        {error ? (
          <div className="orbit-danger-banner rounded-2xl border px-4 py-4 text-sm leading-6">
            {error}
          </div>
        ) : null}

        {isLoading && members.length === 0 ? (
          <BauhausEmptyState
            message={homeMode ? 'Loading people.' : 'Loading members.'}
            className="p-4"
          />
        ) : null}

        {!isLoading && members.length > 0 ? (
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
        ) : !isLoading && !error ? (
          <BauhausEmptyState message={homeMode ? 'No people to show yet.' : 'No members to show yet.'} className="p-4" />
        ) : null}
      </div>
    </aside>
  )
}

export default MemberList
