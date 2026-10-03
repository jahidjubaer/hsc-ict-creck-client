import { useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import clsx from 'clsx';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useAuthStore } from '@/store/auth';
import { BottomNav } from './BottomNav';

const YEAR = new Date().getFullYear();

const NAV = [
  { to: '/learn', label: 'পড়াশোনা' },
  { to: '/exams', label: 'পরীক্ষা' },
  { to: '/#features', label: 'ফিচার' },
  { to: '/pricing', label: 'প্যাকেজ' },
  { to: '/#faq', label: 'প্রশ্নোত্তর' },
];

export function PublicLayout() {
  const user = useAuthStore((s) => s.user);
  const { pathname, hash } = useLocation();

  // Scroll to /#section links (the landing page loads lazily, so wait for the section to exist).
  useEffect(() => {
    if (!hash) return;
    let tries = 0;
    const id = setInterval(() => {
      const el = document.getElementById(hash.slice(1));
      if (el || ++tries > 20) clearInterval(id);
      el?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    return () => clearInterval(id);
  }, [pathname, hash]);

  return (
    <div className="flex min-h-dvh flex-col bg-base-100 pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0">
      <header className="sticky top-0 z-40 border-b border-base-300/60 bg-base-100/80 backdrop-blur-lg">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Logo />
          <ul className="hidden items-center gap-1 md:flex">
            {NAV.map((n) => (
              <li key={n.to}>
                {/* Section links (/#…) are plain links: NavLink ignores the hash, so on the home page it would mark them as the
                    current page (aria-current), which daisyUI paints as a pressed button. */}
                {n.to.includes('#') ? (
                  <Link to={n.to} className="btn btn-ghost btn-sm font-medium">
                    {n.label}
                  </Link>
                ) : (
                  <NavLink to={n.to} className={({ isActive }) => clsx('btn btn-ghost btn-sm font-medium', isActive && 'text-primary')}>
                    {n.label}
                  </NavLink>
                )}
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            {user ? (
              <Link to="/dashboard" className="btn btn-primary btn-sm">
                ড্যাশবোর্ড
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost btn-sm hidden sm:inline-flex">
                  লগইন
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm">
                  ফ্রি শুরু করো
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-base-300 bg-base-200">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm sm:flex-row">
          <Logo />
          <p className="text-base-content/60">HSC ICT — জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ডের সিলেবাস অনুযায়ী</p>
          <p className="text-base-content/60">© {YEAR} ICT Crack</p>
        </div>
      </footer>
      <BottomNav />
    </div>
  );
}
