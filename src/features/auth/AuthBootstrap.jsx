import { useEffect } from 'react';
import { refreshSession } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { PageLoader } from '@/components/ui/PageLoader';

/** Restores the session from the refresh cookie once, before rendering routes. */
export function AuthBootstrap({ children }) {
  const status = useAuthStore((s) => s.status);

  useEffect(() => {
    if (useAuthStore.getState().status !== 'idle') return;
    useAuthStore.getState().setStatus('loading');
    refreshSession().catch(() => useAuthStore.getState().clear());
  }, []);

  if (status === 'idle' || status === 'loading') return <PageLoader full />;
  return children;
}
