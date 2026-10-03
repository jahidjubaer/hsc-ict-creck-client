import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Crown, Save } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Link } from 'react-router';
import { bnDate, daysLeft, toBn } from '@/lib/bn';
import { PaymentHistory } from '@/features/subscription/PaymentHistory';

const ACCESS_LABEL = { trial: 'ফ্রি ট্রায়াল', premium: 'প্রিমিয়াম', admin: 'অ্যাডমিন', expired: 'মেয়াদ শেষ' };

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, isDirty },
    reset,
  } = useForm({
    defaultValues: {
      name: user.name,
      phone: user.phone ?? '',
      college: user.college ?? '',
      district: user.district ?? '',
      dailyGoalMinutes: user.settings?.dailyGoalMinutes ?? 30,
      showOnLeaderboard: user.settings?.showOnLeaderboard ?? true,
    },
  });

  const onSubmit = async ({ dailyGoalMinutes, showOnLeaderboard, ...rest }) => {
    try {
      const { data } = await api.patch('/auth/me', { ...rest, settings: { dailyGoalMinutes: Number(dailyGoalMinutes), showOnLeaderboard } });
      setUser(data.user);
      reset({ ...rest, dailyGoalMinutes, showOnLeaderboard });
      toast.success('প্রোফাইল আপডেট হয়েছে');
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const { access } = user;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <aside className="card-soft h-fit p-6 text-center">
        <div className="avatar avatar-placeholder">
          <div className="w-20 rounded-full bg-gradient-to-br from-primary to-secondary text-primary-content">
            <span className="text-3xl font-bold">{user.name[0]}</span>
          </div>
        </div>
        <h1 className="mt-3 text-xl font-bold">{user.name}</h1>
        <p className="text-sm text-base-content/60">{user.email}</p>
        <div className="divider" />
        <p className="text-sm text-base-content/60">সদস্যপদ</p>
        <p className="text-lg font-semibold">{ACCESS_LABEL[access.kind]}</p>
        {access.endsAt && (
          <p className="text-sm text-base-content/60">
            মেয়াদ: {bnDate(access.endsAt)} ({toBn(daysLeft(access.endsAt))} দিন বাকি)
          </p>
        )}
        {access.kind !== 'admin' && (
          <Link to="/subscribe" className="btn btn-primary btn-sm mt-4">
            <Crown className="size-4" /> {access.kind === 'premium' ? 'মেয়াদ বাড়াও' : 'প্রিমিয়াম নাও'}
          </Link>
        )}
      </aside>

      <form onSubmit={handleSubmit(onSubmit)} className="card-soft space-y-4 p-6 lg:col-span-2">
        <h2 className="text-lg font-bold">প্রোফাইল তথ্য</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">নাম</span>
            <input className="input w-full" {...register('name', { required: true, minLength: 2 })} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">মোবাইল</span>
            <input className="input w-full" inputMode="tel" placeholder="01XXXXXXXXX" {...register('phone')} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">কলেজ</span>
            <input className="input w-full" {...register('college')} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">জেলা</span>
            <input className="input w-full" {...register('district')} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">দৈনিক পড়ার লক্ষ্য (মিনিট)</span>
            <select className="select w-full" {...register('dailyGoalMinutes')}>
              {[15, 30, 45, 60, 90, 120].map((m) => (
                <option key={m} value={m}>
                  {toBn(m)} মিনিট
                </option>
              ))}
            </select>
          </label>
          <label className="flex cursor-pointer items-center gap-3 self-end pb-2 sm:col-span-2">
            <input type="checkbox" className="toggle toggle-primary toggle-sm" {...register('showOnLeaderboard')} />
            <span className="text-sm">লিডারবোর্ডে আমার নাম দেখাও (কলেজ ও জেলাও দেখা যাবে)</span>
          </label>
        </div>
        <button className="btn btn-primary" disabled={isSubmitting || !isDirty}>
          {isSubmitting ? <span className="loading loading-spinner loading-sm" /> : <Save className="size-4" />} সংরক্ষণ করো
        </button>
      </form>

      {access.kind !== 'admin' && (
        <div className="lg:col-span-2 lg:col-start-2">
          <PaymentHistory />
        </div>
      )}
    </div>
  );
}
