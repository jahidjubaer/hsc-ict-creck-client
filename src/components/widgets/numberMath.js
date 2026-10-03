// Exact number-system conversion with human-readable steps (BigInt rational arithmetic, no float error).

export const BASES = {
  2: { name: 'বাইনারি', digits: '01' },
  8: { name: 'অক্টাল', digits: '01234567' },
  10: { name: 'দশমিক', digits: '0123456789' },
  16: { name: 'হেক্সাডেসিমেল', digits: '0123456789ABCDEF' },
};

const SUB = { 2: '₂', 8: '₈', 10: '₁₀', 16: '₁₆' };
export const withBase = (s, base) => `(${s})${SUB[base]}`;

const digitVal = (ch) => parseInt(ch, 16);
const digitChar = (v) => '0123456789ABCDEF'[v];

/** Returns an error message (Bangla) or null. */
export function validate(input, base) {
  const s = input.trim().toUpperCase();
  if (!s) return 'একটি সংখ্যা লেখো';
  if (!/^[0-9A-F]*\.?[0-9A-F]*$/.test(s) || s === '.') return 'সংখ্যাটি সঠিক নয়';
  const bad = [...s.replace('.', '')].find((c) => !BASES[base].digits.includes(c));
  if (bad) return `${BASES[base].name} পদ্ধতিতে '${bad}' অঙ্কটি নেই (অঙ্ক: ${BASES[base].digits.split('').join(', ')})`;
  if (s.replace('.', '').length > 24) return 'সংখ্যাটি খুব বড়';
  return null;
}

function split(input) {
  const [i = '', f = ''] = input.trim().toUpperCase().split('.');
  return { int: i.replace(/^0+(?=.)/, '') || '0', frac: f.replace(/0+$/, '') };
}

/** value of an integer digit string in `base` as BigInt */
function intValue(str, base) {
  return [...str].reduce((acc, ch) => acc * BigInt(base) + BigInt(digitVal(ch)), 0n);
}

/** Rational {n, d} for a fraction digit string. */
function fracValue(str, base) {
  const d = BigInt(base) ** BigInt(str.length);
  return { n: str ? intValue(str, base) : 0n, d };
}

function rationalToDecimal({ n, d }, maxDigits = 8) {
  let out = '';
  let r = n;
  for (let i = 0; i < maxDigits && r !== 0n; i++) {
    r *= 10n;
    out += String(r / d);
    r %= d;
  }
  return { digits: out, exact: r === 0n };
}

function pow(base, exp) {
  return exp >= 0 ? String(base ** exp) : `1/${base ** -exp}`;
}

/** Any base -> decimal, by positional expansion. */
function toDecimal(input, base) {
  const { int, frac } = split(input);
  const terms = [];
  const values = [];
  [...int].forEach((ch, i) => {
    const p = int.length - 1 - i;
    terms.push(`${ch}×${base}^${p}`);
    values.push(String(digitVal(ch) * base ** p));
  });
  [...frac].forEach((ch, i) => {
    const p = -(i + 1);
    terms.push(`${ch}×${base}^${p}`);
    values.push(`${digitVal(ch)}×${pow(base, p)}`);
  });

  const intPart = intValue(int, base);
  const f = rationalToDecimal(fracValue(frac, base));
  const result = f.digits ? `${intPart}.${f.digits}` : String(intPart);

  return {
    result,
    approx: !f.exact,
    steps: [
      `প্রতিটি অঙ্ককে তার স্থানীয় মান (${base}-এর ঘাত) দিয়ে গুণ করি:`,
      `${withBase(input.toUpperCase(), base)} = ${terms.join(' + ')}`,
      base !== 10 ? `= ${values.join(' + ')}` : null,
      `= ${withBase(result, 10)}`,
    ].filter(Boolean),
  };
}

