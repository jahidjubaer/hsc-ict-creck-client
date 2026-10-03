import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { BlockRenderer } from '@/components/lesson/BlockRenderer';
import { KeyTerms } from '@/features/learn/KeyTerms';

// Dev-only page (/dev/lesson/:chapter/:slug, e.g. /dev/lesson/ch6/sql-queries): renders a lesson file straight from
// content/topics without login or seeding, for checking lessons while writing them.
const LESSONS = import.meta.glob('../../../../content/topics/*/*.js');

export default function LessonPreview() {
  const { chapter, slug } = useParams();
  const [lesson, setLesson] = useState(null);
  const load = LESSONS[`../../../../content/topics/${chapter}/${slug}.js`];

  useEffect(() => {
    let live = true;
    load?.().then((m) => live && setLesson(m.default));
    return () => {
      live = false;
    };
  }, [load]);

  if (!load) return <p className="p-8">No lesson at content/topics/{chapter}/{slug}.js</p>;
  if (!lesson) return <div className="skeleton m-8 h-40" />;
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-3 py-8">
      <h1 className="text-2xl font-bold">{slug}</h1>
      <p className="text-base-content/70">{lesson.summary}</p>
      <BlockRenderer blocks={lesson.blocks} />
      {lesson.keyTerms?.length > 0 && <KeyTerms terms={lesson.keyTerms} />}
    </div>
  );
}
