import { useCallback, useEffect } from 'react'
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

const navItems = [
  { to: '/', label: 'Overview' },
  { to: '/login', label: 'Login' },
  { to: '/register', label: 'Register' },
  { to: '/app', label: 'Workspace' },
]

const overviewPreviewPoints = [
  {
    label: 'Servers',
    value: 'Keep team rooms, launches, and working groups in a stable left rail.',
  },
  {
    label: 'Direct messages',
    value: 'Recent chats stay close without taking over the rest of the workspace.',
  },
  {
    label: 'People',
    value: 'Profiles stay visible when you need to find someone quickly.',
  },
  {
    label: 'Message flow',
    value: 'Reactions, replies, and uploads add context without making chat noisy.',
  },
]

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

function OrbitUniversePreview() {
  return (
    <div className="orbit-panel orbit-cosmos relative h-full overflow-hidden rounded-[2.6rem] p-6 sm:p-8 lg:p-10">
      <div className="absolute inset-0 bg-[var(--orbit-showcase-backdrop)]" />
      <div className="absolute inset-0 orbit-grid opacity-[0.07]" />
      <div className="orbit-ring left-[-10%] top-[8%] h-[24rem] w-[24rem]" />
      <div className="orbit-ring right-[6%] top-[12%] h-[14rem] w-[14rem]" />
      <div className="orbit-dot left-[18%] top-[18%] h-3.5 w-3.5" />
      <div className="orbit-dot bottom-[18%] right-[20%] h-3 w-3" />
      <div className="absolute inset-x-0 top-0 h-48 bg-[var(--orbit-showcase-top-glow)]" />

      <div className="relative z-10 grid gap-8 xl:grid-cols-[minmax(340px,0.78fr)_minmax(0,1.22fr)] xl:items-center">
        <div className="space-y-7">
          <div className="space-y-5">
            <div className="orbit-accent-surface inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold tracking-[0.18em]">
              <span>🪐</span>
              <span>Meet Orbit</span>
            </div>
            <div className="space-y-4">
              <h2 className="max-w-lg text-4xl font-semibold leading-[1.02] text-[var(--orbit-text)] sm:text-[3.45rem]">
                Stay in orbit with your team.
              </h2>
              <p className="orbit-showcase-copy-muted max-w-lg text-[15px] leading-7 sm:text-base">
                Organize servers, reopen direct messages, and keep the conversation easy
                to follow without crowding the screen.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {overviewPreviewPoints.map((item) => (
              <div
                key={item.label}
                className="orbit-showcase-surface rounded-[1.2rem] border px-4 py-4"
              >
                <p className="orbit-accent-label text-[11px] font-semibold uppercase tracking-[0.22em]">
                  {item.label}
                </p>
                <p className="orbit-showcase-copy-muted mt-2 text-sm leading-6">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="orbit-showcase-frame relative overflow-hidden rounded-[2.15rem] border p-4">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(104,217,255,0.08),transparent_28%),radial-gradient(circle_at_18%_88%,rgba(67,209,141,0.08),transparent_24%)]" />

          <div className="orbit-showcase-surface-strong relative z-10 rounded-[1.65rem] border p-4">
            <div className="orbit-showcase-divider flex items-center gap-2 border-b pb-3">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-300/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-300/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-300/70" />
              <div className="orbit-showcase-surface-elevated ml-2 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--orbit-text-subtle)]">
                Orbit workspace
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[56px_210px_minmax(0,1fr)]">
              <div className="orbit-showcase-surface flex flex-col items-center gap-3 rounded-[1.25rem] border px-2 py-3">
                <div className="orbit-accent-surface flex h-10 w-10 items-center justify-center rounded-2xl border text-[11px] font-semibold">
                  O
                </div>
                <div className="orbit-showcase-surface-elevated h-10 w-10 rounded-2xl border" />
                <div className="orbit-showcase-surface-elevated h-10 w-10 rounded-2xl border" />
                <div className="orbit-showcase-surface-elevated h-10 w-10 rounded-2xl border" />
              </div>

              <div className="orbit-showcase-surface rounded-[1.25rem] border px-3 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--orbit-text-subtle)]">
                  Channels
                </p>
                <div className="mt-3 space-y-2">
                  <div className="orbit-showcase-surface-elevated rounded-xl border px-3 py-2.5">
                    <p className="orbit-accent-label text-[10px] font-semibold uppercase tracking-[0.18em]">
                      # product
                    </p>
                    <p className="mt-1 text-sm font-medium text-[var(--orbit-text)]">
                      Design review
                    </p>
                  </div>
                  <div className="rounded-xl px-3 py-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--orbit-text-subtle)]">
                      Direct messages
                    </p>
                    <p className="mt-1 text-sm font-medium text-[var(--orbit-text)]">Maya</p>
                  </div>
                  <div className="rounded-xl px-3 py-2.5">
                    <p className="text-sm font-medium text-[var(--orbit-text)]">Jules</p>
                  </div>
                  <div className="rounded-xl px-3 py-2.5">
                    <p className="text-sm font-medium text-[var(--orbit-text)]">Ops</p>
                  </div>
                </div>
              </div>

              <div className="orbit-showcase-surface space-y-4 rounded-[1.25rem] border px-3 py-3">
                <div className="orbit-showcase-divider flex items-start justify-between gap-3 border-b pb-3">
                  <div>
                    <p className="orbit-accent-label text-[10px] font-semibold uppercase tracking-[0.22em]">
                      # Product
                    </p>
                    <p className="mt-1 text-[11px] text-[var(--orbit-text-muted)]">
                      Clear layout, quicker replies
                    </p>
                  </div>
                  <span className="orbit-showcase-surface-elevated rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-[var(--orbit-text-subtle)]">
                    Open
                  </span>
                </div>

                <div className="orbit-showcase-surface-elevated rounded-[1.15rem] border px-3 py-3">
                  <div className="flex gap-3">
                    <div className="orbit-accent-surface mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border text-[12px] font-semibold">
                      A
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--orbit-text)]">Asha</p>
                      <p className="mt-1 text-[12px] leading-5 text-[var(--orbit-text-muted)]">
                        Notes are updated. Reactions and uploads are ready for review.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="orbit-showcase-surface-elevated rounded-[1rem] border px-3 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--orbit-text-subtle)]">
                      People
                    </p>
                    <p className="mt-2 text-sm text-[var(--orbit-text)]">See teammates without leaving the flow.</p>
                  </div>
                  <div className="orbit-showcase-surface-elevated rounded-[1rem] border px-3 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--orbit-text-subtle)]">
                      Replies
                    </p>
                    <p className="mt-2 text-sm text-[var(--orbit-text)]">Keep context light and easy to scan.</p>
                  </div>
                </div>

                <div className="orbit-showcase-surface-elevated flex items-center justify-between gap-3 rounded-[1rem] border px-3 py-2.5 text-[12px] text-[var(--orbit-text-muted)]">
                  <span>Message input</span>
                  <span className="orbit-showcase-surface rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-[var(--orbit-text-subtle)]">
                    +
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function AuthRoutePreview({ mode = 'login' }) {
  const isLogin = mode === 'login'
  const eyebrow = isLogin ? 'Return To Orbit' : 'New To Orbit'
  const title = isLogin ? 'Sign back in and keep moving.' : 'Start clean and set up your account.'
  const description = isLogin
    ? 'Orbit should feel familiar the second you return, with recent spaces easy to reopen.'
    : 'Create your account, open your workspace, and start from a layout that stays readable.'
  const rows = isLogin
    ? [
        {
          title: 'Recent spaces',
          detail: 'Jump back into servers and direct messages without hunting for them.',
        },
        {
          title: 'Clean structure',
          detail: 'The same sidebar, people list, and chat flow are ready when you return.',
        },
      ]
    : [
        {
          title: 'Simple setup',
          detail: 'Choose a username, add your email, and confirm your password once.',
        },
        {
          title: 'Ready after sign in',
          detail: 'Your first server, people directory, and direct messages stay close by design.',
        },
      ]
  const footerRows = isLogin
    ? ['Open the same workspace', 'See recent people quickly', 'Continue without extra setup']
    : ['Create your account', 'Sign in once', 'Open a clear workspace']

  return (
    <div className="orbit-panel relative h-full overflow-hidden rounded-[2.2rem] p-6 sm:p-8">
      <div
        className={[
          'absolute inset-0',
          isLogin
            ? 'bg-[var(--orbit-auth-preview-backdrop-login)]'
            : 'bg-[var(--orbit-auth-preview-backdrop-register)]',
        ].join(' ')}
      />
      <div
        className={[
          'absolute inset-0 opacity-90',
          isLogin
            ? 'bg-[var(--orbit-auth-preview-glow-login)]'
            : 'bg-[var(--orbit-auth-preview-glow-register)]',
        ].join(' ')}
      />

      <div className="relative z-10 flex h-full flex-col justify-between gap-8">
        <div className="space-y-6">
          <div className="orbit-showcase-surface orbit-accent-label inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]">
            {eyebrow}
          </div>

          <div className="space-y-4">
            <h2 className="max-w-xl text-[2.2rem] font-semibold leading-[1.05] text-[var(--orbit-text)] sm:text-[2.6rem]">
              {title}
            </h2>
            <p className="orbit-showcase-copy-muted max-w-xl text-[15px] leading-7">
              {description}
            </p>
          </div>

          <div className="grid gap-3">
            {rows.map((row) => (
              <div
                key={row.title}
                className="orbit-showcase-surface rounded-[1.15rem] border px-4 py-4"
              >
                <p className="orbit-accent-label text-[11px] font-semibold uppercase tracking-[0.18em]">
                  {row.title}
                </p>
                <p className="orbit-showcase-copy-muted mt-2 text-sm leading-6">{row.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="orbit-showcase-surface rounded-[1.4rem] border p-4">
          <p className="orbit-accent-label text-[11px] font-semibold uppercase tracking-[0.18em]">
            {isLogin ? 'Ready when you are' : 'What happens next'}
          </p>
          <div className="mt-4 grid gap-2.5">
            {footerRows.map((row) => (
              <div
                key={row}
                className="orbit-showcase-surface-elevated flex items-center gap-3 rounded-[1rem] border px-3 py-2.5"
              >
                <span className="h-2 w-2 rounded-full bg-cyan-300" />
                <p className="text-sm text-[var(--orbit-text)]">{row}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function OverviewPanel() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)
  const overviewLabels = ['Servers', 'Channels', 'Direct messages', 'People', 'Reactions', 'Uploads']

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
      <div className="orbit-panel rounded-[2rem] p-6 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.94fr)_minmax(240px,0.66fr)]">
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="orbit-accent-label text-xs font-semibold uppercase tracking-[0.35em]">
                Overview
              </p>
              <h2 className="text-3xl font-semibold tracking-tight text-[var(--orbit-text)] sm:text-[2.45rem]">
                🪐 Meet Orbit — Stay in orbit with your team.
              </h2>
              <p className="max-w-2xl text-sm leading-7 text-[var(--orbit-text-muted)] sm:text-base">
                Orbit keeps the interface calm enough to scan quickly and structured
                enough to trust when work gets busy.
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {overviewLabels.map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-[color:var(--orbit-border)] bg-[var(--orbit-surface-soft)] px-3.5 py-2 text-sm text-[var(--orbit-text)]"
                >
                  {label}
                </span>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.35rem] border border-[color:var(--orbit-border)] bg-[var(--orbit-surface-soft)] px-4 py-4">
              <p className="orbit-accent-label text-[11px] font-semibold uppercase tracking-[0.18em]">
                Clean layout
              </p>
                <p className="mt-2 text-sm leading-6 text-[var(--orbit-text-muted)]">
                  One steady structure for team rooms, chat, and people.
                </p>
              </div>
              <div className="rounded-[1.35rem] border border-[color:var(--orbit-border)] bg-[var(--orbit-surface-soft)] px-4 py-4">
              <p className="orbit-accent-label text-[11px] font-semibold uppercase tracking-[0.18em]">
                Easy to reopen
              </p>
                <p className="mt-2 text-sm leading-6 text-[var(--orbit-text-muted)]">
                  Recent work stays close when you come back.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[1.5rem] border border-[color:var(--orbit-border)] bg-[var(--orbit-surface-soft)] px-5 py-5">
              <p className="orbit-accent-label text-[11px] font-semibold uppercase tracking-[0.18em]">
                Orbit
              </p>
              <p className="mt-3 text-lg font-semibold text-[var(--orbit-text)]">
                Made for everyday chat.
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--orbit-text-muted)]">
                Familiar structure, fast navigation, and calmer message flow.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-[color:var(--orbit-accent-border)] bg-[var(--orbit-accent-soft)] px-5 py-5">
              <p className="orbit-accent-label text-[11px] font-semibold uppercase tracking-[0.18em]">
                Built for teams
              </p>
              <p className="mt-3 text-sm leading-6 text-[var(--orbit-text-muted)]">
                Keep rooms, direct messages, and people close without making the screen feel busy.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="orbit-panel flex h-full flex-col rounded-[2rem] p-6 sm:p-8">
        <div className="space-y-4">
          <p className="orbit-accent-label text-xs font-semibold uppercase tracking-[0.35em]">
            {isAuthenticated ? 'Ready' : 'Open Orbit'}
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-[var(--orbit-text)]">
            {isAuthenticated ? 'Continue with your team.' : 'Start with a clean workspace.'}
          </h2>
          <p className="text-sm leading-7 text-[var(--orbit-text-muted)] sm:text-base">
            {isAuthenticated
              ? `${user?.username ?? 'You'} are signed in. Your recent spaces are ready to reopen.`
              : 'Create an account, sign in, and step into a layout that keeps the important parts close.'}
          </p>
        </div>

        <div className="mt-6 space-y-3">
          <div className="rounded-[1.25rem] border border-[color:var(--orbit-border)] bg-[var(--orbit-surface-soft)] px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--orbit-text-subtle)]">
              Meet Orbit
            </p>
            <p className="mt-2 text-lg font-semibold text-[var(--orbit-text)]">
              🪐 Meet Orbit — Stay in orbit with your team.
            </p>
          </div>

          <div className="rounded-[1.25rem] border border-[color:var(--orbit-border)] bg-[var(--orbit-surface-soft)] px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--orbit-text-subtle)]">
              One clear system
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--orbit-text-muted)]">
              Servers, direct messages, people, reactions, and uploads stay organized in
              one readable system.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <ThemeToggle
            className="h-12 rounded-full px-4 text-sm font-medium text-[var(--orbit-text)]"
            showLabel
          />

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
    </div>
  )
}

function NotFoundRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

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
          {isAuthenticated ? (
            <NavLink
              className="orbit-pill rounded-full px-5 py-3 text-sm text-[var(--orbit-text-muted)] transition hover:border-[color:var(--orbit-border-strong)] hover:bg-[var(--orbit-surface-hover)] hover:text-[var(--orbit-text)]"
              to="/app"
            >
              Open workspace
            </NavLink>
          ) : (
            <NavLink
              className="orbit-pill rounded-full px-5 py-3 text-sm text-[var(--orbit-text-muted)] transition hover:border-[color:var(--orbit-border-strong)] hover:bg-[var(--orbit-surface-hover)] hover:text-[var(--orbit-text)]"
              to="/login"
              state={{
                notice: 'Sign in or create an account to open the workspace.',
                reason: 'workspace-required',
                from: {
                  pathname: '/app',
                  search: '',
                  hash: '',
                },
              }}
            >
              Sign in for workspace
            </NavLink>
          )}
        </>
      }
    />
  )
}

