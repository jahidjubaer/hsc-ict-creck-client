import { useEffect, useRef } from 'react';
import clsx from 'clsx';
import { Highlight, themes } from 'prism-react-renderer';

const METRICS = 'font-mono text-[13px] leading-[1.6] p-3 pl-12 whitespace-pre [font-variant-ligatures:none]';
const LINE_PX = 13 * 1.6;

// Where the caret lands after inserting a key: inside quotes/brackets.
const CARET = { '=""': 2, '<!-- -->': 5, '""': 1, '()': 1, '{}': 1, '[]': 1, "''": 1 };

/**
 * Lightweight code editor: a transparent textarea over a Prism-highlighted <pre>, line numbers,
 * optional highlighted line (activeLine) and error line, and a row of symbol keys for phones.
 * keys: strings to insert ('Tab' inserts two spaces). actions: buttons shown in the title bar.
 */
export function CodeEditor({ value, onChange, language = 'markup', height = 260, fileName, actions, keys = [], activeLine, errorLine, readOnly, label }) {
  const area = useRef(null);
  const pre = useRef(null);
  const gutter = useRef(null);
  const lines = value.split('\n').length;

  const syncScroll = () => {
    const { scrollTop, scrollLeft } = area.current;
    pre.current.scrollTop = scrollTop;
    pre.current.scrollLeft = scrollLeft;
    gutter.current.style.transform = `translateY(${-scrollTop}px)`;
  };

  // Keep the highlighted line visible.
  useEffect(() => {
    const el = area.current;
    const line = activeLine || errorLine;
    if (!el || !line) return;
    const top = 12 + (line - 1) * LINE_PX;
    if (top < el.scrollTop + 8 || top > el.scrollTop + el.clientHeight - 40) {
      el.scrollTop = Math.max(0, top - el.clientHeight / 2);
      syncScroll();
    }
  }, [activeLine, errorLine]);

  const insert = (text) => {
    const el = area.current;
    el.focus();
    const { selectionStart: s, selectionEnd: e } = el;
    const next = el.value.slice(0, s) + text + el.value.slice(e);
    const caret = s + (CARET[text] ?? text.length);
    onChange(next);
    requestAnimationFrame(() => el.setSelectionRange(caret, caret));
  };

  const onKeyDown = (e) => {
    if (e.key === 'Tab' && !e.shiftKey && !readOnly) {
      e.preventDefault();
      insert('  ');
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-base-300 bg-[#1e1e2e]">
      {(fileName || actions) && (
        <div className="flex flex-wrap items-center gap-1 border-b border-white/10 px-2 py-1.5">
          <span className="mr-auto px-1 text-xs font-medium text-white/60">{fileName}</span>
          {actions}
        </div>
      )}
      <div className="relative" style={{ height }}>
        <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-9 overflow-hidden border-r border-white/10">
          <div ref={gutter} className="py-3 text-right font-mono text-[13px] leading-[1.6] text-white/25">
            {Array.from({ length: lines }, (_, i) => (
              <div key={i} className={clsx('pr-2', i + 1 === activeLine && 'text-amber-300', i + 1 === errorLine && 'text-red-400')}>
                {i + 1}
              </div>
            ))}
          </div>
        </div>
        <Highlight code={value + '\n'} language={language} theme={themes.vsDark}>
          {({ tokens, getLineProps, getTokenProps }) => (
            <pre ref={pre} aria-hidden className={clsx(METRICS, 'pointer-events-none absolute inset-0 m-0 overflow-hidden')} style={{ background: 'transparent' }}>
              {tokens.map((line, i) => (
                <div
                  key={i}
                  {...getLineProps({ line })}
                  className={clsx('-mr-3 -ml-12 pr-3 pl-12', i + 1 === activeLine && 'bg-amber-300/20', i + 1 === errorLine && 'bg-red-500/25')}
                >
                  {line.map((token, k) => (
                    <span key={k} {...getTokenProps({ token })} />
                  ))}
                </div>
              ))}
            </pre>
          )}
        </Highlight>
        <textarea
          ref={area}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={syncScroll}
          onKeyDown={onKeyDown}
          readOnly={readOnly}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          wrap="off"
          aria-label={label || 'কোড লেখো'}
          className={clsx(METRICS, 'absolute inset-0 size-full resize-none overflow-auto bg-transparent text-transparent caret-white outline-none selection:bg-white/20')}
        />
      </div>
      {keys.length > 0 && !readOnly && (
        <div className="flex gap-1 overflow-x-auto border-t border-white/10 px-2 py-1.5">
          {keys.map((k) => (
            <button
              key={k}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => insert(k === 'Tab' ? '  ' : k)}
              className="btn btn-xs shrink-0 border-white/10 bg-white/5 font-mono text-white/80 [font-variant-ligatures:none] hover:bg-white/15"
            >
              {k}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
