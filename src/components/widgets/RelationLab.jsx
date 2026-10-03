import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { AlertTriangle, CheckCircle2, KeyRound, Link2, MousePointerClick, Plus, RotateCcw, XCircle } from 'lucide-react';
import { toBn } from '@/lib/bn';

// Tables from the book's §6.2.3 (docs/book-notes/ch6.md) and CQ-1. A link joins child.fk → parent.pk.
const STUDENT_INFO = {
  name: 'student_info',
  columns: [{ name: 'Roll', type: 'integer', pk: true }, { name: 'Name', type: 'text' }, { name: 'Class', type: 'integer' }],
  rows: [
    [1, 'Mizanur Rahman', 6],
    [2, 'Mosharraf Hossain', 7],
    [3, 'Subir Kumar', 6],
  ],
};

const PRESETS = {
  'one-one': {
    tables: [
      STUDENT_INFO,
      {
        name: 'student_contact',
        columns: [
          { name: 'ID', type: 'integer', pk: true },
          { name: 'Roll', type: 'integer', fk: true },
          { name: 'Phone', type: 'text' },
          { name: 'Email', type: 'text' },
          { name: 'Address', type: 'text' },
        ],
        rows: [
          [1, 1, '012345678', 'mizan@email.com', 'Adabor, Shyamoli, Dhaka'],
          [2, 2, '012345543', 'mosharraf@email.com', 'Sector 3, Uttara, Dhaka'],
          [3, 3, '014343678', 'subir@email.com', 'College Road, Mymensingh'],
        ],
      },
    ],
    links: [{ child: 'student_contact', fk: 'Roll', parent: 'student_info', pk: 'Roll' }],
  },
  'one-many': {
    tables: [
      STUDENT_INFO,
      {
        name: 'result',
        columns: [
          { name: 'ID', type: 'integer', pk: true },
          { name: 'Roll', type: 'integer', fk: true },
          { name: 'Subject', type: 'text' },
          { name: 'Marks', type: 'decimal' },
        ],
        rows: [
          [1, 1, 'Bangla', 70],
          [2, 1, 'English', 76],
          [3, 2, 'Bangla', 68],
          [4, 2, 'English', 81],
        ],
      },
    ],
    links: [{ child: 'result', fk: 'Roll', parent: 'student_info', pk: 'Roll' }],
  },
  'many-many': {
    tables: [
      STUDENT_INFO,
      {
        name: 'student_club',
        columns: [{ name: 'Roll', type: 'integer', fk: true }, { name: 'club_name', type: 'text', fk: true }],
        rows: [
          [1, 'Cricket Club'],
          [2, 'Cricket Club'],
          [2, 'Football Club'],
          [2, 'Chess Club'],
          [2, 'Debating Club'],
        ],
      },
      {
        name: 'club',
        columns: [{ name: 'Name', type: 'text', pk: true }, { name: 'Moderator', type: 'text' }, { name: 'Established', type: 'date' }],
        rows: [
          ['Cricket Club', 'Mr. Ruhul Amin', '1-1-2000'],
          ['Football Club', 'Mr. Shahidul Islam', '5-1-1998'],
          ['Debating Club', 'Mr. Sumon Kumar', '3-7-2002'],
          ['Chess Club', 'Ms. Fatema Akhter', '1-1-2001'],
        ],
      },
    ],
    links: [
      { child: 'student_club', fk: 'Roll', parent: 'student_info', pk: 'Roll' },
      { child: 'student_club', fk: 'club_name', parent: 'club', pk: 'Name' },
    ],
  },
  // Book CQ-1 (the third TID is misprinted "10." in the book; 103 is meant).
  teacher: {
    tables: [
      {
        name: 'Teacher',
        columns: [{ name: 'TID', type: 'integer', pk: true }, { name: 'T Name', type: 'text' }, { name: 'Subject', type: 'text' }],
        rows: [
          [101, 'Mr. Rayhan', 'English'],
          [102, 'Mr. Kaiser', 'ICT'],
          [103, 'Mr. Yaqub', 'Biology'],
        ],
      },
      {
        name: 'Routine',
        columns: [{ name: 'TID', type: 'integer', fk: true }, { name: 'Group', type: 'text' }, { name: 'Time', type: 'time' }],
        rows: [
          [101, 'Science', '10:00'],
          [101, 'Humanities', '10:45'],
          [102, 'Science', '10:45'],
          [102, 'B. Studies', '10:00'],
          [103, 'Science', '11:30'],
        ],
      },
    ],
    links: [{ child: 'Routine', fk: 'TID', parent: 'Teacher', pk: 'TID' }],
  },
};

