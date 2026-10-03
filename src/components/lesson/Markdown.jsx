import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import clsx from 'clsx';

const components = {
  a: ({ href, children }) => (
    <a href={href} target={href?.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
      {children}
    </a>
  ),
};

/** Renders a lesson markdown string (GFM tables, lists, bold, inline code). */
export function Markdown({ children, className }) {
  return (
    <div className={clsx('prose prose-ict', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
