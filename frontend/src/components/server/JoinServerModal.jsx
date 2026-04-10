import { useCallback, useEffect, useState } from 'react'
import { joinServer } from '../../api/servers'
import extractApiErrors from '../../utils/extractApiErrors'

function JoinServerModal({ isOpen, onClose, onSuccess }) {
  const [inviteCode, setInviteCode] = useState('')
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resetState = useCallback(() => {
    setInviteCode('')
    setErrors({})
    setIsSubmitting(false)
  }, [])

  const handleClose = useCallback(() => {
    if (isSubmitting) {
      return
    }

    resetState()
    onClose?.()
  }, [isSubmitting, onClose, resetState])

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        handleClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleClose, isOpen])

  if (!isOpen) {
    return null
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
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/80 px-4 py-6 backdrop-blur-sm sm:items-center sm:py-8"
      onClick={handleClose}
      role="presentation"
    >
      <div
        className="orbit-modal-surface my-auto w-full max-w-lg max-h-[min(44rem,calc(100dvh-2rem))] overflow-y-auto rounded-[2rem] p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="orbit-accent-label text-xs uppercase tracking-[0.35em]">
              Join Server
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-[var(--orbit-text)]">
              Join with an invite code
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--orbit-text-muted)]">
              Paste an invite to join an existing Orbit server and open its channels instantly.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="orbit-secondary-button rounded-2xl px-3 py-2 text-xs uppercase tracking-[0.25em]"
          >
            Close
          </button>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
          {errors.form ? (
            <div className="orbit-danger-banner rounded-2xl border px-4 py-3 text-sm">
              {errors.form}
            </div>
          ) : null}

          <label className="block space-y-2">
            <span className="text-sm font-medium text-[var(--orbit-text)]">Invite code</span>
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
              className="orbit-input w-full rounded-2xl px-4 py-3 text-sm transition"
              placeholder="b8f3d95a-2d3f-4e3f-9231-9c8d9b1fd321"
            />
            {errors.invite_code ? (
              <p className="orbit-danger-text text-sm">{errors.invite_code}</p>
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
