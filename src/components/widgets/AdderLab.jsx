import { useState } from 'react';
import clsx from 'clsx';
import { toBn } from '@/lib/bn';
import { GateSymbol } from './LogicGateLab';

function Toggle({ label, value, onClick }) {
  return (
    <button type="button" onClick={onClick} className={clsx('btn btn-sm w-20 font-mono', value ? 'btn-success' : 'btn-outline')}>
      {label}={value}
    </button>
  );
}

function Out({ label, value }) {
  return (
    <span className={clsx('badge badge-lg font-mono font-bold', value ? 'badge-success' : 'badge-ghost')}>
      {label} = {value}
    </span>
  );
}

function Table({ cols, rows, active }) {
  return (
    <table className="table table-sm mx-auto w-auto rounded-lg bg-base-100 text-center font-mono">
      <thead>
        <tr>
          {cols.map((c, i) => (
            <th key={c} className={clsx('text-center', i >= cols.length - 2 && 'text-primary')}>
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className={clsx(i === active && 'bg-primary/15 font-bold')}>
            {r.map((v, j) => (
              <td key={j}>{v}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Half() {
  const [x, setX] = useState(1);
  const [y, setY] = useState(1);
  const s = x ^ y;
  const c = x & y;
  return (
    <div className="grid items-center gap-6 md:grid-cols-2">
      <div className="space-y-3">
        <div className="flex justify-center gap-2">
          <Toggle label="x" value={x} onClick={() => setX(1 - x)} />
          <Toggle label="y" value={y} onClick={() => setY(1 - y)} />
        </div>
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2">
            <GateSymbol type="XOR" inputs={2} values={[x, y]} output={s} className="h-16 w-28" />
            <Out label="S" value={s} />
          </div>
          <div className="flex items-center gap-2">
            <GateSymbol type="AND" inputs={2} values={[x, y]} output={c} className="h-16 w-28" />
            <Out label="C" value={c} />
          </div>
        </div>
        <p className="text-center font-mono text-sm">
          S = x ⊕ y = xy' + x'y &nbsp;·&nbsp; C = xy
        </p>
        <p className="text-center text-sm text-base-content/70">
          {x} + {y} = <b>{c}{s}</b>₂ {c ? '(যোগফল ' + s + ', ক্যারি 1)' : ''}
        </p>
      </div>
      <Table cols={['x', 'y', 'S', 'C']} rows={[[0, 0, 0, 0], [0, 1, 1, 0], [1, 0, 1, 0], [1, 1, 0, 1]]} active={x * 2 + y} />
    </div>
  );
}

function Full() {
  const [v, setV] = useState([1, 0, 1]); // x, y, Cin
  const [x, y, cin] = v;
  const s = x ^ y ^ cin;
  const cout = (x & y) | (y & cin) | (x & cin);
  const rows = Array.from({ length: 8 }, (_, r) => {
    const a = (r >> 2) & 1;
    const b = (r >> 1) & 1;
    const c = r & 1;
    return [a, b, c, a ^ b ^ c, (a & b) | (b & c) | (a & c)];
  });
  return (
    <div className="grid items-center gap-6 md:grid-cols-2">
      <div className="space-y-4">
        <div className="flex flex-wrap justify-center gap-2">
          {['x', 'y', 'Cin'].map((l, i) => (
            <Toggle key={l} label={l} value={v[i]} onClick={() => setV((o) => o.map((b, j) => (j === i ? 1 - b : b)))} />
          ))}
        </div>
        <div className="mx-auto flex w-fit items-center gap-3">
          <div className="grid h-28 w-36 place-items-center rounded-xl border-2 border-primary bg-primary/5 font-bold">ফুল অ্যাডার</div>
          <div className="flex flex-col gap-2">
            <Out label="S" value={s} />
            <Out label="Cout" value={cout} />
          </div>
        </div>
        <div className="space-y-1 text-center font-mono text-sm">
          <p>S = x ⊕ y ⊕ Cin</p>
          <p>Cout = xy + yCin + xCin</p>
        </div>
        <p className="text-center text-sm text-base-content/70">
          {x} + {y} + {cin} = <b>{cout}{s}</b>₂ = {toBn(x + y + cin)}
        </p>
      </div>
      <Table cols={['x', 'y', 'Cin', 'S', 'Cout']} rows={rows} active={x * 4 + y * 2 + cin} />
    </div>
  );
}

function Parallel() {
  const [X, setX] = useState([1, 0, 1, 1]); // MSB first: X4 X3 X2 X1
  const [Y, setY] = useState([0, 1, 1, 1]);
  // Ripple from the LSB (index 3) to the MSB (index 0).
  const stages = [];
  let c = 0;
  for (let i = 3; i >= 0; i -= 1) {
    const s = X[i] ^ Y[i] ^ c;
    const cout = (X[i] & Y[i]) | (Y[i] & c) | (X[i] & c);
    stages[i] = { cin: c, s, cout };
    c = cout;
  }
  const xv = parseInt(X.join(''), 2);
  const yv = parseInt(Y.join(''), 2);
  const flip = (set, i) => set((o) => o.map((b, j) => (j === i ? 1 - b : b)));

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto pb-2">
        <div className="mx-auto flex w-fit items-stretch gap-1">
          <div className="flex flex-col items-center justify-end pb-6">
            <Out label="C" value={c} />
          </div>
          {X.map((_, i) => {
            const st = stages[i];
            const n = 4 - i;
            return (
              <div key={i} className="flex items-center gap-1">
                {i > 0 && <span className="text-xs text-base-content/40">←</span>}
                <div className="flex w-24 flex-col items-center gap-1.5">
                  <div className="flex gap-1">
                    <button type="button" className={clsx('btn btn-xs font-mono', X[i] ? 'btn-success' : 'btn-outline')} onClick={() => flip(setX, i)}>
                      X{'₁₂₃₄'[n - 1]}={X[i]}
                    </button>
                    <button type="button" className={clsx('btn btn-xs font-mono', Y[i] ? 'btn-success' : 'btn-outline')} onClick={() => flip(setY, i)}>
                      Y{'₁₂₃₄'[n - 1]}={Y[i]}
                    </button>
                  </div>
                  <div className="grid h-16 w-full place-items-center rounded-lg border-2 border-primary bg-primary/5 text-center text-xs leading-tight font-semibold">
                    FA-{toBn(n)}
                    <span className="font-mono font-normal text-base-content/60">Cin={st.cin}</span>
                  </div>
                  <Out label={`S${'₁₂₃₄'[n - 1]}`} value={st.s} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <p className="text-center font-mono">
        {X.join('')} + {Y.join('')} ={' '}
        <b className="text-primary">
          {c}
          {stages.map((s) => s.s).join('')}
        </b>
        ₂ &nbsp;
        <span className="font-sans text-sm text-base-content/60">
          ({toBn(xv)} + {toBn(yv)} = {toBn(xv + yv)})
        </span>
      </p>
      <p className="text-center text-xs text-base-content/55">
        প্রথম ব্লকের Cin = 0। প্রতিটি ব্লকের Cout পরের (বাম দিকের) ব্লকের Cin — ক্যারি ডান থেকে বামে "ঢেউয়ের মতো" (ripple) যায়। শেষ Cout হলো পঞ্চম বিট।
      </p>
    </div>
  );
}

/** props: type ('half' | 'full' | 'parallel') */
export function AdderLab({ type: initType = 'half' }) {
  const [type, setType] = useState(initType);
  return (
    <div className="space-y-4">
      <div role="tablist" className="tabs-box tabs tabs-sm w-fit">
        {[
          ['half', 'হাফ অ্যাডার'],
          ['full', 'ফুল অ্যাডার'],
          ['parallel', '৪-বিট প্যারালাল অ্যাডার'],
        ].map(([k, label]) => (
          <button key={k} type="button" role="tab" className={clsx('tab', type === k && 'tab-active')} onClick={() => setType(k)}>
            {label}
          </button>
        ))}
      </div>
      {type === 'half' && <Half />}
      {type === 'full' && <Full />}
      {type === 'parallel' && <Parallel />}
    </div>
  );
}
