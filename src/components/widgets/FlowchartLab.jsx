import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { ChevronFirst, ChevronRight, FastForward, Pause, Play, RotateCcw, TerminalSquare } from 'lucide-react';
import { toBn } from '@/lib/bn';
import { FLOWCHARTS } from './flowcharts';
import { runBox, showVar } from './flowchartRun';

const COLW = 200;
const ROWH = 84;
const PAD = 40;
const SIZE = {
  start: [112, 38],
  end: [112, 38],
  io: [164, 44],
  process: [156, 44],
  decision: [168, 60],
  connector: [26, 26],
};

const formatNum = (n) => (n === undefined ? '<গার্বেজ>' : Number.isInteger(n) ? String(n) : String(Number(n.toPrecision(10))));

function layout(nodes) {
  const minCol = Math.min(...nodes.map((n) => n.col));
  const byId = {};
  for (const n of nodes) {
    const [w, h] = SIZE[n.type];
    const cx = PAD + (n.col - minCol) * COLW + COLW / 2;
    const cy = PAD / 2 + n.row * ROWH + ROWH / 2;
    byId[n.id] = { ...n, cx, cy, w, h, top: cy - h / 2, bottom: cy + h / 2, left: cx - w / 2, right: cx + w / 2 };
  }
  const cols = Math.max(...nodes.map((n) => n.col)) - minCol + 1;
  const rows = Math.max(...nodes.map((n) => n.row)) + 1;
  return { byId, width: PAD * 2 + cols * COLW, height: PAD + rows * ROWH };
}

/** Orthogonal path from node a to node b leaving through `side`. */
function route(a, b, side, lane = 0) {
  const below = b.row > a.row;
  const sameRow = b.row === a.row;
  const exit = side ?? (below ? 'down' : sameRow ? (b.cx > a.cx ? 'right' : 'left') : 'left');
  if (exit === 'down') {
    const p0 = [a.cx, a.bottom];
    if (b.cx === a.cx && below) return [p0, [b.cx, b.top]];
    if (below) return [p0, [a.cx, b.cy], [b.cx > a.cx ? b.left : b.right, b.cy]];
    // going back up from the bottom: drop a little, then use a side lane
    const x = Math.min(a.left, b.left) - 26 - lane * 14;
    return [p0, [a.cx, a.bottom + 14], [x, a.bottom + 14], [x, b.cy], [b.left, b.cy]];
  }
  const dir = exit === 'right' ? 1 : -1;
  const p0 = [exit === 'right' ? a.right : a.left, a.cy];
  if (sameRow) return [p0, [dir > 0 ? b.left : b.right, b.cy]];
  const towards = dir > 0 ? b.cx > a.right : b.cx < a.left;
  if (below && towards) return [p0, [b.cx, a.cy], [b.cx, b.top]];
  // around the side: a lane outside both boxes, then into the target's side
  const x = dir > 0 ? Math.max(a.right, b.right) + 26 + lane * 14 : Math.min(a.left, b.left) - 26 - lane * 14;
  return [p0, [x, a.cy], [x, b.cy], [dir > 0 ? b.right : b.left, b.cy]];
}

function edgesOf(byId) {
  const edges = [];
  for (const n of Object.values(byId)) {
    if (n.next) edges.push({ from: n.id, to: n.next, side: n.nextSide, lane: n.lane });
    if (n.yes) edges.push({ from: n.id, to: n.yes, side: n.yesSide ?? 'down', label: 'হ্যাঁ', branch: 'yes' });
    if (n.no) edges.push({ from: n.id, to: n.no, side: n.noSide ?? 'down', label: 'না', branch: 'no' });
  }
  return edges.map((e) => ({ ...e, points: route(byId[e.from], byId[e.to], e.side, e.lane) }));
}

