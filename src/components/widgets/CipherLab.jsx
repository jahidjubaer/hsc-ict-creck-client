import { useState } from 'react';
import clsx from 'clsx';
import { CheckCircle2, KeyRound, Lock, LockOpen, Swords, User, XCircle } from 'lucide-react';
import { bnNumber, toBn } from '@/lib/bn';
import { caesar, caesarSteps, transposeGrid, untranspose } from './cipher';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function DirToggle({ dir, setDir }) {
  return (
    <div className="join">
      <button type="button" className={clsx('btn join-item btn-sm', dir === 'enc' && 'btn-primary')} onClick={() => setDir('enc')}>
        <Lock className="size-4" /> এনক্রিপ্ট
      </button>
      <button type="button" className={clsx('btn join-item btn-sm', dir === 'dec' && 'btn-primary')} onClick={() => setDir('dec')}>
        <LockOpen className="size-4" /> ডিক্রিপ্ট
      </button>
    </div>
  );
}

function Flow({ input, output, dir }) {
  const [l, r] = dir === 'enc' ? ['প্লেইন টেক্সট', 'সাইফার টেক্সট'] : ['সাইফার টেক্সট', 'প্লেইন টেক্সট'];
  return (
    <div className="grid items-center gap-2 sm:grid-cols-[1fr_auto_1fr]">
      <div className="rounded-lg border border-base-300 bg-base-200/50 p-2">
        <p className="text-xs text-base-content/60">{l}</p>
        <p className="font-mono text-lg break-all">{input || '…'}</p>
      </div>
      <span className="text-center text-xl text-base-content/40">→</span>
      <div className="rounded-lg border-2 border-primary/40 bg-primary/5 p-2">
        <p className="text-xs text-base-content/60">{r}</p>
        <p className="font-mono text-lg font-bold break-all">{output || '…'}</p>
      </div>
    </div>
  );
}

