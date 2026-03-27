import { useCallback, useEffect } from 'react'
import { Navigate, NavLink, Outlet, Route, Routes, useNavigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import { fetchProfile, logoutUser } from './api/auth'
import Login from './pages/Login'
import Register from './pages/Register'
import ChatPage from './pages/ChatPage'
import ServerSettings from './pages/ServerSettings'
import useChatStore from './store/useChatStore'
import useAuthStore from './store/useAuthStore'

const navItems = [
  { to: '/', label: 'Overview' },
  { to: '/login', label: 'Login' },
  { to: '/register', label: 'Register' },
  { to: '/app', label: 'Workspace' },
]

const overviewHighlights = [
  {
    label: 'Realtime',
    value: 'Channels stay live with websocket updates and a persistent message history.',
  },
  {
    label: 'Orbit Shell',
    value: 'Servers, channels, chat, and members all live in one connected workspace.',
  },
  {
    label: 'Attachments',
    value: 'Images and files travel through the conversation without leaving the flow.',
  },
]

function Panel({ eyebrow, title, description, checklist, actions }) {
  return (
    <div className="orbit-panel space-y-6 rounded-[2rem] p-6">
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

function OrbitUniversePreview() {
  return (
    <div className="orbit-panel orbit-cosmos orbit-grid relative overflow-hidden rounded-[2rem] p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(92,166,255,0.14),transparent_46%)]" />
      <div className="orbit-ring left-1/2 top-1/2 h-[14rem] w-[14rem] -translate-x-1/2 -translate-y-1/2" />
      <div className="orbit-ring left-1/2 top-1/2 h-[20rem] w-[20rem] -translate-x-1/2 -translate-y-1/2" />
      <div className="orbit-ring left-1/2 top-1/2 h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2" />
      <div className="orbit-dot left-[26%] top-[24%] h-4 w-4" />
      <div className="orbit-dot left-[68%] top-[34%] h-3.5 w-3.5" />
      <div className="orbit-dot left-[56%] top-[70%] h-5 w-5" />

      <div className="relative z-10 flex h-full flex-col justify-between">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">
              Orbit Universe
            </p>
            <h3 className="mt-3 text-3xl font-semibold text-white">
              A calmer system for team conversation
            </h3>
          </div>

          <div className="orbit-pill rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-300">
            Live Signal
          </div>
        </div>

        <div className="mt-12 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <p className="max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
              Orbit brings the structure of Slack and the energy of Discord into
              one workspace: instant messages, channel navigation, presence, and
              a workspace that feels made for long sessions.
            </p>

            <div className="grid gap-3 sm:grid-cols-3">
              {overviewHighlights.map((item) => (
                <article
                  key={item.label}
                  className="orbit-pill orbit-card-hover rounded-2xl px-4 py-4"
                >
                  <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">
                    {item.label}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-200">
                    {item.value}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div className="orbit-pill rounded-[1.5rem] p-4">
            <div className="rounded-[1.3rem] border border-white/10 bg-[#141823]/90 p-4 shadow-2xl shadow-black/20">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-400/10 text-sm font-semibold text-cyan-100">
                  O
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Orbit Control</p>
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
                    Universe map
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
                    Cluster A
                  </p>
                  <p className="mt-2 text-sm text-slate-200">
                    Product orbit, design orbit, and study orbit all stay in one lane.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
                    Signal path
                  </p>
                  <p className="mt-2 text-sm text-slate-200">
                    Messages, typing, files, and members all travel through the same workspace.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function OverviewPanel() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)
  const tokens = useAuthStore((state) => state.tokens)

  return (
    <div className="orbit-panel orbit-cosmos rounded-[2rem] p-6">
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300">
          {isAuthenticated ? 'Ready To Launch' : 'Overview'}
        </p>
        <h2 className="text-3xl font-semibold tracking-tight text-white">
          {isAuthenticated ? 'Your orbit is online' : 'Build a better rhythm for team chat'}
        </h2>
        <p className="max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
          {isAuthenticated
            ? `${user?.username ?? 'You'} can jump straight into the workspace, check live channels, and pick up the conversation without losing context.`
            : 'Orbit is shaped around the workflows people actually use every day: a server rail, channel hierarchy, full-height conversation flow, and member presence all in one smooth workspace.'}
        </p>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <article className="orbit-pill rounded-2xl px-4 py-4">
          <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
            Workspace Flow
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-200">
            Move from servers to channels to messages without the UI breaking the rhythm.
          </p>
        </article>
        <article className="orbit-pill rounded-2xl px-4 py-4">
          <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
            Session State
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-200">
            {tokens?.access
              ? 'Your current session is active, so the workspace can open immediately.'
              : 'Sign in to unlock the live workspace.'}
          </p>
        </article>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {isAuthenticated ? (
          <NavLink
            className="rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            to="/app"
          >
            Enter workspace
          </NavLink>
        ) : (
          <NavLink
            className="rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            to="/login"
          >
            Sign in to continue
          </NavLink>
        )}

        <NavLink
          className="orbit-pill rounded-full px-5 py-3 text-sm text-slate-200 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
          to="/register"
        >
          Create an orbit account
        </NavLink>
      </div>
    </div>
  )
}

function NotFoundRoute() {
  return (
    <Panel
      eyebrow="Not Found"
      title="This page drifted out of orbit"
      description="The route you opened is not available. Head back to the overview or jump into your workspace."
      checklist={[
        'Use the overview for the main Orbit landing page.',
        'Sign in or create an account to access your workspace.',
        'Open the workspace to continue your conversations.',
      ]}
      actions={
        <>
          <NavLink
            className="rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            to="/"
          >
            Go to overview
          </NavLink>
          <NavLink
            className="orbit-pill rounded-full px-5 py-3 text-sm text-slate-200 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
            to="/app"
          >
            Open workspace
          </NavLink>
        </>
      }
    />
  )
}

function ShellBackground({ children }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-gray-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 orbit-grid opacity-20" />
        <div className="absolute -left-8 top-0 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute right-0 top-16 h-80 w-80 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      {children}
    </div>
  )
}

function MarketingLayout({ clearSession, isAuthenticated }) {
  return (
    <ShellBackground>
      <div className="relative mx-auto flex min-h-screen max-w-[1540px] flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="orbit-panel flex flex-col gap-4 rounded-[1.75rem] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-cyan-300">
              Orbit
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Team chat with gravity
            </h1>
            <p className="text-sm text-gray-400">
              Inspired by Discord and Slack, built as a connected universe for realtime conversation.
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
              <button
                type="button"
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-200 transition hover:border-white/20 hover:text-white"
                onClick={clearSession}
              >
                Switch user
              </button>
            ) : null}
          </div>
        </header>

        <main className="grid flex-1 gap-6 py-6 lg:grid-cols-[minmax(0,1.18fr)_minmax(360px,0.82fr)]">
          <section className="space-y-8">
            <OrbitUniversePreview />
          </section>

          <section className="orbit-panel rounded-[2rem] p-6 sm:p-8">
            <Outlet />
          </section>
        </main>
      </div>
    </ShellBackground>
  )
}

function WorkspaceLayout({ clearSession, user }) {
  return (
    <ShellBackground>
      <div className="relative flex min-h-screen w-full flex-col px-2 py-2 sm:px-3 sm:py-3">
        <header className="mb-2 flex items-center justify-between gap-3 rounded-[1rem] border border-white/10 bg-[#10131b]/95 px-3 py-2 shadow-[0_12px_30px_rgba(0,0,0,0.18)] backdrop-blur">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-cyan-400/10 text-sm font-semibold uppercase tracking-[0.32em] text-cyan-100">
              O
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-cyan-300">
                Orbit
              </p>
              <p className="truncate text-xs text-slate-400">
                {user?.username ?? 'Signed in'}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <NavLink
              to="/"
              className={({ isActive }) =>
                [
                  'rounded-full border px-3 py-1.5 text-xs font-medium transition',
                  isActive
                    ? 'border-cyan-300/60 bg-cyan-400/10 text-cyan-100'
                    : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/20 hover:text-white',
                ].join(' ')
              }
            >
              Overview
            </NavLink>

            <button
              type="button"
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-gray-200 transition hover:border-white/20 hover:text-white"
              onClick={clearSession}
            >
              Switch
            </button>
          </div>
        </header>

        <main className="flex min-h-0 flex-1">
          <Outlet />
        </main>
      </div>
    </ShellBackground>
  )
}

function App() {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)
  const tokens = useAuthStore((state) => state.tokens)
  const logout = useAuthStore((state) => state.logout)
  const setUser = useAuthStore((state) => state.setUser)
  const resetChatState = useChatStore((state) => state.resetChatState)

  const clearSession = useCallback(() => {
    const accessToken = tokens?.access
    const refreshToken = tokens?.refresh

    logout()
    resetChatState()
    navigate('/login', {
      replace: true,
      state: {
        reason: 'switch-user',
        notice: 'Signed out. Sign in with another account to continue.',
      },
    })

    if (!refreshToken) {
      return
    }

    void logoutUser({
      accessToken,
      refreshToken,
    }).catch(() => {
      // Clear local state even if the logout request fails.
    })
  }, [logout, navigate, resetChatState, tokens?.access, tokens?.refresh])

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
