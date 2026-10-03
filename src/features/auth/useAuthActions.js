import { useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

export function useAuthActions() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setSession = useAuthStore((s) => s.setSession);
  const clear = useAuthStore((s) => s.clear);

  return {
    async login(values, redirectTo = '/dashboard') {
      const { data } = await api.post('/auth/login', values);
      setSession(data);
      navigate(redirectTo, { replace: true });
    },
    async register(values) {
      const { data } = await api.post('/auth/register', values);
      setSession(data);
      navigate('/dashboard', { replace: true, state: { welcome: true } });
    },
    async logout() {
      await api.post('/auth/logout').catch(() => {});
      clear();
      queryClient.clear();
      navigate('/', { replace: true });
    },
  };
}
