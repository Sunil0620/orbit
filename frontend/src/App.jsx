import { Navigate, NavLink, Route, Routes } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import useAuthStore from './store/useAuthStore'

const navItems = [
  { to: '/', label: 'Overview' },
  { to: '/login', label: 'Login' },
  { to: '/register', label: 'Register' },
]

const summaryCards = [
  { label: 'Register', value: 'POST /api/auth/register/' },
  { label: 'Login', value: 'POST /api/auth/token/' },
  { label: 'State', value: 'Tokens stored in Zustand' },
]

function Panel({ eyebrow, title, description, checklist }) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-indigo-300">
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
    </div>
  )
}

function OverviewPanel() {
  const { isAuthenticated, user, tokens } = useAuthStore((state) => ({
    isAuthenticated: state.isAuthenticated,
    user: state.user,
    tokens: state.tokens,
  }))

  return (
    <Panel
      eyebrow="Overview"
      title={isAuthenticated ? 'Session loaded into Zustand' : 'Auth pages are now wired'}
      description={
        isAuthenticated
          ? 'The login flow is posting to the JWT endpoint and storing the returned token pair in the auth store.'
          : 'Day 6 replaces the placeholders with live login and register pages connected to the backend auth API.'
      }
      checklist={[
        'Register posts to /api/auth/register/.',
        'Login posts to /api/auth/token/.',
        isAuthenticated
          ? `Signed in as ${user?.username ?? 'current user'}.`
          : 'Successful login stores access and refresh tokens in useAuthStore.',
        tokens?.access
          ? 'Access token is present in the client store.'
          : 'JWT persistence and refresh handling land on Day 7.',
      ]}
    />
  )
}

function NotFoundRoute() {
  return (
    <Panel
      eyebrow="Missing Route"
      title="This route is not wired yet"
      description="The router only exposes the overview and Day 6 auth screens right now."
      checklist={[
        'Visit /login for the JWT token form.',
        'Visit /register for the account creation form.',
        'Use the Overview route to inspect client auth state.',
      ]}
    />
  )
}

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const logout = useAuthStore((state) => state.logout)

  return (
    <div className="relative min-h-screen overflow-hidden bg-gray-900 text-gray-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-8 top-0 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute right-0 top-20 h-80 w-80 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-6 border-b border-white/10 pb-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-indigo-300">
              Orbit
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Day 6 auth screens
            </h1>
            <p className="text-sm text-gray-400">
              React forms are now connected to the Django JWT auth endpoints.
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
                        ? 'border-indigo-300/60 bg-indigo-400/10 text-indigo-100'
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
                onClick={logout}
              >
                Clear session
              </button>
            ) : null}
          </div>
        </header>

        <main className="grid flex-1 gap-10 py-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] lg:items-center">
          <section className="space-y-8">
            <div className="space-y-5">
              <span className="inline-flex rounded-full border border-indigo-300/20 bg-indigo-300/10 px-4 py-1 text-xs font-medium uppercase tracking-[0.3em] text-indigo-100">
                Login + Register + JWT
              </span>
              <h2 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                The frontend now talks to the backend auth API instead of a placeholder shell.
              </h2>
              <p className="max-w-2xl text-base leading-8 text-gray-300 sm:text-lg">
                Day 6 adds real forms, field-level API error rendering, and the
                first client-side auth state update so Day 7 can focus on
                persistence, interceptors, and protected routes.
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

          <section className="rounded-[2rem] border border-white/10 bg-gray-900/70 p-6 shadow-panel backdrop-blur sm:p-8">
            <Routes>
              <Route path="/" element={<OverviewPanel />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/auth/login" element={<Navigate to="/login" replace />} />
              <Route path="/auth/register" element={<Navigate to="/register" replace />} />
              <Route path="*" element={<NotFoundRoute />} />
            </Routes>
          </section>
        </main>
      </div>
    </div>
  )
}

export default App
