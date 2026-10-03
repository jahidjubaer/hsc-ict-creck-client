import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { AlertTriangle, CheckCircle2, Circle, Database, Info, KeyRound, Lightbulb, Link2, Play, RotateCcw, XCircle } from 'lucide-react';
import { toBn } from '@/lib/bn';
import { CodeEditor } from './CodeEditor';
import { loadDraft, saveDraft, storageKey } from './labStorage';
import { checkTask, openDb, runScript, snapshot } from './sql/engine';
import { loadSql } from './sql/loadSql';

const STARTER = 'SELECT * FROM student;';
const KEYS = ['SELECT ', '* ', 'FROM ', 'WHERE ', "''", '=', '<>', 'AND ', 'OR ', '()', ',', ';', 'Tab'];
const MAX_ROWS = 100;

const DONE = {
  CREATE: (r) => (/^\s*CREATE\s+(UNIQUE\s+)?INDEX/i.test(r.sql) ? 'ইনডেক্স তৈরি হয়েছে' : 'টেবিল তৈরি হয়েছে'),
  DROP: (r) => (/^\s*DROP\s+INDEX/i.test(r.sql) ? 'ইনডেক্স মুছে ফেলা হয়েছে' : 'টেবিল মুছে ফেলা হয়েছে'),
  INSERT: (r) => `${toBn(r.changes)}টি রো যোগ হয়েছে`,
  UPDATE: (r) => `${toBn(r.changes)}টি রো পরিবর্তিত হয়েছে`,
  DELETE: (r) => `${toBn(r.changes)}টি রো মুছে গেছে`,
  ALTER: () => 'টেবিলের গঠন বদলানো হয়েছে',
};

function Value({ v }) {
  if (v === null || v === undefined) return <span className="text-xs italic text-base-content/40">NULL</span>;
  if (v === '') return <span className="text-xs text-base-content/40">''</span>;
  return String(v);
}

