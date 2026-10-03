import { useEffect } from 'react';
import { useParams } from 'react-router';
import { QueryError } from '@/components/ui/QueryError';
import { PageLoader } from '@/components/ui/PageLoader';
import { useAttempt } from './queries';
import { InstantRunner } from './InstantRunner';
import { ExamRunner } from './ExamRunner';
import { ResultView } from './ResultView';

/** /exams/attempts/:id — runs the test while in progress, shows the result once submitted. */
export default function AttemptPage() {
  const { id } = useParams();
  const { data: attempt, isLoading, error, refetch } = useAttempt(id);
  const status = attempt?.status;

  useEffect(() => {
    window.scrollTo(0, 0); // runner → result starts at the top
  }, [id, status]);

  if (isLoading) return <PageLoader />;
  if (error) return <QueryError error={error} onRetry={refetch} />;

  if (attempt.status === 'submitted') return <ResultView key={`${attempt._id}-done`} attempt={attempt} />;
  return attempt.instant ? <InstantRunner key={attempt._id} attempt={attempt} /> : <ExamRunner key={attempt._id} attempt={attempt} />;
}
