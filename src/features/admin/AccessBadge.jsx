import { bnDate, daysLeft, toBn } from '@/lib/bn';

const KIND = {
  premium: { label: 'প্রিমিয়াম', cls: 'badge-success' },
  trial: { label: 'ট্রায়াল', cls: 'badge-info' },
  expired: { label: 'মেয়াদ শেষ', cls: 'badge-error' },
  admin: { label: 'অ্যাডমিন', cls: 'badge-neutral' },
};

export function AccessBadge({ access, long }) {
  const k = KIND[access.kind];
  return (
    <span className="inline-flex flex-col gap-0.5">
      <span className={`badge badge-soft badge-sm ${k.cls}`}>{k.label}</span>
      {access.endsAt && (
        <span className="text-xs text-base-content/60">
          {long ? `${bnDate(access.endsAt)} পর্যন্ত · ` : ''}
          {toBn(daysLeft(access.endsAt))} দিন বাকি
        </span>
      )}
    </span>
  );
}
