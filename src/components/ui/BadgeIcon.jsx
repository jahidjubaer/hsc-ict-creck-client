import clsx from 'clsx';
import {
  Award,
  BookOpen,
  CalendarCheck,
  ClipboardCheck,
  Clock,
  Crown,
  Flame,
  GraduationCap,
  Lock,
  Moon,
  NotebookTabs,
  Sparkles,
  Sunrise,
  Target,
  Zap,
} from 'lucide-react';

// Icon names come from server/src/config/gamification.js (BADGES[].icon).
const ICONS = { Award, BookOpen, CalendarCheck, ClipboardCheck, Clock, Crown, Flame, GraduationCap, Moon, NotebookTabs, Sparkles, Sunrise, Target, Zap };

const TIER = {
  bronze: 'from-amber-700 to-orange-400',
  silver: 'from-slate-500 to-slate-300',
  gold: 'from-yellow-500 to-amber-300',
};

/** Round medal: tier gradient when earned, grey with a lock when not. */
export function BadgeIcon({ icon, tier, earned = true, size = 'md' }) {
  const Icon = ICONS[icon] ?? Award;
  const box = { sm: 'size-9', md: 'size-14', lg: 'size-20' }[size];
  const glyph = { sm: 'size-4', md: 'size-7', lg: 'size-10' }[size];
  return (
    <span
      className={clsx(
        'relative grid shrink-0 place-items-center rounded-full shadow-sm',
        box,
        earned ? `bg-gradient-to-br text-white ${TIER[tier]}` : 'bg-base-200 text-base-content/35'
      )}
    >
      <Icon className={glyph} strokeWidth={2.2} />
      {!earned && (
        <span className="absolute -right-0.5 -bottom-0.5 grid size-5 place-items-center rounded-full bg-base-300 text-base-content/60">
          <Lock className="size-3" />
        </span>
      )}
    </span>
  );
}
