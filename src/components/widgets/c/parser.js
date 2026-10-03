// Recursive-descent parser for the HSC C subset → AST consumed by interpreter.js.
import { CError, tokenize } from './lexer';

const TYPE_WORDS = new Set(['int', 'char', 'float', 'double', 'void', 'long', 'short', 'unsigned', 'signed', 'const']);
const ASSIGN_OPS = new Set(['=', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<=', '>>=']);
const BINARY = [
  ['||'],
  ['&&'],
  ['|'],
  ['^'],
  ['&'],
  ['==', '!='],
  ['<', '<=', '>', '>='],
  ['<<', '>>'],
  ['+', '-'],
  ['*', '/', '%'],
];

const show = (tok) => (tok.t === 'str' ? `"${tok.v}"` : tok.t === 'char' ? `'${String.fromCharCode(tok.v)}'` : String(tok.v));

export function parse(src) {
  const { tokens, includes } = tokenize(src);
  let p = 0;
  const peek = (k = 0) => tokens[Math.min(p + k, tokens.length - 1)];
  const next = () => tokens[p++];
  const is = (v, k = 0) => {
    const t = peek(k);
    return (t.t === 'op' || t.t === 'kw') && t.v === v;
  };
  const accept = (v) => (is(v) ? next() : null);
  const fail = (tok, msg) => {
    throw new CError('compile', tok.line, msg);
  };
  const expect = (v, what) => {
    if (is(v)) return next();
    const tok = peek();
    // a missing ';' is reported on the line it belongs to, like real compilers
    const line = v === ';' && p > 0 ? tokens[p - 1].line : tok.line;
    throw new CError('compile', line, `${what ? `${what}: ` : ''}'${v}' প্রত্যাশিত ছিল, কিন্তু পাওয়া গেছে '${show(tok)}'`);
  };
  const ident = (what) => {
    const tok = peek();
    if (tok.t !== 'id') fail(tok, `${what} প্রত্যাশিত ছিল, কিন্তু পাওয়া গেছে '${show(tok)}'${tok.t === 'kw' ? ' — এটি একটি কি-ওয়ার্ড, নাম হিসেবে ব্যবহার করা যায় না' : ''}`);
    return next();
  };
  const isTypeStart = () => peek().t === 'kw' && TYPE_WORDS.has(peek().v);

  function parseType() {
    const words = [];
    while (isTypeStart()) words.push(next().v);
    const w = words.filter((x) => x !== 'const' && x !== 'signed');
    if (w.includes('void')) return 'void';
    if (w.includes('char')) return 'char';
    if (w.includes('double')) return 'double';
    if (w.includes('float')) return 'float';
    return 'int'; // int, long, short, unsigned, long long …
  }

  // ---------- expressions ----------
  const node = (k, tok, extra) => ({ k, line: tok.line, pos: tok.pos, ...extra });
  const withEnd = (n) => {
    n.end = tokens[p - 1].end;
    return n;
  };

  function expression() {
    let e = assignment();
    while (is(',')) {
      const t = next();
      e = withEnd(node('comma', t, { l: e, r: assignment(), pos: e.pos }));
    }
    return e;
  }

  function assignment() {
    const left = conditional();
    if (peek().t === 'op' && ASSIGN_OPS.has(peek().v)) {
      const t = next();
      if (!['var', 'idx'].includes(left.k)) fail(t, `'${t.v}'-এর বাম পাশে একটি ভেরিয়েবল থাকতে হবে`);
      return withEnd(node('assign', t, { op: t.v, l: left, r: assignment(), pos: left.pos }));
    }
    return left;
  }

  function conditional() {
    const c = binary(0);
    if (is('?')) {
      const t = next();
      const a = expression();
      expect(':', 'টারনারি অপারেটর');
      return withEnd(node('cond', t, { c, a, b: conditional(), pos: c.pos }));
    }
    return c;
  }

  function binary(level) {
    if (level >= BINARY.length) return unary();
    let l = binary(level + 1);
    while (peek().t === 'op' && BINARY[level].includes(peek().v)) {
      const t = next();
      if (['<', '>', '+', '-', '*', '/', '%'].includes(t.v) && is('=')) {
        fail(t, `'${t.v} =' — দুই চিহ্নের মাঝে ফাঁকা রাখা যায় না, লিখতে হবে '${t.v}='`);
      }
      l = withEnd(node('bin', t, { op: t.v, l, r: binary(level + 1), pos: l.pos }));
    }
    return l;
  }

  function unary() {
    const t = peek();
    if (t.t === 'op' && ['-', '+', '!', '~'].includes(t.v)) {
      next();
      return withEnd(node('un', t, { op: t.v, e: unary() }));
    }
    if (t.t === 'op' && (t.v === '++' || t.v === '--')) {
      next();
      const e = unary();
      if (!['var', 'idx'].includes(e.k)) fail(t, `'${t.v}' শুধু ভেরিয়েবলের সাথে ব্যবহার করা যায়`);
      return withEnd(node('pre', t, { op: t.v, e }));
    }
    if (t.t === 'op' && t.v === '&') {
      next();
      const e = unary();
      if (!['var', 'idx'].includes(e.k)) fail(t, "'&' (অ্যাড্রেস) শুধু ভেরিয়েবলের আগে বসে");
      return withEnd(node('addr', t, { e }));
    }
    if (t.t === 'op' && t.v === '*') fail(t, 'পয়েন্টার (*) এই ল্যাবে সমর্থিত নয়');
    if (t.t === 'kw' && t.v === 'sizeof') {
      next();
      if (is('(') && peek(1).t === 'kw' && TYPE_WORDS.has(peek(1).v)) {
        next();
        const type = parseType();
        expect(')', 'sizeof');
        return withEnd(node('sizeofType', t, { type }));
      }
      return withEnd(node('sizeofExpr', t, { e: unary() }));
    }
    if (is('(') && peek(1).t === 'kw' && TYPE_WORDS.has(peek(1).v)) {
      next();
      const type = parseType();
      expect(')', 'টাইপ কাস্ট');
      return withEnd(node('cast', t, { type, e: unary() }));
    }
    return postfix();
  }

  function postfix() {
    let e = primary();
    for (;;) {
      const t = peek();
      if (is('[')) {
        next();
        const i = expression();
        expect(']', 'অ্যারের ইনডেক্স');
        e = withEnd(node('idx', t, { a: e, i, pos: e.pos }));
      } else if (is('(')) {
        if (e.k !== 'var') fail(t, 'শুধু ফাংশনের নামের পরে ( ) দিয়ে কল করা যায়');
        next();
        const args = [];
        if (!is(')')) {
          do args.push(assignment());
          while (accept(','));
        }
        expect(')', `${e.name}() ফাংশন কল`);
        e = withEnd(node('call', t, { name: e.name, args, line: e.line, pos: e.pos }));
      } else if (is('++') || is('--')) {
        next();
        if (!['var', 'idx'].includes(e.k)) fail(t, `'${t.v}' শুধু ভেরিয়েবলের সাথে ব্যবহার করা যায়`);
        e = withEnd(node('post', t, { op: t.v, e, pos: e.pos }));
      } else return e;
    }
  }

  function primary() {
    const t = next();
    if (t.t === 'num') return withEnd(node('num', t, { v: t.v, float: t.float }));
    if (t.t === 'char') return withEnd(node('chr', t, { v: t.v }));
    if (t.t === 'str') return withEnd(node('str', t, { v: t.v }));
    if (t.t === 'id') return withEnd(node('var', t, { name: t.v }));
    if (t.t === 'op' && t.v === '(') {
      const e = expression();
      expect(')', 'বন্ধনী');
      e.paren = true;
      return e;
    }
    return fail(t, `এখানে একটি মান বা ভেরিয়েবল প্রত্যাশিত ছিল, কিন্তু পাওয়া গেছে '${show(t)}'`);
  }

  // ---------- statements ----------
  function initializer() {
    if (is('{')) {
      const t = next();
      const items = [];
      while (!is('}')) {
        items.push(initializer());
        if (!accept(',')) break;
      }
      expect('}', 'অ্যারের প্রাথমিক মানের তালিকা');
      return node('list', t, { items });
    }
    return assignment();
  }

  function declarators(type, first) {
    const items = [];
    let nameTok = first;
    for (;;) {
      const dims = [];
      while (accept('[')) {
        dims.push(is(']') ? null : conditional());
        expect(']', 'অ্যারের আকার');
      }
      const item = { name: nameTok.v, line: nameTok.line, dims };
      if (accept('=')) item.init = initializer();
      if (type === 'void') fail(nameTok, `void টাইপের ভেরিয়েবল (${nameTok.v}) হয় না`);
      items.push(item);
      if (!accept(',')) break;
      nameTok = ident('ভেরিয়েবলের নাম');
    }
    return items;
  }

  function statement() {
    const t = peek();
    if (isTypeStart()) {
      const type = parseType();
      const name = ident('ভেরিয়েবলের নাম');
      const items = declarators(type, name);
      expect(';', 'ঘোষণার শেষে');
      return { k: 'decl', type, items, line: t.line };
    }
    if (t.t === 'op' && t.v === '{') return block();
    if (t.t === 'op' && t.v === ';') {
      next();
      return { k: 'empty', line: t.line };
    }
    if (t.t === 'kw') {
      switch (t.v) {
        case 'if': {
          next();
          expect('(', 'if-এর শর্ত');
          const cond = expression();
          expect(')', 'if-এর শর্ত');
          const then = statement();
          const els = accept('else') ? statement() : null;
          return { k: 'if', cond, then, else: els, line: t.line };
        }
        case 'else':
          return fail(t, "'else'-এর আগে কোনো 'if' নেই (if-এর পরে ; দিলে বা { } ঠিক না থাকলে এমন হয়)");
        case 'while': {
          next();
          expect('(', 'while-এর শর্ত');
          const cond = expression();
          expect(')', 'while-এর শর্ত');
          return { k: 'while', cond, body: statement(), line: t.line };
        }
        case 'do': {
          next();
          const body = statement();
          const wt = expect('while', 'do-while লুপের শেষে');
          expect('(', 'do-while-এর শর্ত');
          const cond = expression();
          expect(')', 'do-while-এর শর্ত');
          expect(';', 'do-while-এর শেষে');
          return { k: 'do', body, cond, line: t.line, condLine: wt.line };
        }
        case 'for': {
          next();
          expect('(', 'for লুপ');
          let init = null;
          if (isTypeStart()) {
            const it = peek();
            const type = parseType();
            init = { k: 'decl', type, items: declarators(type, ident('ভেরিয়েবলের নাম')), line: it.line };
          } else if (!is(';')) init = { k: 'expr', e: expression(), line: t.line };
          expect(';', 'for লুপের প্রথম অংশের পরে');
          const cond = is(';') ? null : expression();
          expect(';', 'for লুপের শর্তের পরে');
          const step = is(')') ? null : expression();
          expect(')', 'for লুপ');
          return { k: 'for', init, cond, step, body: statement(), line: t.line };
        }
        case 'switch': {
          next();
          expect('(', 'switch');
          const e = expression();
          expect(')', 'switch');
          if (!is('{')) fail(peek(), "switch-এর পরে { } ব্লক থাকতে হবে");
          return { k: 'switch', e, body: block(), line: t.line };
        }
        case 'case': {
          next();
          const e = conditional();
          expect(':', 'case');
          return { k: 'case', e, line: t.line };
        }
        case 'default':
          next();
          expect(':', 'default');
          return { k: 'default', line: t.line };
        case 'break':
          next();
          expect(';', 'break-এর পরে');
          return { k: 'break', line: t.line };
        case 'continue':
          next();
          expect(';', 'continue-এর পরে');
          return { k: 'continue', line: t.line };
        case 'return': {
          next();
          const e = is(';') ? null : expression();
          expect(';', 'return-এর পরে');
          return { k: 'return', e, line: t.line };
        }
        default:
      }
    }
    const e = expression();
    expect(';', 'স্টেটমেন্টের শেষে');
    return { k: 'expr', e, line: t.line };
  }

  function block() {
    const t = expect('{');
    const body = [];
    while (!is('}')) {
      if (peek().t === 'eof') fail(t, "এই '{' এর জোড়া '}' পাওয়া যায়নি");
      body.push(statement());
    }
    const close = next();
    return { k: 'block', body, line: t.line, endLine: close.line };
  }

  // ---------- top level ----------
  const funcs = {};
  const protos = {};
  const globals = [];
  while (peek().t !== 'eof') {
    const t = peek();
    let ret = 'int';
    let implicit = false;
    if (isTypeStart()) ret = parseType();
    else if (t.t === 'id' && is('(', 1)) implicit = true; // old style: main()
    else fail(t, `এখানে ফাংশন বা ভেরিয়েবলের ঘোষণা প্রত্যাশিত ছিল, কিন্তু পাওয়া গেছে '${show(t)}'`);
    const name = ident('নাম');
    if (accept('(')) {
      const params = [];
      if (is('void') && is(')', 1)) next();
      else if (!is(')')) {
        do {
          const pt = peek();
          if (!isTypeStart()) fail(pt, `প্যারামিটারের টাইপ প্রত্যাশিত ছিল, কিন্তু পাওয়া গেছে '${show(pt)}'`);
          const type = parseType();
          const pn = ident('প্যারামিটারের নাম');
          let array = 0;
          while (accept('[')) {
            if (!is(']')) conditional();
            expect(']', 'অ্যারে প্যারামিটার');
            array++;
          }
          params.push({ type, name: pn.v, array });
        } while (accept(','));
      }
      expect(')', `${name.v}() ফাংশনের প্যারামিটার`);
      if (accept(';')) {
        protos[name.v] = { name: name.v, ret, params, line: t.line };
        continue;
      }
      if (!is('{')) expect('{', `${name.v}() ফাংশনের বডি`);
      if (funcs[name.v]) fail(name, `${name.v}() ফাংশনটি দুইবার লেখা হয়েছে`);
      funcs[name.v] = { name: name.v, ret, params, body: block(), line: name.line, implicit };
    } else {
      const items = declarators(ret, name);
      expect(';', 'ঘোষণার শেষে');
      globals.push({ k: 'decl', type: ret, items, line: t.line, global: true });
    }
  }
  return { funcs, protos, globals, includes };
}