function Shape({ n, active }) {
  const cls = clsx('stroke-[1.6]', active ? 'fill-primary/20 stroke-primary' : 'fill-base-100 stroke-base-content/60');
  const { cx, cy, w, h } = n;
  let shape;
  if (n.type === 'start' || n.type === 'end') shape = <ellipse cx={cx} cy={cy} rx={w / 2} ry={h / 2} className={cls} />;
  else if (n.type === 'io') {
    const k = 12;
    shape = <polygon points={`${n.left + k},${n.top} ${n.right},${n.top} ${n.right - k},${n.bottom} ${n.left},${n.bottom}`} className={cls} />;
  } else if (n.type === 'process') shape = <rect x={n.left} y={n.top} width={w} height={h} rx={3} className={cls} />;
  else if (n.type === 'decision') shape = <polygon points={`${cx},${n.top} ${n.right},${cy} ${cx},${n.bottom} ${n.left},${cy}`} className={cls} />;
  else shape = <circle cx={cx} cy={cy} r={w / 2} className={cls} />;
  const lines = n.text.split('\n');
  return (
    <g>
      {shape}
      <text x={cx} y={cy - ((lines.length - 1) * 14) / 2} textAnchor="middle" dominantBaseline="central" className="fill-base-content text-[12px]">
        {lines.map((l, i) => (
          <tspan key={i} x={cx} dy={i ? 14 : 0}>
            {l}
          </tspan>
        ))}
      </text>
    </g>
  );
}

const initialState = (chart) => ({
  cur: chart.nodes.find((n) => n.type === 'start').id,
  values: { ...(chart.init ?? {}) },
  out: '',
  inPos: 0,
  edge: null,
  note: 'শুরু থেকে চলা শুরু হবে — "পরের ধাপ" চাপো',
  done: false,
  error: null,
  count: 0,
});

/**
 * Flowchart runner. Props: preset (see flowcharts.js) or chart (same shape), input (space-separated values).
 * Steps box by box, highlighting the current box and the arrow taken, with a variable table and output.
 */
