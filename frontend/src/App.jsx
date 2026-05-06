import { useCallback, useEffect, useState } from 'react'
import { Navigate, NavLink, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import { fetchProfile, logoutUser } from './api/auth'
import Login from './pages/Login'
import Register from './pages/Register'
import ChatPage from './pages/ChatPage'
import ServerSettings from './pages/ServerSettings'
import usePresenceSocket from './hooks/usePresenceSocket'
import useChatStore from './store/useChatStore'
import useAuthStore from './store/useAuthStore'
import useThemeStore from './store/useThemeStore'
import ThemeToggle from './components/theme/ThemeToggle'

function Panel({ eyebrow, title, description, checklist, actions }) {
  return (
    <div className="orbit-panel space-y-6 rounded-[2rem] p-6">
      <div className="space-y-3">
        <p className="orbit-accent-label text-xs font-semibold uppercase tracking-[0.35em]">
          {eyebrow}
        </p>
        <h2 className="text-3xl font-semibold tracking-tight text-[var(--orbit-text)]">
          {title}
        </h2>
        <p className="max-w-xl text-sm leading-7 text-[var(--orbit-text-muted)] sm:text-base">
          {description}
        </p>
      </div>

      <ul className="space-y-3">
        {checklist.map((item) => (
          <li
            key={item}
            className="rounded-2xl border border-[color:var(--orbit-border)] bg-[var(--orbit-surface-soft)] px-4 py-3 text-sm text-[var(--orbit-text-muted)]"
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
  const overviewLabels = ['Servers', 'Direct messages', 'People', 'Uploads']

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.16fr)_360px]">
      <div className="orbit-panel rounded-[2rem] p-6 sm:p-8">
        <div className="space-y-4">
          <p className="orbit-accent-label text-xs font-semibold uppercase tracking-[0.35em]">
            Overview
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-[var(--orbit-text)]">
            Everything your team needs, minus the noise.
          </h2>
          <p className="text-sm leading-7 text-[var(--orbit-text-muted)] sm:text-base">
            Orbit keeps rooms, direct messages, and people close, so it is easy to
            jump back in and keep the conversation moving.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-2.5">
          {overviewLabels.map((label) => (
            <span
              key={label}
              className="rounded-full border border-[color:var(--orbit-border)] bg-[var(--orbit-surface-soft)] px-3.5 py-2 text-sm text-[var(--orbit-text)]"
            >
              {label}
            </span>
          ))}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-[1.35rem] border border-[color:var(--orbit-border)] bg-[var(--orbit-surface-soft)] px-4 py-4">
            <p className="orbit-accent-label text-[11px] font-semibold uppercase tracking-[0.18em]">
              Fast to scan
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--orbit-text-muted)]">
              Recent conversations and people stay close without adding clutter.
            </p>
          </div>
          <div className="rounded-[1.35rem] border border-[color:var(--orbit-border)] bg-[var(--orbit-surface-soft)] px-4 py-4">
            <p className="orbit-accent-label text-[11px] font-semibold uppercase tracking-[0.18em]">
              Ready to use
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--orbit-text-muted)]">
              Sign in once and pick up the conversation where you left off.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {isAuthenticated ? (
            <NavLink
              className="rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
              to="/app"
            >
              Open chat
            </NavLink>
          ) : (
            <NavLink
              className="rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
              to="/register"
            >
              Create account
            </NavLink>
          )}

          <NavLink
            className="orbit-pill rounded-full px-5 py-3 text-sm text-[var(--orbit-text-muted)] transition hover:border-[color:var(--orbit-border-strong)] hover:bg-[var(--orbit-surface-hover)] hover:text-[var(--orbit-text)]"
            to={isAuthenticated ? '/' : '/login'}
          >
            {isAuthenticated ? 'Stay on overview' : 'Sign in'}
          </NavLink>
        </div>
      </div>

      <div className="orbit-panel flex h-full flex-col rounded-[2rem] p-6 sm:p-8">
        <div className="space-y-4">
          <p className="orbit-accent-label text-xs font-semibold uppercase tracking-[0.35em]">
            {isAuthenticated ? 'Account' : 'Get Started'}
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-[var(--orbit-text)]">
            {isAuthenticated ? 'You are ready to jump back in.' : 'Ready to join the conversation?'}
          </h2>
          <p className="text-sm leading-7 text-[var(--orbit-text-muted)] sm:text-base">
            {isAuthenticated
              ? `${user?.username ?? 'You'} are signed in and can jump straight back into Orbit.`
              : 'Create an account or sign in to chat with your team in Orbit.'}
          </p>
        </div>

        <div className="mt-6 space-y-3">
          <div className="rounded-[1.25rem] border border-[color:var(--orbit-border)] bg-[var(--orbit-surface-soft)] px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--orbit-text-subtle)]">
              {isAuthenticated ? 'Signed in as' : 'Access'}
            </p>
            <p className="mt-2 text-lg font-semibold text-[var(--orbit-text)]">
              {isAuthenticated ? user?.username ?? 'Current user' : 'Sign in required'}
            </p>
          </div>

          <div className="rounded-[1.25rem] border border-[color:var(--orbit-border)] bg-[var(--orbit-surface-soft)] px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--orbit-text-subtle)]">
              What stays close
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--orbit-text-muted)]">
              Rooms, direct messages, and people remain easy to reach from one place.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function NotFoundRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  return (
    <Panel
      eyebrow="Not Found"
      title="This page drifted out of orbit"
      description="The route you opened is not available. Head back to the overview or jump back into Orbit."
      checklist={[
        'Use the overview for the main Orbit landing page.',
        'Sign in or create an account to access Orbit.',
        'Open chat to continue your conversations.',
      ]}
      actions={
        <>
          <NavLink
            className="rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            to="/"
          >
            Go to overview
          </NavLink>
          {isAuthenticated ? (
            <NavLink
              className="orbit-pill rounded-full px-5 py-3 text-sm text-[var(--orbit-text-muted)] transition hover:border-[color:var(--orbit-border-strong)] hover:bg-[var(--orbit-surface-hover)] hover:text-[var(--orbit-text)]"
              to="/app"
            >
              Open chat
            </NavLink>
          ) : (
            <NavLink
              className="orbit-pill rounded-full px-5 py-3 text-sm text-[var(--orbit-text-muted)] transition hover:border-[color:var(--orbit-border-strong)] hover:bg-[var(--orbit-surface-hover)] hover:text-[var(--orbit-text)]"
              to="/login"
              state={{
                notice: 'Sign in or create an account to join the chat.',
                reason: 'workspace-required',
                from: {
                  pathname: '/app',
                  search: '',
                  hash: '',
                },
              }}
            >
              Sign in to continue
            </NavLink>
          )}
        </>
      }
    />
  )
}

