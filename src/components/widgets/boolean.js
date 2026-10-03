// Tiny Boolean expression engine for the TruthTable lab.
// Syntax: variables A–D (lowercase accepted), constants 0/1, NOT = postfix ' or combining overline (A̅) or prefix ! ~ ¬,
// AND = . · * × or juxtaposition (AB), XOR = ⊕ or ^, OR = +. Precedence: NOT > AND > XOR > OR.

const VARS = /[A-D]/;

function tokenize(src) {
  const out = [];
  for (const raw of src.replace(/\s+/g, '')) {
    const ch = raw.toUpperCase();
    if (VARS.test(ch)) out.push({ k: 'var', v: ch });
    else if (ch === '0' || ch === '1') out.push({ k: 'const', v: ch === '1' });
    else if ("'’′̅¯".includes(raw)) out.push({ k: 'post' });
    else if ('!~¬'.includes(raw)) out.push({ k: 'pre' });
    else if ('.·*×'.includes(raw)) out.push({ k: 'and' });
    else if ('⊕^'.includes(raw)) out.push({ k: 'xor' });
    else if (raw === '+') out.push({ k: 'or' });
    else if (raw === '(') out.push({ k: '(' });
    else if (raw === ')') out.push({ k: ')' });
    else throw new Error(`অচেনা চিহ্ন "${raw}" — শুধু A–D, 0, 1, ', ., +, ⊕ ও বন্ধনী ব্যবহার করো`);
  }
  return out;
}

export function parse(src) {
  const toks = tokenize(src);
  if (!toks.length) throw new Error('একটি রাশি লেখো');
  let i = 0;
  const peek = () => toks[i];
  const take = (k) => {
    if (peek()?.k !== k) throw new Error(k === ')' ? 'বন্ধনী বন্ধ করা হয়নি' : 'রাশিটি অসম্পূর্ণ');
    return toks[i++];
  };
  const startsFactor = (t) => t && (t.k === 'var' || t.k === 'const' || t.k === '(' || t.k === 'pre');

  function primary() {
    const t = peek();
    if (!t) throw new Error('রাশিটি অসম্পূর্ণ');
    if (t.k === 'pre') {
      i++;
      return { t: 'not', a: factor() };
    }
    if (t.k === 'var') {
      i++;
      return { t: 'var', n: t.v };
    }
    if (t.k === 'const') {
      i++;
      return { t: 'const', v: t.v };
    }
    if (t.k === '(') {
      i++;
      const e = orExpr();
      take(')');
      return e;
    }
    throw new Error('ভুল জায়গায় অপারেটর');
  }
  function factor() {
    let node = primary();
    while (peek()?.k === 'post') {
      i++;
      node = { t: 'not', a: node };
    }
    return node;
  }
  function andExpr() {
    let node = factor();
    for (;;) {
      if (peek()?.k === 'and') {
        i++;
        node = { t: 'and', a: node, b: factor() };
      } else if (startsFactor(peek())) node = { t: 'and', a: node, b: factor() };
      else return node;
    }
  }
  function xorExpr() {
    let node = andExpr();
    while (peek()?.k === 'xor') {
      i++;
      node = { t: 'xor', a: node, b: andExpr() };
    }
    return node;
  }
  function orExpr() {
    let node = xorExpr();
    while (peek()?.k === 'or') {
      i++;
      node = { t: 'or', a: node, b: xorExpr() };
    }
    return node;
  }

  const ast = orExpr();
  if (i < toks.length) throw new Error(peek().k === ')' ? 'অতিরিক্ত বন্ধনী' : 'রাশিটি বোঝা যাচ্ছে না');
  return ast;
}

export function evaluate(node, env) {
  switch (node.t) {
    case 'var':
      return env[node.n];
    case 'const':
      return node.v;
    case 'not':
      return !evaluate(node.a, env);
    case 'and':
      return evaluate(node.a, env) && evaluate(node.b, env);
    case 'or':
      return evaluate(node.a, env) || evaluate(node.b, env);
    default:
      return evaluate(node.a, env) !== evaluate(node.b, env);
  }
}

const PREC = { or: 1, xor: 2, and: 3, not: 4, var: 5, const: 5 };

/** Canonical text: A'B + (A + C)' */
export function show(node, parent = 0) {
  let s;
  switch (node.t) {
    case 'var':
      return node.n;
    case 'const':
      return node.v ? '1' : '0';
    case 'not': {
      const inner = show(node.a, PREC.not);
      return node.a.t === 'var' || node.a.t === 'const' || node.a.t === 'not' ? `${inner}'` : `(${show(node.a)})'`;
    }
    case 'and': {
      const l = show(node.a, PREC.and);
      const r = show(node.b, PREC.and);
      s = /^[A-D]'*$/.test(l) && /^[A-D(]/.test(r) ? `${l}${r}` : `${l}.${r}`;
      break;
    }
    case 'or':
      s = `${show(node.a, PREC.or)} + ${show(node.b, PREC.or)}`;
      break;
    default:
      s = `${show(node.a, PREC.xor)} ⊕ ${show(node.b, PREC.xor)}`;
  }
  return PREC[node.t] < parent ? `(${s})` : s;
}

export function variables(node, set = new Set()) {
  if (node.t === 'var') set.add(node.n);
  else if (node.a) {
    variables(node.a, set);
    if (node.b) variables(node.b, set);
  }
  return set;
}

/** Distinct compound sub-expressions in evaluation order (for the "steps" columns). */
export function subExpressions(node, out = []) {
  if (node.t === 'var' || node.t === 'const') return out;
  subExpressions(node.a, out);
  if (node.b) subExpressions(node.b, out);
  if (!out.some((n) => show(n) === show(node))) out.push(node);
  return out;
}

/** All 2ⁿ input rows in board order (000, 001, …). */
export function rowsFor(vars) {
  const n = vars.length;
  return Array.from({ length: 2 ** n }, (_, r) => Object.fromEntries(vars.map((v, i) => [v, Boolean((r >> (n - 1 - i)) & 1)])));
}