/** Decimal -> base, by repeated division (integer) and multiplication (fraction). */
function fromDecimal(input, base, maxFrac = 6) {
  const { int, frac } = split(input);
  const steps = [];
  const divRows = [];
  let q = BigInt(int);
  if (q === 0n) divRows.push({ dividend: '0', quotient: '0', remainder: '0' });
  while (q > 0n) {
    const r = q % BigInt(base);
    divRows.push({ dividend: String(q), quotient: String(q / BigInt(base)), remainder: digitChar(Number(r)) });
    q /= BigInt(base);
  }
  const intDigits = divRows.map((r) => r.remainder).reverse().join('').replace(/^0+(?=.)/, '');

  const mulRows = [];
  let { n, d } = fracValue(frac, 10);
  const decPart = (num) => rationalToDecimal({ n: num, d }, 10).digits || '0';
  for (let i = 0; i < maxFrac && n !== 0n; i++) {
    const before = n;
    const prod = n * BigInt(base);
    const digit = prod / d;
    n = prod % d;
    mulRows.push({ fraction: `0.${decPart(before)}`, product: `${digit}.${decPart(n)}`, digit: digitChar(Number(digit)) });
  }
  const fracDigits = mulRows.map((r) => r.digit).join('');
  const result = fracDigits ? `${intDigits}.${fracDigits}` : intDigits;

  steps.push(`পূর্ণ অংশ ${int}-কে বারবার ${base} দিয়ে ভাগ করি এবং ভাগশেষগুলো নিচ থেকে উপরে পড়ি।`);
  if (frac) steps.push(`ভগ্নাংশ অংশ 0.${frac}-কে বারবার ${base} দিয়ে গুণ করি এবং পূর্ণ অংশগুলো উপর থেকে নিচে পড়ি।`);

  return {
    result,
    approx: frac && n !== 0n,
    steps,
    divRows,
    mulRows,
  };
}

const GROUP = { 8: 3, 16: 4 };

/** Binary <-> octal/hex by grouping bits. */
function groupConvert(input, from, to) {
  const { int, frac } = split(input);
  if (from === 2) {
    const size = GROUP[to];
    const padInt = int.padStart(Math.ceil(int.length / size) * size, '0');
    const padFrac = frac.padEnd(Math.ceil(frac.length / size) * size, '0');
    const g = (s) => s.match(new RegExp(`.{${size}}`, 'g')) || [];
    const groups = [...g(padInt).map((b) => ({ bits: b, digit: digitChar(parseInt(b, 2)) }))];
    const fGroups = g(padFrac).map((b) => ({ bits: b, digit: digitChar(parseInt(b, 2)) }));
    const intRes = groups.map((x) => x.digit).join('').replace(/^0+(?=.)/, '');
    const result = fGroups.length ? `${intRes}.${fGroups.map((x) => x.digit).join('')}` : intRes;
    return {
      result,
      groups,
      fGroups,
      steps: [
        `পূর্ণ অংশে ডান দিক থেকে এবং ভগ্নাংশে বাম দিক থেকে ${size}টি করে বিটের গ্রুপ করি (প্রয়োজনে 0 যোগ করি)।`,
        `প্রতিটি গ্রুপের সমতুল্য ${BASES[to].name} অঙ্ক লিখি।`,
      ],
    };
  }
  const size = GROUP[from];
  const groups = [...int].map((ch) => ({ digit: ch, bits: digitVal(ch).toString(2).padStart(size, '0') }));
  const fGroups = [...frac].map((ch) => ({ digit: ch, bits: digitVal(ch).toString(2).padStart(size, '0') }));
  const intRes = groups.map((x) => x.bits).join('').replace(/^0+(?=.)/, '');
  const fracRes = fGroups.map((x) => x.bits).join('').replace(/0+$/, '');
  return {
    result: fracRes ? `${intRes}.${fracRes}` : intRes,
    groups,
    fGroups,
    steps: [`প্রতিটি ${BASES[from].name} অঙ্ককে ${size} বিটের বাইনারিতে লিখি, তারপর পাশাপাশি বসাই (শুরুর ও শেষের অপ্রয়োজনীয় 0 বাদ)।`],
  };
}

/**
 * Main entry. Returns { method, result, approx, steps, divRows?, mulRows?, groups?, fGroups?, via? }
 */
export function convert(input, from, to) {
  if (from === to) return { method: 'same', result: split(input).int + (split(input).frac ? `.${split(input).frac}` : ''), steps: [] };
  if (to === 10) return { method: 'toDecimal', ...toDecimal(input, from) };
  if (from === 10) return { method: 'fromDecimal', ...fromDecimal(input, to) };
  if (from === 2 || to === 2) return { method: 'group', ...groupConvert(input, from, to) };
  // octal <-> hex via binary
  const a = groupConvert(input, from, 2);
  const b = groupConvert(a.result, 2, to);
  return { method: 'viaBinary', result: b.result, first: a, second: b, steps: [] };
}
