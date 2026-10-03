import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { ArrowLeft, Eye, Save } from 'lucide-react';
import { QueryError } from '@/components/ui/QueryError';
import { Markdown } from '@/components/lesson/Markdown';
import { bnDate } from '@/lib/bn';
import { LETTERS, partLabel } from '@/features/exam/format';
import { useAdminAction, useAdminQuestion } from './queries';

/** Editable copy of a question in the shape PATCH /admin/questions/:id expects. */
function toForm(q) {
  const base = { difficulty: q.difficulty, active: q.active, stimulus: q.stimulus ?? '' };
  if (q.type === 'mcq') return { ...base, q: q.q, options: [...q.options], answer: q.answer, explain: q.explain, why: q.why ? [...q.why] : ['', '', '', ''] };
  return { ...base, parts: q.parts.map((p) => ({ q: p.q, answer: p.answer, rubric: (p.rubric ?? []).join('\n') })) };
}

function toBody(type, f) {
  const base = { difficulty: f.difficulty, active: f.active, stimulus: f.stimulus };
  if (type === 'mcq') return { ...base, q: f.q, options: f.options, answer: f.answer, explain: f.explain, why: f.why.some((w) => w.trim()) ? f.why : undefined };
  return {
    ...base,
    parts: f.parts.map((p) => ({ q: p.q, answer: p.answer, rubric: p.rubric.split('\n').map((r) => r.trim()).filter(Boolean) })),
  };
}

function Field({ label, value, onChange, rows = 3, mono, preview }) {
  const [show, setShow] = useState(false);
  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-2 text-sm font-medium">
        {label}
        {preview && (
          <button type="button" className="btn btn-ghost btn-xs" onClick={() => setShow((s) => !s)}>
            <Eye className="size-3.5" /> {show ? 'লুকাও' : 'প্রিভিউ'}
          </button>
        )}
      </span>
      <textarea className={clsx('textarea w-full', mono && 'font-mono text-sm')} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
      {show && <Markdown className="mt-1 max-w-none rounded-box bg-base-200/60 p-3 text-sm">{value}</Markdown>}
    </label>
  );
}

