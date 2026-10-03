import { useMemo, useState } from 'react';
import { ArrowLeftRight, Calculator } from 'lucide-react';
import clsx from 'clsx';
import { BASES, convert, validate, withBase } from './numberMath';
import { toBn } from '@/lib/bn';

const BASE_KEYS = [2, 8, 10, 16];

/** "2^3" -> 2<sup>3</sup> for step text. */
function Expr({ text }) {
  const parts = text.split(/(\^-?\d+)/g);
  return parts.map((p, i) => (p.startsWith('^') ? <sup key={i}>{p.slice(1)}</sup> : <span key={i}>{p}</span>));
}

function BaseSelect({ value, onChange, label, disabled }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-base-content/60">{label}</span>
      <select className="select select-sm w-full" value={value} disabled={disabled} onChange={(e) => onChange(Number(e.target.value))}>
        {BASE_KEYS.map((b) => (
          <option key={b} value={b}>
            {BASES[b].name} ({toBn(b)})
          </option>
        ))}
      </select>
    </label>
  );
}

function GroupView({ groups, fGroups, fromBinary }) {
  const cell = (g, i) => (
    <div key={i} className="flex flex-col items-center rounded-lg border border-base-300 bg-base-100 px-2 py-1 font-mono">
      <span className={clsx(fromBinary ? 'text-base-content/70' : 'text-lg font-bold text-primary')}>{fromBinary ? g.bits : g.digit}</span>
      <span className="text-xs text-base-content/40">↓</span>
      <span className={clsx(fromBinary ? 'text-lg font-bold text-primary' : 'text-base-content/70')}>{fromBinary ? g.digit : g.bits}</span>
    </div>
  );
  return (
    <div className="flex flex-wrap items-end gap-1.5">
      {groups.map(cell)}
      {fGroups?.length > 0 && <span className="px-1 pb-2 text-2xl font-bold">.</span>}
      {fGroups?.map(cell)}
    </div>
  );
}

/**
 * Interactive base converter showing the exact board-exam working.
 * props: from, to, value (defaults), fixed (lock base selectors)
 */
export function NumberConverter({ from: initFrom = 10, to: initTo = 2, value = '25.625', fixed = false }) {
  const [input, setInput] = useState(value);
  const [from, setFrom] = useState(initFrom);
  const [to, setTo] = useState(initTo);

  const error = validate(input, from);
  const res = useMemo(() => (error ? null : convert(input, from, to)), [input, from, to, error]);

  const swap = () => {
    if (res && !res.approx) setInput(res.result);
    setFrom(to);
    setTo(from);
  };

  return (
    <div className="space-y-4">
      <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
        <BaseSelect label="যে পদ্ধতি থেকে" value={from} onChange={setFrom} disabled={fixed} />
        <button type="button" className="btn btn-circle btn-ghost btn-sm mx-auto" onClick={swap} disabled={fixed} aria-label="অদলবদল">
          <ArrowLeftRight className="size-4" />
        </button>
        <BaseSelect label="যে পদ্ধতিতে" value={to} onChange={setTo} disabled={fixed} />
      </div>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-base-content/60">সংখ্যা লেখো</span>
        <input
          className={clsx('input w-full font-mono text-lg tracking-wider', error && 'input-error')}
          value={input}
          onChange={(e) => setInput(e.target.value.toUpperCase())}
          inputMode={from <= 10 ? 'decimal' : 'text'}
          spellCheck={false}
        />
        {error && <span className="mt-1 block text-sm text-error">{error}</span>}
      </label>

      {res && (
        <div className="space-y-4 rounded-xl bg-base-200/70 p-4">
          <p className="flex flex-wrap items-center gap-2 font-mono text-lg">
            <Calculator className="size-5 text-primary" />
            <span>{withBase(input || '0', from)}</span>
            <span>=</span>
            <span className="rounded-lg bg-primary px-2 py-0.5 font-bold text-primary-content">{withBase(res.result, to)}</span>
            {res.approx && <span className="badge badge-warning badge-sm font-sans">প্রায় (৬ ঘর পর্যন্ত)</span>}
          </p>

          {res.steps?.length > 0 && (
            <ol className="list-decimal space-y-1 pl-5 text-sm">
              {res.steps.map((s, i) => (
                <li key={i}>
                  <Expr text={s} />
                </li>
              ))}
            </ol>
          )}

          {res.method === 'fromDecimal' && (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="mb-1 text-sm font-semibold">পূর্ণ অংশ: ভাগ পদ্ধতি</p>
                <table className="table-zebra table table-sm rounded-lg bg-base-100 font-mono">
                  <thead>
                    <tr>
                      <th>ভাজক</th>
                      <th>ভাজ্য</th>
                      <th>ভাগফল</th>
                      <th>ভাগশেষ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {res.divRows.map((r, i) => (
                      <tr key={i}>
                        <td>{to}</td>
                        <td>{r.dividend}</td>
                        <td>{r.quotient}</td>
                        <td className="font-bold text-primary">{r.remainder}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-1 text-xs text-base-content/60">↑ ভাগশেষগুলো নিচ থেকে উপরে পড়ো</p>
              </div>
              {res.mulRows.length > 0 && (
                <div>
                  <p className="mb-1 text-sm font-semibold">ভগ্নাংশ: গুণ পদ্ধতি</p>
                  <table className="table-zebra table table-sm rounded-lg bg-base-100 font-mono">
                    <thead>
                      <tr>
                        <th>ভগ্নাংশ × {to}</th>
                        <th>গুণফল</th>
                        <th>পূর্ণ অংশ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {res.mulRows.map((r, i) => (
                        <tr key={i}>
                          <td>
                            {r.fraction} × {to}
                          </td>
                          <td>{r.product}</td>
                          <td className="font-bold text-primary">{r.digit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="mt-1 text-xs text-base-content/60">↓ পূর্ণ অংশগুলো উপর থেকে নিচে পড়ো</p>
                </div>
              )}
            </div>
          )}

          {res.method === 'group' && <GroupView groups={res.groups} fGroups={res.fGroups} fromBinary={from === 2} />}

          {res.method === 'viaBinary' && (
            <div className="space-y-3 text-sm">
              <p>
                ধাপ ১: {BASES[from].name} → বাইনারি = <span className="font-mono font-bold">{res.first.result}</span>
              </p>
              <GroupView groups={res.first.groups} fGroups={res.first.fGroups} fromBinary={false} />
              <p>ধাপ ২: বাইনারি → {BASES[to].name}</p>
              <GroupView groups={res.second.groups} fGroups={res.second.fGroups} fromBinary />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
