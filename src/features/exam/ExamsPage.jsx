import { Link } from 'react-router';
import clsx from 'clsx';
import {
  Bot,
  ChevronRight,
  ClipboardList,
  Crown,
  GraduationCap,
  History,
  Lock,
  NotebookTabs,
  Play,
  Timer,
  Trophy,
  UserCheck,
} from 'lucide-react';
import { ChapterIcon } from '@/components/ui/ChapterIcon';
import { QueryError } from '@/components/ui/QueryError';
import { bnDate, toBn } from '@/lib/bn';
import { useExamOverview, useStartAttempt } from './queries';
import { letterGrade } from './format';

const KIND_LABEL = { topic: 'টপিক কুইজ', chapter: 'অধ্যায় পরীক্ষা', full: 'মডেল টেস্ট' };

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
          <span>অধ্যায় পরীক্ষা ও মডেল টেস্ট দিতে প্রিমিয়াম প্যাকেজ প্রয়োজন। ফ্রি টপিকের কুইজ সবার জন্য খোলা।</span>
          <Link to="/pricing" className="btn btn-sm btn-warning">
            প্যাকেজ দেখো
          </Link>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Full-book model test */}
        <section className="relative overflow-hidden rounded-box bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-6 text-white lg:col-span-2">
          <GraduationCap className="absolute -right-6 -bottom-8 size-44 opacity-15" />
          <p className="text-sm opacity-90">পূর্ণাঙ্গ বই</p>
          <h2 className="text-2xl font-bold">{templates.full.title}</h2>
          <p className="mt-2 max-w-md text-sm opacity-90">
            সব অধ্যায় থেকে বোর্ডের মতো {toBn(templates.full.mcq)}টি প্রশ্ন, {toBn(templates.full.timeLimitMin)} মিনিট। প্রতিবার নতুন প্রশ্নসেট।
          </p>
          <div className="relative mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="btn border-none bg-white text-indigo-700 hover:bg-white/90"
              disabled={!full.ready || !access || busy}
              onClick={() => start.mutate({ kind: 'full' })}
            >
              <Play className="size-4" /> শুরু করো
            </button>
            {!full.ready && <span className="text-sm opacity-90">প্রশ্নব্যাংক তৈরি হচ্ছে ({toBn(full.mcqCount)}/{toBn(templates.full.mcq)})</span>}
            {full.best !== null && (
              <span className="badge border-none bg-white/20 text-white">
                <Trophy className="size-3.5" /> সেরা {toBn(full.best)}%
              </span>
            )}
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

      {/* Chapter tests */}
      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-lg font-bold">অধ্যায় পরীক্ষা</h2>
          <p className="flex items-center gap-1 text-sm text-base-content/60">
            <Timer className="size-4" /> {toBn(templates.chapter.mcq)} MCQ + {toBn(templates.chapter.cq)}টি থেকে {toBn(templates.chapter.cqChoose)}টি সৃজনশীল ·{' '}
            {toBn(templates.chapter.timeLimitMin)} মিনিট
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {chapters.map((c) => {
            const left = c.topicsPublished - c.topicsCompleted;
            const can = access && c.ready && c.unlocked;
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
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="badge badge-ghost badge-sm">{toBn(c.mcqCount)} MCQ</span>
                  <span className="badge badge-ghost badge-sm">{toBn(c.cqCount)} সৃজনশীল</span>
                  <ScorePill percent={c.best} />
                </div>
                <div className="mt-auto pt-4">
                  {!c.ready ? (
                    <button type="button" className="btn btn-sm btn-block" disabled>
                      প্রশ্নব্যাংক তৈরি হচ্ছে
                    </button>
                  ) : !c.unlocked ? (
                    <Link to={`/learn/${c.slug}`} className="btn btn-outline btn-sm btn-block">
                      <Lock className="size-4" /> আগে {toBn(left)}টি টপিক শেষ করো
                    </Link>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm btn-block"
                      disabled={!can || busy}
                      onClick={() => start.mutate({ kind: 'chapter', chapterId: c._id })}
                    >
                      <Play className="size-4" /> {c.attempts ? 'আবার পরীক্ষা দাও' : 'পরীক্ষা শুরু করো'}
                    </button>
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
