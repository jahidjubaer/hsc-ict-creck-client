// Tree-walking interpreter for the HSC C subset. runC(src, { input }) executes the whole program and records
// a snapshot after every statement / condition check, so the UI can step forwards and backwards freely.
//
// Supported: int/char/float/double (+ long/short/unsigned as int), 1-D/2-D arrays, strings (char arrays),
// all arithmetic/relational/logical/bitwise/assignment operators, ++/--, ?:, casts, sizeof, if/else,
// switch, while, do-while, for, break, continue, functions (recursion, array parameters), printf/scanf,
// getchar/putchar/gets/puts, string.h, math.h, ctype.h basics. Not supported: pointers, structs.
// Uninitialised variables hold "garbage" (undefined) and spread through arithmetic, as in real C.
import { CError } from './lexer';
import { parse } from './parser';

const SIZE = { char: 1, int: 4, float: 4, double: 8 };
const HEADERS = {
  'stdio.h': ['printf', 'scanf', 'getchar', 'putchar', 'gets', 'puts'],
  'string.h': ['strlen', 'strcpy', 'strcat', 'strcmp', 'strrev', 'strupr', 'strlwr'],
  'math.h': ['sqrt', 'pow', 'fabs', 'floor', 'ceil', 'abs'],
  'stdlib.h': ['abs'],
  'ctype.h': ['toupper', 'tolower', 'isdigit', 'isalpha', 'isupper', 'islower', 'isspace'],
  'conio.h': ['getch', 'clrscr'],
};
const KNOWN_HEADERS = new Set([...Object.keys(HEADERS), 'stdbool.h', 'limits.h']);
const BUILTIN_HEADER = {};
for (const [h, fns] of Object.entries(HEADERS)) for (const f of fns) BUILTIN_HEADER[f] ??= h;

const isFloatType = (t) => t === 'float' || t === 'double';
const toInt32 = (v) => {
  const n = Math.trunc(v);
  return Number.isFinite(n) ? n | 0 : 0;
};

export function conv(type, v) {
  if (v === undefined) return undefined;
  switch (type) {
    case 'char':
      return (toInt32(v) << 24) >> 24;
    case 'int':
      return toInt32(v);
    case 'float':
      return Math.fround(v);
    default:
      return v;
  }
}

/** Display a scalar the way students expect to read it. */
export function showValue(type, v) {
  if (v === undefined) return '?';
  if (type === 'char') return v >= 32 && v < 127 ? `'${String.fromCharCode(v)}'` : v === 0 ? "'\\0'" : v === 10 ? "'\\n'" : String(v);
  if (isFloatType(type)) {
    if (!Number.isFinite(v)) return String(v);
    const s = type === 'float' ? Number(v.toPrecision(7)).toString() : Number(v.toPrecision(12)).toString();
    return s.includes('.') || s.includes('e') ? s : `${s}.0`;
  }
  return String(v);
}

function cExp(v, prec, upper) {
  let s = v.toExponential(prec);
  s = s.replace(/e([+-])(\d)$/, 'e$10$2');
  return upper ? s.toUpperCase() : s;
}

function cG(v, prec, upper) {
  const P = prec === 0 ? 1 : prec;
  if (v === 0) return '0';
  const X = Math.floor(Math.log10(Math.abs(v)));
  let s;
  if (P > X && X >= -4) s = v.toFixed(Math.max(0, P - 1 - X));
  else s = cExp(v, P - 1, upper);
  // strip trailing zeros
  s = s.replace(/(\.\d*?)0+($|e)/, '$1$2').replace(/\.($|e)/, '$1');
  return s;
}

/**
 * Compile + run. Returns { ok, error: { kind, line, message } | null, steps, output, warnings }.
 * Each step: { line, note, out (output length so far), frames: [{ fn, vars: [{ name, type, value } | { name, type, array }]}] }.
 */
