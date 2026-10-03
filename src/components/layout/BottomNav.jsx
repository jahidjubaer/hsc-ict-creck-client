import { useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import clsx from 'clsx';
import {
  BookOpen,
  CalendarCheck,
  ClipboardList,
  Crown,
  Ellipsis,
  Home,
  LayoutDashboard,
  LogIn,
  LogOut,
  Medal,
  NotebookPen,
  ShieldCheck,
  Trophy,
  User,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useAuthActions } from '@/features/auth/useAuthActions';
import { InstallButton } from '@/components/pwa/InstallButton';

const STUDENT_TABS = [
  { to: '/dashboard', label: 'ড্যাশবোর্ড', icon: LayoutDashboard },
  { to: '/learn', label: 'পড়াশোনা', icon: BookOpen },
  { to: '/exams', label: 'পরীক্ষা', icon: ClipboardList, exact: true },
  { to: '/plan', label: 'প্ল্যান', icon: CalendarCheck },
];

// Visitors: the public site and the parts they can use without an account, then login.
const VISITOR_TABS = [
  { to: '/', label: 'হোম', icon: Home, exact: true },
  { to: '/learn', label: 'পড়াশোনা', icon: BookOpen },
  { to: '/exams', label: 'পরীক্ষা', icon: ClipboardList },
  { to: '/pricing', label: 'প্যাকেজ', icon: Crown },
  { to: '/login', label: 'লগইন', icon: LogIn, keepFrom: true },
];

const MORE = [
  { to: '/leaderboard', label: 'লিডারবোর্ড', icon: Trophy },
  { to: '/badges', label: 'ব্যাজ', icon: Medal },
  { to: '/exams/mistakes', label: 'ভুলের খাতা', icon: NotebookPen },
  { to: '/profile', label: 'প্রোফাইল', icon: User },
  { to: '/', label: 'হোম পেজ', icon: Home },
  { to: '/pricing', label: 'প্যাকেজ', icon: Crown },
];

const tabClass = (active) =>
  clsx(
    'flex min-w-0 flex-1 flex-col items-center gap-0.5 pt-2 pb-1.5 text-[11px] font-medium transition-colors',
    active ? 'text-primary' : 'text-base-content/60'
  );

function TabIcon({ icon: Icon, active }) {
  return (
    <span className={clsx('grid h-7 w-12 place-items-center rounded-full transition-colors', active && 'bg-primary/12')}>
      <Icon className="size-5" strokeWidth={active ? 2.4 : 2} />
    </span>
  );
}

/**
 * App-style tab bar for phones and tablets (the sidebar takes over from lg), on the public pages too.
 * Students: ড্যাশবোর্ড · পড়াশোনা · পরীক্ষা · প্ল্যান · আরও. Visitors: হোম · পড়াশোনা · পরীক্ষা · প্যাকেজ · লগইন.
 * Hidden while an exam is open.
 */
export function BottomNav() {
  const { pathname } = useLocation();
  const user = useAuthStore((s) => s.user);
  const { logout } = useAuthActions();
  const sheet = useRef(null);
  const more = [...MORE, ...(user?.role === 'admin' ? [{ to: '/admin', label: 'অ্যাডমিন', icon: ShieldCheck }] : [])];
  const isAt = (to) => (to === '/' ? pathname === '/' : pathname === to || pathname.startsWith(`${to}/`));
  const moreActive = more.some((m) => isAt(m.to));
  const hidden = pathname.startsWith('/exams/attempts/') || pathname.startsWith('/practice/');

  // Leave the "more" sheet closed after navigating.
  useEffect(() => sheet.current?.close(), [pathname]);

  useEffect(() => {
    document.documentElement.classList.toggle('has-tabbar', !hidden);
    return () => document.documentElement.classList.remove('has-tabbar');
  }, [hidden]);

  if (hidden) return null;
  const tabs = user ? STUDENT_TABS : VISITOR_TABS;
  return (
    <>
      <nav
        aria-label="প্রধান মেনু"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-base-300 bg-base-100/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg lg:hidden"
      >
        <ul className="mx-auto flex max-w-lg">
          {tabs.map(({ to, label, icon, exact, keepFrom }) => (
            <li key={to} className="flex flex-1">
              <NavLink to={to} end={exact} state={keepFrom ? { from: pathname } : undefined} className={({ isActive }) => tabClass(isActive)}>
                {({ isActive }) => (
                  <>
                    <TabIcon icon={icon} active={isActive} />
                    {label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
          {user && (
            <li className="flex flex-1">
              <button type="button" className={tabClass(moreActive)} onClick={() => sheet.current?.showModal()} aria-haspopup="dialog">
                <TabIcon icon={Ellipsis} active={moreActive} />
                আরও
              </button>
            </li>
          )}
        </ul>
      </nav>

      {user && (
        <dialog ref={sheet} className="modal modal-bottom lg:hidden">
          <div className="modal-box pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-base-300" />
            <ul className="grid grid-cols-3 gap-2">
              {more.map(({ to, label, icon: Icon }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className={clsx(
                      'flex flex-col items-center gap-1.5 rounded-2xl p-3 text-center text-sm font-medium',
                      isAt(to) ? 'bg-primary/10 text-primary' : 'bg-base-200/70'
                    )}
                  >
                    <Icon className="size-6" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
            <ul className="menu mt-3 w-full p-0">
              <InstallButton menuItem />
              <li>
                <button type="button" onClick={logout} className="text-error">
                  <LogOut className="size-4" /> লগআউট
                </button>
              </li>
            </ul>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button aria-label="বন্ধ করো">বন্ধ</button>
          </form>
        </dialog>
      )}
    </>
  );
}
