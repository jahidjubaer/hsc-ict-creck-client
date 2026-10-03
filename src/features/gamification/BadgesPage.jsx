import clsx from 'clsx';
import { Medal } from 'lucide-react';
import { QueryError } from '@/components/ui/QueryError';
import { BadgeIcon } from '@/components/ui/BadgeIcon';
import { bnDate, toBn } from '@/lib/bn';
import { useBadges } from './queries';

const GROUPS = [
  { key: 'streak', title: 'ধারাবাহিকতা' },
  { key: 'learn', title: 'পড়াশোনা' },
  { key: 'exam', title: 'পরীক্ষা' },
  { key: 'chapter', title: 'অধ্যায় মাস্টার' },
  { key: 'xp', title: 'XP' },
  { key: 'habit', title: 'অভ্যাস' },
];

function BadgeCard({ b }) {
  const earned = Boolean(b.earnedAt);
  const pct = Math.round((b.progress / b.target) * 100);
  return (
    <li className={clsx('card-soft flex items-center gap-3 p-4', !earned && 'bg-base-100/60')}>
      <BadgeIcon icon={b.icon} tier={b.tier} earned={earned} />
      <div className="min-w-0 flex-1">
        <p className={clsx('font-semibold', !earned && 'text-base-content/70')}>{b.title}</p>
        <p className="text-sm text-base-content/60">{b.desc}</p>
        {earned ? (
          <p className="mt-1 text-xs text-success">অর্জিত · {bnDate(b.earnedAt)}</p>
        ) : b.target > 1 ? (
          <div className="mt-1.5 flex items-center gap-2">
            <progress className="progress progress-primary h-1.5 flex-1" value={pct} max={100} />
            <span className="text-xs text-base-content/60">
              {toBn(b.progress)}/{toBn(b.target)}
            </span>
          </div>
        ) : null}
      </div>
    </li>
  );
}

export default function BadgesPage() {
  const { data, isLoading, error, refetch } = useBadges();
  if (isLoading) return <div className="skeleton h-96 rounded-box" />;
  if (error) return <QueryError error={error} onRetry={refetch} />;
  const earned = data.filter((b) => b.earnedAt).length;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end gap-4">
        <div className="flex-1">
          <h1 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl">
            <Medal className="size-7 text-amber-500" /> ব্যাজ
          </h1>
          <p className="mt-1 text-base-content/70">পড়া, পরীক্ষা আর ধারাবাহিকতার জন্য ব্যাজ জেতো।</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold">
            {toBn(earned)}
            <span className="text-lg text-base-content/50">/{toBn(data.length)}</span>
          </p>
          <progress className="progress progress-warning h-2 w-40" value={earned} max={data.length} />
        </div>
      </header>
      {GROUPS.map((g) => {
        const list = data.filter((b) => b.group === g.key).sort((a, b) => Boolean(b.earnedAt) - Boolean(a.earnedAt));
        if (!list.length) return null;
        return (
          <section key={g.key}>
            <h2 className="mb-3 text-lg font-bold">{g.title}</h2>
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {list.map((b) => (
                <BadgeCard key={b.key} b={b} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
