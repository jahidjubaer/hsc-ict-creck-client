import { useState } from 'react';
import clsx from 'clsx';
import { toBn } from '@/lib/bn';

const pad = (n, base, len) => n.toString(base).toUpperCase().padStart(len, '0');
const MODES = [
  ['bcd', 'BCD'],
  ['ascii', 'ASCII'],
  ['unicode', 'ইউনিকোড'],
];
const DEFAULTS = { bcd: '25', ascii: 'ICT', unicode: 'বাংলা' };

function Bcd({ value }) {
  const digits = value.replace(/\D/g, '');
  if (!digits) return <p className="text-sm text-base-content/60">একটি দশমিক সংখ্যা লেখো।</p>;
  const pure = BigInt(digits).toString(2);
  const bcd = digits.split('').map((d) => pad(Number(d), 2, 4));
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        {digits.split('').map((d, i) => (
          <div key={i} className="flex flex-col items-center rounded-lg border border-base-300 bg-base-100 px-2 py-1 font-mono">
            <span className="text-lg font-bold text-primary">{d}</span>
            <span className="text-xs text-base-content/40">↓</span>
            <span>{bcd[i]}</span>
          </div>
        ))}
      </div>
      <table className="table table-sm w-auto rounded-lg bg-base-100">
        <tbody>
          <tr>
            <td>BCD ({toBn(bcd.length * 4)} বিট)</td>
            <td className="font-mono font-bold text-primary">{bcd.join(' ')}</td>
          </tr>
          <tr>
            <td>বিশুদ্ধ বাইনারি ({toBn(pure.length)} বিট)</td>
            <td className="font-mono">{pure}</td>
          </tr>
        </tbody>
      </table>
      <p className="text-xs text-base-content/60">
        BCD-তে প্রতিটি দশমিক অঙ্ক আলাদাভাবে ৪ বিটে লেখা হয়, তাই 1010 থেকে 1111 — এই ছয়টি বিন্যাস কখনো ব্যবহার হয় না। পুরো সংখ্যার বাইনারি আর BCD এক নয়।
      </p>
    </div>
  );
}

function CharTable({ value, unicode }) {
  const chars = [...value].slice(0, 24);
  if (!chars.length) return <p className="text-sm text-base-content/60">কিছু লেখো।</p>;
  return (
    <div className="overflow-x-auto">
      <table className="table table-sm rounded-lg bg-base-100 font-mono">
        <thead>
          <tr>
            <th>অক্ষর</th>
            <th>দশমিক</th>
            <th>{unicode ? 'কোড পয়েন্ট' : 'হেক্সা'}</th>
            <th>{unicode ? 'বাইনারি (১৬ বিট)' : 'বাইনারি (৭ বিট / ৮ বিট)'}</th>
          </tr>
        </thead>
        <tbody>
          {chars.map((ch, i) => {
            const cp = ch.codePointAt(0);
            const bad = unicode ? cp > 0xffff : cp > 127;
            return (
              <tr key={i} className={clsx(bad && 'text-error')}>
                <td className="text-lg">{ch === ' ' ? '␣' : ch}</td>
                <td>{cp}</td>
                <td>{unicode ? `U+${pad(cp, 16, 4)}` : bad ? '—' : pad(cp, 16, 2)}</td>
                <td>
                  {bad
                    ? unicode
                      ? '১৬ বিটের বাইরে'
                      : 'ASCII-তে নেই'
                    : unicode
                      ? pad(cp, 2, 16).replace(/(.{4})(?=.)/g, '$1 ')
                      : `${pad(cp, 2, 7)} / ${pad(cp, 2, 8)}`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Codes lab. props: mode ('bcd' | 'ascii' | 'unicode'), value
 */
export function CodeLab({ mode: initMode = 'bcd', value }) {
  const [mode, setMode] = useState(initMode);
  const [values, setValues] = useState(() => ({ ...DEFAULTS, ...(value !== undefined && { [initMode]: String(value) }) }));
  const v = values[mode];
  const set = (s) => setValues((old) => ({ ...old, [mode]: s }));

  return (
    <div className="space-y-4">
      <div role="tablist" className="tabs-box tabs tabs-sm w-fit">
        {MODES.map(([k, label]) => (
          <button key={k} type="button" role="tab" className={clsx('tab', mode === k && 'tab-active')} onClick={() => setMode(k)}>
            {label}
          </button>
        ))}
      </div>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-base-content/60">
          {mode === 'bcd' ? 'দশমিক সংখ্যা' : mode === 'ascii' ? 'ইংরেজি লেখা (অক্ষর, অঙ্ক, চিহ্ন)' : 'যেকোনো লেখা — বাংলাও'}
        </span>
        <input
          className="input w-full font-mono text-lg"
          value={v}
          maxLength={mode === 'bcd' ? 12 : 24}
          inputMode={mode === 'bcd' ? 'numeric' : 'text'}
          onChange={(e) => set(mode === 'bcd' ? e.target.value.replace(/\D/g, '') : e.target.value)}
        />
      </label>
      {mode === 'bcd' && <Bcd value={v} />}
      {mode === 'ascii' && (
        <>
          <CharTable value={v} />
          <p className="text-xs text-base-content/60">মনে রাখো: A = 65, a = 97, 0 = 48, স্পেস = 32। বড় হাতের ও ছোট হাতের অক্ষরের কোডের পার্থক্য 32।</p>
        </>
      )}
      {mode === 'unicode' && (
        <>
          <CharTable value={v} unicode />
          <p className="text-xs text-base-content/60">বাংলা অক্ষরের কোড U+0980 থেকে U+09FF এর মধ্যে। যুক্তাক্ষর বা কার-চিহ্ন আলাদা আলাদা কোড পয়েন্ট দিয়ে তৈরি হয়।</p>
        </>
      )}
    </div>
  );
}
