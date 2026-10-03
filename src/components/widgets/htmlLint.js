// Small HTML helpers for the HTML labs: a tag-balance checker that explains mistakes in Bangla
// (browsers silently auto-correct, so students never see them), task checks and preview preparation.
import { toBn } from '@/lib/bn';

export const VOID_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr',
]);
const RAW_TEXT = new Set(['script', 'style', 'textarea', 'title']);

const lineAt = (src, index) => {
  let n = 1;
  for (let i = 0; i < index; i++) if (src.charCodeAt(i) === 10) n++;
  return n;
};

/**
 * Returns [{ line, level: 'error' | 'warn', msg }] for unclosed, stray and overlapping tags.
 * `<p><em>x</p></em>` → one "overlap" error on line of `</p>` (the later `</em>` is not reported twice).
 */
export function lintHtml(src) {
  const issues = [];
  const stack = []; // { name, line }
  const dangling = new Map(); // tags force-closed by an overlap; their late close tag is ignored once
  const re = /<!--[\s\S]*?(-->|$)|<!doctype[^>]*>|<\/?([a-zA-Z][a-zA-Z0-9-]*)\b[^>]*>/gi;
  let m;
  while ((m = re.exec(src))) {
    const raw = m[0];
    const line = lineAt(src, m.index);
    if (raw.startsWith('<!--')) {
      if (!m[1]) issues.push({ line, level: 'error', msg: 'কমেন্ট শুরু হয়েছে (<!--) কিন্তু --> দিয়ে শেষ হয়নি' });
      continue;
    }
    if (raw[1] === '!') continue; // doctype
    const name = m[2].toLowerCase();
    const closing = raw[1] === '/';

    if (!closing) {
      if (VOID_TAGS.has(name) || raw.endsWith('/>')) continue;
      stack.push({ name, line });
      if (RAW_TEXT.has(name)) {
        // skip raw content up to the matching close tag
        const end = src.toLowerCase().indexOf(`</${name}`, re.lastIndex);
        if (end === -1) continue;
        re.lastIndex = end;
      }
      continue;
    }

    if (VOID_TAGS.has(name)) {
      issues.push({ line, level: 'warn', msg: `<${name}> একটি এম্পটি এলিমেন্ট — এর ক্লোজিং ট্যাগ </${name}> লাগে না` });
      continue;
    }
    const top = stack[stack.length - 1];
    if (top?.name === name) {
      stack.pop();
      continue;
    }
    const at = stack.map((s) => s.name).lastIndexOf(name);
    if (at === -1) {
      if (dangling.get(name)) {
        dangling.set(name, dangling.get(name) - 1);
        continue;
      }
      issues.push({ line, level: 'error', msg: `</${name}> এর কোনো ওপেনিং ট্যাগ <${name}> নেই` });
      continue;
    }
    const inner = stack.splice(at + 1);
    stack.pop();
    for (const t of inner) {
      dangling.set(t.name, (dangling.get(t.name) || 0) + 1);
      issues.push({
        line,
        level: 'error',
        msg: `<${t.name}> (লাইন ${toBn(t.line)}) বন্ধ হওয়ার আগেই </${name}> এসেছে — ট্যাগ ওভারল্যাপ করেছে বা </${t.name}> লেখা হয়নি`,
      });
    }
  }
  for (const t of stack) {
    issues.push({ line: t.line, level: 'warn', msg: `<${t.name}> খোলা হয়েছে কিন্তু </${t.name}> দিয়ে বন্ধ করা হয়নি` });
  }
  return issues.sort((a, b) => a.line - b.line);
}

const parse = (src) => new DOMParser().parseFromString(src, 'text/html');

/**
 * Task check: { selector, min?, contains? } → true when at least `min` (default 1) elements match the CSS
 * selector and, if `contains` is given, one of them contains that text. (`text` is the task's label.)
 */
export function checkTask(doc, { selector, min = 1, contains }) {
  let found;
  try {
    found = [...doc.querySelectorAll(selector)];
  } catch {
    return false;
  }
  if (found.length < min) return false;
  return contains ? found.some((el) => el.textContent.toLowerCase().includes(contains.toLowerCase())) : true;
}

// Stand-in picture for local files like image.jpg / map.jpg that don't exist in the lab.
const placeholder = (name) =>
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200" preserveAspectRatio="xMidYMid slice">` +
      `<rect width="300" height="200" fill="#dbeafe"/><circle cx="235" cy="50" r="24" fill="#fbbf24"/>` +
      `<path d="M0 165 L85 90 L145 140 L205 75 L300 165 V200 H0Z" fill="#3b82f6"/>` +
      `<rect x="70" y="84" width="160" height="32" rx="8" fill="#fff" opacity=".85"/>` +
      `<text x="150" y="106" font-family="sans-serif" font-size="16" text-anchor="middle" fill="#1e3a8a">${name
        .replace(/[<>&"]/g, '')
        .slice(0, 22)}</text></svg>`,
  );

/**
 * Prepares student code for the sandboxed preview: local image paths get a placeholder picture,
 * and links open in a new tab (the sandbox can't navigate the lesson page). Returns { html, title, doc }.
 */
export function preparePreview(src) {
  const doc = parse(src);
  const title = doc.querySelector('head > title, title')?.textContent.trim() || '';
  const out = parse(src);
  for (const img of out.querySelectorAll('img[src]')) {
    const s = img.getAttribute('src').trim();
    if (!/^(https?:|data:)/i.test(s)) img.setAttribute('src', placeholder(s.split(/[\\/]/).pop() || 'image'));
  }
  for (const a of out.querySelectorAll('a[href]')) {
    if (!a.getAttribute('href').startsWith('#')) a.setAttribute('target', '_blank');
  }
  const doctype = /^\s*<!doctype/i.test(src) ? '<!DOCTYPE html>' : '';
  return { html: doctype + out.documentElement.outerHTML, title, doc };
}
