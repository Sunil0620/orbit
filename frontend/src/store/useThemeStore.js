import { create } from 'zustand'

export const THEME_STORAGE_KEY = 'orbit-theme'

const THEME_VALUES = new Set(['dark', 'light'])

function canUseDom() {
  return typeof window !== 'undefined' && Boolean(window.document)
}

function persistTheme(theme) {
  if (!canUseDom()) {
    return
  }

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Ignore storage failures and keep the current in-memory theme.
  }
}

function resolvePreferredTheme() {
  if (!canUseDom() || typeof window.matchMedia !== 'function') {
    return 'dark'
  }

  return window.matchMedia('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark'
}

function readStoredTheme() {
  if (!canUseDom()) {
    return 'dark'
  }

  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
    return THEME_VALUES.has(storedTheme) ? storedTheme : resolvePreferredTheme()
  } catch {
    return resolvePreferredTheme()
  }
}

function applyTheme(theme) {
  if (!canUseDom()) {
    return
  }

  const root = window.document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.classList.toggle('light', theme === 'light')
  root.style.colorScheme = theme
}

const initialTheme = readStoredTheme()
applyTheme(initialTheme)

const useThemeStore = create((set) => ({
  theme: initialTheme,
  hydrateTheme: () => {
    const nextTheme = readStoredTheme()
    applyTheme(nextTheme)
    set(() => ({
      theme: nextTheme,
    }))
  },
  toggleTheme: () =>
    set((state) => {
      const nextTheme = state.theme === 'dark' ? 'light' : 'dark'
      persistTheme(nextTheme)
      applyTheme(nextTheme)
      return {
        theme: nextTheme,
      }
    }),
}))

export default useThemeStore
