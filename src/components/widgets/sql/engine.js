// SQL playground engine: runs a student's script on a fresh SQLite database (sql.js) and explains errors in Bangla.
// Pure module (the sql.js instance is passed in) so it can be tested in Node.
import { DATASETS } from './datasets';

/** Setup SQL for a dataset name ('student', 'school', …) or a raw SQL string. */
export const setupSql = (setup) => (setup && DATASETS[setup] !== undefined ? DATASETS[setup] : setup || '');

/**
 * Splits a script into statements with their 1-based start line. Understands '…', "…", -- and /* *\/ comments,
 * the sqlite3 shell prompts the book prints ("sqlite> ", "...> ") and dot-commands (.mode column, .quit …).
 */
export function splitStatements(src) {
  const text = src.replace(/\r/g, '').replace(/^[ \t]*(sqlite>|\.\.\.>)[ \t]?/gm, '');
  const out = [];
  let i = 0;
  let line = 1;
  let start = 0;
  let startLine = 1;
  let atStart = true; // only whitespace/comments since the last statement ended
  const push = (end) => {
    const sql = text.slice(start, end).trim();
    if (sql && !/^(--[^\n]*\n?|\/\*[\s\S]*?\*\/|\s)*$/.test(sql)) out.push({ sql, line: startLine });
  };
  while (i < text.length) {
    const c = text[i];
    if (atStart) {
      if (c === '\n') {
        line++;
        i++;
        continue;
      }
      if (c === ' ' || c === '\t') {
        i++;
        continue;
      }
      if (c === '-' && text[i + 1] === '-') {
        while (i < text.length && text[i] !== '\n') i++;
        continue;
      }
      if (c === '.') {
        // Dot-command: runs to the end of the line.
        let end = text.indexOf('\n', i);
        if (end < 0) end = text.length;
        out.push({ dot: text.slice(i, end).trim(), line });
        i = end;
        continue;
      }
      atStart = false;
      start = i;
      startLine = line;
    }
    if (c === '\n') line++;
    if (c === "'" || c === '"' || c === '`' || c === '[') {
      const close = c === '[' ? ']' : c;
      i++;
      while (i < text.length) {
        if (text[i] === '\n') line++;
        if (text[i] === close) {
          if (close !== ']' && text[i + 1] === close) i += 2;
          else break;
        } else i++;
      }
      i++;
      continue;
    }
    if (c === '-' && text[i + 1] === '-') {
      while (i < text.length && text[i] !== '\n') i++;
      continue;
    }
    if (c === '/' && text[i + 1] === '*') {
      const end = text.indexOf('*/', i + 2);
      const stop = end < 0 ? text.length : end + 2;
      for (let k = i; k < stop; k++) if (text[k] === '\n') line++;
      i = stop;
      continue;
    }
    if (c === ';') {
      push(i + 1);
      atStart = true;
    }
    i++;
  }
  if (!atStart) push(text.length);
  return out;
}

const firstWord = (sql) => (sql.replace(/^(\s|--[^\n]*\n|\/\*[\s\S]*?\*\/)*/, '').match(/^[A-Za-z]+/)?.[0] || '').toUpperCase();

// More "(" than ")" outside quotes — e.g. the book's misprinted CREATE TABLE lines.
const unbalanced = (sql) => {
  const flat = sql.replace(/'(?:[^']|'')*'/g, '');
  return (flat.match(/\(/g) || []).length > (flat.match(/\)/g) || []).length;
};

