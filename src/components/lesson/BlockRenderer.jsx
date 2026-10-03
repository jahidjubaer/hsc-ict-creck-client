import { Suspense } from 'react';
import clsx from 'clsx';
import { FlaskConical } from 'lucide-react';
import { Markdown } from './Markdown';
import { Callout } from './blocks/Callout';
import { Definition } from './blocks/Definition';
import { Example } from './blocks/Example';
import { CodeBlock } from './blocks/CodeBlock';
import { QuickCheck } from './blocks/QuickCheck';
import { KeyPoints } from './blocks/KeyPoints';
import { WIDGETS, WIDGET_TITLES } from '@/components/widgets/registry';

const headingId = (i) => `sec-${i}`;

function Figure({ svg, src, alt, caption }) {
  return (
    <figure className="rounded-2xl border border-base-300 bg-base-100 p-4">
      {svg ? (
        // Lesson SVGs are authored in-repo (trusted content).
        <div className="mx-auto max-w-2xl [&_svg]:h-auto [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: svg }} />
      ) : (
        <img src={src} alt={alt || caption || ''} loading="lazy" className="mx-auto max-h-96 rounded-lg" />
      )}
      {caption && <figcaption className="mt-3 text-center text-sm text-base-content/60">{caption}</figcaption>}
    </figure>
  );
}

function Widget({ name, title, props }) {
  const Comp = WIDGETS[name];
  if (!Comp) return <div className="alert alert-warning">অজানা ল্যাব: {name}</div>;
  return (
    <section className="overflow-hidden rounded-2xl border-2 border-primary/30 bg-base-100 shadow-sm">
      <header className="flex items-center gap-2 bg-primary/10 px-4 py-2.5 text-sm font-bold text-primary">
        <FlaskConical className="size-4" /> {title || WIDGET_TITLES[name] || 'ইন্টারঅ্যাকটিভ ল্যাব'}
      </header>
      <div className="p-4 sm:p-5">
        <Suspense fallback={<div className="skeleton h-40 w-full" />}>
          <Comp {...props} />
        </Suspense>
      </div>
    </section>
  );
}

function Block({ block, index }) {
  switch (block.type) {
    case 'heading':
      return block.level === 3 ? (
        <h3 className="pt-2 text-xl font-bold">{block.text}</h3>
      ) : (
        <h2 id={headingId(index)} className="scroll-mt-24 border-b border-base-300 pt-4 pb-2 text-2xl font-bold">
          {block.text}
        </h2>
      );
    case 'md':
      return <Markdown>{block.md}</Markdown>;
    case 'callout':
      return <Callout {...block} />;
    case 'definition':
      return <Definition {...block} />;
    case 'example':
      return <Example {...block} />;
    case 'code':
      return <CodeBlock {...block} />;
    case 'quickCheck':
      return <QuickCheck {...block} />;
    case 'keyPoints':
      return <KeyPoints {...block} />;
    case 'figure':
      return <Figure {...block} />;
    case 'widget':
      return <Widget {...block} />;
    default:
      return null;
  }
}

/** Renders lesson blocks; `activeIndex` highlights the block currently being narrated. */
export function BlockRenderer({ blocks, activeIndex = -1 }) {
  return (
    <div className="space-y-6">
      {blocks.map((block, i) => (
        <div key={i} data-block={i} data-type={block.type} className={clsx(i === activeIndex && 'block-speaking')}>
          <Block block={block} index={i} />
        </div>
      ))}
    </div>
  );
}
