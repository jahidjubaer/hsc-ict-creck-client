import { RotateCw, TriangleAlert } from 'lucide-react';
import { errorMessage } from '@/lib/api';

export function QueryError({ error, onRetry }) {
  return (
    <div role="alert" className="alert alert-error alert-soft mt-6">
      <TriangleAlert className="size-5" />
      <span>{errorMessage(error)}</span>
      {onRetry && (
        <button type="button" className="btn btn-sm" onClick={() => onRetry()}>
          <RotateCw className="size-4" /> আবার চেষ্টা
        </button>
      )}
    </div>
  );
}
