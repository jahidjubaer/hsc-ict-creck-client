import { Link } from 'react-router';
import { ArrowRight, CalendarCheck, Coffee } from 'lucide-react';
import { toBn } from '@/lib/bn';
import { TaskItem } from './TaskItem';
import { usePlan } from './queries';

/** Dashboard: today's study-plan tasks, or an invitation to make a plan. */
export function TodayPlanCard() {
  const { data } = usePlan();
  if (!data) return <div className="card-soft skeleton h-40" />;

  if (!data.plan) {
    return (
      <Link to="/plan" className="card-soft flex items-center gap-4 p-5 transition hover:border-primary/40">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
          <CalendarCheck className="size-6" />
        </span>
        <div className="flex-1">
          <p className="font-bold">স্টাডি প্ল্যান বানাও</p>
          <p className="text-sm text-base-content/70">পরীক্ষার তারিখ দাও — প্রতিদিন কী পড়বে সাজিয়ে দেব।</p>
        </div>
        <ArrowRight className="size-5 text-base-content/40" />
      </Link>
    );
  }

  const { todayPlan, stats } = data;
  const done = todayPlan?.tasks.filter((t) => t.done).length ?? 0;
  return (
    <section className="card-soft p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-bold">
          <CalendarCheck className="size-4 text-primary" /> আজকের প্ল্যান
          {todayPlan && (
            <span className="badge badge-ghost badge-sm">
              {toBn(done)}/{toBn(todayPlan.tasks.length)}
            </span>
          )}
        </h2>
        <span className="text-xs text-base-content/60">পরীক্ষা আর {toBn(stats.examInDays)} দিন</span>
      </div>
      {todayPlan ? (
        <ul className="mt-1 divide-y divide-base-300">
          {todayPlan.tasks.map((t) => (
            <TaskItem key={t._id} task={t} />
          ))}
        </ul>
      ) : (
        <p className="mt-3 flex items-center gap-2 text-sm text-base-content/70">
          <Coffee className="size-4" /> আজ কোনো কাজ নেই — বিশ্রাম নাও বা এগিয়ে পড়ো।
        </p>
      )}
      {stats.overdueTasks > 0 && <p className="mt-2 text-sm text-error">আগের {toBn(stats.overdueTasks)}টি কাজ বাকি আছে।</p>}
      <Link to="/plan" className="btn btn-ghost btn-sm mt-2">
        পুরো প্ল্যান <ArrowRight className="size-4" />
      </Link>
    </section>
  );
}