function ResultTable({ columns, rows }) {
  return (
    <div className="max-h-80 overflow-auto rounded-lg border border-base-300">
      <table className="table-xs table-zebra table w-full font-mono">
        <thead className="sticky top-0 bg-base-200">
          <tr>
            {columns.map((c, i) => (
              <th key={i} className="text-xs normal-case">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, MAX_ROWS).map((r, i) => (
            <tr key={i}>
              {r.map((v, k) => (
                <td key={k} className="whitespace-nowrap">
                  <Value v={v} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <p className="p-2 text-center text-xs text-base-content/50">কোনো রো শর্ত পূরণ করেনি (০টি রো)</p>}
    </div>
  );
}

function StatementResult({ r }) {
  const head = (
    <p className="mb-1 flex items-start gap-2 text-xs text-base-content/60">
      <span className="badge badge-ghost badge-xs mt-0.5 shrink-0">লাইন {toBn(r.line)}</span>
      <code className="line-clamp-2 font-mono [font-variant-ligatures:none]">{r.sql}</code>
    </p>
  );
  if (r.kind === 'error')
    return (
      <div className="rounded-xl border border-error/40 bg-error/10 p-3">
        {head}
        <p className="flex items-start gap-2 text-sm">
          <XCircle className="mt-0.5 size-4 shrink-0 text-error" />
          <span>
            {r.bangla || 'কুয়েরিতে ভুল আছে।'}
            <span className="mt-1 block font-mono text-xs text-base-content/60">Error: {r.message}</span>
          </span>
        </p>
        <p className="mt-2 text-xs text-base-content/50">ভুলের পরের কুয়েরিগুলো চালানো হয়নি।</p>
      </div>
    );
  if (r.kind === 'note')
    return (
      <div className="rounded-xl border border-info/30 bg-info/5 p-3">
        {head}
        <p className={clsx('flex items-start gap-2 text-sm', r.mono && 'whitespace-pre-wrap font-mono text-xs')}>
          <Info className="mt-0.5 size-4 shrink-0 text-info" /> {r.message}
        </p>
      </div>
    );
  return (
    <div className="rounded-xl border border-base-300 p-3">
      {head}
      {r.kind === 'rows' ? (
        <>
          <ResultTable columns={r.columns} rows={r.rows} />
          <p className="mt-1 text-right text-xs text-base-content/50">
            {toBn(r.rows.length)}টি রো{r.rows.length > MAX_ROWS && ` (প্রথম ${toBn(MAX_ROWS)}টি দেখানো হলো)`}
          </p>
        </>
      ) : (
        <p className="flex items-center gap-2 text-sm text-success">
          <CheckCircle2 className="size-4" /> {DONE[r.verb]?.(r) || 'সম্পন্ন হয়েছে'}
        </p>
      )}
      {r.warning && (
        <p className="mt-2 flex items-start gap-2 rounded-lg bg-warning/15 p-2 text-sm">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" /> {r.warning}
        </p>
      )}
    </div>
  );
}

/** The database after the run, with inserted rows (green), changed cells (amber) and a count of deleted rows. */
function DbTables({ before, after }) {
  const [pick, setPick] = useState(null);
  const tables = after || before || [];
  const current = tables.find((t) => t.name === pick) || tables[0];
  const dropped = after ? (before || []).filter((b) => !after.some((t) => t.name === b.name)).map((b) => b.name) : [];
  if (!tables.length)
    return (
      <p className="rounded-xl border border-dashed border-base-300 p-3 text-center text-sm text-base-content/50">
        ডেটাবেজে এখনো কোনো টেবিল নেই{dropped.length > 0 && ` (${dropped.join(', ')} মুছে ফেলা হয়েছে)`}
      </p>
    );
  const old = after && (before || []).find((t) => t.name === current.name);
  const oldRows = new Map((old?.rows || []).map((r) => [r.rowid, r.cells]));
  const deleted = old ? old.rows.filter((r) => !current.rows.some((n) => n.rowid === r.rowid)).length : 0;

  return (
    <div className="rounded-xl border border-base-300 bg-base-200/40 p-3">
      <div className="mb-2 flex flex-wrap items-center gap-1">
        <Database className="size-4 text-primary" />
        <span className="mr-1 text-sm font-bold">ডেটাবেজ</span>
        {tables.map((t) => (
          <button
            key={t.name}
            type="button"
            onClick={() => setPick(t.name)}
            className={clsx('btn btn-xs font-mono normal-case', t.name === current.name ? 'btn-primary' : 'btn-ghost')}
          >
            {t.name} <span className="opacity-60">({toBn(t.rows.length)})</span>
          </button>
        ))}
      </div>
      <div className="max-h-72 overflow-auto rounded-lg border border-base-300 bg-base-100">
        <table className="table-xs table w-full font-mono">
          <thead className="sticky top-0 bg-base-200">
            <tr>
              {current.columns.map((c) => (
                <th key={c.name} className="align-bottom text-xs normal-case">
                  <span className="flex items-center gap-1">
                    {c.pk && <KeyRound className="size-3 text-amber-500" aria-label="primary key" />}
                    {c.fk && <Link2 className="size-3 text-sky-500" aria-label="foreign key" />}
                    {c.name}
                  </span>
                  <span className="block text-[10px] font-normal text-base-content/50">
                    {c.type || '—'}
                    {c.pk && ' · PK'}
                    {c.fk && ` · FK→${c.fk}`}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {current.rows.slice(0, MAX_ROWS).map((r, i) => {
              const prev = r.rowid != null ? oldRows.get(r.rowid) : undefined;
              const isNew = after && old && r.rowid != null && !prev;
              return (
                <tr key={r.rowid ?? i} className={clsx(isNew && 'bg-success/15')}>
                  {r.cells.map((v, k) => (
                    <td key={k} className={clsx('whitespace-nowrap', prev && prev[k] !== v && 'bg-amber-300/30 font-bold')}>
                      <Value v={v} />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
        {current.rows.length === 0 && <p className="p-2 text-center text-xs text-base-content/50">টেবিলটি ফাঁকা</p>}
      </div>
      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-base-content/60">
        {after && old && <span><span className="inline-block size-2.5 rounded-sm bg-success/40" /> নতুন রো</span>}
        {after && old && <span><span className="inline-block size-2.5 rounded-sm bg-amber-300/60" /> বদলানো ঘর</span>}
        {deleted > 0 && <span className="text-error">{toBn(deleted)}টি রো মুছে গেছে</span>}
        {after && !old && <span className="text-success">এই টেবিলটি নতুন তৈরি হয়েছে</span>}
        {dropped.length > 0 && <span className="text-error">মুছে ফেলা টেবিল: {dropped.join(', ')}</span>}
        {current.indexes.map((ix) => (
          <span key={ix.name} className="font-mono">
            {ix.unique ? 'UNIQUE INDEX' : 'INDEX'} {ix.name} ({ix.columns.join(', ')})
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * SQL playground on a real SQLite engine (sql.js) running in the browser.
 * Props: setup (dataset name from sql/datasets.js — 'student', 'join', 'school', 'relations', 'empty' — or SQL),
 * code (starter script), tasks [{ text, solution, check? }], solution (shown by the সমাধান button), height.
 * Every run starts from a fresh copy of the setup database, so a run is repeatable.
 */
export function SqlPlayground({ setup = 'student', code = STARTER, tasks = [], solution, height = 180 }) {
  const key = storageKey('sql-lab', `${setup}\n${code}`);
  const [src, setSrc] = useState(() => loadDraft(key) ?? code);
  const [SQL, setSQL] = useState(null);
  const [failed, setFailed] = useState(false);
  const [run, setRun] = useState(null);
  const [passed, setPassed] = useState(() => tasks.map(() => false));
  useEffect(() => saveDraft(key, src === code ? null : src), [key, src, code]);

  useEffect(() => {
    let live = true;
    loadSql().then(
      (s) => live && setSQL(s),
      () => live && setFailed(true),
    );
    return () => {
      live = false;
    };
  }, []);

  const initial = useMemo(() => {
    if (!SQL) return null;
    const db = openDb(SQL, setup);
    try {
      return snapshot(db);
    } finally {
      db.close();
    }
  }, [SQL, setup]);

  const execute = () => {
    if (!SQL) return;
    const r = runScript(SQL, setup, src);
    setRun(r);
    if (tasks.length) setPassed((p) => tasks.map((t, i) => p[i] || checkTask(SQL, setup, src, t, r)));
  };

  const onKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      execute();
    }
  };

  const done = passed.filter(Boolean).length;

  return (
    <div className="space-y-3">
      {tasks.length > 0 && (
        <div className="rounded-xl border border-base-300 bg-base-200/50 p-3">
          <p className="mb-2 flex items-center justify-between text-sm font-bold">
            <span>কাজ</span>
            <span className={clsx('badge', done === tasks.length ? 'badge-success' : 'badge-ghost')}>
              {toBn(done)}/{toBn(tasks.length)}
            </span>
          </p>
          <ul className="space-y-1 text-sm">
            {tasks.map((t, i) => (
              <li key={i} className={clsx('flex items-start gap-2', passed[i] && 'text-success')}>
                {passed[i] ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> : <Circle className="mt-0.5 size-4 shrink-0 opacity-40" />}
                <span>{t.text}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-base-content/50">কুয়েরি লিখে চালাও — সঠিক ফল এলে কাজে টিক পড়বে।</p>
        </div>
      )}

      <div onKeyDown={onKeyDown}>
        <CodeEditor
          value={src}
          onChange={setSrc}
          language="sql"
          height={height}
          fileName="school.db — sqlite"
          keys={KEYS}
          label="SQL কুয়েরি লেখো"
          errorLine={run?.error?.line}
          actions={
            <>
              {solution && (
                <button type="button" className="btn btn-ghost btn-xs text-white/70" onClick={() => setSrc(solution)}>
                  <Lightbulb className="size-3.5" /> সমাধান
                </button>
              )}
              <button
                type="button"
                className="btn btn-ghost btn-xs text-white/70"
                onClick={() => {
                  setSrc(code);
                  setRun(null);
                }}
                title="শুরুর কোডে ফেরো"
              >
                <RotateCcw className="size-3.5" /> রিসেট
              </button>
              <button type="button" className="btn btn-success btn-xs" onClick={execute} disabled={!SQL} title="Ctrl+Enter">
                {SQL ? <Play className="size-3.5" /> : <span className="loading loading-spinner loading-xs" />} চালাও
              </button>
            </>
          }
        />
      </div>

      {failed && (
        <div className="alert alert-error text-sm">SQL ইঞ্জিন লোড হয়নি — ইন্টারনেট সংযোগ দেখে পেজটি আবার খোলো।</div>
      )}

      {run && (
        <div className="space-y-2">
          {run.results.length === 0 && <p className="text-sm text-base-content/50">চালানোর মতো কোনো কুয়েরি নেই — প্রতিটি কুয়েরির শেষে ; দাও।</p>}
          {run.results.map((r, i) => (
            <StatementResult key={i} r={r} />
          ))}
        </div>
      )}

      {initial && <DbTables before={initial} after={run?.after} />}
      <p className="text-xs text-base-content/50">
        আসল SQLite ইঞ্জিন ব্রাউজারেই চলে। প্রতিবার "চালাও" চাপলে শুরুর ডেটাবেজ থেকে পুরো স্ক্রিপ্ট আবার চলে — তাই ভুল করে মুছে ফেললেও
        ভয় নেই। Ctrl+Enter চাপলেও চলে।
      </p>
    </div>
  );
}
