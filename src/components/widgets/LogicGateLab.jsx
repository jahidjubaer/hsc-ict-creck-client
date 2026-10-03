import { useState } from 'react';
import clsx from 'clsx';
import { Lightbulb } from 'lucide-react';

const GATES = {
  AND: { fn: (a) => a.every(Boolean), expr: (v) => v.join('.'), inputs: 2 },
  OR: { fn: (a) => a.some(Boolean), expr: (v) => v.join(' + '), inputs: 2 },
  NOT: { fn: (a) => !a[0], expr: (v) => `${v[0]}̅`, inputs: 1 },
  NAND: { fn: (a) => !a.every(Boolean), expr: (v) => `(${v.join('.')})̅`, inputs: 2 },
  NOR: { fn: (a) => !a.some(Boolean), expr: (v) => `(${v.join(' + ')})̅`, inputs: 2 },
  XOR: { fn: (a) => a.filter(Boolean).length % 2 === 1, expr: (v) => v.join(' ⊕ '), inputs: 2 },
  XNOR: { fn: (a) => a.filter(Boolean).length % 2 === 0, expr: (v) => `(${v.join(' ⊕ ')})̅`, inputs: 2 },
};

const NAMES = ['A', 'B', 'C'];

/** Standard gate symbol as SVG. Input lines at the given y positions; output at y=40. */
export function GateSymbol({ type, inputs, values = [], output, className = 'h-24 w-36' }) {
  const ys = inputs === 1 ? [40] : inputs === 2 ? [25, 55] : [20, 40, 60];
  const isOr = ['OR', 'NOR', 'XOR', 'XNOR'].includes(type);
  const bubble = ['NOT', 'NAND', 'NOR', 'XNOR'].includes(type);
  const bodyEnd = type === 'NOT' ? 80 : 90;
  const on = 'var(--color-success)';
  const off = 'color-mix(in oklch, var(--color-base-content) 35%, transparent)';

  let body;
  if (type === 'NOT') body = 'M35 12 L80 40 L35 68 Z';
  else if (isOr) body = 'M30 10 Q55 10 72 24 Q84 33 90 40 Q84 47 72 56 Q55 70 30 70 Q44 40 30 10 Z';
  else body = 'M35 10 H60 A30 30 0 0 1 60 70 H35 Z';

  const outX = bubble ? bodyEnd + 10 : bodyEnd;
  return (
    <svg viewBox="0 0 130 80" className={className} role="img" aria-label={`${type} গেট`}>
      {ys.map((y, i) => (
        <line key={i} x1="0" y1={y} x2={isOr ? 38 : 35} y2={y} stroke={values[i] ? on : off} strokeWidth="3" />
      ))}
      {(type === 'XOR' || type === 'XNOR') && <path d="M22 10 Q36 40 22 70" fill="none" stroke="currentColor" strokeWidth="2.5" />}
      <path d={body} fill="var(--color-base-100)" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
      {bubble && <circle cx={bodyEnd + 5} cy="40" r="5" fill="var(--color-base-100)" stroke="currentColor" strokeWidth="2.5" />}
      <line x1={outX} y1="40" x2="130" y2="40" stroke={output ? on : off} strokeWidth="3" />
    </svg>
  );
}

/**
 * Logic gate playground: pick a gate, toggle inputs, watch output + truth table.
 * props: gates (list of gate names to offer), inputs (2|3, ignored for NOT)
 */
export function LogicGateLab({ gates = Object.keys(GATES), inputs: inputCount = 2 }) {
  const [type, setType] = useState(gates[0]);
  const n = type === 'NOT' ? 1 : inputCount;
  const [vals, setVals] = useState([false, false, false]);
  const current = vals.slice(0, n);
  const out = GATES[type].fn(current);

  const rows = Array.from({ length: 2 ** n }, (_, r) => {
    const ins = Array.from({ length: n }, (_, i) => Boolean((r >> (n - 1 - i)) & 1));
    return { ins, out: GATES[type].fn(ins) };
  });

  return (
    <div className="space-y-4">
      {gates.length > 1 && (
        <div role="tablist" className="tabs-box tabs tabs-sm flex-wrap">
          {gates.map((g) => (
            <button key={g} role="tab" type="button" className={clsx('tab font-mono font-semibold', type === g && 'tab-active')} onClick={() => setType(g)}>
              {g}
            </button>
          ))}
        </div>
      )}

      <div className="grid items-center gap-6 md:grid-cols-2">
        <div className="flex items-center justify-center gap-3">
          <div className="flex flex-col gap-3">
            {current.map((v, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setVals((s) => s.map((x, j) => (j === i ? !x : x)))}
                className={clsx('btn btn-sm w-16 font-mono', v ? 'btn-success' : 'btn-outline')}
                aria-label={`ইনপুট ${NAMES[i]} পরিবর্তন`}
              >
                {NAMES[i]}={v ? 1 : 0}
              </button>
            ))}
          </div>
          <GateSymbol type={type} inputs={n} values={current} output={out} />
          <div className="flex flex-col items-center">
            <Lightbulb className={clsx('size-10 transition', out ? 'fill-yellow-300 text-yellow-500 drop-shadow-[0_0_12px_rgba(250,204,21,0.8)]' : 'text-base-content/30')} />
            <span className="font-mono font-bold">Y={out ? 1 : 0}</span>
          </div>
        </div>

        <div>
          <p className="mb-2 text-center font-mono text-lg">
            Y = <span className="font-bold text-primary">{GATES[type].expr(NAMES.slice(0, n))}</span>
          </p>
          <table className="table table-sm mx-auto w-auto rounded-lg bg-base-100 text-center font-mono">
            <thead>
              <tr>
                {NAMES.slice(0, n).map((x) => (
                  <th key={x} className="text-center">
                    {x}
                  </th>
                ))}
                <th className="text-center text-primary">Y</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const active = r.ins.every((v, j) => v === current[j]);
                return (
                  <tr key={i} className={clsx(active && 'bg-primary/15 font-bold')}>
                    {r.ins.map((v, j) => (
                      <td key={j}>{v ? 1 : 0}</td>
                    ))}
                    <td className={r.out ? 'text-success' : ''}>{r.out ? 1 : 0}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-center text-xs text-base-content/50">ইনপুট বাটনে ক্লিক করে 0/1 পরিবর্তন করো — সত্যক সারণির মিলে যাওয়া সারি হাইলাইট হবে।</p>
    </div>
  );
}
