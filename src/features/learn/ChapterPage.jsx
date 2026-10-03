import { Link, useParams } from 'react-router';
import clsx from 'clsx';
import {
  ArrowLeft,
  Bookmark,
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  Clock,
  Crown,
  Flame,
  Hourglass,
  Lock,
  ClipboardList,
  Play,
  Target,
} from 'lucide-react';
import { ChapterIcon } from '@/components/ui/ChapterIcon';
import { QueryError } from '@/components/ui/QueryError';
import { toBn } from '@/lib/bn';
import { useChapter } from './queries';
import { useStartAttempt } from '@/features/exam/queries';

function TopicStatusIcon({ topic }) {
  if (!topic.published) return <Hourglass className="size-5 text-base-content/30" />;
  if (topic.locked) return <Lock className="size-5 text-base-content/40" />;
  if (topic.progress?.status === 'completed') return <CheckCircle2 className="size-5 text-success" />;
  if (topic.progress) return <CircleDashed className="size-5 text-primary" />;
  return <span className="size-5 rounded-full border-2 border-base-300" />;
}

export default function ChapterPage() {
  const { chapterSlug } = useParams();
  const { data, isLoading, error, refetch } = useChapter(chapterSlug);
  const startTest = useStartAttempt();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-48 rounded-box" />
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="skeleton h-16 rounded-box" />
        ))}
      </div>
    );
  }
  if (error) return <QueryError error={error} onRetry={refetch} />;

  const { chapter, topics, access } = data;
  const published = topics.filter((t) => t.published);
  const done = published.filter((t) => t.progress?.status === 'completed').length;
  const pct = published.length ? Math.round((done / published.length) * 100) : 0;
  const nextTopic = published.find((t) => !t.locked && t.progress?.status !== 'completed');

  return (
    <div className="space-y-6">
      <Link to="/learn" className="btn btn-ghost btn-sm">
        <ArrowLeft className="size-4" /> সব অধ্যায়
      </Link>

      <header className={`relative overflow-hidden rounded-box bg-gradient-to-br ${chapter.color} p-6 text-white sm:p-8`}>
        <div className="absolute -right-8 -bottom-10 opacity-15">
          <ChapterIcon name={chapter.icon} className="size-48" />
        </div>
        <div className="relative flex items-center gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white/20 backdrop-blur">
            <ChapterIcon name={chapter.icon} className="size-7" />
          </span>
          <div>
            <p className="opacity-90">অধ্যায় {toBn(chapter.number)} · বই পৃষ্ঠা {chapter.bookPages}</p>
            <h1 className="text-2xl leading-snug font-bold sm:text-3xl">{chapter.title}</h1>
          </div>
        </div>
        <div className="relative mt-6 flex flex-wrap items-center gap-4">
          <div className="radial-progress bg-white/15 text-white" style={{ '--value': pct, '--size': '4rem' }} role="progressbar">
            <span className="text-sm font-bold">{toBn(pct)}%</span>
          </div>
          <div className="text-sm opacity-95">
            <p>
              {toBn(done)}/{toBn(published.length)} টপিক সম্পন্ন
            </p>
            <p>মোট {toBn(topics.length)}টি টপিক</p>
          </div>
          {nextTopic && (
            <Link to={nextTopic.slug} className="btn ml-auto border-none bg-white text-base-content hover:bg-white/90">
              {done ? 'পড়া চালিয়ে যাও' : 'শুরু করো'} <ChevronRight className="size-4" />
            </Link>
          )}
        </div>
      </header>

      {!access && (
        <div className="alert alert-warning alert-soft">
          <Crown className="size-5" />
          <span>ফ্রি টপিক ছাড়া বাকি সব পড়তে প্রিমিয়াম প্যাকেজ প্রয়োজন।</span>
          <Link to="/pricing" className="btn btn-sm btn-warning">
            প্যাকেজ দেখো
          </Link>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <h2 className="mb-3 text-lg font-bold">টপিকসমূহ</h2>
          <ol className="card-soft divide-y divide-base-300 overflow-hidden">
            {topics.map((t) => {
              const content = (
                <>
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-base-200 text-sm font-bold">{toBn(t.order)}</span>
                  <div className="min-w-0 flex-1">
                    <p className={clsx('font-semibold', !t.published && 'text-base-content/50')}>{t.title}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-base-content/55">
                      <span className="flex items-center gap-1">
                        <Clock className="size-3.5" /> {toBn(t.estMinutes)} মিনিট
                      </span>
                      {t.bookRef && <span>বই: {t.bookRef}</span>}
                      {t.important && (
                        <span className="flex items-center gap-1 text-orange-600">
                          <Flame className="size-3.5" /> বোর্ডে গুরুত্বপূর্ণ
                        </span>
                      )}
                      {t.isFree && <span className="badge badge-success badge-xs">ফ্রি</span>}
                      {!t.published && <span className="badge badge-ghost badge-xs">শীঘ্রই আসছে</span>}
                      {t.progress?.bookmarked && <Bookmark className="size-3.5 fill-primary text-primary" />}
                      {typeof t.progress?.bestQuizScore === 'number' && (
                        <span className="badge badge-success badge-soft badge-xs">কুইজ {toBn(t.progress.bestQuizScore)}%</span>
                      )}
                    </p>
                  </div>
                  <TopicStatusIcon topic={t} />
                </>
              );
              return (
                <li key={t._id}>
                  {t.locked ? (
                    <div className="flex items-center gap-3 p-4 opacity-80">{content}</div>
                  ) : (
                    <Link to={t.slug} className="flex items-center gap-3 p-4 transition hover:bg-base-200/60">
                      {content}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </section>

        <aside className="space-y-4">
          <div className="card-soft p-5">
            <h2 className="flex items-center gap-2 font-bold">
              <Target className="size-5 text-primary" /> এই অধ্যায় শেষে তুমি পারবে
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              {chapter.learningOutcomes?.map((o) => (
                <li key={o} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" /> {o}
                </li>
              ))}
            </ul>
          </div>
          <div className="card-soft p-5">
            <h2 className="flex items-center gap-2 font-bold">
              <ClipboardList className="size-5 text-primary" /> অধ্যায় পরীক্ষা
            </h2>
            <p className="mt-2 text-sm text-base-content/70">সব টপিক শেষ হলে বোর্ড প্রশ্নের আদলে পূর্ণাঙ্গ অধ্যায় পরীক্ষা দিতে পারবে।</p>
            {published.length > 0 && done >= published.length ? (
              <button
                type="button"
                className="btn btn-primary btn-sm mt-3 w-full"
                disabled={startTest.isPending}
                onClick={() => startTest.mutate({ kind: 'chapter', chapterId: chapter._id })}
              >
                <Play className="size-4" /> পরীক্ষা শুরু করো
              </button>
            ) : (
              <button type="button" className="btn btn-outline btn-sm mt-3 w-full" disabled>
                <Lock className="size-4" /> {toBn(published.length - done)}টি টপিক বাকি
              </button>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
