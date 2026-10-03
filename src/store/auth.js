import { create } from 'zustand';

/**
 * status: 'idle' (not checked yet) | 'loading' | 'authed' | 'guest'
 * The access token lives only in memory; the refresh token is an httpOnly cookie.
 */
export const useAuthStore = create((set) => ({
  user: null,
  accessToken: null,
  status: 'idle',
  setSession: ({ user, accessToken }) => set({ user, accessToken, status: 'authed' }),
  setUser: (user) => set({ user }),
  setStatus: (status) => set({ status }),
  clear: () => set({ user: null, accessToken: null, status: 'guest' }),
}));
