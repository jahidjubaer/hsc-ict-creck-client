import { useState } from 'react';
import clsx from 'clsx';
import { motion } from 'motion/react';
import { ArrowDown, ArrowUp, Plus, X } from 'lucide-react';
import { toBn } from '@/lib/bn';

// The book's student table (§6.3.1 INSERTs, after Fardeem Munir's record was deleted).
const COLUMNS = ['name', 'class', 'roll', 'section'];
const ROWS = [
  ['Mizanur Rahman', 9, 3, 'morning'],
  ['Mosharraf Hossain', 9, 4, 'morning'],
  ['David Pandey', 9, 2, 'morning'],
  ['Promila Gosh', 8, 2, 'day'],
  ['Bazlur Rahman', 8, 1, 'day'],
  ['Sourav Das', 9, 1, 'day'],
  ['Tamanna Nishat', 10, 1, 'morning'],
  ['Maysha', 10, 1, 'day'],
].map((cells, id) => ({ id, cells }));

/** 'class DESC, roll' -> [{ col: 'class', desc: true }, { col: 'roll', desc: false }] */
const parseOrder = (s) =>
  String(s || '')
    .split(',')
    .map((p) => p.trim().split(/\s+/))
    .filter(([c]) => COLUMNS.includes(c))
    .map(([col, dir]) => ({ col, desc: /^desc$/i.test(dir || '') }));

// Text compares letter by letter (codes), like SQLite's default BINARY collation: 'day' < 'morning'.
const cmp = (a, b) => (typeof a === 'number' ? a - b : a < b ? -1 : a > b ? 1 : 0);

/**
 * ORDER BY builder on the book's student table: add sort columns, flip ASC/DESC and watch the rows move.
 * Props: order (initial ORDER BY list, e.g. 'class DESC, roll').
 */
export function SortLab({ order = 'class' }) {
  const [keys, setKeys] = useState(() => parseOrder(order));
  const sorted = [...ROWS].sort((a, b) => {
    for (const k of keys) {
      const i = COLUMNS.indexOf(k.col);
      const d = cmp(a.cells[i], b.cells[i]);
      if (d) return k.desc ? -d : d;
    }
    return a.id - b.id;
  });
  const free = COLUMNS.filter((c) => !keys.some((k) => k.col === c));
  const sql = `SELECT * FROM student${keys.length ? ` ORDER BY ${keys.map((k) => k.col + (k.desc ? ' DESC' : '')).join(', ')}` : ''};`;

  // Shade runs of rows that tie on the first key, to show where the next key takes over.
  const first = keys[0] && COLUMNS.indexOf(keys[0].col);
  let band = 0;
  const bands = sorted.map((r, i) => (i > 0 && first !== undefined && r.cells[first] !== sorted[i - 1].cells[first] ? ++band : band));

  const set = (i, patch) => setKeys((ks) => ks.map((k, j) => (j === i ? { ...k, ...patch } : k)));

  return (
    <div className="space-y-3">
      <div className="space-y-1.5 rounded-xl border border-base-300 bg-base-200/50 p-3">
        <p className="text-sm font-bold">ORDER BY — কোন কলাম অনুসারে সাজাবে?</p>
        {keys.map((k, i) => (
          <div key={i} className="flex flex-wrap items-center gap-1.5">
            <span className="badge badge-primary badge-sm">{toBn(i + 1)}</span>
            <select className="select select-bordered select-xs w-28 font-mono" value={k.col} onChange={(e) => set(i, { col: e.target.value })}>
              {[k.col, ...free].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <div className="join">
              <button type="button" className={clsx('btn join-item btn-xs', !k.desc && 'btn-active')} onClick={() => set(i, { desc: false })}>
                <ArrowUp className="size-3" /> ছোট→বড়
              </button>
              <button type="button" className={clsx('btn join-item btn-xs', k.desc && 'btn-active')} onClick={() => set(i, { desc: true })}>
                <ArrowDown className="size-3" /> বড়→ছোট (DESC)
              </button>
            </div>
            <button type="button" className="btn btn-ghost btn-xs" onClick={() => setKeys((ks) => ks.filter((_, j) => j !== i))} aria-label="সরাও">
              <X className="size-3.5" />
            </button>
          </div>
        ))}
        {free.length > 0 && (
          <button type="button" className="btn btn-outline btn-xs" onClick={() => setKeys((ks) => [...ks, { col: free[0], desc: false }])}>
            <Plus className="size-3" /> {keys.length ? 'সমান হলে পরের কলাম' : 'কলাম যোগ করো'}
          </button>
        )}
      </div>

      <pre className="overflow-x-auto rounded-lg bg-[#1e1e2e] p-3 font-mono text-sm text-emerald-300 [font-variant-ligatures:none]">{sql}</pre>

      <div className="overflow-x-auto rounded-lg border border-base-300">
        <table className="table-sm table w-full font-mono">
          <thead className="bg-base-200">
            <tr>
              {COLUMNS.map((c) => {
                const k = keys.findIndex((x) => x.col === c);
                return (
                  <th key={c} className={clsx('normal-case', k >= 0 && 'text-primary')}>
                    {c}
                    {k >= 0 && (
                      <span className="ml-1 text-xs">
                        {keys[k].desc ? '↓' : '↑'}
                        {keys.length > 1 && toBn(k + 1)}
                      </span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => (
              <motion.tr key={r.id} layout transition={{ duration: 0.4 }} className={clsx(first !== undefined && bands[i] % 2 && 'bg-base-200/70')}>
                {r.cells.map((v, k) => (
                  <td key={k} className={clsx(keys.some((x) => x.col === COLUMNS[k]) && 'font-bold')}>
                    {v}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-base-content/60">
        ছাই রঙের পট্টিগুলো প্রথম কলামে সমান মানের রো — তাদের ভেতরের ক্রম ঠিক করে পরের কলাম। টেক্সট সাজানো হয় বর্ণানুক্রমে:
        day আগে, morning পরে (d অক্ষরটি m-এর আগে আসে)।
      </p>
    </div>
  );
}
