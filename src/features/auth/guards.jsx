import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuthStore } from '@/store/auth';
import { LoginPrompt } from '@/components/ui/LoginPrompt';

export function RequireAuth() {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

/** Inside the app shell: visitors see a login prompt in place of the page (they stay in the app, with its navigation). */
export function LoginGate() {
  const user = useAuthStore((s) => s.user);
  if (!user) return <LoginPrompt message="এই অংশ তোমার নিজের অগ্রগতি দেখায় — ব্যবহার করতে লগইন করো।" />;
  return <Outlet />;
}

/** Login / register pages: once signed in, go back to the page that asked for login (or the dashboard). */
export function GuestOnly() {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
  if (user) return <Navigate to={location.state?.from || '/dashboard'} replace />;
  return <Outlet />;
}

export function RequireAdmin() {
  const user = useAuthStore((s) => s.user);
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
