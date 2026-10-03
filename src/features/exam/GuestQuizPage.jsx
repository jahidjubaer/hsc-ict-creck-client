import { useState } from 'react';
import { Link, useParams } from 'react-router';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { ArrowLeft, CheckCircle2, Info, RotateCcw, Send } from 'lucide-react';
import { Markdown } from '@/components/lesson/Markdown';
import { QueryError } from '@/components/ui/QueryError';
import { PageLoader } from '@/components/ui/PageLoader';
import { LoginPrompt } from '@/components/ui/LoginPrompt';
import { errorMessage } from '@/lib/api';
import { toBn } from '@/lib/bn';
import { McqOptions, McqStem, Explanation } from './components/McqOptions';
import { CqEditor, Stimulus } from './components/CqEditor';
import { letterGrade, partLabel } from './format';
import { useGuestCheck, useGuestQuiz } from './queries';

/**
 * /practice/:topicId/:part — a free topic's MCQ quiz or CQ test without an account.
 * MCQ: answer all, then see score, right answers and explanations. CQ: write, then compare with the model answer and
 * marking scheme (AI marking needs an account). Nothing is saved.
 */
export default function GuestQuizPage() {
  const { topicId, part } = useParams();
  const quiz = useGuestQuiz(topicId, part);
  const check = useGuestCheck();
  const [picks, setPicks] = useState({});
  const [texts, setTexts] = useState({});

  if (quiz.isLoading) return <PageLoader />;
  if (quiz.error) {
    if (quiz.error.response?.data?.error?.code === 'LOGIN_REQUIRED') {
      return <LoginPrompt title="এই পরীক্ষা দিতে লগইন করো" message={quiz.error.response.data.error.message} />;
    }
    return <QueryError error={quiz.error} onRetry={quiz.refetch} />;
  }

  const { title, topic, mcq, cq, token } = quiz.data;
  const result = check.data;
  const answered = mcq.filter((q) => picks[q._id] !== undefined).length;
  const backTo = topic?.chapterSlug ? `/learn/${topic.chapterSlug}/${topic.slug}` : '/exams';

  const submit = () =>
    check.mutate(
      { token, mcq: Object.fromEntries(mcq.map((q) => [q._id, picks[q._id] ?? null])) },
      {
        onSuccess: () => window.scrollTo({ top: 0, behavior: 'smooth' }),
        onError: (err) => toast.error(errorMessage(err)),
      }
    );
  const again = () => {
    setPicks({});
    setTexts({});
    check.reset();
    quiz.refetch();
    window.scrollTo(0, 0);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link to={backTo} className="btn btn-ghost btn-sm">
        <ArrowLeft className="size-4" /> টপিকে ফিরে যাও
      </Link>
      <header>
        <h1 className="text-xl leading-snug font-bold sm:text-2xl">{title}</h1>
        <p className="mt-2 flex items-start gap-2 rounded-xl bg-info/10 px-3 py-2 text-sm">
          <Info className="mt-0.5 size-4 shrink-0 text-info" />
          লগইন ছাড়া পরীক্ষা দিচ্ছ — ফল সেভ হবে না। অ্যাকাউন্ট খুললে ফল, XP, ভুলের খাতা আর AI মূল্যায়ন পাবে।
        </p>
      </header>

      {result ? (
        <>
          {result.part === 'mcq' && <McqResult result={result} />}
          {result.part === 'cq' && <CqResult result={result} texts={texts} />}
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-primary" onClick={again} disabled={quiz.isFetching}>
              <RotateCcw className="size-4" /> নতুন প্রশ্নে আবার দাও
            </button>
            <Link to={backTo} className="btn btn-ghost">
              টপিকে ফিরে যাও
            </Link>
          </div>
          <LoginPrompt
            compact
            title="পুরো সিলেবাসে এভাবে পরীক্ষা দিতে চাও?"
            message="অ্যাকাউন্ট খুললে সব টপিক, অধ্যায় পরীক্ষা ও মডেল টেস্ট খুলে যাবে — সৃজনশীলে AI নম্বর দেবে।"
          />
        </>
      ) : part === 'mcq' ? (
        <>
          {mcq.map((q, i) => (
            <section key={q._id} className="card-soft space-y-3 p-4 sm:p-5">
              <McqStem q={q.q} stimulus={q.stimulus} number={toBn(i + 1)} />
              <McqOptions options={q.options} selected={picks[q._id]} onPick={(p) => setPicks((s) => ({ ...s, [q._id]: p }))} />
            </section>
          ))}
          <div className="sticky bottom-3 z-10 flex items-center gap-3 rounded-2xl border border-base-300 bg-base-100/95 p-3 shadow-lg backdrop-blur">
            <span className="text-sm">
              {toBn(answered)}/{toBn(mcq.length)} উত্তর দেওয়া
            </span>
            <button type="button" className="btn btn-primary ml-auto" onClick={submit} disabled={check.isPending}>
              {check.isPending ? <span className="loading loading-spinner loading-sm" /> : <Send className="size-4" />} জমা দাও
            </button>
          </div>
        </>
      ) : (
        <>
          {cq.map((q) => (
            <section key={q._id} className="card-soft p-4 sm:p-6">
              <CqEditor question={q} values={texts[q._id] ?? []} onChange={(i, t) => setTexts((s) => ({ ...s, [q._id]: Object.assign([...(s[q._id] ?? [])], { [i]: t }) }))} />
            </section>
          ))}
          <button type="button" className="btn btn-primary btn-block" onClick={submit} disabled={check.isPending}>
            {check.isPending ? <span className="loading loading-spinner loading-sm" /> : <Send className="size-4" />} জমা দাও ও মডেল উত্তর দেখো
          </button>
        </>
      )}
    </div>
  );
}

