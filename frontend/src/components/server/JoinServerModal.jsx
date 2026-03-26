import { useState } from 'react'
import { joinServer } from '../../api/servers'
import extractApiErrors from '../../utils/extractApiErrors'

function JoinServerModal({ isOpen, onClose, onSuccess }) {
  const [inviteCode, setInviteCode] = useState('')
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) {
    return null
  }

  const resetState = () => {
    setInviteCode('')
    setErrors({})
    setIsSubmitting(false)
  }

  const handleClose = () => {
    if (isSubmitting) {
      return
    }

    resetState()
    onClose?.()
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!inviteCode.trim()) {
      setErrors({ invite_code: 'Invite code is required.' })
      return
    }

    setErrors({})
    setIsSubmitting(true)

    try {
      const server = await joinServer(inviteCode.trim())
      onSuccess?.(server)
      resetState()
      onClose?.()
    } catch (error) {
      setErrors(extractApiErrors(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-slate-900 p-6 shadow-2xl shadow-black/40">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">
              Day 13
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">
              Join with an invite code
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Paste an existing server invite and switch into it as soon as the
              backend accepts the membership.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs uppercase tracking-[0.25em] text-slate-300 transition hover:border-white/20 hover:text-white"
          >
            Close
          </button>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
          {errors.form ? (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {errors.form}
            </div>
          ) : null}

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-100">Invite code</span>
            <input
              type="text"
              value={inviteCode}
              onChange={(event) => {
                setInviteCode(event.target.value)
                setErrors((current) => ({
                  ...current,
                  invite_code: '',
                  form: '',
                }))
              }}
              className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-400/20"
              placeholder="b8f3d95a-2d3f-4e3f-9231-9c8d9b1fd321"
            />
            {errors.invite_code ? (
              <p className="text-sm text-red-200">{errors.invite_code}</p>
            ) : null}
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-cyan-400/90 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'Joining server...' : 'Join server'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default JoinServerModal