function CaesarMode({ text: initial, shift: initialShift }) {
  const [text, setText] = useState(initial);
  const [k, setK] = useState(initialShift);
  const [dir, setDir] = useState('enc');
  const [brute, setBrute] = useState(false);
  const s = dir === 'enc' ? k : -k;
  const out = caesar(text, s);
  const steps = caesarSteps(text, s).slice(0, 12);
  const used = new Set(steps.map((st) => st.x));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex grow flex-col">
          <span className="label-text mb-1 text-xs">{dir === 'enc' ? 'মূল বার্তা (ইংরেজি অক্ষর)' : 'সাইফার টেক্সট'}</span>
          <input className="input input-bordered input-sm font-mono uppercase" value={text} onChange={(e) => setText(e.target.value.slice(0, 60))} />
        </label>
        <DirToggle dir={dir} setDir={setDir} />
      </div>
      <label className="flex items-center gap-3 text-sm">
        <span className="shrink-0">
          কি (key) = <b className="font-mono text-lg">{toBn(k)}</b>
        </span>
        <input type="range" min="1" max="25" value={k} onChange={(e) => setK(Number(e.target.value))} className="range range-primary range-sm" />
      </label>

      <div className="overflow-x-auto">
        <div className="inline-grid min-w-full gap-y-0.5 font-mono text-xs" style={{ gridTemplateColumns: 'auto repeat(26, minmax(1.4rem, 1fr))' }}>
          <span className="pr-2 text-base-content/50">{dir === 'enc' ? 'প্লেইন' : 'সাইফার'}</span>
          {[...ALPHABET].map((ch, i) => (
            <span key={ch} className={clsx('rounded py-0.5 text-center', used.has(i) ? 'bg-amber-300/50 font-bold' : 'bg-base-200')}>
              {ch}
            </span>
          ))}
          <span className="pr-2 text-base-content/50">{dir === 'enc' ? 'সাইফার' : 'প্লেইন'}</span>
          {[...ALPHABET].map((ch, i) => (
            <span key={ch} className={clsx('rounded py-0.5 text-center', used.has(i) ? 'bg-primary/30 font-bold' : 'bg-base-200/60')}>
              {ALPHABET[(((i + s) % 26) + 26) % 26]}
            </span>
          ))}
        </div>
      </div>

      <Flow input={text.toUpperCase()} output={out.toUpperCase()} dir={dir} />

      {steps.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-base-300">
          <table className="table-xs table w-full text-center font-mono">
            <tbody>
              <tr>
                <th className="text-left font-sans">অক্ষর</th>
                {steps.map((st, i) => (
                  <td key={i}>{st.ch}</td>
                ))}
              </tr>
              <tr>
                <th className="text-left font-sans">অবস্থান x (A=0)</th>
                {steps.map((st, i) => (
                  <td key={i}>{st.x}</td>
                ))}
              </tr>
              <tr>
                <th className="text-left font-sans">
                  (x {dir === 'enc' ? '+' : '−'} {k}) mod 26
                </th>
                {steps.map((st, i) => (
                  <td key={i}>{st.y}</td>
                ))}
              </tr>
              <tr className="bg-primary/10 font-bold">
                <th className="text-left font-sans">ফল</th>
                {steps.map((st, i) => (
                  <td key={i}>{st.out}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <div className="rounded-xl border border-base-300 p-3">
        <button type="button" className="btn btn-outline btn-sm" onClick={() => setBrute((b) => !b)}>
          <Swords className="size-4" /> {brute ? 'লুকাও' : 'হ্যাকারের মতো সব কি চেষ্টা করো'}
        </button>
        {brute && (
          <>
            <p className="mt-2 text-sm">
              কি না জেনেও সাইফার টেক্সট <b className="font-mono">{(dir === 'enc' ? out : text).toUpperCase()}</b>-এর জন্য মাত্র ২৫টি কি চেষ্টা করলেই
              মূল বার্তা বেরিয়ে আসে — তাই সিজার সাইফার এখন আর নিরাপদ নয়।
            </p>
            <div className="mt-2 grid grid-cols-2 gap-1 font-mono text-xs sm:grid-cols-3">
              {Array.from({ length: 25 }, (_, i) => i + 1).map((key) => (
                <span key={key} className={clsx('truncate rounded px-1.5 py-0.5', key === k ? 'bg-success/25 font-bold' : 'bg-base-200')}>
                  {String(key).padStart(2, ' ')}: {caesar(dir === 'enc' ? out : text, -key).toUpperCase()}
                </span>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function TranspositionMode({ text: initial, keyword }) {
  const [text, setText] = useState(initial);
  const [key, setKey] = useState(keyword);
  const [dir, setDir] = useState('enc');
  const enc = transposeGrid(text, key);
  const dec = dir === 'dec' ? untranspose(text, key) : null;
  const grid = dir === 'enc' ? enc : dec;
  const output = dir === 'enc' ? enc.cipher : dec?.plain;
  const keyChars = [...key.toUpperCase().replace(/[^A-Z0-9]/g, '')];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex grow flex-col">
          <span className="label-text mb-1 text-xs">{dir === 'enc' ? 'মূল বার্তা' : 'সাইফার টেক্সট'}</span>
          <input className="input input-bordered input-sm font-mono uppercase" value={text} onChange={(e) => setText(e.target.value.slice(0, 48))} />
        </label>
        <label className="flex flex-col">
          <span className="label-text mb-1 text-xs">কি (শব্দ বা সংখ্যা)</span>
          <input className="input input-bordered input-sm w-28 font-mono uppercase" value={key} onChange={(e) => setKey(e.target.value.slice(0, 8))} />
        </label>
        <DirToggle dir={dir} setDir={setDir} />
      </div>

      {grid && grid.rows.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="mx-auto border-separate border-spacing-1 text-center font-mono">
            <thead>
              <tr>
                {keyChars.map((c, i) => (
                  <th key={i} className="rounded bg-primary/20 px-2.5 py-1">
                    {c}
                    <span className="block text-[10px] font-normal text-base-content/60">{toBn(grid.rank[i] + 1)} নং</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grid.rows.map((row, r) => (
                <tr key={r}>
                  {row.map((ch, c) => (
                    <td key={c} className="rounded bg-base-200 px-2.5 py-1">
                      {ch}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-warning">
          {dir === 'dec' ? 'সাইফার টেক্সটের অক্ষর-সংখ্যা কি-এর দৈর্ঘ্যের গুণিতক হতে হবে।' : 'বার্তা ও কি লেখো।'}
        </p>
      )}

      <Flow input={text.toUpperCase()} output={output} dir={dir} />
      <p className="text-xs text-base-content/60">
        {dir === 'enc'
          ? `বার্তাটি (ফাঁকা জায়গা বাদে) কি-এর নিচে সারি ধরে লেখা হয়েছে${enc.padded ? `, শেষের ফাঁকা ঘরে ${toBn(enc.padded)}টি X বসানো হয়েছে` : ''}। তারপর কি-এর অক্ষর বর্ণানুক্রমে যে কলাম আগে, সেই কলাম উপর থেকে নিচে পড়া হয়েছে। অক্ষর বদলায়নি, শুধু জায়গা বদলেছে।`
          : 'উল্টো কাজ: সাইফার টেক্সট কি-এর ক্রম অনুযায়ী কলামে কলামে বসিয়ে সারি ধরে পড়লে মূল বার্তা ফেরত আসে।'}
      </p>
    </div>
  );
}

const PEOPLE = ['A', 'B', 'C'];

function KeysMode() {
  const [to, setTo] = useState('B');
  const [lockKey, setLockKey] = useState('B-public');
  const [n, setN] = useState(1000000);
  const [owner, kind] = lockKey.split('-');
  const opens = (p) => kind === 'public' && owner === p; // only the matching private key opens a public-key lock
  const sentOk = opens(to);
  const keyLabel = (k) => {
    const [o, t] = k.split('-');
    return `${o}-এর ${t === 'public' ? 'পাবলিক' : 'প্রাইভেট'} কি`;
  };
  const symmetricKeys = (n * (n - 1)) / 2;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-base-300 p-3">
        <p className="mb-2 text-sm font-bold">অ্যাসিমেট্রিক: A একটি গোপন বার্তা পাঠাবে</p>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span>কাকে পাঠাবে?</span>
          {['B', 'C'].map((p) => (
            <button key={p} type="button" className={clsx('btn btn-xs', to === p ? 'btn-primary' : 'btn-outline')} onClick={() => setTo(p)}>
              {p}
            </button>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1 text-sm">
          <span className="mr-1">কোন কি দিয়ে তালা (এনক্রিপ্ট) দেবে?</span>
          {['B-public', 'C-public', 'A-public', 'A-private'].map((k) => (
            <button key={k} type="button" className={clsx('btn btn-xs', lockKey === k ? 'btn-secondary' : 'btn-outline')} onClick={() => setLockKey(k)}>
              <KeyRound className="size-3" /> {keyLabel(k)}
            </button>
          ))}
        </div>
        <p className="mt-1 text-xs text-base-content/60">A-এর কাছে সবার পাবলিক কি আছে (সবাই নিজের পাবলিক কি জানিয়ে দেয়), কিন্তু প্রাইভেট কি শুধু নিজের।</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {PEOPLE.map((p) => (
            <div key={p} className={clsx('rounded-lg border p-2 text-center text-sm', p === to ? 'border-primary' : 'border-base-300')}>
              <User className="mx-auto size-5" />
              <b>{p}</b> {p === to && <span className="text-xs">(প্রাপক)</span>}
              <p className="mt-1 text-xs">{p}-এর প্রাইভেট কি দিয়ে খোলার চেষ্টা:</p>
              {p === 'A' && kind === 'private' ? (
                <p className="text-xs text-base-content/50">—</p>
              ) : opens(p) ? (
                <p className="flex items-center justify-center gap-1 text-success">
                  <LockOpen className="size-4" /> খুলেছে
                </p>
              ) : (
                <p className="flex items-center justify-center gap-1 text-error">
                  <Lock className="size-4" /> পারেনি
                </p>
              )}
            </div>
          ))}
        </div>
        <p className={clsx('mt-2 flex items-start gap-2 rounded-lg p-2 text-sm', sentOk ? 'bg-success/15' : 'bg-error/10')}>
          {sentOk ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" /> : <XCircle className="mt-0.5 size-4 shrink-0 text-error" />}
          {sentOk
            ? `ঠিক! প্রাপক ${to}-এর পাবলিক কি দিয়ে এনক্রিপ্ট করায় কেবল ${to} তার প্রাইভেট কি দিয়ে ডিক্রিপ্ট করতে পারে।`
            : kind === 'private'
              ? 'এভাবে গোপন বার্তা পাঠানো যায় না — A-এর পাবলিক কি সবার কাছে আছে, তাই যে কেউ খুলে ফেলতে পারবে। গোপনীয়তার জন্য প্রাপকের পাবলিক কি লাগে।'
              : `${to} এটা খুলতে পারবে না — ${to}-এর কাছে পাঠাতে হলে ${to}-এর পাবলিক কি দিয়েই এনক্রিপ্ট করতে হবে।`}
        </p>
      </div>

      <div className="rounded-xl border border-base-300 p-3">
        <p className="mb-2 text-sm font-bold">সিমেট্রিক কি-র সমস্যা: প্রতি জোড়ার জন্য আলাদা গোপন কি</p>
        <div className="flex flex-wrap gap-1">
          {[3, 10, 100, 1000000].map((v) => (
            <button key={v} type="button" className={clsx('btn btn-xs', n === v ? 'btn-primary' : 'btn-outline')} onClick={() => setN(v)}>
              {bnNumber(v)} জন
            </button>
          ))}
        </div>
        <p className="mt-2 text-sm">
          সবাই যদি সবার সাথে গোপনে কথা বলতে চায় — সিমেট্রিকে লাগবে <b>{bnNumber(symmetricKeys)}টি</b> শেয়ার করা কি, আর প্রতিটি কি গোপনে পৌঁছে দিতে হবে।
          অ্যাসিমেট্রিকে প্রত্যেকের এক জোড়া, মোট <b>{bnNumber(2 * n)}টি</b> কি, যার অর্ধেক (পাবলিক কি) খোলাখুলি জানানো যায়।
        </p>
        <p className="mt-1 text-xs text-base-content/60">
          বইয়ের উদাহরণ: ই-কমার্স সাইটের ১০ লক্ষ গ্রাহকের প্রত্যেকের জন্য আলাদা গোপন কি রাখা বাস্তবসম্মত নয়। (জোড়ার সংখ্যা = n(n−1)/2 — হিসাবটি বইয়ের বাইরে।)
        </p>
      </div>
    </div>
  );
}

/**
 * Encryption lab. Props: mode ('caesar' | 'transposition' | 'keys'), text (starting message),
 * shift (Caesar key, default 3), keyword (transposition key, default 'ZEBRA').
 */
export function CipherLab({ mode = 'caesar', text, shift = 3, keyword = 'ZEBRA' }) {
  if (mode === 'keys') return <KeysMode />;
  if (mode === 'transposition') return <TranspositionMode text={text ?? 'WE ARE DISCOVERED'} keyword={keyword} />;
  return <CaesarMode text={text ?? 'ICT'} shift={shift} />;
}