function Editor({ question }) {
  const navigate = useNavigate();
  const save = useAdminAction();
  const [f, setF] = useState(() => toForm(question));
  const set = (patch) => setF((old) => ({ ...old, ...patch }));
  const setAt = (key, i, value) => setF((old) => ({ ...old, [key]: old[key].map((v, n) => (n === i ? value : v)) }));
  const isMcq = question.type === 'mcq';

  const onSave = () =>
    save.mutate(
      { method: 'patch', url: `/admin/questions/${question._id}`, body: toBody(question.type, f) },
      {
        onSuccess: (res) =>
          res.changed.length ? toast.success('সংরক্ষণ হয়েছে — পরের সিড এটা বদলাবে না') : toast('কিছু বদলায়নি'),
      }
    );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="size-4" /> ফিরে যাও
        </button>
        <span className="font-mono text-sm">{question.key}</span>
        <span className={`badge badge-soft ${isMcq ? 'badge-primary' : 'badge-secondary'}`}>{question.type.toUpperCase()}</span>
        {question.adminEdit?.at && (
          <span className="badge badge-warning badge-soft">
            এডিট: {bnDate(question.adminEdit.at)} {question.adminEdit.by?.name && `· ${question.adminEdit.by.name}`}
          </span>
        )}
      </div>

      <p className="rounded-box bg-info/10 p-3 text-sm">
        এখানে বদলালে ডাটাবেসে সাথে সাথে ঠিক হয়; সিড চালালেও এই প্রশ্ন আর ফাইল থেকে বদলাবে না। ফাইলেও স্থায়ীভাবে বসাতে চাইলে
        <code className="mx-1">npm run export-edits</code> দেখো।
      </p>
      {question.figure && <p className="text-sm text-warning">এই প্রশ্নে একটি চিত্র আছে — চিত্রটি শুধু কনটেন্ট ফাইল থেকে বদলানো যায়।</p>}

      <section className="card-soft space-y-4 p-5">
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm">
            কাঠিন্য
            <select className="select select-sm w-auto" value={f.difficulty} onChange={(e) => set({ difficulty: e.target.value })}>
              <option value="easy">সহজ</option>
              <option value="medium">মাঝারি</option>
              <option value="hard">কঠিন</option>
            </select>
          </label>
          <label className="label cursor-pointer gap-2 text-sm">
            <input type="checkbox" className="toggle toggle-sm toggle-success" checked={f.active} onChange={(e) => set({ active: e.target.checked })} />
            {f.active ? 'চালু (পরীক্ষায় আসবে)' : 'বন্ধ (পরীক্ষায় আসবে না)'}
          </label>
        </div>

        <Field label={isMcq ? 'উদ্দীপক (ঐচ্ছিক)' : 'উদ্দীপক'} value={f.stimulus} onChange={(v) => set({ stimulus: v })} rows={isMcq ? 2 : 5} preview />

        {isMcq ? (
          <>
            <Field label="প্রশ্ন" value={f.q} onChange={(v) => set({ q: v })} preview />
            <fieldset className="space-y-3">
              <legend className="mb-1 text-sm font-medium">অপশন — সঠিকটিতে টিক দাও</legend>
              {f.options.map((opt, i) => (
                <div key={i} className={clsx('rounded-box border-2 p-3', f.answer === i ? 'border-success bg-success/5' : 'border-base-300')}>
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="answer"
                      className="radio radio-success radio-sm"
                      checked={f.answer === i}
                      onChange={() => set({ answer: i })}
                      aria-label={`${LETTERS[i]} সঠিক`}
                    />
                    <span className="font-bold">{LETTERS[i]}</span>
                    <input className="input input-sm flex-1" value={opt} onChange={(e) => setAt('options', i, e.target.value)} />
                  </div>
                  <input
                    className="input input-xs mt-2 w-full"
                    value={f.why[i]}
                    onChange={(e) => setAt('why', i, e.target.value)}
                    placeholder="কেন ঠিক/ভুল (ঐচ্ছিক)"
                  />
                </div>
              ))}
            </fieldset>
            <Field label="ব্যাখ্যা" value={f.explain} onChange={(v) => set({ explain: v })} preview />
          </>
        ) : (
          f.parts.map((p, i) => (
            <fieldset key={i} className="space-y-2 rounded-box border border-base-300 p-3">
              <legend className="px-1 text-sm font-semibold">{partLabel(i, [1, 2, 3, 4][i])}</legend>
              <Field label="প্রশ্ন" value={p.q} onChange={(v) => setAt('parts', i, { ...p, q: v })} rows={2} />
              <Field label="মডেল উত্তর" value={p.answer} onChange={(v) => setAt('parts', i, { ...p, answer: v })} rows={5} preview />
              <Field label="রুব্রিক (প্রতি লাইনে একটি পয়েন্ট)" value={p.rubric} onChange={(v) => setAt('parts', i, { ...p, rubric: v })} rows={3} />
            </fieldset>
          ))
        )}
      </section>

      <div className="sticky bottom-3 flex justify-end">
        <button type="button" className="btn btn-primary shadow-lg" onClick={onSave} disabled={save.isPending}>
          {save.isPending ? <span className="loading loading-spinner loading-sm" /> : <Save className="size-4" />} সংরক্ষণ করো
        </button>
      </div>
    </div>
  );
}

export default function QuestionEdit() {
  const { id } = useParams();
  const { data, isLoading, error, refetch } = useAdminQuestion(id);
  if (isLoading) return <div className="skeleton h-96 rounded-box" />;
  if (error)
    return (
      <>
        <Link to="/admin/questions" className="btn btn-ghost btn-sm">
          <ArrowLeft className="size-4" /> প্রশ্ন তালিকা
        </Link>
        <QueryError error={error} onRetry={refetch} />
      </>
    );
  return <Editor key={data._id + (data.adminEdit?.at ?? '')} question={data} />;
}
