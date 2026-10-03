import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { KeyRound } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

/** Change the password — or, for an account made with Google, set one so email login works too. */
export function PasswordCard() {
  const user = useAuthStore((s) => s.user);
  const setSession = useAuthStore((s) => s.setSession);
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = useForm({ defaultValues: { currentPassword: '', newPassword: '', confirm: '' } });

  const onSubmit = async ({ currentPassword, newPassword }) => {
    try {
      const { data } = await api.post('/auth/change-password', { currentPassword: user.hasPassword ? currentPassword : undefined, newPassword });
      setSession(data); // other devices are signed out; this one gets a fresh session
      reset();
      toast.success(user.hasPassword ? 'পাসওয়ার্ড বদলানো হয়েছে' : 'পাসওয়ার্ড সেট হয়েছে — এখন ইমেইল দিয়েও লগইন করতে পারবে');
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card-soft space-y-4 p-6">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <KeyRound className="size-5 text-primary" /> {user.hasPassword ? 'পাসওয়ার্ড বদলাও' : 'পাসওয়ার্ড সেট করো'}
        </h2>
        <p className="text-sm text-base-content/60">
          {user.hasPassword
            ? 'বদলালে অন্য সব ডিভাইস থেকে লগআউট হয়ে যাবে।'
            : 'তুমি Google দিয়ে অ্যাকাউন্ট খুলেছ। পাসওয়ার্ড সেট করলে ইমেইল দিয়েও লগইন করতে পারবে।'}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {user.hasPassword && (
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-sm font-medium">বর্তমান পাসওয়ার্ড</span>
            <input type="password" autoComplete="current-password" className="input w-full" {...register('currentPassword', { required: true })} />
          </label>
        )}
        <label className="block">
          <span className="mb-1 block text-sm font-medium">নতুন পাসওয়ার্ড</span>
          <input
            type="password"
            autoComplete="new-password"
            className="input w-full"
            placeholder="কমপক্ষে ৮ অক্ষর"
            {...register('newPassword', { minLength: { value: 8, message: 'কমপক্ষে ৮ অক্ষর দাও' }, required: 'নতুন পাসওয়ার্ড দাও' })}
          />
          {errors.newPassword && <span className="mt-1 block text-xs text-error">{errors.newPassword.message}</span>}
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">আবার লেখো</span>
          <input
            type="password"
            autoComplete="new-password"
            className="input w-full"
            {...register('confirm', { validate: (v, all) => v === all.newPassword || 'দুটো পাসওয়ার্ড মেলেনি' })}
          />
          {errors.confirm && <span className="mt-1 block text-xs text-error">{errors.confirm.message}</span>}
        </label>
      </div>
      <button className="btn btn-outline btn-primary" disabled={isSubmitting}>
        {isSubmitting ? <span className="loading loading-spinner loading-sm" /> : <KeyRound className="size-4" />}{' '}
        {user.hasPassword ? 'পাসওয়ার্ড বদলাও' : 'পাসওয়ার্ড সেট করো'}
      </button>
    </form>
  );
}
