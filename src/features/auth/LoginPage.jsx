import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { AuthShell, FieldError } from './AuthShell';
import { useAuthActions } from './useAuthActions';
import { errorMessage } from '@/lib/api';

const schema = z.object({
  email: z.email('সঠিক ইমেইল দাও'),
  password: z.string().min(1, 'পাসওয়ার্ড দাও'),
});

export default function LoginPage() {
  const { login } = useAuthActions();
  const location = useLocation();
  const [showPw, setShowPw] = useState(false);
  const [serverError, setServerError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (values) => {
    setServerError('');
    try {
      await login(values, location.state?.from || '/dashboard');
    } catch (err) {
      setServerError(errorMessage(err));
    }
  };

  return (
    <AuthShell title="আবার স্বাগতম 👋" subtitle="তোমার অ্যাকাউন্টে লগইন করো">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {serverError && <div className="alert alert-error alert-soft text-sm">{serverError}</div>}
        <label className="block">
          <span className="mb-1 block text-sm font-medium">ইমেইল</span>
          <input type="email" autoComplete="email" className="input w-full" placeholder="you@example.com" {...register('email')} />
          <FieldError error={errors.email} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">পাসওয়ার্ড</span>
          <div className="input w-full">
            <input type={showPw ? 'text' : 'password'} autoComplete="current-password" className="grow" {...register('password')} />
            <button type="button" onClick={() => setShowPw((v) => !v)} aria-label="পাসওয়ার্ড দেখাও/লুকাও">
              {showPw ? <EyeOff className="size-4 opacity-60" /> : <Eye className="size-4 opacity-60" />}
            </button>
          </div>
          <FieldError error={errors.password} />
        </label>
        <button type="submit" className="btn btn-primary w-full" disabled={isSubmitting}>
          {isSubmitting ? <span className="loading loading-spinner loading-sm" /> : <LogIn className="size-4" />} লগইন
        </button>
        <p className="text-center text-sm text-base-content/70">
          অ্যাকাউন্ট নেই?{' '}
          <Link to="/register" className="link link-primary font-semibold">
            ফ্রি রেজিস্ট্রেশন করো
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