export function FlowchartLab({ preset = 'c-to-f', chart: custom, input }) {
  const chart = custom ?? FLOWCHARTS[preset];
  const { byId, width, height } = useMemo(() => layout(chart.nodes), [chart]);
  const edges = useMemo(() => edgesOf(byId), [byId]);
  const [stdin, setStdin] = useState(input ?? chart.input ?? '');
  const [history, setHistory] = useState(() => [initialState(chart)]);
  const [playing, setPlaying] = useState(false);
  const state = history[history.length - 1];
  const node = byId[state.cur];
  const waiting = node?.type === 'decision' && node.ask && !state.done;
  const needsInput = chart.nodes.some((n) => n.read?.length);

  const reset = () => {
    setHistory([initialState(chart)]);
    setPlaying(false);
  };

  function advance(s, answer) {
    const n = byId[s.cur];
    const ns = { ...s, values: { ...s.values }, edge: null, count: s.count + 1 };
    const go = (to, branch) => {
      ns.edge = `${n.id}>${to}${branch ? `:${branch}` : ''}`;
      ns.cur = to;
    };
    if (ns.count > 3000) return { ...ns, error: 'অনেক বেশি ধাপ — লুপ কি কখনো থামছে?', done: true };
    switch (n.type) {
      case 'start':
        ns.note = 'শুরু';
        go(n.next);
        break;
      case 'end':
        return { ...ns, done: true, note: 'শেষ — ফ্লোচার্টের কাজ সম্পন্ন' };
      case 'connector':
        ns.note = 'কানেক্টর — একাধিক পথ এখানে মিলেছে';
        go(n.next);
        break;
      case 'process': {
        const r = runBox(chart.vars, ns.values, n.code);
        if (r.error) return { ...ns, error: r.error, done: true };
        ns.values = r.values;
        ns.note = `প্রসেস: ${n.text.replace(/\n/g, ' ')}`;
        go(n.next);
        break;
      }
      case 'io': {
        if (n.read) {
          const tokens = stdin.trim().split(/\s+/).filter(Boolean);
          const got = [];
          for (const name of n.read) {
            const tok = tokens[ns.inPos];
            if (tok === undefined || Number.isNaN(Number(tok))) return { ...ns, error: 'ইনপুট শেষ বা সংখ্যা নয় — উপরের ইনপুট বক্সে মান দাও', done: true };
            ns.inPos++;
            const r = runBox(chart.vars, ns.values, `${name} = ${Number(tok)};`);
            if (r.error) return { ...ns, error: r.error, done: true };
            ns.values = r.values;
            got.push(`${name} = ${showVar(chart.vars[name], ns.values[name])}`);
          }
          ns.note = `ইনপুট নেওয়া হলো: ${got.join(', ')}`;
        } else {
          const exprs = n.print.filter((p) => !p.startsWith('"'));
          const r = runBox(chart.vars, ns.values, '', exprs);
          if (r.error) return { ...ns, error: r.error, done: true };
          let k = 0;
          const line = n.print.map((p) => (p.startsWith('"') ? p.slice(1, -1) : formatNum(r.results[k++]))).join(n.print.length > 1 && n.print.every((p) => !p.startsWith('"')) ? ' ' : '');
          ns.out += `${line}\n`;
          ns.note = `আউটপুট: ${line}`;
        }
        go(n.next);
        break;
      }
      case 'decision': {
        let yes;
        if (n.ask) yes = answer;
        else {
          const r = runBox(chart.vars, ns.values, '', [`(${n.test}) ? 1 : 0`]);
          if (r.error) return { ...ns, error: r.error, done: true };
          yes = r.results[0] === 1;
        }
        ns.note = `শর্ত: ${n.text} → ${yes ? 'হ্যাঁ' : 'না'}`;
        go(yes ? n.yes : n.no, yes ? 'yes' : 'no');
        break;
      }
      default:
    }
    return ns;
  }

  const step = (answer) => {
    if (state.done || state.error) return;
    if (waiting && answer === undefined) return;
    setHistory((h) => [...h, advance(h[h.length - 1], answer)]);
  };
  const runToEnd = () => {
    if (waiting) return;
    setHistory((h) => {
      const out = [...h];
      let s = out[out.length - 1];
      while (!s.done && !s.error && !(byId[s.cur].type === 'decision' && byId[s.cur].ask) && out.length < 4000) {
        s = advance(s);
        out.push(s);
      }
      return out;
    });
  };

  useEffect(() => {
    if (!playing) return undefined;
    if (state.done || state.error || waiting) {
      setPlaying(false);
      return undefined;
    }
    const t = setTimeout(() => setHistory((h) => [...h, advance(h[h.length - 1])]), 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, history]);

  // Changing the input restarts the run.
  useEffect(() => {
    setHistory([initialState(chart)]);
    setPlaying(false);
  }, [stdin, chart]);

  const prevValues = history.length > 1 ? history[history.length - 2].values : null;
  const varNames = Object.keys(chart.vars);

  return (
    <div className="space-y-3">
      {chart.title && <p className="text-sm font-semibold text-base-content/70">{chart.title}</p>}
      {needsInput && (
        <label className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-semibold">ইনপুট:</span>
          <input className="input input-sm w-40 font-mono" value={stdin} onChange={(e) => setStdin(e.target.value)} placeholder="যেমন: 5" />
          <span className="text-xs text-base-content/50">(একাধিক হলে ফাঁকা দিয়ে)</span>
        </label>
      )}

      <div className="grid gap-3 lg:grid-cols-[1fr_minmax(0,15rem)]">
        <div className="overflow-x-auto rounded-xl border border-base-300 bg-base-200/40">
          <svg viewBox={`0 0 ${width} ${height}`} className="mx-auto block" style={{ width: Math.min(width, 640), maxWidth: '100%' }} role="img" aria-label="ফ্লোচার্ট">
            <defs>
              <marker id="fc-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M0,0 L10,5 L0,10 z" className="fill-base-content/60" />
              </marker>
              <marker id="fc-arrow-on" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M0,0 L10,5 L0,10 z" className="fill-primary" />
              </marker>
            </defs>
            {edges.map((e, k) => {
              const on = state.edge === `${e.from}>${e.to}${e.branch ? `:${e.branch}` : ''}`;
              const [p0, p1] = e.points;
              const horizontal = p0[1] === p1[1];
              return (
                <g key={k}>
                  <polyline
                    points={e.points.map((p) => p.join(',')).join(' ')}
                    fill="none"
                    className={clsx(on ? 'stroke-primary stroke-[2.5]' : 'stroke-base-content/50 stroke-[1.4]')}
                    markerEnd={`url(#${on ? 'fc-arrow-on' : 'fc-arrow'})`}
                  />
                  {e.label && (
                    <text
                      x={p0[0] + (horizontal ? (p1[0] > p0[0] ? 14 : -14) : 8)}
                      y={p0[1] + (horizontal ? -6 : 14)}
                      textAnchor={horizontal ? 'middle' : 'start'}
                      className={clsx('text-[11px] font-bold', e.branch === 'yes' ? 'fill-success' : 'fill-error')}
                    >
                      {e.label}
                    </text>
                  )}
                </g>
              );
            })}
            {Object.values(byId).map((n) => (
              <Shape key={n.id} n={n} active={n.id === state.cur && !state.done} />
            ))}
          </svg>
        </div>

        <div className="space-y-3">
          <div className="rounded-lg border border-base-300 bg-base-100">
            <p className="border-b border-base-300 px-2 py-1 text-xs font-bold text-base-content/60">ভেরিয়েবল</p>
            {varNames.length === 0 ? (
              <p className="px-2 py-1.5 text-xs text-base-content/40">এই ফ্লোচার্টে কোনো ভেরিয়েবল নেই</p>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {varNames.map((v) => {
                    const val = showVar(chart.vars[v], state.values[v]);
                    const changed = prevValues && JSON.stringify(prevValues[v]) !== JSON.stringify(state.values[v]);
                    return (
                      <tr key={v} className={clsx('border-b border-base-200 last:border-0', changed && 'bg-amber-300/25')}>
                        <td className="px-2 py-1 font-mono font-bold">{v}</td>
                        <td className={clsx('px-2 py-1 font-mono', val.includes('?') && 'text-base-content/40')}>{val}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
          <div>
            <p className="mb-1 flex items-center gap-1 text-xs font-semibold text-base-content/60">
              <TerminalSquare className="size-3.5" /> আউটপুট
            </p>
            <pre className="max-h-40 min-h-16 overflow-auto rounded-lg bg-black/85 p-2 font-mono text-sm whitespace-pre-wrap text-green-300">
              {state.out || <span className="text-white/30">(এখনো কিছু নেই)</span>}
            </pre>
          </div>
        </div>
      </div>

      <p className={clsx('rounded-lg border-l-4 px-3 py-2 text-sm', state.error ? 'border-error bg-error/10' : 'border-amber-400 bg-amber-300/15')}>
        <b>ধাপ {toBn(history.length - 1)}:</b> {state.error ?? state.note}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {waiting ? (
          <>
            <span className="text-sm font-semibold">{node.text.replace(/\n/g, ' ')}</span>
            <button type="button" className="btn btn-success btn-sm" onClick={() => step(true)}>
              হ্যাঁ
            </button>
            <button type="button" className="btn btn-error btn-sm" onClick={() => step(false)}>
              না
            </button>
          </>
        ) : (
          <>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => step()} disabled={state.done || !!state.error}>
              পরের ধাপ <ChevronRight className="size-4" />
            </button>
            <button type="button" className="btn btn-sm" onClick={() => setPlaying(!playing)} disabled={state.done || !!state.error}>
              {playing ? <Pause className="size-4" /> : <Play className="size-4" />} {playing ? 'থামাও' : 'অটো'}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={runToEnd} disabled={state.done || !!state.error}>
              <FastForward className="size-4" /> শেষ পর্যন্ত
            </button>
          </>
        )}
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setHistory((h) => (h.length > 1 ? h.slice(0, -1) : h))} disabled={history.length < 2}>
          <ChevronFirst className="size-4" /> এক ধাপ পেছাও
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={reset}>
          <RotateCcw className="size-4" /> আবার শুরু
        </button>
      </div>
    </div>
  );
}
