import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router';
import { Toaster } from 'react-hot-toast';
import { router } from './router';
import { AuthBootstrap } from '@/features/auth/AuthBootstrap';
import { queryClient } from '@/lib/queryClient';
import { installGamificationHooks } from '@/features/gamification/celebrate';

installGamificationHooks();

export function AppProviders() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthBootstrap>
        <RouterProvider router={router} />
      </AuthBootstrap>
      <Toaster
        position="top-center"
        toastOptions={{ className: '!rounded-xl !font-sans !bg-base-100 !text-base-content !shadow-lg' }}
      />
    </QueryClientProvider>
  );
}
