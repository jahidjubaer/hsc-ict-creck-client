import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { Zap } from 'lucide-react';

// Book §2.5.4 network devices (docs/book-notes/ch2.md): hub broadcasts, switch uses MAC addresses,
// router joins networks of the same protocol, gateway joins networks of different protocols.

const LAN_PCS = [
  { id: 'A', x: 60, y: 45, mac: 'AA-01' },
  { id: 'B', x: 300, y: 45, mac: 'AA-02' },
  { id: 'C', x: 60, y: 195, mac: 'AA-03' },
  { id: 'D', x: 300, y: 195, mac: 'AA-04' },
];
const CENTER = { x: 180, y: 120 };

function Pc({ x, y, label, sub, state }) {
  return (
    <g>
      <rect
        x={x - 26}
        y={y - 18}
        width="52"
        height="36"
        rx="6"
        className={clsx(
          state === 'got' ? 'fill-success' : state === 'drop' ? 'fill-sky-300' : state === 'from' ? 'fill-amber-400' : state === 'bad' ? 'fill-error' : 'fill-primary',
        )}
      />
      <text x={x} y={y + 1} textAnchor="middle" fontSize="13" fontWeight="700" className="fill-white">
        {label}
      </text>
      {sub && (
        <text x={x} y={y + 13} textAnchor="middle" fontSize="8" className="fill-white/90" fontFamily="monospace">
          {sub}
        </text>
      )}
    </g>
  );
}

