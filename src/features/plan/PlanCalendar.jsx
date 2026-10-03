import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { bnDate, toBn } from '@/lib/bn';

const WEEKDAYS = ['শনি', 'রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র'];
const monthOf = (day) => day.slice(0, 7);
const shiftMonth = (ym, n) => {
  const d = new Date(`${ym}-01T12:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + n);
  return d.toISOString().slice(0, 7);
};

/** Status of one plan day for the calendar colours. */
function dayStatus(d, today) {
  if (!d) return 'none';
  const done = d.tasks.filter((t) => t.done).length;
  if (d.tasks.length && done === d.tasks.length) return 'done';
  if (d.date > today) return d.phase === 'revise' ? 'revise' : 'future';
  if (d.date === today) return done ? 'partial' : 'today';
  return done ? 'partial' : 'missed';
}

const STYLE = {
  done: 'bg-success/20 text-success-content border-success/40',
  partial: 'bg-warning/20 border-warning/40',
  missed: 'bg-error/15 border-error/30',
  today: 'border-primary bg-primary/10',
  future: 'border-base-300 bg-base-100',
  revise: 'border-info/30 bg-info/10',
  none: 'border-transparent text-base-content/30',
};

/** Month grid (Saturday-first). Click a day to see its tasks. */
export function PlanCalendar({ days, today, examDate, selected, onSelect }) {
  const byDate = useMemo(() => new Map(days.map((d) => [d.date, d])), [days]);
  const [month, setMonth] = useState(monthOf(selected ?? today));
  const first = monthOf(days[0]?.date ?? today);
  const last = monthOf(examDate);

  const cells = useMemo(() => {
    const start = new Date(`${month}-01T12:00:00Z`);
    const lead = (start.getUTCDay() + 1) % 7;
    const count = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0)).getUTCDate();
    return [...Array(lead).fill(null), ...Array.from({ length: count }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`)];
  }, [month]);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button type="button" className="btn btn-ghost btn-sm btn-square" onClick={() => setMonth(shiftMonth(month, -1))} disabled={month <= first} aria-label="আগের মাস">
          <ChevronLeft className="size-4" />
        </button>
        <p className="font-semibold">{bnDate(`${month}-15T12:00:00+06:00`, { month: 'long', year: 'numeric' })}</p>
        <button type="button" className="btn btn-ghost btn-sm btn-square" onClick={() => setMonth(shiftMonth(month, 1))} disabled={month >= last} aria-label="পরের মাস">
          <ChevronRight className="size-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-base-content/55">
        {WEEKDAYS.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) return <span key={i} />;
          const d = byDate.get(date);
          const exam = date === examDate;
          const status = exam ? 'exam' : dayStatus(d, today);
          return (
            <button
              key={date}
              type="button"
              disabled={!d}
              onClick={() => onSelect(date)}
              className={clsx(
                'relative flex aspect-square flex-col items-center justify-center rounded-lg border text-sm transition',
                exam ? 'border-error bg-error text-error-content font-bold' : STYLE[status],
                date === selected && 'ring-2 ring-primary ring-offset-1 ring-offset-base-100',
                d && 'hover:border-primary/60'
              )}
              aria-label={`${bnDate(`${date}T12:00:00+06:00`)}${exam ? ' — পরীক্ষা' : d ? ` — ${toBn(d.tasks.length)}টি কাজ` : ''}`}
            >
              {toBn(Number(date.slice(8)))}
              {exam && <span className="text-[9px] leading-none">পরীক্ষা</span>}
              {d && !exam && <span className="text-[9px] leading-none opacity-70">{toBn(d.tasks.reduce((s, t) => s + t.minutes, 0))}′</span>}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-base-content/60">
        {[
          ['done', 'শেষ'],
          ['partial', 'আংশিক'],
          ['missed', 'বাদ পড়েছে'],
          ['future', 'পড়া'],
          ['revise', 'রিভিশন'],
        ].map(([k, l]) => (
          <span key={k} className="flex items-center gap-1">
            <span className={clsx('size-3 rounded border', STYLE[k])} /> {l}
          </span>
        ))}
        <span className="flex items-center gap-1">
          <span className="size-3 rounded bg-error" /> পরীক্ষা
        </span>
      </div>
    </div>
  );
}
