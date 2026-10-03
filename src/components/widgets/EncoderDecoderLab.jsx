import { useState } from 'react';
import clsx from 'clsx';
import { toBn } from '@/lib/bn';

const SUB = '₀₁₂₃₄₅₆₇';

/** A₂ or A̅₂ (overline via CSS). */
function Lit({ name, i, neg }) {
  return (
    <span className="font-mono">
      <span className={clsx(neg && 'overline')}>{name}</span>
      {SUB[i]}
    </span>
  );
}

function Led({ on, label }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span
        className={clsx(
          'size-7 rounded-full border-2 transition',
          on ? 'border-success bg-success shadow-[0_0_12px] shadow-success/70' : 'border-base-300 bg-base-200'
        )}
      />
      <span className="font-mono text-xs">{label}</span>
    </div>
  );
}

function Decoder({ n }) {
  const [bits, setBits] = useState(Array(n).fill(0)); // bits[0] = MSB (A_{n-1})
  const value = bits.reduce((v, b) => v * 2 + b, 0);
  const outs = 2 ** n;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-center gap-6">
        <div className="flex gap-2">
          {bits.map((b, i) => {
            const idx = n - 1 - i;
            return (
              <button
                key={i}
                type="button"
                className={clsx('btn w-16 font-mono', b ? 'btn-success' : 'btn-outline')}
                onClick={() => setBits((s) => s.map((x, j) => (j === i ? 1 - x : x)))}
              >
                A{SUB[idx]}={b}
              </button>
            );
          })}
        </div>
        <span className="text-2xl text-base-content/40">→</span>
        <div className="rounded-xl border-2 border-primary/40 bg-primary/5 px-4 py-2 text-center">
          <p className="text-xs text-base-content/60">
            {toBn(n)}-to-{toBn(outs)} ডিকোডার
          </p>
          <p className="font-mono font-bold">
            ইনপুট {bits.join('')}₂ = {toBn(value)}
          </p>
        </div>
        <span className="text-2xl text-base-content/40">→</span>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: outs }, (_, k) => (
            <Led key={k} on={k === value} label={`Q${SUB[k]}`} />
          ))}
        </div>
      </div>
      <div className="grid gap-1 rounded-xl bg-base-200/70 p-3 text-sm sm:grid-cols-2">
        {Array.from({ length: outs }, (_, k) => (
          <p key={k} className={clsx('rounded px-2', k === value && 'bg-success/15 font-bold')}>
            <span className="font-mono">Q{SUB[k]} = </span>
            {Array.from({ length: n }, (_, i) => {
              const idx = n - 1 - i;
              return <Lit key={i} name="A" i={idx} neg={!((k >> idx) & 1)} />;
            })}
          </p>
        ))}
      </div>
      <p className="text-center text-xs text-base-content/55">
        যে আউটপুট লাইনের নম্বর ইনপুটের বাইনারি মানের সমান, শুধু সেটি 1 হয়। প্রতিটি আউটপুট একটি {toBn(n)}-ইনপুট AND গেট।
      </p>
    </div>
  );
}

function Encoder({ lines }) {
  const n = Math.log2(lines);
  const [active, setActive] = useState(2 % lines);
  const outBits = Array.from({ length: n }, (_, i) => (active >> (n - 1 - i)) & 1); // MSB first
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-center gap-6">
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: lines }, (_, k) => (
            <button
              key={k}
              type="button"
              className={clsx('btn btn-sm w-16 font-mono', k === active ? 'btn-success' : 'btn-outline')}
              onClick={() => setActive(k)}
            >
              A{SUB[k]}={k === active ? 1 : 0}
            </button>
          ))}
        </div>
        <span className="text-2xl text-base-content/40">→</span>
        <div className="rounded-xl border-2 border-primary/40 bg-primary/5 px-4 py-2 text-center">
          <p className="text-xs text-base-content/60">
            {toBn(lines)}-to-{toBn(n)} এনকোডার
          </p>
          <p className="font-mono font-bold">লাইন {toBn(active)} উজ্জীবিত</p>
        </div>
        <span className="text-2xl text-base-content/40">→</span>
        <div className="flex gap-2">
          {outBits.map((b, i) => (
            <Led key={i} on={b} label={`Q${SUB[n - 1 - i]}=${b}`} />
          ))}
        </div>
      </div>
      <div className="space-y-1 rounded-xl bg-base-200/70 p-3 text-sm">
        {Array.from({ length: n }, (_, bi) => {
          const idx = n - 1 - bi;
          const terms = Array.from({ length: lines }, (_, k) => k).filter((k) => (k >> idx) & 1);
          return (
            <p key={idx} className={clsx('rounded px-2 font-mono', (active >> idx) & 1 && 'bg-success/15 font-bold')}>
              Q{SUB[idx]} = {terms.map((k) => `A${SUB[k]}`).join(' + ')}
            </p>
          );
        })}
      </div>
      <p className="text-center text-xs text-base-content/55">
        একবারে একটি ইনপুট লাইন 1 হয়; তার নম্বরটি আউটপুটে বাইনারি হিসেবে আসে। প্রতিটি আউটপুট একটি OR গেট। A₀ কোনো OR গেটে লাগে না — তখন আউটপুট 000-ই থাকে।
      </p>
    </div>
  );
}

/**
 * props: type ('encoder' | 'decoder'), size (decoder: 2|3 inputs; encoder: 4|8 lines)
 */
export function EncoderDecoderLab({ type: initType = 'decoder', size }) {
  const [type, setType] = useState(initType);
  const [decN, setDecN] = useState(initType === 'decoder' && [2, 3].includes(size) ? size : 3);
  const [encN, setEncN] = useState(initType === 'encoder' && [4, 8].includes(size) ? size : 8);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div role="tablist" className="tabs-box tabs tabs-sm">
          {[
            ['encoder', 'এনকোডার'],
            ['decoder', 'ডিকোডার'],
          ].map(([k, label]) => (
            <button key={k} type="button" role="tab" className={clsx('tab', type === k && 'tab-active')} onClick={() => setType(k)}>
              {label}
            </button>
          ))}
        </div>
        <select
          className="select select-sm w-auto"
          value={type === 'decoder' ? decN : encN}
          onChange={(e) => (type === 'decoder' ? setDecN : setEncN)(Number(e.target.value))}
        >
          {type === 'decoder' ? (
            <>
              <option value={2}>2-to-4</option>
              <option value={3}>3-to-8</option>
            </>
          ) : (
            <>
              <option value={4}>4-to-2</option>
              <option value={8}>8-to-3</option>
            </>
          )}
        </select>
      </div>
      {type === 'decoder' ? <Decoder key={decN} n={decN} /> : <Encoder key={encN} lines={encN} />}
    </div>
  );
}
