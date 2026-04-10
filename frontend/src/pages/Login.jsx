import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { fetchProfile, loginUser } from '../api/auth'
import useAuthStore from '../store/useAuthStore'
import useChatStore from '../store/useChatStore'
import extractApiErrors from '../utils/extractApiErrors'

const initialFormData = {
  username: '',
  password: '',
}

function validateLoginForm(formData) {
  const errors = {}

  if (!formData.username.trim()) {
    errors.username = 'Username is required.'
  }

  if (!formData.password) {
    errors.password = 'Password is required.'
  }

  return errors
}

function Login() {
  const location = useLocation()
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const setAuth = useAuthStore((state) => state.setAuth)
  const resetChatState = useChatStore((state) => state.resetChatState)
  const [formData, setFormData] = useState({
    ...initialFormData,
    username: location.state?.username ?? '',
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isSwitchUserFlow = location.state?.reason === 'switch-user'

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

    const validationErrors = validateLoginForm(formData)

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsSubmitting(true)
    setErrors({})

    try {
      const tokens = await loginUser({
        username: formData.username.trim(),
        password: formData.password,
      })
      const profile = await fetchProfile(tokens.access)

      resetChatState()
      setAuth({
        user: profile,
        tokens,
      })

      navigate(
        !isSwitchUserFlow && location.state?.from
          ? {
              pathname: location.state.from.pathname ?? '/app',
              search: location.state.from.search ?? '',
              hash: location.state.from.hash ?? '',
            }
          : '/app',
        { replace: true },
      )
    } catch (error) {
      setErrors(extractApiErrors(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="orbit-panel w-full overflow-hidden rounded-[2.2rem] shadow-2xl shadow-black/20">
      <div className="grid min-h-full lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="p-6 sm:p-8">
          <div className="space-y-3">
            <p className="orbit-accent-label text-xs font-semibold uppercase tracking-[0.35em]">
              Sign In
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-[var(--orbit-text)]">
              Open your workspace again.
            </h2>
            <p className="max-w-xl text-sm leading-7 text-[var(--orbit-text-muted)]">
              Sign in and continue with the same servers, people, and direct messages.
            </p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
            {location.state?.notice ? (
              <div className="orbit-success-banner rounded-2xl border px-4 py-3 text-sm">
                {location.state.notice}
              </div>
            ) : null}

            {errors.form ? (
              <div className="orbit-danger-banner rounded-2xl border px-4 py-3 text-sm">
                {errors.form}
              </div>
            ) : null}

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
                <p className="orbit-danger-text text-sm">{errors.username}</p>
              ) : null}
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-[var(--orbit-text)]">Password</span>
              <input
                className="orbit-input w-full rounded-2xl px-4 py-3 text-sm transition"
                name="password"
                type="password"
                value={formData.password}
                onChange={updateField}
                autoComplete="current-password"
                placeholder="••••••••"
              />
              {errors.password ? (
                <p className="orbit-danger-text text-sm">{errors.password}</p>
              ) : null}
            </label>

            <button
              className="w-full rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 disabled:cursor-not-allowed disabled:opacity-70"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-sm text-[var(--orbit-text-muted)]">
            New to Orbit?{' '}
            <Link className="orbit-accent-link font-medium" to="/register">
              Create an account
            </Link>
          </p>
        </div>

        <aside className="border-t border-[color:var(--orbit-border)] bg-[var(--orbit-accent-soft)] p-6 lg:border-l lg:border-t-0">
          <div className="space-y-5">
            <div>
              <p className="orbit-accent-label text-[11px] font-semibold uppercase tracking-[0.22em]">
                Back to work
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--orbit-text-muted)]">
                Orbit keeps the structure familiar, so signing in feels like picking up
                a conversation instead of starting over.
              </p>
            </div>

            <div className="grid gap-3">
              {[
                'Reopen recent servers',
                'See direct messages quickly',
                'Continue with the same people',
              ].map((item) => (
                <div
                  key={item}
                  className="orbit-showcase-surface-elevated rounded-[1rem] border px-3 py-3 text-sm text-[var(--orbit-text)]"
                >
                  {item}
                </div>
              ))}
            </div>

            {isSwitchUserFlow ? (
              <div className="orbit-showcase-surface rounded-[1rem] border px-3 py-3 text-sm text-[var(--orbit-text-muted)]">
                Sign in with another account and Orbit will load that workspace instead.
              </div>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  )
}

export default Login
