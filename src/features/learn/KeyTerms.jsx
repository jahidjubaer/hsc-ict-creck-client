import { useState } from 'react';
import clsx from 'clsx';
import { Layers, RotateCcw } from 'lucide-react';

/** Flip-card glossary at the end of a topic: term on the front, definition on the back. */
export function KeyTerms({ terms }) {
  const [flipped, setFlipped] = useState(() => new Set());
  const toggle = (i) =>
    setFlipped((s) => {
      const n = new Set(s);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });

  return (
    <section className="mt-12">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <Layers className="size-5 text-primary" /> গুরুত্বপূর্ণ শব্দ (ফ্ল্যাশকার্ড)
        </h2>
        {flipped.size > 0 && (
          <button type="button" className="btn btn-ghost btn-xs" onClick={() => setFlipped(new Set())}>
            <RotateCcw className="size-3.5" /> সব উল্টাও
          </button>
        )}
      </div>
      <p className="mb-4 text-sm text-base-content/60">কার্ডে ট্যাপ করো — আগে নিজে মনে করার চেষ্টা করো, তারপর উত্তর দেখো।</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {terms.map((t, i) => (
          <button
            key={t.term}
            type="button"
            onClick={() => toggle(i)}
            className="group h-32 [perspective:1000px]"
            aria-label={`${t.term} কার্ড উল্টাও`}
          >
            <div
              className={clsx(
                'relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d]',
                flipped.has(i) && '[transform:rotateY(180deg)]'
              )}
            >
              <div className="card-soft absolute inset-0 grid place-items-center p-4 text-lg font-bold [backface-visibility:hidden]">
                {t.term}
              </div>
              <div className="absolute inset-0 grid place-items-center overflow-auto rounded-box bg-primary p-4 text-sm text-primary-content [backface-visibility:hidden] [transform:rotateY(180deg)]">
                {t.def}
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
