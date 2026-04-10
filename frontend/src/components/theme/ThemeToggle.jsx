import useThemeStore from '../../store/useThemeStore'

function SunIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2.5" />
      <path d="M12 19.5V22" />
      <path d="m4.93 4.93 1.77 1.77" />
      <path d="m17.3 17.3 1.77 1.77" />
      <path d="M2 12h2.5" />
      <path d="M19.5 12H22" />
      <path d="m4.93 19.07 1.77-1.77" />
      <path d="m17.3 6.7 1.77-1.77" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12.8A9 9 0 1 1 11.2 3c-.1.4-.2.9-.2 1.4a8 8 0 0 0 8 8c.5 0 1-.1 1.5-.2Z" />
    </svg>
  )
}

function ThemeToggle({ className = '', showLabel = false }) {
  const theme = useThemeStore((state) => state.theme)
  const toggleTheme = useThemeStore((state) => state.toggleTheme)
  const label = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
  const textLabel = 'Theme'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={['orbit-theme-toggle', className].filter(Boolean).join(' ')}
      aria-label={label}
      aria-pressed={theme === 'dark'}
      title={label}
    >
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
      {showLabel ? <span>{textLabel}</span> : null}
    </button>
  )
}

export default ThemeToggle
