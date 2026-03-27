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
    <div className="w-full rounded-3xl border border-gray-700 bg-gray-800 p-6 shadow-2xl shadow-black/25 sm:p-8">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-indigo-300">
          New Account
        </p>
        <h2 className="text-3xl font-semibold tracking-tight text-white">
          Create your Orbit account
        </h2>
        <p className="text-sm leading-7 text-gray-300">
          Set up your profile so you can join servers and start chatting right away.
        </p>
      </div>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
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
          <span className="text-sm font-medium text-gray-100">Email</span>
          <input
            className="w-full rounded-2xl border border-gray-600 bg-gray-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30"
            name="email"
            type="email"
            value={formData.email}
            onChange={updateField}
            autoComplete="email"
            placeholder="sunil@orbit.dev"
          />
          {errors.email ? (
            <p className="text-sm text-red-300">{errors.email}</p>
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
            autoComplete="new-password"
            placeholder="••••••••"
          />
          {errors.password ? (
            <p className="text-sm text-red-300">{errors.password}</p>
          ) : null}
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-gray-100">Confirm password</span>
          <input
            className="w-full rounded-2xl border border-gray-600 bg-gray-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30"
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

        <button
          className="w-full rounded-2xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:cursor-not-allowed disabled:opacity-70"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-sm text-gray-400">
        Already registered?{' '}
        <Link className="font-medium text-indigo-300 hover:text-indigo-200" to="/login">
          Sign in
        </Link>
      </p>
    </div>
  )
}

export default Register
