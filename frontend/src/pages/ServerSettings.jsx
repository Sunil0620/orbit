import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  deleteServer,
  getServer,
  leaveServer,
  updateServer,
} from '../api/servers'
import extractApiErrors from '../utils/extractApiErrors'
import useAuthStore from '../store/useAuthStore'
import useChatStore from '../store/useChatStore'

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
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const cachedServer = useMemo(
    () => servers.find((item) => String(item.id) === String(serverId)) ?? null,
    [servers, serverId],
  )
  const isOwner = server?.owner?.id === user?.id

  useEffect(() => {
    if (!cachedServer) {
      return
    }

    setServer(cachedServer)
    setName(cachedServer.name)
  }, [cachedServer])

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

  const handleCopyInvite = async () => {
    if (!server?.invite_code || !navigator?.clipboard) {
      return
    }

    await navigator.clipboard.writeText(server.invite_code)
    setNotice('Invite code copied to the clipboard.')
  }

  const handleRename = async (event) => {
    event.preventDefault()

    if (!name.trim()) {
      setError('Server name is required.')
      return
    }

    setIsSaving(true)
    setError('')
    setNotice('')

    try {
      const updatedServer = await updateServer(server.id, { name: name.trim() })
      setServer(updatedServer)
      setName(updatedServer.name)
      upsertServer(updatedServer)
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

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 rounded-[2rem] border border-white/10 bg-slate-900/80 px-5 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">
            Day 14
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-white">
            Server settings
          </h1>
        </div>

        <Link
          to="/app"
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs uppercase tracking-[0.28em] text-slate-300 transition hover:border-white/20 hover:text-white"
        >
          Back to chat
        </Link>
      </div>

      {error ? (
        <div className="rounded-[2rem] border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      {notice ? (
        <div className="rounded-[2rem] border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-100">
          {notice}
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <article className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6">
          {isLoading ? (
            <p className="text-sm text-slate-300">Loading server settings...</p>
          ) : server ? (
            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400">
                  Workspace
                </p>
                <h2 className="text-3xl font-semibold text-white">{server.name}</h2>
                <p className="text-sm leading-7 text-slate-300">
                  Rename the server if you own it, or leave it if you are a
                  member. The invite code is exposed here for sharing.
                </p>
              </div>

              <form className="space-y-4" onSubmit={handleRename}>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-100">
                    Server name
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    disabled={!isOwner || isSaving}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </label>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={!isOwner || isSaving}
                    className="rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSaving ? 'Saving...' : 'Save name'}
                  </button>

                  {isOwner ? (
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={isSaving}
                      className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-100 transition hover:border-red-500/50 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Delete server
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleLeave}
                      disabled={isSaving}
                      className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-100 transition hover:border-amber-500/50 hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Leave server
                    </button>
                  )}
                </div>
              </form>
            </div>
          ) : (
            <p className="text-sm text-slate-300">
              This server could not be found in your current memberships.
            </p>
          )}
        </article>

        <aside className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">
            Invite code
          </p>
          <p className="mt-4 break-all rounded-2xl border border-white/10 bg-slate-950 px-4 py-4 text-sm text-slate-100">
            {server?.invite_code ?? 'Unavailable'}
          </p>
          <button
            type="button"
            onClick={handleCopyInvite}
            disabled={!server?.invite_code}
            className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            Copy invite code
          </button>
        </aside>
      </section>
    </div>
  )
}

export default ServerSettings
