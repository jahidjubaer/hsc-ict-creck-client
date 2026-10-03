import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { confetti } from '@/lib/confetti';
import clsx from 'clsx';
import {
  ArrowLeft,
  Bot,
  BookOpenCheck,
  ChevronDown,
  Clock,
  NotebookTabs,
  PenLine,
  RotateCcw,
  Target,
  TrendingUp,
  UserCheck,
  Zap,
} from 'lucide-react';
import { Markdown } from '@/components/lesson/Markdown';
import { toBn } from '@/lib/bn';
import { Explanation, McqOptions, McqStem } from './components/McqOptions';
import { Stimulus } from './components/CqEditor';
import { formatClock, letterGrade, partLabel } from './format';
import { useSelfMark, useStartAttempt } from './queries';

function Stat({ icon: Icon, label, value, hint }) {
  return (
    <div className="rounded-xl bg-base-200/70 p-3">
      <p className="flex items-center gap-1.5 text-xs text-base-content/60">
        <Icon className="size-4" /> {label}
      </p>
      <p className="mt-1 text-lg font-bold">{value}</p>
      {hint && <p className="text-xs text-base-content/50">{hint}</p>}
    </div>
  );
}

function SelfMarkForm({ attemptId, question }) {
  const selfMark = useSelfMark(attemptId);
  const [scores, setScores] = useState(question.parts.map(() => 0));
  return (
    <div className="rounded-xl border-2 border-dashed border-warning/60 bg-warning/5 p-4">
      <p className="flex items-center gap-2 font-semibold">
        <UserCheck className="size-5 text-warning" /> নিজে নম্বর দাও
      </p>
      <p className="mt-1 text-sm text-base-content/65">
        {question.error ?? 'AI পরীক্ষক এখন চালু নেই।'} প্রতিটি অংশের মডেল উত্তর ও রুব্রিক দেখে সৎভাবে নিজের নম্বর দাও।
      </p>
      <div className="mt-3 flex flex-wrap gap-3">
        {question.parts.map((p, i) => (
          <label key={i} className="flex items-center gap-2 text-sm">
            <span className="font-semibold">{partLabel(i, p.marks).split(' ')[0]}</span>
            <select
              className="select select-sm w-20"
              value={scores[i]}
              disabled={!p.text.trim()}
              onChange={(e) => setScores((s) => s.map((v, j) => (j === i ? Number(e.target.value) : v)))}
            >
              {Array.from({ length: p.marks + 1 }, (_, n) => (
                <option key={n} value={n}>
                  {toBn(n)}
                </option>
              ))}
            </select>
          </label>
        ))}
        <button
          type="button"
          className="btn btn-warning btn-sm ml-auto"
          disabled={selfMark.isPending}
          onClick={() => selfMark.mutate({ questionId: question._id, scores })}
        >
          {selfMark.isPending && <span className="loading loading-spinner loading-xs" />} নম্বর জমা দাও
        </button>
      </div>
    </div>
  );
}