function ShellBackground({ children }) {
  return (
    <div className="min-h-screen min-h-dvh bg-[var(--orbit-bg)] text-[var(--orbit-text)]">
      {children}
    </div>
  )
}

function MarketingLayout({ clearSession, isAuthenticated }) {
  const location = useLocation()
  const isLoginRoute = location.pathname === '/login'
  const isRegisterRoute = location.pathname === '/register'
  const isAuthRoute = isLoginRoute || isRegisterRoute
  const workspacePromptState = {
    notice: 'Sign in or create an account to join the chat.',
    reason: 'workspace-required',
    from: {
      pathname: '/app',
      search: '',
      hash: '',
    },
  }
  const navItems = [
    { to: '/', label: 'Overview' },
    ...(isAuthenticated
      ? [{ to: '/app', label: 'Chat' }]
      : [
          ...(isLoginRoute ? [] : [{ to: '/login', label: 'Login' }]),
          ...(isRegisterRoute ? [] : [{ to: '/register', label: 'Register' }]),
          { to: '/app', label: 'Chat' },
        ]),
  ]

  return (
    <ShellBackground>
      <div className="relative mx-auto flex min-h-screen min-h-dvh max-w-[1540px] flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="orbit-panel flex flex-wrap items-center justify-between gap-3 rounded-[1.35rem] px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] bg-[var(--orbit-accent-soft)] text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--orbit-accent-ink)]">
              O
            </div>
            <div className="min-w-0">
              <p className="orbit-accent-label text-[10px] font-semibold uppercase tracking-[0.4em]">
                Orbit
              </p>
              <p className="truncate text-sm text-[var(--orbit-text-muted)]">
                Stay in orbit with your team.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <ThemeToggle className="h-9 w-9 rounded-full" />
            <nav className="flex flex-wrap gap-2">
              {navItems.map((item) => (
                item.to === '/app' && !isAuthenticated ? (
                  <NavLink
                    key={item.to}
                    to="/login"
                    state={workspacePromptState}
                    className={({ isActive }) =>
                      [
                        'rounded-full border px-3 py-1.5 text-xs font-medium transition sm:text-sm',
                        isActive
                          ? 'orbit-accent-surface'
                          : 'border-[color:var(--orbit-border)] bg-[var(--orbit-surface-soft)] text-[var(--orbit-text-muted)] hover:border-[color:var(--orbit-border-strong)] hover:text-[var(--orbit-text)]',
                      ].join(' ')
                    }
                  >
                    {item.label}
                  </NavLink>
                ) : (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      [
                        'rounded-full border px-3 py-1.5 text-xs font-medium transition sm:text-sm',
                        isActive
                          ? 'orbit-accent-surface'
                          : 'border-[color:var(--orbit-border)] bg-[var(--orbit-surface-soft)] text-[var(--orbit-text-muted)] hover:border-[color:var(--orbit-border-strong)] hover:text-[var(--orbit-text)]',
                      ].join(' ')
                    }
                  >
                    {item.label}
                  </NavLink>
                )
              ))}
            </nav>

            {isAuthenticated ? (
              <button
                type="button"
                className="rounded-full border border-[color:var(--orbit-border)] bg-[var(--orbit-surface-soft)] px-3 py-1.5 text-xs font-medium text-[var(--orbit-text-muted)] transition hover:border-[color:var(--orbit-border-strong)] hover:text-[var(--orbit-text)] sm:text-sm"
                onClick={clearSession}
              >
                Switch user
              </button>
            ) : null}
          </div>
        </header>

        <main className="flex-1 py-5">
          {isAuthRoute ? (
            <div className="flex min-h-[calc(100dvh-8.5rem)] items-center justify-center">
              <div className="w-full max-w-[42rem]">
                <Outlet />
              </div>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </ShellBackground>
  )
}

