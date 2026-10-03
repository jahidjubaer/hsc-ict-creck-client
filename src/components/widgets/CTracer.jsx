import { useEffect, useState } from 'react';
import clsx from 'clsx';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pause,
  Play,
  RotateCcw,
  TerminalSquare,
  XCircle,
} from 'lucide-react';
import { toBn } from '@/lib/bn';
import { CodeEditor } from './CodeEditor';
import { runC } from './c/interpreter';
import { loadDraft, saveDraft, storageKey } from './labStorage';

const STARTER = `#include <stdio.h>

int main()
{
    int i, sum = 0;
    for (i = 1; i <= 5; i++) {
        sum = sum + i;
    }
    printf("Sum = %d\\n", sum);
    return 0;
}`;

const KEYS = ['{}', '()', ';', '""', '%d', '\\n', '&', '[]', '<', '>', '=', '+', '*', '/', '%', 'Tab'];

const norm = (s) =>
  s
    .replace(/\r/g, '')
    .split('\n')
    .map((l) => l.trimEnd())
    .join('\n')
    .trim();

function ArrayView({ array, prev }) {
  if (array.cells[0] && typeof array.cells[0] === 'object') {
    return (
      <div className="space-y-1">
        {array.cells.map((row, r) => (
          <div key={r} className="flex items-center gap-1">
            <span className="w-6 font-mono text-[10px] text-base-content/40">[{r}]</span>
            <ArrayView array={row} prev={prev?.cells?.[r]} />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="flex flex-wrap gap-0.5">
      {array.cells.map((c, i) => (
        <div
          key={i}
          className={clsx(
            'flex min-w-9 flex-col items-center rounded border px-1 font-mono text-xs',
            prev && prev.cells?.[i] !== c ? 'border-amber-400 bg-amber-300/30' : 'border-base-300 bg-base-100',
          )}
        >
          <span className={clsx(c === '?' && 'text-base-content/30')}>{c}</span>
          <span className="text-[10px] text-base-content/40">{i}</span>
        </div>
      ))}
    </div>
  );
}

function Variables({ step, prev }) {
  if (!step) return null;
  const prevVar = (fi, name) => prev?.frames?.[fi]?.vars.find((v) => v.name === name);
  return (
    <div className="space-y-2">
      {step.frames.map((f, fi) => (
        <div key={fi} className="rounded-lg border border-base-300 bg-base-100">
          <p className="border-b border-base-300 px-2 py-1 font-mono text-xs font-bold text-primary">{f.fn}</p>
          {f.vars.length === 0 ? (
            <p className="px-2 py-1.5 text-xs text-base-content/40">কোনো ভেরিয়েবল নেই</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {f.vars.map((v) => {
                  const p = prevVar(fi, v.name);
                  const changed = prev && (!p || JSON.stringify(p) !== JSON.stringify(v));
                  return (
                    <tr key={v.name} className={clsx('border-b border-base-200 last:border-0', changed && 'bg-amber-300/20')}>
                      <td className="w-20 px-2 py-1 font-mono font-bold">{v.name}</td>
                      <td className="w-14 px-1 py-1 font-mono text-xs text-base-content/50">{v.type}{v.array ? '[]' : ''}</td>
                      <td className="px-2 py-1 font-mono">
                        {v.array ? (
                          <div className="space-y-1">
                            <ArrayView array={v.array} prev={p?.array} />
                            {v.array.str !== undefined && <p className="text-xs text-base-content/60">স্ট্রিং: "{v.array.str}"</p>}
                          </div>
                        ) : (
                          <span className={clsx(v.value === '?' && 'text-base-content/40')} title={v.value === '?' ? 'মান দেওয়া হয়নি — গার্বেজ' : undefined}>
                            {v.value === '?' ? '? (গার্বেজ)' : v.value}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * C program runner/tracer. Props: code, input (stdin text), predict (hide the output until the student
 * types a guess), height (editor px). Runs a C subset in the browser and lets students step through
 * every statement with variables, arrays and output.
 */
export function CTracer({ code = STARTER, input = '', predict = false, height }) {
  const key = storageKey('c-lab', code);
  const [src, setSrc] = useState(() => loadDraft(key) ?? code);
  const [stdin, setStdin] = useState(input);
  const [ran, setRan] = useState(null); // { src, stdin, result }
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [guess, setGuess] = useState('');
  const [revealed, setRevealed] = useState(!predict);

  useEffect(() => saveDraft(key, src === code ? null : src), [key, src, code]);

  const result = ran?.result;
  const steps = result?.steps ?? [];
  const last = steps.length - 1;
  const step = steps[Math.min(i, last)];
  const prev = i > 0 ? steps[i - 1] : null;
  const stale = ran && (ran.src !== src || ran.stdin !== stdin);
  const needsInput = /\b(scanf|getchar|gets)\s*\(/.test(src);
  const atEnd = result && i >= last;
  const editorHeight = height ?? Math.min(420, Math.max(160, src.split('\n').length * 21 + 28));

  const run = (startAt = 'end') => {
    const r = runC(src, { input: stdin });
    setRan({ src, stdin, result: r });
    setI(startAt === 'end' ? Math.max(0, r.steps.length - 1) : 0);
    setPlaying(false);
    return r;
  };

  // Show the result of the starter program straight away (except in predict mode).
  useEffect(() => {
    if (!predict) run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!playing) return undefined;
    if (i >= last) {
      setPlaying(false);
      return undefined;
    }
    const t = setTimeout(() => setI((x) => x + 1), 650);
    return () => clearTimeout(t);
  }, [playing, i, last]);

  const output = result ? result.output.slice(0, step?.out ?? 0) : '';
  const prevOut = prev ? result.output.slice(0, prev.out) : '';
  const fresh = output.startsWith(prevOut) ? output.slice(prevOut.length) : '';
  const errorLine = result?.error && (result.error.kind === 'compile' || atEnd) ? result.error.line : undefined;
  const guessOk = result && norm(guess) === norm(result.output);

  const check = () => {
    run('end');
    setRevealed(true);
  };

  return (
    <div className="space-y-3">
      <CodeEditor
        value={src}
        onChange={setSrc}
        language="c"
        height={editorHeight}
        fileName="program.c"
        keys={KEYS}
        label="C কোড লেখো"
        activeLine={revealed ? step?.line : undefined}
        errorLine={revealed ? errorLine : undefined}
        actions={
          <button type="button" className="btn btn-ghost btn-xs text-white/70" onClick={() => setSrc(code)} title="শুরুর কোডে ফেরো">
            <RotateCcw className="size-3.5" /> রিসেট
          </button>
        }
      />

      {needsInput && (
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-base-content/70">ইনপুট — কীবোর্ড থেকে যা দেবে (scanf এখান থেকে পড়বে; ফাঁকা বা নতুন লাইন দিয়ে আলাদা করো)</span>
          <textarea
            className="textarea textarea-sm w-full font-mono"
            rows={2}
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
            placeholder="যেমন: 5 7"
          />
        </label>
      )}

      {!revealed ? (
        <div className="space-y-2 rounded-xl border border-primary/30 bg-primary/5 p-3">
          <p className="text-sm font-bold">আগে নিজে ভাবো: প্রোগ্রামটির আউটপুট কী হবে?</p>
          <textarea
            className="textarea textarea-sm w-full font-mono"
            rows={3}
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            placeholder="তোমার উত্তর লেখো (প্রতিটি লাইন আলাদা লাইনে)"
          />
          <button type="button" className="btn btn-primary btn-sm" onClick={check}>
            <Eye className="size-4" /> মিলিয়ে দেখো
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="btn btn-primary btn-sm" onClick={() => run('end')}>
            <Play className="size-4" /> চালাও
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => run('start')}>
            ধাপে ধাপে দেখো
          </button>
          {stale && <span className="text-xs text-warning">কোড বা ইনপুট বদলেছে — আবার চালাও</span>}
        </div>
      )}

      {predict && revealed && result && guess.trim() && (
        <p className={clsx('flex items-center gap-1.5 text-sm font-semibold', guessOk ? 'text-success' : 'text-error')}>
          {guessOk ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
          {guessOk ? 'ঠিক! তোমার অনুমান আর আসল আউটপুট এক।' : 'মেলেনি — নিচে ধাপে ধাপে দেখে বোঝো কোথায় পার্থক্য।'}
        </p>
      )}

      {revealed && result?.error?.kind === 'compile' && (
        <div className="flex items-start gap-2 rounded-xl border border-error/40 bg-error/10 p-3 text-sm">
          <XCircle className="mt-0.5 size-4 shrink-0 text-error" />
          <div>
            <b>কম্পাইল এরর — লাইন {toBn(result.error.line)}:</b> {result.error.message}
            <p className="mt-1 text-xs text-base-content/60">কম্পাইলার প্রোগ্রামটি অনুবাদই করতে পারেনি, তাই কিছুই চলেনি।</p>
          </div>
        </div>
      )}

      {revealed && steps.length > 0 && (
        <>
          <div className="flex flex-wrap items-center gap-1 rounded-xl bg-base-200/60 p-2">
            <button type="button" className="btn btn-ghost btn-sm btn-square" onClick={() => setI(0)} disabled={i === 0} aria-label="প্রথম ধাপ">
              <ChevronFirst className="size-4" />
            </button>
            <button type="button" className="btn btn-ghost btn-sm btn-square" onClick={() => setI(Math.max(0, i - 1))} disabled={i === 0} aria-label="আগের ধাপ">
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm btn-square"
              onClick={() => (atEnd ? (setI(0), setPlaying(true)) : setPlaying(!playing))}
              aria-label={playing ? 'থামাও' : 'অটো চালাও'}
            >
              {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
            </button>
            <button type="button" className="btn btn-ghost btn-sm btn-square" onClick={() => setI(Math.min(last, i + 1))} disabled={atEnd} aria-label="পরের ধাপ">
              <ChevronRight className="size-4" />
            </button>
            <button type="button" className="btn btn-ghost btn-sm btn-square" onClick={() => setI(last)} disabled={atEnd} aria-label="শেষ ধাপ">
              <ChevronLast className="size-4" />
            </button>
            <input
              type="range"
              className="range range-xs range-primary mx-2 min-w-24 flex-1"
              min={0}
              max={last}
              value={Math.min(i, last)}
              onChange={(e) => {
                setPlaying(false);
                setI(Number(e.target.value));
              }}
              aria-label="ধাপ"
            />
            <span className="text-xs whitespace-nowrap text-base-content/60">
              ধাপ {toBn(Math.min(i, last) + 1)}/{toBn(last + 1)}
            </span>
          </div>

          <p className="rounded-lg border-l-4 border-amber-400 bg-amber-300/15 px-3 py-2 text-sm">
            <b>লাইন {toBn(step.line)}</b>
            {step.note ? ` — ${step.note}` : ' এইমাত্র চলল'}
          </p>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <p className="mb-1 text-xs font-semibold text-base-content/60">ভেরিয়েবল (মেমোরি)</p>
              <Variables step={step} prev={prev} />
            </div>
            <div>
              <p className="mb-1 flex items-center gap-1 text-xs font-semibold text-base-content/60">
                <TerminalSquare className="size-3.5" /> আউটপুট (স্ক্রিন)
              </p>
              <pre className="min-h-24 overflow-x-auto rounded-lg bg-black/85 p-3 font-mono text-sm whitespace-pre-wrap text-green-300">
                {output.slice(0, output.length - fresh.length)}
                {fresh && <span className="bg-green-300/25">{fresh}</span>}
                {!output && <span className="text-white/30">(এখনো কিছু ছাপা হয়নি)</span>}
              </pre>
            </div>
          </div>
        </>
      )}

      {revealed && result?.error?.kind === 'runtime' && atEnd && (
        <div className="flex items-start gap-2 rounded-xl border border-error/40 bg-error/10 p-3 text-sm">
          <XCircle className="mt-0.5 size-4 shrink-0 text-error" />
          <span>
            <b>রানটাইম এরর — লাইন {toBn(result.error.line)}:</b> {result.error.message}
          </span>
        </div>
      )}

      {revealed && result?.warnings.length > 0 && (
        <ul className="space-y-1 rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm">
          {result.warnings.slice(0, 4).map((w, k) => (
            <li key={k} className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
              <span>
                <b>লাইন {toBn(w.line)}:</b> {w.message}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
