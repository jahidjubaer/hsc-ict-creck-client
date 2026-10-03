import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { BookOpen, Plus, RotateCcw, Search } from 'lucide-react';
import { bnNumber, toBn } from '@/lib/bn';

// A few SSC candidates of one board, in the order their records were entered (book §6.3.3 example).
const START = [
  [215407, 'রাফি আহমেদ'],
  [108233, 'নুসরাত জাহান'],
  [173580, 'তানভীর হাসান'],
  [131902, 'সাদিয়া ইসলাম'],
  [246118, 'অর্পিতা দাস'],
  [120764, 'মাহমুদুল হক'],
  [198345, 'ফারহানা আক্তার'],
  [102579, 'জুবায়ের রহমান'],
  [229036, 'ইমরান কবির'],
  [157211, 'তাসনিম হক'],
  [184697, 'শুভ চক্রবর্তী'],
  [140385, 'মাইশা মালিহা'],
  [236950, 'রিয়াদ হোসেন'],
  [113648, 'সুমাইয়া খাতুন'],
  [165029, 'আরিফুল ইসলাম'],
].map(([roll, name], i) => ({ row: i + 1, roll, name }));

const SIZES = [15, 1000, 100000, 1000000];
const worstBinary = (n) => Math.floor(Math.log2(n)) + 1;

/** Frames for a full-table (linear) scan. */
function linearFrames(table, roll) {
  const frames = [];
  for (let i = 0; i < table.length; i++) {
    const found = table[i].roll === roll;
    frames.push({ cur: i, count: i + 1, found: found ? table[i].row : null, done: found || i === table.length - 1 });
    if (found) break;
  }
  return frames;
}

/** Frames for binary search on the sorted index. `stopAt` = where a new key would go (for INSERT). */
function binaryFrames(index, roll) {
  const frames = [];
  let lo = 0;
  let hi = index.length - 1;
  let count = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    count++;
    const found = index[mid].roll === roll;
    frames.push({ lo, hi, mid, count, found: found ? index[mid].row : null, done: found });
    if (found) return frames;
    if (index[mid].roll < roll) lo = mid + 1;
    else hi = mid - 1;
  }
  frames.push({ lo, hi, mid: -1, count, found: null, done: true, insertAt: lo });
  return frames;
}

/**
 * Indexing demo: find a roll number by scanning the whole table vs. binary search on a sorted index,
 * then INSERT a record and see the extra work the index needs. No props.
 */
