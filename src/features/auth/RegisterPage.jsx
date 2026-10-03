import { useState } from 'react';
import { Link } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sparkles } from 'lucide-react';
import { AuthShell, FieldError } from './AuthShell';
import { useAuthActions } from './useAuthActions';
import { errorMessage } from '@/lib/api';
import { toBn } from '@/lib/bn';

const thisYear = new Date().getFullYear();
const HSC_YEARS = [thisYear, thisYear + 1, thisYear + 2];

const schema = z.object({
  name: z.string().trim().min(2, 'নাম কমপক্ষে ২ অক্ষরের হতে হবে'),
  email: z.email('সঠিক ইমেইল দাও'),
  password: z.string().min(8, 'পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে'),
  college: z.string().trim().max(120).optional(),
  hscYear: z.coerce.number().optional(),
});

export default function RegisterPage() {
  const { register: signUp } = useAuthActions();
  const [serverError, setServerError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { hscYear: thisYear + 1 } });

  const onSubmit = async (values) => {
    setServerError('');
    try {
      await signUp(values);
    } catch (err) {
      setServerError(errorMessage(err));
    }
  };

  return (
    <AuthShell title="ফ্রি অ্যাকাউন্ট খোলো" subtitle="১৫ দিন সব ফিচার ফ্রি — কোনো পেমেন্ট লাগবে না">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {serverError && <div className="alert alert-error alert-soft text-sm">{serverError}</div>}
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
        <div className="grid grid-cols-5 gap-3">
          <label className="col-span-3 block">
            <span className="mb-1 block text-sm font-medium">কলেজ (ঐচ্ছিক)</span>
            <input className="input w-full" placeholder="কলেজের নাম" {...register('college')} />
          </label>
          <label className="col-span-2 block">
            <span className="mb-1 block text-sm font-medium">HSC সাল</span>
            <select className="select w-full" {...register('hscYear')}>
              {HSC_YEARS.map((y) => (
                <option key={y} value={y}>
                  {toBn(y)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button type="submit" className="btn btn-primary w-full" disabled={isSubmitting}>
          {isSubmitting ? <span className="loading loading-spinner loading-sm" /> : <Sparkles className="size-4" />} ফ্রি ট্রায়াল শুরু করো
        </button>
        <p className="text-center text-sm text-base-content/70">
          আগেই অ্যাকাউন্ট আছে?{' '}
          <Link to="/login" className="link link-primary font-semibold">
            লগইন করো
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
