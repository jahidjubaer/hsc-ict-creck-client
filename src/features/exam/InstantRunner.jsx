import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { ArrowLeft, ArrowRight, Bot, PenLine, Send, SkipForward, Sparkles } from 'lucide-react';
import { errorMessage } from '@/lib/api';
import { toBn } from '@/lib/bn';
import { Explanation, McqOptions, McqStem } from './components/McqOptions';
import { CqEditor } from './components/CqEditor';
import { useAnswerMcq, useSubmitAttempt } from './queries';
import { useDraft } from './useDraft';
import { GradingOverlay } from './components/GradingOverlay';

/** Topic quiz: one MCQ at a time with instant feedback, then the creative question, then results. */
export function InstantRunner({ attempt }) {
  const { mcq, cq } = attempt;
  const firstOpen = mcq.findIndex((m) => !m.locked);
  const [step, setStep] = useState(firstOpen === -1 ? mcq.length : firstOpen);
  const answer = useAnswerMcq(attempt._id);
  const submit = useSubmitAttempt(attempt._id);
  const { draft, setCq, flush, markClean } = useDraft(attempt);

  const onCqStage = step >= mcq.length;
  const q = mcq[step];
  const right = mcq.filter((m) => m.locked && m.correct).length;
  const answered = mcq.filter((m) => m.locked).length;
  const cqWritten = cq.some((c) => draft.cq[c._id]?.some((t) => t.trim()));

  const pick = (i) => {
    if (!q || q.locked || answer.isPending) return;
    answer.mutate({ questionId: q._id, picked: i }, { onError: (err) => toast.error(errorMessage(err)) });
  };
  const next = () => setStep((s) => Math.min(s + 1, mcq.length));

  // Keyboard: 1-4 to answer, Enter / → for next.
  useEffect(() => {
    const onKey = (e) => {
      if (onCqStage || e.target.closest?.('textarea,input')) return;
      if (['1', '2', '3', '4'].includes(e.key)) pick(Number(e.key) - 1);
      if ((e.key === 'Enter' || e.key === 'ArrowRight') && q?.locked) next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const finish = (withCq = true) => {
    const body = withCq ? { cq: draft.cq } : { cq: Object.fromEntries(cq.map((c) => [c._id, c.parts.map(() => '')])) };
    submit.mutate(body, {
      onSuccess: markClean,
      onError: (err) => toast.error(errorMessage(err)),
    });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {submit.isPending && <GradingOverlay withCq={cqWritten} />}

      <div className="flex items-center gap-2">
        {attempt.topic && attempt.chapter && (
          <Link to={`/learn/${attempt.chapter.slug}/${attempt.topic.slug}`} className="btn btn-ghost btn-sm">
            <ArrowLeft className="size-4" /> টপিকে ফিরে যাও
          </Link>
        )}
        <span className="ml-auto badge badge-lg badge-success badge-soft font-semibold">
          সঠিক {toBn(right)}/{toBn(answered)}
        </span>
      </div>

      <header className="card-soft p-5">
        <p className="text-sm text-base-content/60">টপিক কুইজ</p>
        <h1 className="text-xl font-bold sm:text-2xl">{attempt.topic?.title ?? attempt.title}</h1>
        {/* Progress segments */}
        <div className="mt-4 flex gap-1">
          {mcq.map((m, i) => (
            <button
              key={m._id}
              type="button"
              onClick={() => setStep(i)}
              aria-label={`প্রশ্ন ${toBn(i + 1)}`}
              className={clsx(
                'h-2.5 flex-1 rounded-full transition',
                m.locked ? (m.correct ? 'bg-success' : 'bg-error') : 'bg-base-300',
                i === step && 'ring-2 ring-primary ring-offset-2 ring-offset-base-100'
              )}
            />
          ))}
          {cq.length > 0 && (
            <button
              type="button"
              onClick={() => setStep(mcq.length)}
              aria-label="সৃজনশীল প্রশ্ন"
              className={clsx('h-2.5 w-10 rounded-full bg-secondary/40', onCqStage && 'ring-2 ring-secondary ring-offset-2 ring-offset-base-100')}
            />
          )}
        </div>
      </header>

      {!onCqStage && q && (
        <section key={q._id} className="card-soft space-y-4 p-5 sm:p-6">
          <div className="flex items-center justify-between text-sm text-base-content/60">
            <span>
              প্রশ্ন {toBn(step + 1)} / {toBn(mcq.length)}
            </span>
            <span className="badge badge-ghost badge-sm">{{ easy: 'সহজ', medium: 'মাঝারি', hard: 'কঠিন' }[q.difficulty]}</span>
          </div>
          <McqStem q={q.q} stimulus={q.stimulus} />
          <McqOptions options={q.options} selected={q.picked} answer={q.locked ? q.answer : undefined} why={q.why} onPick={pick} disabled={answer.isPending} />
          {q.locked && <Explanation correct={q.correct} picked={q.picked} answer={q.answer} explain={q.explain} />}

          <div className="flex items-center justify-between gap-2 pt-1">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
              <ArrowLeft className="size-4" /> আগের
            </button>
            {q.locked ? (
              <button type="button" className="btn btn-primary" onClick={next}>
                {step === mcq.length - 1 ? (cq.length ? 'সৃজনশীল প্রশ্নে যাও' : 'শেষ করো') : 'পরের প্রশ্ন'} <ArrowRight className="size-4" />
              </button>
            ) : (
              <button type="button" className="btn btn-ghost btn-sm" onClick={next}>
                এড়িয়ে যাও <SkipForward className="size-4" />
              </button>
            )}
          </div>
        </section>
      )}

      {onCqStage && cq.length > 0 && (
        <section className="card-soft space-y-5 p-5 sm:p-6">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <PenLine className="size-5 text-secondary" /> সৃজনশীল প্রশ্ন
            </h2>
            <p className="mt-1 flex items-start gap-2 text-sm text-base-content/65">
              <Bot className="mt-0.5 size-4 shrink-0" />
              বোর্ড পরীক্ষার মতো করে লেখো। জমা দিলে AI পরীক্ষক নম্বর ও পরামর্শ দেবে, আর পাবে মডেল উত্তর।
            </p>
          </div>
          {cq.map((c) => (
            <CqEditor key={c._id} question={c} values={draft.cq[c._id]} onChange={(i, t) => setCq(c._id, i, t)} />
          ))}
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-base-300 pt-4">
            <button type="button" className="btn btn-ghost" onClick={() => finish(false)} disabled={submit.isPending}>
              সৃজনশীল বাদ দিয়ে জমা দাও
            </button>
            <button type="button" className="btn btn-primary" onClick={() => flush().then(() => finish(true))} disabled={submit.isPending || !cqWritten}>
              <Send className="size-4" /> জমা দাও
            </button>
          </div>
        </section>
      )}

      {onCqStage && cq.length === 0 && (
        <section className="card-soft p-8 text-center">
          <Sparkles className="mx-auto size-10 text-primary" />
          <h2 className="mt-3 text-xl font-bold">সব প্রশ্ন শেষ!</h2>
          <p className="mt-1 text-base-content/60">
            {toBn(mcq.length)}টির মধ্যে {toBn(right)}টি সঠিক। ফলাফল ও ব্যাখ্যা দেখতে জমা দাও।
          </p>
          <button type="button" className="btn btn-primary mt-5" onClick={() => finish(false)} disabled={submit.isPending}>
            <Send className="size-4" /> ফলাফল দেখো
          </button>
        </section>
      )}
    </div>
  );
}
