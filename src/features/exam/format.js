import { toBn } from '@/lib/bn';

export const LETTERS = ['ক', 'খ', 'গ', 'ঘ'];
const LEVELS = ['জ্ঞান', 'অনুধাবন', 'প্রয়োগ', 'উচ্চতর দক্ষতা'];

/** "ক. (জ্ঞান, ১ নম্বর)" */
export const partLabel = (i, marks) => `${LETTERS[i]}. (${LEVELS[i]}, ${toBn(marks)} নম্বর)`;

/** Seconds → "০৫:০৯" / "১:০৫:০৯". */
export const formatClock = (sec) => {
  const s = Math.max(0, Math.round(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const pad = (n) => String(n).padStart(2, '0');
  return toBn(h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${pad(m)}:${pad(s % 60)}`);
};

/** Bangladesh HSC letter grade from percentage. */
export function letterGrade(p) {
  if (p >= 80) return { g: 'A+', c: 'text-success' };
  if (p >= 70) return { g: 'A', c: 'text-success' };
  if (p >= 60) return { g: 'A-', c: 'text-info' };
  if (p >= 50) return { g: 'B', c: 'text-info' };
  if (p >= 40) return { g: 'C', c: 'text-warning' };
  if (p >= 33) return { g: 'D', c: 'text-warning' };
  return { g: 'F', c: 'text-error' };
}
