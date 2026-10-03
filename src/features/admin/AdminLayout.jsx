import { NavLink, Outlet } from 'react-router';
import clsx from 'clsx';
import { Bot, FileQuestion, LayoutGrid, Settings, Users, Wallet } from 'lucide-react';
import { toBn } from '@/lib/bn';
import { useAdminStats } from './queries';

const TABS = [
  { to: '/admin', label: 'সারসংক্ষেপ', icon: LayoutGrid, end: true },
  { to: '/admin/payments', label: 'পেমেন্ট', icon: Wallet, badge: 'pendingPayments' },
  { to: '/admin/users', label: 'ইউজার', icon: Users },
  { to: '/admin/ai', label: 'AI মূল্যায়ন', icon: Bot },
  { to: '/admin/questions', label: 'প্রশ্ন', icon: FileQuestion },
  { to: '/admin/settings', label: 'সেটিংস', icon: Settings },
];

export default function AdminLayout() {
  const { data: stats } = useAdminStats();
  return (
    <div className="space-y-5">
      <nav className="-mx-3 overflow-x-auto px-3 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden" aria-label="অ্যাডমিন">
        <ul className="flex min-w-max gap-1 rounded-box bg-base-200 p-1">
          {TABS.map(({ to, label, icon: Icon, end, badge }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-1.5 rounded-field px-3 py-2 text-sm font-medium transition',
                    isActive ? 'bg-base-100 text-primary shadow-sm' : 'text-base-content/70 hover:text-base-content'
                  )
                }
              >
                <Icon className="size-4" /> {label}
                {badge && stats?.[badge] > 0 && <span className="badge badge-warning badge-xs">{toBn(stats[badge])}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <Outlet />
    </div>
  );
}
