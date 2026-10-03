import { useState } from 'react';
import { Link } from 'react-router';
import clsx from 'clsx';
import { ArrowLeft, CheckCircle2, NotebookTabs, PartyPopper, RotateCcw } from 'lucide-react';
import { QueryError } from '@/components/ui/QueryError';
import { toBn } from '@/lib/bn';
import { Explanation, McqOptions, McqStem } from './components/McqOptions';
import { LETTERS } from './format';
import { useMistakes, useRetryMistake } from './queries';

function MistakeCard({ mistake }) {
  const retry = useRetryMistake();
  const [result, setResult] = useState(null);
  const { question } = mistake;

  const pick = (i) => retry.mutate({ id: mistake._id, picked: i }, { onSuccess: (res) => setResult({ ...res, picked: i }) });

  return (
    <section className={clsx('card-soft space-y-3 p-4 transition sm:p-5', result?.resolved && 'opacity-60')}>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {mistake.chapterNumber && <span className="badge badge-ghost badge-sm">অধ্যায় {toBn(mistake.chapterNumber)}</span>}
        <span className="badge badge-error badge-soft badge-sm">{toBn(mistake.wrongCount)} বার ভুল</span>
        {mistake.lastPicked !== undefined && !result && (
          <span className="text-base-content/50">শেষবার দিয়েছিলে: {LETTERS[mistake.lastPicked]}</span>
        )}
        <span className="ml-auto flex items-center gap-1 text-base-content/55">
          {[0, 1].map((n) => (
            <CheckCircle2 key={n} className={clsx('size-4', (result?.rightStreak ?? mistake.rightStreak) > n ? 'text-success' : 'text-base-300')} />
          ))}
        </span>
      </div>
      <McqStem q={question.q} stimulus={question.stimulus} />
      <McqOptions options={question.options} selected={result?.picked} answer={result?.answer} why={result?.why} onPick={pick} disabled={retry.isPending} />
      {result && (
        <>
          <Explanation correct={result.correct} picked={result.picked} answer={result.answer} explain={result.explain} />
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">
              {result.resolved ? '🎉 আয়ত্ত হয়েছে — খাতা থেকে সরানো হলো' : result.correct ? 'আরেকবার ঠিক করলে খাতা থেকে সরে যাবে' : 'চিন্তা নেই, পরে আবার চেষ্টা করো'}
            </p>
            {!result.resolved && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setResult(null)}>
                <RotateCcw className="size-4" /> আবার
              </button>
            )}
          </div>
        </>
      )}
    </section>
  );
}

export default function MistakesPage() {
  const { data, isLoading, error, refetch } = useMistakes();
  const [chapter, setChapter] = useState('all');

  if (isLoading) return <div className="skeleton h-64 rounded-box" />;
  if (error) return <QueryError error={error} onRetry={refetch} />;

  const chapters = [...new Set(data.mistakes.map((m) => m.chapterNumber).filter(Boolean))].sort();
  const list = chapter === 'all' ? data.mistakes : data.mistakes.filter((m) => m.chapterNumber === chapter);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link to="/exams" className="btn btn-ghost btn-sm">
        <ArrowLeft className="size-4" /> পরীক্ষা কেন্দ্র
      </Link>
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <NotebookTabs className="size-7 text-rose-500" /> ভুলের খাতা
        </h1>
        <p className="mt-1 text-base-content/65">
          ভুল থেকেই শেখা সবচেয়ে পাকা হয়। পরপর দুবার ঠিক উত্তর দিলে প্রশ্নটি আয়ত্ত হয়েছে ধরা হবে। এ পর্যন্ত আয়ত্ত করেছ {toBn(data.resolvedCount)}টি।
        </p>
      </header>

      {chapters.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <button type="button" className={clsx('btn btn-sm', chapter === 'all' ? 'btn-neutral' : 'btn-ghost')} onClick={() => setChapter('all')}>
            সব ({toBn(data.mistakes.length)})
          </button>
          {chapters.map((n) => (
            <button key={n} type="button" className={clsx('btn btn-sm', chapter === n ? 'btn-neutral' : 'btn-ghost')} onClick={() => setChapter(n)}>
              অধ্যায় {toBn(n)}
            </button>
          ))}
        </div>
      )}

      {list.length === 0 ? (
        <div className="card-soft p-10 text-center">
          <PartyPopper className="mx-auto size-12 text-primary" />
          <h2 className="mt-3 text-xl font-bold">খাতা একদম খালি!</h2>
          <p className="mt-1 text-base-content/60">কুইজ বা পরীক্ষায় যে প্রশ্ন ভুল করবে, সেগুলো এখানে জমা হবে।</p>
          <Link to="/learn" className="btn btn-primary mt-5">
            পড়াশোনায় যাও
          </Link>
        </div>
      ) : (
        list.map((m) => <MistakeCard key={m._id} mistake={m} />)
      )}
    </div>
  );
}
