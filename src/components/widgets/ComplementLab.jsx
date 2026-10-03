import { useState } from 'react';
import clsx from 'clsx';
import { toBn } from '@/lib/bn';

const toBits = (n, bits) => (n >>> 0).toString(2).slice(-bits).padStart(bits, '0');
const invert = (s) => s.replace(/[01]/g, (d) => (d === '0' ? '1' : '0'));
const group = (s) => s.replace(/(.{4})(?=.)/g, '$1 ');
const range = (bits) => ({ min: -(2 ** (bits - 1)), max: 2 ** (bits - 1) - 1 });

/** "মূল সংখ্যা / 1-এর পরিপূরক / 1 যোগ / 2-এর পরিপূরক" table exactly like the book. */
function ComplementSteps({ positive, bits, label }) {
  const p = toBits(positive, bits);
  const ones = invert(p);
  const twos = toBits(-positive, bits);
  return (
    <table className="table table-sm w-auto rounded-lg bg-base-100 font-mono">
      <tbody>
        <tr>
          <td className="font-sans">+{toBn(positive)}₁₀ =</td>
          <td className="text-right">{group(p)}</td>
        </tr>
        <tr>
          <td className="font-sans">1-এর পরিপূরক (উল্টাও)</td>
          <td className="text-right">{group(ones)}</td>
        </tr>
        <tr>
          <td className="font-sans">1 যোগ</td>
          <td className="text-right">+1</td>
        </tr>
        <tr className="border-t-2 border-base-content/30 font-bold text-primary">
          <td className="font-sans">{label ?? `2-এর পরিপূরক (−${toBn(positive)}₁₀)`}</td>
          <td className="text-right">{group(twos)}</td>
        </tr>
      </tbody>
    </table>
  );
}

function BitsSelect({ bits, setBits }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-base-content/60">বিট সংখ্যা</span>
      <select className="select w-full" value={bits} onChange={(e) => setBits(Number(e.target.value))}>
        {[4, 8, 16].map((b) => (
          <option key={b} value={b}>
            {toBn(b)} বিট
          </option>
        ))}
      </select>
    </label>
  );
}

function NumInput({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-base-content/60">{label}</span>
      <input className="input w-full font-mono text-lg" value={value} inputMode="numeric" onChange={(e) => onChange(e.target.value.replace(/[^\d-]/g, '').replace(/(?!^)-/g, ''))} />
    </label>
  );
}

function Represent({ value, bits }) {
  const n = Number(value);
  const { min, max } = range(bits);
  if (!Number.isInteger(n) || value === '' || value === '-') return null;
  if (n < min || n > max) {
    return (
      <p className="rounded-lg bg-error/10 p-3 text-sm">
        {toBn(bits)} বিটের 2-এর পরিপূরকে শুধু {toBn(min)} থেকে +{toBn(max)} পর্যন্ত রাখা যায়। বিট সংখ্যা বাড়াও।
      </p>
    );
  }
  const mag = Math.abs(n);
  const smFits = mag <= 2 ** (bits - 1) - 1;
  const magBits = toBits(mag, bits - 1);
  const rows = [
    ['চিহ্নযুক্ত মান (Sign-magnitude)', smFits ? `${n < 0 ? 1 : 0}${magBits}` : '—', 'MSB = চিহ্ন (0 = +, 1 = −), বাকি বিটে মান'],
    ['1-এর পরিপূরক', n < 0 ? invert(toBits(mag, bits)) : toBits(n, bits), n < 0 ? 'ধনাত্মক রূপের সব বিট উল্টানো' : 'ধনাত্মক সংখ্যা — যেমন আছে তেমন'],
    ['2-এর পরিপূরক', toBits(n, bits), n < 0 ? '1-এর পরিপূরক + 1' : 'ধনাত্মক সংখ্যা — যেমন আছে তেমন'],
  ];
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="table table-sm rounded-lg bg-base-100">
          <thead>
            <tr>
              <th>পদ্ধতি</th>
              <th>{toBn(n)}₁₀ এর রূপ</th>
              <th>কীভাবে</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([name, b, how]) => (
              <tr key={name}>
                <td className="font-semibold">{name}</td>
                <td className="font-mono text-base">
                  <span className="text-error">{b[0]}</span>
                  {group(b).slice(1)}
                </td>
                <td className="text-xs text-base-content/60">{how}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {n < 0 && <ComplementSteps positive={mag} bits={bits} />}
      <p className="text-xs text-base-content/60">
        লাল বিটটি MSB — {n < 0 ? '1 মানে সংখ্যাটি ঋণাত্মক' : '0 মানে সংখ্যাটি ধনাত্মক'}। {toBn(bits)} বিটে 2-এর পরিপূরকের সীমা {toBn(min)} থেকে +{toBn(max)}।
      </p>
    </div>
  );
}