function WorkspaceLayout({ clearSession, user, accessToken }) {
  usePresenceSocket(accessToken)

  return (
    <ShellBackground>
      <div className="relative flex h-dvh min-h-dvh w-full flex-col overflow-hidden px-1.5 pb-[calc(env(safe-area-inset-bottom)+0.35rem)] pt-[calc(env(safe-area-inset-top)+0.35rem)] sm:px-3 sm:py-3">
        <header className="mb-1.5 flex shrink-0 items-center justify-between gap-2 overflow-hidden rounded-[0.95rem] border border-[color:var(--orbit-border)] bg-[var(--orbit-shell-bg)] px-2 py-1.5 shadow-[0_10px_24px_rgba(0,0,0,0.16)] backdrop-blur sm:px-2.5">
          <div className="flex min-w-0 shrink items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.9rem] bg-[var(--orbit-accent-soft)] text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--orbit-accent-ink)]">
              O
            </div>

            <div className="flex min-w-0 items-center gap-1.5">
              <p className="orbit-accent-label text-[10px] font-semibold uppercase tracking-[0.28em]">
                Orbit
              </p>
              <p className="max-w-[5.75rem] truncate text-[11px] text-[var(--orbit-text-muted)] sm:max-w-none">
                {user?.username ?? 'Signed in'}
              </p>
            </div>
          </div>

          <div className="orbit-scrollbar flex min-w-0 flex-1 items-center justify-end gap-1.5 overflow-x-auto pb-0.5 sm:overflow-visible sm:pb-0">
            <ThemeToggle
              className="h-8 rounded-full px-2 text-[11px] font-medium sm:px-3"
              showLabel
            />

            <NavLink
              to="/"
              className={({ isActive }) =>
                [
                  'whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-medium transition',
                  isActive
                    ? 'orbit-accent-surface'
                    : 'border-[color:var(--orbit-border)] bg-[var(--orbit-surface-soft)] text-[var(--orbit-text-muted)] hover:border-[color:var(--orbit-border-strong)] hover:text-[var(--orbit-text)]',
                ].join(' ')
              }
            >
              Overview
            </NavLink>

            <button
              type="button"
              className="whitespace-nowrap rounded-full border border-[color:var(--orbit-border)] bg-[var(--orbit-surface-soft)] px-2.5 py-1 text-[11px] font-medium text-[var(--orbit-text-muted)] transition hover:border-[color:var(--orbit-border-strong)] hover:text-[var(--orbit-text)]"
              onClick={clearSession}
            >
              Switch
            </button>
          </div>
        </header>

        <main className="flex min-h-0 w-full min-w-0 flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </ShellBackground>
  )
}

