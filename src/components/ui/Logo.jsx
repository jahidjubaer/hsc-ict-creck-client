import { useId } from 'react';
import { Link } from 'react-router';
import clsx from 'clsx';

export function LogoMark({ className }) {
  // Unique gradient id per instance: a shared id breaks when one copy is display:none.
  const gid = `logo-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  return (
    <svg viewBox="0 0 64 64" className={clsx('size-9 shrink-0', className)} aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6366f1" />
          <stop offset="1" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill={`url(#${gid})`} />
      <path d="M18 22h28M18 32h18M18 42h24" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
      <circle cx="46" cy="42" r="4" fill="#fde047" />
    </svg>
  );
}

export function Logo({ className, to = '/' }) {
  return (
    <Link to={to} className={clsx('flex items-center gap-2.5 font-bold', className)}>
      <LogoMark />
      <span className="text-xl leading-none tracking-tight whitespace-nowrap">
        ICT <span className="text-gradient">Crack</span>
      </span>
    </Link>
  );
}
