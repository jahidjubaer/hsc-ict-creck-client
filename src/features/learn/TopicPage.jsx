import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import { confetti } from '@/lib/confetti';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  CheckCircle2,
  Clock,
  Flame,
  Hourglass,
  ListChecks,
  NotebookPen,
  PartyPopper,
  PenLine,
} from 'lucide-react';
import { BlockRenderer } from '@/components/lesson/BlockRenderer';
import { AudioBar } from '@/components/lesson/AudioBar';
import { Highlighter } from '@/components/lesson/Highlighter';
import { highlightSupported } from '@/components/lesson/highlightSupport';
import { buildNarration } from '@/components/lesson/narration';
import { useSpeech } from '@/components/lesson/useSpeech';
import { QueryError } from '@/components/ui/QueryError';
import { Paywall } from '@/components/ui/Paywall';
import { toBn } from '@/lib/bn';
import { useCompleteTopic, useTopic, useUpdateProgress } from './queries';
import { useReadingTracker } from './useReadingTracker';
import { KeyTerms } from './KeyTerms';
import { NotesDialog } from './NotesDialog';
import { useStartAttempt } from '@/features/exam/queries';
import { useAuthStore } from '@/store/auth';
import { LoginPrompt } from '@/components/ui/LoginPrompt';

function Gate({ error }) {
  const code = error?.response?.data?.error?.code;
  if (code === 'PAYMENT_REQUIRED') return <Paywall title="প্রিমিয়াম টপিক" message={error.response.data.error.message} />;
  if (code === 'LOGIN_REQUIRED') {
    return <LoginPrompt title="এই টপিক পড়তে লগইন করো" message="প্রতিটি অধ্যায়ের প্রথম টপিক লগইন ছাড়াই পড়া যায়। বাকি সব টপিক খুলতে ফ্রি অ্যাকাউন্ট খোলো।" />;
  }
  if (code === 'COMING_SOON') {
    return (
      <div className="card-soft mx-auto max-w-lg p-8 text-center">
        <Hourglass className="mx-auto size-12 text-primary" />
        <h1 className="mt-4 text-2xl font-bold">শীঘ্রই আসছে</h1>
        <p className="mt-2 text-base-content/70">এই টপিকের কনটেন্ট তৈরি হচ্ছে। ততক্ষণ অন্য টপিক পড়ো।</p>
        <Link to=".." relative="path" className="btn btn-primary mt-6">
          অধ্যায়ে ফিরে যাও
        </Link>
      </div>
    );
  }
  return <QueryError error={error} />;
}

