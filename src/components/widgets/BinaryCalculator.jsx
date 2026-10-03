import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { toBn } from '@/lib/bn';

const clean = (s) => s.replace(/[^01]/g, '').replace(/^0+(?=.)/, '');

/** Column-wise binary addition (carry row) or subtraction (borrow row), like working it on paper. */
function work(a, b, op) {
  const w = Math.max(a.length, b.length) + (op === 'add' ? 1 : 0);
  const A = a.padStart(w, '0').split('').map(Number);
  const B = b.padStart(w, '0').split('').map(Number);
  const res = Array(w).fill(0);
  const marks = Array(w).fill(0); // carry into / borrow taken by each column
  let c = 0;
  for (let i = w - 1; i >= 0; i -= 1) {
    marks[i] = c;
    if (op === 'add') {
      const s = A[i] + B[i] + c;
      res[i] = s % 2;
      c = s >> 1;
    } else {
      let d = A[i] - B[i] - c;
      c = d < 0 ? 1 : 0;
      if (d < 0) d += 2;
      res[i] = d;
    }
  }
  return { A, B, res, marks, w };
}

const RULES = {
  add: ['0 + 0 = 0', '0 + 1 = 1', '1 + 0 = 1', '1 + 1 = 10 (যোগফল 0, ক্যারি 1)', '1 + 1 + 1 = 11 (যোগফল 1, ক্যারি 1)'],
  sub: ['0 − 0 = 0', '1 − 0 = 1', '1 − 1 = 0', '0 − 1 = 1 (বাম থেকে ধার 1)'],
};

/**
 * props: op ('add' | 'sub'), a, b (binary strings)
 */
export function BinaryCalculator({ op: initOp = 'add', a: initA = '101100101', b: initB = '11001001' }) {
  const [op, setOp] = useState(initOp);
  const [a, setA] = useState(initA);
  const [b, setB] = useState(initB);

  const A = clean(a) || '0';
  const B = clean(b) || '0';
  const da = parseInt(A, 2);
  const db = parseInt(B, 2);
  const swapped = op === 'sub' && db > da;
  const res = useMemo(() => (swapped ? work(B, A, op) : work(A, B, op)), [A, B, op, swapped]);
  const result = res.res.join('').replace(/^0+(?=.)/, '');
  const decimal = op === 'add' ? da + db : da - db;

  const cell = 'grid h-9 w-7 shrink-0 place-items-center sm:w-8';
  const label = 'flex h-9 w-24 shrink-0 items-center text-sm';

  return (
    <div className="space-y-4">
      <div role="tablist" className="tabs-box tabs tabs-sm w-fit">
        {[
          ['add', 'যোগ'],
          ['sub', 'বিয়োগ'],
        ].map(([k, label]) => (
          <button key={k} type="button" role="tab" className={clsx('tab', op === k && 'tab-active')} onClick={() => setOp(k)}>
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {[
          ['প্রথম সংখ্যা (বাইনারি)', a, setA],
          ['দ্বিতীয় সংখ্যা (বাইনারি)', b, setB],
        ].map(([label, v, set]) => (
          <label key={label} className="block">
            <span className="mb-1 block text-xs font-medium text-base-content/60">{label}</span>
            <input className="input w-full font-mono text-lg tracking-widest" value={v} maxLength={16} inputMode="numeric" onChange={(e) => set(e.target.value.replace(/[^01]/g, ''))} />
          </label>
        ))}
      </div>

      {swapped && (
        <p className="rounded-lg bg-warning/10 p-2 text-sm">দ্বিতীয় সংখ্যাটি বড়, তাই বড় থেকে ছোট বিয়োগ করে উত্তরের আগে − চিহ্ন বসানো হলো।</p>
      )}

      <div className="overflow-x-auto rounded-xl bg-base-200/70 p-4">
        <div className="mx-auto w-fit font-mono text-lg">
          <div className="flex text-sm text-warning">
            <span className={label}>{op === 'add' ? 'ক্যারি' : 'ধার'}</span>
            {res.marks.map((m, i) => (
              <span key={i} className={clsx(cell, 'font-bold')}>
                {m ? '1' : ''}
              </span>
            ))}
          </div>
          {[res.A, res.B].map((row, r) => (
            <div key={r} className="flex">
              <span className={clsx(label, 'text-base-content/50')}>{r === 1 ? (op === 'add' ? '+' : '−') : ''}</span>
              {row.map((d, i) => (
                <span key={i} className={clsx(cell, i === 0 && op === 'add' && d === 0 && 'text-transparent')}>
                  {d}
                </span>
              ))}
            </div>
          ))}
          <div className="my-1 ml-24 border-t-2 border-base-content/40" />
          <div className="flex">
            <span className={clsx(label, 'text-base-content/50')}>{op === 'add' ? 'যোগফল' : 'বিয়োগফল'}</span>
            {res.res.map((d, i) => (
              <span key={i} className={clsx(cell, 'rounded font-bold text-primary', res.marks[i] && !(i === 0 && d === 0) && 'bg-warning/15')}>
                {i === 0 && d === 0 && res.w > 1 ? '' : d}
              </span>
            ))}
          </div>
        </div>
      </div>

      <p className="flex flex-wrap items-center gap-2 font-mono">
        <span>
          ({A})₂ {op === 'add' ? '+' : '−'} ({B})₂ =
        </span>
        <span className="rounded-lg bg-primary px-2 py-0.5 font-bold text-primary-content">
          {swapped ? '−' : ''}({result})₂
        </span>
        <span className="text-sm text-base-content/60">
          যাচাই: {toBn(da)} {op === 'add' ? '+' : '−'} {toBn(db)} = {toBn(decimal)}
        </span>
      </p>

      <details className="rounded-xl border border-base-300 p-3 text-sm">
        <summary className="cursor-pointer font-semibold">{op === 'add' ? 'বাইনারি যোগের নিয়ম' : 'বাইনারি বিয়োগের নিয়ম'}</summary>
        <ul className="mt-2 grid gap-1 font-mono sm:grid-cols-2">
          {RULES[op].map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </details>
    </div>
  );
}
