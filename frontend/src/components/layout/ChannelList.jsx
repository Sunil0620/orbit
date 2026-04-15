import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
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

function getAvatarLabel(contact) {
  if (contact?.avatar) {
    return (
      <img
        src={contact.avatar}
        alt={contact.username}
        className="h-full w-full rounded-xl object-cover"
      />
    )
  }

  return getInitials(contact?.username)
}

function ChevronIcon({ isOpen = false }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={[
        'h-4 w-4 shrink-0 transition duration-200',
        isOpen ? 'rotate-180 text-[var(--orbit-text)]' : 'text-[var(--orbit-text-muted)]',
      ].join(' ')}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
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

function SettingsIcon() {
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
      <path d="M12 3.75a2.25 2.25 0 0 1 2.19 1.72l.2.81a1.5 1.5 0 0 0 1.86 1.09l.8-.22a2.25 2.25 0 0 1 2.74 2.73l-.22.81a1.5 1.5 0 0 0 1.08 1.86l.82.2a2.25 2.25 0 0 1 0 4.38l-.82.2a1.5 1.5 0 0 0-1.08 1.86l.22.8a2.25 2.25 0 0 1-2.73 2.74l-.81-.22a1.5 1.5 0 0 0-1.86 1.08l-.2.82a2.25 2.25 0 0 1-4.38 0l-.2-.82a1.5 1.5 0 0 0-1.86-1.08l-.8.22a2.25 2.25 0 0 1-2.74-2.73l.22-.81a1.5 1.5 0 0 0-1.08-1.86l-.82-.2a2.25 2.25 0 0 1 0-4.38l.82-.2a1.5 1.5 0 0 0 1.08-1.86l-.22-.8a2.25 2.25 0 0 1 2.73-2.74l.81.22a1.5 1.5 0 0 0 1.86-1.08l.2-.82A2.25 2.25 0 0 1 12 3.75Z" />
      <circle cx="12" cy="12" r="2.85" />
    </svg>
  )
}

function InviteIcon() {
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
      <circle cx="9" cy="8.5" r="2.5" />
      <path d="M4.5 18a4.5 4.5 0 0 1 9 0" />
      <path d="M17 8v6" />
      <path d="M14 11h6" />
    </svg>
  )
}

function TrashIcon() {
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
      <path d="M4 7h16" />
      <path d="M9 7V4.75A1.75 1.75 0 0 1 10.75 3h2.5A1.75 1.75 0 0 1 15 4.75V7" />
      <path d="M6.5 7 7.4 18.02A2 2 0 0 0 9.39 20h5.22a2 2 0 0 0 1.99-1.98L17.5 7" />
      <path d="M10 11.25v4.5" />
      <path d="M14 11.25v4.5" />
    </svg>
  )
}

function MenuAction({ children, onClick, to, tone = 'default' }) {
  const className = [
    'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[13px] transition',
    tone === 'danger'
      ? 'text-[var(--orbit-danger-ink)] hover:bg-red-500/10'
      : 'text-[var(--orbit-text)] hover:bg-[var(--orbit-surface-soft)]',
  ].join(' ')

  if (to) {
    return (
      <Link to={to} onClick={onClick} className={className}>
        {children}
      </Link>
    )
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {children}
    </button>
  )
}

