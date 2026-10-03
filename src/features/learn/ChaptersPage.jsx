import { Link } from 'react-router';
import { ArrowRight, Star } from 'lucide-react';
import { ChapterIcon } from '@/components/ui/ChapterIcon';
import { toBn } from '@/lib/bn';
import { useChapters } from './queries';
import { QueryError } from '@/components/ui/QueryError';

export default function ChaptersPage() {
  const { data: chapters, isLoading, error, refetch } = useChapters();

  return (
    <div>
      <h1 className="text-2xl font-bold sm:text-3xl">পড়াশোনা</h1>
      <p className="mt-1 text-base-content/60">
        একটি অধ্যায় বেছে নাও। <Star className="inline size-4 fill-amber-400 text-amber-400" /> চিহ্নিত অধ্যায়গুলো বোর্ড পরীক্ষায় সবচেয়ে গুরুত্বপূর্ণ।
      </p>

      {error && <QueryError error={error} onRetry={refetch} />}

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {isLoading &&
          Array.from({ length: 6 }, (_, i) => <div key={i} className="skeleton h-40 rounded-box" />)}
        {chapters?.map((ch) => {
          const pct = ch.publishedCount ? Math.round((ch.completedCount / ch.publishedCount) * 100) : 0;
          return (
            <Link
              key={ch.slug}
              to={`/learn/${ch.slug}`}
              className="card-soft group relative overflow-hidden p-6 transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className={`absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b ${ch.color}`} />
              <div className="flex items-start gap-4">
                <span className={`grid size-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${ch.color} text-white shadow-md`}>
                  <ChapterIcon name={ch.icon} className="size-7" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1 text-sm text-base-content/50">
                    অধ্যায় {toBn(ch.number)}
                    {ch.priority && <Star className="size-3.5 fill-amber-400 text-amber-400" />}
                  </p>
                  <h2 className="text-lg leading-snug font-bold">{ch.title}</h2>
                  <p className="mt-1 line-clamp-2 text-sm text-base-content/70">{ch.blurb}</p>
                  <div className="mt-4 flex items-center gap-3">
                    <progress className="progress progress-primary h-2 flex-1" value={pct} max={100} />
                    <span className="text-xs whitespace-nowrap text-base-content/60">
                      {toBn(ch.completedCount)}/{toBn(ch.topicCount)} টপিক
                    </span>
                  </div>
                </div>
                <ArrowRight className="mt-1 size-5 shrink-0 text-base-content/30 transition group-hover:translate-x-1 group-hover:text-primary" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
