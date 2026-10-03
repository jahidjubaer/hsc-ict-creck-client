import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { Hammer, RotateCcw } from 'lucide-react';
import { toBn } from '@/lib/bn';

const TYPES = {
  bus: 'বাস',
  ring: 'রিং',
  star: 'স্টার',
  tree: 'ট্রি',
  mesh: 'মেশ',
  hybrid: 'হাইব্রিড',
};

const W = 360;
const H = 240;
const around = (n, r = 90, cx = W / 2, cy = H / 2) =>
  Array.from({ length: n }, (_, i) => ({ x: cx + r * Math.sin((2 * Math.PI * i) / n), y: cy - r * Math.cos((2 * Math.PI * i) / n) }));

/**
 * Builds a topology: nodes (computers, plus a hub or bus taps that cannot be picked) and edges [a, b].
 * Book §2.5.6 (docs/book-notes/ch2.md).
 */
function build(type, n) {
  const pc = (p, i) => ({ ...p, id: i, label: String.fromCharCode(65 + i), kind: 'pc' });
  if (type === 'bus') {
    const gap = (W - 60) / (n - 1);
    const nodes = Array.from({ length: n }, (_, i) => pc({ x: 30 + i * gap, y: i % 2 ? 190 : 50 }, i));
    // Taps on the backbone, one under each computer; the backbone runs tap to tap.
    const taps = nodes.map((p, i) => ({ id: n + i, x: p.x, y: 120, kind: 'tap' }));
    const edges = [
      ...nodes.map((_, i) => [i, n + i, 'drop']),
      ...taps.slice(1).map((_, i) => [n + i, n + i + 1, 'bus']),
    ];
    return { nodes: [...nodes, ...taps], edges, terminators: [taps[0], taps[n - 1]] };
  }
  if (type === 'ring') {
    const nodes = around(n).map(pc);
    return { nodes, edges: nodes.map((_, i) => [i, (i + 1) % n]) };
  }
  if (type === 'star') {
    const nodes = around(n).map(pc);
    nodes.push({ id: n, x: W / 2, y: H / 2, kind: 'hub', label: 'সুইচ' });
    return { nodes, edges: nodes.slice(0, n).map((_, i) => [n, i]) };
  }
  if (type === 'tree') {
    // Node 0 is the host at the top; node i hangs from (i − 1) / 2.
    const depth = (i) => Math.floor(Math.log2(i + 1));
    const nodes = Array.from({ length: n }, (_, i) => {
      const d = depth(i);
      const first = 2 ** d - 1;
      const count = Math.min(2 ** d, n - first);
      return pc({ x: (W * (i - first + 1)) / (count + 1), y: 35 + d * 75 }, i);
    });
    return { nodes, edges: nodes.slice(1).map((_, i) => [Math.floor(i / 2), i + 1]) };
  }
  if (type === 'mesh') {
    const nodes = around(n).map(pc);
    const edges = [];
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) edges.push([i, j]);
    return { nodes, edges };
  }
  // hybrid: a star (A–D around a switch) and a ring (E–H) joined by one cable.
  const star = around(4, 62, 95, 120).map(pc);
  const ring = around(4, 62, 265, 120).map((p, i) => pc(p, i + 4));
  const hub = { id: 8, x: 95, y: 120, kind: 'hub', label: 'সুইচ' };
  return {
    nodes: [...star, ...ring, hub],
    edges: [[8, 0], [8, 1], [8, 2], [8, 3], [4, 5], [5, 6], [6, 7], [7, 4], [1, 7]],
  };
}

const cablesText = (type, n) =>
  ({
    bus: `একটি মূল তার (বাস) + প্রতিটি কম্পিউটারের জন্য ছোট সংযোগ, দুই প্রান্তে টার্মিনেটর`,
    ring: `${toBn(n)}টি তার — প্রতিটি কম্পিউটার পাশের দুটির সাথে`,
    star: `${toBn(n)}টি তার — প্রতিটি কম্পিউটার থেকে সুইচ/হাব পর্যন্ত একটি করে`,
    tree: `${toBn(n - 1)}টি তার — উপরের স্তর থেকে নিচের স্তরে শাখা`,
    mesh: `প্রতিটি নোডে n − 1 = ${toBn(n - 1)}টি সংযোগ; মোট তার n(n − 1)/2 = ${toBn(n)}×${toBn(n - 1)}/২ = ${toBn((n * (n - 1)) / 2)}টি`,
    hybrid: 'একটি স্টার ও একটি রিং একটি তার দিয়ে যুক্ত — ইন্টারনেট এভাবেই নানা টপোলজির মিশ্রণ',
  })[type];