function ShellBackground({ children }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--orbit-bg)] text-[var(--orbit-text)]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 orbit-grid opacity-20" />
        <div className="absolute -left-10 top-0 h-80 w-80 rounded-full bg-cyan-500/18 blur-3xl" />
        <div className="absolute right-[-4rem] top-20 h-96 w-96 rounded-full bg-sky-500/12 blur-3xl" />
        <div className="absolute bottom-[-3rem] left-1/3 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="orbit-ring left-[4%] top-[9%] h-[28rem] w-[28rem] opacity-60" />
        <div className="orbit-ring right-[8%] bottom-[8%] h-[20rem] w-[20rem] opacity-50" />
      </div>

      {children}
    </div>
  )
}

function MarketingLayout({ clearSession, isAuthenticated }) {
  const location = useLocation()
  const isOverviewRoute = location.pathname === '/'
  const isLoginRoute = location.pathname === '/login'
  const isRegisterRoute = location.pathname === '/register'
  const isAuthRoute = isLoginRoute || isRegisterRoute
  const workspacePromptState = {
    notice: 'Sign in or create an account to open the workspace.',
    reason: 'workspace-required',
    from: {
      pathname: '/app',
      search: '',
      hash: '',
    },
  }
  const headerEyebrow = isOverviewRoute ? 'Meet Orbit' : isLoginRoute ? 'Sign In' : 'Create Account'
  const headerTitle = isOverviewRoute
    ? 'Stay in orbit with your team'
    : isLoginRoute
      ? 'Return to your workspace'
      : 'Set up your Orbit account'
  const headerDescription = isOverviewRoute
    ? 'A clean team chat layout with servers, direct messages, people, and reactions in one clear system.'
    : isLoginRoute
      ? 'Sign in and pick up the same servers, chats, and people you were already working with.'
      : 'Create an account and start from a layout that stays readable from the first server onward.'

  return (
    <ShellBackground>
      <div className="relative mx-auto flex min-h-screen max-w-[1540px] flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="orbit-panel flex flex-col gap-4 rounded-[1.75rem] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="orbit-accent-label text-xs font-semibold uppercase tracking-[0.4em]">
              {headerEyebrow}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-[var(--orbit-text)] sm:text-4xl">
              {headerTitle}
            </h1>
            <p className="text-sm text-[var(--orbit-text-muted)]">
              {headerDescription}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <ThemeToggle className="h-10 w-10 rounded-full" />
            <nav className="flex flex-wrap gap-3">
              {navItems.map((item) => (
                item.to === '/app' && !isAuthenticated ? (
                  <NavLink
                    key={item.to}
                    to="/login"
                    state={workspacePromptState}
                    className={({ isActive }) =>
                      [
                        'rounded-full border px-4 py-2 text-sm transition',
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
                        'rounded-full border px-4 py-2 text-sm transition',
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
                className="rounded-full border border-[color:var(--orbit-border)] bg-[var(--orbit-surface-soft)] px-4 py-2 text-sm text-[var(--orbit-text-muted)] transition hover:border-[color:var(--orbit-border-strong)] hover:text-[var(--orbit-text)]"
                onClick={clearSession}
              >
                Switch user
              </button>
            ) : null}
          </div>
        </header>

        {isOverviewRoute ? (
          <main className="flex-1 space-y-6 py-6">
            <section className="min-h-0">
              <OrbitUniversePreview />
            </section>

            <section className="min-h-0">
              <Outlet />
            </section>
          </main>
        ) : isAuthRoute ? (
          <main
            className={[
              'grid flex-1 items-stretch gap-6 py-6 xl:min-h-[calc(100vh-11rem)]',
              isLoginRoute
                ? 'xl:grid-cols-[minmax(360px,0.94fr)_minmax(0,1.06fr)]'
                : 'xl:grid-cols-[minmax(0,1.06fr)_minmax(360px,0.94fr)]',
            ].join(' ')}
          >
            {isLoginRoute ? (
              <>
                <section className="min-h-0">
                  <AuthRoutePreview mode="login" />
                </section>
                <section className="flex min-h-0 items-center justify-center">
                  <div className="w-full max-w-[40rem]">
                    <Outlet />
                  </div>
                </section>
              </>
            ) : (
              <>
                <section className="flex min-h-0 items-center justify-center">
                  <div className="w-full max-w-[42rem]">
                    <Outlet />
                  </div>
                </section>
                <section className="min-h-0">
                  <AuthRoutePreview mode="register" />
                </section>
              </>
            )}
          </main>
        ) : (
          <main className="grid flex-1 items-stretch gap-6 py-6 xl:grid-cols-[minmax(0,1.06fr)_minmax(420px,0.94fr)]">
            <section className="min-h-0">
              <OrbitUniversePreview />
            </section>

            <section className="min-h-0">
              <Outlet />
            </section>
          </main>
        )}
      </div>
    </ShellBackground>
  )
}

function WorkspaceLayout({ clearSession, user, accessToken }) {
  usePresenceSocket(accessToken)

  return (
    <ShellBackground>
      <div className="relative flex h-dvh min-h-dvh w-full flex-col overflow-hidden px-2 py-2 sm:px-3 sm:py-3">
        <header className="mb-1.5 shrink-0 flex items-center justify-between gap-3 rounded-[0.95rem] border border-[color:var(--orbit-border)] bg-[var(--orbit-shell-bg)] px-2.5 py-1.5 shadow-[0_10px_24px_rgba(0,0,0,0.16)] backdrop-blur">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.9rem] bg-[var(--orbit-accent-soft)] text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--orbit-accent-ink)]">
              O
            </div>

            <div className="flex min-w-0 items-center gap-2">
              <p className="orbit-accent-label text-[10px] font-semibold uppercase tracking-[0.28em]">
                Orbit
              </p>
              <p className="truncate text-[11px] text-[var(--orbit-text-muted)]">
                {user?.username ?? 'Signed in'}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <ThemeToggle
              className="h-8 rounded-full px-3 text-[11px] font-medium"
              showLabel
            />

            <NavLink
              to="/"
              className={({ isActive }) =>
                [
                  'rounded-full border px-2.5 py-1 text-[11px] font-medium transition',
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
              className="rounded-full border border-[color:var(--orbit-border)] bg-[var(--orbit-surface-soft)] px-2.5 py-1 text-[11px] font-medium text-[var(--orbit-text-muted)] transition hover:border-[color:var(--orbit-border-strong)] hover:text-[var(--orbit-text)]"
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

function App() {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)
  const tokens = useAuthStore((state) => state.tokens)
  const logout = useAuthStore((state) => state.logout)
  const setUser = useAuthStore((state) => state.setUser)
  const resetChatState = useChatStore((state) => state.resetChatState)
  const hydrateTheme = useThemeStore((state) => state.hydrateTheme)

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
