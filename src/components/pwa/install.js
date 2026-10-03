import { useSyncExternalStore } from 'react';

// Chrome/Edge/Android fire `beforeinstallprompt` once, early — keep it from app start so the button can use it later.
let deferred = null;
const listeners = new Set();
const notify = () => listeners.forEach((l) => l());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    notify();
  });
}

const isStandalone = () => window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
// iPhone/iPad Safari has no install prompt; students add it from the Share menu.
const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

function snapshot() {
  if (isStandalone()) return 'installed';
  if (deferred) return 'prompt';
  return isIos() ? 'ios' : 'none';
}

const subscribe = (l) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** 'prompt' (can show the install dialog) | 'ios' (show instructions) | 'installed' | 'none' */
export const useInstallState = () => useSyncExternalStore(subscribe, snapshot);

export async function promptInstall() {
  if (!deferred) return false;
  deferred.prompt();
  const { outcome } = await deferred.userChoice;
  deferred = null;
  notify();
  return outcome === 'accepted';
}
