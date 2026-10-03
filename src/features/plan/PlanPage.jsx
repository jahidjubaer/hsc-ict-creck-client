import { useState } from 'react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { BellRing, CalendarCheck, CalendarDays, Coffee, RefreshCw, Settings2, Sparkles, Trash2, TriangleAlert } from 'lucide-react';
import { QueryError } from '@/components/ui/QueryError';
import { errorMessage } from '@/lib/api';
import { bnDate, toBn } from '@/lib/bn';
import { PlanCalendar } from './PlanCalendar';
import { TaskItem } from './TaskItem';
import { downloadCalendar, usePlan, usePlanAction } from './queries';

const MINUTES = [15, 20, 30, 45, 60, 90, 120, 180];
const REST_DAYS = [
  { value: '', label: 'কোনো ছুটি নেই' },
  { value: 5, label: 'শুক্রবার' },
  { value: 6, label: 'শনিবার' },
  { value: 0, label: 'রবিবার' },
  { value: 1, label: 'সোমবার' },
  { value: 2, label: 'মঙ্গলবার' },
  { value: 3, label: 'বুধবার' },
  { value: 4, label: 'বৃহস্পতিবার' },
];
const dhakaToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka' }).format(new Date());
const plusDays = (day, n) => {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const dayLabel = (day, opts) => bnDate(`${day}T12:00:00+06:00`, opts);

function SettingsForm({ initial, submitLabel, onSubmit, busy, onCancel }) {
  const today = dhakaToday();
  const [f, setF] = useState({
    examDate: initial?.examDate ?? '',
    dailyMinutes: initial?.dailyMinutes ?? 30,
    restDay: initial?.restDay ?? '',
    order: initial?.order ?? 'priority',
  });
  const set = (patch) => setF((o) => ({ ...o, ...patch }));
  const submit = (e) => {
    e.preventDefault();
    if (!f.examDate) return toast.error('পরীক্ষার তারিখ দাও');
    onSubmit({ examDate: f.examDate, dailyMinutes: Number(f.dailyMinutes), restDay: f.restDay === '' ? null : Number(f.restDay), order: f.order });
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">পরীক্ষার তারিখ</span>
          <input type="date" className="input w-full" min={plusDays(today, 7)} max={plusDays(today, 400)} value={f.examDate} onChange={(e) => set({ examDate: e.target.value })} required />
          <span className="mt-1 block text-xs text-base-content/55">ICT পরীক্ষার দিন (রুটিন অনুযায়ী)</span>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">প্রতিদিন কত সময় দিতে পারবে</span>
          <select className="select w-full" value={f.dailyMinutes} onChange={(e) => set({ dailyMinutes: e.target.value })}>
            {MINUTES.map((m) => (
              <option key={m} value={m}>
                {m < 60 ? `${toBn(m)} মিনিট` : `${toBn(m / 60)} ঘণ্টা`}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">সাপ্তাহিক ছুটি</span>
          <select className="select w-full" value={f.restDay} onChange={(e) => set({ restDay: e.target.value })}>
            {REST_DAYS.map((r) => (
              <option key={r.label} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <fieldset>
        <legend className="mb-2 text-sm font-medium">কোন ক্রমে পড়বে</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            ['priority', 'গুরুত্বপূর্ণ অধ্যায় আগে', 'অধ্যায় ৩, ৪, ৫, ৬ (বেশি নম্বর) → তারপর ১, ২'],
            ['syllabus', 'বইয়ের ক্রমে', 'অধ্যায় ১ → ৬'],
          ].map(([v, t, d]) => (
            <label key={v} className={clsx('flex cursor-pointer gap-3 rounded-box border-2 p-3', f.order === v ? 'border-primary bg-primary/5' : 'border-base-300')}>
              <input type="radio" name="order" className="radio radio-primary radio-sm mt-0.5" checked={f.order === v} onChange={() => set({ order: v })} />
              <span>
                <span className="block text-sm font-semibold">{t}</span>
                <span className="block text-xs text-base-content/60">{d}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="flex gap-2">
        <button className="btn btn-primary" disabled={busy}>
          {busy ? <span className="loading loading-spinner loading-sm" /> : <Sparkles className="size-4" />} {submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            বাতিল
          </button>
        )}
      </div>
    </form>
  );
}

function Setup() {
  const action = usePlanAction();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="text-center">
        <CalendarCheck className="mx-auto size-12 text-primary" />
        <h1 className="mt-3 text-2xl font-bold sm:text-3xl">তোমার স্টাডি প্ল্যান</h1>
        <p className="mt-2 text-base-content/70">
          পরীক্ষার তারিখ আর প্রতিদিনের সময় দাও — প্রতিদিন কী পড়বে, কবে কুইজ, কবে অধ্যায় পরীক্ষা আর শেষে রিভিশন ও মডেল টেস্ট, সব সাজিয়ে দেব।
        </p>
      </header>
      <section className="card-soft p-5 sm:p-6">
        <SettingsForm submitLabel="প্ল্যান বানাও" busy={action.isPending} onSubmit={(body) => action.mutate({ method: 'post', body })} />
      </section>
      <ul className="grid gap-3 text-sm sm:grid-cols-3">
        <li className="card-soft p-4">📖 পড়া শেষ বা কুইজ দিলে কাজ নিজে থেকেই টিক হবে।</li>
        <li className="card-soft p-4">🎯 একদিনের সব কাজ সেদিনই শেষ করলে +১০ XP বোনাস।</li>
        <li className="card-soft p-4">🔁 পিছিয়ে পড়লে এক ক্লিকে বাকি কাজ নতুন করে সাজাও।</li>
      </ul>
    </div>
  );
}

function Reminder() {
  const [time, setTime] = useState('20:00');
  const [busy, setBusy] = useState(false);
  const download = async () => {
    setBusy(true);
    try {
      await downloadCalendar(time);
      toast.success('ফাইলটি খুলে ক্যালেন্ডারে যোগ করো');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="card-soft space-y-3 p-5">
      <h2 className="flex items-center gap-2 font-bold">
        <BellRing className="size-4 text-primary" /> দৈনিক রিমাইন্ডার
      </h2>
      <p className="text-sm text-base-content/70">ফোনের ক্যালেন্ডারে প্রতিদিন পড়ার সময় একটা অ্যালার্ম যোগ হবে (পরীক্ষার আগের দিন পর্যন্ত, ছুটির দিন বাদে)।</p>
      <div className="flex flex-wrap items-center gap-2">
        <input type="time" className="input input-sm w-32" value={time} onChange={(e) => setTime(e.target.value)} aria-label="রিমাইন্ডারের সময়" />
        <button type="button" className="btn btn-outline btn-sm" onClick={download} disabled={busy}>
          <CalendarDays className="size-4" /> ক্যালেন্ডারে যোগ করো
        </button>
      </div>
      <p className="text-xs text-base-content/55">ডাউনলোড হওয়া .ics ফাইলটি খুললেই Google/Apple ক্যালেন্ডার যোগ করার অপশন দেখাবে।</p>
    </section>
  );
}

function PlanView({ data }) {
  const { plan, today, todayPlan, stats } = data;
  const action = usePlanAction();
  const [selected, setSelected] = useState(today);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const day = plan.days.find((d) => d.date === selected);
  const pct = stats.totalTasks ? Math.round((stats.doneTasks / stats.totalTasks) * 100) : 0;
  const isRest = !todayPlan && today < plan.examDate && plan.days.some((d) => d.date > today);
  const heavier = plan.plannedMinutes > plan.dailyMinutes;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end gap-4">
        <div className="flex-1">
          <h1 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl">
            <CalendarCheck className="size-7 text-primary" /> স্টাডি প্ল্যান
          </h1>
          <p className="mt-1 text-base-content/70">
            পরীক্ষা {dayLabel(plan.examDate, { day: 'numeric', month: 'long', year: 'numeric' })} · আর <b>{toBn(stats.examInDays)} দিন</b>
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing((e) => !e)}>
            <Settings2 className="size-4" /> সেটিংস
          </button>
        </div>
      </header>

      {editing && (
        <section className="card-soft space-y-4 p-5">
          <p className="text-sm text-base-content/70">বদলালে আজ থেকে বাকি প্ল্যান নতুন করে সাজানো হবে; আগের দিনের হিসাব থাকবে।</p>
          <SettingsForm
            initial={plan}
            submitLabel="সংরক্ষণ ও নতুন করে সাজাও"
            busy={action.isPending}
            onCancel={() => setEditing(false)}
            onSubmit={(body) =>
              action.mutate(
                { method: 'patch', body },
                {
                  onSuccess: () => {
                    setEditing(false);
                    toast.success('প্ল্যান আপডেট হয়েছে');
                  },
                }
              )
            }
          />
          <div className="border-t border-base-300 pt-3">
            {confirmDelete ? (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                প্ল্যানটি পুরো মুছে যাবে। নিশ্চিত?
                <button type="button" className="btn btn-error btn-sm" onClick={() => action.mutate({ method: 'delete' })}>
                  হ্যাঁ, মুছে ফেলো
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirmDelete(false)}>
                  না
                </button>
              </div>
            ) : (
              <button type="button" className="btn btn-ghost btn-sm text-error" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="size-4" /> প্ল্যান মুছে ফেলো
              </button>
            )}
          </div>
        </section>
      )}

      {heavier && (
        <div role="alert" className="alert alert-warning alert-soft">
          <TriangleAlert className="size-5" />
          <span>
            সময় কম: সব শেষ করতে প্রতিদিন গড়ে <b>{toBn(plan.plannedMinutes)} মিনিট</b> লাগবে (তুমি দিয়েছ {toBn(plan.dailyMinutes)})। সময় বাড়াও বা ছুটির দিন বাদ দাও।
          </span>
        </div>
      )}
      {stats.overdueTasks > 0 && (
        <div role="alert" className="alert alert-error alert-soft">
          <TriangleAlert className="size-5" />
          <span className="flex-1">
            আগের দিনগুলোর <b>{toBn(stats.overdueTasks)}টি কাজ</b> ({toBn(stats.overdueMinutes)} মিনিট) বাকি আছে।
          </span>
          <button type="button" className="btn btn-sm" disabled={action.isPending} onClick={() => action.mutate({ method: 'patch', body: {} }, { onSuccess: () => toast.success('আজ থেকে নতুন করে সাজানো হলো') })}>
            <RefreshCw className="size-4" /> আজ থেকে নতুন করে সাজাও
          </button>
        </div>
      )}

      <section className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="card-soft p-3 sm:p-4">
          <p className="text-xs text-base-content/60">মোট অগ্রগতি</p>
          <p className="text-lg font-bold sm:text-2xl">{toBn(pct)}%</p>
          <progress className="progress progress-primary h-1.5" value={pct} max={100} />
          <p className="mt-1 hidden text-xs text-base-content/55 sm:block">
            {toBn(stats.doneTasks)}/{toBn(stats.totalTasks)} কাজ
          </p>
        </div>
        <div className="card-soft p-3 sm:p-4">
          <p className="text-xs text-base-content/60">প্রতিদিনের পরিকল্পনা</p>
          <p className="text-lg font-bold sm:text-2xl">{toBn(plan.plannedMinutes)} মিনিট</p>
          <p className="mt-1 hidden text-xs text-base-content/55 sm:block">
            {heavier ? 'তোমার দেওয়া সময়ের চেয়ে বেশি' : plan.plannedMinutes < plan.dailyMinutes ? `সময় হাতে থাকলে পরের দিনের কাজ আগেই করে ফেলো` : 'তোমার দেওয়া সময় অনুযায়ী'}
          </p>
        </div>
        <div className="card-soft p-3 sm:p-4">
          <p className="text-xs text-base-content/60">পুরো দিন শেষ করেছ</p>
          <p className="text-lg font-bold sm:text-2xl">{toBn(plan.bonusDays)} দিন</p>
          <p className="mt-1 hidden text-xs text-base-content/55 sm:block">পড়ার দিন বাকি {toBn(stats.learnDaysLeft)} · তারপর রিভিশন</p>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="card-soft p-5 lg:col-span-3">
          <h2 className="font-bold">
            {selected === today ? 'আজকের কাজ' : dayLabel(selected, { weekday: 'long', day: 'numeric', month: 'long' })}
            {day?.phase === 'revise' && <span className="badge badge-info badge-soft badge-sm ml-2 align-middle">রিভিশন</span>}
          </h2>
          {day ? (
            <>
              <ul className="mt-2 divide-y divide-base-300">
                {day.tasks.map((t) => (
                  <TaskItem key={t._id} task={t} />
                ))}
              </ul>
              {day.bonus && <p className="mt-2 text-sm text-success">🎯 এই দিনের সব কাজ সেদিনই শেষ — বোনাস পেয়েছ!</p>}
              {selected > today && <p className="mt-2 text-xs text-base-content/55">আগেই করে ফেললে সেদিন এটা টিক দেওয়া অবস্থায় দেখাবে।</p>}
            </>
          ) : selected === today && isRest ? (
            <p className="mt-3 flex items-center gap-2 text-base-content/70">
              <Coffee className="size-5" /> আজ তোমার সাপ্তাহিক ছুটি। চাইলে পরের দিনের কাজ এগিয়ে রাখতে পারো।
            </p>
          ) : (
            <p className="mt-3 text-base-content/60">এই দিনে কোনো কাজ নেই।</p>
          )}
          {selected !== today && (
            <button type="button" className="btn btn-ghost btn-xs mt-3" onClick={() => setSelected(today)}>
              আজকের দিনে ফিরে যাও
            </button>
          )}
        </section>
        <section className="card-soft p-5 lg:col-span-2">
          <PlanCalendar days={plan.days} today={today} examDate={plan.examDate} selected={selected} onSelect={setSelected} />
        </section>
      </div>

      <Reminder />
    </div>
  );
}

export default function PlanPage() {
  const { data, isLoading, error, refetch } = usePlan();
  if (isLoading) return <div className="skeleton h-96 rounded-box" />;
  if (error) return <QueryError error={error} onRetry={refetch} />;
  return data.plan ? <PlanView data={data} /> : <Setup />;
}
