import { useEffect } from 'react';
import { refreshSession } from '@/lib/api';
import { forgetOfflineData, isNetworkError, savedUser } from '@/lib/offline';
import { useAuthStore } from '@/store/auth';
import { PageLoader } from '@/components/ui/PageLoader';

const PUBLIC_PATHS = ['/', '/pricing', '/login', '/register'];

/**
 * Restores the session from the refresh cookie once, before rendering routes.
 * Without a network the last signed-in user is used (offline mode) and the session is refreshed when the network returns.
 */
export function AuthBootstrap({ children }) {
  const status = useAuthStore((s) => s.status);
  const offline = useAuthStore((s) => s.offline);

  useEffect(() => {
    if (useAuthStore.getState().status !== 'idle') return;
    // Nobody has signed in on this device and it's a public page: show it now, check the cookie in the background.
    const publicPage = PUBLIC_PATHS.includes(window.location.pathname);
    useAuthStore.getState().setStatus(publicPage && !savedUser() ? 'guest' : 'loading');
    refreshSession().catch((err) => {
      const user = savedUser();
      if (isNetworkError(err) && user) return useAuthStore.getState().setOfflineSession(user);
      useAuthStore.getState().clear();
      if (!isNetworkError(err)) forgetOfflineData();
    });
  }, []);

  useEffect(() => {
    if (!offline) return;
    const reconnect = () =>
      refreshSession().catch((err) => {
        if (!isNetworkError(err)) useAuthStore.getState().clear();
      });
    window.addEventListener('online', reconnect);
    return () => window.removeEventListener('online', reconnect);
  }, [offline]);

  if (status === 'idle' || status === 'loading') return <PageLoader full />;
  return children;
}
