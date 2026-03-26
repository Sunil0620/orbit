import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { fetchProfile, loginUser } from '../api/auth'
import useAuthStore from '../store/useAuthStore'
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
  const setAuth = useAuthStore((state) => state.setAuth)
  const redirectPath = location.state?.from?.pathname ?? '/app'
  const [formData, setFormData] = useState({
    ...initialFormData,
    username: location.state?.username ?? '',
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

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

      setAuth({
        user: profile,
        tokens,
      })

      navigate(redirectPath, { replace: true })
    } catch (error) {
      setErrors(extractApiErrors(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full rounded-3xl border border-gray-700 bg-gray-800 p-6 shadow-2xl shadow-black/25 sm:p-8">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-indigo-300">
          Day 6
        </p>
        <h2 className="text-3xl font-semibold tracking-tight text-white">
          Sign in to Orbit
        </h2>
        <p className="text-sm leading-7 text-gray-300">
          Authenticate through the JWT token endpoint and load the token pair
          into the auth store for the next stages of the app.
        </p>
      </div>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
        {location.state?.notice ? (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {location.state.notice}
          </div>
        ) : null}

        {errors.form ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {errors.form}
          </div>
        ) : null}

        <label className="block space-y-2">
          <span className="text-sm font-medium text-gray-100">Username</span>
          <input
            className="w-full rounded-2xl border border-gray-600 bg-gray-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30"
            name="username"
            type="text"
            value={formData.username}
            onChange={updateField}
            autoComplete="username"
            placeholder="sunil"
          />
          {errors.username ? (
            <p className="text-sm text-red-300">{errors.username}</p>
          ) : null}
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-gray-100">Password</span>
          <input
            className="w-full rounded-2xl border border-gray-600 bg-gray-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30"
            name="password"
            type="password"
            value={formData.password}
            onChange={updateField}
            autoComplete="current-password"
            placeholder="••••••••"
          />
          {errors.password ? (
            <p className="text-sm text-red-300">{errors.password}</p>
          ) : null}
        </label>

        <button
          className="w-full rounded-2xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:cursor-not-allowed disabled:opacity-70"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <p className="mt-6 text-sm text-gray-400">
        New to Orbit?{' '}
        <Link
          className="font-medium text-indigo-300 hover:text-indigo-200"
          to="/register"
        >
          Create an account
        </Link>
      </p>
    </div>
  )
}

export default Login
