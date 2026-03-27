import { Navigate, Outlet, useLocation } from 'react-router-dom'
import useAuthStore from '../store/useAuthStore'

function ProtectedRoute() {
  const location = useLocation()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: {
            pathname: location.pathname,
            search: location.search,
            hash: location.hash,
          },
        }}
      />
    )
  }

  return <Outlet />
}

export default ProtectedRoute
