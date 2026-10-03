import { useState } from 'react';
import { Link } from 'react-router';
import clsx from 'clsx';
import { Crown, EyeOff, Flame, Trophy } from 'lucide-react';
import { QueryError } from '@/components/ui/QueryError';
import { useAuthStore } from '@/store/auth';
import { bnNumber, daysLeft, toBn } from '@/lib/bn';
import { useLeaderboard } from './queries';

const PERIODS = [
  { value: 'week', label: 'এই সপ্তাহ' },
  { value: 'all', label: 'সর্বকালের' },
];
const SCOPES = [
  { value: 'all', label: 'সবাই' },
  { value: 'college', label: 'আমার কলেজ' },
  { value: 'district', label: 'আমার জেলা' },
];
const MEDAL = ['text-yellow-500', 'text-slate-400', 'text-amber-700'];

function Tabs({ value, options, onChange, label }) {
  return (
    <div role="tablist" aria-label={label} className="tabs tabs-box tabs-sm">
      {options.map((o) => (
        <button key={o.value} role="tab" type="button" className={clsx('tab', value === o.value && 'tab-active')} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Row({ e }) {
  return (
    <li className={clsx('flex items-center gap-3 px-4 py-3', e.me && 'bg-primary/10')}>
      <span className="w-8 text-center font-bold">
        {e.rank <= 3 ? <Crown className={`mx-auto size-5 ${MEDAL[e.rank - 1]}`} aria-label={`${toBn(e.rank)} নম্বর`} /> : toBn(e.rank)}
      </span>
      <div className="avatar avatar-placeholder">
        <div className="w-9 rounded-full bg-gradient-to-br from-primary to-secondary text-primary-content">
          <span className="text-sm font-semibold">{e.name[0]}</span>
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">
          {e.name} {e.me && <span className="badge badge-primary badge-xs align-middle">তুমি</span>}
        </p>
        <p className="truncate text-xs text-base-content/60">
          লেভেল {toBn(e.level)}
          {e.college ? ` · ${e.college}` : e.district ? ` · ${e.district}` : ''}
        </p>
      </div>
      {e.streak > 0 && (
        <span className="hidden items-center gap-0.5 text-sm text-orange-500 sm:flex">
          <Flame className="size-4" /> {toBn(e.streak)}
        </span>
      )}
      <span className="w-20 text-right font-bold text-primary">{bnNumber(e.score)} XP</span>
    </li>
  );
}

export default function LeaderboardPage() {
  const user = useAuthStore((s) => s.user);
  const [period, setPeriod] = useState('week');
  const [scope, setScope] = useState('all');
  const { data, isLoading, error, refetch, isFetching } = useLeaderboard({ period, scope });

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl">
          <Trophy className="size-7 text-amber-500" /> লিডারবোর্ড
        </h1>
        <p className="mt-1 text-base-content/70">
          {period === 'week' && data?.weekEndsAt
            ? `সাপ্তাহিক XP প্রতি সোমবার নতুন করে শুরু হয় — আর ${toBn(daysLeft(data.weekEndsAt))} দিন বাকি।`
            : 'শুরু থেকে এ পর্যন্ত মোট XP।'}
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <Tabs value={period} options={PERIODS} onChange={setPeriod} label="সময়" />
        <Tabs value={scope} options={SCOPES} onChange={setScope} label="কাদের মধ্যে" />
      </div>

      {data?.me && !data.needsProfile && (
        <div className="card-soft flex items-center gap-3 p-4">
          {data.me.hidden ? (
            <>
              <EyeOff className="size-5 text-base-content/50" />
              <p className="text-sm">
                তুমি লিডারবোর্ডে লুকানো আছ।{' '}
                <Link to="/profile" className="link link-primary">
                  প্রোফাইল থেকে চালু করো
                </Link>
              </p>
            </>
          ) : (
            <>
              <span className="text-3xl font-bold text-primary">{data.me.rank ? `#${toBn(data.me.rank)}` : '—'}</span>
              <p className="text-sm text-base-content/70">
                {data.me.rank
                  ? `${bnNumber(data.total)} জনের মধ্যে তোমার অবস্থান · ${bnNumber(data.me.score)} XP`
                  : period === 'week'
                    ? 'এই সপ্তাহে এখনো XP নেই — একটা টপিক শেষ করো বা কুইজ দাও!'
                    : 'XP অর্জন করলে এখানে তোমার অবস্থান দেখাবে।'}
              </p>
            </>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="skeleton h-80 rounded-box" />
      ) : error ? (
        <QueryError error={error} onRetry={refetch} />
      ) : data.needsProfile ? (
        <div className="card-soft p-8 text-center">
          <p>
            {data.needsProfile === 'college' ? 'কলেজের' : 'জেলার'} লিডারবোর্ড দেখতে প্রোফাইলে তোমার {data.needsProfile === 'college' ? 'কলেজের নাম' : 'জেলা'}{' '}
            লেখো।
          </p>
          <Link to="/profile" className="btn btn-primary btn-sm mt-4">
            প্রোফাইলে যাও
          </Link>
        </div>
      ) : data.entries.length === 0 ? (
        <p className="card-soft p-8 text-center text-base-content/60">
          {period === 'week' ? 'এই সপ্তাহে এখনো কেউ XP পায়নি — প্রথম হওয়ার সুযোগ তোমার!' : 'এখনো কেউ নেই।'}
        </p>
      ) : (
        <>
          {scope !== 'all' && data.scopeValue && <p className="text-sm text-base-content/60">{data.scopeValue}</p>}
          <ol className={clsx('card-soft divide-y divide-base-300 overflow-hidden transition', isFetching && 'opacity-60')}>
            {data.entries.map((e) => (
              <Row key={e.id} e={{ ...e, me: e.me || e.id === user.id }} />
            ))}
          </ol>
        </>
      )}
    </div>
  );
}
