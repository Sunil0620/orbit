import { useCallback, useEffect, useState } from 'react'
import { createServer } from '../../api/servers'
import extractApiErrors from '../../utils/extractApiErrors'

const initialFormData = {
  name: '',
  icon: null,
}

function CreateServerModal({ isOpen, onClose, onSuccess }) {
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

  const updateName = (event) => {
    const { value } = event.target

    setFormData((current) => ({
      ...current,
      name: value,
    }))
    setErrors((current) => ({
      ...current,
      name: '',
      form: '',
    }))
  }

  const updateIcon = (event) => {
    const file = event.target.files?.[0] ?? null

    setFormData((current) => ({
      ...current,
      icon: file,
    }))
    setErrors((current) => ({
      ...current,
      icon: '',
      form: '',
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!formData.name.trim()) {
      setErrors({ name: 'Server name is required.' })
      return
    }

    setErrors({})
    setIsSubmitting(true)

    try {
      const payload = new FormData()
      payload.append('name', formData.name.trim())

      if (formData.icon) {
        payload.append('icon', formData.icon)
      }

      const server = await createServer(payload)
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-8 backdrop-blur-sm"
      onClick={handleClose}
      role="presentation"
    >
      <div
        className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-slate-900 p-6 shadow-2xl shadow-black/40"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">
              Create Server
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">
              Create a new server
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Start a space for your crew, class, or project and jump into it right away.
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
            <span className="text-sm font-medium text-slate-100">Server name</span>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={updateName}
              className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-400/20"
              placeholder="Orbit crew"
            />
            {errors.name ? <p className="text-sm text-red-200">{errors.name}</p> : null}
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-100">
              Optional icon upload
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={updateIcon}
              className="block w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-300 file:mr-4 file:rounded-xl file:border-0 file:bg-cyan-400/10 file:px-3 file:py-2 file:text-sm file:font-medium file:text-cyan-100"
            />
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
              {formData.icon ? formData.icon.name : 'No file selected'}
            </p>
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-cyan-400/90 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'Creating server...' : 'Create server'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default CreateServerModal
