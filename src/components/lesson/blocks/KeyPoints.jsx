import { Sparkles } from 'lucide-react';
import { Markdown } from '../Markdown';

export function KeyPoints({ title = 'এক নজরে', items = [] }) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-primary to-secondary p-[1.5px]">
      <div className="rounded-[calc(1rem-1px)] bg-base-100 p-5">
        <p className="flex items-center gap-2 font-bold">
          <Sparkles className="size-5 text-primary" /> {title}
        </p>
        <ul className="mt-3 space-y-2">
          {items.map((it, i) => (
            <li key={i} className="flex gap-2.5">
              <span className="mt-2.5 size-2 shrink-0 rounded-full bg-primary" />
              <Markdown className="min-w-0 flex-1">{it}</Markdown>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
