import { Quote } from 'lucide-react';
import { Markdown } from '../Markdown';

export function Definition({ term, en, md }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/8 to-secondary/8 p-5">
      <Quote className="absolute top-3 right-3 size-10 text-primary/10" />
      <p className="text-xs font-semibold tracking-wide text-primary uppercase">সংজ্ঞা</p>
      <p className="mt-1 text-lg font-bold">
        {term} {en && <span className="text-base font-medium text-base-content/50">({en})</span>}
      </p>
      <Markdown className="mt-2">{md}</Markdown>
    </div>
  );
}
