import { useEffect, useSyncExternalStore } from 'react';
import toast from 'react-hot-toast';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { WifiOff } from 'lucide-react';

const subscribeOnline = (cb) => {
  window.addEventListener('online', cb);
  window.addEventListener('offline', cb);
  return () => {
    window.removeEventListener('online', cb);
    window.removeEventListener('offline', cb);
  };
};

/**
 * Registers the service worker. When a new version is deployed it waits for the student's OK (an open page keeps working);
 * a thin bar shows while there is no internet.
 */
export function PwaStatus() {
  const online = useSyncExternalStore(subscribeOnline, () => navigator.onLine);
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, reg) {
      // Look for a new version every hour for students who keep the app open.
      if (reg) setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);
    },
  });

  useEffect(() => {
    if (!needRefresh) return;
    toast(
      (t) => (
        <span className="flex items-center gap-3">
          নতুন আপডেট এসেছে
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              toast.dismiss(t.id);
              updateServiceWorker(true);
            }}
          >
            রিলোড করো
          </button>
        </span>
      ),
      { id: 'sw-update', duration: Infinity, icon: '✨' }
    );
  }, [needRefresh, updateServiceWorker]);

  if (online) return null;
  return (
    <div className="offline-bar fixed inset-x-0 bottom-0 z-50 flex items-center justify-center gap-2 bg-neutral px-3 py-1.5 text-center text-sm text-neutral-content">
      <WifiOff className="size-4 shrink-0" /> ইন্টারনেট নেই — আগে খোলা বা সেভ করা পাঠ পড়া যাবে
    </div>
  );
}
