import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { registerUser } from '../api/auth'
import useAuthStore from '../store/useAuthStore'
import extractApiErrors from '../utils/extractApiErrors'

const initialFormData = {
  username: '',
  email: '',
  password: '',
  password2: '',
}

function validateRegisterForm(formData) {
  const errors = {}

  if (!formData.username.trim()) {
    errors.username = 'Username is required.'
  }

  if (!formData.email.trim()) {
    errors.email = 'Email is required.'
  }

  if (!formData.password) {
    errors.password = 'Password is required.'
  }

  if (!formData.password2) {
    errors.password2 = 'Please confirm your password.'
  }

  if (formData.password && formData.password2 && formData.password !== formData.password2) {
    errors.password2 = 'Passwords do not match.'
  }

  return errors
}

function Register() {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const [formData, setFormData] = useState(initialFormData)
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (isAuthenticated) {
    return <Navigate to="/app" replace />
  }

  const updateField = (event) => {
    const { name, value } = event.target

    setFormData((current) => ({
      ...current,
      [name]: value,
    }))

    setErrors((current) => {
      if (!current[name] && !current.form) {
        return current
      }

      return {
        ...current,
        [name]: '',
        form: '',
      }
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const validationErrors = validateRegisterForm(formData)

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsSubmitting(true)
    setErrors({})

    try {
      await registerUser({
        ...formData,
        username: formData.username.trim(),
        email: formData.email.trim(),
      })

      navigate('/login', {
        replace: true,
        state: {
          notice: 'Account created. Sign in to open your workspace.',
          username: formData.username.trim(),
        },
      })
    } catch (error) {
      setErrors(extractApiErrors(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="orbit-panel w-full overflow-hidden rounded-[2.35rem] shadow-2xl shadow-black/20">
      <div className="grid min-h-full xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="p-6 sm:p-8">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300">
              Create Account
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-[var(--orbit-text)]">
              Set up Orbit.
            </h2>
            <p className="max-w-xl text-sm leading-7 text-[var(--orbit-text-muted)]">
              Create your account and step into a workspace that keeps chat, people, and
              shared spaces organized from the start.
            </p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
            {errors.form ? (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {errors.form}
              </div>
            ) : null}

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-[var(--orbit-text)]">Username</span>
                <input
                  className="orbit-input w-full rounded-2xl px-4 py-3 text-sm transition"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={updateField}
                  autoComplete="username"
                  placeholder="username"
                />
                {errors.username ? (
                  <p className="text-sm text-red-300">{errors.username}</p>
                ) : null}
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-[var(--orbit-text)]">Email</span>
                <input
                  className="orbit-input w-full rounded-2xl px-4 py-3 text-sm transition"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={updateField}
                  autoComplete="email"
                  placeholder="xyz@orbit.dev"
                />
                {errors.email ? (
                  <p className="text-sm text-red-300">{errors.email}</p>
                ) : null}
              </label>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-[var(--orbit-text)]">Password</span>
                <input
                  className="orbit-input w-full rounded-2xl px-4 py-3 text-sm transition"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={updateField}
                  autoComplete="new-password"
                  placeholder="••••••••"
                />
                {errors.password ? (
                  <p className="text-sm text-red-300">{errors.password}</p>
                ) : null}
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-[var(--orbit-text)]">Confirm password</span>
                <input
                  className="orbit-input w-full rounded-2xl px-4 py-3 text-sm transition"
                  name="password2"
                  type="password"
                  value={formData.password2}
                  onChange={updateField}
                  autoComplete="new-password"
                  placeholder="••••••••"
                />
                {errors.password2 ? (
                  <p className="text-sm text-red-300">{errors.password2}</p>
                ) : null}
              </label>
            </div>

            <button
              className="w-full rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 disabled:cursor-not-allowed disabled:opacity-70"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-sm text-[var(--orbit-text-muted)]">
            Already registered?{' '}
            <Link className="font-medium text-cyan-300 hover:text-cyan-200" to="/login">
              Sign in
            </Link>
          </p>
        </div>

        <aside className="border-t border-[color:var(--orbit-border)] bg-[linear-gradient(180deg,rgba(67,209,141,0.08),rgba(255,255,255,0.02))] p-6 xl:border-l xl:border-t-0">
          <div className="space-y-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-200">
                Start here
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--orbit-text-muted)]">
                A clean setup first makes the rest of the workspace feel simple.
              </p>
            </div>

            <div className="grid gap-3">
              {[
                ['01', 'Create your account'],
                ['02', 'Sign in'],
                ['03', 'Open your workspace'],
              ].map(([step, label]) => (
                <div
                  key={step}
                  className="flex items-center gap-3 rounded-[1rem] border border-[color:var(--orbit-border)] bg-black/10 px-3 py-3"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-400/12 text-xs font-semibold text-emerald-200">
                    {step}
                  </span>
                  <p className="text-sm text-[var(--orbit-text)]">{label}</p>
                </div>
              ))}
            </div>

            <div className="rounded-[1rem] border border-[color:var(--orbit-border)] bg-white/[0.04] px-3 py-3 text-sm text-[var(--orbit-text-muted)]">
              Keep the details simple now and Orbit handles the structure after sign in.
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default Register
