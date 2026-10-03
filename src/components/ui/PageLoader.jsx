import { LogoMark } from './Logo';

// Rendered outside the router during session bootstrap, so it must not use <Link>.
export function PageLoader({ full = false }) {
  return (
    <div className={`grid place-items-center ${full ? 'min-h-dvh' : 'min-h-[50vh]'}`}>
      <div className="flex flex-col items-center gap-4">
        <LogoMark className="size-12 animate-pulse" />
        <span className="loading loading-dots loading-md text-primary" />
      </div>
    </div>
  );
}