const key = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`);

/** Path avoiding failed nodes/cut edges (BFS), or null. In a ring the signal only travels one way (a → b). */
function findPath(g, from, to, dead, cut, oneWay = false) {
  const prev = new Map([[from, null]]);
  const queue = [from];
  while (queue.length) {
    const u = queue.shift();
    if (u === to) break;
    for (const [a, b] of g.edges) {
      if (cut.has(key(a, b))) continue;
      const v = a === u ? b : b === u && !oneWay ? a : null;
      if (v === null || prev.has(v) || dead.has(v)) continue;
      prev.set(v, u);
      queue.push(v);
    }
  }
  if (!prev.has(to)) return null;
  const path = [];
  for (let v = to; v !== null; v = prev.get(v)) path.unshift(v);
  return path;
}

/** Whole-network failures the book describes, beyond simple path loss. */
function networkDown(type, g, dead, cut) {
  if (type === 'ring' && (dead.size || cut.size)) return 'রিং-এ সংকেত একদিকে ঘোরে — একটি নোড বা তার অচল হলে পুরো নেটওয়ার্ক অকার্যকর হয়ে পড়ে।';
  if (type === 'bus' && g.edges.some(([a, b, t]) => t === 'bus' && cut.has(key(a, b))))
    return 'মূল সংযোগ লাইন (বাস) কেটে গেছে — পুরো নেটওয়ার্ক অচল হয়ে পড়ে।';
  if (type === 'star' && g.nodes.some((v) => v.kind === 'hub' && dead.has(v.id))) return 'কেন্দ্রের সুইচ/হাব অচল — পুরো নেটওয়ার্ক অকেজো।';
  if (type === 'tree' && dead.has(0)) return 'প্রধান (হোস্ট) কম্পিউটার নষ্ট — সমগ্র নেটওয়ার্ক অচল।';
  return null;
}

/** Animation frames for sending from `from` to `to`: { lit: edge keys, checked: nodes, at: node }. */
function sendFrames(type, g, path, from) {
  const frames = [];
  if (type === 'bus') {
    // The signal enters the bus and spreads both ways; every computer looks at it, only the receiver keeps it.
    const n = g.nodes.filter((v) => v.kind === 'pc').length;
    const tap = n + from;
    const lit = new Set([key(from, tap)]);
    frames.push({ lit: new Set(lit), checked: new Set() });
    const checked = new Set();
    for (let d = 1; d < n; d++) {
      for (const t of [tap - d, tap + d]) {
        if (t < n || t >= 2 * n) continue;
        lit.add(key(t, t === tap - d ? t + 1 : t - 1));
        lit.add(key(t - n, t));
        checked.add(t - n);
      }
      frames.push({ lit: new Set(lit), checked: new Set(checked) });
    }
    return frames;
  }
  const lit = new Set();
  const checked = new Set();
  for (let i = 1; i < path.length; i++) {
    lit.add(key(path[i - 1], path[i]));
    if (i < path.length - 1 && g.nodes[path[i]].kind === 'pc') checked.add(path[i]);
    frames.push({ lit: new Set(lit), checked: new Set(checked), at: path[i] });
  }
  return frames;
}

/**
 * Network topology lab. Props: type ('bus' | 'ring' | 'star' | 'tree' | 'mesh' | 'hybrid'), nodes (3–8),
 * fixed (true = no topology switcher). Pick two computers to send data; "ভাঙো" mode fails a computer or cuts a cable.
 */
export function TopologyLab({ type: initialType = 'star', nodes: initialN = 6, fixed = false }) {
  const [type, setType] = useState(initialType);
  const [n, setN] = useState(initialN);
  // A new topology starts with nothing broken: remount the network.
  return <Network key={`${type}-${n}`} type={type} setType={setType} n={n} setN={setN} fixed={fixed} />;
}

function Network({ type, setType, n, setN, fixed }) {
  const g = useMemo(() => build(type, type === 'hybrid' ? 8 : n), [type, n]);
  const [dead, setDead] = useState(new Set());
  const [cut, setCut] = useState(new Set());
  const [breakMode, setBreakMode] = useState(false);
  const [from, setFrom] = useState(null);
  const [send, setSend] = useState(null); // { frames, at, to, ok, note }

  const reset = () => {
    setDead(new Set());
    setCut(new Set());
    setFrom(null);
    setSend(null);
  };

  useEffect(() => {
    if (!send || send.at >= send.frames.length - 1) return;
    const t = setTimeout(() => setSend((s) => ({ ...s, at: s.at + 1 })), 450);
    return () => clearTimeout(t);
  }, [send]);

  const down = networkDown(type, g, dead, cut);
  const pcs = g.nodes.filter((v) => v.kind === 'pc');

  const clickNode = (v) => {
    if (breakMode) {
      if (v.kind === 'tap') return;
      setDead((d) => {
        const next = new Set(d);
        if (next.has(v.id)) next.delete(v.id);
        else next.add(v.id);
        return next;
      });
      setSend(null);
      return;
    }
    if (v.kind !== 'pc' || dead.has(v.id)) return;
    if (from === null || from === v.id) {
      setFrom(from === v.id ? null : v.id);
      setSend(null);
      return;
    }
    const path = down ? null : findPath(g, from, v.id, dead, cut, type === 'ring');
    const frames = path ? sendFrames(type, g, path, from) : [{ lit: new Set(), checked: new Set() }];
    const via = path ? path.slice(1, -1).filter((i) => g.nodes[i].kind === 'pc').map((i) => g.nodes[i].label) : [];
    let note;
    if (!path) note = down || `${g.nodes[from].label} থেকে ${v.label}-এ যাওয়ার কোনো পথ নেই — সংযোগ বিচ্ছিন্ন।`;
    else if (type === 'bus') note = `ডেটা পুরো বাসে ছড়িয়েছে; প্রতিটি কম্পিউটার পরীক্ষা করেছে, শুধু ${v.label} গ্রহণ করেছে।`;
    else if (type === 'ring') note = via.length ? `সংকেত চক্রাকার পথে ${via.join(' → ')} হয়ে ${v.label}-এ পৌঁছেছে — মাঝের নোডগুলো সামনে পাঠিয়ে দিয়েছে।` : `পাশের নোড বলে সরাসরি পৌঁছেছে।`;
    else if (type === 'star') note = `${g.nodes[from].label} → সুইচ → ${v.label}। কম্পিউটারগুলো সরাসরি নয়, কেন্দ্রের মাধ্যমে কথা বলে।`;
    else if (type === 'mesh') note = path.length === 2 ? `সরাসরি পয়েন্ট-টু-পয়েন্ট লিংক — মাঝে কেউ নেই, তাই সবচেয়ে দ্রুত।` : `সরাসরি তারটি কাটা, তাই বিকল্প পথে (${via.join(' → ')}) পৌঁছেছে।`;
    else note = via.length ? `পথ: ${[g.nodes[from].label, ...via, v.label].join(' → ')}` : 'সরাসরি সংযোগে পৌঁছেছে।';
    setSend({ frames, at: 0, to: v.id, ok: !!path, note });
    setFrom(null);
  };

  const clickEdge = (a, b) => {
    if (!breakMode) return;
    setCut((c) => {
      const next = new Set(c);
      if (next.has(key(a, b))) next.delete(key(a, b));
      else next.add(key(a, b));
      return next;
    });
    setSend(null);
  };

  const frame = send?.frames[send.at];
  const done = send && send.at === send.frames.length - 1;

  // Computers that can still reach at least one other computer.
  const alive = pcs.filter((v) => !dead.has(v.id) && !down && pcs.some((u) => u.id !== v.id && !dead.has(u.id) && findPath(g, v.id, u.id, dead, cut, type === 'ring')));

  return (
    <div className="space-y-3">
      {!fixed && (
        <div className="flex flex-wrap gap-1">
          {Object.entries(TYPES).map(([k, label]) => (
            <button key={k} type="button" onClick={() => setType(k)} className={clsx('btn btn-xs', type === k ? 'btn-primary' : 'btn-outline')}>
              {label}
            </button>
          ))}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {type !== 'hybrid' && (
          <label className="flex items-center gap-2 text-sm">
            নোড: <b>{toBn(n)}</b>
            <input type="range" min="3" max="8" value={n} onChange={(e) => setN(Number(e.target.value))} className="range range-primary range-xs w-28" />
          </label>
        )}
        <button type="button" className={clsx('btn btn-xs', breakMode ? 'btn-error' : 'btn-outline')} onClick={() => setBreakMode((b) => !b)}>
          <Hammer className="size-3.5" /> {breakMode ? 'ভাঙো মোড চালু' : 'ভাঙো'}
        </button>
        <button type="button" className="btn btn-ghost btn-xs" onClick={reset}>
          <RotateCcw className="size-3.5" /> ঠিক করো
        </button>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto h-auto w-full max-w-md touch-manipulation select-none" role="img" aria-label={`${TYPES[type]} টপোলজি`}>
        {g.edges.map(([a, b, t]) => {
          const p = g.nodes[a];
          const q = g.nodes[b];
          const k = key(a, b);
          const isCut = cut.has(k);
          const lit = frame?.lit.has(k);
          return (
            <g key={k} onClick={() => clickEdge(a, b)} className={breakMode ? 'cursor-pointer' : undefined}>
              <line x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke="transparent" strokeWidth="14" />
              <line
                x1={p.x}
                y1={p.y}
                x2={q.x}
                y2={q.y}
                strokeWidth={t === 'bus' ? 5 : 2.2}
                strokeDasharray={isCut ? '4 5' : undefined}
                className={clsx(isCut ? 'stroke-error' : lit ? (send.ok ? 'stroke-amber-400' : 'stroke-error') : 'stroke-base-content/40')}
              />
            </g>
          );
        })}
        {g.terminators?.map((t, i) => (
          <rect key={i} x={t.x + (i ? 4 : -12)} y={t.y - 7} width="8" height="14" rx="2" className="fill-base-content/60" />
        ))}
        {g.nodes.map((v) => {
          if (v.kind === 'tap') return null;
          const isDead = dead.has(v.id) || (down && v.kind === 'pc');
          const isFrom = from === v.id;
          const isTo = send?.to === v.id && done;
          const checked = frame?.checked.has(v.id);
          const isolated = v.kind === 'pc' && !isDead && !alive.some((a) => a.id === v.id);
          return (
            <g key={v.id} onClick={() => clickNode(v)} className="cursor-pointer">
              {v.kind === 'hub' ? (
                <rect x={v.x - 24} y={v.y - 13} width="48" height="26" rx="6" className={clsx(dead.has(v.id) ? 'fill-error/70' : 'fill-secondary')} />
              ) : (
                <circle
                  cx={v.x}
                  cy={v.y}
                  r="16"
                  className={clsx(
                    isDead ? 'fill-error/70' : isTo ? (send.ok ? 'fill-success' : 'fill-error') : isFrom ? 'fill-amber-400' : checked ? 'fill-sky-300' : isolated ? 'fill-base-300' : 'fill-primary',
                  )}
                />
              )}
              <text x={v.x} y={v.y + 4.5} textAnchor="middle" fontSize={v.kind === 'hub' ? 11 : 13} fontWeight="700" className="pointer-events-none fill-white">
                {isDead ? '✕' : v.label}
              </text>
            </g>
          );
        })}
      </svg>

      <p className="min-h-10 rounded-lg bg-base-200/60 p-2 text-sm">
        {breakMode
          ? 'কোনো কম্পিউটার বা তারে চাপ দিয়ে অচল করো (আবার চাপলে ঠিক হবে)। তারপর "ভাঙো" বন্ধ করে ডেটা পাঠিয়ে দেখো।'
          : send
            ? done
              ? send.note
              : 'পাঠানো হচ্ছে…'
            : from !== null
              ? `${g.nodes[from].label} প্রেরক। এবার প্রাপক কম্পিউটারে চাপ দাও।`
              : 'ডেটা পাঠাতে প্রথমে প্রেরক, তারপর প্রাপক কম্পিউটারে চাপ দাও।'}
      </p>
      <div className="grid gap-1 text-sm sm:grid-cols-2">
        <p>
          <b>তার:</b> {cablesText(type, type === 'hybrid' ? 8 : n)}
        </p>
        <p className={clsx(down || alive.length < pcs.length ? 'text-error' : 'text-success')}>
          <b>সচল কম্পিউটার:</b> {toBn(alive.length)}/{toBn(pcs.length)} {down && `— ${down}`}
        </p>
      </div>
    </div>
  );
}