export default function TopicPage() {
  const { chapterSlug, topicSlug } = useParams();
  const { data, isLoading, error } = useTopic(chapterSlug, topicSlug);
  const articleRef = useRef(null);
  const [notesOpen, setNotesOpen] = useState(false);

  const topic = data?.topic;
  // Visitors (free topics only): no progress, bookmarks, notes or highlights — those belong to an account.
  const guest = !useAuthStore((s) => s.user);
  const readPct = useReadingTracker(guest ? undefined : topic?._id, articleRef);
  const chunks = useMemo(() => (topic ? buildNarration(topic.blocks, topic.title) : []), [topic]);
  const speech = useSpeech(chunks);
  const complete = useCompleteTopic();
  const update = useUpdateProgress(topic?._id);
  const startQuiz = useStartAttempt();
  // MCQ quiz and CQ practice are separate tests (older cached responses have no `tests`)
  const tests = data?.tests ?? { mcq: { count: 1, best: data?.progress?.bestQuizScore ?? null }, cq: { count: 0, best: null } };
  const busyKind = startQuiz.isPending ? startQuiz.variables?.kind : null;

  // Optimistic bookmark state, scoped to the topic it was set on.
  const [bookmarkOverride, setBookmarkOverride] = useState({ id: null, value: false });
  const bookmarked = bookmarkOverride.id === topic?._id ? bookmarkOverride.value : Boolean(data?.progress?.bookmarked);
  const setBookmarked = (value) => setBookmarkOverride({ id: topic._id, value });
  // Highlights: optimistic local copy, scoped to the topic like the bookmark.
  const blocksRef = useRef(null);
  const [highlightOverride, setHighlightOverride] = useState({ id: null, list: [] });
  const highlights = highlightOverride.id === topic?._id ? highlightOverride.list : (data?.progress?.highlights ?? []);
  const saveHighlights = (list) => {
    const previous = highlights;
    setHighlightOverride({ id: topic._id, list });
    update.mutate(
      { highlights: list },
      {
        onError: () => {
          setHighlightOverride({ id: topic._id, list: previous });
          toast.error('হাইলাইট সংরক্ষণ করা যায়নি');
        },
      },
    );
  };
  const completed = data?.progress?.status === 'completed' || (complete.isSuccess && complete.variables === topic?._id);
  useEffect(() => {
    window.scrollTo(0, 0); // block body: scrollTo returns a Promise in newer browsers
  }, [topicSlug]);

  // Keep the narrated block in view.
  useEffect(() => {
    if (speech.activeBlock < 0) return;
    document.querySelector(`[data-block="${speech.activeBlock}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [speech.activeBlock]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="skeleton h-10 w-2/3" />
        <div className="skeleton h-16" />
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="skeleton h-24" />
        ))}
      </div>
    );
  }
  if (error) return <Gate error={error} />;

  const { chapter, siblings, prev, next } = data;

  const toggleBookmark = () => {
    const value = !bookmarked;
    setBookmarked(value);
    update.mutate({ bookmarked: value }, { onError: () => setBookmarked(!value) });
    toast.success(value ? 'বুকমার্ক করা হয়েছে' : 'বুকমার্ক সরানো হয়েছে');
  };

  const markComplete = () =>
    complete.mutate(topic._id, {
      onSuccess: (res) => {
        if (res.xpAwarded) {
          confetti({ particleCount: 140, spread: 90, origin: { y: 0.7 } });
          toast.success(`অভিনন্দন! +${toBn(res.xpAwarded)} XP`, { icon: '🎉' });
        }
      },
      onError: () => toast.error('সংরক্ষণ করা যায়নি, আবার চেষ্টা করো'),
    });

  return (
    <>
      {/* Reading progress */}
      <div className="fixed inset-x-0 top-0 z-50 h-1 bg-transparent">
        <div className="h-full bg-gradient-to-r from-primary to-secondary transition-[width]" style={{ width: `${completed ? 100 : readPct}%` }} />
      </div>

      <div className="grid gap-8 xl:grid-cols-[1fr_16rem]">
        <article ref={articleRef} className="mx-auto w-full max-w-3xl min-w-0">
          <nav className="mb-3 flex items-center gap-1 text-sm text-base-content/60">
            <Link to={`/learn/${chapter.slug}`} className="link-hover link flex items-center gap-1">
              <ArrowLeft className="size-4" /> অধ্যায় {toBn(chapter.number)}
            </Link>
            <span>/</span>
            <span>টপিক {toBn(topic.order)}</span>
          </nav>

          <header className="mb-6">
            <h1 className="text-3xl leading-tight font-bold sm:text-4xl">{topic.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <span className="badge badge-ghost gap-1">
                <Clock className="size-3.5" /> {toBn(topic.estMinutes)} মিনিট
              </span>
              {topic.bookRef && <span className="badge badge-ghost">বই: {topic.bookRef}</span>}
              {topic.important && (
                <span className="badge gap-1 border-orange-500/30 bg-orange-500/10 text-orange-600">
                  <Flame className="size-3.5" /> বোর্ডে গুরুত্বপূর্ণ
                </span>
              )}
              {completed && (
                <span className="badge badge-success gap-1">
                  <CheckCircle2 className="size-3.5" /> সম্পন্ন
                </span>
              )}
              <div className={clsx('ml-auto flex gap-1', guest && 'hidden')}>
                <button type="button" onClick={toggleBookmark} className="btn btn-ghost btn-sm btn-square" aria-label="বুকমার্ক">
                  <Bookmark className={clsx('size-5', bookmarked && 'fill-primary text-primary')} />
                </button>
                <button type="button" onClick={() => setNotesOpen(true)} className="btn btn-ghost btn-sm btn-square" aria-label="নোট">
                  <NotebookPen className="size-5" />
                </button>
              </div>
            </div>
            {topic.summary && <p className="mt-4 text-lg text-base-content/75">{topic.summary}</p>}
          </header>

          <div className="sticky top-[4.25rem] z-20 mb-8">
            <AudioBar speech={speech} audioUrl={topic.audioUrl} minutes={Math.ceil(chunks.length / 6)} />
          </div>

          {!guest && highlightSupported && highlights.length === 0 && (
            <p className="-mt-4 mb-6 text-xs text-base-content/50">টিপ: যেকোনো লেখা সিলেক্ট করে রঙ বেছে নিলে হাইলাইট হবে — পরে আবার এসে দেখতে পাবে।</p>
          )}
          <div ref={blocksRef}>
            <BlockRenderer blocks={topic.blocks} activeIndex={speech.activeBlock} />
          </div>
          {!guest && <Highlighter containerRef={blocksRef} highlights={highlights} onChange={saveHighlights} />}

          {topic.keyTerms?.length > 0 && <KeyTerms terms={topic.keyTerms} />}

          {/* Completion */}
          <section className="mt-12 rounded-box border border-base-300 bg-base-100 p-6 text-center">
            {guest ? (
              <>
                <PartyPopper className="mx-auto size-10 text-primary" />
                <h2 className="mt-3 text-xl font-bold">এবার নিজেকে যাচাই করো — লগইন ছাড়াই</h2>
                <p className="mt-1 text-sm text-base-content/60">এই ফ্রি টপিকের MCQ কুইজ ও সৃজনশীল প্রশ্ন দাও। লগইন করলে ফল, XP ও স্ট্রিক সেভ হবে।</p>
                <div className="mx-auto mt-5 grid max-w-md gap-3 sm:grid-cols-2">
                  {[
                    { part: 'mcq', count: tests.mcq.count, icon: ListChecks, label: 'MCQ কুইজ', hint: '১০টি প্রশ্ন · ব্যাখ্যাসহ', cls: 'btn-primary' },
                    { part: 'cq', count: tests.cq.count, icon: PenLine, label: 'সৃজনশীল প্রশ্ন', hint: 'লিখে মডেল উত্তরের সাথে মেলাও', cls: 'btn-secondary' },
                  ]
                    .filter((x) => x.count > 0)
                    .map(({ part, icon: Icon, label, hint, cls }) => (
                      <div key={part} className="rounded-2xl border border-base-300 p-3">
                        <Link to={`/practice/${topic._id}/${part}`} className={`btn ${cls} btn-block`}>
                          <Icon className="size-4" /> {label}
                        </Link>
                        <p className="mt-2 text-xs text-base-content/60">{hint}</p>
                      </div>
                    ))}
                </div>
              </>
            ) : completed ? (
              <>
                <PartyPopper className="mx-auto size-10 text-primary" />
                <h2 className="mt-3 text-xl font-bold">টপিক সম্পন্ন! এবার নিজেকে যাচাই করো</h2>
                <p className="mt-1 text-sm text-base-content/60">MCQ কুইজে তাৎক্ষণিক উত্তর দেখো, সৃজনশীল অনুশীলনে লিখে মূল্যায়ন নাও।</p>
                <div className="mx-auto mt-5 grid max-w-md gap-3 sm:grid-cols-2">
                  {[
                    { kind: 'topic', test: tests.mcq, icon: ListChecks, label: 'MCQ কুইজ', hint: '১০টি প্রশ্ন · সাথে সাথে উত্তর', cls: 'btn-primary' },
                    { kind: 'topic-cq', test: tests.cq, icon: PenLine, label: 'সৃজনশীল অনুশীলন', hint: '১টি প্রশ্ন · ক, খ, গ, ঘ', cls: 'btn-secondary' },
                  ]
                    .filter((x) => x.test.count > 0)
                    .map(({ kind, test, icon: Icon, label, hint, cls }) => (
                      <div key={kind} className="rounded-2xl border border-base-300 p-3">
                        <button
                          type="button"
                          className={`btn ${cls} btn-block`}
                          disabled={startQuiz.isPending}
                          onClick={() => startQuiz.mutate({ kind, topicId: topic._id })}
                        >
                          {busyKind === kind ? <span className="loading loading-spinner loading-sm" /> : <Icon className="size-4" />}
                          {label}
                        </button>
                        <p className="mt-2 text-xs text-base-content/60">
                          {typeof test.best === 'number' ? <span className="font-semibold text-success">সেরা স্কোর {toBn(test.best)}%</span> : hint}
                        </p>
                      </div>
                    ))}
                </div>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {next?.published && (
                    <Link to={`/learn/${chapter.slug}/${next.slug}`} className="btn btn-outline">
                      পরের টপিক <ArrowRight className="size-4" />
                    </Link>
                  )}
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold">পড়া শেষ?</h2>
                <p className="mt-1 text-sm text-base-content/60">সম্পন্ন চিহ্নিত করলে পাবে +২০ XP এবং MCQ কুইজ ও সৃজনশীল অনুশীলন আনলক হবে।</p>
                <button type="button" className="btn btn-primary btn-wide mt-5" onClick={markComplete} disabled={complete.isPending}>
                  {complete.isPending ? <span className="loading loading-spinner loading-sm" /> : <CheckCircle2 className="size-5" />}
                  পড়া শেষ
                </button>
              </>
            )}
          </section>

          <nav className="mt-6 grid gap-3 sm:grid-cols-2">
            {prev ? (
              <Link to={`/learn/${chapter.slug}/${prev.slug}`} className="card-soft p-4 transition hover:shadow-md">
                <p className="text-xs text-base-content/50">← আগের টপিক</p>
                <p className="font-semibold">{prev.title}</p>
              </Link>
            ) : (
              <span />
            )}
            {next && (
              <Link
                to={`/learn/${chapter.slug}/${next.slug}`}
                className={clsx('card-soft p-4 text-right transition hover:shadow-md', !next.published && 'pointer-events-none opacity-50')}
              >
                <p className="text-xs text-base-content/50">পরের টপিক →</p>
                <p className="font-semibold">{next.title}</p>
              </Link>
            )}
          </nav>
        </article>

        {/* Chapter outline */}
        <aside className="hidden xl:block">
          <div className="sticky top-24">
            <p className="mb-2 px-2 text-sm font-bold text-base-content/60">এই অধ্যায়ের টপিক</p>
            <ul className="menu menu-sm w-full p-0">
              {siblings.map((s) => (
                <li key={s._id} className={clsx(!s.published && 'menu-disabled')}>
                  <Link
                    to={`/learn/${chapter.slug}/${s.slug}`}
                    className={clsx(s.slug === topic.slug && 'bg-primary/10 font-semibold text-primary', !s.published && 'pointer-events-none')}
                  >
                    <span className="w-5 text-right text-base-content/50">{toBn(s.order)}</span>
                    <span className="line-clamp-2">{s.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      <NotesDialog key={topic._id} open={notesOpen} onClose={() => setNotesOpen(false)} initial={data.progress?.note ?? ''} onSave={(note) => update.mutateAsync({ note })} />
    </>
  );
}