const TYPE_NAME = { '1:1': 'ওয়ান টু ওয়ান (১:১)', '1:N': 'ওয়ান টু মেনি (১:N)', 'M:N': 'মেনি টু মেনি (M:N)' };

const tableOf = (tables, name) => tables.find((t) => t.name === name);
const colIndex = (t, col) => t.columns.findIndex((c) => c.name === col);

/** 1:1 when every foreign-key value appears at most once in the child table, otherwise 1:N. */
const linkType = (tables, l) => {
  const child = tableOf(tables, l.child);
  const vals = child.rows.map((r) => r[colIndex(child, l.fk)]);
  return new Set(vals).size === vals.length ? '1:1' : '1:N';
};

/** Overall relation of the preset: a junction table with two foreign keys makes the outer tables M:N. */
const overall = (tables, links) => (links.length === 2 && links[0].child === links[1].child ? 'M:N' : linkType(tables, links[0]));

/** Rows related to the selected row, following the links one step (and through a junction table). */
function related(tables, links, sel) {
  const out = {};
  const mark = (table, i) => (out[table] ||= new Set()).add(i);
  const visit = (tName, rowIdx, from) => {
    const t = tableOf(tables, tName);
    for (const l of links) {
      if (l === from) continue;
      if (l.parent === tName) {
        const key = t.rows[rowIdx][colIndex(t, l.pk)];
        const child = tableOf(tables, l.child);
        child.rows.forEach((r, i) => {
          if (r[colIndex(child, l.fk)] === key) {
            mark(l.child, i);
            if (!from) visit(l.child, i, l);
          }
        });
      } else if (l.child === tName) {
        const key = t.rows[rowIdx][colIndex(t, l.fk)];
        const parent = tableOf(tables, l.parent);
        parent.rows.forEach((r, i) => {
          if (r[colIndex(parent, l.pk)] === key) mark(l.parent, i);
        });
      }
    }
  };
  if (sel) visit(sel.table, sel.row, null);
  return out;
}

