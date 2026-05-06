import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  deleteServer,
  getServer,
  leaveServer,
  removeServerMember,
  updateServer,
  updateServerMemberRole,
} from '../api/servers'
import extractApiErrors from '../utils/extractApiErrors'
import useAuthStore from '../store/useAuthStore'
import useChatStore from '../store/useChatStore'

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
})
const emptyMembers = []

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

function roleLabel(role) {
  if (role === 'owner') {
    return 'Owner'
  }

  if (role === 'admin') {
    return 'Admin'
  }

  return 'Member'
}

function roleBadgeClass(role) {
  if (role === 'owner') {
    return 'border-amber-300/30 bg-amber-400/10 text-[var(--orbit-warning-ink)]'
  }

  if (role === 'admin') {
    return 'orbit-accent-surface'
  }

  return 'border-[color:var(--orbit-border)] bg-[var(--orbit-surface-soft)] text-[var(--orbit-text-muted)]'
}

function sectionDetails(serverName) {
  return {
    overview: {
      eyebrow: 'Overview',
      title: serverName,
      description: 'Server settings',
    },
    members: {
      eyebrow: 'Members',
      title: 'Members',
      description: 'Manage server members',
    },
    roles: {
      eyebrow: 'Roles',
      title: 'Roles',
      description: 'Review permissions',
    },
    invites: {
      eyebrow: 'Invites',
      title: 'Invites',
      description: 'Share invite access',
    },
    danger: {
      eyebrow: 'Danger Zone',
      title: 'Danger Zone',
      description: 'Leave or delete this server',
    },
  }
}

function Avatar({ image, label, sizeClass = 'h-11 w-11 rounded-2xl' }) {
  if (image) {
    return (
      <img
        src={image}
        alt={label}
        className={`${sizeClass} object-cover`}
      />
    )
  }

  return (
    <div
      className={`flex items-center justify-center bg-[var(--orbit-accent-soft)] text-sm font-semibold text-[var(--orbit-accent-ink)] ${sizeClass}`}
    >
      {getInitials(label)}
    </div>
  )
}

function SettingsCard({ title, description, children, actions = null }) {
  return (
    <article className="min-w-0 max-w-full overflow-hidden rounded-xl border border-[color:var(--orbit-border)] bg-[var(--orbit-surface-soft)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-[var(--orbit-text)]">{title}</h2>
          {description ? (
            <p className="mt-1 max-w-2xl break-words text-[13px] leading-5 text-[var(--orbit-text-muted)]">
              {description}
            </p>
          ) : null}
        </div>

        {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
      </div>

      <div className="mt-4">{children}</div>
    </article>
  )
}

function StatCard({ label, value, tone = 'default' }) {
  const toneClass =
    tone === 'accent'
      ? 'border-[color:var(--orbit-accent-border)] bg-[var(--orbit-accent-soft)]'
      : 'border-[color:var(--orbit-border)] bg-[var(--orbit-shell-bg)]'

  return (
    <div className={`rounded-xl border px-3 py-3 ${toneClass}`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--orbit-text-subtle)]">
        {label}
      </p>
      <p className="mt-2 truncate text-xl font-semibold text-[var(--orbit-text)]">{value}</p>
    </div>
  )
}

