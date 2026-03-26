import useAuthStore from '../store/useAuthStore'

function AppHome() {
  const user = useAuthStore((state) => state.user)
  const tokens = useAuthStore((state) => state.tokens)

  return (
    <div className="space-y-6 rounded-3xl border border-gray-700 bg-gray-800 p-6 shadow-2xl shadow-black/25 sm:p-8">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-indigo-300">
          Protected Route
        </p>
        <h2 className="text-3xl font-semibold tracking-tight text-white">
          You reached the protected app shell
        </h2>
        <p className="text-sm leading-7 text-gray-300">
          Day 7 is now enforcing auth at `/app/*`, rehydrating the stored
          session on refresh, and refreshing expired access tokens through the
          JWT refresh endpoint.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-gray-700 bg-gray-900 px-4 py-4">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">User</p>
          <p className="mt-3 text-lg font-medium text-white">
            {user?.username ?? 'Unknown user'}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-700 bg-gray-900 px-4 py-4">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
            Access Token
          </p>
          <p className="mt-3 break-all text-sm text-gray-200">
            {tokens?.access ? `${tokens.access.slice(0, 32)}...` : 'Missing'}
          </p>
        </div>
      </div>
    </div>
  )
}

export default AppHome
