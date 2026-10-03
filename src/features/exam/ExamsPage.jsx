import { Link } from 'react-router';
import clsx from 'clsx';
import {
  Bot,
  ChevronRight,
  ClipboardList,
  Crown,
  GraduationCap,
  History,
  ListChecks,
  Lock,
  NotebookTabs,
  PenLine,
  Play,
  Trophy,
  UserCheck,
} from 'lucide-react';
import { ChapterIcon } from '@/components/ui/ChapterIcon';
import { QueryError } from '@/components/ui/QueryError';
import { bnDate, toBn } from '@/lib/bn';
import { useExamOverview, useStartAttempt } from './queries';
import { letterGrade } from './format';
import { KIND_LABEL } from './kinds';

/** 25 → "২৫ মিনিট", 150 → "২ ঘণ্টা ৩০ মিনিট" */
const duration = (min) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return [h && `${toBn(h)} ঘণ্টা`, m && `${toBn(m)} মিনিট`].filter(Boolean).join(' ');
};

function ScorePill({ percent }) {
  if (percent === null || percent === undefined) return null;
  const g = letterGrade(percent);
  return (
    <span className={clsx('badge badge-soft gap-1 font-bold', percent >= 60 ? 'badge-success' : percent >= 33 ? 'badge-warning' : 'badge-error')}>
      {toBn(percent)}% · {g.g}
    </span>
  );
}

