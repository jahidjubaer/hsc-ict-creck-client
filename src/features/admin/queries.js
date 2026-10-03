import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api, errorMessage } from '@/lib/api';

const get = async (url, params) => (await api.get(url, { params })).data;
/** Drops empty filter values so they don't end up in the URL as `q=`. */
const clean = (params) => Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== null && v !== false));

export const useAdminStats = () => useQuery({ queryKey: ['admin', 'stats'], queryFn: () => get('/admin/stats'), refetchInterval: 60_000 });
export const useAdminMeta = () => useQuery({ queryKey: ['admin', 'meta'], queryFn: () => get('/admin/meta'), staleTime: Infinity });

const list = (name, url) => (params) =>
  useQuery({ queryKey: ['admin', name, clean(params)], queryFn: () => get(url, clean(params)), placeholderData: keepPreviousData });

export const useAdminPayments = list('payments', '/admin/payments');
export const useAdminUsers = list('users', '/admin/users');
export const useAiGradings = list('ai', '/admin/ai-gradings');
export const useAdminQuestions = list('questions', '/admin/questions');

export const useAdminUser = (id) => useQuery({ queryKey: ['admin', 'user', id], queryFn: () => get(`/admin/users/${id}`) });
export const useAdminQuestion = (id) =>
  useQuery({ queryKey: ['admin', 'question', id], queryFn: async () => (await get(`/admin/questions/${id}`)).question });
export const useAdminSettings = () => useQuery({ queryKey: ['admin', 'settings'], queryFn: () => get('/admin/settings') });

/** POST/PATCH/PUT helper: refreshes every admin query afterwards and toasts errors. */
export function useAdminAction({ success } = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ method = 'post', url, body }) => (await api[method](url, body)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin'] });
      if (success) toast.success(success);
    },
    onError: (err) => {
      const details = err?.response?.data?.error?.details;
      toast.error(details?.length ? `${errorMessage(err)}: ${details[0].path} — ${details[0].message}` : errorMessage(err));
    },
  });
}
