import toast from 'react-hot-toast';
import { confetti } from '@/lib/confetti';
import { api } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/store/auth';
import { BadgeToast } from './BadgeToast';

export function celebrateBadges(badges) {
  badges.forEach((b, i) =>
    setTimeout(() => toast.custom((t) => <BadgeToast badge={b} visible={t.visible} />, { duration: 5000, id: `badge-${b.key}` }), i * 700)
  );
  confetti({ particleCount: 80, spread: 70, origin: { y: 0.2 } });
  queryClient.invalidateQueries({ queryKey: ['badges'] });
}

let installed = false;

/**
 * Any API response may carry `newBadges` (the server adds them when a request earned one) → celebrate.
 * Reading heartbeats carry the fresh `streak` → keep the header chip in sync.
 * Topic completion / test submission → refetch the study plan (tasks tick themselves).
 */
export function installGamificationHooks() {
  if (installed) return;
  installed = true;
  api.interceptors.response.use((res) => {
    const data = res.data;
    if (data && typeof data === 'object') {
      if (data.newBadges?.length) celebrateBadges(data.newBadges);
      const { user, setUser } = useAuthStore.getState();
      if (data.streak && user && !data.user) setUser({ ...user, streak: data.streak });
    }
    // Finishing a topic or a test can tick study-plan tasks on the server.
    if (/\/progress\/topics\/[^/]+\/complete|\/exams\/attempts\/[^/]+\/submit/.test(res.config?.url ?? '')) {
      queryClient.invalidateQueries({ queryKey: ['plan'] });
    }
    return res;
  });
}
