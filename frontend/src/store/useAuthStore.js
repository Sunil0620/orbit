import { create } from 'zustand'

export const AUTH_STORAGE_KEY = 'orbit-auth'

const emptyAuthState = {
  user: null,
  tokens: null,
  isAuthenticated: false,
}

function buildAuthState({ user = null, tokens = null } = {}) {
  return {
    user: user ?? null,
    tokens: tokens ?? null,
    isAuthenticated: Boolean(tokens?.access ?? tokens?.refresh),
  }
}

function canUseStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage)
}

function persistAuthState(state) {
  if (!canUseStorage()) {
    return
  }

  if (!state?.tokens?.access && !state?.tokens?.refresh) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
    return
  }

  window.localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({
      user: state.user ?? null,
      tokens: state.tokens ?? null,
    }),
  )
}

export function readStoredAuth() {
  if (!canUseStorage()) {
    return null
  }

  const storedValue = window.localStorage.getItem(AUTH_STORAGE_KEY)

  if (!storedValue) {
    return null
  }

  try {
    const parsedValue = JSON.parse(storedValue)
    return buildAuthState(parsedValue)
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  }
}

const useAuthStore = create((set) => ({
  ...(readStoredAuth() ?? emptyAuthState),
  setAuth: ({ user, tokens }) =>
    set(() => {
      const nextState = buildAuthState({ user, tokens })
      persistAuthState(nextState)
      return nextState
    }),
  hydrateAuth: (authState) =>
    set(() => {
      const nextState = authState ? buildAuthState(authState) : emptyAuthState
      persistAuthState(nextState)
      return nextState
    }),
  updateTokens: (tokens) =>
    set((state) => {
      const nextState = buildAuthState({ user: state.user, tokens })
      persistAuthState(nextState)
      return nextState
    }),
  setUser: (user) =>
    set((state) => {
      const nextState = buildAuthState({ user, tokens: state.tokens })
      persistAuthState(nextState)
      return nextState
    }),
  logout: () =>
    set(() => {
      persistAuthState(emptyAuthState)
      return emptyAuthState
    }),
}))

export default useAuthStore
