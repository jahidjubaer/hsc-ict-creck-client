import { useEffect, useMemo, useRef } from 'react';
import { bnDate, toBn } from '@/lib/bn';

const WEEKDAYS = ['শনি', 'রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র']; // Bangladesh week starts on Saturday
const SHADES = [
  'bg-base-200',
  'bg-primary/25',
  'bg-primary/45',
  'bg-primary/70',
  'bg-primary',
];

/** 0 = nothing, 1–3 = part of the daily goal, 4 = goal reached. */
function shade(d, goal) {
  if (!d.minutes && !d.xp) return 0;
  const r = d.minutes / goal;
  if (r >= 1) return 4;
  if (r >= 0.5) return 3;
  if (r >= 0.2) return 2;
  return 1;
}

const label = (day) => bnDate(`${day}T12:00:00+06:00`, { day: 'numeric', month: 'short' });

/** GitHub-style calendar of study days (columns = weeks, rows = Saturday…Friday). */
export function ActivityHeatmap({ days, goal }) {
  const scroller = useRef(null);
  const weeks = useMemo(() => {
    const lead = (new Date(`${days[0].day}T12:00:00Z`).getUTCDay() + 1) % 7; // empty cells before the first day
    const cells = [...Array(lead).fill(null), ...days];
    return Array.from({ length: Math.ceil(cells.length / 7) }, (_, w) => cells.slice(w * 7, w * 7 + 7));
  }, [days]);

  // Newest week on the right: start scrolled to the end on narrow screens.
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [weeks]);

  return (
    <div>
      <div ref={scroller} className="overflow-x-auto pb-1">
        <div className="flex w-max gap-[3px] lg:gap-1">
          <div className="mr-1 grid grid-rows-[14px_repeat(7,12px)] gap-[3px] lg:grid-rows-[14px_repeat(7,16px)] lg:gap-1 text-[10px] leading-3 text-base-content/50">
            <span />
            {WEEKDAYS.map((w, i) => (
              <span key={w}>{i % 2 === 1 ? w : ''}</span>
            ))}
          </div>
          {weeks.map((week, w) => {
            const first = week.find(Boolean);
            const newMonth = first && (w === 0 || Number(first.day.slice(8)) <= 7);
            return (
              <div key={w} className="grid grid-rows-[14px_repeat(7,12px)] gap-[3px] lg:grid-rows-[14px_repeat(7,16px)] lg:gap-1">
                {/* Absolutely placed so a long month name never widens its week column. */}
                <span className="relative">
                  {newMonth && (
                    <span className="absolute left-0 text-[10px] leading-3 whitespace-nowrap text-base-content/50">
                      {bnDate(`${first.day}T12:00:00+06:00`, { month: 'short' })}
                    </span>
                  )}
                </span>
                {Array.from({ length: 7 }, (_, i) => {
                  const d = week[i];
                  if (!d) return <span key={i} className="size-3 lg:size-4" />;
                  const text = `${label(d.day)}: ${toBn(d.minutes)} মিনিট${d.xp ? `, ${toBn(d.xp)} XP` : ''}`;
                  return <span key={i} className={`size-3 rounded-[3px] lg:size-4 ${SHADES[shade(d, goal)]}`} title={text} aria-label={text} />;
                })}
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-end gap-1 text-[11px] text-base-content/55">
        কম
        {SHADES.map((s) => (
          <span key={s} className={`size-3 rounded-[3px] ${s}`} />
        ))}
        লক্ষ্য পূরণ
      </div>
    </div>
  );
}