function ChannelList({
  server,
  homeMode = false,
  directConversations = [],
  activeDirectConversationId = null,
  channels = [],
  activeChannelId,
  unreadCountByChannel = {},
  onSelectChannel,
  onSelectDirectConversation,
  onOpenCreateChannel,
  onDeleteChannel,
  onCopyInviteCode,
  settingsHref,
  canManageChannels = false,
  canInviteMembers = false,
  isLoading = false,
  error = '',
  isMobileVisible = true,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const visibilityClass = isMobileVisible ? 'flex' : 'hidden'
  const asideClass = [
    visibilityClass,
    'min-h-0 min-w-0 flex-1 flex-col bg-[var(--orbit-channel-bg)] xl:flex xl:h-full xl:border-r xl:border-[color:var(--orbit-border)]',
  ].join(' ')

  useEffect(() => {
    function handlePointerDown(event) {
      if (!menuRef.current?.contains(event.target)) {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [])

  const currentRoleLabel =
    server?.current_user_role === 'owner'
      ? 'Owner'
      : server?.current_user_role === 'admin'
        ? 'Admin'
        : 'Member'

  if (homeMode) {
    return (
      <aside className={asideClass}>
        <div className="border-b border-[color:var(--orbit-border)] px-4 py-4 shadow-[0_1px_0_rgba(255,255,255,0.03)]">
          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[var(--orbit-text-subtle)]">
            Inbox
          </p>
          <h2 className="mt-2 text-[14px] font-semibold text-[var(--orbit-text)]">
            Direct Messages
          </h2>
          <p className="mt-1 text-[12px] leading-5 text-[var(--orbit-text-muted)]">
            Your recent conversations
          </p>
        </div>

        <div className="orbit-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto px-2 py-3">
          {error ? (
            <div className="orbit-danger-banner mx-2 mb-3 rounded-2xl border px-4 py-4 text-sm leading-6">
              {error}
            </div>
          ) : null}

          <div className="mb-2 px-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--orbit-text-subtle)]">
              Direct Messages
            </p>
          </div>

          {isLoading ? (
            <BauhausEmptyState message="Loading your direct messages." className="mx-2 mb-4 p-4" />
          ) : null}

          {!isLoading && directConversations.length > 0 ? (
            <div className="space-y-0.5">
              {directConversations.map((conversation) => {
                const participant = conversation.participant
                const isActive = conversation.id === activeDirectConversationId
                const unreadCount = isActive ? 0 : Number(conversation.unread_count ?? 0)

                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => onSelectDirectConversation?.(conversation.id)}
                    className={[
                      'flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition',
                      isActive
                        ? 'bg-[var(--orbit-surface-hover)]'
                        : 'hover:bg-[var(--orbit-surface-soft)]',
                    ].join(' ')}
                  >
                    <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-[0.9rem] bg-cyan-400/15 text-[12px] font-semibold text-[var(--orbit-text)]">
                      {getAvatarLabel(participant)}
                      <span
                        className={[
                          'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[var(--orbit-channel-bg)]',
                          participant?.is_online ? 'bg-emerald-400' : 'bg-slate-500',
                        ].join(' ')}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-[13px] font-medium text-[var(--orbit-text)]">
                          {participant?.username ?? 'Unknown user'}
                        </p>
                        {unreadCount > 0 ? (
                          <span className="shrink-0 rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                            {unreadCount}
                          </span>
                        ) : null}
                      </div>
                      <p className="truncate text-[11px] leading-4 text-[var(--orbit-text-muted)]">
                        {conversation.last_message_sender_username
                          ? `${conversation.last_message_sender_username}: `
                          : ''}
                        {conversation.last_message_preview || 'Open the conversation'}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          ) : !isLoading ? (
            <BauhausEmptyState
              message="Your direct messages will appear here."
              className="mx-2 p-4"
            />
          ) : null}
        </div>
      </aside>
    )
  }

  return (
    <aside className={asideClass}>
      <div
        ref={menuRef}
        className="relative border-b border-[color:var(--orbit-border)] shadow-[0_1px_0_rgba(255,255,255,0.03)]"
      >
        <button
          type="button"
          onClick={() => setIsMenuOpen((currentValue) => !currentValue)}
          className="flex w-full items-center justify-between gap-3 px-3.5 py-3 text-left transition hover:bg-[var(--orbit-surface-soft)]"
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.9rem] border border-[color:var(--orbit-border)] bg-[var(--orbit-surface-soft)] text-[10px] font-semibold text-[var(--orbit-text)]">
              {server?.icon ? (
                <img
                  src={server.icon}
                  alt={server.name}
                  className="h-full w-full rounded-[0.9rem] object-cover"
                />
              ) : (
                getInitials(server?.name)
              )}
            </div>

            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                <h2 className="truncate text-[13px] font-semibold text-[var(--orbit-text)]">
                  {server?.name ?? 'Select a server'}
                </h2>
                {server ? (
                  <span className="shrink-0 rounded-full border border-[color:var(--orbit-border)] bg-[var(--orbit-surface-soft)] px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.12em] text-[var(--orbit-text-subtle)]">
                    {currentRoleLabel}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <ChevronIcon isOpen={isMenuOpen} />
        </button>

        {isMenuOpen && server ? (
          <div className="absolute inset-x-3 top-[calc(100%-0.35rem)] z-20 rounded-[1.15rem] border border-[color:var(--orbit-border)] bg-[var(--orbit-shell-bg)] p-2 shadow-[0_18px_44px_rgba(0,0,0,0.32)] backdrop-blur">
            <div className="border-b border-[color:var(--orbit-border)] px-3 pb-2 pt-1">
              <p className="text-[13px] font-semibold text-[var(--orbit-text)]">{server.name}</p>
              <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--orbit-text-subtle)]">
                {channels.length} channel{channels.length === 1 ? '' : 's'} available
              </p>
            </div>

            <div className="mt-2 space-y-1">
              {canInviteMembers && onCopyInviteCode ? (
                <MenuAction
                  onClick={() => {
                    onCopyInviteCode()
                    setIsMenuOpen(false)
                  }}
                >
                  <InviteIcon />
                  <span>Invite people</span>
                </MenuAction>
              ) : null}

              {canManageChannels ? (
                <MenuAction
                  onClick={() => {
                    onOpenCreateChannel?.()
                    setIsMenuOpen(false)
                  }}
                >
                  <PlusIcon />
                  <span>Create channel</span>
                </MenuAction>
              ) : null}

              {settingsHref ? (
                <MenuAction
                  to={settingsHref}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <SettingsIcon />
                  <span>Server settings</span>
                </MenuAction>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      <div className="orbit-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto px-2 py-2.5">
        {error ? (
          <div className="orbit-danger-banner mx-2 rounded-2xl border px-4 py-4 text-sm leading-6">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <BauhausEmptyState message="Loading channels for the selected server." className="mx-2 p-4" />
        ) : null}

        {channels.length > 0 ? (
          <div className="mb-1.5 mt-1 flex items-center justify-between px-2">
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[var(--orbit-text-subtle)]">
              Text Channels
            </p>
            <span className="text-[8px] font-semibold uppercase tracking-[0.12em] text-[var(--orbit-text-subtle)]">
              {channels.length}
            </span>
          </div>
        ) : null}

        {channels.length > 0 ? (
          channels.map((channel) => {
            const isActive = channel.id === activeChannelId
            const unreadCount = unreadCountByChannel[channel.id] ?? 0

            return (
              <div key={channel.id} className="group mb-0.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onSelectChannel?.(channel.id)}
                  className={[
                    'flex min-w-0 flex-1 items-center justify-between rounded-[0.75rem] px-2.5 py-1.5 text-left transition',
                    isActive
                      ? 'border border-[color:var(--orbit-border)] bg-[var(--orbit-surface-hover)] text-[var(--orbit-text)]'
                      : 'text-[var(--orbit-text-muted)] hover:bg-[var(--orbit-surface-soft)] hover:text-[var(--orbit-text)]',
                  ].join(' ')}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className={[
                        'text-sm leading-none transition',
                        isActive
                          ? 'text-[var(--orbit-text)]'
                          : 'text-[var(--orbit-text-subtle)] group-hover:text-[var(--orbit-text-muted)]',
                      ].join(' ')}
                    >
                      #
                    </span>
                    <span className="truncate text-[12px] font-medium leading-5">
                      {channel.name}
                    </span>
                    {unreadCount > 0 ? (
                      <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                        {unreadCount}
                      </span>
                    ) : null}
                  </div>
                </button>

                {canManageChannels ? (
                  <button
                    type="button"
                    onClick={() => onDeleteChannel?.(channel)}
                    className={[
                      'rounded-[0.7rem] border border-transparent p-1.5 transition',
                      isActive
                        ? 'text-[var(--orbit-danger-ink)] hover:border-red-400/30 hover:bg-red-500/10'
                        : 'text-[var(--orbit-text-subtle)] opacity-0 group-hover:opacity-100 hover:border-red-400/30 hover:bg-red-500/10 hover:text-[var(--orbit-danger-ink)]',
                    ].join(' ')}
                    title={`Delete #${channel.name}`}
                    aria-label={`Delete ${channel.name}`}
                  >
                    <TrashIcon />
                  </button>
                ) : null}
              </div>
            )
          })
        ) : !isLoading && !error ? (
          <BauhausEmptyState message={server
              ? canManageChannels
                ? 'No extra channels yet. Open the server menu to create one.'
                : 'No channels yet.'
              : 'Pick a server to see its channels.'} className="mx-2 p-4" />
        ) : null}
      </div>
    </aside>
  )
}

export default ChannelList
