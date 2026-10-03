import { Link, useLocation } from 'react-router';
import { LockKeyhole, LogIn, Sparkles } from 'lucide-react';

/**
 * Shown to visitors where an account is needed. After login/sign-up they come back to this page.
 * The 15-day free trial is the pitch: everything opens the moment they sign up.
 */
export function LoginPrompt({ title = 'লগইন প্রয়োজন', message = 'এই অংশ ব্যবহার করতে লগইন করো।', compact = false }) {
  const { pathname } = useLocation();
  const state = { from: pathname };
  return (
    <div className={compact ? 'rounded-2xl border border-primary/25 bg-primary/5 p-5 text-center' : 'card-soft mx-auto max-w-lg p-8 text-center'}>
      {!compact && <LockKeyhole className="mx-auto size-12 text-primary" />}
      <h2 className={compact ? 'font-bold' : 'mt-4 text-2xl font-bold'}>{title}</h2>
      <p className="mt-2 text-base-content/70">{message}</p>
      <p className="mt-2 flex items-center justify-center gap-1 text-sm font-semibold text-success">
        <Sparkles className="size-4" /> নতুন অ্যাকাউন্টে ১৫ দিন সব কনটেন্ট ও পরীক্ষা ফ্রি
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Link to="/register" state={state} className="btn btn-primary">
          ফ্রি অ্যাকাউন্ট খোলো
        </Link>
        <Link to="/login" state={state} className="btn btn-ghost">
          <LogIn className="size-4" /> লগইন
        </Link>
      </div>
    </div>
  );
}
