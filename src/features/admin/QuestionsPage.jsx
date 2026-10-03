import { Link, useSearchParams } from 'react-router';
import { PencilLine } from 'lucide-react';
import { QueryError } from '@/components/ui/QueryError';
import { bnNumber, toBn } from '@/lib/bn';
import { Empty, ListSkeleton, Pager, SearchBox } from './components';
import { useAdminMeta, useAdminQuestions } from './queries';

const DIFF = { easy: 'সহজ', medium: 'মাঝারি', hard: 'কঠিন' };

/** First line of a markdown stem, without the markdown. */
const preview = (s = '') =>
  s
    .replace(/[*_`#>|]/g, '')
    .split('\n')
    .map((l) => l.trim())
    .find(Boolean) ?? '';

export default function QuestionsPage() {
  const [params, setParams] = useSearchParams();
  const f = {
    chapter: params.get('chapter') ?? '',
    topic: params.get('topic') ?? '',
    type: params.get('type') ?? '',
    q: params.get('q') ?? '',
    edited: params.get('edited') ?? '',
    inactive: params.get('inactive') ?? '',
    page: Number(params.get('page')) || 1,
  };
  const update = (patch) => {
    const next = { ...f, page: 1, ...patch };
    if ('chapter' in patch) next.topic = '';
    setParams(Object.fromEntries(Object.entries(next).filter(([k, v]) => v && !(k === 'page' && v === 1))), { replace: true });
  };
  const { data: meta } = useAdminMeta();
  const { data, isLoading, error, refetch } = useAdminQuestions({ ...f, q: f.q.trim() });
  const topics = meta?.chapters.find((c) => String(c.number) === f.chapter)?.topics ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <select className="select select-sm w-auto" value={f.chapter} onChange={(e) => update({ chapter: e.target.value })} aria-label="অধ্যায়">
          <option value="">সব অধ্যায়</option>
          {meta?.chapters.map((c) => (
            <option key={c._id} value={c.number}>
              অধ্যায় {toBn(c.number)}
            </option>
          ))}
        </select>
        <select
          className="select select-sm w-auto max-w-56"
          value={f.topic}
          onChange={(e) => update({ topic: e.target.value })}
          disabled={!f.chapter}
          aria-label="টপিক"
        >
          <option value="">সব টপিক</option>
          {topics.map((t) => (
            <option key={t._id} value={t._id}>
              {t.title}
            </option>
          ))}
        </select>
        <select className="select select-sm w-auto" value={f.type} onChange={(e) => update({ type: e.target.value })} aria-label="ধরন">
          <option value="">MCQ + CQ</option>
          <option value="mcq">MCQ</option>
          <option value="cq">CQ</option>
        </select>
        <label className="label cursor-pointer gap-1 text-sm">
          <input type="checkbox" className="checkbox checkbox-sm" checked={!!f.edited} onChange={(e) => update({ edited: e.target.checked ? '1' : '' })} />
          শুধু এডিট করা
        </label>
        <label className="label cursor-pointer gap-1 text-sm">
          <input type="checkbox" className="checkbox checkbox-sm" checked={!!f.inactive} onChange={(e) => update({ inactive: e.target.checked ? '1' : '' })} />
          বন্ধ করা
        </label>
        <div className="w-full sm:ml-auto sm:w-auto">
          <SearchBox value={f.q} onChange={(v) => update({ q: v })} placeholder="প্রশ্নের লেখা বা key (ch3/…)" />
        </div>
      </div>

      {isLoading ? (
        <ListSkeleton />
      ) : error ? (
        <QueryError error={error} onRetry={refetch} />
      ) : data.questions.length === 0 ? (
        <Empty>কোনো প্রশ্ন পাওয়া যায়নি</Empty>
      ) : (
        <>
          <p className="text-sm text-base-content/60">{bnNumber(data.total)}টি প্রশ্ন</p>
          <ul className="card-soft divide-y divide-base-300">
            {data.questions.map((q) => (
              <li key={q._id}>
                <Link to={`/admin/questions/${q._id}`} className="flex items-start gap-3 p-3 hover:bg-base-200/60">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span className={`badge badge-sm ${q.type === 'mcq' ? 'badge-primary' : 'badge-secondary'} badge-soft`}>{q.type.toUpperCase()}</span>
                      <span className="font-mono text-base-content/60">{q.key}</span>
                      <span className="text-base-content/50">· {DIFF[q.difficulty]}</span>
                      {q.source?.kind === 'book' && <span className="badge badge-ghost badge-xs">বই</span>}
                      {q.adminEdit?.at && <span className="badge badge-warning badge-soft badge-xs">এডিট করা</span>}
                    </div>
                    <p className="mt-1 truncate text-sm">{preview(q.type === 'mcq' ? q.q : q.stimulus)}</p>
                  </div>
                  <PencilLine className="mt-1 size-4 shrink-0 text-base-content/40" />
                </Link>
              </li>
            ))}
          </ul>
          <Pager page={f.page} total={data.total} pageSize={data.pageSize} onPage={(p) => update({ page: p })} />
        </>
      )}
    </div>
  );
}