export function IndexLab() {
  const [table, setTable] = useState(START);
  const [query, setQuery] = useState('184697');
  const [anim, setAnim] = useState(null); // { kind, frames, at }
  const [stats, setStats] = useState({});
  const [newRoll, setNewRoll] = useState('150000');
  const [size, setSize] = useState(1000000);
  const index = useMemo(() => [...table].sort((a, b) => a.roll - b.roll), [table]);

  useEffect(() => {
    if (!anim) return;
    let next;
    if (anim.at < anim.frames.length - 1) next = () => setAnim((a) => ({ ...a, at: a.at + 1 }));
    // INSERT: after finding the place in the index, shift the entries below it to make room.
    else if (anim.kind === 'insert') next = () => setAnim({ kind: 'shift', frames: anim.shifts, at: 0, roll: anim.roll, comps: anim.frames.at(-1).count });
    if (!next) return;
    const t = setTimeout(next, anim.kind === 'shift' ? 250 : 650);
    return () => clearTimeout(t);
  }, [anim]);

  const frame = anim?.frames[anim.at];
  const finished = !!anim && anim.at === anim.frames.length - 1 && anim.kind !== 'insert';

  const start = (kind) => {
    const roll = Number(query);
    const frames = kind === 'linear' ? linearFrames(table, roll) : binaryFrames(index, roll);
    setAnim({ kind, roll, at: 0, frames });
    setStats((s) => ({ ...(s.roll === roll ? s : { roll }), [kind]: frames.at(-1).count }));
  };

  const exists = table.some((r) => r.roll === Number(newRoll));
  const validNew = /^\d{6}$/.test(newRoll) && !exists;
  const insert = () => {
    const roll = Number(newRoll);
    const frames = binaryFrames(index, roll);
    const pos = frames.at(-1).insertAt;
    const shifts = Array.from({ length: Math.max(1, index.length - pos + 1) }, (_, i) => ({ moved: i, pos, total: index.length - pos }));
    setTable((t) => [...t, { row: t.length + 1, roll, name: 'নতুন শিক্ষার্থী', fresh: true }]);
    setAnim({ kind: 'insert', roll, at: 0, frames, shifts });
  };
  const reset = () => {
    setTable(START);
    setAnim(null);
    setStats({});
  };

  // Highlight helpers. While an INSERT is animating, the index view shows the old index (without the new key).
  const inserting = anim?.kind === 'insert' || anim?.kind === 'shift';
  const viewIndex = inserting && anim.kind === 'insert' ? index.filter((r) => r.roll !== anim.roll) : index;
  const tableClass = (i, r) => {
    if (anim?.kind === 'linear' && frame) {
      if (frame.found === r.row) return 'bg-success/30 font-bold';
      if (i === frame.cur) return 'bg-amber-300/50';
      if (i < frame.cur) return 'text-base-content/35';
    }
    if (anim?.kind === 'binary' && frame?.found === r.row) return 'bg-success/30 font-bold';
    if (r.fresh && inserting) return 'bg-sky-300/30';
    return '';
  };
  const indexClass = (i, r) => {
    if ((anim?.kind === 'binary' || anim?.kind === 'insert') && frame) {
      if (frame.found === r.row) return 'bg-success/30 font-bold';
      if (i === frame.mid) return 'bg-amber-300/50';
      if (i < frame.lo || i > frame.hi) return 'text-base-content/30';
      return 'bg-sky-300/15';
    }
    if (anim?.kind === 'shift') {
      if (r.roll === anim.roll) return 'bg-sky-300/40 font-bold';
      const pos = frame.pos;
      if (i > pos && i <= pos + frame.moved) return 'bg-amber-300/40';
    }
    return '';
  };

  const note = (() => {
    if (!anim || !frame) return null;
    if (anim.kind === 'linear')
      return frame.found
        ? `পাওয়া গেছে ${toBn(frame.count)}টি রো দেখার পর — টেবিলের শুরু থেকে একটা একটা করে মেলাতে হয়েছে।`
        : frame.done
          ? `${toBn(frame.count)}টি রো-ই দেখতে হলো — এই রোল টেবিলে নেই।`
          : `${toBn(frame.count)} নম্বর রো দেখছি…`;
    if (anim.kind === 'binary')
      return frame.found
        ? `মাত্র ${toBn(frame.count)}টি তুলনায় পাওয়া গেছে! ইনডেক্স বলে দিল রেকর্ডটি টেবিলের ${toBn(frame.found)} নম্বর রো-তে।`
        : frame.done
          ? `${toBn(frame.count)}টি তুলনায় নিশ্চিত হওয়া গেল — এই রোল নেই।`
          : `মাঝের এন্ট্রি ${frame.mid >= 0 ? toBn(index[frame.mid].roll) : ''} দেখছি — খোঁজা রোল ${Number(query) < (index[frame.mid]?.roll ?? 0) ? 'ছোট, তাই উপরের অর্ধেকে' : 'বড়, তাই নিচের অর্ধেকে'} খুঁজব।`;
    if (anim.kind === 'insert') return `ইনডেক্সে নতুন রোলটির জায়গা খুঁজছি (${toBn(frame.count)}টি তুলনা)…`;
    return frame.moved < frame.total
      ? `জায়গা করতে ইনডেক্সের নিচের এন্ট্রিগুলো সরাতে হচ্ছে… (${toBn(frame.moved)}/${toBn(frame.total)})`
      : `টেবিলে কাজ ছিল ১টি (শেষে যোগ), কিন্তু ইনডেক্সে ${toBn(anim.comps)}টি তুলনা + ${toBn(frame.total)}টি এন্ট্রি সরানো লাগল — তাই ইনডেক্স থাকলে INSERT, UPDATE, DELETE ধীর হয়।`;
  })();

  const busy = !!anim && !finished;
  // A count is shown once its own animation has finished.
  const shown = (kind) => (anim?.kind === kind && !finished ? 0 : stats[kind] || 0);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2 rounded-xl border border-base-300 bg-base-200/50 p-3">
        <label className="flex flex-col">
          <span className="label-text mb-1 text-xs">যে রোল খুঁজবে</span>
          <input
            className="input input-bordered input-sm w-32 font-mono"
            inputMode="numeric"
            value={query}
            onChange={(e) => setQuery(e.target.value.replace(/\D/g, '').slice(0, 6))}
          />
        </label>
        <button type="button" className="btn btn-sm btn-outline" disabled={busy || !query} onClick={() => start('linear')}>
          <Search className="size-4" /> ইনডেক্স ছাড়া খোঁজো
        </button>
        <button type="button" className="btn btn-sm btn-primary" disabled={busy || !query} onClick={() => start('binary')}>
          <BookOpen className="size-4" /> ইনডেক্স দিয়ে খোঁজো
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={reset} title="শুরুর অবস্থায় ফেরো">
          <RotateCcw className="size-4" />
        </button>
      </div>

      {shown('linear') + shown('binary') > 0 && (
        <div className="grid grid-cols-2 gap-2 text-center text-sm">
          <div className="rounded-lg border border-base-300 p-2">
            ইনডেক্স ছাড়া <b className="block text-lg">{shown('linear') ? `${toBn(shown('linear'))}টি তুলনা` : '—'}</b>
          </div>
          <div className="rounded-lg border border-primary/40 bg-primary/5 p-2">
            ইনডেক্স দিয়ে <b className="block text-lg">{shown('binary') ? `${toBn(shown('binary'))}টি তুলনা` : '—'}</b>
          </div>
        </div>
      )}
      <p className="min-h-10 text-sm">{note}</p>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <p className="mb-1 text-sm font-bold">টেবিল — যে ক্রমে ডেটা ঢুকেছে</p>
          <div className="overflow-x-auto rounded-lg border border-base-300">
            <table className="table-xs table w-full">
              <thead className="bg-base-200">
                <tr>
                  <th>রো</th>
                  <th>roll</th>
                  <th>name</th>
                </tr>
              </thead>
              <tbody>
                {table.map((r, i) => (
                  <tr key={r.row} className={clsx('transition-colors', tableClass(i, r))}>
                    <td className="text-base-content/50">{toBn(r.row)}</td>
                    <td className="font-mono">{r.roll}</td>
                    <td>{r.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <p className="mb-1 text-sm font-bold">ইনডেক্স — roll অনুসারে সাজানো, সাথে রো নম্বর</p>
          <div className="overflow-x-auto rounded-lg border border-primary/40">
            <table className="table-xs table w-full">
              <thead className="bg-primary/10">
                <tr>
                  <th>roll</th>
                  <th>→ রো</th>
                </tr>
              </thead>
              <tbody>
                {viewIndex.map((r, i) => (
                  <tr key={r.roll} className={clsx('transition-colors', indexClass(i, r))}>
                    <td className="font-mono">{r.roll}</td>
                    <td className="text-base-content/60">{toBn(r.row)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-2 rounded-xl border border-base-300 p-3">
        <label className="flex flex-col">
          <span className="label-text mb-1 text-xs">নতুন রেকর্ড যোগ করো (INSERT) — রোল</span>
          <input
            className="input input-bordered input-sm w-32 font-mono"
            inputMode="numeric"
            value={newRoll}
            onChange={(e) => setNewRoll(e.target.value.replace(/\D/g, '').slice(0, 6))}
          />
        </label>
        <button type="button" className="btn btn-sm btn-outline" disabled={busy || !validNew} onClick={insert}>
          <Plus className="size-4" /> INSERT
        </button>
        {exists && <span className="text-xs text-error">এই রোল আগেই আছে</span>}
      </div>

      <div className="rounded-xl border border-base-300 p-3">
        <p className="mb-2 text-sm font-bold">বড় টেবিলে সবচেয়ে খারাপ ক্ষেত্রে কতগুলো তুলনা লাগে?</p>
        <div className="mb-2 flex flex-wrap gap-1">
          {SIZES.map((n) => (
            <button key={n} type="button" className={clsx('btn btn-xs', size === n ? 'btn-primary' : 'btn-outline')} onClick={() => setSize(n)}>
              {bnNumber(n)} রেকর্ড
            </button>
          ))}
        </div>
        <div className="space-y-1.5 text-sm">
          <div>
            ইনডেক্স ছাড়া (লিনিয়ার সার্চ): <b>{bnNumber(size)}টি</b>
            <div className="h-2.5 w-full rounded bg-error/60" />
          </div>
          <div>
            ইনডেক্স দিয়ে (বাইনারি সার্চ): <b>{toBn(worstBinary(size))}টি</b>
            <div className="h-2.5 rounded bg-success" style={{ width: `${Math.max(0.6, (worstBinary(size) / size) * 100)}%` }} />
          </div>
        </div>
        <p className="mt-2 text-xs text-base-content/60">
          এসএসসিতে এক বোর্ডেই ৫–১০ লক্ষ পরীক্ষার্থী। ইনডেক্স অভিধানের মতো — শব্দগুলো সাজানো থাকে বলে মাঝখান থেকে খুলে অর্ধেক অর্ধেক করে খোঁজা যায়।
          আসল ডেটাবেজ ইনডেক্স রাখতে B-tree নামের গঠন ব্যবহার করে, তবে মূল ধারণা এটাই। ইনডেক্সের জন্য বাড়তি জায়গাও লাগে — ডানের পুরো তালিকাটাই বাড়তি।
        </p>
      </div>
    </div>
  );
}
