import clsx from 'clsx';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Markdown } from '@/components/lesson/Markdown';
import { LETTERS } from '../format';

/**
 * Four MCQ options.
 * - Exam mode: `selected` highlights the choice, no correctness shown.
 * - Revealed mode (`answer` given): marks the right option and the student's wrong pick, shows per-option `why`.
 */
export function McqOptions({ options, selected, answer, why, onPick, disabled, compact }) {
  const revealed = answer !== undefined && answer !== null;
  return (
    <div className={clsx('grid gap-2', !compact && 'sm:grid-cols-2')}>
      {options.map((opt, i) => {
        const isAnswer = revealed && i === answer;
        const isWrongPick = revealed && i === selected && i !== answer;
        return (
          <button
            key={i}
            type="button"
            disabled={disabled || revealed}
            onClick={() => onPick?.(i)}
            aria-pressed={selected === i}
            className={clsx(
              'group flex items-start gap-3 rounded-xl border-2 px-3 py-2.5 text-left transition',
              !revealed && selected !== i && 'border-base-300 bg-base-100 hover:border-primary/60 hover:bg-primary/5',
              !revealed && selected === i && 'border-primary bg-primary/10 font-semibold',
              isAnswer && 'border-success bg-success/10',
              isWrongPick && 'border-error bg-error/10',
              revealed && !isAnswer && !isWrongPick && 'border-base-300 opacity-70',
              'disabled:cursor-default'
            )}
          >
            <span
              className={clsx(
                'mt-0.5 grid size-7 shrink-0 place-items-center rounded-full text-sm font-bold',
                selected === i && !revealed ? 'bg-primary text-primary-content' : 'bg-base-200'
              )}
            >
              {LETTERS[i]}
            </span>
            <span className="min-w-0 flex-1">
              <Markdown className="prose-p:my-0">{opt}</Markdown>
              {revealed && why?.[i] && (isAnswer || isWrongPick) && <span className="mt-1 block text-xs text-base-content/70">{why[i]}</span>}
            </span>
            {isAnswer && <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />}
            {isWrongPick && <XCircle className="mt-0.5 size-5 shrink-0 text-error" />}
          </button>
        );
      })}
    </div>
  );
}

/** Stimulus + stem of an MCQ. */
export function McqStem({ q, stimulus, number }) {
  return (
    <div className="space-y-3">
      {stimulus && (
        <div className="rounded-xl border-l-4 border-secondary bg-secondary/5 p-3 text-sm">
          <p className="mb-1 text-xs font-bold text-secondary">উদ্দীপক</p>
          <Markdown className="prose-p:my-1">{stimulus}</Markdown>
        </div>
      )}
      <div className="flex gap-2">
        {number && <span className="font-bold text-primary">{number}.</span>}
        <Markdown className="flex-1 font-semibold prose-p:my-0">{q}</Markdown>
      </div>
    </div>
  );
}

/** Explanation box after an answer is revealed. */
export function Explanation({ correct, picked, answer, explain }) {
  const skipped = picked === null || picked === undefined;
  return (
    <div className={clsx('rounded-xl p-3 text-sm', correct ? 'bg-success/10' : skipped ? 'bg-base-200' : 'bg-warning/10')}>
      <p className="font-bold">
        {correct ? 'সঠিক উত্তর! 🎉' : skipped ? `উত্তর দাওনি — সঠিক উত্তর: ${LETTERS[answer]}` : `ভুল হয়েছে — সঠিক উত্তর: ${LETTERS[answer]}`}
      </p>
      {explain && <Markdown className="mt-1 text-sm">{explain}</Markdown>}
    </div>
  );
}