export default function ExamsPage() {
  const { data, isLoading, error, refetch } = useExamOverview();
  const start = useStartAttempt();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-40 rounded-box" />
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="skeleton h-40 rounded-box" />
          ))}
        </div>
      </div>
    );
  }
  if (error) return <QueryError error={error} onRetry={refetch} />;

  const { chapters, full, mistakes, recent, access, aiGrading, templates } = data;
  const busy = start.isPending;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl">
          <ClipboardList className="size-7 text-primary" /> পরীক্ষা কেন্দ্র
        </h1>
        <p className="mt-1 text-base-content/65">বোর্ড পরীক্ষার আদলে নিজেকে যাচাই করো — সময় ধরে, নম্বরসহ, ব্যাখ্যাসহ।</p>
      </header>

      {!access && (
        <div className="alert alert-warning alert-soft">
          <Crown className="size-5" />
          <span>অধ্যায় পরীক্ষা ও মডেল টেস্ট দিতে প্রিমিয়াম প্যাকেজ প্রয়োজন। প্রতিটি অধ্যায়ের প্রথম (ফ্রি) টপিকের কুইজ সবার জন্য খোলা।</span>
          <Link to="/pricing" className="btn btn-sm btn-warning">
            প্যাকেজ দেখো
          </Link>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Full-book model tests: MCQ and CQ separately, like the two board papers */}
        <section className="relative overflow-hidden rounded-box bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-6 text-white lg:col-span-2">
          <GraduationCap className="absolute -right-6 -bottom-8 size-44 opacity-15" />
          <p className="text-sm opacity-90">পূর্ণাঙ্গ বই · বোর্ডের প্যাটার্নে</p>
          <h2 className="text-2xl font-bold">মডেল টেস্ট</h2>
          <div className="relative mt-4 grid gap-3 sm:grid-cols-2">
            {[
              { kind: 'full', test: full.mcqTest, icon: ListChecks, label: 'MCQ মডেল টেস্ট', info: `${toBn(templates.full.mcq)}টি প্রশ্ন · ${duration(templates.full.timeLimitMin)}` },
              {
                kind: 'full-cq',
                test: full.cqTest,
                icon: PenLine,
                label: 'সৃজনশীল মডেল টেস্ট',
                info: `${toBn(templates['full-cq'].cq)}টি থেকে ${toBn(templates['full-cq'].cqChoose)}টি · ${duration(templates['full-cq'].timeLimitMin)}`,
              },
            ].map(({ kind, test, icon: Icon, label, info }) => (
              <div key={kind} className="rounded-2xl bg-white/12 p-4 backdrop-blur-sm">
                <p className="flex items-center gap-2 font-bold">
                  <Icon className="size-5" /> {label}
                </p>
                <p className="mt-1 text-sm opacity-90">{info}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-sm border-none bg-white text-indigo-700 hover:bg-white/90"
                    disabled={!test.ready || !access || busy}
                    onClick={() => start.mutate({ kind })}
                  >
                    <Play className="size-4" /> শুরু করো
                  </button>
                  {test.best !== null && (
                    <span className="badge border-none bg-white/20 text-white">
                      <Trophy className="size-3.5" /> সেরা {toBn(test.best)}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Mistake book */}
        <Link to="/exams/mistakes" className="card-soft group flex flex-col justify-between p-6 transition hover:shadow-md">
          <div>
            <NotebookTabs className="size-8 text-rose-500" />
            <h2 className="mt-3 text-lg font-bold">ভুলের খাতা</h2>
            <p className="mt-1 text-sm text-base-content/65">যে প্রশ্নগুলো ভুল করেছ, সেগুলো আবার অনুশীলন করো। পরপর দুবার ঠিক হলে খাতা থেকে মুছে যাবে।</p>
          </div>
          <p className="mt-4 flex items-center justify-between font-semibold">
            <span className="text-2xl text-rose-500">{toBn(mistakes)}টি</span>
            <ChevronRight className="size-5 transition group-hover:translate-x-1" />
          </p>
        </Link>
      </div>

      {/* Chapter tests: MCQ and CQ separately */}
      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-lg font-bold">অধ্যায় পরীক্ষা</h2>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-base-content/60">
            <span className="flex items-center gap-1">
              <ListChecks className="size-4" /> MCQ: {toBn(templates['chapter-mcq'].mcq)}টি · {duration(templates['chapter-mcq'].timeLimitMin)}
            </span>
            <span className="flex items-center gap-1">
              <PenLine className="size-4" /> সৃজনশীল: {toBn(templates['chapter-cq'].cq)}টি থেকে {toBn(templates['chapter-cq'].cqChoose)}টি ·{' '}
              {duration(templates['chapter-cq'].timeLimitMin)}
            </span>
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {chapters.map((c) => {
            const left = c.topicsPublished - c.topicsCompleted;
            return (
              <article key={c._id} className="card-soft flex flex-col p-5">
                <div className="flex items-start gap-3">
                  <span className={`grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${c.color} text-white`}>
                    <ChapterIcon name={c.icon} className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs text-base-content/55">অধ্যায় {toBn(c.number)}</p>
                    <h3 className="line-clamp-2 leading-snug font-semibold">{c.title}</h3>
                  </div>
                </div>
                <div className="mt-auto pt-4">
                  {!c.unlocked ? (
                    <Link to={`/learn/${c.slug}`} className="btn btn-outline btn-sm btn-block">
                      <Lock className="size-4" /> আগে {toBn(left)}টি টপিক শেষ করো
                    </Link>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { kind: 'chapter-mcq', test: c.mcqTest, icon: ListChecks, label: 'MCQ', count: c.mcqCount },
                        { kind: 'chapter-cq', test: c.cqTest, icon: PenLine, label: 'সৃজনশীল', count: c.cqCount },
                      ].map(({ kind, test, icon: Icon, label, count }) => (
                        <div key={kind} className="flex flex-col items-stretch gap-1.5">
                          <button
                            type="button"
                            className={clsx('btn btn-sm', kind === 'chapter-mcq' ? 'btn-primary' : 'btn-secondary')}
                            disabled={!access || !test.ready || busy}
                            onClick={() => start.mutate({ kind, chapterId: c._id })}
                            title={test.ready ? undefined : 'প্রশ্নব্যাংক তৈরি হচ্ছে'}
                          >
                            <Icon className="size-4" /> {label}
                          </button>
                          <span className="flex min-h-5 items-center justify-center gap-1 text-xs text-base-content/55">
                            {test.best !== null ? <ScorePill percent={test.best} /> : `${toBn(count)}টি প্রশ্ন`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* History */}
        <section className="card-soft p-5 lg:col-span-2">
          <h2 className="flex items-center gap-2 font-bold">
            <History className="size-5 text-primary" /> সাম্প্রতিক পরীক্ষা
          </h2>
          {recent.length === 0 ? (
            <p className="mt-4 text-sm text-base-content/60">এখনো কোনো পরীক্ষা দাওনি। কোনো টপিক পড়া শেষ করে টপিক কুইজ দিয়ে শুরু করো!</p>
          ) : (
            <ul className="mt-3 divide-y divide-base-300">
              {recent.map((a) => (
                <li key={a._id}>
                  <Link to={`/exams/attempts/${a._id}`} className="flex items-center gap-3 py-3 transition hover:opacity-80">
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 font-medium">{a.title}</p>
                      <p className="text-xs text-base-content/55">
                        {KIND_LABEL[a.kind]} · {bnDate(a.submittedAt ?? a.startedAt, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
                      </p>
                    </div>
                    {a.status === 'submitted' ? (
                      <ScorePill percent={a.score.percent} />
                    ) : (
                      <span className="badge badge-info badge-soft">চলমান</span>
                    )}
                    <ChevronRight className="size-4 text-base-content/40" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* How CQ is graded */}
        <section className="card-soft p-5">
          <h2 className="flex items-center gap-2 font-bold">
            {aiGrading ? <Bot className="size-5 text-primary" /> : <UserCheck className="size-5 text-warning" />} সৃজনশীল মূল্যায়ন
          </h2>
          <p className="mt-2 text-sm text-base-content/70">
            {aiGrading
              ? 'তোমার লেখা উত্তর AI পরীক্ষক বোর্ডের নম্বর বণ্টন (ক১, খ২, গ৩, ঘ৪) মেনে মূল্যায়ন করে, কী বাদ পড়েছে তা বলে দেয় এবং মডেল উত্তর দেখায়।'
              : 'AI পরীক্ষক শীঘ্রই চালু হবে। এখন জমা দেওয়ার পর মডেল উত্তর ও নম্বর পাওয়ার শর্ত দেখে নিজেই নম্বর দেবে।'}
          </p>
          <ul className="mt-3 space-y-1 text-sm">
            <li>ক — জ্ঞানমূলক (১)</li>
            <li>খ — অনুধাবনমূলক (২)</li>
            <li>গ — প্রয়োগমূলক (৩)</li>
            <li>ঘ — উচ্চতর দক্ষতা (৪)</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
