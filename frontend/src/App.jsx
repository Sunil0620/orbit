import { useEffect } from 'react'
import { Navigate, NavLink, Outlet, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import { fetchProfile, logoutUser } from './api/auth'
import Login from './pages/Login'
import Register from './pages/Register'
import ChatPage from './pages/ChatPage'
import ServerSettings from './pages/ServerSettings'
import useChatStore from './store/useChatStore'
import useAuthStore, { readStoredAuth } from './store/useAuthStore'

const navItems = [
  { to: '/', label: 'Overview' },
  { to: '/login', label: 'Login' },
  { to: '/register', label: 'Register' },
  { to: '/app', label: 'Chat Shell' },
]

const summaryCards = [
  { label: 'Shell', value: '3-panel Discord layout' },
  { label: 'Sidebar', value: 'server rail + channels' },
  { label: 'Protected', value: '/app now opens chat' },
]

function Panel({ eyebrow, title, description, checklist, actions }) {
  return (
    <div className="space-y-6 rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-2xl shadow-black/30 backdrop-blur">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300">
          {eyebrow}
        </p>
        <h2 className="text-3xl font-semibold tracking-tight text-white">
          {title}
        </h2>
        <p className="max-w-xl text-sm leading-7 text-gray-300 sm:text-base">
          {description}
        </p>
      </div>

      <ul className="space-y-3">
        {checklist.map((item) => (
          <li
            key={item}
            className="rounded-2xl border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-gray-200"
          >
            {item}
          </li>
        ))}
      </ul>

      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  )
}

function OverviewPanel() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)
  const tokens = useAuthStore((state) => state.tokens)

  return (
    <Panel
      eyebrow="Overview"
      title={
        isAuthenticated
          ? 'The protected shell now opens straight into chat'
          : 'Orbit now has the first real chat workspace shell'
      }
      description={
        isAuthenticated
          ? 'JWT persistence still handles session recovery, and `/app` now resolves to a 3-panel Discord-style layout.'
          : 'Days 8-10 wired the server and channel backend. Day 11 turns the protected route into the first real workspace shell.'
      }
      checklist={[
        'The left rail is reserved for server icons.',
        'The center sidebar is reserved for channel navigation.',
        'The main pane is now a dedicated chat window instead of a placeholder card.',
        'Protected routing still guards `/app/*`.',
        isAuthenticated
          ? `Signed in as ${user?.username ?? 'current user'} and ready for server data wiring.`
          : 'Sign in to see the shell under `/app`.',
        tokens?.access
          ? 'Access token is still present in the client store.'
          : 'Unauthenticated visits to `/app` still redirect to login.',
      ]}
      actions={
        isAuthenticated ? (
          <NavLink
            className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100 transition hover:border-cyan-300/60 hover:bg-cyan-400/15"
            to="/app"
          >
            Open chat shell
          </NavLink>
        ) : (
          <NavLink
            className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100 transition hover:border-cyan-300/60 hover:bg-cyan-400/15"
            to="/login"
          >
            Sign in to continue
          </NavLink>
        )
      }
    />
  )
}

function NotFoundRoute() {
  return (
    <Panel
      eyebrow="Missing Route"
      title="This route is not wired yet"
      description="The router now exposes the overview, auth screens, and the protected chat shell."
      checklist={[
        'Visit /login for the JWT token form.',
        'Visit /register for the account creation form.',
        'Visit /app to inspect the 3-panel shell.',
      ]}
    />
  )
}

function ShellBackground({ children }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-gray-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-8 top-0 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute right-0 top-16 h-80 w-80 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      {children}
    </div>
  )
}