function ServerSettings() {
  const navigate = useNavigate()
  const { serverId } = useParams()
  const user = useAuthStore((state) => state.user)
  const servers = useChatStore((state) => state.servers)
  const upsertServer = useChatStore((state) => state.upsertServer)
  const removeServer = useChatStore((state) => state.removeServer)
  const [server, setServer] = useState(null)
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [memberActionKey, setMemberActionKey] = useState('')
  const [activeSection, setActiveSection] = useState('overview')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const cachedServer = useMemo(
    () => servers.find((item) => String(item.id) === String(serverId)) ?? null,
    [servers, serverId],
  )

  const permissions = server?.permissions ?? {}
  const rawMembers = server?.members ?? emptyMembers
  const members = useMemo(
    () =>
      rawMembers.map((member) =>
        Number(member.id) === Number(user?.id)
          ? {
              ...member,
              is_online: true,
            }
          : member,
      ),
    [rawMembers, user?.id],
  )
  const currentUserRole = server?.current_user_role ?? 'member'
  const canManageServer = Boolean(permissions.can_manage_server)
  const canManageMembers = Boolean(permissions.can_manage_members)
  const canManageRoles = Boolean(permissions.can_manage_roles)
  const canInviteMembers = Boolean(permissions.can_invite_members)
  const canDeleteServer = Boolean(permissions.can_delete_server)

  const ownerName = server?.owner?.username ?? 'Unknown owner'
  const adminMembers = useMemo(
    () => members.filter((member) => member.role === 'admin'),
    [members],
  )
  const onlineMembers = useMemo(
    () => members.filter((member) => member.is_online),
    [members],
  )

  const availableSections = useMemo(
    () => [
      { id: 'overview', label: 'Overview' },
      { id: 'members', label: 'Members' },
      { id: 'roles', label: 'Roles' },
      { id: 'invites', label: 'Invites' },
      { id: 'danger', label: 'Danger Zone' },
    ],
    [],
  )

  const sectionMeta = sectionDetails(server?.name ?? 'this server')[activeSection]
  const createdAtLabel = server?.created_at
    ? dateFormatter.format(new Date(server.created_at))
    : 'Unavailable'

  useEffect(() => {
    if (!cachedServer) {
      return
    }

    setServer(cachedServer)
    setName(cachedServer.name)
  }, [cachedServer])

  useEffect(() => {
    if (availableSections.some((section) => section.id === activeSection)) {
      return
    }

    setActiveSection('overview')
  }, [activeSection, availableSections])

  useEffect(() => {
    if (!notice) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      setNotice('')
    }, 3600)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [notice])

  useEffect(() => {
    let ignore = false

    async function loadServer() {
      setIsLoading(true)
      setError('')

      try {
        const nextServer = await getServer(serverId)

        if (ignore) {
          return
        }

        setServer(nextServer)
        setName(nextServer.name)
        upsertServer(nextServer)
      } catch (requestError) {
        if (!ignore) {
          setError(
            extractApiErrors(requestError).form ??
              'Unable to load the selected server.',
          )
        }
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }

    loadServer()

    return () => {
      ignore = true
    }
  }, [serverId, upsertServer])

  useEffect(() => {
    if (!serverId) {
      return undefined
    }

    let ignore = false

    async function refreshPresenceSnapshot() {
      try {
        const nextServer = await getServer(serverId)

        if (!ignore) {
          setServer(nextServer)
        }
      } catch {
        // Keep the current snapshot if a background refresh fails.
      }
    }

    const intervalId = window.setInterval(() => {
      void refreshPresenceSnapshot()
    }, 15000)

    const handleWindowFocus = () => {
      void refreshPresenceSnapshot()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void refreshPresenceSnapshot()
      }
    }

    window.addEventListener('focus', handleWindowFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      ignore = true
      window.clearInterval(intervalId)
      window.removeEventListener('focus', handleWindowFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [serverId])

  const syncServerState = (nextServer) => {
    setServer(nextServer)
    setName(nextServer.name)
    upsertServer(nextServer)
  }

  const canUpdateRole = (member) => canManageRoles && member.role !== 'owner'

  const canRemoveMember = (member) => {
    if (!canManageMembers || member.role === 'owner' || Number(member.id) === Number(user?.id)) {
      return false
    }

    if (currentUserRole !== 'owner' && member.role === 'admin') {
      return false
    }

    return true
  }

  const handleCopyInvite = async () => {
    if (!canInviteMembers || !server?.invite_code || !navigator?.clipboard) {
      return
    }

    try {
      await navigator.clipboard.writeText(server.invite_code)
      setError('')
      setNotice('Invite code copied to the clipboard.')
    } catch {
      setError('Unable to copy the invite code right now.')
    }
  }

  const handleRename = async (event) => {
    event.preventDefault()

    if (!server) {
      return
    }

    if (!name.trim()) {
      setError('Server name is required.')
      return
    }

    setIsSaving(true)
    setError('')
    setNotice('')

    try {
      const updatedServer = await updateServer(server.id, { name: name.trim() })
      syncServerState(updatedServer)
      setNotice('Server name updated.')
    } catch (requestError) {
      setError(
        extractApiErrors(requestError).form ?? 'Unable to update the server.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!server || !window.confirm(`Delete ${server.name}? This cannot be undone.`)) {
      return
    }

    setIsSaving(true)
    setError('')

    try {
      await deleteServer(server.id)
      removeServer(server.id)
      navigate('/app', { replace: true })
    } catch (requestError) {
      setError(
        extractApiErrors(requestError).form ?? 'Unable to delete the server.',
      )
      setIsSaving(false)
    }
  }

  const handleLeave = async () => {
    if (!server || !window.confirm(`Leave ${server.name}?`)) {
      return
    }

    setIsSaving(true)
    setError('')

    try {
      await leaveServer(server.id)
      removeServer(server.id)
      navigate('/app', { replace: true })
    } catch (requestError) {
      setError(
        extractApiErrors(requestError).form ?? 'Unable to leave the server.',
      )
      setIsSaving(false)
    }
  }

  const handleRoleChange = async (member, role) => {
    if (!server) {
      return
    }

    setMemberActionKey(`role-${member.id}`)
    setError('')
    setNotice('')

    try {
      const updatedServer = await updateServerMemberRole(server.id, member.id, role)
      syncServerState(updatedServer)
      setNotice(
        role === 'admin'
          ? `Promoted ${member.username} to admin.`
          : `Changed ${member.username} back to member.`,
      )
    } catch (requestError) {
      setError(
        extractApiErrors(requestError).form ??
          'Unable to update the selected member role.',
      )
    } finally {
      setMemberActionKey('')
    }
  }

  const handleRemoveMember = async (member) => {
    if (!server || !window.confirm(`Remove ${member.username} from ${server.name}?`)) {
      return
    }

    setMemberActionKey(`remove-${member.id}`)
    setError('')
    setNotice('')

    try {
      const updatedServer = await removeServerMember(server.id, member.id)
      syncServerState(updatedServer)
      setNotice(`Removed ${member.username} from the server.`)
    } catch (requestError) {
      setError(
        extractApiErrors(requestError).form ??
          'Unable to remove the selected member.',
      )
    } finally {
      setMemberActionKey('')
    }
  }

  const renderMemberRow = (member) => {
    const isRoleUpdating = memberActionKey === `role-${member.id}`
    const isRemoving = memberActionKey === `remove-${member.id}`

    return (
      <div
        key={member.id}
        className="flex flex-col gap-3 rounded-xl border border-[color:var(--orbit-border)] bg-[var(--orbit-shell-bg)] px-3 py-3 lg:flex-row lg:items-center lg:justify-between"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative shrink-0">
            <Avatar
              image={member.avatar}
              label={member.username}
              sizeClass="h-11 w-11 rounded-2xl"
            />
            <span
              style={{ borderColor: 'var(--orbit-shell-bg)' }}
              className={[
                'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2',
                member.is_online ? 'bg-emerald-400' : 'bg-slate-500',
              ].join(' ')}
            />
          </div>

          <div className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <p className="truncate text-sm font-semibold text-[var(--orbit-text)]">
                {member.username}
              </p>
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] ${roleBadgeClass(member.role)}`}
              >
                {roleLabel(member.role)}
              </span>
              {Number(member.id) === Number(server?.owner?.id) ? (
                <span className="rounded-full border border-amber-300/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--orbit-warning-ink)]">
                  Owner
                </span>
              ) : null}
              {Number(member.id) === Number(user?.id) ? (
                <span className="rounded-full border border-[color:var(--orbit-border)] bg-[var(--orbit-surface-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--orbit-text-subtle)]">
                  You
                </span>
              ) : null}
            </div>

            <p className="mt-1 text-sm text-[var(--orbit-text-muted)]">
              {member.is_online ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          {canUpdateRole(member) ? (
            member.role === 'admin' ? (
              <button
                type="button"
                onClick={() => handleRoleChange(member, 'member')}
                disabled={isRoleUpdating}
                className="rounded-lg border border-[color:var(--orbit-border)] bg-[var(--orbit-surface-soft)] px-3 py-2 text-xs font-semibold text-[var(--orbit-text)] transition hover:border-[color:var(--orbit-border-strong)] hover:bg-[var(--orbit-surface-hover)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isRoleUpdating ? 'Updating...' : 'Remove admin'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleRoleChange(member, 'admin')}
                disabled={isRoleUpdating}
                className="orbit-accent-surface rounded-lg border px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isRoleUpdating ? 'Updating...' : 'Make admin'}
              </button>
            )
          ) : null}

          {canRemoveMember(member) ? (
            <button
              type="button"
              onClick={() => handleRemoveMember(member)}
              disabled={isRemoving}
              className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-[var(--orbit-danger-ink)] transition hover:border-red-500/55 hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isRemoving ? 'Removing...' : 'Remove'}
            </button>
          ) : null}
        </div>
      </div>
    )
  }

  const renderSection = () => {
    if (isLoading) {
      return (
        <div className="grid gap-4 xl:grid-cols-2">
          <div className="h-48 rounded-[1.75rem] border border-[color:var(--orbit-border)] bg-[var(--orbit-surface-soft)]" />
          <div className="h-48 rounded-[1.75rem] border border-[color:var(--orbit-border)] bg-[var(--orbit-surface-soft)]" />
        </div>
      )
    }

    if (!server) {
      return (
        <SettingsCard
          title="Server unavailable"
          description="This server could not be found in your current memberships."
        >
          <Link
            to="/app"
            className="inline-flex rounded-lg border border-[color:var(--orbit-border)] bg-[var(--orbit-shell-bg)] px-4 py-2.5 text-sm font-semibold text-[var(--orbit-text)] transition hover:border-[color:var(--orbit-border-strong)] hover:bg-[var(--orbit-surface-hover)]"
          >
            Back to chat
          </Link>
        </SettingsCard>
      )
    }

    if (activeSection === 'overview') {
      return (
        <div className="space-y-4">
          <SettingsCard title="Server profile">
            <form className="space-y-4" onSubmit={handleRename}>
              <div className="grid gap-4 md:grid-cols-[auto_minmax(0,1fr)] md:items-start">
                <Avatar
                  image={server.icon}
                  label={server.name}
                  sizeClass="h-14 w-14 rounded-xl"
                />

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-[var(--orbit-text)]">
                    Server name
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    disabled={!canManageServer || isSaving}
                    className="w-full rounded-xl border border-[color:var(--orbit-border)] bg-[var(--orbit-shell-bg)] px-3 py-2.5 text-sm text-[var(--orbit-text)] outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-4">
                <StatCard label="Owner" value={ownerName} />
                <StatCard label="Created" value={createdAtLabel} />
                <StatCard label="Members" value={String(members.length)} />
                <StatCard label="Role" value={roleLabel(currentUserRole)} tone="accent" />
              </div>

              {canManageServer ? (
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? 'Saving...' : 'Save changes'}
                </button>
              ) : null}
            </form>
          </SettingsCard>

          <SettingsCard title="Permissions">
            <div className="grid gap-3 md:grid-cols-3">
              <StatCard label="Admins" value={String(adminMembers.length)} />
              <StatCard label="Online" value={String(onlineMembers.length)} />
              <StatCard label="Can invite" value={canInviteMembers ? 'Yes' : 'No'} />
            </div>
          </SettingsCard>
        </div>
      )
    }

    if (activeSection === 'members') {
      return (
        <div className="space-y-4">
          <SettingsCard title="Overview">
            <div className="grid gap-3 sm:grid-cols-3">
              <StatCard label="Total members" value={String(members.length)} tone="accent" />
              <StatCard label="Admins" value={String(adminMembers.length)} />
              <StatCard label="Online" value={String(onlineMembers.length)} />
            </div>
          </SettingsCard>

          <SettingsCard title="Member list">
            <div className="space-y-3">
              {members.length > 0 ? (
                members.map(renderMemberRow)
              ) : (
                <div className="rounded-xl border border-[color:var(--orbit-border)] bg-[var(--orbit-shell-bg)] px-4 py-6 text-sm text-[var(--orbit-text-muted)]">
                  No members.
                </div>
              )}
            </div>
          </SettingsCard>
        </div>
      )
    }

    if (activeSection === 'roles') {
      return (
        <div className="space-y-4">
          <SettingsCard title="Role definitions">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-amber-300/25 bg-amber-400/10 px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--orbit-warning-ink)]">
                  Owner
                </p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--orbit-text-muted)]">
                  <li>Delete the server</li>
                  <li>Promote or demote admins</li>
                  <li>Manage channels and members</li>
                </ul>
              </div>

              <div className="rounded-xl border border-cyan-300/25 bg-cyan-400/10 px-4 py-4">
                <p className="orbit-accent-label text-[11px] font-semibold uppercase tracking-[0.18em]">
                  Admin
                </p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--orbit-text-muted)]">
                  <li>Rename the server</li>
                  <li>Create and delete channels</li>
                  <li>Invite people and remove regular members</li>
                </ul>
              </div>

              <div className="rounded-xl border border-[color:var(--orbit-border)] bg-[var(--orbit-shell-bg)] px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--orbit-text-subtle)]">
                  Member
                </p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--orbit-text-muted)]">
                  <li>Participate in channels</li>
                  <li>View members and settings</li>
                  <li>Leave the server</li>
                </ul>
              </div>
            </div>
          </SettingsCard>

          <SettingsCard
            title="Admin roster"
            description={
              canManageRoles
                ? 'Promote or remove admins.'
                : 'Only the server owner can change admin access.'
            }
          >
            <div className="space-y-3">
              {members.length > 0 ? (
                members.map(renderMemberRow)
              ) : (
                <div className="rounded-xl border border-[color:var(--orbit-border)] bg-[var(--orbit-shell-bg)] px-4 py-6 text-sm text-[var(--orbit-text-muted)]">
                  No members.
                </div>
              )}
            </div>
          </SettingsCard>
        </div>
      )
    }

    if (activeSection === 'invites') {
      return (
        <div className="space-y-4">
          <SettingsCard
            title="Invite code"
            actions={
              canInviteMembers ? (
                <button
                  type="button"
                  onClick={handleCopyInvite}
                  disabled={!server.invite_code}
                  className="orbit-accent-surface rounded-lg border px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Copy code
                </button>
              ) : null
            }
          >
            {canInviteMembers ? (
              <div className="space-y-4">
                <div className="break-all rounded-xl border border-[color:var(--orbit-border)] bg-[var(--orbit-shell-bg)] px-4 py-4 text-sm font-medium text-[var(--orbit-text)]">
                  {server.invite_code ?? 'Unavailable'}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-[color:var(--orbit-border)] bg-[var(--orbit-shell-bg)] px-4 py-6 text-sm text-[var(--orbit-text-muted)]">
                Invite access is limited to admins and the owner.
              </div>
            )}
          </SettingsCard>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        <SettingsCard
          title="Leave server"
          actions={
            !canDeleteServer ? (
              <button
                type="button"
                onClick={handleLeave}
                disabled={isSaving}
                className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm font-semibold text-[var(--orbit-warning-ink)] transition hover:border-amber-500/55 hover:bg-amber-500/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? 'Working...' : 'Leave server'}
              </button>
            ) : null
          }
        >
          <p className="text-sm leading-6 text-[var(--orbit-text-muted)]">
            Leaving removes this workspace from your sidebar and access list, but it does not delete the server for everyone else.
          </p>
        </SettingsCard>

        <SettingsCard
          title="Delete server"
          actions={
            canDeleteServer ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSaving}
                className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-[var(--orbit-danger-ink)] transition hover:border-red-500/55 hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? 'Deleting...' : 'Delete server'}
              </button>
            ) : null
          }
        >
          <p className="text-sm leading-6 text-[var(--orbit-text-muted)]">
            This action cannot be undone.
          </p>
        </SettingsCard>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-1 overflow-hidden rounded-[1rem] border border-[color:var(--orbit-border)] bg-[var(--orbit-shell-bg)] shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
      <div className="grid h-full w-full min-w-0 overflow-hidden grid-rows-[auto_minmax(0,1fr)] lg:grid-cols-[240px_minmax(0,1fr)] lg:grid-rows-1">
        <aside className="flex min-h-0 w-full min-w-0 max-w-full flex-col overflow-hidden border-b border-[color:var(--orbit-border)] bg-[var(--orbit-channel-bg)] lg:border-b-0 lg:border-r">
          <div className="border-b border-[color:var(--orbit-border)] px-3 py-3">
            <Link
              to="/app"
              className="inline-flex rounded-lg border border-[color:var(--orbit-border)] bg-[var(--orbit-surface-soft)] px-3 py-2 text-xs font-semibold text-[var(--orbit-text)] transition hover:border-[color:var(--orbit-border-strong)] hover:bg-[var(--orbit-surface-hover)]"
            >
              Back
            </Link>

            <div className="mt-3 rounded-xl border border-[color:var(--orbit-border)] bg-[var(--orbit-surface-soft)] p-3">
              <div className="flex items-center gap-3">
                <Avatar
                  image={server?.icon}
                  label={server?.name ?? 'Server'}
                  sizeClass="h-10 w-10 rounded-lg"
                />

                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-[var(--orbit-text)]">
                    {server?.name ?? 'Loading server'}
                  </p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-[var(--orbit-text-subtle)]">
                    {roleLabel(currentUserRole)}
                  </p>
                </div>
              </div>

              <div className="mt-3 hidden gap-1.5 text-xs text-[var(--orbit-text-muted)] lg:grid">
                <p>Owner: {ownerName}</p>
                <p>{members.length} members</p>
                <p>{adminMembers.length} admins</p>
              </div>
            </div>
          </div>

          <nav className="orbit-scrollbar flex w-full min-w-0 max-w-full shrink-0 flex-nowrap gap-2 overflow-x-auto px-3 py-2 lg:min-h-0 lg:flex-1 lg:flex-col lg:overflow-x-visible lg:overflow-y-auto lg:py-3">
            {availableSections.map((section) => {
              const isActive = section.id === activeSection

              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  className={[
                    'shrink-0 rounded-lg border px-3 py-2 text-left text-sm font-medium transition lg:w-full',
                    isActive
                      ? 'orbit-accent-surface'
                      : 'border-transparent text-[var(--orbit-text-muted)] hover:border-[color:var(--orbit-border)] hover:bg-[var(--orbit-surface-soft)] hover:text-[var(--orbit-text)]',
                  ].join(' ')}
                >
                  {section.label}
                </button>
              )
            })}
          </nav>
        </aside>

        <section className="flex min-h-0 min-w-0 max-w-full flex-1 flex-col overflow-hidden">
          <header className="shrink-0 border-b border-[color:var(--orbit-border)] px-3 py-3 sm:px-4">
            <p className="orbit-accent-label text-[10px] font-semibold uppercase tracking-[0.24em]">
              {sectionMeta.eyebrow}
            </p>
            <h1 className="mt-1 text-xl font-semibold text-[var(--orbit-text)]">
              {sectionMeta.title}
            </h1>
            <p className="mt-1 max-w-3xl text-[13px] leading-5 text-[var(--orbit-text-muted)]">
              {sectionMeta.description}
            </p>
          </header>

          <div className="orbit-scrollbar min-h-0 min-w-0 flex-1 overflow-y-auto px-3 py-3 sm:px-4">
            <div className="min-w-0 space-y-4">
              {error ? (
                <div className="orbit-danger-banner rounded-[1.5rem] border px-5 py-4 text-sm">
                  {error}
                </div>
              ) : null}

              {notice ? (
                <div className="orbit-success-banner rounded-[1.5rem] border px-5 py-4 text-sm">
                  {notice}
                </div>
              ) : null}

              {renderSection()}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default ServerSettings
