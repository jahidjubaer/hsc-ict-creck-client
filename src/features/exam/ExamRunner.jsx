import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { CheckCircle2, CloudCheck, ListChecks, PenLine, Send, TriangleAlert } from 'lucide-react';
import { errorMessage } from '@/lib/api';
import { toBn } from '@/lib/bn';
import { McqOptions, McqStem } from './components/McqOptions';
import { CqEditor } from './components/CqEditor';
import { Timer } from './components/Timer';
import { GradingOverlay } from './components/GradingOverlay';
import { useSubmitAttempt } from './queries';
import { useDraft } from './useDraft';

const hasText = (texts) => texts?.some((t) => t.trim());

/** Board-style timed test: all MCQs on one page with a question palette, CQ tabs, autosave, auto-submit at time-up. */
export function ExamRunner({ attempt }) {
  const { mcq, cq, cqChoose } = attempt;
  // Server time minus device time at load, so the countdown follows the server deadline.
  const [skewMs] = useState(() => new Date(attempt.serverNow).getTime() - Date.now());
  const { draft, setMcq, setCq, flush, savedAt, markClean } = useDraft(attempt);
  const submit = useSubmitAttempt(attempt._id);
  const [section, setSection] = useState('mcq');
  const [cqTab, setCqTab] = useState(0);
  const confirmRef = useRef(null);

  const answeredMcq = useMemo(() => mcq.filter((m) => draft.mcq[m._id] !== null && draft.mcq[m._id] !== undefined).length, [mcq, draft.mcq]);
  const answeredCq = cq.filter((c) => hasText(draft.cq[c._id])).length;

  const doSubmit = useCallback(() => {
    confirmRef.current?.close();
    submit.mutate(draft, { onSuccess: markClean, onError: (err) => toast.error(errorMessage(err)) });
  }, [submit, draft, markClean]);

  const onExpire = useCallback(() => {
    toast('সময় শেষ! তোমার উত্তর জমা দেওয়া হচ্ছে…', { icon: '⏰' });
    doSubmit();
  }, [doSubmit]);

  // Warn before closing the tab mid-exam (answers are autosaved anyway).
  useEffect(() => {
    const onUnload = (e) => {
      flush();
      e.preventDefault();
    };
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, [flush]);

  const jump = (i) => {
    setSection('mcq');
    requestAnimationFrame(() => document.getElementById(`q-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  };

  const palette = (
    <div className="grid grid-cols-8 gap-1.5 sm:grid-cols-10 lg:grid-cols-5">
      {mcq.map((m, i) => {
        const done = draft.mcq[m._id] !== null && draft.mcq[m._id] !== undefined;
        return (
          <button
            key={m._id}
            type="button"
            onClick={() => jump(i)}
            className={clsx('btn btn-xs h-8 font-mono', done ? 'btn-primary' : 'btn-ghost border-base-300')}
            aria-label={`প্রশ্ন ${toBn(i + 1)}${done ? ' (উত্তর দেওয়া)' : ''}`}
          >
            {toBn(i + 1)}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-5">
      {submit.isPending && <GradingOverlay withCq={answeredCq > 0} />}

      {/* Sticky exam bar */}
      <div className="sticky top-16 z-20 -mx-3 border-b border-base-300 bg-base-100/90 px-3 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="mr-auto line-clamp-1 font-bold">{attempt.title}</h1>
          {attempt.deadline && <Timer deadline={attempt.deadline} skewMs={skewMs} onExpire={onExpire} />}
          <span className="hidden items-center gap-1 text-xs text-base-content/50 sm:flex">
            {savedAt && (
              <>
                <CloudCheck className="size-4" /> সংরক্ষিত
              </>
            )}
          </span>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => confirmRef.current?.showModal()} disabled={submit.isPending}>
            <Send className="size-4" /> জমা দাও
          </button>
        </div>
        {cq.length > 0 && (
          <div role="tablist" className="tabs-box tabs tabs-sm mt-3 w-fit">
            <button type="button" role="tab" className={clsx('tab gap-1', section === 'mcq' && 'tab-active')} onClick={() => setSection('mcq')}>
              <ListChecks className="size-4" /> বহুনির্বাচনি ({toBn(answeredMcq)}/{toBn(mcq.length)})
            </button>
            <button type="button" role="tab" className={clsx('tab gap-1', section === 'cq' && 'tab-active')} onClick={() => setSection('cq')}>
              <PenLine className="size-4" /> সৃজনশীল ({toBn(answeredCq)}/{toBn(cqChoose)})
            </button>
          </div>
        )}
      </div>

      {section === 'mcq' && (
        <div className="grid gap-6 lg:grid-cols-[1fr_15rem]">
          <div className="space-y-4">
            <details className="card-soft p-3 lg:hidden">
              <summary className="cursor-pointer text-sm font-semibold">
                প্রশ্ন তালিকা — {toBn(answeredMcq)}/{toBn(mcq.length)} উত্তর দেওয়া
              </summary>
              <div className="mt-3">{palette}</div>
            </details>
            {mcq.map((m, i) => (
              <section key={m._id} id={`q-${i}`} className="card-soft scroll-mt-40 space-y-3 p-4 sm:p-5">
                <McqStem q={m.q} stimulus={m.stimulus} number={toBn(i + 1)} />
                <McqOptions options={m.options} selected={draft.mcq[m._id]} onPick={(p) => setMcq(m._id, p)} />
              </section>
            ))}
            {cq.length > 0 && (
              <button type="button" className="btn btn-secondary btn-block" onClick={() => setSection('cq')}>
                <PenLine className="size-4" /> সৃজনশীল অংশে যাও
              </button>
            )}
          </div>
          <aside className="hidden lg:block">
            <div className="card-soft sticky top-44 space-y-3 p-4">
              <p className="text-sm font-bold">প্রশ্ন তালিকা</p>
              {palette}
              <p className="text-xs text-base-content/50">নীল = উত্তর দেওয়া। আবার ক্লিক করলে উত্তর মুছে যায়।</p>
            </div>
          </aside>
        </div>
      )}

      {section === 'cq' && (
        <div className="mx-auto max-w-3xl space-y-4">
          <div className="alert alert-info alert-soft text-sm">
            <span>
              {toBn(cq.length)}টি প্রশ্ন থেকে <b>যেকোনো {toBn(cqChoose)}টির</b> উত্তর দাও। বেশি লিখলে প্রথম {toBn(cqChoose)}টি মূল্যায়িত হবে।
            </span>
          </div>
          <div role="tablist" className="tabs-border tabs">
            {cq.map((c, i) => (
              <button key={c._id} type="button" role="tab" className={clsx('tab gap-1', cqTab === i && 'tab-active')} onClick={() => setCqTab(i)}>
                প্রশ্ন {toBn(i + 1)} {hasText(draft.cq[c._id]) && <CheckCircle2 className="size-4 text-success" />}
              </button>
            ))}
          </div>
          {cq[cqTab] && (
            <div className="card-soft p-4 sm:p-6">
              <CqEditor question={cq[cqTab]} values={draft.cq[cq[cqTab]._id]} onChange={(i, t) => setCq(cq[cqTab]._id, i, t)} />
            </div>
          )}
        </div>
      )}

      <dialog ref={confirmRef} className="modal">
        <div className="modal-box">
          <h3 className="text-lg font-bold">উত্তর জমা দেবে?</h3>
          <ul className="mt-3 space-y-1 text-sm">
            <li>
              বহুনির্বাচনি: {toBn(answeredMcq)}/{toBn(mcq.length)}টি উত্তর দেওয়া
            </li>
            {cq.length > 0 && (
              <li>
                সৃজনশীল: {toBn(answeredCq)}/{toBn(cqChoose)}টি লেখা
              </li>
            )}
          </ul>
          {(answeredMcq < mcq.length || answeredCq < cqChoose) && (
            <p className="mt-3 flex items-center gap-2 text-sm text-warning">
              <TriangleAlert className="size-4" /> কিছু প্রশ্ন বাকি আছে। জমা দেওয়ার পর আর পরিবর্তন করা যাবে না।
            </p>
          )}
          <div className="modal-action">
            <form method="dialog">
              <button type="submit" className="btn btn-ghost">
                ফিরে যাও
              </button>
            </form>
            <button type="button" className="btn btn-primary" onClick={doSubmit}>
              <Send className="size-4" /> হ্যাঁ, জমা দাও
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button type="submit">close</button>
        </form>
      </dialog>
    </div>
  );
}
