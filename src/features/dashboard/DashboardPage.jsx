import { useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import confetti from 'canvas-confetti';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { ArrowRight, BookOpen, Bookmark, CalendarDays, Medal, PlayCircle, Target, Trophy } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { ChapterIcon } from '@/components/ui/ChapterIcon';
import { bnDate, toBn } from '@/lib/bn';
import { useProgressSummary } from '@/features/learn/queries';
import { BadgeIcon } from '@/components/ui/BadgeIcon';
import { ActivityHeatmap } from '@/features/gamification/ActivityHeatmap';
import { LevelCard, StreakCard } from '@/features/gamification/cards';
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
  const rank = data?.me?.rank;
  return (
    <Link to="/leaderboard" className="card-soft flex items-center gap-3 p-4 transition hover:border-primary/40">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-amber-500/10 text-amber-500">
        <Trophy className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-base-content/60">এই সপ্তাহের লিডারবোর্ড</p>
        <p className="text-lg font-bold">{rank ? `#${toBn(rank)}` : '—'}</p>
      </div>
      <span className="text-xs text-base-content/60">{data?.me?.score ? `${toBn(data.me.score)} XP` : ''}</span>
    </Link>
  );
}

function StatCard({ icon: Icon, label, value, tone, children }) {
  return (
    <div className="card-soft flex items-center gap-3 p-4">
      <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${tone}`}>
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-base-content/60">{label}</p>
        <p className="text-lg font-bold">{value}</p>
        {children}
      </div>
    </div>
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

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StreakCard streak={user.streak} />
        <LevelCard xp={user.xp} levelInfo={user.levelInfo} />
        <div className="grid gap-4 sm:col-span-2 sm:grid-cols-2 lg:col-span-1 lg:grid-cols-1">
          <StatCard icon={Target} label="আজকের লক্ষ্য" value={`${toBn(todayMin)}/${toBn(goal)} মিনিট`} tone="text-success bg-success/10">
            <progress className="progress progress-success mt-1 h-1.5" value={goalPct} max={100} />
          </StatCard>
          <RankCard />
        </div>
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
        {activity ? <ActivityHeatmap days={activity.days} goal={activity.goalMinutes} /> : <div className="skeleton h-32" />}
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
              {chart && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chart}>
                    <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                    <Tooltip
                      cursor={{ fill: 'color-mix(in oklch, var(--color-primary) 10%, transparent)' }}
                      formatter={(v) => [`${toBn(v)} মিনিট`, 'পড়া']}
                      labelFormatter={() => ''}
                      contentStyle={{ borderRadius: 12, border: 'none', background: 'var(--color-base-100)' }}
                    />
                    <Bar dataKey="minutes" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
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
