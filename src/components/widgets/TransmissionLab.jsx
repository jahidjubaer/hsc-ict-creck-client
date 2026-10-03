import { useEffect, useId, useState } from 'react';
import clsx from 'clsx';
import { CheckCircle2, Play, XCircle } from 'lucide-react';
import { bnNumber, toBn } from '@/lib/bn';

// Book §2.1.3–2.1.5 (docs/book-notes/ch2.md): bandwidth, transmission methods, modes and delivery modes.

const bits8 = (ch) => ch.charCodeAt(0).toString(2).padStart(8, '0').slice(-8);

/** Steps a counter from 0 to `max` while `running`; returns [step, start]. */
function useTicker(max, ms) {
  const [step, setStep] = useState(max);
  useEffect(() => {
    if (step >= max) return;
    const t = setTimeout(() => setStep((s) => s + 1), ms);
    return () => clearTimeout(t);
  }, [step, max, ms]);
  return [Math.min(step, max), () => setStep(0)];
}

function Bit({ b, kind, shown = true }) {
  return (
    <span
      className={clsx(
        'inline-flex h-7 w-5 items-center justify-center rounded font-mono text-xs transition-opacity',
        kind === 'start' || kind === 'stop' ? 'bg-error/70 text-white' : kind === 'head' ? 'bg-sky-500 text-white' : kind === 'tail' ? 'bg-violet-500 text-white' : 'bg-amber-200 text-amber-950',
        !shown && 'opacity-15',
      )}
    >
      {b}
    </span>
  );
}

