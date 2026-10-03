import { useEffect, useState } from 'react';
import { errorMessage } from '@/lib/api';
import { useAuthActions } from './useAuthActions';

const googleEnabled = Boolean(import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_PROJECT_ID);

const POPUP_ERRORS = {
  'auth/popup-blocked': 'পপআপ ব্লক হয়েছে — ব্রাউজারে পপআপ চালু করে আবার চাপো',
  'auth/network-request-failed': 'ইন্টারনেট সংযোগ নেই',
  'auth/unauthorized-domain': 'এই ঠিকানা থেকে Google লগইন চালু করা হয়নি',
};

/**
 * "Continue with Google" for the login and sign-up pages. Firebase is loaded when the button appears (not on click),
 * so the account picker opens straight from the tap and isn't blocked as a popup.
 */
export function GoogleButton({ redirectTo, onError }) {
  const { googleLogin } = useAuthActions();
  const [fb, setFb] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (googleEnabled) import('@/lib/firebase').then(setFb).catch(() => onError?.('Google লগইন লোড হয়নি — পেজ রিফ্রেশ করো'));
  }, [onError]);

  if (!googleEnabled) return null;

  const start = async () => {
    onError?.('');
    setBusy(true);
    try {
      const idToken = await fb.googleIdToken();
      if (idToken) await googleLogin(idToken, redirectTo);
    } catch (err) {
      onError?.(POPUP_ERRORS[err?.code] || errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button type="button" className="btn w-full border-base-300 bg-base-100 hover:bg-base-200" onClick={start} disabled={!fb || busy}>
        {busy ? <span className="loading loading-spinner loading-sm" /> : <GoogleLogo />} Google দিয়ে চালিয়ে যাও
      </button>
      <div className="divider my-1 text-xs text-base-content/50">অথবা ইমেইল দিয়ে</div>
    </>
  );
}

function GoogleLogo() {
  return (
    <svg viewBox="0 0 48 48" className="size-5" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
