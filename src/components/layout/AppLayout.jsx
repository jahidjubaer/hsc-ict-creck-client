import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { useEffect } from 'react';
import {
  BookOpen,
  CalendarCheck,
  ClipboardList,
  Crown,
  Flame,
  Home,
  LayoutDashboard,
  Lock,
  LogIn,
  LogOut,
  Medal,
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
import { BottomNav } from './BottomNav';
import { SeoDefaults } from '@/lib/seo';
import { ContentGuard } from '@/components/security/ContentGuard';
import { toBn } from '@/lib/bn';

// open: visitors can use it without an account (free topics, free-topic tests)
const NAV = [
  { to: '/dashboard', label: 'ড্যাশবোর্ড', icon: LayoutDashboard },
  { to: '/learn', label: 'পড়াশোনা', icon: BookOpen, open: true },
  { to: '/exams', label: 'পরীক্ষা', icon: ClipboardList, open: true },
  { to: '/plan', label: 'স্টাডি প্ল্যান', icon: CalendarCheck },
  { to: '/leaderboard', label: 'লিডারবোর্ড', icon: Trophy },
  { to: '/badges', label: 'ব্যাজ', icon: Medal },
];

const SITE = [
  { to: '/', label: 'হোম পেজ', icon: Home },
  { to: '/pricing', label: 'প্যাকেজ ও মূল্য', icon: Crown },
];

const DRAWER_ID = 'app-drawer';
const navClass = ({ isActive }) => clsx('rounded-xl py-2.5', isActive && 'bg-primary/10 font-semibold text-primary');

/** App shell for students and visitors: sidebar from lg, bottom tab bar below it. */
export function AppLayout() {
  const user = useAuthStore((s) => s.user);
  const { logout } = useAuthActions();
  const { pathname } = useLocation();

  // Close the drawer on navigation.
  useEffect(() => {
    const el = document.getElementById(DRAWER_ID);
    if (el) el.checked = false;
  }, [pathname]);

  return (
    <>
      <ContentGuard />
      <SeoDefaults />
      <div className="drawer lg:drawer-open">
        <input id={DRAWER_ID} type="checkbox" className="drawer-toggle" />

        <div className="drawer-content flex min-h-dvh flex-col">
          <header className="sticky top-0 z-30 border-b border-base-300/60 bg-base-100/85 backdrop-blur-lg">
            <div className="flex h-16 items-center gap-2 px-3 sm:px-6">
              <Logo to="/" className="ml-1 lg:hidden" />
              <div className="ml-auto flex items-center gap-1 sm:gap-2">
                {user ? (
                  <>
                    <div className="tooltip tooltip-bottom" data-tip={user.streak?.atRisk ? 'আজ এখনো পড়া হয়নি — স্ট্রিক বাঁচাও!' : 'টানা পড়ার দিন'}>
                      <span
                        className={clsx(
                          'badge badge-lg gap-1 font-semibold',
                          user.streak?.todayDone ? 'border-orange-500/30 bg-orange-500/10 text-orange-600' : 'border-base-300 bg-base-200 text-base-content/60'
                        )}
                      >
                        <Flame className="size-4" /> {toBn(user.streak?.current ?? 0)}
                      </span>
                    </div>
                    <div className="tooltip tooltip-bottom hidden sm:block" data-tip="মোট XP">
                      <span className="badge badge-lg gap-1 border-primary/30 bg-primary/10 font-semibold text-primary">
                        <Zap className="size-4" /> {toBn(user.xp ?? 0)}
                      </span>
                    </div>
                    <ThemeToggle />
                    <div className="dropdown dropdown-end">
                      <button tabIndex={0} className="avatar avatar-placeholder" aria-label="প্রোফাইল মেনু">
                        <div className="w-9 rounded-full bg-gradient-to-br from-primary to-secondary text-primary-content">
                          <span className="font-semibold">{user.name?.[0] ?? '?'}</span>
                        </div>
                      </button>
                      <ul tabIndex={0} className="menu dropdown-content z-50 mt-3 w-56 rounded-box bg-base-100 p-2 shadow-xl">
                        <li className="menu-title truncate">{user.name}</li>
                        <li>
                          <Link to="/profile">
                            <User className="size-4" /> প্রোফাইল
                          </Link>
                        </li>
                        <li>
                          <Link to="/">
                            <Home className="size-4" /> হোম পেজ
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
                  </>
                ) : (
                  <>
                    <ThemeToggle />
                    <Link to="/login" state={{ from: pathname }} className="btn btn-ghost btn-sm hidden sm:inline-flex">
                      লগইন
                    </Link>
                    <Link to="/register" state={{ from: pathname }} className="btn btn-primary btn-sm">
                      ফ্রি শুরু করো
                    </Link>
                  </>
                )}
              </div>
            </div>
          </header>

          <AccessBanner />

          <main className="mx-auto w-full max-w-6xl flex-1 px-3 pt-6 pb-28 sm:px-6 lg:pb-6">
            <Outlet />
          </main>
          <BottomNav />
        </div>

        <aside className="drawer-side z-40">
          <label htmlFor={DRAWER_ID} className="drawer-overlay" aria-label="মেনু বন্ধ করো" />
          <div className="flex min-h-full w-72 flex-col border-r border-base-300 bg-base-100 p-4">
            <Logo to="/" className="mb-6 px-2" />
            <ul className="menu w-full gap-1 p-0 text-base">
              {NAV.map(({ to, label, icon: Icon, open }) => (
                <li key={to}>
                  <NavLink to={to} className={navClass}>
                    <Icon className="size-5" />
                    {label}
                    {!user && !open && <Lock className="ml-auto size-4 text-base-content/35" aria-label="লগইন প্রয়োজন" />}
                  </NavLink>
                </li>
              ))}
              {user?.role === 'admin' && (
                <li>
                  <NavLink to="/admin" className={navClass}>
                    <ShieldCheck className="size-5" />
                    অ্যাডমিন
                  </NavLink>
                </li>
              )}
              <li className="menu-title mt-3 border-t border-base-300 px-2 pt-4 pb-1 text-xs">ওয়েবসাইট</li>
              {SITE.map(({ to, label, icon: Icon }) => (
                <li key={to}>
                  <NavLink to={to} end className={navClass}>
                    <Icon className="size-5" />
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
            {user ? (
              <div className="mt-auto rounded-box bg-gradient-to-br from-primary to-secondary p-4 text-primary-content">
                <p className="font-semibold">লক্ষ্য: HSC-তে ICT-তে A+</p>
                <p className="mt-1 text-sm opacity-90">প্রতিদিন একটু একটু করে — ধারাবাহিকতাই সাফল্যের চাবি।</p>
              </div>
            ) : (
              <div className="mt-auto rounded-box bg-gradient-to-br from-primary to-secondary p-4 text-primary-content">
                <p className="font-semibold">১৫ দিন সব ফ্রি</p>
                <p className="mt-1 text-sm opacity-90">অ্যাকাউন্ট খুললেই সব অধ্যায়, পরীক্ষা ও AI মূল্যায়ন খুলে যাবে।</p>
                <Link to="/register" state={{ from: pathname }} className="btn btn-sm mt-3 w-full border-none bg-white text-primary hover:bg-white/90">
                  <LogIn className="size-4" /> ফ্রি শুরু করো
                </Link>
              </div>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
