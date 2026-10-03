import { useState } from 'react';
import clsx from 'clsx';
import { RotateCcw, Zap } from 'lucide-react';
import { toBn } from '@/lib/bn';

const SUB = '₀₁₂₃₄₅₆₇';

function Bit({ value, label, big }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span
        className={clsx(
          'grid place-items-center rounded-lg border-2 font-mono font-bold transition',
          big ? 'size-14 text-2xl' : 'size-10 text-lg',
          value ? 'border-success bg-success/15 text-success' : 'border-base-300 bg-base-100'
        )}
      >
        {value}
      </span>
      {label && <span className="font-mono text-xs text-base-content/60">{label}</span>}
    </div>
  );
}

function PulseButton({ onClick, children = 'CLK পালস দাও' }) {
  return (
    <button type="button" className="btn btn-primary btn-sm" onClick={onClick}>
      <Zap className="size-4" /> {children}
    </button>
  );
}

/** The book's flip-flop: two cross-coupled NAND gates with inputs x, y (normally kept at 1). */
function SrLatch() {
  const [x, setX] = useState(1);
  const [y, setY] = useState(1);
  const [q, setQ] = useState(0);
  const invalid = x === 0 && y === 0;

  const apply = (nx, ny) => {
    setX(nx);
    setY(ny);
    if (nx === 0 && ny === 1) setQ(1);
    if (nx === 1 && ny === 0) setQ(0);
  };
  const Q = invalid ? 1 : q;
  const Qb = invalid ? 1 : 1 - q;
  const row = x * 2 + y;
  const rows = [
    ['0', '0', '1', '1', 'অগ্রহণযোগ্য — Q ও Q̅ দুটোই 1'],
    ['0', '1', '1', '0', 'Q = 1 (সেট)'],
    ['1', '0', '0', '1', 'Q = 0 (রিসেট)'],
    ['1', '1', 'আগের মান', '', 'মান সংরক্ষিত (মেমোরি)'],
  ];

  return (
    <div className="grid items-center gap-6 md:grid-cols-2">
      <div className="space-y-4">
        <div className="flex justify-center gap-2">
          <button type="button" className={clsx('btn btn-sm w-20 font-mono', x ? 'btn-success' : 'btn-outline')} onClick={() => apply(1 - x, y)}>
            x={x}
          </button>
          <button type="button" className={clsx('btn btn-sm w-20 font-mono', y ? 'btn-success' : 'btn-outline')} onClick={() => apply(x, 1 - y)}>
            y={y}
          </button>
        </div>
        <div className="flex items-center justify-center gap-4">
          <div className="grid h-24 w-36 place-items-center rounded-xl border-2 border-primary bg-primary/5 text-center text-sm font-semibold">
            দুটি NAND গেটের
            <br />
            ফ্লিপফ্লপ
          </div>
          <div className="flex gap-3">
            <Bit value={Q} label="Q" big />
            <Bit value={Qb} label="Q̅" big />
          </div>
        </div>
        {invalid ? (
          <p className="rounded-lg bg-error/10 p-2 text-center text-sm">x = y = 0: Q এবং Q̅ দুটোই 1 — এরা একে অপরের বিপরীত থাকছে না, তাই এই অবস্থা ব্যবহার করা হয় না।</p>
        ) : (
          <p className="text-center text-xs text-base-content/60">x ও y সাধারণত 1 থাকে। x-কে ক্ষণিকের জন্য 0 করলে Q = 1, y-কে 0 করলে Q = 0 সংরক্ষিত হয়।</p>
        )}
      </div>
      <table className="table table-sm rounded-lg bg-base-100 text-center">
        <thead>
          <tr>
            <th className="text-center">x</th>
            <th className="text-center">y</th>
            <th className="text-center">Q</th>
            <th className="text-center">Q̅</th>
            <th>অবস্থা</th>
          </tr>
        </thead>
        <tbody className="font-mono">
          {rows.map((r, i) => (
            <tr key={i} className={clsx(i === row && 'bg-primary/15 font-bold')}>
              <td>{r[0]}</td>
              <td>{r[1]}</td>
              <td colSpan={r[3] ? 1 : 2}>{r[2]}</td>
              {r[3] && <td>{r[3]}</td>}
              <td className="text-left font-sans text-xs">{r[4]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DFlipFlop() {
  const [d, setD] = useState(1);
  const [q, setQ] = useState(0);
  const [log, setLog] = useState([]);
  const pulse = () => {
    setQ(d);
    setLog((l) => [`পালস ${toBn(l.length + 1)}: D = ${d} → Q = ${d}`, ...l].slice(0, 5));
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-center gap-4">
        <button type="button" className={clsx('btn w-20 font-mono', d ? 'btn-success' : 'btn-outline')} onClick={() => setD(1 - d)}>
          D={d}
        </button>
        <span className="text-2xl text-base-content/40">→</span>
        <div className="grid h-20 w-28 place-items-center rounded-xl border-2 border-primary bg-primary/5 font-semibold">DQ ফ্লিপফ্লপ</div>
        <span className="text-2xl text-base-content/40">→</span>
        <Bit value={q} label="Q" big />
        <Bit value={1 - q} label="Q̅" big />
      </div>
      <div className="flex justify-center">
        <PulseButton onClick={pulse} />
      </div>
      <p className="text-center text-sm text-base-content/65">
        D বদলালেও Q বদলায় না — শুধু CLK পালস দিলে D-এর মান Q-তে যায় এবং সেখানে সংরক্ষিত থাকে।
      </p>
      {log.length > 0 && (
        <ul className="mx-auto w-fit space-y-0.5 font-mono text-xs text-base-content/60">
          {log.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ShiftRegister({ bits }) {
  const [input, setInput] = useState(1);
  const [q, setQ] = useState(Array(bits).fill(0)); // q[0] = first flip-flop (gets the serial input)
  const [pulses, setPulses] = useState(0);
  const pulse = () => {
    setQ((o) => [input, ...o.slice(0, -1)]);
    setPulses((p) => p + 1);
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button type="button" className={clsx('btn w-28 font-mono', input ? 'btn-success' : 'btn-outline')} onClick={() => setInput(1 - input)}>
          ইনপুট={input}
        </button>
        <span className="text-2xl text-base-content/40">→</span>
        {q.map((b, i) => (
          <div key={i} className="flex items-center gap-2">
            {i > 0 && <span className="text-base-content/40">→</span>}
            <div className="flex flex-col items-center rounded-xl border-2 border-primary/50 p-2">
              <span className="text-[10px] text-base-content/50">FF{toBn(i + 1)}</span>
              <Bit value={b} label={`Q${SUB[i]}`} />
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-2">
        <PulseButton onClick={pulse} />
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => {
            setQ(Array(bits).fill(0));
            setPulses(0);
          }}>
          <RotateCcw className="size-4" /> রিসেট
        </button>
      </div>
      <p className="text-center text-sm text-base-content/65">
        প্রতি পালসে প্রতিটি বিট এক ঘর ডানে সরে যায় এবং প্রথম ফ্লিপফ্লপে নতুন ইনপুট ঢোকে। {toBn(bits)}টি পালস পরে সিরিয়াল ইনপুটের {toBn(bits)}টি বিট একসাথে (প্যারালাল)
        আউটপুটে পাওয়া যায়। পালস দেওয়া হয়েছে: {toBn(pulses)}টি।
      </p>
    </div>
  );
}

function RippleCounter({ bits }) {
  const [count, setCount] = useState(0);
  const max = 2 ** bits;
  const q = Array.from({ length: bits }, (_, i) => (count >> i) & 1); // q[0] = LSB (first flip-flop)
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-center gap-3">
        <span className="badge badge-ghost font-mono">CLK →</span>
        {q.map((b, i) => (
          <div key={i} className="flex items-center gap-2">
            {i > 0 && <span className="text-base-content/40">→</span>}
            <div className="flex flex-col items-center rounded-xl border-2 border-primary/50 p-2">
              <span className="text-[10px] text-base-content/50">FF{toBn(i + 1)}</span>
              <Bit value={b} label={`Q${SUB[i]}`} />
            </div>
          </div>
        ))}
      </div>
      <p className="text-center font-mono text-lg">
        Q{SUB[bits - 1]}…Q₀ = <b className="text-primary">{[...q].reverse().join('')}</b>₂ = <b>{toBn(count)}</b>
      </p>
      <div className="flex justify-center gap-2">
        <PulseButton onClick={() => setCount((c) => (c + 1) % max)} />
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setCount(0)}>
          <RotateCcw className="size-4" /> রিসেট
        </button>
      </div>
      <p className="text-center text-sm text-base-content/65">
        শুধু প্রথম ফ্লিপফ্লপ আসল CLK পায়; প্রতিটি পরের ফ্লিপফ্লপ তার আগেরটির আউটপুট থেকে পালস পায় — তাই নাম রিপল কাউন্টার। {toBn(bits)}টি ফ্লিপফ্লপে 0 থেকে{' '}
        {toBn(max - 1)} পর্যন্ত গোনা যায়, তারপর আবার 0।
      </p>
    </div>
  );
}

/** props: type ('sr' | 'd' | 'shift' | 'counter'), bits (shift/counter, default 4) */
export function SequentialLab({ type: initType = 'sr', bits = 4 }) {
  const [type, setType] = useState(initType);
  return (
    <div className="space-y-4">
      <div role="tablist" className="tabs-box tabs tabs-sm w-fit flex-wrap">
        {[
          ['sr', 'ফ্লিপফ্লপ'],
          ['d', 'DQ ফ্লিপফ্লপ'],
          ['shift', 'শিফট রেজিস্টার'],
          ['counter', 'কাউন্টার'],
        ].map(([k, label]) => (
          <button key={k} type="button" role="tab" className={clsx('tab', type === k && 'tab-active')} onClick={() => setType(k)}>
            {label}
          </button>
        ))}
      </div>
      {type === 'sr' && <SrLatch />}
      {type === 'd' && <DFlipFlop />}
      {type === 'shift' && <ShiftRegister bits={bits} />}
      {type === 'counter' && <RippleCounter bits={bits} />}
    </div>
  );
}
