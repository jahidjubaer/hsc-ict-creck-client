import { Link } from 'react-router';
import { BookOpen, RotateCw, TriangleAlert } from 'lucide-react';
import { errorMessage } from '@/lib/api';
import { useSeo } from '@/lib/seo';

export function QueryError({ error, onRetry }) {
  // A wrong or old address (404): retrying won't help — offer the chapter list instead, and keep it out of search.
  const notFound = error?.response?.status === 404;
  useSeo({ title: notFound ? 'পাওয়া যায়নি' : '', noindex: true });

  return (
    <div role="alert" className="alert alert-error alert-soft mt-6">
      <TriangleAlert className="size-5" />
      <span>{errorMessage(error)}</span>
      {notFound ? (
        <Link to="/learn" className="btn btn-sm">
          <BookOpen className="size-4" /> সব অধ্যায়
        </Link>
      ) : (
        onRetry && (
          <button type="button" className="btn btn-sm" onClick={() => onRetry()}>
            <RotateCw className="size-4" /> আবার চেষ্টা
          </button>
        )
      )}
    </div>
  );
}
