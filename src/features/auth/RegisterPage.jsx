import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sparkles } from 'lucide-react';
import { AuthShell, FieldError } from './AuthShell';
import { useAuthActions } from './useAuthActions';
import { GoogleButton } from './GoogleButton';
import { errorMessage } from '@/lib/api';

const schema = z.object({
  name: z.string().trim().min(2, 'নাম কমপক্ষে ২ অক্ষরের হতে হবে'),
  email: z.email('সঠিক ইমেইল দাও'),
  password: z.string().min(8, 'পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে'),
});

export default function RegisterPage() {
  const { register: signUp } = useAuthActions();
  const location = useLocation();
  const [serverError, setServerError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (values) => {
    setServerError('');
    try {
      await signUp(values, location.state?.from || '/dashboard');
    } catch (err) {
      setServerError(errorMessage(err));
    }
  };

  return (
    <AuthShell title="ফ্রি অ্যাকাউন্ট খোলো" subtitle="১৫ দিন সব ফিচার ফ্রি — কোনো পেমেন্ট লাগবে না">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {serverError && <div className="alert alert-error alert-soft text-sm">{serverError}</div>}
        <GoogleButton redirectTo={location.state?.from || '/dashboard'} onError={setServerError} />
        <label className="block">
          <span className="mb-1 block text-sm font-medium">তোমার নাম</span>
          <input autoComplete="name" className="input w-full" placeholder="যেমন: সাদিয়া রহমান" {...register('name')} />
          <FieldError error={errors.name} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">ইমেইল</span>
          <input type="email" autoComplete="email" className="input w-full" placeholder="you@example.com" {...register('email')} />
          <FieldError error={errors.email} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">পাসওয়ার্ড</span>
          <input type="password" autoComplete="new-password" className="input w-full" placeholder="কমপক্ষে ৮ অক্ষর" {...register('password')} />
          <FieldError error={errors.password} />
        </label>
        <p className="text-xs text-base-content/60">কলেজ, HSC সাল ও মোবাইল পরে প্রোফাইল থেকে দিতে পারবে।</p>
        <button type="submit" className="btn btn-primary w-full" disabled={isSubmitting}>
          {isSubmitting ? <span className="loading loading-spinner loading-sm" /> : <Sparkles className="size-4" />} ফ্রি ট্রায়াল শুরু করো
        </button>
        <p className="text-center text-sm text-base-content/70">
          আগেই অ্যাকাউন্ট আছে?{' '}
          <Link to="/login" state={location.state} className="link link-primary font-semibold">
            লগইন করো
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
