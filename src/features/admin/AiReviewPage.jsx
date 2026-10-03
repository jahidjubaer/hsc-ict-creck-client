import { useState } from 'react';
import { Link } from 'react-router';
import clsx from 'clsx';
import { ThumbsDown, ThumbsUp } from 'lucide-react';
import { QueryError } from '@/components/ui/QueryError';
import { Markdown } from '@/components/lesson/Markdown';
import { bnDate, toBn } from '@/lib/bn';
import { partLabel } from '@/features/exam/format';
import { Empty, ListSkeleton, Pager, Segments } from './components';
import { useAdminAction, useAdminMeta, useAiGradings } from './queries';

const REVIEW = [
  { value: 'unreviewed', label: 'দেখা বাকি' },
  { value: 'bad', label: 'খারাপ' },
  { value: 'ok', label: 'ঠিক আছে' },
  { value: 'all', label: 'সব' },
];

function GradingCard({ item }) {
  const action = useAdminAction();
  const [scores, setScores] = useState(item.parts.map((p) => p.score ?? 0));
  const [note, setNote] = useState(item.review?.note ?? '');
  const changed = scores.some((s, i) => s !== (item.parts[i].score ?? 0));
  const total = (list) => list.reduce((a, b) => a + (b ?? 0), 0);

  const submit = (verdict) =>
    action.mutate({
      url: `/admin/ai-gradings/${item.attemptId}/${item.questionId}`,
      body: { verdict, note: note.trim() || undefined, ...(changed && { scores }) },
    });

  return (
    <li className="card-soft space-y-4 p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="badge badge-ghost badge-sm">অধ্যায় {toBn(item.chapterNumber)}</span>
        <Link to={`/admin/questions?q=${encodeURIComponent(item.key)}`} className="font-mono text-xs link-hover">
          {item.key}
        </Link>
        <span className="text-base-content/60">· {item.user?.name ?? '—'}</span>
        <span className="text-base-content/60">· {bnDate(item.submittedAt, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</span>
        <span className="ml-auto font-semibold">
          AI: {toBn(total(item.parts.map((p) => p.score)))}/{toBn(total(item.parts.map((p) => p.marks)))}
        </span>
        {item.review && (
          <span className={clsx('badge badge-soft badge-sm', item.review.verdict === 'bad' ? 'badge-error' : 'badge-success')}>
            {item.review.verdict === 'bad' ? 'খারাপ' : 'ঠিক আছে'}
          </span>
        )}
      </div>

      <details className="rounded-box bg-base-200/60 px-3 py-2 text-sm">
        <summary className="cursor-pointer font-medium">উদ্দীপক</summary>
        <Markdown className="mt-2 max-w-none text-sm">{item.stimulus}</Markdown>
      </details>

      <ol className="space-y-4">
        {item.parts.map((p, i) => (
          <li key={i} className="space-y-2 border-l-4 border-base-300 pl-3">
            <div className="flex flex-wrap items-start gap-2">
              <p className="flex-1 text-sm font-semibold">
                {partLabel(i, p.marks)} {p.q}
              </p>
              <label className="flex items-center gap-1 text-sm">
                নম্বর
                <select
                  className={clsx('select select-xs w-16', scores[i] !== (p.score ?? 0) && 'select-warning')}
                  value={scores[i]}
                  onChange={(e) => setScores((s) => s.map((v, n) => (n === i ? Number(e.target.value) : v)))}
                  disabled={!p.text.trim()}
                  aria-label={`${partLabel(i, p.marks)} নম্বর`}
                >
                  {Array.from({ length: p.marks + 1 }, (_, n) => (
                    <option key={n} value={n}>
                      {toBn(n)}
                    </option>
                  ))}
                </select>
                /{toBn(p.marks)}
              </label>
            </div>
            <div className="rounded-box bg-base-200/60 p-2 text-sm whitespace-pre-wrap">
              {p.text.trim() ? p.text : <span className="text-base-content/50">(উত্তর দেয়নি)</span>}
            </div>
            {p.feedback && (
              <p className="text-sm">
                <b>AI মতামত:</b> {p.feedback}
                {p.missing?.length > 0 && <span className="text-base-content/60"> · বাদ পড়েছে: {p.missing.join(', ')}</span>}
              </p>
            )}
            <details className="text-sm">
              <summary className="cursor-pointer text-base-content/70">মডেল উত্তর ও রুব্রিক</summary>
              <Markdown className="mt-1 max-w-none text-sm">{p.answer}</Markdown>
              {p.rubric?.length > 0 && (
                <ul className="mt-1 list-disc pl-5 text-base-content/70">
                  {p.rubric.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              )}
            </details>
          </li>
        ))}
      </ol>

      {item.review?.originalScores && item.review.originalScores.join() !== item.parts.map((p) => p.score).join() && (
        <p className="text-xs text-base-content/60">AI-এর আসল নম্বর: {item.review.originalScores.map(toBn).join(' + ')}</p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <input
          className="input input-sm min-w-48 flex-1"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="নোট (ঐচ্ছিক) — যেমন: গ অংশে প্রয়োগ না থাকলেও পুরো নম্বর"
        />
        <button type="button" className="btn btn-success btn-sm" disabled={action.isPending} onClick={() => submit('ok')}>
          <ThumbsUp className="size-4" /> {changed ? 'নম্বর ঠিক করে সংরক্ষণ' : 'ঠিক আছে'}
        </button>
        <button type="button" className="btn btn-outline btn-error btn-sm" disabled={action.isPending} onClick={() => submit('bad')}>
          <ThumbsDown className="size-4" /> খারাপ মূল্যায়ন
        </button>
      </div>
      {changed && <p className="text-xs text-warning">নম্বর বদলালে শিক্ষার্থীর ফলাফলও বদলে যাবে।</p>}
    </li>
  );
}

export default function AiReviewPage() {
  const [review, setReview] = useState('unreviewed');
  const [chapter, setChapter] = useState('');
  const [page, setPage] = useState(1);
  const { data: meta } = useAdminMeta();
  const { data, isLoading, error, refetch } = useAiGradings({ review, chapter, page });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Segments
          value={review}
          options={REVIEW}
          onChange={(v) => {
            setReview(v);
            setPage(1);
          }}
        />
        <select
          className="select select-sm ml-auto w-auto"
          value={chapter}
          onChange={(e) => {
            setChapter(e.target.value);
            setPage(1);
          }}
          aria-label="অধ্যায়"
        >
          <option value="">সব অধ্যায়</option>
          {meta?.chapters.map((c) => (
            <option key={c._id} value={c.number}>
              অধ্যায় {toBn(c.number)}
            </option>
          ))}
        </select>
      </div>
      <p className="text-sm text-base-content/60">
        Gemini যেসব সৃজনশীল উত্তর মূল্যায়ন করেছে। ভুল মনে হলে নম্বর ঠিক করে দাও — শিক্ষার্থীর ফলাফল আপডেট হবে; খারাপ চিহ্নিতগুলো পরে প্রম্পট উন্নত করতে কাজে লাগবে।
      </p>
      {isLoading ? (
        <ListSkeleton />
      ) : error ? (
        <QueryError error={error} onRetry={refetch} />
      ) : data.items.length === 0 ? (
        <Empty>{review === 'unreviewed' ? 'দেখার মতো নতুন কিছু নেই' : 'কিছু পাওয়া যায়নি'}</Empty>
      ) : (
        <>
          <ul className="space-y-4">
            {data.items.map((item) => (
              <GradingCard key={`${item.attemptId}-${item.questionId}-${item.review?.at ?? ''}`} item={item} />
            ))}
          </ul>
          <Pager page={page} total={data.total} pageSize={data.pageSize} onPage={setPage} />
        </>
      )}
    </div>
  );
}
