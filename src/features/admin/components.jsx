import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import clsx from 'clsx';
import { toBn } from '@/lib/bn';

/** Prev/next pager for admin lists (`total`/`pageSize` from the API). */
export function Pager({ page, total, pageSize, onPage }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 pt-2">
      <button type="button" className="btn btn-sm btn-ghost" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="আগের পাতা">
        <ChevronLeft className="size-4" />
      </button>
      <span className="text-sm">
        {toBn(page)} / {toBn(pages)}
      </span>
      <button type="button" className="btn btn-sm btn-ghost" disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="পরের পাতা">
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}

/** Segmented filter buttons. options: [{ value, label }] */
export function Segments({ value, options, onChange }) {
  return (
    <div className="join flex-wrap">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={clsx('btn join-item btn-sm', value === o.value && 'btn-primary')}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function SearchBox({ value, onChange, placeholder }) {
  return (
    <label className="input input-sm w-full sm:w-72">
      <Search className="size-4 opacity-50" />
      <input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </label>
  );
}

export function Empty({ children }) {
  return <p className="card-soft p-8 text-center text-base-content/60">{children}</p>;
}

export function ListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="skeleton h-24 rounded-box" />
      ))}
    </div>
  );
}
