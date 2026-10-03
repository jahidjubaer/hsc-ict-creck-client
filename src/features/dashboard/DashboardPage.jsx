import { useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { confetti } from '@/lib/confetti';
import { ArrowRight, BookOpen, Bookmark, CalendarDays, Medal, PlayCircle, Target, Trophy } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { ChapterIcon } from '@/components/ui/ChapterIcon';
import { bnDate, toBn } from '@/lib/bn';
import { useProgressSummary } from '@/features/learn/queries';
import { BadgeIcon } from '@/components/ui/BadgeIcon';
import { ActivityHeatmap } from '@/features/gamification/ActivityHeatmap';
import { LevelCard, StreakCard, Tile } from '@/features/gamification/cards';
import { useActivity, useBadges, useLeaderboard } from '@/features/gamification/queries';
import { TodayPlanCard } from '@/features/plan/TodayPlanCard';

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'রাত জেগে পড়ছো';
  if (h < 12) return 'শুভ সকাল';
  if (h < 17) return 'শুভ অপরাহ্ন';
  return 'শুভ সন্ধ্যা';
}

/** Latest earned badges, or the closest ones to earn when none yet. */
function BadgesCard() {
  const { data } = useBadges();
  if (!data) return <div className="card-soft skeleton h-40" />;
  const earned = data.filter((b) => b.earnedAt).sort((a, b) => new Date(b.earnedAt) - new Date(a.earnedAt));
  const next = data
    .filter((b) => !b.earnedAt)
    .sort((a, b) => b.progress / b.target - a.progress / a.target)
    .slice(0, 3);
  const list = earned.length ? earned.slice(0, 4) : next;
  return (
    <div className="card-soft p-5">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-bold">
          <Medal className="size-4 text-amber-500" /> ব্যাজ · {toBn(earned.length)}/{toBn(data.length)}
        </h2>
        <Link to="/badges" className="btn btn-ghost btn-xs">
          সব <ArrowRight className="size-3.5" />
        </Link>
      </div>
      {!earned.length && <p className="mt-1 text-xs text-base-content/60">সবচেয়ে কাছের ব্যাজগুলো:</p>}
      <ul className="mt-3 space-y-2.5">
        {list.map((b) => (
          <li key={b.key} className="flex items-center gap-3">
            <BadgeIcon icon={b.icon} tier={b.tier} earned={Boolean(b.earnedAt)} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{b.title}</p>
              <p className="truncate text-xs text-base-content/60">
                {b.earnedAt ? b.desc : `${b.desc} · ${toBn(b.progress)}/${toBn(b.target)}`}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RankCard() {
  const { data } = useLeaderboard({ period: 'week', scope: 'all' });
  const me = data?.me;
  return (
    <Tile
      to="/leaderboard"
      icon={Trophy}
      tone="bg-amber-500/10 text-amber-500"
      label="সাপ্তাহিক র‍্যাংক"
      value={me?.rank ? `#${toBn(me.rank)}` : 'এখনো নেই'}
      note={me?.score ? `এই সপ্তাহে ${toBn(me.score)} XP` : 'পড়ে বা কুইজ দিয়ে XP পেলেই র‍্যাংকে আসবে'}
    />
  );
}

/** Minutes read on each of the last 7 days (plain CSS bars — no chart library on the first screen after login). */
function WeekBars({ data }) {
  const max = Math.max(...data.map((d) => d.minutes), 1);
  return (
    <ul className="flex h-full items-end gap-2" aria-label="গত ৭ দিনে প্রতিদিন কত মিনিট পড়েছ">
      {data.map((d) => (
        <li key={d.day} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1" title={`${d.label}: ${toBn(d.minutes)} মিনিট`}>
          <span className="text-xs font-semibold text-base-content/70">{d.minutes ? toBn(d.minutes) : ''}</span>
          <span
            className="w-full max-w-10 rounded-t-md bg-primary transition-[height] duration-500"
            style={{ height: `${(d.minutes / max) * 100}%`, minHeight: d.minutes ? 4 : 2, opacity: d.minutes ? 1 : 0.25 }}
          />
          <span className="text-xs text-base-content/60">{d.label}</span>
        </li>
      ))}
    </ul>
  );
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const location = useLocation();
  const { data, isLoading } = useProgressSummary();
  const { data: activity } = useActivity(182);

  // Summary carries fresh XP/streak (heartbeats update them server-side).
  useEffect(() => {
    if (data?.user) setUser(data.user);
  }, [data?.user, setUser]);

  useEffect(() => {
    if (location.state?.welcome) {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.3 } });
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  const goal = user.settings?.dailyGoalMinutes ?? 30;
  const todayMin = data?.last7.at(-1)?.minutes ?? 0;
  const goalPct = Math.min(100, Math.round((todayMin / goal) * 100));
  const cont = data?.continueReading?.[0];
  const chart = data?.last7.map((d) => ({ ...d, label: bnDate(`${d.day}T12:00:00+06:00`, { weekday: 'short' }) }));

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-box bg-gradient-to-br from-primary to-secondary p-6 text-primary-content sm:p-8">
        <div className="absolute -top-10 -right-10 size-48 rounded-full bg-white/10" />
        <div className="absolute right-20 -bottom-16 size-40 rounded-full bg-white/10" />
        <p className="relative opacity-90">{greeting()},</p>
        <h1 className="relative text-2xl font-bold sm:text-3xl">{user.name} 👋</h1>
        {cont ? (
          <div className="relative mt-4 max-w-lg rounded-2xl bg-white/15 p-4 backdrop-blur">
            <p className="text-sm opacity-90">যেখানে থেমেছিলে</p>
            <p className="font-semibold">{cont.title}</p>
            <progress className="progress mt-2 h-1.5 w-full [&::-webkit-progress-value]:bg-white" value={cont.readPercent} max={100} />
            <Link to={`/learn/${cont.chapterSlug}/${cont.slug}`} className="btn btn-sm mt-3 border-none bg-white text-primary hover:bg-white/90">
              <PlayCircle className="size-4" /> চালিয়ে যাও
            </Link>
          </div>
        ) : (
          <>
            <p className="relative mt-2 max-w-lg opacity-90">আজ একটা টপিক শেষ করে স্ট্রিক ধরে রাখো। ছোট ছোট পদক্ষেপেই বড় সাফল্য!</p>
            <Link to="/learn" className="btn relative mt-5 border-none bg-white text-primary hover:bg-white/90">
              <BookOpen className="size-4" /> পড়া শুরু করো
            </Link>
          </>
        )}
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StreakCard streak={user.streak} />
        <LevelCard xp={user.xp} levelInfo={user.levelInfo} />
        <Tile
          icon={Target}
          tone="bg-success/10 text-success"
          label="আজকের লক্ষ্য"
          value={`${toBn(todayMin)}/${toBn(goal)} মিনিট`}
          note={goalPct >= 100 ? 'আজকের লক্ষ্য পূরণ ✓' : `আর ${toBn(goal - todayMin)} মিনিট`}
          noteTone={goalPct >= 100 ? 'text-success' : undefined}
        >
          <progress className="progress progress-success mt-2 h-1.5 w-full" value={goalPct} max={100} />
        </Tile>
        <RankCard />
      </section>

      <TodayPlanCard />

      <section className="card-soft p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 font-bold">
            <CalendarDays className="size-4 text-primary" /> গত ৬ মাসের পড়া
          </h2>
          {activity && (
            <p className="text-xs text-base-content/60">
              {toBn(activity.totals.activeDays)} দিন পড়েছ · মোট{' '}
              {activity.totals.minutes >= 60 ? `${toBn(Math.round(activity.totals.minutes / 60))} ঘণ্টা` : `${toBn(activity.totals.minutes)} মিনিট`}
            </p>
          )}
        </div>
        {activity ? (
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="min-w-0 lg:flex-1">
              <ActivityHeatmap days={activity.days} goal={activity.goalMinutes} />
            </div>
            <dl className="grid grid-cols-3 gap-2 text-center lg:w-56 lg:grid-cols-1 lg:text-left">
              {[
                ['পড়ার দিন', `${toBn(activity.totals.activeDays)} দিন`],
                ['লক্ষ্য পূরণ', `${toBn(activity.days.filter((d) => d.minutes >= activity.goalMinutes).length)} দিন`],
                ['সর্বোচ্চ স্ট্রিক', `${toBn(user.streak?.longest ?? 0)} দিন`],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-base-200/60 px-3 py-2">
                  <dt className="text-xs text-base-content/60">{k}</dt>
                  <dd className="font-bold">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        ) : (
          <div className="skeleton h-32" />
        )}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <section className="lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">অধ্যায়ভিত্তিক অগ্রগতি</h2>
            <Link to="/learn" className="btn btn-ghost btn-sm">
              সব দেখো <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="card-soft divide-y divide-base-300">
            {isLoading &&
              Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="p-4">
                  <div className="skeleton h-10" />
                </div>
              ))}
            {data?.chapters.map((ch) => {
              const pct = ch.total ? Math.round((ch.completed / ch.total) * 100) : 0;
              return (
                <Link key={ch.slug} to={`/learn/${ch.slug}`} className="flex items-center gap-4 p-4 transition hover:bg-base-200/50">
                  <span className={`grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${ch.color} text-white`}>
                    <ChapterIcon name={ch.icon} className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {toBn(ch.number)}. {ch.title}
                    </p>
                    <progress className="progress progress-primary mt-1.5 h-1.5" value={pct} max={100} />
                  </div>
                  <span className="w-12 text-right text-sm font-semibold">{toBn(pct)}%</span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="space-y-6 lg:col-span-2">
          <div className="card-soft p-5">
            <h2 className="font-bold">গত ৭ দিন (মিনিট)</h2>
            <div className="mt-3 h-40">
              {chart &&
                (chart.some((d) => d.minutes) ? (
                  <WeekBars data={chart} />
                ) : (
                  <div className="grid h-full place-items-center rounded-xl border border-dashed border-base-300 p-4 text-center text-sm text-base-content/60">
                    এই সপ্তাহে এখনো পড়া হয়নি — একটা টপিক পড়লেই এখানে প্রতিদিনের মিনিট দেখাবে।
                  </div>
                ))}
            </div>
          </div>

          <BadgesCard />

          <div className="card-soft p-5">
            <h2 className="flex items-center gap-2 font-bold">
              <Bookmark className="size-4 text-primary" /> বুকমার্ক
            </h2>
            {data?.bookmarks.length ? (
              <ul className="mt-3 space-y-1">
                {data.bookmarks.slice(0, 5).map((b) => (
                  <li key={`${b.chapterSlug}/${b.slug}`}>
                    <Link to={`/learn/${b.chapterSlug}/${b.slug}`} className="link-hover link block truncate text-sm">
                      অ{toBn(b.chapterNumber)} · {b.title}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-base-content/60">গুরুত্বপূর্ণ টপিক বুকমার্ক করে রাখলে এখানে দেখাবে।</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