function McqResult({ result }) {
  const { score, mcq } = result;
  const grade = letterGrade(score.percent);
  return (
    <>
      <section className="card-soft flex items-center gap-5 p-5">
        <div className={clsx('radial-progress bg-base-100 font-bold', grade.c)} style={{ '--value': score.percent, '--size': '6rem' }} role="progressbar">
          <span className="text-center leading-tight">
            <span className="block text-xl">{toBn(score.percent)}%</span>
            <span className="text-sm">{grade.g}</span>
          </span>
        </div>
        <div>
          <p className="text-sm text-base-content/60">তোমার স্কোর</p>
          <p className="text-2xl font-bold">
            {toBn(score.mcq)}/{toBn(score.mcqTotal)}
          </p>
          <p className="text-sm text-base-content/60">নিচে প্রতিটি প্রশ্নের সঠিক উত্তর ও ব্যাখ্যা দেখো।</p>
        </div>
      </section>
      {mcq.map((q, i) => (
        <section key={q._id} className="card-soft space-y-3 p-4 sm:p-5">
          <McqStem q={q.q} stimulus={q.stimulus} number={toBn(i + 1)} />
          <McqOptions options={q.options} selected={q.picked} answer={q.answer} why={q.why} />
          <Explanation correct={q.correct} picked={q.picked} answer={q.answer} explain={q.explain} />
        </section>
      ))}
    </>
  );
}

function CqResult({ result, texts }) {
  return result.cq.map((q) => (
    <section key={q._id} className="card-soft space-y-5 p-4 sm:p-6">
      <Stimulus stimulus={q.stimulus} figure={q.figure} />
      <p className="flex items-center gap-2 text-sm font-semibold text-success">
        <CheckCircle2 className="size-4" /> নিজের উত্তর মডেল উত্তর ও নম্বর পাওয়ার শর্তের সাথে মিলিয়ে দেখো
      </p>
      {q.parts.map((p, i) => (
        <div key={i} className="space-y-2">
          <span className="badge badge-primary badge-soft font-bold">{partLabel(i, p.marks)}</span>
          <Markdown className="font-semibold prose-p:my-0">{p.q}</Markdown>
          <div className="rounded-xl bg-base-200/70 p-3 text-sm">
            <p className="mb-1 text-xs font-bold text-base-content/60">তোমার উত্তর</p>
            <p className="whitespace-pre-wrap">{texts[q._id]?.[i]?.trim() || '— লেখোনি —'}</p>
          </div>
          <div className="rounded-xl border border-success/30 bg-success/5 p-3 text-sm">
            <p className="mb-1 text-xs font-bold text-success">মডেল উত্তর</p>
            <Markdown>{p.answer}</Markdown>
          </div>
          {p.rubric?.length > 0 && (
            <div className="rounded-xl bg-warning/10 p-3 text-sm">
              <p className="mb-1 text-xs font-bold text-warning-content/80">নম্বর পাওয়ার শর্ত</p>
              <Markdown>{Array.isArray(p.rubric) ? p.rubric.map((r) => `- ${r}`).join('\n') : p.rubric}</Markdown>
            </div>
          )}
        </div>
      ))}
    </section>
  ));
}
