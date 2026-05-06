import { Navigate, Outlet, useLocation } from 'react-router-dom'
import useAuthStore from '../store/useAuthStore'

function ProtectedRoute({ isReady = true, fallback = null }) {
  const location = useLocation()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          notice: 'Sign in or create an account to open the workspace.',
          reason: 'workspace-required',
          from: {
            pathname: location.pathname,
            search: location.search,
            hash: location.hash,
          },
        }}
      />
    )
  }

  if (!isReady) {
    return fallback
  }

  return <Outlet />
}

export default ProtectedRoute
