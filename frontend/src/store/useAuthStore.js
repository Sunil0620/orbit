import { create } from 'zustand'

const initialState = {
  user: null,
  tokens: null,
  isAuthenticated: false,
}

const useAuthStore = create((set) => ({
  ...initialState,
  setAuth: ({ user, tokens }) =>
    set({
      user: user ?? null,
      tokens: tokens ?? null,
      isAuthenticated: Boolean(tokens?.access ?? tokens?.refresh),
    }),
  logout: () => set(initialState),
}))

export default useAuthStore