function Subtract({ a, b, bits }) {
  const A = Number(a);
  const B = Number(b);
  const { min, max } = range(bits);
  if (![a, b].every((v) => v !== '' && v !== '-') || !Number.isInteger(A) || !Number.isInteger(B)) return null;
  if (A < 0 || B < 0) return <p className="text-sm text-warning">এই ল্যাবে A ও B ধনাত্মক দাও — A − B নির্ণয় করা হবে।</p>;
  if (A > max || B > max) return <p className="text-sm text-error">{toBn(bits)} বিটে সর্বোচ্চ +{toBn(max)} পর্যন্ত রাখা যায়। বিট সংখ্যা বাড়াও।</p>;

  const raw = A + (2 ** bits - B); // A + (2's complement of B)
  const carry = raw >= 2 ** bits;
  const sum = toBits(raw, bits);
  const negative = sum[0] === '1';
  const result = A - B;
  const overflow = result < min;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="mb-1 text-sm font-semibold">ধাপ ১: B-এর 2-এর পরিপূরক = −B</p>
          <ComplementSteps positive={B} bits={bits} />
        </div>
        <div>
          <p className="mb-1 text-sm font-semibold">ধাপ ২: A-এর সাথে −B যোগ</p>
          <table className="table table-sm w-auto rounded-lg bg-base-100 font-mono">
            <tbody>
              <tr>
                <td className="font-sans">+{toBn(A)}₁₀ =</td>
                <td className="text-right">{group(toBits(A, bits))}</td>
              </tr>
              <tr>
                <td className="font-sans">−{toBn(B)}₁₀ =</td>
                <td className="text-right">{group(toBits(-B, bits))}</td>
              </tr>
              <tr className="border-t-2 border-base-content/30 font-bold">
                <td className="font-sans">যোগফল</td>
                <td className="text-right">
                  {carry && <span className="mr-1 text-base-content/35 line-through">1</span>}
                  <span className={negative ? 'text-error' : 'text-success'}>{sum[0]}</span>
                  {group(sum).slice(1)}
                </td>
              </tr>
            </tbody>
          </table>
          {carry && <p className="mt-1 text-xs text-base-content/60">নবম/অতিরিক্ত বিটের 1 হলো ওভারফ্লো ক্যারি — বাদ দাও।</p>}
        </div>
      </div>
      <div className={clsx('rounded-xl p-3 text-sm', negative ? 'bg-error/10' : 'bg-success/10')}>
        <p className="font-semibold">ধাপ ৩: ফল পড়া</p>
        {overflow ? (
          <p>ফলাফল {toBn(bits)} বিটের সীমার বাইরে — ওভারফ্লো।</p>
        ) : negative ? (
          <p>
            MSB = 1, তাই ফল ঋণাত্মক। আবার 2-এর পরিপূরক নিলে পাই {group(toBits(-result, bits))} = {toBn(-result)}, অর্থাৎ উত্তর <b>{toBn(result)}₁₀</b>।
          </p>
        ) : (
          <p>
            MSB = 0, তাই ফল ধনাত্মক: {group(sum)} = <b>+{toBn(result)}₁₀</b>।
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * props: mode ('represent' | 'subtract'), value (decimal string), bits (4|8|16), a, b (decimal strings)
 */
export function ComplementLab({ mode: initMode = 'represent', value: initValue = '-25', bits: initBits = 8, a: initA = '50', b: initB = '25' }) {
  const [mode, setMode] = useState(initMode);
  const [value, setValue] = useState(String(initValue));
  const [bits, setBits] = useState(initBits);
  const [a, setA] = useState(String(initA));
  const [b, setB] = useState(String(initB));

  return (
    <div className="space-y-4">
      <div role="tablist" className="tabs-box tabs tabs-sm w-fit">
        {[
          ['represent', 'ঋণাত্মক সংখ্যার রূপ'],
          ['subtract', '2-এর পরিপূরকে বিয়োগ'],
        ].map(([k, label]) => (
          <button key={k} type="button" role="tab" className={clsx('tab', mode === k && 'tab-active')} onClick={() => setMode(k)}>
            {label}
          </button>
        ))}
      </div>

      {mode === 'represent' ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <NumInput label="দশমিক সংখ্যা (যেমন −25)" value={value} onChange={setValue} />
            <BitsSelect bits={bits} setBits={setBits} />
          </div>
          <Represent value={value} bits={bits} />
        </>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <NumInput label="A (যা থেকে বিয়োগ)" value={a} onChange={setA} />
            <NumInput label="B (যা বিয়োগ হবে)" value={b} onChange={setB} />
            <BitsSelect bits={bits} setBits={setBits} />
          </div>
          <Subtract a={a} b={b} bits={bits} />
        </>
      )}
    </div>
  );
}
