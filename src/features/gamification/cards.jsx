import { Flame, Snowflake, Trophy } from 'lucide-react';
import clsx from 'clsx';
import { bnNumber, toBn } from '@/lib/bn';

/** Level number, title and progress to the next level. */
export function LevelCard({ xp, levelInfo }) {
  const { level, title, from, to } = levelInfo;
  const pct = Math.round(((xp - from) / (to - from)) * 100);
  return (
    <div className="card-soft p-5">
      <div className="flex items-center gap-3">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-lg font-bold text-white">
          {toBn(level)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-base-content/60">লেভেল {toBn(level)}</p>
          <p className="text-lg font-bold">{title}</p>
        </div>
        <Trophy className="size-5 text-amber-500" />
      </div>
      <progress className="progress progress-warning mt-4 h-2 w-full" value={pct} max={100} aria-label="পরের লেভেলের অগ্রগতি" />
      <p className="mt-1 text-xs text-base-content/60">
        {bnNumber(xp)} XP · পরের লেভেলে আর <b>{bnNumber(to - xp)} XP</b>
      </p>
    </div>
  );
}

/** Current streak, whether today is done, saved freezes and the longest streak. */
export function StreakCard({ streak }) {
  const { current, longest, freezes, todayDone, atRisk } = streak;
  return (
    <div className="card-soft p-5">
      <div className="flex items-center gap-3">
        <span
          className={clsx(
            'grid size-12 shrink-0 place-items-center rounded-2xl',
            todayDone ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white' : 'bg-orange-500/10 text-orange-500'
          )}
        >
          <Flame className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-base-content/60">টানা পড়া</p>
          <p className="text-lg font-bold">{toBn(current)} দিন</p>
        </div>
        <div className="tooltip tooltip-left" data-tip="টানা ৭ দিন পড়লে ১টি ফ্রিজ পাবে (সর্বোচ্চ ২টি); একদিন বাদ পড়লে ফ্রিজ স্ট্রিক বাঁচায়">
          <span className="badge gap-1 border-sky-400/40 bg-sky-400/10 text-sky-600">
            <Snowflake className="size-3.5" /> {toBn(freezes)}
          </span>
        </div>
      </div>
      <p className={clsx('mt-3 text-sm', todayDone ? 'text-success' : atRisk ? 'text-warning' : 'text-base-content/70')}>
        {todayDone
          ? 'আজকের স্ট্রিক হয়ে গেছে ✓'
          : atRisk
            ? 'আজ এখনো পড়া হয়নি — ১ মিনিট পড়লেই স্ট্রিক বাঁচবে!'
            : 'আজ পড়া শুরু করে নতুন স্ট্রিক গড়ো।'}
      </p>
      <p className="mt-1 text-xs text-base-content/55">সর্বোচ্চ: {toBn(longest)} দিন</p>
    </div>
  );
}
