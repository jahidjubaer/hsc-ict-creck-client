import { create } from 'zustand';
import { rememberUser } from '@/lib/offline';

/**
 * status: 'idle' (not checked yet) | 'loading' | 'authed' | 'guest'
 * The access token lives only in memory; the refresh token is an httpOnly cookie.
 * offline: signed in from the saved user because the server could not be reached (no access token yet).
 */
export const useAuthStore = create((set) => ({
  user: null,
  accessToken: null,
  status: 'idle',
  offline: false,
  setSession: ({ user, accessToken }) => {
    rememberUser(user);
    set({ user, accessToken, status: 'authed', offline: false });
  },
  setOfflineSession: (user) => set({ user, accessToken: null, status: 'authed', offline: true }),
  setUser: (user) => {
    rememberUser(user);
    set({ user });
  },
  setStatus: (status) => set({ status }),
  clear: () => set({ user: null, accessToken: null, status: 'guest', offline: false }),
}));
