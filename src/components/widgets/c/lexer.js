// Tokenizer for the C subset used in HSC ICT (see interpreter.js). Errors are thrown as CError with Bangla text.

export class CError extends Error {
  constructor(kind, line, message) {
    super(message);
    this.kind = kind; // 'compile' | 'runtime'
    this.line = line;
  }
}

export const KEYWORDS = new Set([
  'int', 'char', 'float', 'double', 'void', 'long', 'short', 'unsigned', 'signed', 'const',
  'if', 'else', 'while', 'do', 'for', 'switch', 'case', 'default', 'break', 'continue', 'return', 'sizeof',
]);

const OPS = [
  '<<=', '>>=', '++', '--', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<', '>>', '<=', '>=', '==', '!=', '&&', '||',
  '+', '-', '*', '/', '%', '=', '<', '>', '!', '~', '&', '|', '^', '?', ':', ';', ',', '(', ')', '{', '}', '[', ']',
];

const ESC = { n: '\n', t: '\t', 0: '\0', '\\': '\\', "'": "'", '"': '"', r: '\r', a: '\x07', b: '\b' };

/** Returns { tokens: [{ t: 'id'|'kw'|'num'|'char'|'str'|'op'|'eof', v, line, pos, end, float? }], includes: [] } */
export function tokenize(src) {
  const tokens = [];
  const includes = [];
  let i = 0;
  let line = 1;
  const at = (k = 0) => src[i + k];

  const readEscape = () => {
    // at a backslash
    const c = at(1);
    i += 2;
    if (c in ESC) return ESC[c];
    throw new CError('compile', line, `অজানা এস্কেপ সিকোয়েন্স \\${c}`);
  };

  while (i < src.length) {
    const c = at();
    if (c === '\n') {
      line++;
      i++;
      continue;
    }
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    if (c === '/' && at(1) === '/') {
      while (i < src.length && at() !== '\n') i++;
      continue;
    }
    if (c === '/' && at(1) === '*') {
      const startLine = line;
      i += 2;
      while (i < src.length && !(at() === '*' && at(1) === '/')) {
        if (at() === '\n') line++;
        i++;
      }
      if (i >= src.length) throw new CError('compile', startLine, 'কমেন্ট /* শুরু হয়েছে কিন্তু */ দিয়ে শেষ হয়নি');
      i += 2;
      continue;
    }
    if (c === '#') {
      const startLine = line;
      let text = '';
      while (i < src.length && at() !== '\n') text += src[i++];
      const m = text.match(/^#\s*include\s*[<"]\s*([\w./]+)\s*[>"]/);
      if (m) includes.push({ file: m[1], line: startLine });
      else if (!/^#\s*(define|include)/.test(text)) throw new CError('compile', startLine, `অজানা প্রিপ্রসেসর নির্দেশ: ${text.trim()}`);
      continue;
    }
    const pos = i;
    if (/[A-Za-z_]/.test(c)) {
      let w = '';
      while (i < src.length && /\w/.test(at())) w += src[i++];
      tokens.push({ t: KEYWORDS.has(w) ? 'kw' : 'id', v: w, line, pos, end: i });
      continue;
    }
    if (/\d/.test(c) || (c === '.' && /\d/.test(at(1)))) {
      let w = '';
      while (i < src.length && /[\w.]/.test(at())) {
        w += src[i++];
        if (/[eE]$/.test(w) && /[+-]/.test(at()) && !/^0[xX]/.test(w)) w += src[i++];
      }
      let float = false;
      let v;
      const body = w.replace(/[fFlLuU]+$/, '');
      if (/^0[xX][0-9a-fA-F]+$/.test(body)) v = parseInt(body, 16);
      else if (/^0[0-7]+$/.test(body)) v = parseInt(body, 8);
      else if (/^\d+$/.test(body)) v = parseInt(body, 10);
      else if (/^(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(body)) {
        v = parseFloat(body);
        float = true;
      } else throw new CError('compile', line, `অবৈধ সংখ্যা: ${w}`);
      tokens.push({ t: 'num', v, float, line, pos, end: i });
      continue;
    }
    if (c === "'") {
      i++;
      let ch;
      if (at() === '\\') ch = readEscape();
      else ch = src[i++];
      if (at() !== "'") throw new CError('compile', line, "ক্যারেক্টার লিটারেল ' দিয়ে বন্ধ হয়নি (একটি ' এর ভেতরে একটিই অক্ষর থাকে)");
      i++;
      tokens.push({ t: 'char', v: ch.charCodeAt(0), line, pos, end: i });
      continue;
    }
    if (c === '"') {
      i++;
      let s = '';
      while (true) {
        if (i >= src.length || at() === '\n') throw new CError('compile', line, 'স্ট্রিং শুরু হয়েছে কিন্তু " দিয়ে শেষ হয়নি');
        if (at() === '"') break;
        if (at() === '\\') s += readEscape();
        else s += src[i++];
      }
      i++;
      // adjacent literals concatenate: "ab" "cd"
      const prev = tokens[tokens.length - 1];
      if (prev?.t === 'str') {
        prev.v += s;
        prev.end = i;
      } else tokens.push({ t: 'str', v: s, line, pos, end: i });
      continue;
    }
    const op = OPS.find((o) => src.startsWith(o, i));
    if (!op) throw new CError('compile', line, `অজানা চিহ্ন: ${c}`);
    i += op.length;
    tokens.push({ t: 'op', v: op, line, pos, end: i });
  }
  tokens.push({ t: 'eof', v: 'ফাইলের শেষ', line, pos: i, end: i });
  return { tokens, includes };
}