function CqReview({ attemptId, question, index }) {
  const total = question.parts.reduce((s, p) => s + (p.score ?? 0), 0);
  const max = question.parts.reduce((s, p) => s + p.marks, 0);
  return (
    <section className="card-soft space-y-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-bold">সৃজনশীল প্রশ্ন {toBn(index + 1)}</h3>
        {question.grading === 'ai' && (
          <span className="badge badge-primary badge-soft gap-1">
            <Bot className="size-3.5" /> AI মূল্যায়ন
          </span>
        )}
        {question.grading === 'skipped' && <span className="badge badge-ghost">মূল্যায়িত হয়নি</span>}
        {question.grading !== 'skipped' && question.grading !== 'self' && (
          <span className="ml-auto text-lg font-bold text-primary">
            {toBn(total)}/{toBn(max)}
          </span>
        )}
      </div>
      <Stimulus stimulus={question.stimulus} figure={question.figure} />
      {question.parts.map((p, i) => (
        <div key={i} className="space-y-2 border-t border-base-300 pt-4">
          <div className="flex items-start gap-2">
            <span className="badge badge-primary badge-soft shrink-0 font-bold">{partLabel(i, p.marks)}</span>
            {p.score !== null && p.score !== undefined && question.grading !== 'skipped' && (
              <span className={clsx('badge ml-auto font-bold', p.score === p.marks ? 'badge-success' : p.score === 0 ? 'badge-error' : 'badge-warning')}>
                {toBn(p.score)}/{toBn(p.marks)}
              </span>
            )}
          </div>
          <Markdown className="font-semibold prose-p:my-0">{p.q}</Markdown>
          <div className="rounded-xl bg-base-200/70 p-3 text-sm">
            <p className="mb-1 text-xs font-bold text-base-content/50">তোমার উত্তর</p>
            <p className="whitespace-pre-wrap">{p.text?.trim() || <span className="text-base-content/40">— উত্তর দাওনি —</span>}</p>
          </div>
          {p.feedback && question.grading === 'ai' && (
            <div className="rounded-xl bg-primary/5 p-3 text-sm">
              <p className="flex items-center gap-1 font-semibold text-primary">
                <Bot className="size-4" /> পরীক্ষকের মন্তব্য
              </p>
              <p className="mt-1">{p.feedback}</p>
              {p.missing?.length > 0 && (
                <ul className="mt-2 list-disc pl-5 text-base-content/75">
                  {p.missing.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <details className="group rounded-xl border border-success/30 bg-success/5" open={question.grading === 'self'}>
            <summary className="flex cursor-pointer items-center gap-2 p-3 text-sm font-semibold text-success">
              <BookOpenCheck className="size-4" /> মডেল উত্তর
              <ChevronDown className="ml-auto size-4 transition group-open:rotate-180" />
            </summary>
            <div className="px-3 pb-3">
              <Markdown className="text-sm">{p.answer}</Markdown>
              {p.rubric?.length > 0 && (
                <div className="mt-2 rounded-lg bg-base-100 p-2 text-xs">
                  <p className="font-bold text-base-content/60">নম্বর পাওয়ার শর্ত</p>
                  <ul className="mt-1 list-disc pl-4">
                    {p.rubric.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </details>
        </div>
      ))}
      {question.grading === 'self' && question.parts.some((p) => p.score === null || p.score === undefined) && (
        <SelfMarkForm attemptId={attemptId} question={question} />
      )}
    </section>
  );
}

export function ResultView({ attempt }) {
  const { score, justSubmitted, mcq, cq, breakdown } = attempt;
  const [tab, setTab] = useState(cq.some((c) => c.grading === 'self') ? 'cq' : 'mcq');
  const [filter, setFilter] = useState('all');
  const start = useStartAttempt();
  const grade = letterGrade(score.percent);

  useEffect(() => {
    if (justSubmitted && score.percent >= 80) confetti({ particleCount: 160, spread: 100, origin: { y: 0.6 } });
  }, [justSubmitted, score.percent]);

  const retryBody =
    attempt.kind === 'topic'
      ? { kind: 'topic', topicId: attempt.topic?._id }
      : attempt.kind === 'chapter'
        ? { kind: 'chapter', chapterId: attempt.chapter?._id }
        : { kind: 'full' };

  const wrong = mcq.filter((m) => !m.correct && m.picked !== null);
  const skipped = mcq.filter((m) => m.picked === null);
  const shown = filter === 'wrong' ? wrong : filter === 'skipped' ? skipped : mcq;
  const backLink =
    attempt.kind === 'topic' && attempt.topic && attempt.chapter
      ? { to: `/learn/${attempt.chapter.slug}/${attempt.topic.slug}`, label: 'টপিকে ফিরে যাও' }
      : { to: '/exams', label: 'পরীক্ষা কেন্দ্র' };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link to={backLink.to} className="btn btn-ghost btn-sm">
        <ArrowLeft className="size-4" /> {backLink.label}
      </Link>

      {/* Score header */}
      <header className="card-soft overflow-hidden">
        <div className="bg-gradient-to-br from-primary/15 via-secondary/10 to-transparent p-5 sm:p-7">
          <p className="text-sm text-base-content/60">ফলাফল</p>
          <h1 className="text-xl font-bold sm:text-2xl">{attempt.title}</h1>
          <div className="mt-5 flex flex-wrap items-center gap-6">
            <div
              className={clsx('radial-progress bg-base-100 font-bold', grade.c)}
              style={{ '--value': score.percent, '--size': '7rem', '--thickness': '0.6rem' }}
              role="progressbar"
              aria-valuenow={score.percent}
            >
              <span className="text-center leading-tight">
                <span className="block text-2xl">{toBn(score.percent)}%</span>
                <span className="text-sm">{grade.g}</span>
              </span>
            </div>
            <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-4">
              <Stat icon={Target} label="বহুনির্বাচনি" value={`${toBn(score.mcq)}/${toBn(score.mcqTotal)}`} hint={`ভুল ${toBn(wrong.length)} · বাদ ${toBn(skipped.length)}`} />
              {score.cqTotal > 0 && (
                <Stat icon={PenLine} label="সৃজনশীল" value={`${toBn(score.cq)}/${toBn(score.cqTotal)}`} hint={score.cqPending ? 'নিজে নম্বর দেওয়া বাকি' : undefined} />
              )}
              <Stat icon={Clock} label="সময় লেগেছে" value={formatClock(attempt.durationSec ?? 0)} />
              <Stat
                icon={Zap}
                label="অর্জিত XP"
                value={`+${toBn(attempt.xpAwarded)}`}
                hint={justSubmitted?.previousBest !== null && justSubmitted?.previousBest !== undefined ? `আগের সেরা ${toBn(justSubmitted.previousBest)}%` : 'নতুন রেকর্ড করলে XP বাড়ে'}
              />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 border-t border-base-300 p-4">
          <button type="button" className="btn btn-primary btn-sm" onClick={() => start.mutate(retryBody)} disabled={start.isPending}>
            <RotateCcw className="size-4" /> আবার দাও
          </button>
          {wrong.length > 0 && (
            <Link to="/exams/mistakes" className="btn btn-outline btn-sm">
              <NotebookTabs className="size-4" /> ভুলের খাতা
            </Link>
          )}
        </div>
      </header>

      {score.cqPending && (
        <div className="alert alert-warning alert-soft">
          <UserCheck className="size-5" />
          <span>সৃজনশীল অংশের নম্বর এখনো দেওয়া হয়নি — নিচে মডেল উত্তর দেখে নিজে নম্বর দাও।</span>
        </div>
      )}

      {/* Topic-wise accuracy */}
      {breakdown?.length > 1 && (
        <section className="card-soft p-5">
          <h2 className="flex items-center gap-2 font-bold">
            <TrendingUp className="size-5 text-primary" /> টপিকভিত্তিক বিশ্লেষণ
          </h2>
          <p className="mt-1 text-sm text-base-content/60">সবচেয়ে দুর্বল টপিক উপরে — এগুলো আবার পড়ো।</p>
          <ul className="mt-4 space-y-3">
            {breakdown.map((b, i) => {
              const pct = Math.round((b.correct / b.total) * 100);
              return (
                <li key={b.topic?._id ?? i}>
                  <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                    {b.topic?.chapter?.slug ? (
                      <Link to={`/learn/${b.topic.chapter.slug}/${b.topic.slug}`} className="link-hover link line-clamp-1">
                        {b.topic.title}
                      </Link>
                    ) : (
                      <span>{b.topic?.title ?? 'সাধারণ'}</span>
                    )}
                    <span className="shrink-0 font-semibold">
                      {toBn(b.correct)}/{toBn(b.total)}
                    </span>
                  </div>
                  <progress className={clsx('progress w-full', pct >= 70 ? 'progress-success' : pct >= 40 ? 'progress-warning' : 'progress-error')} value={pct} max="100" />
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Review */}
      <div role="tablist" className="tabs-box tabs w-fit">
        <button type="button" role="tab" className={clsx('tab', tab === 'mcq' && 'tab-active')} onClick={() => setTab('mcq')}>
          বহুনির্বাচনি ({toBn(mcq.length)})
        </button>
        {cq.length > 0 && (
          <button type="button" role="tab" className={clsx('tab', tab === 'cq' && 'tab-active')} onClick={() => setTab('cq')}>
            সৃজনশীল ({toBn(cq.length)})
          </button>
        )}
      </div>

      {tab === 'mcq' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {[
              ['all', `সব (${toBn(mcq.length)})`],
              ['wrong', `ভুল (${toBn(wrong.length)})`],
              ['skipped', `বাদ (${toBn(skipped.length)})`],
            ].map(([k, label]) => (
              <button key={k} type="button" className={clsx('btn btn-sm', filter === k ? 'btn-neutral' : 'btn-ghost')} onClick={() => setFilter(k)}>
                {label}
              </button>
            ))}
          </div>
          {shown.length === 0 && <p className="card-soft p-6 text-center text-base-content/60">এখানে কোনো প্রশ্ন নেই 🎉</p>}
          {shown.map((m) => (
            <section key={m._id} className="card-soft space-y-3 p-4 sm:p-5">
              <McqStem q={m.q} stimulus={m.stimulus} number={toBn(mcq.indexOf(m) + 1)} />
              <McqOptions options={m.options} selected={m.picked} answer={m.answer} why={m.why} />
              <Explanation correct={m.correct} picked={m.picked} answer={m.answer} explain={m.explain} />
            </section>
          ))}
        </div>
      )}

      {tab === 'cq' && (
        <div className="space-y-6">
          {cq.map((c, i) => (
            <CqReview key={c._id} attemptId={attempt._id} question={c} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
