import { useState } from 'react';
import { CheckCircle2, ChevronRight, PencilLine } from 'lucide-react';
import { Markdown } from '../Markdown';
import { toBn } from '@/lib/bn';

/**
 * Worked example: question first, then a step-by-step solution the student reveals
 * one step at a time (or all at once) — encourages trying before looking.
 */
export function Example({ title, question, steps = [], answer }) {
  const [shown, setShown] = useState(0);
  const done = shown >= steps.length;

  return (
    <div className="overflow-hidden rounded-2xl border border-base-300 bg-base-100">
      <div className="flex items-center gap-2 border-b border-base-300 bg-base-200/70 px-4 py-2.5">
        <PencilLine className="size-4 text-primary" />
        <span className="text-sm font-bold">{title || 'উদাহরণ'}</span>
      </div>
      <div className="space-y-4 p-4 sm:p-5">
        {question && <Markdown>{question}</Markdown>}

        <ol className="space-y-3">
          {steps.slice(0, shown).map((s, i) => (
            <li key={i} className="anim-step flex gap-3">
              <span className="mt-1 grid size-6 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                {toBn(i + 1)}
              </span>
              <Markdown className="min-w-0 flex-1">{s}</Markdown>
            </li>
          ))}
        </ol>

        {done && answer && (
          <div className="anim-pop-in flex gap-2 rounded-xl border border-success/40 bg-success/10 p-3">
            <CheckCircle2 className="mt-1 size-5 shrink-0 text-success" />
            <Markdown className="min-w-0 flex-1 font-semibold">{answer}</Markdown>
          </div>
        )}

        {!done && (
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-primary btn-sm" onClick={() => setShown((n) => n + 1)}>
              {shown === 0 ? 'সমাধান দেখো' : 'পরের ধাপ'} <ChevronRight className="size-4" />
            </button>
            {steps.length > 1 && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShown(steps.length)}>
                সব ধাপ একসাথে
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