function MarketingLayout({ isAuthenticated, clearSession }) {
  return (
    <ShellBackground>
      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-6 border-b border-white/10 pb-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-cyan-300">
              Orbit
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Day 11 workspace shell
            </h1>
            <p className="text-sm text-gray-400">
              Servers, channels, and messages now have a proper 3-panel home in the client.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <nav className="flex flex-wrap gap-3">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    [
                      'rounded-full border px-4 py-2 text-sm transition',
                      isActive
                        ? 'border-cyan-300/60 bg-cyan-400/10 text-cyan-100'
                        : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/20 hover:text-white',
                    ].join(' ')
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {isAuthenticated ? (
              <NavLink
                to="/login"
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-200 transition hover:border-white/20 hover:text-white"
                onClick={clearSession}
              >
                Switch user
              </NavLink>
            ) : null}
          </div>
        </header>

        <main className="grid flex-1 gap-10 py-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] lg:items-center">
          <section className="space-y-8">
            <div className="space-y-5">
              <span className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-1 text-xs font-medium uppercase tracking-[0.3em] text-cyan-100">
                Servers + Channels + Workspace Shell
              </span>
              <h2 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                `/app` is no longer a placeholder card. It now opens a proper chat layout.
              </h2>
              <p className="max-w-2xl text-base leading-8 text-gray-300 sm:text-lg">
                The backend already knows about servers and channels. Day 11 gives
                that structure a real surface area with a server rail, a channel
                list, and a dedicated message pane ready for the next data pass.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {summaryCards.map((card) => (
                <article
                  key={card.label}
                  className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur"
                >
                  <p className="text-sm uppercase tracking-[0.24em] text-gray-400">
                    {card.label}
                  </p>
                  <p className="mt-3 text-lg font-medium text-white">
                    {card.value}
                  </p>
                </article>
              ))}
            </div>

            <OverviewPanel />
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 shadow-panel backdrop-blur sm:p-8">
            <Outlet />
          </section>
        </main>
      </div>
    </ShellBackground>
  )
}

function WorkspaceLayout({ isAuthenticated, clearSession, user }) {
  return (
    <ShellBackground>
      <div className="relative mx-auto flex min-h-screen w-full max-w-[1600px] flex-col px-6 py-6 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-cyan-300">
              Orbit Workspace
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Realtime chat shell
            </h1>
            <p className="text-sm text-slate-400">
              Signed in as {user?.username ?? 'current user'}. Servers, channels, members,
              and messages live here.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <NavLink
              to="/"
              className={({ isActive }) =>
                [
                  'rounded-full border px-4 py-2 text-sm transition',
                  isActive
                    ? 'border-cyan-300/60 bg-cyan-400/10 text-cyan-100'
                    : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/20 hover:text-white',
                ].join(' ')
              }
            >
              Overview
            </NavLink>

            <NavLink
              to="/app"
              className={({ isActive }) =>
                [
                  'rounded-full border px-4 py-2 text-sm transition',
                  isActive
                    ? 'border-cyan-300/60 bg-cyan-400/10 text-cyan-100'
                    : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/20 hover:text-white',
                ].join(' ')
              }
            >
              Chat
            </NavLink>

            {isAuthenticated ? (
              <NavLink
                to="/login"
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-200 transition hover:border-white/20 hover:text-white"
                onClick={clearSession}
              >
                Switch user
              </NavLink>
            ) : null}
          </div>
        </header>

        <main className="flex-1 py-6">
          <Outlet />
        </main>
      </div>
    </ShellBackground>
  )
}

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)
  const tokens = useAuthStore((state) => state.tokens)
  const logout = useAuthStore((state) => state.logout)
  const hydrateAuth = useAuthStore((state) => state.hydrateAuth)
  const setUser = useAuthStore((state) => state.setUser)
  const resetChatState = useChatStore((state) => state.resetChatState)

  const clearSession = () => {
    void logoutUser({
      accessToken: tokens?.access,
      refreshToken: tokens?.refresh,
    }).catch(() => {
      // Clear local state even if the logout request fails.
    })

    logout()
    resetChatState()
  }

  useEffect(() => {
    const storedAuth = readStoredAuth()

    if (storedAuth) {
      hydrateAuth(storedAuth)
    }
  }, [hydrateAuth])

  useEffect(() => {
    if (!isAuthenticated || user?.id) {
      return
    }

    let ignore = false

    async function loadProfile() {
      try {
        const profile = await fetchProfile()

        if (!ignore) {
          setUser(profile)
        }
      } catch {
        // The auth interceptor handles logout/redirect if the token is invalid.
      }
    }

    loadProfile()

    return () => {
      ignore = true
    }
  }, [isAuthenticated, setUser, user?.id])

  return (
    <Routes>
      <Route
        element={
          <MarketingLayout
            isAuthenticated={isAuthenticated}
            clearSession={clearSession}
          />
        }
      >
        <Route path="/" element={<OverviewPanel />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth/login" element={<Navigate to="/login" replace />} />
        <Route path="/auth/register" element={<Navigate to="/register" replace />} />
        <Route path="*" element={<NotFoundRoute />} />
      </Route>

      <Route path="/app/*" element={<ProtectedRoute />}>
        <Route
          element={
            <WorkspaceLayout
              isAuthenticated={isAuthenticated}
              clearSession={clearSession}
              user={user}
            />
          }
        >
          <Route index element={<ChatPage />} />
          <Route path="servers/:serverId/settings" element={<ServerSettings />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
