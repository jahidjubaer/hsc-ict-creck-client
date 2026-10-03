// Classical ciphers for the encryption lab (pure functions, tested in Node).

const A = 'A'.charCodeAt(0);
const a = 'a'.charCodeAt(0);

/** Caesar cipher: every letter moves `shift` places along the alphabet (wraps Z → A). Other characters stay. */
export function caesar(text, shift) {
  const k = ((shift % 26) + 26) % 26;
  return text.replace(/[A-Za-z]/g, (ch) => {
    const base = ch <= 'Z' ? A : a;
    return String.fromCharCode(((ch.charCodeAt(0) - base + k) % 26) + base);
  });
}

/** Per-letter working for the step table: { ch, x, y, out } with y = (x ± k) mod 26. */
export const caesarSteps = (text, shift) =>
  [...text.toUpperCase()].filter((ch) => /[A-Z]/.test(ch)).map((ch) => {
    const x = ch.charCodeAt(0) - A;
    const y = (((x + shift) % 26) + 26) % 26;
    return { ch, x, y, out: String.fromCharCode(y + A) };
  });

/**
 * Column order of a transposition key: a keyword ('ZEBRA') or digits ('3142').
 * Returns, for each column, its rank (0 = read first). Equal letters are read left to right.
 */
export function keyOrder(key) {
  const chars = [...String(key).toUpperCase().replace(/[^A-Z0-9]/g, '')];
  const sorted = chars.map((c, i) => ({ c, i })).sort((p, q) => (p.c < q.c ? -1 : p.c > q.c ? 1 : p.i - q.i));
  const rank = new Array(chars.length);
  sorted.forEach((s, r) => (rank[s.i] = r));
  return rank;
}

/** Columnar transposition: write the message row by row under the key (spaces removed, padded with X), read column by column in key order. */
export function transposeGrid(text, key) {
  const rank = keyOrder(key);
  const n = rank.length;
  const letters = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!n || !letters) return { rank, rows: [], cipher: '', padded: 0 };
  const rowsCount = Math.ceil(letters.length / n);
  const padded = rowsCount * n - letters.length;
  const full = letters + 'X'.repeat(padded);
  const rows = Array.from({ length: rowsCount }, (_, r) => [...full.slice(r * n, r * n + n)]);
  const cols = rank.map((_, c) => c).sort((p, q) => rank[p] - rank[q]);
  const cipher = cols.map((c) => rows.map((row) => row[c]).join('')).join('');
  return { rank, rows, cipher, padded };
}

/** Reverses transposeGrid: fill the columns in key order, read row by row. */
export function untranspose(cipher, key) {
  const rank = keyOrder(key);
  const n = rank.length;
  const letters = cipher.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!n || !letters || letters.length % n) return null;
  const rowsCount = letters.length / n;
  const rows = Array.from({ length: rowsCount }, () => new Array(n));
  const cols = rank.map((_, c) => c).sort((p, q) => rank[p] - rank[q]);
  cols.forEach((c, k) => {
    for (let r = 0; r < rowsCount; r++) rows[r][c] = letters[k * rowsCount + r];
  });
  return { rank, rows, plain: rows.map((r) => r.join('')).join('') };
}