function ParallelSerial() {
  const [ch, setCh] = useState('A');
  const bits = bits8(ch || 'A');
  const [pStep, pGo] = useTicker(1, 500);
  const [sStep, sGo] = useTicker(8, 400);
  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm">
        অক্ষর
        <input className="input input-bordered input-sm w-16 font-mono" maxLength={1} value={ch} onChange={(e) => setCh(e.target.value)} />
        <span className="font-mono">= {bits} (ASCII)</span>
      </label>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-base-300 p-3">
          <p className="mb-2 flex items-center justify-between text-sm font-bold">
            প্যারালাল — ৮টি তার
            <button type="button" className="btn btn-xs btn-primary" onClick={pGo}>
              <Play className="size-3" /> পাঠাও
            </button>
          </p>
          <div className="space-y-0.5">
            {[...bits].map((b, i) => (
              <div key={i} className="flex items-center gap-1">
                <div className="h-0.5 flex-1 bg-base-content/20" />
                <Bit b={b} shown={pStep >= 1} />
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs">সময়: {toBn(pStep >= 1 ? 1 : 0)} ধাপ — সব বিট একসাথে। দ্রুত, কিন্তু অনেক তার লাগে; দূরে পাঠাতে বাস্তবসম্মত নয়।</p>
        </div>
        <div className="rounded-xl border border-base-300 p-3">
          <p className="mb-2 flex items-center justify-between text-sm font-bold">
            সিরিয়াল — ১টি তার
            <button type="button" className="btn btn-xs btn-primary" onClick={sGo}>
              <Play className="size-3" /> পাঠাও
            </button>
          </p>
          <div className="flex items-center gap-1">
            <div className="h-0.5 flex-1 bg-base-content/20" />
            {[...bits].map((b, i) => (
              <Bit key={i} b={b} shown={i < sStep} />
            ))}
          </div>
          <p className="mt-2 text-xs">সময়: {toBn(sStep)} ধাপ — এক বিটের পর আরেক বিট। একটি তার, তাই সস্তা ও দূরে পাঠানো যায় (যেমন USB)।</p>
        </div>
      </div>
    </div>
  );
}

function Framing() {
  const [text, setText] = useState('HI');
  const [kind, setKind] = useState('async');
  const chars = [...(text || 'H')].slice(0, 4);
  const data = chars.length * 8;
  const HEAD = '01111110';
  const TAIL = '01111110';

  let body;
  let total;
  if (kind === 'async') {
    total = chars.length * 10;
    body = chars.map((c, i) => (
      <span key={i} className="inline-flex items-center gap-0.5">
        <Bit b="0" kind="start" />
        {[...bits8(c)].map((b, k) => (
          <Bit key={k} b={b} />
        ))}
        <Bit b="1" kind="stop" />
        {i < chars.length - 1 && <span className="mx-1 inline-block w-6 border-b-2 border-dotted border-base-content/30" title="বিরতি" />}
      </span>
    ));
  } else if (kind === 'sync') {
    total = data + 16;
    body = (
      <span className="inline-flex flex-wrap items-center gap-0.5">
        {[...HEAD].map((b, k) => (
          <Bit key={`h${k}`} b={b} kind="head" />
        ))}
        {chars.map((c, i) => [...bits8(c)].map((b, k) => <Bit key={`${i}-${k}`} b={b} />))}
        {[...TAIL].map((b, k) => (
          <Bit key={`t${k}`} b={b} kind="tail" />
        ))}
      </span>
    );
  } else {
    total = data + 2;
    body = (
      <span className="inline-flex flex-wrap items-center gap-0.5">
        <Bit b="0" kind="start" />
        {chars.map((c, i) => [...bits8(c)].map((b, k) => <Bit key={`${i}-${k}`} b={b} />))}
        <Bit b="1" kind="stop" />
      </span>
    );
  }

  const info = {
    async: 'প্রতিটি অক্ষরের আগে একটি স্টার্ট বিট ও পরে স্টপ বিট; অক্ষরগুলোর মাঝে যতক্ষণ ইচ্ছা বিরতি। যেমন কী-বোর্ড। প্রাইমারি স্টোরেজ লাগে না।',
    sync: 'ডেটা আগে প্রাইমারি স্টোরেজে জমিয়ে ব্লক বা ফ্রেম বানানো হয়; শুরুতে হেডার, শেষে ট্রেইলার, মাঝে কোনো বিরতি নেই। বেশি ডেটা দূরে পাঠাতে — মোবাইল ও টিভি নেটওয়ার্ক।',
    iso: 'মিশ্র পদ্ধতি: স্টার্ট ও স্টপ বিটের মাঝে ব্লক আকারে সিনক্রোনাস ডেটা। স্টোরেজে জমাতে হয় না — রিয়েল টাইম অডিও/ভিডিও কলে।',
  }[kind];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input className="input input-bordered input-sm w-24 font-mono" maxLength={4} value={text} onChange={(e) => setText(e.target.value)} />
        <div className="join">
          {[
            ['async', 'অ্যাসিনক্রোনাস'],
            ['sync', 'সিনক্রোনাস'],
            ['iso', 'আইসোক্রোনাস'],
          ].map(([k, l]) => (
            <button key={k} type="button" className={clsx('btn join-item btn-xs', kind === k && 'btn-primary')} onClick={() => setKind(k)}>
              {l}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg border border-base-300 p-2">
        <p className="mb-1 text-xs text-base-content/60">প্রেরক → → → প্রাপক</p>
        <div className="flex flex-wrap items-center gap-y-1">{body}</div>
      </div>
      <div className="flex flex-wrap gap-3 text-xs">
        <span><Bit b="0" kind="start" /> স্টার্ট / <Bit b="1" kind="stop" /> স্টপ বিট</span>
        {kind === 'sync' && <span><Bit b="0" kind="head" /> হেডার / <Bit b="0" kind="tail" /> ট্রেইলার</span>}
        <span><Bit b="1" /> ডেটা</span>
      </div>
      <p className="text-sm">{info}</p>
      <p className="text-xs text-base-content/60">
        ডেটা বিট {toBn(data)}টি, মোট পাঠানো {toBn(total)}টি বিট (দক্ষতা {toBn(Math.round((data / total) * 100))}%)। হেডার/ট্রেইলার এখানে ১ বাইট করে দেখানো হয়েছে; দক্ষতার হিসাব বইয়ের বাইরে।
      </p>
    </div>
  );
}

const MODES = {
  simplex: { label: 'সিমপ্লেক্স', ex: 'কী-বোর্ড, মাউস, জয়স্টিক' },
  half: { label: 'হাফ-ডুপ্লেক্স', ex: 'ওয়াকিটকি, ফ্যাক্স, এসএমএস' },
  full: { label: 'ফুল-ডুপ্লেক্স', ex: 'টেলিফোন, মোবাইল ফোন, কম্পিউটার নেটওয়ার্ক' },
};

function Modes() {
  const [mode, setMode] = useState('half');
  const [sends, setSends] = useState([]); // [{ dir: 'ab' | 'ba', start }]
  const [tick, setTick] = useState(0);
  const LEN = 12; // ticks a message takes
  const running = sends.some((s) => tick < s.start + LEN);
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setTick((x) => x + 1), 120);
    return () => clearInterval(t);
  }, [running]);

  const busyUntil = (list) => list.reduce((m, s) => Math.max(m, s.start + LEN), 0);
  const send = (dirs) => {
    let list = [];
    for (const dir of dirs) {
      if (mode === 'simplex' && dir === 'ba') continue;
      const start = mode === 'half' ? Math.max(tick, busyUntil(list)) : tick;
      list = [...list, { dir, start, waited: start > tick }];
    }
    setSends(list);
  };
  const progress = (s) => Math.max(0, Math.min(1, (tick - s.start) / LEN));

  return (
    <div className="space-y-3">
      <div className="join">
        {Object.entries(MODES).map(([k, m]) => (
          <button
            key={k}
            type="button"
            className={clsx('btn join-item btn-sm', mode === k && 'btn-primary')}
            onClick={() => {
              setMode(k);
              setSends([]);
            }}
          >
            {m.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-sm btn-outline" onClick={() => send(['ab'])}>
          A → B
        </button>
        <button type="button" className="btn btn-sm btn-outline" onClick={() => send(['ba'])}>
          B → A
        </button>
        <button type="button" className="btn btn-sm btn-outline" onClick={() => send(['ab', 'ba'])}>
          দুজনেই একসাথে
        </button>
      </div>
      <svg viewBox="0 0 320 110" className="mx-auto h-auto w-full max-w-md" role="img" aria-label={MODES[mode].label}>
        <rect x="4" y="30" width="50" height="50" rx="8" className="fill-primary" />
        <text x="29" y="61" textAnchor="middle" fontSize="16" fontWeight="700" className="fill-white">A</text>
        <rect x="266" y="30" width="50" height="50" rx="8" className="fill-primary" />
        <text x="291" y="61" textAnchor="middle" fontSize="16" fontWeight="700" className="fill-white">B</text>
        {mode === 'full' ? (
          <>
            <line x1="54" y1="45" x2="266" y2="45" strokeWidth="3" className="stroke-base-content/30" />
            <line x1="54" y1="65" x2="266" y2="65" strokeWidth="3" className="stroke-base-content/30" />
          </>
        ) : (
          <line x1="54" y1="55" x2="266" y2="55" strokeWidth="3" className="stroke-base-content/30" />
        )}
        {mode === 'simplex' && <text x="160" y="40" textAnchor="middle" fontSize="16" className="fill-base-content/50">→</text>}
        {sends.map((s, i) => {
          const p = progress(s);
          if (p <= 0 || p >= 1) return null;
          const x = s.dir === 'ab' ? 54 + p * 212 : 266 - p * 212;
          const y = mode === 'full' ? (s.dir === 'ab' ? 45 : 65) : 55;
          return <circle key={i} cx={x} cy={y} r="8" className={s.dir === 'ab' ? 'fill-amber-400' : 'fill-sky-400'} />;
        })}
      </svg>
      <p className="rounded-lg bg-base-200/60 p-2 text-sm">
        {mode === 'simplex' && 'শুধু একদিকে (A → B): প্রেরক শুধু পাঠায়, গ্রাহক শুধু গ্রহণ করে। B থেকে পাঠানো সম্ভব নয়।'}
        {mode === 'half' &&
          (sends.some((s) => s.waited)
            ? 'একটি মাত্র পথ — B-কে অপেক্ষা করতে হলো, A-এর পাঠানো শেষ হলে তবে B পাঠাল। দুইদিকেই যায়, কিন্তু একসাথে নয়।'
            : 'দুইদিকেই পাঠানো যায়, কিন্তু একসাথে নয় — "দুজনেই একসাথে" চেপে দেখো।')}
        {mode === 'full' && 'একই সময়ে দুইদিকেই পাঠানো ও গ্রহণ করা যায়।'}
        <span className="mt-1 block text-xs text-base-content/60">উদাহরণ: {MODES[mode].ex}</span>
      </p>
    </div>
  );
}

const DELIVERY = {
  unicast: { label: 'ইউনিকাস্ট', note: 'একজন প্রেরক, একজনই গ্রাহক। সিমপ্লেক্স, হাফ বা ফুল-ডুপ্লেক্স হতে পারে। যেমন: মোবাইল ফোন, সিঙ্গেল এসএমএস।' },
  broadcast: { label: 'ব্রডকাস্ট', note: 'একজন প্রেরক, আওতার সব গ্রাহক পায়। শুধু সিমপ্লেক্স। যেমন: রেডিও, টেলিভিশন।' },
  multicast: { label: 'মাল্টিকাস্ট', note: 'শুধু অনুমোদিত সদস্যরা পায়। হাফ বা ফুল-ডুপ্লেক্স। যেমন: ভিডিও কনফারেন্সিং, গ্রুপ এসএমএস, চ্যাটিং।' },
};

function Delivery() {
  const [kind, setKind] = useState('multicast');
  const [members, setMembers] = useState([1, 2, 3]);
  const [one, setOne] = useState(2);
  const arrow = `arr${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const gets = (i) => (kind === 'broadcast' ? true : kind === 'unicast' ? i === one : members.includes(i));
  const pick = (i) => {
    if (kind === 'unicast') setOne(i);
    if (kind === 'multicast') setMembers((m) => (m.includes(i) ? m.filter((x) => x !== i) : [...m, i]));
  };
  return (
    <div className="space-y-3">
      <div className="join">
        {Object.entries(DELIVERY).map(([k, d]) => (
          <button key={k} type="button" className={clsx('btn join-item btn-sm', kind === k && 'btn-primary')} onClick={() => setKind(k)}>
            {d.label}
          </button>
        ))}
      </div>
      <svg viewBox="0 0 300 200" className="mx-auto h-auto w-full max-w-sm" role="img" aria-label={DELIVERY[kind].label}>
        {[0, 1, 2, 3, 4].map((i) => {
          const y = 20 + i * 40;
          return (
            <g key={i} onClick={() => pick(i)} className={kind === 'broadcast' ? undefined : 'cursor-pointer'}>
              {gets(i) && <line x1="60" y1="100" x2="232" y2={y} strokeWidth="2.5" className="stroke-amber-400" markerEnd={`url(#${arrow})`} />}
              <circle cx="250" cy={y} r="15" className={gets(i) ? 'fill-sky-500' : 'fill-pink-300'} />
              <text x="250" y={y + 4} textAnchor="middle" fontSize="11" fontWeight="700" className="fill-white">
                {toBn(i + 1)}
              </text>
            </g>
          );
        })}
        <defs>
          <marker id={arrow} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M0 0 L10 5 L0 10 z" className="fill-amber-400" />
          </marker>
        </defs>
        <circle cx="40" cy="100" r="22" className="fill-primary" />
        <text x="40" y="104" textAnchor="middle" fontSize="11" fontWeight="700" className="fill-white">প্রেরক</text>
      </svg>
      <p className="rounded-lg bg-base-200/60 p-2 text-sm">
        {DELIVERY[kind].note}
        {kind !== 'broadcast' && <span className="mt-1 block text-xs text-base-content/60">গ্রাহকের বৃত্তে চাপ দিয়ে {kind === 'unicast' ? 'গ্রাহক বদলাও' : 'সদস্য যোগ/বাদ দাও'}। নীল = পায়, গোলাপি = পায় না।</span>}
      </p>
    </div>
  );
}

// Book table 2.1 (Mbps).
const SERVICES = [
  ['ইমেইল', 0.5],
  ['ওয়েব ব্রাউজিং', 1.0],
  ['স্ট্রিমিং মিউজিক', 0.5],
  ['ফোন কল (VoIP)', 0.5],
  ['স্ট্রিমিং ভিডিও', 0.7],
  ['স্ট্রিমিং মুভি', 1.5],
  ['স্ট্রিমিং HD মুভি', 4],
  ['ভিডিও কনফারেন্সিং', 1],
  ['ভিডিও কনফারেন্সিং HD', 4],
  ['অনলাইন HD মাল্টিপ্লেয়ার গেমিং', 4],
];

function Bandwidth() {
  const [speed, setSpeed] = useState(5);
  const [users, setUsers] = useState(1);
  const [size, setSize] = useState(100);
  const share = speed / users;
  const seconds = (size * 8) / share;
  const fmt = (x) => toBn(Number(x.toFixed(2)));
  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-3">
        <label className="flex flex-col text-sm">
          সংযোগের ব্যান্ডউইথ: <b>{fmt(speed)} Mbps</b>
          <input type="range" min="0.5" max="20" step="0.5" value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="range range-primary range-xs" />
        </label>
        <label className="flex flex-col text-sm">
          একসাথে ব্যবহারকারী: <b>{toBn(users)} জন</b>
          <input type="range" min="1" max="10" value={users} onChange={(e) => setUsers(Number(e.target.value))} className="range range-primary range-xs" />
        </label>
        <label className="flex flex-col text-sm">
          ফাইলের আকার: <b>{toBn(size)} MB</b>
          <input type="range" min="10" max="1000" step="10" value={size} onChange={(e) => setSize(Number(e.target.value))} className="range range-primary range-xs" />
        </label>
      </div>
      <div className="rounded-xl border border-base-300 p-3 text-sm">
        <p>
          প্রত্যেকের ভাগে: <b>{fmt(share)} Mbps</b> = {fmt(share / 8)} MBps (৮ বিট = ১ বাইট)
        </p>
        <p className="mt-1">
          {toBn(size)} MB ফাইল নামাতে: {toBn(size)} × ৮ = {bnNumber(size * 8)} Mb ÷ {fmt(share)} Mbps ≈ <b>{seconds >= 60 ? `${fmt(seconds / 60)} মিনিট` : `${fmt(seconds)} সেকেন্ড`}</b>
        </p>
      </div>
      <div className="grid gap-1 sm:grid-cols-2">
        {SERVICES.map(([name, need]) => {
          const ok = share >= need;
          return (
            <p key={name} className={clsx('flex items-center gap-1.5 rounded px-2 py-1 text-sm', ok ? 'bg-success/10' : 'bg-error/10')}>
              {ok ? <CheckCircle2 className="size-4 shrink-0 text-success" /> : <XCircle className="size-4 shrink-0 text-error" />}
              {name} <span className="ml-auto text-xs text-base-content/60">{fmt(need)} Mbps</span>
            </p>
          );
        })}
      </div>
      <p className="text-xs text-base-content/60">
        প্রয়োজনীয় ব্যান্ডউইথ বইয়ের টেবিল ২.১ থেকে (ওয়েব ব্রাউজিং-এর জন্য ০.৫–১ Mbps-এর বড়টি ধরা হয়েছে)। নেটওয়ার্কের ব্যান্ডউইথ ব্যবহারকারীদের মধ্যে ভাগ হয়ে যায় — সমান ভাগ ধরে নেওয়া হয়েছে। সময়ের হিসাব বইয়ের বাইরে।
      </p>
    </div>
  );
}

/** Data transmission lab. Props: mode ('method' | 'framing' | 'mode' | 'delivery' | 'bandwidth'). */
export function TransmissionLab({ mode = 'mode' }) {
  if (mode === 'method') return <ParallelSerial />;
  if (mode === 'framing') return <Framing />;
  if (mode === 'delivery') return <Delivery />;
  if (mode === 'bandwidth') return <Bandwidth />;
  return <Modes />;
}
