import { useCallback, useEffect, useState } from 'react'
import { createChannel } from '../../api/servers'
import extractApiErrors from '../../utils/extractApiErrors'

const initialFormData = {
  name: '',
  channel_type: 'text',
}

function CreateChannelModal({ isOpen, onClose, onSuccess, server }) {
  const [formData, setFormData] = useState(initialFormData)
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resetState = useCallback(() => {
    setFormData(initialFormData)
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

  const updateField = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({
      ...current,
      [name]: value,
    }))
    setErrors((current) => ({
      ...current,
      [name]: '',
      form: '',
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!server?.id) {
      setErrors({ form: 'Select a server before creating a channel.' })
      return
    }

    if (!formData.name.trim()) {
      setErrors({ name: 'Channel name is required.' })
      return
    }

    setErrors({})
    setIsSubmitting(true)

    try {
      const channel = await createChannel({
        server: server.id,
        name: formData.name.trim(),
        channel_type: formData.channel_type,
      })
      onSuccess?.(channel)
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
            <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">
              Add Channel
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-[var(--orbit-text)]">
              Create a channel in {server?.name ?? 'this server'}
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--orbit-text-muted)]">
              Add a new space for focused discussion without leaving the workspace.
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
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {errors.form}
            </div>
          ) : null}

          <label className="block space-y-2">
            <span className="text-sm font-medium text-[var(--orbit-text)]">Channel name</span>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={updateField}
              className="orbit-input w-full rounded-2xl px-4 py-3 text-sm transition"
              placeholder="announcements"
            />
            {errors.name ? <p className="text-sm text-red-200">{errors.name}</p> : null}
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-[var(--orbit-text)]">Channel type</span>
            <select
              name="channel_type"
              value={formData.channel_type}
              onChange={updateField}
              className="orbit-input w-full rounded-2xl px-4 py-3 text-sm transition"
            >
              <option value="text">Text</option>
              <option value="announcement">Announcement</option>
            </select>
            {errors.channel_type ? (
              <p className="text-sm text-red-200">{errors.channel_type}</p>
            ) : null}
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-cyan-400/90 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'Creating channel...' : 'Create channel'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default CreateChannelModal
