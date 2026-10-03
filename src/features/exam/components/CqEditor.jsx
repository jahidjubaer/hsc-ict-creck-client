import { Markdown } from '@/components/lesson/Markdown';
import { toBn } from '@/lib/bn';
import { partLabel } from '../format';

export function Stimulus({ stimulus, figure }) {
  return (
    <div className="rounded-xl border-l-4 border-secondary bg-secondary/5 p-4">
      <p className="mb-1 text-sm font-bold text-secondary">উদ্দীপক</p>
      <Markdown>{stimulus}</Markdown>
      {figure && <div className="mt-3 [&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-w-full" dangerouslySetInnerHTML={{ __html: figure }} />}
    </div>
  );
}

/** Creative question: stimulus + four answer boxes (ক খ গ ঘ). */
export function CqEditor({ question, values, onChange, disabled }) {
  return (
    <div className="space-y-5">
      <Stimulus stimulus={question.stimulus} figure={question.figure} />
      {question.parts.map((p, i) => (
        <div key={i}>
          <div className="mb-2 flex gap-2">
            <span className="badge badge-primary badge-soft shrink-0 font-bold">{partLabel(i, p.marks)}</span>
          </div>
          <Markdown className="mb-2 font-semibold prose-p:my-0">{p.q}</Markdown>
          <textarea
            className="textarea w-full text-base leading-relaxed"
            style={{ minHeight: `${5 + i * 2}rem` }}
            value={values[i] ?? ''}
            disabled={disabled}
            maxLength={5000}
            onChange={(e) => onChange(i, e.target.value)}
            placeholder={i < 2 ? 'সংক্ষেপে উত্তর লেখো…' : 'ধাপে ধাপে উত্তর লেখো — হিসাব থাকলে প্রতিটি ধাপ দেখাও…'}
          />
          <p className="mt-1 text-right text-xs text-base-content/40">{toBn((values[i] ?? '').length)} অক্ষর</p>
        </div>
      ))}
    </div>
  );
}
