import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuthStore } from '@/store/auth';

export function RequireAuth() {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

export function GuestOnly() {
  const user = useAuthStore((s) => s.user);
  if (user) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

export function RequireAdmin() {
  const user = useAuthStore((s) => s.user);
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
