import { Link } from 'react-router';
import { Flame, Snowflake, Trophy } from 'lucide-react';
import clsx from 'clsx';
import { bnNumber, toBn } from '@/lib/bn';

/**
 * Compact dashboard tile: icon + label, big value, optional bar, one short line.
 * Four of them sit 2×2 on phones and in one row on desktop. `to` makes the whole tile a link.
 */
export function Tile({ icon: Icon, tone, label, value, aside, note, noteTone, to, children }) {
  const body = (
    <>
      <div className="flex items-center gap-2">
        <span className={clsx('grid size-9 shrink-0 place-items-center rounded-xl', tone)}>
          <Icon className="size-[18px]" />
        </span>
        <p className="min-w-0 flex-1 text-xs leading-tight text-base-content/60">{label}</p>
        {aside}
      </div>
      <p className="mt-2 text-xl leading-tight font-bold">{value}</p>
      {children}
      {note && <p className={clsx('mt-1.5 text-xs leading-snug', noteTone ?? 'text-base-content/60')}>{note}</p>}
    </>
  );
  const cls = 'card-soft flex flex-col p-4';
  return to ? (
    <Link to={to} className={clsx(cls, 'transition hover:border-primary/40')}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/** Level number, title and progress to the next level. */
export function LevelCard({ xp, levelInfo }) {
  const { level, title, from, to } = levelInfo;
  const pct = Math.round(((xp - from) / (to - from)) * 100);
  return (
    <Tile icon={Trophy} tone="bg-gradient-to-br from-amber-400 to-orange-500 text-white" label={`লেভেল ${toBn(level)}`} value={title} note={`পরের লেভেলে আর ${bnNumber(to - xp)} XP`}>
      <progress className="progress progress-warning mt-2 h-1.5 w-full" value={pct} max={100} aria-label="পরের লেভেলের অগ্রগতি" />
    </Tile>
  );
}

/** Current streak, whether today is done, saved freezes and the longest streak. */
export function StreakCard({ streak }) {
  const { current, longest, freezes, todayDone, atRisk } = streak;
  return (
    <Tile
      icon={Flame}
      tone={todayDone ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white' : 'bg-orange-500/10 text-orange-500'}
      label="টানা পড়া"
      value={`${toBn(current)} দিন`}
      aside={
        <span
          className="tooltip tooltip-left badge badge-sm gap-1 border-sky-400/40 bg-sky-400/10 text-sky-600"
          data-tip="টানা ৭ দিন পড়লে ১টি ফ্রিজ পাবে (সর্বোচ্চ ২টি); একদিন বাদ পড়লে ফ্রিজ স্ট্রিক বাঁচায়"
        >
          <Snowflake className="size-3" /> {toBn(freezes)}
        </span>
      }
      note={todayDone ? 'আজকের স্ট্রিক হয়ে গেছে ✓' : atRisk ? 'আজ ১ মিনিট পড়লেই স্ট্রিক বাঁচবে!' : `আজ পড়া শুরু করো · সর্বোচ্চ ${toBn(longest)} দিন`}
      noteTone={todayDone ? 'text-success' : atRisk ? 'text-warning' : undefined}
    />
  );
}