function WorkspaceGateFallback({ status, onSwitchUser }) {
  const isFailed = status === 'failed'

  return (
    <ShellBackground>
      <div className="flex min-h-screen min-h-dvh items-center justify-center px-4">
        <div className="orbit-panel w-full max-w-md rounded-[1.5rem] p-6 text-center shadow-2xl shadow-black/20">
          <p className="orbit-accent-label text-xs font-semibold uppercase tracking-[0.28em]">
            Orbit
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-[var(--orbit-text)]">
            {isFailed ? 'Session check failed.' : 'Opening workspace.'}
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--orbit-text-muted)]">
            {isFailed
              ? 'Sign in again so Orbit can reload your chat session cleanly.'
              : 'Checking your session before loading conversations.'}
          </p>
          {isFailed ? (
            <button
              type="button"
              className="mt-5 rounded-full bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
              onClick={onSwitchUser}
            >
              Sign in again
            </button>
          ) : null}
        </div>
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
  const hydrateTheme = useThemeStore((state) => state.hydrateTheme)
  const [failedProfileSessionKey, setFailedProfileSessionKey] = useState(null)
  const profileSessionKey = `${tokens?.access ?? ''}:${tokens?.refresh ?? ''}`
  const didProfileFail =
    Boolean(profileSessionKey) &&
    failedProfileSessionKey === profileSessionKey &&
    isAuthenticated &&
    !user?.id
  const profileStatus = didProfileFail
    ? 'failed'
    : isAuthenticated && !user?.id
      ? 'loading'
      : user?.id
        ? 'ready'
        : 'idle'

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
    hydrateTheme()
  }, [hydrateTheme])

  useEffect(() => {
    if (!isAuthenticated || user?.id || didProfileFail) {
      return undefined
    }

    let ignore = false

    async function loadProfile() {
      try {
        const profile = await fetchProfile()

        if (!ignore) {
          setUser(profile)
        }
      } catch {
        if (!ignore) {
          setFailedProfileSessionKey(profileSessionKey)
        }
      }
    }

    loadProfile()

    return () => {
      ignore = true
    }
  }, [didProfileFail, isAuthenticated, profileSessionKey, setUser, user?.id])

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

      <Route
        path="/app/*"
        element={
          <ProtectedRoute
            isReady={Boolean(user?.id)}
            fallback={
              <WorkspaceGateFallback
                status={profileStatus}
                onSwitchUser={clearSession}
              />
            }
          />
        }
      >
        <Route
          element={
            <WorkspaceLayout
              clearSession={clearSession}
              user={user}
              accessToken={tokens?.access}
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
