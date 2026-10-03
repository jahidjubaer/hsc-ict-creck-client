import { useState } from 'react';
import { Link } from 'react-router';
import { UserRoundPen, X } from 'lucide-react';
import { useAuthStore } from '@/store/auth';

const KEY = 'ict-profile-nudge-hidden';
const hiddenBefore = () => {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
};

/** Sign-up asks only for name, email and password; this reminds the student to add the rest when they like. */
export function ProfileNudge() {
  const user = useAuthStore((s) => s.user);
  const [hidden, setHidden] = useState(hiddenBefore);
  const missing = [!user.college && 'কলেজ', !user.hscYear && 'HSC সাল', !user.phone && 'মোবাইল'].filter(Boolean);
  if (hidden || user.role === 'admin' || missing.length === 0) return null;

  const hide = () => {
    setHidden(true);
    try {
      localStorage.setItem(KEY, '1');
    } catch {
      /* private mode */
    }
  };

  return (
    <div className="card-soft flex items-center gap-3 p-4">
      <UserRoundPen className="size-8 shrink-0 text-primary" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">প্রোফাইল সম্পূর্ণ করো</p>
        <p className="text-sm text-base-content/60">{missing.join(', ')} যোগ করলে লিডারবোর্ডে কলেজ দেখাবে আর পেমেন্ট যাচাই সহজ হবে।</p>
      </div>
      <Link to="/profile" className="btn btn-primary btn-sm">
        যোগ করো
      </Link>
      <button type="button" className="btn btn-ghost btn-sm btn-square" onClick={hide} aria-label="আর দেখিও না">
        <X className="size-4" />
      </button>
    </div>
  );
}
