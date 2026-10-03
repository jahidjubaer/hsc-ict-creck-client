import { Link, useLocation } from 'react-router';
import { ClipboardList, GraduationCap, ListChecks, Lock, PenLine, Sparkles } from 'lucide-react';
import { ChapterIcon } from '@/components/ui/ChapterIcon';
import { QueryError } from '@/components/ui/QueryError';
import { toBn } from '@/lib/bn';
import { useFreeTopics } from './queries';

/** Exam hub for visitors: each chapter's free topic can be tested without an account; the rest asks to sign up. */
export function GuestExams() {
  const { data: topics, isLoading, error, refetch } = useFreeTopics();
  const { pathname } = useLocation();
  const from = { from: pathname };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl">
          <ClipboardList className="size-7 text-primary" /> পরীক্ষা কেন্দ্র
        </h1>
        <p className="mt-1 text-base-content/65">লগইন ছাড়াই প্রতিটি অধ্যায়ের ফ্রি টপিকে MCQ ও সৃজনশীল পরীক্ষা দাও।</p>
      </header>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
          <Sparkles className="size-5 text-success" /> ফ্রি পরীক্ষা — লগইন লাগবে না
        </h2>
        {error && <QueryError error={error} onRetry={refetch} />}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {isLoading &&
            Array.from({ length: 6 }, (_, i) => <div key={i} className="skeleton h-44 rounded-box" />)}
          {topics?.map((t) => (
            <article key={t._id} className="card-soft flex flex-col p-5">
              <div className="flex items-start gap-3">
                <span className={`grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${t.chapter.color} text-white`}>
                  <ChapterIcon name={t.chapter.icon} className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs text-base-content/55">অধ্যায় {toBn(t.chapter.number)} · ফ্রি টপিক</p>
                  <Link to={`/learn/${t.chapter.slug}/${t.slug}`} className="link-hover line-clamp-2 leading-snug font-semibold">
                    {t.title}
                  </Link>
                </div>
              </div>
              <div className="mt-auto grid grid-cols-2 gap-2 pt-4">
                <Link to={`/practice/${t._id}/mcq`} className="btn btn-primary btn-sm" aria-disabled={!t.mcqCount}>
                  <ListChecks className="size-4" /> MCQ
                </Link>
                {t.cqCount > 0 ? (
                  <Link to={`/practice/${t._id}/cq`} className="btn btn-secondary btn-sm">
                    <PenLine className="size-4" /> সৃজনশীল
                  </Link>
                ) : (
                  <span className="btn btn-sm btn-disabled">সৃজনশীল নেই</span>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden rounded-box bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-6 text-white">
        <GraduationCap className="absolute -right-6 -bottom-8 size-44 opacity-15" />
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <Lock className="size-5" /> অ্যাকাউন্টে যা যা খুলবে
        </h2>
        <ul className="relative mt-3 grid gap-1.5 text-sm opacity-95 sm:grid-cols-2">
          <li>✓ সব ৬১টি টপিকের MCQ কুইজ ও সৃজনশীল অনুশীলন</li>
          <li>✓ অধ্যায় MCQ (২৫টি, ২৫ মিনিট) ও সৃজনশীল (৩টি থেকে ২টি) পরীক্ষা</li>
          <li>✓ পূর্ণাঙ্গ MCQ ও সৃজনশীল মডেল টেস্ট — বোর্ডের প্যাটার্নে</li>
          <li>✓ AI দিয়ে সৃজনশীল উত্তরের নম্বর ও পরামর্শ</li>
          <li>✓ ভুলের খাতা, XP, স্ট্রিক ও লিডারবোর্ড</li>
          <li>✓ নতুন অ্যাকাউন্টে ১৫ দিন সব ফ্রি</li>
        </ul>
        <div className="relative mt-5 flex flex-wrap gap-2">
          <Link to="/register" state={from} className="btn border-none bg-white text-indigo-700 hover:bg-white/90">
            ফ্রি অ্যাকাউন্ট খোলো
          </Link>
          <Link to="/login" state={from} className="btn btn-ghost text-white hover:bg-white/15">
            লগইন
          </Link>
        </div>
      </section>
    </div>
  );
}
