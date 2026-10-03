import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api, errorMessage } from '@/lib/api';

export const planKey = ['plan'];

export const usePlan = () => useQuery({ queryKey: planKey, queryFn: async () => (await api.get('/plan')).data });

/** create (POST), replan / change settings (PATCH), tick a task, delete — all return the fresh plan view. */
export function usePlanAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ method, url = '/plan', body }) => (await api[method](url, body)).data,
    onSuccess: (data) => {
      qc.setQueryData(planKey, data.ok ? { plan: null } : data);
      if (data.dayBonus) toast.success('আজকের প্ল্যান সম্পূর্ণ! +১০ XP 🎯');
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
}

/** Downloads the daily-reminder calendar file. */
export async function downloadCalendar(time) {
  const res = await api.get('/plan/calendar.ics', { params: { time }, responseType: 'blob' });
  const url = URL.createObjectURL(res.data);
  const a = Object.assign(document.createElement('a'), { href: url, download: 'ict-crack-study-plan.ics' });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
