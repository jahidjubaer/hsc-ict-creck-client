import { useState } from 'react';
import clsx from 'clsx';
import { CheckCircle2, HelpCircle, XCircle } from 'lucide-react';
import { Markdown } from '../Markdown';

const LETTERS = ['ক', 'খ', 'গ', 'ঘ'];

/** Inline single MCQ to check understanding mid-lesson (not graded, no XP). */
export function QuickCheck({ q, options = [], answer, explain }) {
  const [picked, setPicked] = useState(null);
  const answered = picked !== null;

  return (
    <div className="rounded-2xl border-2 border-dashed border-secondary/50 bg-secondary/5 p-4 sm:p-5">
      <p className="flex items-center gap-2 text-sm font-bold text-secondary-content">
        <HelpCircle className="size-5 text-secondary" /> নিজেকে যাচাই করো
      </p>
      <Markdown className="mt-2 font-semibold">{q}</Markdown>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {options.map((opt, i) => {
          const correct = i === answer;
          return (
            <button
              key={i}
              type="button"
              disabled={answered}
              onClick={() => setPicked(i)}
              className={clsx(
                'flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition',
                !answered && 'border-base-300 bg-base-100 hover:border-primary hover:bg-primary/5',
                answered && correct && 'border-success bg-success/10 font-semibold',
                answered && picked === i && !correct && 'border-error bg-error/10',
                answered && picked !== i && !correct && 'border-base-300 opacity-60'
              )}
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-base-200 text-sm font-bold">{LETTERS[i]}</span>
              <span className="flex-1">{opt}</span>
              {answered && correct && <CheckCircle2 className="size-5 text-success" />}
              {answered && picked === i && !correct && <XCircle className="size-5 text-error" />}
            </button>
          );
        })}
      </div>
      {answered && (
        <div className={clsx('mt-3 rounded-xl p-3 text-sm', picked === answer ? 'bg-success/10' : 'bg-warning/10')}>
          <p className="font-bold">{picked === answer ? 'দারুণ! সঠিক উত্তর 🎉' : `সঠিক উত্তর: ${LETTERS[answer]}`}</p>
          {explain && <Markdown className="mt-1 text-sm">{explain}</Markdown>}
          <button type="button" className="btn btn-ghost btn-xs mt-2" onClick={() => setPicked(null)}>
            আবার চেষ্টা করো
          </button>
        </div>
      )}
    </div>
  );
}
