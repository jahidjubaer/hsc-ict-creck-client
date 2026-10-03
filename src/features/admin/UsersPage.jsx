import { Link, useSearchParams } from 'react-router';
import { QueryError } from '@/components/ui/QueryError';
import { bnDate, bnNumber } from '@/lib/bn';
import { Empty, ListSkeleton, Pager, SearchBox, Segments } from './components';
import { useAdminUsers } from './queries';
import { AccessBadge } from './AccessBadge';

const FILTERS = [
  { value: 'all', label: 'সব' },
  { value: 'trial', label: 'ট্রায়াল' },
  { value: 'premium', label: 'প্রিমিয়াম' },
  { value: 'expired', label: 'মেয়াদ শেষ' },
  { value: 'admin', label: 'অ্যাডমিন' },
];

export default function UsersPage() {
  const [params, setParams] = useSearchParams();
  const filter = params.get('filter') ?? 'all';
  const q = params.get('q') ?? '';
  const page = Number(params.get('page')) || 1;
  const update = (patch) => {
    const next = { filter, q, page: 1, ...patch };
    setParams(Object.fromEntries(Object.entries(next).filter(([k, v]) => v && !(k === 'filter' && v === 'all') && !(k === 'page' && v === 1))), {
      replace: true,
    });
  };
  const { data, isLoading, error, refetch } = useAdminUsers({ filter, q: q.trim(), page });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Segments value={filter} options={FILTERS} onChange={(v) => update({ filter: v })} />
        <div className="ml-auto">
          <SearchBox value={q} onChange={(v) => update({ q: v })} placeholder="নাম, ইমেইল বা মোবাইল" />
        </div>
      </div>
      {isLoading ? (
        <ListSkeleton />
      ) : error ? (
        <QueryError error={error} onRetry={refetch} />
      ) : data.users.length === 0 ? (
        <Empty>কাউকে পাওয়া যায়নি</Empty>
      ) : (
        <>
          <p className="text-sm text-base-content/60">{bnNumber(data.total)} জন</p>
          <div className="card-soft overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>নাম</th>
                  <th>অবস্থা</th>
                  <th className="hidden md:table-cell">XP</th>
                  <th className="hidden md:table-cell">যোগদান</th>
                  <th className="hidden lg:table-cell">শেষ লগইন</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((u) => (
                  <tr key={u.id} className="hover:bg-base-200/60">
                    <td className="max-w-56">
                      <Link to={`/admin/users/${u.id}`} className="link-hover font-semibold">
                        {u.name}
                      </Link>
                      <p className="truncate text-xs text-base-content/60">{u.email}</p>
                    </td>
                    <td>
                      <AccessBadge access={u.access} />
                    </td>
                    <td className="hidden md:table-cell">{bnNumber(u.xp)}</td>
                    <td className="hidden md:table-cell text-sm">{bnDate(u.createdAt)}</td>
                    <td className="hidden lg:table-cell text-sm">{u.lastLoginAt ? bnDate(u.lastLoginAt) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager page={page} total={data.total} pageSize={data.pageSize} onPage={(p) => update({ page: p })} />
        </>
      )}
    </div>
  );
}
