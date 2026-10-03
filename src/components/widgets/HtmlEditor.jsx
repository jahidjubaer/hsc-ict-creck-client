import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { AlertTriangle, CheckCircle2, Circle, Download, Eye, Lightbulb, RotateCcw, XCircle } from 'lucide-react';
import { toBn } from '@/lib/bn';
import { checkTask, lintHtml, preparePreview } from './htmlLint';
import { CodeEditor } from './CodeEditor';
import { loadDraft, saveDraft, storageKey } from './labStorage';

const STARTER = `<!DOCTYPE html>
<html>
<head>
  <title>My first html doc</title>
</head>
<body>
  Hello World!
</body>
</html>`;

// Symbols that are slow to reach on a phone keyboard.
const KEYS = ['<', '>', '</', '/', '=""', '<!-- -->', 'Tab'];

/**
 * Live HTML editor with a sandboxed preview, a tag-nesting checker and optional tasks.
 * Props: code (starter), tasks [{ text, selector, min?, contains? }], solution, height (px), previewHeight (px).
 * The student's edits are kept in localStorage per starter code.
 */
export function HtmlEditor({ code = STARTER, tasks = [], solution, height = 260, previewHeight = 240 }) {
  const key = storageKey('html-lab', code);
  const [src, setSrc] = useState(() => loadDraft(key) ?? code);
  const deferred = useDeferredValue(src);
  useEffect(() => saveDraft(key, src === code ? null : src), [key, src, code]);

  const { html, title, doc } = useMemo(() => preparePreview(deferred), [deferred]);
  const issues = useMemo(() => lintHtml(deferred), [deferred]);
  const results = tasks.map((t) => checkTask(doc, t));
  const done = results.filter(Boolean).length;
  const download = () => {
    const url = URL.createObjectURL(new Blob([src], { type: 'text/html' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mypage.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      {tasks.length > 0 && (
        <div className="rounded-xl border border-base-300 bg-base-200/50 p-3">
          <p className="mb-2 flex items-center justify-between text-sm font-bold">
            <span>কাজ</span>
            <span className={clsx('badge', done === tasks.length ? 'badge-success' : 'badge-ghost')}>
              {toBn(done)}/{toBn(tasks.length)}
            </span>
          </p>
          <ul className="space-y-1 text-sm">
            {tasks.map((t, i) => (
              <li key={i} className={clsx('flex items-start gap-2', results[i] && 'text-success')}>
                {results[i] ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> : <Circle className="mt-0.5 size-4 shrink-0 opacity-40" />}
                <span>{t.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <CodeEditor
        value={src}
        onChange={setSrc}
        height={height}
        fileName="mypage.html"
        keys={KEYS}
        label="HTML কোড লেখো"
        actions={
          <>
            {solution && (
              <button type="button" className="btn btn-ghost btn-xs text-white/70" onClick={() => setSrc(solution)}>
                <Lightbulb className="size-3.5" /> সমাধান
              </button>
            )}
            <button type="button" className="btn btn-ghost btn-xs text-white/70" onClick={download} title="mypage.html ফাইল হিসেবে নামাও">
              <Download className="size-3.5" />
            </button>
            <button type="button" className="btn btn-ghost btn-xs text-white/70" onClick={() => setSrc(code)} title="শুরুর কোডে ফেরো">
              <RotateCcw className="size-3.5" /> রিসেট
            </button>
          </>
        }
      />

      {issues.length > 0 ? (
        <ul className="space-y-1 rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm">
          {issues.slice(0, 5).map((it, i) => (
            <li key={i} className="flex items-start gap-2">
              {it.level === 'error' ? <XCircle className="mt-0.5 size-4 shrink-0 text-error" /> : <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />}
              <span>
                <b>লাইন {toBn(it.line)}:</b> <span className="font-mono text-[13px]">{it.msg}</span>
              </span>
            </li>
          ))}
          {issues.length > 5 && <li className="text-xs opacity-60">আরও {toBn(issues.length - 5)}টি…</li>}
        </ul>
      ) : (
        <p className="flex items-center gap-1.5 text-xs text-success">
          <CheckCircle2 className="size-3.5" /> সব ট্যাগ ঠিকমতো খোলা ও বন্ধ করা হয়েছে
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-base-300 bg-base-200">
        <div className="flex items-center gap-2 px-3 pt-2">
          <span className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-red-400/80" />
            <span className="size-2.5 rounded-full bg-yellow-400/80" />
            <span className="size-2.5 rounded-full bg-green-400/80" />
          </span>
          <span className="max-w-60 truncate rounded-t-lg bg-white px-3 py-1 text-xs text-gray-700" title="<title> এলিমেন্টের লেখা ব্রাউজারের ট্যাবে দেখায়">
            {title || 'mypage.html'}
          </span>
          <span className="ml-auto flex items-center gap-1 text-xs text-base-content/50">
            <Eye className="size-3.5" /> লাইভ প্রিভিউ
          </span>
        </div>
        <iframe
          title="HTML লাইভ প্রিভিউ"
          sandbox="allow-popups allow-popups-to-escape-sandbox"
          srcDoc={html}
          className="w-full bg-white"
          style={{ height: previewHeight }}
        />
      </div>
      <p className="text-xs text-base-content/50">
        লেখার সাথে সাথে প্রিভিউ বদলায়। image.jpg-এর মতো লোকাল ছবির জায়গায় নমুনা ছবি দেখানো হয়; লিংক নতুন ট্যাবে খোলে।
      </p>
    </div>
  );
}