function Diagram({ tables, links, hide }) {
  const order = tables.map((t) => t.name);
  const W = 190;
  const gap = tables.length === 3 ? 60 : 120;
  const width = tables.length * W + (tables.length - 1) * gap;
  const x = (name) => order.indexOf(name) * (W + gap);
  const H = (t) => 34 + t.columns.length * 20;
  const height = Math.max(...tables.map(H)) + 8;
  return (
    <svg viewBox={`-4 -4 ${width + 8} ${height + 8}`} className="mx-auto h-auto w-full max-w-2xl" role="img" aria-label="টেবিলগুলোর সম্পর্কের চিত্র">
      {links.map((l, i) => {
        const pt = tableOf(tables, l.parent);
        const ct = tableOf(tables, l.child);
        // In a quiz the line joins the table headers, so it does not give away the joining column.
        const py = hide ? 14 : 34 + colIndex(pt, l.pk) * 20 + 10;
        const cy = hide ? 14 : 34 + colIndex(ct, l.fk) * 20 + 10;
        const left = x(l.parent) < x(l.child);
        const x1 = left ? x(l.parent) + W : x(l.parent);
        const x2 = left ? x(l.child) : x(l.child) + W;
        const many = linkType(tables, l) === '1:N';
        const mid = (x1 + x2) / 2;
        return (
          <g key={i} className="text-base-content">
            <path d={`M${x1} ${py} H${mid} V${cy} H${x2}`} fill="none" stroke="currentColor" strokeWidth="1.6" />
            <text x={x1 + (left ? 6 : -6)} y={py - 5} textAnchor={left ? 'start' : 'end'} fontSize="13" fontWeight="700" fill="#d97706">
              {hide ? '?' : '1'}
            </text>
            <text x={x2 + (left ? -6 : 6)} y={cy - 5} textAnchor={left ? 'end' : 'start'} fontSize="13" fontWeight="700" fill="#d97706">
              {hide ? '?' : many ? 'N' : '1'}
            </text>
          </g>
        );
      })}
      {tables.map((t) => (
        <g key={t.name} transform={`translate(${x(t.name)} 0)`}>
          <rect width={W} height={H(t)} rx="8" className="fill-base-100 stroke-base-content/40" strokeWidth="1.4" />
          <rect width={W} height="28" rx="8" className="fill-primary/20" />
          <text x={W / 2} y="19" textAnchor="middle" fontSize="13" fontWeight="700" className="fill-base-content" fontFamily="monospace">
            {t.name}
          </text>
          {t.columns.map((c, i) => (
            <text key={c.name} x="10" y={34 + i * 20 + 14} fontSize="12" fontFamily="monospace" className="fill-base-content">
              {c.name}
              <tspan fill={c.pk ? '#d97706' : '#0284c7'} fontWeight="700">
                {c.pk ? '  PK' : c.fk && !hide ? '  FK' : ''}
              </tspan>
            </text>
          ))}
        </g>
      ))}
    </svg>
  );
}

