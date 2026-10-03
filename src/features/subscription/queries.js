import { useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

export const paymentKeys = { info: ['payment-info'], mine: ['payments-mine'] };

export const usePaymentInfo = () =>
  useQuery({ queryKey: paymentKeys.info, queryFn: async () => (await api.get('/payments/info')).data, staleTime: 5 * 60_000 });

/** The student's payments. While one is pending it is re-checked every 30 s. */
export const useMyPayments = ({ enabled = true } = {}) =>
  useQuery({
    queryKey: paymentKeys.mine,
    queryFn: async () => (await api.get('/payments/mine')).data.payments,
    enabled,
    refetchInterval: (q) => (q.state.data?.some((p) => p.status === 'pending') ? 30_000 : false),
    refetchOnWindowFocus: true,
  });

/**
 * Mounted once (in the app shell): when a pending payment gets decided, refresh the user (and so `access`)
 * so the app unlocks without a reload, and tell the student.
 */
export function usePaymentWatcher({ enabled }) {
  const setUser = useAuthStore((s) => s.setUser);
  const query = useMyPayments({ enabled });
  const seen = useRef(null);
  useEffect(() => {
    const list = query.data;
    if (!list) return;
    const pendingIds = new Set(list.filter((p) => p.status === 'pending').map((p) => p._id));
    const before = seen.current;
    seen.current = pendingIds;
    if (!before) return;
    const decided = list.filter((p) => before.has(p._id) && p.status !== 'pending');
    if (!decided.length) return;
    api.get('/auth/me').then(({ data }) => setUser(data.user)).catch(() => {});
    for (const p of decided) {
      if (p.status === 'approved') toast.success('পেমেন্ট যাচাই হয়েছে — প্রিমিয়াম চালু! 🎉', { duration: 6000 });
      else toast.error('একটি পেমেন্ট বাতিল হয়েছে — প্রোফাইলে কারণ দেখো', { duration: 6000 });
    }
  }, [query.data, setUser]);

  return query;
}

export function useSubmitPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body) => (await api.post('/payments', body)).data.payment,
    onSuccess: (payment) => qc.setQueryData(paymentKeys.mine, (old) => [payment, ...(old ?? [])]),
  });
}
