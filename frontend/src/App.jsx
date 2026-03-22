import { NavLink, Route, Routes } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Overview' },
  { to: '/auth/login', label: 'Login' },
  { to: '/auth/register', label: 'Register' },
]

const buildCards = [
  { label: 'Routing', value: 'React Router v6 shell' },
  { label: 'API layer', value: 'Axios instance scaffolded' },
  { label: 'State', value: 'Zustand auth store ready' },
]

function RoutePanel({ eyebrow, title, description, checklist }) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300">
          {eyebrow}
        </p>
        <h2 className="text-3xl font-semibold tracking-tight text-white">
          {title}
        </h2>
        <p className="max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
          {description}
        </p>
      </div>

      <ul className="space-y-3">
        {checklist.map((item) => (
          <li
            key={item}
            className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-slate-200"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function NotFoundRoute() {
  return (
    <RoutePanel
      eyebrow="Missing Route"
      title="This route is not wired yet"
      description="Day 5 only establishes the frontend shell. The real auth and app screens start landing in Day 6 and beyond."
      checklist={[
        'Check the Router shell in src/App.jsx.',
        'Add page components under src/pages/ on the next roadmap days.',
        'Keep API calls centralized under src/api/.',
      ]}
    />
  )
}

function App() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-8 top-0 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute right-0 top-24 h-80 w-80 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-6 border-b border-white/10 pb-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-cyan-300">
              Orbit
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Day 5 frontend scaffold
            </h1>
          </div>

          <nav className="flex flex-wrap gap-3">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    'rounded-full border px-4 py-2 text-sm transition',
                    isActive
                      ? 'border-cyan-300/60 bg-cyan-300/10 text-cyan-100'
                      : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:text-white',
                  ].join(' ')
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </header>

        <main className="grid flex-1 gap-10 py-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] lg:items-center">
          <section className="space-y-8">
            <div className="space-y-5">
              <span className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-1 text-xs font-medium uppercase tracking-[0.3em] text-cyan-100">
                React + Vite + Tailwind
              </span>
              <h2 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                The client app is now wired for auth flows and API work.
              </h2>
              <p className="max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
                This shell replaces the Vite starter and sets the repo up for
                login, registration, protected routes, and shared API state on
                the next roadmap steps.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {buildCards.map((card) => (
                <article
                  key={card.label}
                  className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur"
                >
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-400">
                    {card.label}
                  </p>
                  <p className="mt-3 text-lg font-medium text-white">
                    {card.value}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 shadow-panel backdrop-blur sm:p-8">
            <Routes>
              <Route
                path="/"
                element={
                  <RoutePanel
                    eyebrow="Overview Route"
                    title="Shell ready for protected app routes"
                    description="The router is mounted, the HTML document defaults to dark mode, and the project folders for API helpers, hooks, pages, and state are now in place."
                    checklist={[
                      'src/api/axiosInstance.js reads from VITE_API_URL.',
                      'src/store/useAuthStore.js exposes setAuth and logout.',
                      'src/utils/formatDate.js handles relative timestamps.',
                    ]}
                  />
                }
              />
              <Route
                path="/auth/login"
                element={
                  <RoutePanel
                    eyebrow="Login Route"
                    title="Login page placeholder"
                    description="Day 6 will connect this route to the JWT token endpoint and hydrate the Zustand auth store."
                    checklist={[
                      'POST credentials to /api/auth/token/.',
                      'Persist the returned token pair in the auth store.',
                      'Redirect into the app shell after success.',
                    ]}
                  />
                }
              />
              <Route
                path="/auth/register"
                element={
                  <RoutePanel
                    eyebrow="Register Route"
                    title="Register page placeholder"
                    description="Day 6 will add the actual form, validation, API integration, and token handoff after sign-up."
                    checklist={[
                      'Collect username, email, password, and password2.',
                      'POST the payload to /api/auth/register/.',
                      'Surface API validation errors cleanly.',
                    ]}
                  />
                }
              />
              <Route path="*" element={<NotFoundRoute />} />
            </Routes>
          </section>
        </main>
      </div>
    </div>
  )
}

export default App
