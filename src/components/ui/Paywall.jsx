import { Link } from 'react-router';
import { Crown } from 'lucide-react';

/** Shown in place of premium content when the trial is over (API answered 402 PAYMENT_REQUIRED). */
export function Paywall({ title = 'প্রিমিয়াম প্রয়োজন', message }) {
  return (
    <div className="card-soft mx-auto max-w-lg p-8 text-center">
      <Crown className="mx-auto size-12 text-amber-500" />
      <h1 className="mt-4 text-2xl font-bold">{title}</h1>
      <p className="mt-2 text-base-content/70">{message ?? 'তোমার ফ্রি ট্রায়াল শেষ হয়েছে। প্যাকেজ নিয়ে সব পাঠ ও পরীক্ষা খুলে দাও।'}</p>
      <p className="mt-1 text-sm text-base-content/60">বিকাশ বা নগদে সহজ পেমেন্ট</p>
      <div className="mt-6 flex justify-center gap-2">
        <Link to="/subscribe" className="btn btn-primary">
          <Crown className="size-4" /> প্যাকেজ নাও
        </Link>
        <Link to="/learn" className="btn btn-ghost">
          ফ্রি টপিক পড়ো
        </Link>
      </div>
    </div>
  );
}
