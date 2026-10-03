import { Link } from 'react-router';
import { Crown, Hourglass, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { daysLeft, toBn } from '@/lib/bn';
import { usePaymentWatcher } from '@/features/subscription/queries';

const RENEW_WARN_DAYS = 5;

/** Trial countdown / pending payment / expiry notice shown at the top of the app shell. */
export function AccessBanner() {
  const access = useAuthStore((s) => s.user?.access);
  const isStudent = access && access.kind !== 'admin';
  // Also keeps polling while a payment is pending, so approval unlocks the app without a reload.
  const { data: payments } = usePaymentWatcher({ enabled: Boolean(isStudent) });
  if (!isStudent) return null;

  const pending = payments?.some((p) => p.status === 'pending');
  if (pending && access.kind !== 'premium') {
    return (
      <div className="bg-warning/15 px-4 py-2 text-center text-sm">
        <Hourglass className="inline size-4" /> তোমার পেমেন্ট যাচাই চলছে — যাচাই হলেই প্রিমিয়াম চালু হবে।{' '}
        <Link to="/profile" className="link font-semibold">
          স্ট্যাটাস
        </Link>
      </div>
    );
  }

  if (access.kind === 'expired') {
    return (
      <div className="bg-error/10 px-4 py-2.5 text-center text-sm text-error">
        তোমার ফ্রি ট্রায়াল শেষ হয়েছে।{' '}
        <Link to="/subscribe" className="link font-semibold">
          <Crown className="inline size-4" /> প্রিমিয়াম নাও
        </Link>{' '}
        — সব পাঠ ও পরীক্ষা আনলক করো।
      </div>
    );
  }

  const left = daysLeft(access.endsAt);
  if (access.kind === 'premium') {
    if (left > RENEW_WARN_DAYS || pending) return null;
    return (
      <div className="bg-accent/15 px-4 py-2 text-center text-sm">
        প্রিমিয়ামের আর <b>{toBn(left)} দিন</b> বাকি।{' '}
        <Link to="/subscribe" className="link font-semibold">
          মেয়াদ বাড়াও
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-accent/15 px-4 py-2 text-center text-sm">
      <Sparkles className="inline size-4 text-accent-content" /> ফ্রি ট্রায়াল: আর <b>{toBn(left)} দিন</b> বাকি।{' '}
      <Link to="/subscribe" className="link font-semibold">
        প্যাকেজ দেখো
      </Link>
    </div>
  );
}
