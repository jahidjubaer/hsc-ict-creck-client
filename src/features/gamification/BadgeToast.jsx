import { BadgeIcon } from '@/components/ui/BadgeIcon';

export function BadgeToast({ badge, visible }) {
  return (
    <div
      className={`flex max-w-sm items-center gap-3 rounded-2xl border border-amber-400/40 bg-base-100 p-3 pr-5 shadow-xl transition ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      role="status"
    >
      <BadgeIcon icon={badge.icon} tier={badge.tier} size="md" />
      <div>
        <p className="text-xs font-semibold text-amber-600">নতুন ব্যাজ অর্জন! 🎉</p>
        <p className="font-bold">{badge.title}</p>
        <p className="text-sm text-base-content/70">{badge.desc}</p>
      </div>
    </div>
  );
}
