import { useState } from 'react';
import { Highlight, themes } from 'prism-react-renderer';
import { Check, Copy, Eye, TerminalSquare } from 'lucide-react';

const LANG_LABEL = { c: 'C', html: 'HTML', sql: 'SQL', css: 'CSS', text: 'Text' };

/**
 * Highlighted code with copy button. Optional `output` (program output) and,
 * for HTML, `preview` renders the page in a sandboxed iframe.
 */
export function CodeBlock({ code, lang = 'text', title, output, preview }) {
  const [copied, setCopied] = useState(false);
  const source = code.replace(/\n$/, '');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(source);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-base-300 bg-[#1e1e2e] text-sm shadow-sm">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2 text-xs text-white/60">
        <span className="flex items-center gap-2">
          <span className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-red-400/80" />
            <span className="size-2.5 rounded-full bg-yellow-400/80" />
            <span className="size-2.5 rounded-full bg-green-400/80" />
          </span>
          <span className="ml-2 font-medium">{title || LANG_LABEL[lang] || lang}</span>
        </span>
        <button type="button" onClick={copy} className="flex items-center gap-1 hover:text-white" aria-label="কোড কপি করো">
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />} {copied ? 'কপি হয়েছে' : 'কপি'}
        </button>
      </div>
      <Highlight code={source} language={lang === 'c' ? 'c' : lang === 'html' ? 'markup' : lang} theme={themes.vsDark}>
        {({ tokens, getLineProps, getTokenProps }) => (
          <pre className="overflow-x-auto p-4 font-mono leading-relaxed [font-variant-ligatures:none]" style={{ background: 'transparent' }}>
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })} className="table-row">
                <span className="table-cell pr-4 text-right text-white/25 select-none">{i + 1}</span>
                <span className="table-cell">
                  {line.map((token, k) => (
                    <span key={k} {...getTokenProps({ token })} />
                  ))}
                </span>
              </div>
            ))}
          </pre>
        )}
      </Highlight>
      {output != null && (
        <div className="border-t border-white/10 bg-black/30 px-4 py-3 font-mono text-green-300">
          <p className="mb-1 flex items-center gap-1.5 font-sans text-xs text-white/50">
            <TerminalSquare className="size-3.5" /> আউটপুট
          </p>
          <pre className="whitespace-pre-wrap">{output}</pre>
        </div>
      )}
      {preview && lang === 'html' && (
        <div className="border-t border-white/10 bg-white">
          <p className="flex items-center gap-1.5 bg-base-200 px-4 py-1.5 text-xs text-base-content/60">
            <Eye className="size-3.5" /> ব্রাউজারে যেভাবে দেখাবে
          </p>
          <iframe title="HTML preview" sandbox="" srcDoc={source} className="h-56 w-full bg-white" />
        </div>
      )}
    </div>
  );
}