function LanMode() {
  const [device, setDevice] = useState('hub');
  const [from, setFrom] = useState('A');
  const [to, setTo] = useState('C');
  const [shot, setShot] = useState(null); // { kind: 'one' | 'two', at }

  useEffect(() => {
    if (!shot || shot.at >= 2) return;
    const t = setTimeout(() => setShot((s) => ({ ...s, at: s.at + 1 })), 600);
    return () => clearTimeout(t);
  }, [shot]);

  // "Two at once": the other two computers talk at the same moment.
  const others = LAN_PCS.map((p) => p.id).filter((id) => id !== from && id !== to);
  const pairs = shot?.kind === 'two' ? [[from, to], others] : [[from, to]];
  const collision = device === 'hub' && shot?.kind === 'two';
  // Which cables carry a signal at this step.
  const litOut = (pc) => {
    if (!shot || shot.at < 1) return false;
    if (device === 'hub') return pairs.every(([f]) => f !== pc); // hub copies to every other port
    return pairs.some(([, t]) => t === pc);
  };
  const litIn = (pc) => shot && pairs.some(([f]) => f === pc);
  const state = (pc) => {
    if (!shot) return pc === from ? 'from' : undefined;
    if (pairs.some(([f]) => f === pc)) return 'from';
    if (shot.at < 2) return undefined;
    if (collision) return 'bad';
    if (pairs.some(([, t]) => t === pc)) return 'got';
    return device === 'hub' ? 'drop' : undefined;
  };

  const note = !shot
    ? `প্রেরক ${from}, প্রাপক ${to}। "পাঠাও" চাপো।`
    : shot.at < 2
      ? 'পাঠানো হচ্ছে…'
      : collision
        ? 'সংঘর্ষ (collision)! হাব দুটি সংকেতই সব পোর্টে পাঠায়, ফলে একই তারে দুটি সংকেত মিলে নষ্ট হয়ে গেছে — আবার পাঠাতে হবে।'
        : device === 'hub'
          ? `হাবের বুদ্ধিমত্তা নেই — সংকেতটি সব পোর্টে ব্রডকাস্ট করেছে। ${to} গ্রহণ করেছে, বাকিরা (নীল) পরীক্ষা করে ফেলে দিয়েছে। অকারণ ট্রাফিক বাড়ে।`
          : `সুইচ MAC অ্যাড্রেস দেখে শুধু ${pairs.map(([, t]) => t).join(' ও ')}-এর পোর্টে পাঠিয়েছে${shot.kind === 'two' ? ' — দুটি আলাদা পথ, তাই সংঘর্ষ হয়নি' : ''}। অন্যরা কিছুই পায়নি।`;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="join">
          {[
            ['hub', 'হাব'],
            ['switch', 'সুইচ'],
          ].map(([k, l]) => (
            <button
              key={k}
              type="button"
              className={clsx('btn join-item btn-sm', device === k && 'btn-primary')}
              onClick={() => {
                setDevice(k);
                setShot(null);
              }}
            >
              {l}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-1 text-sm">
          প্রেরক
          <select className="select select-bordered select-xs" value={from} onChange={(e) => {
            setFrom(e.target.value);
            setShot(null);
          }}>
            {LAN_PCS.filter((p) => p.id !== to).map((p) => (
              <option key={p.id}>{p.id}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-1 text-sm">
          প্রাপক
          <select className="select select-bordered select-xs" value={to} onChange={(e) => {
            setTo(e.target.value);
            setShot(null);
          }}>
            {LAN_PCS.filter((p) => p.id !== from).map((p) => (
              <option key={p.id}>{p.id}</option>
            ))}
          </select>
        </label>
        <button type="button" className="btn btn-sm btn-primary" onClick={() => setShot({ kind: 'one', at: 0 })}>
          পাঠাও
        </button>
        <button type="button" className="btn btn-sm btn-outline" onClick={() => setShot({ kind: 'two', at: 0 })}>
          <Zap className="size-4" /> দুজন একসাথে পাঠাও
        </button>
      </div>

      <div className="grid items-start gap-3 sm:grid-cols-[1fr_auto]">
        <svg viewBox="0 0 360 240" className="mx-auto h-auto w-full max-w-md" role="img" aria-label="LAN">
          {LAN_PCS.map((p) => (
            <line
              key={p.id}
              x1={p.x}
              y1={p.y}
              x2={CENTER.x}
              y2={CENTER.y}
              strokeWidth="3"
              className={clsx(
                litIn(p.id) ? (collision && shot.at >= 1 ? 'stroke-error' : 'stroke-amber-400') : litOut(p.id) ? (collision ? 'stroke-error' : 'stroke-amber-400') : 'stroke-base-content/30',
              )}
            />
          ))}
          <rect x={CENTER.x - 34} y={CENTER.y - 18} width="68" height="36" rx="6" className="fill-secondary" />
          <text x={CENTER.x} y={CENTER.y + 5} textAnchor="middle" fontSize="13" fontWeight="700" className="fill-white">
            {device === 'hub' ? 'হাব' : 'সুইচ'}
          </text>
          {LAN_PCS.map((p) => (
            <Pc key={p.id} x={p.x} y={p.y} label={p.id} sub={p.mac} state={state(p.id)} />
          ))}
        </svg>
        {device === 'switch' && (
          <table className="table-xs table w-auto rounded-lg border border-base-300 font-mono">
            <caption className="caption-top pb-1 text-left font-sans text-xs font-bold">সুইচের MAC টেবিল</caption>
            <thead>
              <tr>
                <th>পোর্ট</th>
                <th>MAC</th>
              </tr>
            </thead>
            <tbody>
              {LAN_PCS.map((p, i) => (
                <tr key={p.id} className={clsx(shot?.at >= 1 && pairs.some(([, t]) => t === p.id) && 'bg-amber-300/30')}>
                  <td>{i + 1}</td>
                  <td>
                    {p.mac} ({p.id})
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p className="min-h-10 rounded-lg bg-base-200/60 p-2 text-sm">{note}</p>
    </div>
  );
}

// Three networks: two LANs with the same protocol, and one with a different protocol.
const NETS = {
  N1: { label: 'LAN-১', proto: 'IP', x: 70, pcs: ['P1', 'P2'] },
  N2: { label: 'LAN-২', proto: 'IP', x: 290, pcs: ['Q1', 'Q2'] },
  N3: { label: 'ভিন্ন প্রটোকল', proto: 'X', x: 180, pcs: ['R1', 'R2'] },
};
const POS = {
  S1: { x: 70, y: 70 },
  S2: { x: 290, y: 70 },
  S3: { x: 180, y: 215 },
  DEV: { x: 180, y: 120 },
  P1: { x: 30, y: 25 },
  P2: { x: 110, y: 25 },
  Q1: { x: 250, y: 25 },
  Q2: { x: 330, y: 25 },
  R1: { x: 110, y: 215 },
  R2: { x: 250, y: 215 },
};
const netOf = (pc) => Object.keys(NETS).find((k) => NETS[k].pcs.includes(pc));
const switchOf = (net) => ({ N1: 'S1', N2: 'S2', N3: 'S3' })[net];

function JoinMode() {
  const [device, setDevice] = useState('router');
  const [to, setTo] = useState('Q2');
  const [shot, setShot] = useState(null);

  useEffect(() => {
    if (!shot || shot.at >= shot.path.length - 1) return;
    const t = setTimeout(() => setShot((s) => ({ ...s, at: s.at + 1 })), 450);
    return () => clearTimeout(t);
  }, [shot]);

  const send = () => {
    const from = 'P1';
    const target = netOf(to);
    const sameNet = target === 'N1';
    const canCross = device === 'gateway' || NETS[target].proto === 'IP';
    const path = sameNet ? [from, 'S1', to] : canCross ? [from, 'S1', 'DEV', switchOf(target), to] : [from, 'S1', 'DEV'];
    setShot({ path, at: 0, ok: sameNet || canCross });
  };

  const edges = [
    ['P1', 'S1'],
    ['P2', 'S1'],
    ['Q1', 'S2'],
    ['Q2', 'S2'],
    ['R1', 'S3'],
    ['R2', 'S3'],
    ['S1', 'DEV'],
    ['S2', 'DEV'],
    ['S3', 'DEV'],
  ];
  const lit = new Set();
  if (shot) for (let i = 1; i <= shot.at; i++) lit.add([shot.path[i - 1], shot.path[i]].sort().join());
  const done = shot && shot.at === shot.path.length - 1;
  const devName = device === 'router' ? 'রাউটার' : 'গেটওয়ে';

  const note = !shot
    ? `P1 (LAN-১) থেকে ${to}-এ পাঠাও।`
    : !done
      ? 'পাঠানো হচ্ছে…'
      : !shot.ok
        ? `রাউটার একই প্রটোকলের নেটওয়ার্কই যুক্ত করতে পারে — ভিন্ন প্রটোকলের নেটওয়ার্কে পাঠানো গেল না। এখানে গেটওয়ে (প্রটোকল কনভার্টার) লাগবে।`
        : netOf(to) === 'N1'
          ? 'একই LAN — সুইচই যথেষ্ট, রাউটার লাগেনি।'
          : device === 'router'
            ? 'রাউটার একই প্রটোকলের দুটি আলাদা LAN যুক্ত করে সবচেয়ে সুবিধাজনক পথে পাঠিয়েছে।'
            : netOf(to) === 'N3'
              ? 'গেটওয়ে প্রটোকল বদলে (PAT) ভিন্ন প্রটোকলের নেটওয়ার্কে পৌঁছে দিয়েছে।'
              : 'গেটওয়ে একই প্রটোকলের নেটওয়ার্কও যুক্ত করতে পারে।';

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="join">
          {[
            ['router', 'রাউটার'],
            ['gateway', 'গেটওয়ে'],
          ].map(([k, l]) => (
            <button
              key={k}
              type="button"
              className={clsx('btn join-item btn-sm', device === k && 'btn-primary')}
              onClick={() => {
                setDevice(k);
                setShot(null);
              }}
            >
              {l}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-1 text-sm">
          প্রাপক
          <select className="select select-bordered select-xs" value={to} onChange={(e) => {
            setTo(e.target.value);
            setShot(null);
          }}>
            {['P2', 'Q1', 'Q2', 'R1', 'R2'].map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>
        <button type="button" className="btn btn-sm btn-primary" onClick={send}>
          P1 থেকে পাঠাও
        </button>
      </div>
      <svg viewBox="0 0 360 245" className="mx-auto h-auto w-full max-w-md" role="img" aria-label="রাউটার ও গেটওয়ে">
        {Object.entries(NETS).map(([k, n]) => (
          <text key={k} x={n.x} y={k === 'N3' ? 243 : 102} textAnchor="middle" fontSize="10" className="fill-base-content/60">
            {n.label} ({n.proto === 'IP' ? 'একই প্রটোকল' : 'অন্য প্রটোকল'})
          </text>
        ))}
        {edges.map(([a, b]) => (
          <line
            key={a + b}
            x1={POS[a].x}
            y1={POS[a].y}
            x2={POS[b].x}
            y2={POS[b].y}
            strokeWidth="3"
            className={clsx(lit.has([a, b].sort().join()) ? (done && !shot.ok ? 'stroke-error' : 'stroke-amber-400') : 'stroke-base-content/30')}
          />
        ))}
        {['S1', 'S2', 'S3'].map((s) => (
          <g key={s}>
            <rect x={POS[s].x - 24} y={POS[s].y - 11} width="48" height="22" rx="5" className="fill-secondary" />
            <text x={POS[s].x} y={POS[s].y + 4} textAnchor="middle" fontSize="10" fontWeight="700" className="fill-white">
              সুইচ
            </text>
          </g>
        ))}
        <rect x={POS.DEV.x - 34} y={POS.DEV.y - 15} width="68" height="30" rx="15" className={clsx(done && !shot.ok ? 'fill-error' : 'fill-accent')} />
        <text x={POS.DEV.x} y={POS.DEV.y + 5} textAnchor="middle" fontSize="12" fontWeight="700" className="fill-white">
          {devName}
        </text>
        {['P1', 'P2', 'Q1', 'Q2', 'R1', 'R2'].map((p) => (
          <Pc key={p} x={POS[p].x} y={POS[p].y} label={p} state={p === 'P1' ? 'from' : done && p === to ? (shot.ok ? 'got' : 'bad') : undefined} />
        ))}
      </svg>
      <p className="min-h-10 rounded-lg bg-base-200/60 p-2 text-sm">{note}</p>
    </div>
  );
}

/** Network devices lab. Props: mode ('lan' = hub vs switch, 'join' = router vs gateway). */
export function NetworkDeviceLab({ mode = 'lan' }) {
  return mode === 'join' ? <JoinMode /> : <LanMode />;
}