function DataTable({ table, sel, hits, onPick, hideFk }) {
  return (
    <div className="min-w-0">
      <p className="mb-1 font-mono text-sm font-bold">{table.name}</p>
      <div className="overflow-x-auto rounded-lg border border-base-300">
        <table className="table-xs table w-full">
          <thead className="bg-base-200">
            <tr>
              {table.columns.map((c) => (
                <th key={c.name} className="normal-case">
                  <span className="flex items-center gap-1 font-mono">
                    {c.pk && <KeyRound className="size-3 text-amber-500" />}
                    {c.fk && !hideFk && <Link2 className="size-3 text-sky-500" />}
                    {c.name}
                  </span>
                  <span className="block text-[10px] font-normal text-base-content/50">
                    {c.type}
                    {c.pk ? ' · primary key' : c.fk && !hideFk ? ' · foreign key' : ''}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((r, i) => {
              const picked = sel?.table === table.name && sel.row === i;
              const hit = hits?.has(i);
              return (
                <tr
                  key={i}
                  onClick={() => onPick(picked ? null : { table: table.name, row: i })}
                  className={clsx('cursor-pointer transition-colors', picked ? 'bg-primary/25' : hit ? 'bg-amber-300/35' : 'hover:bg-base-200')}
                >
                  {r.map((v, k) => (
                    <td key={k} className="whitespace-nowrap font-mono">
                      {v}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RelationMode({ preset, quiz }) {
  const { tables, links } = PRESETS[preset] || PRESETS['one-many'];
  const [sel, setSel] = useState(null);
  const [joinCol, setJoinCol] = useState(null);
  const [kind, setKind] = useState(null);
  const hits = related(tables, links, sel);
  const type = overall(tables, links);
  const solved = !quiz || (joinCol === links[0].fk && kind === type);

  const explain = () => {
    if (!sel) return null;
    const t = tableOf(tables, sel.table);
    const row = t.rows[sel.row];
    const parts = Object.entries(hits)
      .filter(([name]) => name !== sel.table)
      .map(([name, set]) => `${name} টেবিলে ${toBn(set.size)}টি রো`);
    return (
      <>
        <b className="font-mono">{sel.table}</b>-এর রো <span className="font-mono">({row.join(', ')})</span> → {parts.length ? parts.join(', ') : 'অন্য টেবিলে কোনো রো নেই'}
      </>
    );
  };

  const commonCols = tables[1].columns.map((c) => c.name).filter((n) => tables[0].columns.some((c) => c.name === n) || n === links[0].fk);

  return (
    <div className="space-y-3">
      <Diagram tables={tables} links={links} hide={!solved} />
      {solved && (
        <p className="rounded-lg bg-success/10 p-2 text-center text-sm">
          সম্পর্ক: <b>{TYPE_NAME[type]}</b>
          {type === 'M:N' && ` — ${tables[1].name} সংযোগ টেবিল (junction table) দিয়ে`}
        </p>
      )}

      {quiz && (
        <div className="space-y-2 rounded-xl border border-base-300 bg-base-200/50 p-3 text-sm">
          <p className="font-bold">১. কোন কলাম দিয়ে টেবিল দুটি যুক্ত করা যায়?</p>
          <div className="flex flex-wrap gap-1">
            {[...new Set([...tables[0].columns.map((c) => c.name), ...commonCols])].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setJoinCol(n)}
                className={clsx(
                  'btn btn-xs font-mono normal-case',
                  joinCol === n ? (n === links[0].fk ? 'btn-success' : 'btn-error') : 'btn-outline',
                )}
              >
                {n}
              </button>
            ))}
          </div>
          {joinCol && joinCol !== links[0].fk && <p className="text-error">এই কলাম দুই টেবিলেই একই অর্থে নেই — আবার দেখো।</p>}
          <p className="pt-1 font-bold">২. সম্পর্কের ধরন কী?</p>
          <div className="flex flex-wrap gap-1">
            {Object.keys(TYPE_NAME).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={clsx('btn btn-xs', kind === k ? (k === type ? 'btn-success' : 'btn-error') : 'btn-outline')}
              >
                {TYPE_NAME[k]}
              </button>
            ))}
          </div>
          {kind && kind !== type && <p className="text-error">একটি রো বেছে নিয়ে দেখো — অন্য টেবিলের কয়টি রো-এর সঙ্গে মেলে?</p>}
          {solved && (
            <p className="flex items-center gap-1.5 text-success">
              <CheckCircle2 className="size-4" /> ঠিক! {links[0].parent}-এর {links[0].pk} প্রাইমারি কি, {links[0].child}-এ এটি ফরেন কি।
            </p>
          )}
        </div>
      )}

      <p className="flex items-center gap-1.5 text-xs text-base-content/60">
        <MousePointerClick className="size-3.5" /> যেকোনো রো-তে চাপ দাও — অন্য টেবিলে তার সঙ্গে সম্পর্কিত রো হলুদ হবে।
      </p>
      <div className={clsx('grid gap-3', tables.length === 2 ? 'md:grid-cols-2' : 'lg:grid-cols-3')}>
        {tables.map((t) => (
          <DataTable key={t.name} table={t} sel={sel} hits={hits[t.name]} onPick={setSel} hideFk={!solved} />
        ))}
      </div>
      <p className="min-h-6 text-sm">{explain()}</p>
    </div>
  );
}

// Book §6.2 "শিক্ষার্থী" table; the extra rows show why some columns that look unique are not keys.
const KEY_TABLE = {
  columns: ['শিক্ষার্থীর নাম', 'রোল নম্বর', 'শ্রেণি', 'শাখা', 'অভিভাবকের নাম', 'ফোন নম্বর'],
  rows: [
    ['মিজানুর রহমান', '১', '৪', 'দিবা', 'আব্দুর রহমান', '০২০৩০২'],
    ['মোশাররফ হোসেন', '২', '৪', 'দিবা', 'সেলিনা খাতুন', '০২০৩০৪'],
    ['সৌরভ দাস', '১', '৫', 'প্রভাতি', 'অজয় দাস', '০৩০৪০২'],
    ['শাকিল মিয়া', '৩', '৫', 'প্রভাতি', 'মনসুর মিয়া', null],
  ],
  extra: [
    ['মিজানুর রহমান', '১', '৪', 'প্রভাতি', 'করিম উদ্দিন', '০৪০৫০১'],
    ['রাকিব মিয়া', '৩', '৪', 'দিবা', 'মনসুর মিয়া', null],
  ],
  // Columns that may look unique in a few rows but can repeat in real life.
  unsafe: {
    'শিক্ষার্থীর নাম': 'একই নামে একাধিক শিক্ষার্থী থাকতে পারে',
    'অভিভাবকের নাম': 'দুই ভাইবোনের অভিভাবক একই জন',
    'ফোন নম্বর': 'সবার ফোন নম্বর নাও থাকতে পারে, ভাইবোনের নম্বরও এক হতে পারে',
  },
};

function KeyMode() {
  const [picked, setPicked] = useState([]);
  const [more, setMore] = useState(false);
  const [withId, setWithId] = useState(false);
  const columns = withId ? ['id', ...KEY_TABLE.columns] : KEY_TABLE.columns;
  const all = useMemo(() => {
    const base = [...KEY_TABLE.rows, ...KEY_TABLE.extra];
    return withId ? base.map((r, i) => [toBn(i + 1), ...r]) : base;
  }, [withId]);
  const rows = more ? all : all.slice(0, KEY_TABLE.rows.length);

  const toggle = (c) => setPicked((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]));
  const idx = picked.map((c) => columns.indexOf(c));
  const keyOf = (r, cols = idx) => JSON.stringify(cols.map((i) => r[i]));
  // Uniqueness is judged on every student who could join (the extra rows too), not only on the rows shown.
  const keyWorks = (cols) => new Set(all.map((r) => keyOf(r, cols))).size === all.length && !all.some((r) => cols.some((i) => r[i] === null));

  const nullRows = new Set(rows.flatMap((r, i) => (idx.some((k) => r[k] === null) ? [i] : [])));
  const counts = {};
  rows.forEach((r) => (counts[keyOf(r)] = (counts[keyOf(r)] || 0) + 1));
  const dupRows = new Set(rows.flatMap((r, i) => (counts[keyOf(r)] > 1 ? [i] : [])));
  const unsafe = picked.filter((c) => KEY_TABLE.unsafe[c]);
  const smaller = idx.length > 1 && idx.some((_, j) => keyWorks(idx.filter((__, k) => k !== j)));

  let verdict = null;
  if (picked.length) {
    if (nullRows.size) verdict = { ok: false, text: 'কোনো রো-তে মান নেই (NULL) — প্রাইমারি কি কখনো ফাঁকা থাকতে পারে না।' };
    else if (dupRows.size) verdict = { ok: false, text: 'লাল রো-গুলোতে একই মান — এ কলাম দিয়ে প্রতিটি রেকর্ডকে আলাদা করা যায় না।' };
    else if (!keyWorks(idx))
      verdict = { warn: true, text: 'এই কয়েকটি রো-তে মানগুলো আলাদা, কিন্তু নতুন শিক্ষার্থী ভর্তি হলে মিলে যেতে পারে — "আরও শিক্ষার্থী ভর্তি করো" চেপে দেখো।' };
    else if (unsafe.length) verdict = { warn: true, text: `এই কয়েকটি রো-তে আলাদা দেখালেও ${unsafe.map((c) => `${c}: ${KEY_TABLE.unsafe[c]}`).join('; ')} — তাই প্রাইমারি কি হিসেবে নিরাপদ নয়। "আরও শিক্ষার্থী ভর্তি করো" চেপে দেখো।` };
    else if (smaller) verdict = { warn: true, text: 'অনন্য ঠিকই, তবে এর চেয়ে কম কলামেই কাজ হয় — অপ্রয়োজনীয় কলাম বাদ দাও।' };
    else
      verdict = {
        ok: true,
        text:
          picked.length > 1
            ? `প্রাইমারি কি হতে পারে — একাধিক কলাম (${picked.join(' + ')}) মিলে তৈরি, তাই এটি কম্পোজিট কি।`
            : `প্রাইমারি কি হতে পারে — ${picked[0]} দিয়ে প্রতিটি রেকর্ড আলাদাভাবে চেনা যায়।`,
      };
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-1">
        <span className="mr-1 text-sm font-bold">প্রাইমারি কি হিসেবে বাছাই করো:</span>
        {columns.map((c) => (
          <button key={c} type="button" onClick={() => toggle(c)} className={clsx('btn btn-xs', picked.includes(c) ? 'btn-primary' : 'btn-outline')}>
            {picked.includes(c) && <KeyRound className="size-3" />} {c}
          </button>
        ))}
        {picked.length > 0 && (
          <button type="button" className="btn btn-ghost btn-xs" onClick={() => setPicked([])}>
            <RotateCcw className="size-3" />
          </button>
        )}
      </div>
      <div className="overflow-x-auto rounded-lg border border-base-300">
        <table className="table-xs table w-full">
          <caption className="caption-top pb-1 text-left text-sm font-bold">টেবিলের নাম : শিক্ষার্থী</caption>
          <thead className="bg-base-200">
            <tr>
              {columns.map((c) => (
                <th key={c} className={clsx(picked.includes(c) && 'bg-primary/20')}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className={clsx(dupRows.has(i) && 'bg-error/15', i >= KEY_TABLE.rows.length && 'italic')}>
                {r.map((v, k) => (
                  <td key={k} className={clsx(idx.includes(k) && 'font-bold', v === null && idx.includes(k) && 'bg-error/25')}>
                    {v === null ? <span className="text-xs text-base-content/40">NULL</span> : v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {verdict && (
        <p
          className={clsx(
            'flex items-start gap-2 rounded-lg p-2 text-sm',
            verdict.ok ? 'bg-success/15' : verdict.warn ? 'bg-warning/15' : 'bg-error/10',
          )}
        >
          {verdict.ok ? (
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
          ) : verdict.warn ? (
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
          ) : (
            <XCircle className="mt-0.5 size-4 shrink-0 text-error" />
          )}
          {verdict.text}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-sm btn-outline" onClick={() => setMore((m) => !m)}>
          <Plus className="size-4" /> {more ? 'নতুন শিক্ষার্থীদের সরাও' : 'আরও শিক্ষার্থী ভর্তি করো'}
        </button>
        <button type="button" className="btn btn-sm btn-outline" onClick={() => setWithId((w) => !w)}>
          <KeyRound className="size-4" /> {withId ? 'id কলাম সরাও' : 'id কলাম যোগ করো (Auto Increment)'}
        </button>
      </div>
      {withId && (
        <p className="text-xs text-base-content/60">
          id কলামের মান ডেটাবেজ নিজেই ১, ২, ৩… করে বসায় (অটো ইনক্রিমেন্ট) — কখনো দুটি রো-তে একই হয় না, ফাঁকাও থাকে না।
        </p>
      )}
    </div>
  );
}

/**
 * Relation / key visualiser. Props: mode ('relation' | 'key'), preset for relation mode
 * ('one-one' | 'one-many' | 'many-many' | 'teacher'), quiz (true = the student finds the joining column and the
 * relation type before the diagram shows them).
 */
export function RelationLab({ mode = 'relation', preset = 'one-many', quiz = false }) {
  return mode === 'key' ? <KeyMode /> : <RelationMode key={preset} preset={preset} quiz={quiz} />;
}
