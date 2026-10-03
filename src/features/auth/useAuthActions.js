import { useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { forgetOfflineData } from '@/lib/offline';

export function useAuthActions() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setSession = useAuthStore((s) => s.setSession);
  const clear = useAuthStore((s) => s.clear);

  return {
    // Pages loaded as a visitor (locked topics, guest tests) are refetched as the signed-in student.
    async login(values, redirectTo = '/dashboard') {
      const { data } = await api.post('/auth/login', values);
      setSession(data);
      queryClient.invalidateQueries();
      navigate(redirectTo, { replace: true });
    },
    async register(values, redirectTo = '/dashboard') {
      const { data } = await api.post('/auth/register', values);
      setSession(data);
      queryClient.invalidateQueries();
      navigate(redirectTo, { replace: true, state: { welcome: true } });
    },
    async logout() {
      await api.post('/auth/logout').catch(() => {});
      clear();
      queryClient.clear();
      await forgetOfflineData();
      navigate('/', { replace: true });
    },
  };
}