/** Bangla explanation for an SQLite error message (the original is kept alongside). */
export function explainError(msg, sql = '') {
  let m;
  if ((m = msg.match(/no such table: (\S+)/))) return `"${m[1]}" নামে কোনো টেবিল নেই — বানান দেখো, নাকি আগে CREATE TABLE দিয়ে তৈরি করতে হবে?`;
  if ((m = msg.match(/no such column: (\S+)/))) {
    const word = m[1];
    const quotedOk = new RegExp(`=\\s*${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(sql);
    return quotedOk
      ? `"${word}" নামে কোনো কলাম নেই। এটি যদি টেক্সট মান হয়, তবে কোটেশনে লেখো: '${word}' (টেক্সট মানের শুরু ও শেষে ' চিহ্ন দিতে হয়)।`
      : `"${word}" নামে কোনো কলাম নেই — কলামের নামের বানান দেখো।`;
  }
  if ((m = msg.match(/ambiguous column name: (\S+)/)))
    return `"${m[1]}" কলামটি একাধিক টেবিলে আছে — কোন টেবিলেরটা, তা বলে দাও: টেবিল.কলাম (যেমন result.${m[1]})।`;
  if (/incomplete input/.test(msg) || (/syntax error/.test(msg) && unbalanced(sql))) return 'কুয়েরিটি অসম্পূর্ণ — কোনো বন্ধনী ) বা কোটেশন \' বন্ধ করা হয়নি?';
  if ((m = msg.match(/unrecognized token: "(.*)"/))) return `অচেনা চিহ্ন ${m[1]} — কোটেশন ' খোলা হয়েছে কিন্তু বন্ধ করা হয়নি?`;
  if ((m = msg.match(/near "(.*)": syntax error/))) return `"${m[1]}"-এর কাছে লেখার নিয়মে ভুল (syntax error) — কমা, বন্ধনী, কি-ওয়ার্ডের বানান ও ক্রম দেখো।`;
  if ((m = msg.match(/UNIQUE constraint failed: (.+)/)))
    return `একই মান আগে থেকেই আছে — ${m[1]} কলামে UNIQUE ইনডেক্স বা প্রাইমারি কি থাকায় ডুপ্লিকেট রাখা যাবে না।`;
  if ((m = msg.match(/NOT NULL constraint failed: (.+)/))) return `${m[1]} ফাঁকা (NULL) রাখা যাবে না।`;
  if (/FOREIGN KEY constraint failed/.test(msg)) return 'ফরেন কি-র মানটি মূল (প্যারেন্ট) টেবিলের প্রাইমারি কি-তে নেই — সম্পর্ক ভেঙে যাবে বলে ডেটাবেজ এটি করতে দেয়নি।';
  if ((m = msg.match(/table (\S+) already exists/))) return `"${m[1]}" টেবিল আগে থেকেই আছে। নতুন করে বানাতে চাইলে আগে DROP TABLE ${m[1]}; দাও।`;
  if ((m = msg.match(/index (\S+) already exists/))) return `"${m[1]}" নামে ইনডেক্স আগে থেকেই আছে।`;
  if ((m = msg.match(/no such index: (\S+)/))) return `"${m[1]}" নামে কোনো ইনডেক্স নেই।`;
  if ((m = msg.match(/table (\S+) has (\d+) columns but (\d+) values were supplied/)))
    return `${m[1]} টেবিলে কলাম ${m[2]}টি, কিন্তু মান দেওয়া হয়েছে ${m[3]}টি — সংখ্যা মেলাও।`;
  if ((m = msg.match(/(\d+) values for (\d+) columns/))) return `কলামের নাম ${m[2]}টি, কিন্তু মান ${m[1]}টি — প্রতিটি কলামের জন্য একটি করে মান দাও।`;
  if ((m = msg.match(/table (\S+) has no column named (\S+)/))) return `${m[1]} টেবিলে "${m[2]}" নামে কোনো কলাম নেই।`;
  if (/datatype mismatch/.test(msg)) return 'ডেটা টাইপ মেলেনি — INTEGER PRIMARY KEY কলামে কেবল পূর্ণসংখ্যা রাখা যায়।';
  if (/no tables specified/.test(msg)) return 'FROM দিয়ে টেবিলের নাম বলা হয়নি।';
  return null;
}

/** Warnings for statements that run but are probably not what the student meant. */
export function warnFor(sql) {
  const kind = firstWord(sql);
  const flat = sql.replace(/'(?:[^']|'')*'/g, "''");
  if ((kind === 'DELETE' || kind === 'UPDATE') && !/\bWHERE\b/i.test(flat))
    return kind === 'DELETE'
      ? 'WHERE ছাড়া DELETE দেওয়ায় টেবিলের সব রেকর্ড মুছে গেছে!'
      : 'WHERE ছাড়া UPDATE দেওয়ায় টেবিলের সব রেকর্ড বদলে গেছে!';
  if (/(=|<>|!=)\s*NULL\b/i.test(flat)) return '= NULL কখনো সত্য হয় না — NULL খুঁজতে লেখো IS NULL (না-খুঁজতে IS NOT NULL)।';
  return null;
}

const DOT_INFO = {
  '.mode': 'আউটপুট এখানে সবসময় টেবিল আকারে দেখানো হয় — .mode লাগে না।',
  '.headers': 'কলামের নাম এখানে সবসময় দেখানো হয় — .headers on লাগে না।',
  '.quit': 'এসকিউলাইট টার্মিনালে .quit দিলে প্রোগ্রাম বন্ধ হয়; এখানে কিছু হয় না।',
  '.exit': 'এসকিউলাইট টার্মিনালে .exit দিলে প্রোগ্রাম বন্ধ হয়; এখানে কিছু হয় না।',
  '.open': 'এখানে একটিই ডেটাবেজ — নতুন ফাইল খোলার দরকার নেই।',
};

const userTables = (db) =>
  (db.exec("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY rowid")[0]?.values || []).map((r) => r[0]);

const quoteId = (name) => `"${String(name).replace(/"/g, '""')}"`;

/** Every user table with its columns and rows (rowid kept for change tracking when the table has one). */
export function snapshot(db) {
  return userTables(db).map((name) => {
    const info = db.exec(`PRAGMA table_info(${quoteId(name)})`)[0]?.values || [];
    const columns = info.map((c) => ({ name: c[1], type: c[2], pk: c[5] > 0, notNull: !!c[3] }));
    const fks = (db.exec(`PRAGMA foreign_key_list(${quoteId(name)})`)[0]?.values || []).map((f) => ({ from: f[3], table: f[2], to: f[4] }));
    for (const fk of fks) {
      const col = columns.find((c) => c.name === fk.from);
      if (col) col.fk = `${fk.table}.${fk.to ?? ''}`;
    }
    let res;
    try {
      res = runOne(db, `SELECT rowid AS __rowid, * FROM ${quoteId(name)}`);
    } catch {
      res = runOne(db, `SELECT NULL AS __rowid, * FROM ${quoteId(name)}`); // WITHOUT ROWID tables
    }
    const rows = res.rows.map((v) => ({ rowid: v[0], cells: v.slice(1) }));
    const indexes = (db.exec(`PRAGMA index_list(${quoteId(name)})`)[0]?.values || [])
      .filter((ix) => !String(ix[1]).startsWith('sqlite_autoindex'))
      .map((ix) => ({
        name: ix[1],
        unique: !!ix[2],
        columns: (db.exec(`PRAGMA index_info(${quoteId(ix[1])})`)[0]?.values || []).map((c) => c[2]),
      }));
    return { name, columns, rows, indexes };
  });
}

function runDot(db, cmd) {
  const [word, arg] = cmd.split(/\s+/);
  if (word === '.tables') return { kind: 'note', message: userTables(db).join('   ') || '(কোনো টেবিল নেই)' };
  if (word === '.schema') {
    const where = arg ? `AND tbl_name = '${arg.replace(/'/g, "''")}'` : '';
    const rows = db.exec(`SELECT sql FROM sqlite_master WHERE sql NOT NULL ${where} ORDER BY rowid`)[0]?.values || [];
    return { kind: 'note', message: rows.map((r) => r[0] + ';').join('\n') || '(কিছু নেই)', mono: true };
  }
  return { kind: 'note', message: DOT_INFO[word] || `${word} এসকিউলাইট টার্মিনালের কমান্ড — এই ল্যাবে দরকার নেই।` };
}

// INTEGER values come back as BigInt, REAL as number: show REAL like the sqlite3 shell does (79.0, not 79).
const cell = (v) => (typeof v === 'bigint' ? Number(v) : typeof v === 'number' && Number.isInteger(v) ? v.toFixed(1) : v);

/** Runs one statement; returns { kind: 'rows', columns, rows } or { kind: 'ok', changes }. Throws on SQL errors. */
function runOne(db, sql) {
  const stmt = db.prepare(sql);
  try {
    const columns = stmt.getColumnNames();
    const rows = [];
    while (stmt.step()) rows.push(stmt.get(null, { useBigInt: true }).map(cell));
    if (columns.length) return { kind: 'rows', columns, rows };
  } finally {
    stmt.free();
  }
  return { kind: 'ok', changes: db.getRowsModified() };
}

export function openDb(SQL, setup) {
  const db = new SQL.Database();
  db.run('PRAGMA foreign_keys = ON;');
  const init = setupSql(setup);
  if (init) db.exec(init);
  return db;
}

/**
 * Runs `script` on a fresh database built from `setup`. Stops at the first error (later statements are not run).
 * Returns { results: [{ sql, line, kind, ... }], before, after, error } where before/after are table snapshots.
 */
export function runScript(SQL, setup, script) {
  const db = openDb(SQL, setup);
  try {
    const before = snapshot(db);
    const results = [];
    let error = null;
    for (const st of splitStatements(script)) {
      if (st.dot) {
        results.push({ sql: st.dot, line: st.line, ...runDot(db, st.dot) });
        continue;
      }
      try {
        const r = runOne(db, st.sql);
        const kind = firstWord(st.sql);
        results.push({ sql: st.sql, line: st.line, verb: kind, ...r, warning: warnFor(st.sql) });
      } catch (e) {
        const msg = String(e.message || e);
        error = { sql: st.sql, line: st.line, kind: 'error', message: msg, bangla: explainError(msg, st.sql) };
        results.push(error);
        break;
      }
    }
    return { results, before, after: snapshot(db), error };
  } finally {
    db.close();
  }
}

/** Result of the last SELECT in a run (or null). */
export const lastRows = (run) => [...run.results].reverse().find((r) => r.kind === 'rows') || null;

const norm = (v) => (typeof v === 'number' ? Number(v.toFixed(6)) : v);
const rowKey = (r) => JSON.stringify(r.map(norm));

/** Same rows (and same order when `ordered`). Column names are ignored, the column count must match. */
export function sameRows(a, b, ordered) {
  if (!a || !b || a.rows.length !== b.rows.length || a.columns.length !== b.columns.length) return false;
  const ka = a.rows.map(rowKey);
  const kb = b.rows.map(rowKey);
  if (!ordered) {
    ka.sort();
    kb.sort();
  }
  return ka.every((k, i) => k === kb[i]);
}

/**
 * Task check. task = { solution, check? }. Without `check`, one of the student's SELECTs must return the same rows as
 * the solution's last SELECT (in order when the solution uses ORDER BY). With `check` (a SELECT), it is run after both scripts
 * and the database states compared — for INSERT/UPDATE/DELETE/CREATE tasks.
 */
export function checkTask(SQL, setup, script, task, run) {
  const studentRun = run || runScript(SQL, setup, script);
  if (task.check) {
    if (studentRun.error) return false;
    const after = (s) => {
      const db = openDb(SQL, setup);
      try {
        for (const st of splitStatements(s)) if (!st.dot) runOne(db, st.sql);
        return runOne(db, task.check);
      } catch {
        return null;
      } finally {
        db.close();
      }
    };
    const want = after(task.solution);
    const got = after(script);
    return !!want && !!got && sameRows(got, want, /\bORDER\s+BY\b/i.test(task.check));
  }
  const want = lastRows(runScript(SQL, setup, task.solution));
  const ordered = /\bORDER\s+BY\b/i.test(task.solution);
  return studentRun.results.some((r) => r.kind === 'rows' && sameRows(r, want, ordered));
}
