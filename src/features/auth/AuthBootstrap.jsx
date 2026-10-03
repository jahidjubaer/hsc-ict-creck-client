import { useEffect } from 'react';
import { refreshSession } from '@/lib/api';
import { forgetOfflineData, isNetworkError, savedUser } from '@/lib/offline';
import { useAuthStore } from '@/store/auth';
import { PageLoader } from '@/components/ui/PageLoader';
import { queryClient } from '@/lib/queryClient';

// Pages a visitor can use: shown at once on a device where nobody has signed in (the session check runs behind).
const PUBLIC_PATHS = ['/', '/pricing', '/login', '/register'];
const PUBLIC_PREFIXES = ['/learn', '/exams', '/practice/'];
const isPublicPage = (path) => PUBLIC_PATHS.includes(path) || PUBLIC_PREFIXES.some((p) => path === p || path.startsWith(p.endsWith('/') ? p : `${p}/`));

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
    const shownAsGuest = isPublicPage(window.location.pathname) && !savedUser();
    useAuthStore.getState().setStatus(shownAsGuest ? 'guest' : 'loading');
    refreshSession()
      // signed in after all (cookie, but no saved user): reload what was fetched as a visitor
      .then(() => shownAsGuest && queryClient.invalidateQueries())
      .catch((err) => {
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
