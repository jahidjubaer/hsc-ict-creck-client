import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { useEffect } from 'react';
import {
  BookOpen,
  CalendarCheck,
  ClipboardList,
  Flame,
  LayoutDashboard,
  LogOut,
  Medal,
  Menu,
  ScrollText,
  ShieldCheck,
  Trophy,
  User,
  Zap,
} from 'lucide-react';
import clsx from 'clsx';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useAuthStore } from '@/store/auth';
import { useAuthActions } from '@/features/auth/useAuthActions';
import { AccessBanner } from './AccessBanner';
import { InstallButton } from '@/components/pwa/InstallButton';
import { toBn } from '@/lib/bn';

const NAV = [
  { to: '/dashboard', label: 'ড্যাশবোর্ড', icon: LayoutDashboard },
  { to: '/learn', label: 'পড়াশোনা', icon: BookOpen },
  { to: '/exams', label: 'পরীক্ষা', icon: ClipboardList },
  { to: '/board-questions', label: 'বোর্ড প্রশ্ন', icon: ScrollText },
  { to: '/plan', label: 'স্টাডি প্ল্যান', icon: CalendarCheck },
  { to: '/leaderboard', label: 'লিডারবোর্ড', icon: Trophy },
  { to: '/badges', label: 'ব্যাজ', icon: Medal },
];

const DRAWER_ID = 'app-drawer';

export function AppLayout() {
  const user = useAuthStore((s) => s.user);
  const { logout } = useAuthActions();
  const { pathname } = useLocation();

  // Close the mobile drawer on navigation.
  useEffect(() => {
    const el = document.getElementById(DRAWER_ID);
    if (el) el.checked = false;
  }, [pathname]);

  return (
    <div className="drawer lg:drawer-open">
      <input id={DRAWER_ID} type="checkbox" className="drawer-toggle" />

      <div className="drawer-content flex min-h-dvh flex-col">
        <header className="sticky top-0 z-30 border-b border-base-300/60 bg-base-100/85 backdrop-blur-lg">
          <div className="flex h-16 items-center gap-2 px-3 sm:px-6">
            <label htmlFor={DRAWER_ID} className="btn btn-ghost btn-circle lg:hidden" aria-label="মেনু খোলো">
              <Menu className="size-5" />
            </label>
            <Logo to="/dashboard" className="lg:hidden" />
            <div className="ml-auto flex items-center gap-1 sm:gap-2">
              <div
                className="tooltip tooltip-bottom"
                data-tip={user?.streak?.atRisk ? 'আজ এখনো পড়া হয়নি — স্ট্রিক বাঁচাও!' : 'টানা পড়ার দিন'}
              >
                <span
                  className={clsx(
                    'badge badge-lg gap-1 font-semibold',
                    user?.streak?.todayDone
                      ? 'border-orange-500/30 bg-orange-500/10 text-orange-600'
                      : 'border-base-300 bg-base-200 text-base-content/60'
                  )}
                >
                  <Flame className="size-4" /> {toBn(user?.streak?.current ?? 0)}
                </span>
              </div>
              <div className="tooltip tooltip-bottom hidden sm:block" data-tip="মোট XP">
                <span className="badge badge-lg gap-1 border-primary/30 bg-primary/10 font-semibold text-primary">
                  <Zap className="size-4" /> {toBn(user?.xp ?? 0)}
                </span>
              </div>
              <ThemeToggle />
              <div className="dropdown dropdown-end">
                <button tabIndex={0} className="avatar avatar-placeholder" aria-label="প্রোফাইল মেনু">
                  <div className="w-9 rounded-full bg-gradient-to-br from-primary to-secondary text-primary-content">
                    <span className="font-semibold">{user?.name?.[0] ?? '?'}</span>
                  </div>
                </button>
                <ul tabIndex={0} className="menu dropdown-content z-50 mt-3 w-56 rounded-box bg-base-100 p-2 shadow-xl">
                  <li className="menu-title truncate">{user?.name}</li>
                  <li>
                    <Link to="/profile">
                      <User className="size-4" /> প্রোফাইল
                    </Link>
                  </li>
                  <InstallButton menuItem />
                  <li>
                    <button onClick={logout}>
                      <LogOut className="size-4" /> লগআউট
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </header>

        <AccessBanner />

        <main className="mx-auto w-full max-w-6xl flex-1 px-3 py-6 sm:px-6">
          <Outlet />
        </main>
      </div>

      <aside className="drawer-side z-40">
        <label htmlFor={DRAWER_ID} className="drawer-overlay" aria-label="মেনু বন্ধ করো" />
        <div className="flex min-h-full w-72 flex-col border-r border-base-300 bg-base-100 p-4">
          <Logo to="/dashboard" className="mb-6 px-2" />
          <ul className="menu w-full gap-1 p-0 text-base">
            {NAV.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    clsx('rounded-xl py-2.5', isActive && 'bg-primary/10 font-semibold text-primary')
                  }
                >
                  <Icon className="size-5" />
                  {label}
                </NavLink>
              </li>
            ))}
            {user?.role === 'admin' && (
              <li className="mt-2 border-t border-base-300 pt-2">
                <NavLink
                  to="/admin"
                  className={({ isActive }) => clsx('rounded-xl py-2.5', isActive && 'bg-primary/10 font-semibold text-primary')}
                >
                  <ShieldCheck className="size-5" />
                  অ্যাডমিন
                </NavLink>
              </li>
            )}
          </ul>
          <div className="mt-auto rounded-box bg-gradient-to-br from-primary to-secondary p-4 text-primary-content">
            <p className="font-semibold">লক্ষ্য: HSC-তে ICT-তে A+</p>
            <p className="mt-1 text-sm opacity-90">প্রতিদিন একটু একটু করে — ধারাবাহিকতাই সাফল্যের চাবি।</p>
          </div>
        </div>
      </aside>
    </div>
  );
}