export function runC(src, { input = '', maxSteps = 4000, maxOutput = 20000 } = {}) {
  const steps = [];
  const warnings = [];
  let output = '';
  const warn = (line, message) => {
    if (warnings.length < 30 && !warnings.some((w) => w.line === line && w.message === message)) warnings.push({ line, message });
  };

  let program;
  try {
    program = parse(src);
    check(program, warn);
  } catch (e) {
    if (e instanceof CError) return { ok: false, error: { kind: 'compile', line: e.line, message: e.message }, steps, output, warnings };
    throw e;
  }

  const text = (e) => src.slice(e.pos, e.end).replace(/\s+/g, ' ').trim();
  const rt = (line, msg) => new CError('runtime', line, msg);

  // ---------- memory ----------
  const globals = new Map();
  const frames = []; // { fn, scopes: [Map] }

  const lookup = (name, line) => {
    const f = frames[frames.length - 1];
    if (f) for (let i = f.scopes.length - 1; i >= 0; i--) if (f.scopes[i].has(name)) return f.scopes[i].get(name);
    if (globals.has(name)) return globals.get(name);
    throw rt(line, `'${name}' ঘোষণা করা হয়নি`);
  };

  function makeArray(type, dims, line) {
    const [n, ...rest] = dims;
    if (!Number.isInteger(n) || n <= 0) throw rt(line, `অ্যারের আকার ধনাত্মক পূর্ণসংখ্যা হতে হবে (পাওয়া গেছে ${n})`);
    if (n > 10000) throw rt(line, 'অ্যারে অনেক বড় — এই ল্যাবে সর্বোচ্চ 10000 ঘর');
    return {
      array: true,
      elem: type,
      size: n,
      cells: Array.from({ length: n }, () => (rest.length ? makeArray(type, rest, line) : { type, v: undefined })),
    };
  }

  const zeroFill = (arr) => {
    for (const c of arr.cells) {
      if (c.array) zeroFill(c);
      else c.v = 0;
    }
  };

  function fillArray(arr, init, line, isGlobal) {
    if (isGlobal || init) zeroFill(arr);
    if (!init) return;
    if (init.k === 'str') {
      if (arr.elem !== 'char') throw rt(line, 'স্ট্রিং দিয়ে শুধু char অ্যারে শুরু করা যায়');
      const s = init.v;
      if (s.length > arr.size) throw rt(line, `"${s}" রাখতে ${s.length + 1}টি ঘর লাগে, কিন্তু অ্যারের আকার ${arr.size}`);
      for (let i = 0; i < s.length; i++) arr.cells[i].v = s.charCodeAt(i);
      if (s.length === arr.size) warn(line, "স্ট্রিংয়ের শেষে নাল ক্যারেক্টার ('\\0') রাখার জায়গা নেই");
      return;
    }
    if (init.k !== 'list') throw rt(line, 'অ্যারের প্রাথমিক মান { } এর ভেতরে দিতে হয়');
    // a flat list may fill a 2-D array row by row
    const leaves = (a) => a.cells.flatMap((c) => (c.array ? leaves(c) : [c]));
    if (init.items.every((it) => it.k !== 'list') && arr.cells[0]?.array) {
      const all = leaves(arr);
      if (init.items.length > all.length) throw rt(line, 'প্রাথমিক মান অ্যারের আকারের চেয়ে বেশি');
      init.items.forEach((it, i) => (all[i].v = conv(arr.elem, evalScalar(it, 'অ্যারের মান'))));
      return;
    }
    if (init.items.length > arr.size) throw rt(line, `প্রাথমিক মান ${init.items.length}টি, কিন্তু অ্যারের আকার ${arr.size}`);
    init.items.forEach((it, i) => {
      const cell = arr.cells[i];
      if (cell.array) fillArray(cell, it, line, false);
      else cell.v = conv(arr.elem, evalScalar(it, 'অ্যারের মান'));
    });
  }

  function declare(stmt, scope) {
    for (const item of stmt.items) {
      if (scope.has(item.name)) throw rt(item.line, `'${item.name}' একই ব্লকে আগেই ঘোষণা করা হয়েছে`);
      if (item.dims.length) {
        const dims = item.dims.map((d, i) => {
          if (d) return toInt32(evalScalar(d, 'অ্যারের আকার'));
          if (i === 0 && item.init?.k === 'str') return item.init.v.length + 1;
          if (i === 0 && item.init?.k === 'list') return item.init.items.length;
          throw rt(item.line, `${item.name}[]-এর আকার দিতে হবে`);
        });
        const arr = makeArray(stmt.type, dims, item.line);
        arr.name = item.name;
        fillArray(arr, item.init, item.line, stmt.global);
        scope.set(item.name, arr);
      } else {
        const cell = { type: stmt.type, v: stmt.global ? 0 : undefined, name: item.name };
        if (item.init) {
          if (item.init.k === 'list') throw rt(item.line, `${item.name} অ্যারে নয়, তাই { } দিয়ে মান দেওয়া যায় না`);
          const val = evaluate(item.init);
          if (val.t === 'array' || val.t === 'str') throw rt(item.line, `${item.name}-এ অ্যারে/স্ট্রিং রাখা যায় না`);
          cell.v = conv(stmt.type, val.v);
        }
        scope.set(item.name, cell);
      }
    }
  }

  // ---------- snapshots ----------
  const showArray = (a) => ({
    size: a.size,
    cells: a.cells.map((c) => (c.array ? showArray(c) : showValue(a.elem, c.v))),
    str: a.elem === 'char' && !a.cells[0]?.array ? readString(a, 0, true) : undefined,
  });
  const showScope = (map) =>
    [...map.entries()].map(([name, c]) => (c.array ? { name, type: c.elem, array: showArray(c) } : { name, type: c.type, value: showValue(c.type, c.v) }));

  function snap(line, note) {
    if (steps.length >= maxSteps) throw rt(line, `${maxSteps}টির বেশি ধাপ চলেছে — সম্ভবত অসীম লুপ (শর্ত কখনো মিথ্যা হচ্ছে না)`);
    const list = frames.map((f) => ({ fn: f.fn, vars: f.scopes.flatMap(showScope) }));
    if (globals.size) list.unshift({ fn: 'গ্লোবাল', vars: showScope(globals) });
    steps.push({ line, note, out: output.length, frames: list });
  }

  // ---------- strings & io ----------
  function readString(arr, from = 0, quiet = false, line = 0) {
    let s = '';
    for (let i = from; i < arr.size; i++) {
      const v = arr.cells[i].v;
      if (v === 0) return s;
      if (v === undefined) {
        if (!quiet) warn(line, `${arr.name ?? 'স্ট্রিং'}-এর শেষে '\\0' নেই — এর পরে গার্বেজ মান ছাপা হতে পারে`);
        return quiet ? `${s}…` : s;
      }
      s += String.fromCharCode(v & 0xff);
    }
    if (!quiet) warn(line, `${arr.name ?? 'স্ট্রিং'}-এর শেষে '\\0' নেই — অ্যারের সীমা পেরিয়ে পড়া হচ্ছে`);
    return s;
  }
  const writeString = (arr, s, line) => {
    if (s.length + 1 > arr.size) throw rt(line, `"${s}" রাখতে ${s.length + 1}টি ঘর লাগে, কিন্তু ${arr.name ?? 'অ্যারে'}-এর আকার ${arr.size}`);
    for (let i = 0; i < s.length; i++) arr.cells[i].v = s.charCodeAt(i);
    arr.cells[s.length].v = 0;
  };
  const stringArg = (val, line, fn) => {
    if (val.t === 'str') return val.s;
    if (val.t === 'array' && val.ref.elem === 'char') return readString(val.ref, 0, false, line);
    throw rt(line, `${fn}()-এ একটি স্ট্রিং দিতে হবে`);
  };
  const charArrayArg = (val, line, fn) => {
    if (val.t === 'array' && val.ref.elem === 'char' && !val.ref.cells[0]?.array) return val.ref;
    if (val.t === 'addr' && val.cell.array) return val.cell;
    throw rt(line, `${fn}()-এ একটি char অ্যারে দিতে হবে`);
  };

  const emit = (s, line) => {
    output += s;
    if (output.length > maxOutput) throw rt(line, 'আউটপুট অনেক বড় হয়ে গেছে — সম্ভবত অসীম লুপ');
  };

  const stdin = { s: input, i: 0 };
  const skipWs = () => {
    while (stdin.i < stdin.s.length && /\s/.test(stdin.s[stdin.i])) stdin.i++;
  };
  const needInput = (line) => {
    if (stdin.i >= stdin.s.length) throw rt(line, 'ইনপুট শেষ — প্রোগ্রাম আরও ইনপুট চাইছে, "ইনপুট" বক্সে মান দাও');
  };

  function doScanf(args, line) {
    if (!args.length || args[0].t !== 'str') throw rt(line, 'scanf()-এর প্রথম আর্গুমেন্ট হবে ফরম্যাট স্ট্রিং, যেমন "%d"');
    const fmt = args[0].s;
    let ai = 1;
    let count = 0;
    for (let f = 0; f < fmt.length; f++) {
      const ch = fmt[f];
      if (/\s/.test(ch)) {
        skipWs();
        continue;
      }
      if (ch !== '%') {
        skipWs();
        if (stdin.s[stdin.i] === ch) stdin.i++;
        else return count;
        continue;
      }
      const m = fmt.slice(f).match(/^%(\*?)(\d*)(hh|h|ll|l|L)?([dicsfeEgGuxo%])/);
      if (!m) throw rt(line, `scanf-এ অজানা ফরম্যাট: ${fmt.slice(f, f + 3)}`);
      f += m[0].length - 1;
      const conversion = m[4];
      if (conversion === '%') continue;
      const target = args[ai++];
      if (!target) throw rt(line, `scanf-এর ফরম্যাটে ${conversion} আছে কিন্তু তার জন্য কোনো ভেরিয়েবল দেওয়া হয়নি`);
      if (conversion === 's') {
        const arr = charArrayArg(target, line, 'scanf %s');
        skipWs();
        needInput(line);
        let w = '';
        while (stdin.i < stdin.s.length && !/\s/.test(stdin.s[stdin.i])) w += stdin.s[stdin.i++];
        writeString(arr, w, line);
        count++;
        continue;
      }
      if (target.t !== 'addr' || target.cell.array) {
        throw rt(line, `scanf-এ ভেরিয়েবলের আগে & দিতে হবে (যেমন &${target.name ?? 'x'}) — নইলে মান কোথায় রাখবে তা জানে না`);
      }
      const cell = target.cell;
      if (conversion === 'c') {
        needInput(line);
        cell.v = conv(cell.type, stdin.s.charCodeAt(stdin.i++));
        count++;
        continue;
      }
      skipWs();
      needInput(line);
      const rest = stdin.s.slice(stdin.i);
      const isF = 'feEgG'.includes(conversion);
      const mm = isF ? rest.match(/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/) : rest.match(/^[+-]?\d+/);
      if (!mm) return count; // matching failure: variable unchanged
      stdin.i += mm[0].length;
      const num = isF ? parseFloat(mm[0]) : parseInt(mm[0], 10);
      if (isF && !isFloatType(cell.type)) warn(line, `%${conversion} দিয়ে ${cell.type} ভেরিয়েবলে ইনপুট নেওয়া ভুল — float-এর জন্য %f, double-এর জন্য %lf`);
      if (!isF && isFloatType(cell.type)) warn(line, `%${conversion} দিয়ে ${cell.type} ভেরিয়েবলে ইনপুট নেওয়া ভুল — float-এর জন্য %f, double-এর জন্য %lf`);
      if (m[3] !== 'l' && cell.type === 'double' && isF) warn(line, 'double ভেরিয়েবলে ইনপুট নিতে %lf ব্যবহার করতে হয়');
      cell.v = conv(cell.type, num);
      count++;
    }
    return count;
  }

  function doPrintf(args, line) {
    if (!args.length) throw rt(line, 'printf()-এ অন্তত একটি স্ট্রিং দিতে হবে');
    const fmt = args[0].t === 'str' ? args[0].s : args[0].t === 'array' ? readString(args[0].ref, 0, false, line) : null;
    if (fmt == null) throw rt(line, 'printf()-এর প্রথম আর্গুমেন্ট হবে স্ট্রিং, যেমন printf("%d", x)');
    let ai = 1;
    let out = '';
    const re = /%([-+ 0#]*)(\d+)?(?:\.(\d+))?(hh|h|ll|l|L)?([diucsfFeEgGxXo%])|%/g;
    let last = 0;
    let m;
    while ((m = re.exec(fmt))) {
      out += fmt.slice(last, m.index);
      last = re.lastIndex;
      if (!m[5]) {
        warn(line, `printf-এ অসম্পূর্ণ ফরম্যাট '%' — '%%' লিখলে % ছাপা হয়`);
        continue;
      }
      const [, flags, width, precStr, , c] = m;
      if (c === '%') {
        out += '%';
        continue;
      }
      const arg = args[ai++];
      let s;
      if (!arg) {
        warn(line, `ফরম্যাটে %${c} আছে কিন্তু তার জন্য কোনো মান দেওয়া হয়নি — গার্বেজ ছাপা হবে`);
        s = '?';
      } else if (c === 's') {
        s = arg.t === 'str' ? arg.s : arg.t === 'array' && arg.ref.elem === 'char' ? readString(arg.ref, 0, false, line) : null;
        if (s == null) {
          warn(line, '%s দিয়ে শুধু স্ট্রিং (char অ্যারে) ছাপানো যায়');
          s = '?';
        }
        if (precStr) s = s.slice(0, Number(precStr));
      } else if (arg.t === 'array' || arg.t === 'str' || arg.t === 'addr') {
        warn(line, `%${c} দিয়ে অ্যারে/স্ট্রিং ছাপানো যায় না`);
        s = '?';
      } else if (arg.v === undefined) {
        warn(line, 'মান দেওয়া হয়নি এমন ভেরিয়েবল ছাপা হচ্ছে — আউটপুট গার্বেজ (অনিশ্চিত)');
        s = '<গার্বেজ>';
      } else if ('di'.includes(c)) {
        if (isFloatType(arg.t)) {
          warn(line, `%${c} দিয়ে float/double ছাপালে ভুল (অনিশ্চিত) মান আসে — %f ব্যবহার করো`);
          s = '?';
        } else s = String(toInt32(arg.v));
      } else if (c === 'u') s = String(toInt32(arg.v) >>> 0);
      else if (c === 'c') s = String.fromCharCode(toInt32(arg.v) & 0xff);
      else if ('xXo'.includes(c)) {
        s = (toInt32(arg.v) >>> 0).toString(c === 'o' ? 8 : 16);
        if (c === 'X') s = s.toUpperCase();
      } else {
        if (!isFloatType(arg.t)) {
          warn(line, `%${c} দিয়ে পূর্ণসংখ্যা ছাপালে ভুল (অনিশ্চিত) মান আসে — (float) কাস্ট করো বা %d ব্যবহার করো`);
          s = '?';
        } else {
          const prec = precStr === undefined ? 6 : Number(precStr);
          if ('fF'.includes(c)) s = arg.v.toFixed(prec);
          else if ('eE'.includes(c)) s = cExp(arg.v, prec, c === 'E');
          else s = cG(arg.v, prec, c === 'G');
          if (flags.includes('+') && arg.v >= 0) s = `+${s}`;
        }
      }
      if (flags.includes('+') && 'di'.includes(c) && s !== '?' && !s.startsWith('-')) s = `+${s}`;
      const w = Number(width || 0);
      if (s.length < w) {
        if (flags.includes('-')) s = s.padEnd(w);
        else if (flags.includes('0') && !'sc'.includes(c) && s !== '?') s = s.startsWith('-') ? `-${s.slice(1).padStart(w - 1, '0')}` : s.padStart(w, '0');
        else s = s.padStart(w);
      }
      out += s;
    }
    out += fmt.slice(last);
    if (ai < args.length) warn(line, 'printf-এ ফরম্যাটের চেয়ে বেশি মান দেওয়া হয়েছে — বাড়তি মানগুলো ছাপা হয়নি');
    emit(out, line);
    return out.length;
  }

  // ---------- expressions ----------
  const scalar = (t, v) => ({ t, v });
  const resultType = (a, b) => (a === 'double' || b === 'double' ? 'double' : a === 'float' || b === 'float' ? 'float' : 'int');

  function evalScalar(e, what) {
    const v = evaluate(e);
    if (v.t === 'array' || v.t === 'str' || v.t === 'addr') throw rt(e.line, `${what}: এখানে একটি সংখ্যা প্রয়োজন`);
    return v.v;
  }

  function cellOf(e) {
    if (e.k === 'var') return lookup(e.name, e.line);
    if (e.k === 'idx') {
      const base = cellOf(e.a);
      if (!base.array) throw rt(e.line, `${text(e.a)} অ্যারে নয়, তাই [ ] ব্যবহার করা যায় না`);
      const i = evalScalar(e.i, 'অ্যারের ইনডেক্স');
      if (i === undefined) throw rt(e.line, `ইনডেক্স ${text(e.i)}-এর মান দেওয়া হয়নি (গার্বেজ)`);
      const n = toInt32(i);
      if (n < 0 || n >= base.size) {
        throw rt(e.line, `${text(e)}: ইনডেক্স ${n} অ্যারের সীমার বাইরে — আকার ${base.size} হলে ইনডেক্স 0 থেকে ${base.size - 1}`);
      }
      return base.cells[n];
    }
    throw rt(e.line, 'এখানে একটি ভেরিয়েবল প্রয়োজন');
  }

  function scalarCell(e) {
    const c = cellOf(e);
    if (c.array) throw rt(e.line, `${text(e)} একটি অ্যারে — পুরো অ্যারেতে একসাথে মান বসানো যায় না, ঘর ধরে ধরে বসাও`);
    return c;
  }

  function arith(op, a, b, line) {
    const t = resultType(a.t, b.t);
    if (a.v === undefined || b.v === undefined) return scalar(t === 'float' ? 'float' : t, undefined);
    const x = a.v;
    const y = b.v;
    if (isFloatType(t)) {
      switch (op) {
        case '+':
          return scalar(t, x + y);
        case '-':
          return scalar(t, x - y);
        case '*':
          return scalar(t, x * y);
        case '/':
          if (y === 0) warn(line, 'শূন্য দিয়ে ভাগ — ফল inf বা nan');
          return scalar(t, x / y);
        case '%':
          throw rt(line, '% (ভাগশেষ) অপারেটর শুধু পূর্ণসংখ্যায় চলে, float/double-এ নয়');
        default:
      }
    }
    switch (op) {
      case '+':
        return scalar('int', (x + y) | 0);
      case '-':
        return scalar('int', (x - y) | 0);
      case '*':
        return scalar('int', Math.imul(x, y));
      case '/':
        if (y === 0) throw rt(line, 'পূর্ণসংখ্যাকে শূন্য দিয়ে ভাগ করা যায় না (প্রোগ্রাম ক্র্যাশ করবে)');
        return scalar('int', Math.trunc(x / y) | 0);
      case '%':
        if (y === 0) throw rt(line, 'শূন্য দিয়ে ভাগশেষ বের করা যায় না (প্রোগ্রাম ক্র্যাশ করবে)');
        return scalar('int', x % y | 0);
      case '<<':
        return scalar('int', x << y);
      case '>>':
        return scalar('int', x >> y);
      case '&':
        return scalar('int', x & y);
      case '|':
        return scalar('int', x | y);
      case '^':
        return scalar('int', x ^ y);
      default:
        throw rt(line, `অজানা অপারেটর ${op}`);
    }
  }

  function compare(op, a, b) {
    if (a.v === undefined || b.v === undefined) return scalar('int', undefined);
    const r = { '<': a.v < b.v, '<=': a.v <= b.v, '>': a.v > b.v, '>=': a.v >= b.v, '==': a.v === b.v, '!=': a.v !== b.v }[op];
    return scalar('int', r ? 1 : 0);
  }

  function truth(e, what = 'শর্ত') {
    const v = evaluate(e);
    if (v.t === 'str' || v.t === 'array') return true;
    if (v.v === undefined) throw rt(e.line, `${what} ${text(e)}-এ মান দেওয়া হয়নি এমন ভেরিয়েবল (গার্বেজ) আছে — ফল অনিশ্চিত`);
    return v.v !== 0;
  }

  function assignTo(e, op, rhs, line) {
    const cell = scalarCell(e);
    let val = rhs;
    if (val.t === 'array' || val.t === 'str') {
      throw rt(line, val.t === 'str' ? 'স্ট্রিং = দিয়ে বসানো যায় না — strcpy() ব্যবহার করো' : 'অ্যারে = দিয়ে বসানো যায় না');
    }
    if (op !== '=') val = arith(op.slice(0, -1), scalar(cell.type, cell.v), val, line);
    cell.v = conv(cell.type, val.v);
    return scalar(cell.type, cell.v);
  }

  function evaluate(e) {
    switch (e.k) {
      case 'num':
        return scalar(e.float ? 'double' : 'int', e.v);
      case 'chr':
        return scalar('int', e.v);
      case 'str':
        return { t: 'str', s: e.v };
      case 'var': {
        const c = lookup(e.name, e.line);
        if (c.array) return { t: 'array', ref: c };
        if (c.v === undefined) warn(e.line, `${e.name}-এ কোনো মান দেওয়া হয়নি — এর মান গার্বেজ (অনিশ্চিত)`);
        return scalar(c.type, c.v);
      }
      case 'idx': {
        const c = cellOf(e);
        if (c.array) return { t: 'array', ref: c };
        if (c.v === undefined) warn(e.line, `${text(e)}-এ কোনো মান দেওয়া হয়নি — এর মান গার্বেজ (অনিশ্চিত)`);
        return scalar(c.type, c.v);
      }
      case 'addr':
        return { t: 'addr', cell: cellOf(e.e), name: text(e.e) };
      case 'un': {
        const v = evaluate(e.e);
        if (v.t === 'array' || v.t === 'str') throw rt(e.line, `${e.op} অপারেটর অ্যারে/স্ট্রিং-এ চলে না`);
        const t = isFloatType(v.t) ? v.t : 'int';
        if (v.v === undefined) return scalar(t, undefined);
        if (e.op === '-') return scalar(t, isFloatType(t) ? -v.v : -v.v | 0);
        if (e.op === '+') return scalar(t, v.v);
        if (e.op === '!') return scalar('int', v.v === 0 ? 1 : 0);
        return scalar('int', ~v.v);
      }
      case 'pre':
      case 'post': {
        const cell = scalarCell(e.e);
        if (cell.v === undefined) {
          warn(e.line, `${text(e.e)}-এর মান আগে দেওয়া হয়নি — ${e.op} করার পরও গার্বেজ থাকবে`);
          return scalar(cell.type, undefined);
        }
        const old = cell.v;
        cell.v = conv(cell.type, old + (e.op === '++' ? 1 : -1));
        return scalar(cell.type, e.k === 'pre' ? cell.v : old);
      }
      case 'bin': {
        if (e.op === '&&') {
          if (!truth(e.l, 'শর্তের অংশ')) return scalar('int', 0);
          return scalar('int', truth(e.r, 'শর্তের অংশ') ? 1 : 0);
        }
        if (e.op === '||') {
          if (truth(e.l, 'শর্তের অংশ')) return scalar('int', 1);
          return scalar('int', truth(e.r, 'শর্তের অংশ') ? 1 : 0);
        }
        const a = evaluate(e.l);
        const b = evaluate(e.r);
        for (const [x, side] of [[a, e.l], [b, e.r]]) {
          if (x.t === 'str' || x.t === 'array') {
            throw rt(e.line, `${text(side)}: স্ট্রিং/অ্যারে ${e.op} দিয়ে তুলনা বা হিসাব করা যায় না${e.op === '==' ? ' — স্ট্রিং তুলনায় strcmp() ব্যবহার করো' : ''}`);
          }
        }
        if (['<', '<=', '>', '>=', '==', '!='].includes(e.op)) return compare(e.op, a, b);
        if (['<<', '>>', '&', '|', '^'].includes(e.op) && (isFloatType(a.t) || isFloatType(b.t))) {
          throw rt(e.line, `${e.op} অপারেটর শুধু পূর্ণসংখ্যায় চলে`);
        }
        return arith(e.op, a, b, e.line);
      }
      case 'assign':
        return assignTo(e.l, e.op, evaluate(e.r), e.line);
      case 'cond':
        return truth(e.c) ? evaluate(e.a) : evaluate(e.b);
      case 'comma':
        evaluate(e.l);
        return evaluate(e.r);
      case 'cast': {
        const v = evaluate(e.e);
        if (v.t === 'array' || v.t === 'str') throw rt(e.line, 'অ্যারে/স্ট্রিং কাস্ট করা যায় না');
        return scalar(e.type === 'char' ? 'char' : e.type, conv(e.type, v.v));
      }
      case 'sizeofType':
        return scalar('int', SIZE[e.type] ?? 1);
      case 'sizeofExpr': {
        if (e.e.k === 'var' || e.e.k === 'idx') {
          const c = cellOf(e.e);
          const bytes = (x) => (x.array ? x.size * bytes(x.cells[0]) : SIZE[x.type]);
          return scalar('int', bytes(c));
        }
        const v = evaluate(e.e);
        return scalar('int', v.t === 'str' ? v.s.length + 1 : SIZE[v.t] ?? 4);
      }
      case 'call':
        return call(e);
      default:
        throw rt(e.line, 'অজানা এক্সপ্রেশন');
    }
  }

  // ---------- functions ----------
  const math1 = (f) => (args, line, name) => {
    if (args.length !== 1) throw rt(line, `${name}()-এ একটি মান দিতে হয়`);
    const v = args[0].v;
    return scalar('double', v === undefined ? undefined : f(v));
  };
  const ctype = (f) => (args, line, name) => {
    if (args.length !== 1) throw rt(line, `${name}()-এ একটি অক্ষর দিতে হয়`);
    return scalar('int', args[0].v === undefined ? undefined : f(args[0].v));
  };
  const BUILTINS = {
    printf: (args, line) => scalar('int', doPrintf(args, line)),
    scanf: (args, line) => scalar('int', doScanf(args, line)),
    getchar: () => {
      if (stdin.i >= stdin.s.length) return scalar('int', -1);
      return scalar('int', stdin.s.charCodeAt(stdin.i++));
    },
    getch: () => scalar('int', 13),
    clrscr: () => scalar('int', 0),
    putchar: (args, line) => {
      emit(String.fromCharCode(toInt32(args[0]?.v ?? 63) & 0xff), line);
      return args[0] ?? scalar('int', 0);
    },
    puts: (args, line) => {
      emit(`${stringArg(args[0] ?? {}, line, 'puts')}\n`, line);
      return scalar('int', 1);
    },
    gets: (args, line) => {
      const arr = charArrayArg(args[0] ?? {}, line, 'gets');
      needInput(line);
      let end = stdin.s.indexOf('\n', stdin.i);
      if (end === -1) end = stdin.s.length;
      writeString(arr, stdin.s.slice(stdin.i, end).replace(/\r$/, ''), line);
      stdin.i = end + 1;
      return { t: 'array', ref: arr };
    },
    strlen: (args, line) => scalar('int', stringArg(args[0] ?? {}, line, 'strlen').length),
    strcpy: (args, line) => {
      const dest = charArrayArg(args[0] ?? {}, line, 'strcpy');
      writeString(dest, stringArg(args[1] ?? {}, line, 'strcpy'), line);
      return { t: 'array', ref: dest };
    },
    strcat: (args, line) => {
      const dest = charArrayArg(args[0] ?? {}, line, 'strcat');
      writeString(dest, readString(dest, 0, false, line) + stringArg(args[1] ?? {}, line, 'strcat'), line);
      return { t: 'array', ref: dest };
    },
    strcmp: (args, line) => {
      const a = stringArg(args[0] ?? {}, line, 'strcmp');
      const b = stringArg(args[1] ?? {}, line, 'strcmp');
      for (let i = 0; ; i++) {
        const x = i < a.length ? a.charCodeAt(i) : 0;
        const y = i < b.length ? b.charCodeAt(i) : 0;
        if (x !== y || x === 0) return scalar('int', x === y ? 0 : x < y ? -1 : 1);
      }
    },
    strrev: (args, line) => {
      const dest = charArrayArg(args[0] ?? {}, line, 'strrev');
      writeString(dest, [...readString(dest, 0, false, line)].reverse().join(''), line);
      return { t: 'array', ref: dest };
    },
    strupr: (args, line) => {
      const dest = charArrayArg(args[0] ?? {}, line, 'strupr');
      writeString(dest, readString(dest, 0, false, line).toUpperCase(), line);
      return { t: 'array', ref: dest };
    },
    strlwr: (args, line) => {
      const dest = charArrayArg(args[0] ?? {}, line, 'strlwr');
      writeString(dest, readString(dest, 0, false, line).toLowerCase(), line);
      return { t: 'array', ref: dest };
    },
    sqrt: math1(Math.sqrt),
    fabs: math1(Math.abs),
    floor: math1(Math.floor),
    ceil: math1(Math.ceil),
    abs: (args) => scalar('int', args[0]?.v === undefined ? undefined : Math.abs(toInt32(args[0].v))),
    pow: (args, line) => {
      if (args.length !== 2) throw rt(line, 'pow()-এ দুটি মান দিতে হয়: pow(x, y)');
      return scalar('double', args[0].v === undefined || args[1].v === undefined ? undefined : args[0].v ** args[1].v);
    },
    toupper: ctype((c) => (c >= 97 && c <= 122 ? c - 32 : c)),
    tolower: ctype((c) => (c >= 65 && c <= 90 ? c + 32 : c)),
    isdigit: ctype((c) => (c >= 48 && c <= 57 ? 1 : 0)),
    isalpha: ctype((c) => ((c | 32) >= 97 && (c | 32) <= 122 ? 1 : 0)),
    isupper: ctype((c) => (c >= 65 && c <= 90 ? 1 : 0)),
    islower: ctype((c) => (c >= 97 && c <= 122 ? 1 : 0)),
    isspace: ctype((c) => ([32, 9, 10, 13, 11, 12].includes(c) ? 1 : 0)),
  };

  function call(e) {
    const fn = program.funcs[e.name];
    if (!fn) {
      const args = e.args.map((a) => {
        const v = evaluate(a);
        return v.t === 'array' || v.t === 'str' || v.t === 'addr' ? v : { ...v, name: text(a) };
      });
      return BUILTINS[e.name](args, e.line, e.name);
    }
    if (fn.params.length !== e.args.length) {
      throw rt(e.line, `${e.name}() ফাংশনে ${fn.params.length}টি আর্গুমেন্ট দিতে হয়, দেওয়া হয়েছে ${e.args.length}টি`);
    }
    if (frames.length >= 200) throw rt(e.line, 'ফাংশন কলের গভীরতা 200 ছাড়িয়েছে — রিকার্শন কখনো থামছে না (স্ট্যাক ওভারফ্লো)');
    const scope = new Map();
    fn.params.forEach((p, i) => {
      const v = evaluate(e.args[i]);
      if (p.array) {
        if (v.t !== 'array') throw rt(e.line, `${e.name}()-এর ${p.name} প্যারামিটারে একটি অ্যারে দিতে হবে`);
        scope.set(p.name, v.ref);
      } else {
        if (v.t === 'array' || v.t === 'str') throw rt(e.line, `${e.name}()-এর ${p.name} প্যারামিটারে একটি মান দিতে হবে, অ্যারে নয়`);
        scope.set(p.name, { type: p.type, v: conv(p.type, v.v), name: p.name });
      }
    });
    frames.push({ fn: `${e.name}()`, scopes: [scope] });
    const args = fn.params.map((p) => `${p.name} = ${p.array ? '[অ্যারে]' : showValue(p.type, scope.get(p.name).v)}`).join(', ');
    snap(fn.line, `${e.name}() ফাংশন কল হলো${args ? ` — ${args}` : ''}`);
    let result;
    try {
      const sig = execBlock(fn.body.body, frames[frames.length - 1]);
      if (sig?.ret) result = sig.value;
      else if (fn.ret !== 'void') warn(fn.body.endLine, `${e.name}() থেকে কোনো মান return করা হয়নি`);
    } finally {
      frames.pop();
    }
    if (fn.ret === 'void') return scalar('int', 0);
    if (!result) return scalar(fn.ret, undefined);
    if (result.t === 'array' || result.t === 'str') throw rt(e.line, `${e.name}() থেকে অ্যারে return করা যায় না`);
    return scalar(fn.ret, conv(fn.ret, result.v));
  }

  // ---------- statements ----------
  const yes = (b) => (b ? 'সত্য ✓' : 'মিথ্যা ✗');

  function execBlock(list, frame) {
    frame.scopes.push(new Map());
    try {
      for (const s of list) {
        const sig = exec(s, frame);
        if (sig) return sig;
      }
      return undefined;
    } finally {
      frame.scopes.pop();
    }
  }

  function loopBody(body, frame) {
    const sig = body.k === 'block' ? execBlock(body.body, frame) : exec(body, frame);
    if (sig?.brk) return 'break';
    if (sig?.cont) return 'continue';
    return sig;
  }

  function exec(s, frame) {
    switch (s.k) {
      case 'decl':
        declare(s, frame.scopes[frame.scopes.length - 1]);
        snap(s.line, s.items.some((i) => i.init) ? 'ভেরিয়েবল ঘোষণা ও মান বসানো' : 'ভেরিয়েবল ঘোষণা');
        return undefined;
      case 'expr':
        evaluate(s.e);
        snap(s.line);
        return undefined;
      case 'block':
        return execBlock(s.body, frame);
      case 'empty':
        return undefined;
      case 'if': {
        const c = truth(s.cond);
        snap(s.line, `শর্ত (${text(s.cond)}) → ${yes(c)}`);
        if (c) return exec(s.then, frame);
        return s.else ? exec(s.else, frame) : undefined;
      }
      case 'while':
        for (;;) {
          const c = truth(s.cond);
          snap(s.line, `while শর্ত (${text(s.cond)}) → ${yes(c)}${c ? '' : ' — লুপ শেষ'}`);
          if (!c) return undefined;
          const r = loopBody(s.body, frame);
          if (r === 'break') return undefined;
          if (r && r !== 'continue') return r;
        }
      case 'do':
        for (;;) {
          const r = loopBody(s.body, frame);
          if (r === 'break') return undefined;
          if (r && r !== 'continue') return r;
          const c = truth(s.cond);
          snap(s.condLine, `do-while শর্ত (${text(s.cond)}) → ${yes(c)}${c ? '' : ' — লুপ শেষ'}`);
          if (!c) return undefined;
        }
      case 'for': {
        frame.scopes.push(new Map());
        try {
          if (s.init) {
            if (s.init.k === 'decl') declare(s.init, frame.scopes[frame.scopes.length - 1]);
            else evaluate(s.init.e);
            snap(s.line, `শুরু: ${s.init.k === 'decl' ? s.init.items.map((i) => i.name).join(', ') : text(s.init.e)}`);
          }
          for (;;) {
            const c = s.cond ? truth(s.cond) : true;
            snap(s.line, s.cond ? `for শর্ত (${text(s.cond)}) → ${yes(c)}${c ? '' : ' — লুপ শেষ'}` : 'শর্ত নেই — সবসময় সত্য');
            if (!c) return undefined;
            const r = loopBody(s.body, frame);
            if (r === 'break') return undefined;
            if (r && r !== 'continue') return r;
            if (s.step) {
              evaluate(s.step);
              snap(s.line, `হালনাগাদ: ${text(s.step)}`);
            }
          }
        } finally {
          frame.scopes.pop();
        }
      }
      case 'switch': {
        const v = evaluate(s.e);
        if (v.t === 'array' || v.t === 'str') throw rt(s.line, 'switch-এ শুধু পূর্ণসংখ্যা বা অক্ষর ব্যবহার করা যায়');
        if (isFloatType(v.t)) throw rt(s.line, 'switch-এ float/double ব্যবহার করা যায় না');
        if (v.v === undefined) throw rt(s.line, `switch (${text(s.e)})-এর মান দেওয়া হয়নি (গার্বেজ)`);
        const body = s.body.body;
        let start = body.findIndex((st) => st.k === 'case' && toInt32(evalScalar(st.e, 'case-এর মান')) === v.v);
        if (start === -1) start = body.findIndex((st) => st.k === 'default');
        snap(s.line, `switch (${text(s.e)}) = ${showValue(v.t, v.v)} → ${start === -1 ? 'কোনো case মেলেনি' : body[start].k === 'default' ? 'default' : `case ${text(body[start].e)}`}`);
        if (start === -1) return undefined;
        frame.scopes.push(new Map());
        try {
          for (let i = start; i < body.length; i++) {
            const st = body[i];
            if (st.k === 'case' || st.k === 'default') continue;
            const sig = exec(st, frame);
            if (sig?.brk) return undefined;
            if (sig) return sig;
          }
        } finally {
          frame.scopes.pop();
        }
        return undefined;
      }
      case 'case':
      case 'default':
        throw rt(s.line, `'${s.k}' শুধু switch-এর ভেতরে ব্যবহার করা যায়`);
      case 'break':
        snap(s.line, 'break — লুপ/switch থেকে বের হও');
        return { brk: true };
      case 'continue':
        snap(s.line, 'continue — লুপের পরের ধাপে যাও');
        return { cont: true };
      case 'return': {
        const value = s.e ? evaluate(s.e) : null;
        snap(s.line, value ? `return ${value.t === 'array' || value.t === 'str' ? '…' : showValue(value.t, value.v)}` : 'return');
        return { ret: true, value };
      }
      default:
        throw rt(s.line, 'অজানা স্টেটমেন্ট');
    }
  }

  // ---------- run ----------
  let error = null;
  try {
    for (const g of program.globals) declare(g, globals);
    const main = program.funcs.main;
    frames.push({ fn: 'main()', scopes: [new Map()] });
    snap(main.line, 'প্রোগ্রাম শুরু — main() থেকে');
    const sig = execBlock(main.body.body, frames[0]);
    frames.length = 1;
    const code = sig?.ret && sig.value ? sig.value.v : 0;
    steps.push({ ...steps[steps.length - 1], line: main.body.endLine, note: `প্রোগ্রাম শেষ${code !== undefined ? ` (return ${code})` : ''}`, out: output.length });
  } catch (e) {
    if (!(e instanceof CError)) throw e;
    error = { kind: 'runtime', line: e.line, message: e.message };
  }
  return { ok: !error, error, steps, output, warnings };
}

// ---------- static checks (compile errors a real compiler would give) ----------
function check(program, warn) {
  const { funcs, protos, globals, includes } = program;
  const headers = new Set();
  for (const inc of includes) {
    if (!KNOWN_HEADERS.has(inc.file)) {
      const hint = inc.file === 'studio.h' ? ' — বানান ভুল, হবে stdio.h' : '';
      throw new CError('compile', inc.line, `${inc.file} নামে কোনো হেডার ফাইল নেই${hint}`);
    }
    headers.add(inc.file);
  }
  if (!funcs.main) throw new CError('compile', 1, 'main() ফাংশন নেই — প্রতিটি C প্রোগ্রাম main() থেকে চলা শুরু করে');
  if (funcs.main.implicit) warn(funcs.main.line, 'main()-এর আগে রিটার্ন টাইপ নেই — আধুনিক কম্পাইলারে int main() লেখা উচিত');

  const globalNames = new Map();
  for (const g of globals) for (const it of g.items) globalNames.set(it.name, it.dims.length ? 'array' : g.type);
  const defined = (name) => funcs[name] || protos[name];

  // Static type of an operand when it is obvious (literal, variable, cast) — enough to reject `%` on float/double.
  const typeOf = (e, scopes) => {
    if (e.k === 'num') return e.float ? 'double' : 'int';
    if (e.k === 'cast') return e.type;
    if (e.k === 'var') {
      for (let i = scopes.length - 1; i >= 0; i--) if (scopes[i].has(e.name)) return scopes[i].get(e.name);
      return globalNames.get(e.name);
    }
    return undefined;
  };

  const visitExpr = (e, scopes, fnLine) => {
    if (!e) return;
    if ((e.k === 'bin' && e.op === '%') || (e.k === 'assign' && e.op === '%=')) {
      for (const side of [e.l, e.r]) {
        if (['float', 'double'].includes(typeOf(side, scopes))) {
          throw new CError('compile', e.line, '% (ভাগশেষ) অপারেটর শুধু পূর্ণসংখ্যায় (int/char) চলে, float/double-এ নয়');
        }
      }
    }
    switch (e.k) {
      case 'var': {
        if (scopes.some((s) => s.has(e.name)) || globalNames.has(e.name)) return;
        if (defined(e.name) || BUILTIN_HEADER[e.name]) throw new CError('compile', e.line, `${e.name} একটি ফাংশন — কল করতে ${e.name}( ) লিখতে হবে`);
        throw new CError('compile', e.line, `'${e.name}' ঘোষণা করা হয়নি (undeclared) — ব্যবহারের আগে টাইপসহ ঘোষণা করো${e.name === 'o' ? '; শূন্য লিখতে চাইলে 0 লেখো, o নয়' : ''}`);
      }
      case 'call': {
        const user = defined(e.name);
        if (!user) {
          const h = BUILTIN_HEADER[e.name];
          if (!h) throw new CError('compile', e.line, `${e.name}() নামে কোনো ফাংশন নেই`);
          const ok = [...headers].some((x) => HEADERS[x]?.includes(e.name));
          if (!ok) throw new CError('compile', e.line, `${e.name}() ব্যবহার করতে প্রোগ্রামের শুরুতে #include <${h}> লিখতে হবে`);
        } else if (!funcs[e.name]) throw new CError('compile', e.line, `${e.name}() ফাংশনের শুধু প্রোটোটাইপ আছে, বডি লেখা হয়নি`);
        else if (funcs[e.name].line > e.line && !protos[e.name] && funcs[e.name].line > fnLine) {
          warn(e.line, `${e.name}() ব্যবহারের আগে ঘোষণা (প্রোটোটাইপ) করা হয়নি — main()-এর আগে প্রোটোটাইপ লেখা ভালো`);
        }
        e.args.forEach((a) => visitExpr(a, scopes, fnLine));
        return;
      }
      default:
        for (const key of ['l', 'r', 'e', 'a', 'i', 'c', 'b']) if (e[key] && typeof e[key] === 'object' && e[key].k) visitExpr(e[key], scopes, fnLine);
    }
  };

  const visitInit = (init, scopes, fnLine) => {
    if (!init) return;
    if (init.k === 'list') init.items.forEach((x) => visitInit(x, scopes, fnLine));
    else visitExpr(init, scopes, fnLine);
  };

  const visit = (s, scopes, fnLine, ctx) => {
    if (!s) return;
    const top = scopes[scopes.length - 1];
    switch (s.k) {
      case 'decl':
        for (const it of s.items) {
          it.dims.forEach((d) => visitExpr(d, scopes, fnLine));
          visitInit(it.init, scopes, fnLine);
          top.set(it.name, it.dims.length ? 'array' : s.type);
        }
        return;
      case 'expr':
        visitExpr(s.e, scopes, fnLine);
        return;
      case 'block': {
        const inner = [...scopes, new Map()];
        s.body.forEach((x) => visit(x, inner, fnLine, ctx));
        return;
      }
      case 'if':
        visitExpr(s.cond, scopes, fnLine);
        visit(s.then, [...scopes, new Map()], fnLine, ctx);
        visit(s.else, [...scopes, new Map()], fnLine, ctx);
        return;
      case 'while':
      case 'do':
        visitExpr(s.cond, scopes, fnLine);
        visit(s.body, [...scopes, new Map()], fnLine, { ...ctx, loop: true });
        return;
      case 'for': {
        const inner = [...scopes, new Map()];
        if (s.init) visit(s.init, inner, fnLine, ctx);
        visitExpr(s.cond, inner, fnLine);
        visitExpr(s.step, inner, fnLine);
        visit(s.body, [...inner, new Map()], fnLine, { ...ctx, loop: true });
        return;
      }
      case 'switch':
        visitExpr(s.e, scopes, fnLine);
        visit(s.body, scopes, fnLine, { ...ctx, sw: true });
        return;
      case 'case':
      case 'default':
        if (!ctx.sw) throw new CError('compile', s.line, `'${s.k}' শুধু switch-এর ভেতরে ব্যবহার করা যায়`);
        return;
      case 'break':
        if (!ctx.loop && !ctx.sw) throw new CError('compile', s.line, "'break' শুধু লুপ বা switch-এর ভেতরে ব্যবহার করা যায়");
        return;
      case 'continue':
        if (!ctx.loop) throw new CError('compile', s.line, "'continue' শুধু লুপের ভেতরে ব্যবহার করা যায়");
        return;
      case 'return':
        visitExpr(s.e, scopes, fnLine);
        if (ctx.ret === 'void' && s.e) throw new CError('compile', s.line, 'void ফাংশন থেকে মান return করা যায় না');
        return;
      default:
    }
  };

  globals.forEach((g) => g.items.forEach((it) => visitInit(it.init, [], 0)));
  for (const fn of Object.values(funcs)) {
    const params = new Map(fn.params.map((p) => [p.name, p.array ? 'array' : p.type]));
    visit(fn.body, [params], fn.line, { ret: fn.ret });
  }
}
