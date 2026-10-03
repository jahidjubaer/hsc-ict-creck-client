export const METHOD = {
  bkash: { name: 'বিকাশ', en: 'bKash', ussd: '*247#', color: '#E2136E' },
  nagad: { name: 'নগদ', en: 'Nagad', ussd: '*167#', color: '#EC6B1E' },
};

export const PLAN_NAME = { m1: '১ মাস', m3: '৩ মাস', m6: '৬ মাস', y1: '১ বছর', manual: 'অ্যাডমিন প্রদত্ত' };

/** Student-facing status: approved shows as সক্রিয় while its period lasts. */
export function paymentStatus(p, now = Date.now()) {
  if (p.status === 'pending') return { label: 'পর্যালোচনা চলছে', cls: 'badge-warning' };
  if (p.status === 'rejected') return { label: 'বাতিল', cls: 'badge-error' };
  if (p.periodEnd && new Date(p.periodEnd) < now) return { label: 'মেয়াদ শেষ', cls: 'badge-ghost' };
  if (p.periodStart && new Date(p.periodStart) > now) return { label: 'অনুমোদিত (পরে শুরু হবে)', cls: 'badge-info' };
  return { label: 'সক্রিয়', cls: 'badge-success' };
}
