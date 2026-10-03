// Executes one flowchart box using the C interpreter, so arithmetic follows C rules (int division etc.).
// A tiny C program is generated around the box's code: current variables are declared with their values,
// the code runs, and the new values are printed back and parsed.
import { runC, showValue } from './c/interpreter';

const varType = (t) => (typeof t === 'string' ? t : t.type);
const literal = (type, v) => (type === 'int' || type === 'char' ? String(Math.trunc(v)) : Number.isInteger(v) ? `${v}.0` : String(v));

function declarations(types, values) {
  return Object.entries(types)
    .map(([name, t]) => {
      const type = varType(t);
      const v = values[name];
      if (typeof t === 'object' && t.size) {
        const items = (v ?? []).map((x) => (x === undefined ? '0' : literal(type, x)));
        return `${type} ${name}[${t.size}]${items.length ? ` = {${items.join(', ')}}` : ''};`;
      }
      return v === undefined ? `${type} ${name};` : `${type} ${name} = ${literal(type, v)};`;
    })
    .join(' ');
}

/**
 * Runs `body` (C statements) and evaluates `exprs` with the given variables.
 * Returns { values, results: [number|undefined], error }.
 */
export function runBox(types, values, body = '', exprs = []) {
  const names = Object.keys(types);
  const reads = [];
  for (const name of names) {
    const t = types[name];
    if (typeof t === 'object' && t.size) for (let i = 0; i < t.size; i++) reads.push(`(double)(${name}[${i}])`);
    else reads.push(`(double)(${name})`);
  }
  const all = [...reads, ...exprs.map((e) => `(double)(${e})`)];
  const src = `#include <stdio.h>\n#include <math.h>\nint main() { ${declarations(types, values)}\n${body}\n${all
    .map((e) => `printf("%.17g\\n", ${e});`)
    .join(' ')}\nreturn 0; }`;
  // Uninitialised variables are copied too: reading them prints a garbage marker, which we turn back into undefined.
  const r = runC(src, { maxSteps: 20000 });
  if (!r.ok) return { error: r.error.message, values, results: [] };
  const nums = r.output
    .split('\n')
    .slice(0, all.length)
    .map((s) => (/^-?[\d.e+-]+$|^-?inf|nan/i.test(s) ? Number(s) : undefined));
  const out = {};
  let k = 0;
  for (const name of names) {
    const t = types[name];
    if (typeof t === 'object' && t.size) out[name] = Array.from({ length: t.size }, () => nums[k++]);
    else out[name] = nums[k++];
  }
  return { values: out, results: nums.slice(k) };
}

export const showVar = (t, v) => (Array.isArray(v) ? v.map((x) => showValue(varType(t), x)).join(', ') : showValue(varType(t), v));
