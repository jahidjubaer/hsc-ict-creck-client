import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { ArrowDownToLine, ArrowRightToLine, Minus, Plus, RotateCcw, Scissors, Trophy } from 'lucide-react';
import { toBn } from '@/lib/bn';
import { CodeBlock } from '@/components/lesson/blocks/CodeBlock';

// Ready-made tables. spans: [row, col, rowspan, colspan]; text: row-major cell texts (anchors only).
const PRESETS = {
  bill: {
    caption: 'Bill Summary',
    rows: 5,
    cols: 4,
    headerRows: 2,
    spans: [
      [0, 0, 2, 1],
      [0, 1, 1, 3],
    ],
    text: [
      ['Month', 'Bills'],
      ['Electricity', 'Water', 'Gas'],
      ['January', '809', '600', '850'],
      ['February', '955', '720', '700'],
      ['March', '1123', '812', '775'],
    ],
  },
  cq: {
    rows: 3,
    cols: 4,
    headerRows: 0,
    spans: [
      [0, 0, 1, 2],
      [0, 2, 1, 2],
      [1, 0, 1, 4],
    ],
    text: [['Google, Yahoo', 'map.jpg'], ['ICT'], ['a²–b²', 'ab', 'H₂O', '']],
  },
  routine: {
    caption: 'Class Routine',
    rows: 4,
    cols: 5,
    headerRows: 1,
    spans: [
      [1, 3, 3, 1],
    ],
    text: [
      ['Day', '1st', '2nd', '3rd', '4th'],
      ['Sun', 'Bangla', 'ICT', 'Break', 'Physics'],
      ['Mon', 'English', 'Math', 'Chemistry'],
      ['Tue', 'ICT', 'Biology', 'Math'],
    ],
  },
};

const keyOf = (r, c) => `${r},${c}`;

/** Build a cell map { 'r,c': { rs, cs, text } } holding only anchor cells, normalised to fit rows × cols. */
function normalize(rows, cols, cells) {
  const taken = Array.from({ length: rows }, () => Array(cols).fill(false));
  const out = {};
  const anchors = Object.entries(cells)
    .map(([k, v]) => [...k.split(',').map(Number), v])
    .filter(([r, c]) => r < rows && c < cols)
    .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  for (const [r, c, cell] of anchors) {
    if (taken[r][c]) continue;
    let cs = Math.min(cell.cs, cols - c);
    while (cs > 1 && taken[r].slice(c, c + cs).some(Boolean)) cs--;
    let rs = Math.min(cell.rs, rows - r);
    const rowFree = (rr) => !taken[rr].slice(c, c + cs).some(Boolean);
    let ok = 1;
    while (ok < rs && rowFree(r + ok)) ok++;
    rs = ok;
    for (let i = r; i < r + rs; i++) for (let j = c; j < c + cs; j++) taken[i][j] = true;
    out[keyOf(r, c)] = { ...cell, rs, cs };
  }
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) if (!taken[r][c]) out[keyOf(r, c)] = { rs: 1, cs: 1, text: '' };
  return out;
}

function fromPreset(p) {
  const cells = {};
  const spans = new Map((p.spans || []).map(([r, c, rs, cs]) => [keyOf(r, c), { rs, cs }]));
  // walk row-major, assigning texts to anchor positions in order
  const taken = Array.from({ length: p.rows }, () => Array(p.cols).fill(false));
  for (let r = 0; r < p.rows; r++) {
    let t = 0;
    for (let c = 0; c < p.cols; c++) {
      if (taken[r][c]) continue;
      const { rs, cs } = spans.get(keyOf(r, c)) || { rs: 1, cs: 1 };
      for (let i = r; i < r + rs && i < p.rows; i++) for (let j = c; j < c + cs && j < p.cols; j++) taken[i][j] = true;
      cells[keyOf(r, c)] = { rs, cs, text: p.text?.[r]?.[t++] ?? '' };
    }
  }
  return normalize(p.rows, p.cols, cells);
}

const spanSignature = (cells) =>
  Object.entries(cells)
    .filter(([, v]) => v.rs > 1 || v.cs > 1)
    .map(([k, v]) => `${k}:${v.rs}x${v.cs}`)
    .sort()
    .join('|');

function owner(cells, rows, cols) {
  const grid = Array.from({ length: rows }, () => Array(cols).fill(null));
  for (const [k, v] of Object.entries(cells)) {
    const [r, c] = k.split(',').map(Number);
    for (let i = r; i < r + v.rs; i++) for (let j = c; j < c + v.cs; j++) grid[i][j] = k;
  }
  return grid;
}

function toHtml({ cells, rows, cols, headerRows, caption, explain }) {
  const grid = owner(cells, rows, cols);
  const lines = ['<table border="1" cellspacing="0" cellpadding="6">'];
  if (caption) lines.push(`  <caption>${caption}</caption>`);
  for (let r = 0; r < rows; r++) {
    const tag = r < headerRows ? 'th' : 'td';
    const parts = [];
    const fromAbove = [];
    for (let c = 0; c < cols; c++) {
      const cell = cells[keyOf(r, c)];
      if (!cell) {
        if (Number(grid[r][c].split(',')[0]) < r) fromAbove.push(toBn(c + 1));
        continue;
      }
      const attrs = (cell.rs > 1 ? ` rowspan="${cell.rs}"` : '') + (cell.cs > 1 ? ` colspan="${cell.cs}"` : '');
      parts.push(`<${tag}${attrs}>${cell.text}</${tag}>`);
    }
    if (explain && fromAbove.length) {
      lines.push(`  <!-- কলাম ${fromAbove.join(', ')}-এর ঘর উপরের সারির rowspan দখল করেছে, তাই এই সারিতে বাদ -->`);
    }
    lines.push(`  <tr>${parts.join('')}</tr>`);
  }
  lines.push('</table>');
  return lines.join('\n');
}

/**
 * Table builder: select a cell, merge it right (colspan) or down (rowspan), split it, edit text;
 * the HTML code updates live. Props: preset ('bill' | 'cq' | 'routine'), rows, cols, headerRows,
 * target (a preset name — the student must rebuild that table's merged cells from a plain grid).
 */
export function TableBuilder({ preset, rows: r0 = 3, cols: c0 = 3, headerRows: h0 = 1, target }) {
  const goal = target ? PRESETS[target] : null;
  const start = useMemo(() => {
    if (goal) {
      const blank = { ...goal, spans: [], text: [] };
      return { ...blank, cells: fromPreset(blank) };
    }
    const p = PRESETS[preset] || { rows: r0, cols: c0, headerRows: h0, spans: [] };
    return { ...p, cells: fromPreset(p) };
  }, [preset, goal, r0, c0, h0]);

  const [rows, setRows] = useState(start.rows);
  const [cols, setCols] = useState(start.cols);
  const [headerRows, setHeaderRows] = useState(start.headerRows ?? 1);
  const [caption, setCaption] = useState(start.caption || '');
  const [cells, setCells] = useState(start.cells);
  const [sel, setSel] = useState(null);
  const [explain, setExplain] = useState(true);

  const selected = sel && cells[sel] ? sel : null;
  const [sr, sc] = selected ? selected.split(',').map(Number) : [];
  const cur = selected ? cells[selected] : null;

  const isSingleAnchor = (r, c) => {
    const k = keyOf(r, c);
    return cells[k] && cells[k].rs === 1 && cells[k].cs === 1;
  };
  const canRight = cur && sc + cur.cs < cols && Array.from({ length: cur.rs }, (_, i) => sr + i).every((r) => isSingleAnchor(r, sc + cur.cs));
  const canDown = cur && sr + cur.rs < rows && Array.from({ length: cur.cs }, (_, j) => sc + j).every((c) => isSingleAnchor(sr + cur.rs, c));

  const update = (next, r = rows, c = cols) => setCells(normalize(r, c, next));
  const merge = (dir) => {
    const next = { ...cells };
    const cell = { ...cur };
    if (dir === 'right') {
      for (let i = 0; i < cur.rs; i++) {
        const k = keyOf(sr + i, sc + cur.cs);
        if (next[k]?.text && !cell.text) cell.text = next[k].text;
        delete next[k];
      }
      cell.cs++;
    } else {
      for (let j = 0; j < cur.cs; j++) {
        const k = keyOf(sr + cur.rs, sc + j);
        if (next[k]?.text && !cell.text) cell.text = next[k].text;
        delete next[k];
      }
      cell.rs++;
    }
    next[selected] = cell;
    update(next);
  };
  const split = () => update({ ...cells, [selected]: { ...cur, rs: 1, cs: 1 } });
  const setText = (text) => setCells({ ...cells, [selected]: { ...cur, text } });
  const resize = (dr, dc) => {
    const r = Math.min(8, Math.max(1, rows + dr));
    const c = Math.min(6, Math.max(1, cols + dc));
    setRows(r);
    setCols(c);
    update(cells, r, c);
  };
  const reset = () => {
    setRows(start.rows);
    setCols(start.cols);
    setHeaderRows(start.headerRows ?? 1);
    setCaption(start.caption || '');
    setCells(start.cells);
    setSel(null);
  };

  const code = toHtml({ cells, rows, cols, headerRows, caption, explain });
  const solved = goal && rows === goal.rows && cols === goal.cols && spanSignature(cells) === spanSignature(fromPreset(goal));
  const goalCells = goal ? fromPreset(goal) : null;

  return (
    <div className="space-y-4">
      {goal && (
        <div className={clsx('rounded-xl border p-3', solved ? 'border-success bg-success/10' : 'border-base-300 bg-base-200/50')}>
          <p className="mb-2 text-sm font-bold">
            {solved ? (
              <span className="flex items-center gap-1.5 text-success">
                <Trophy className="size-4" /> দারুণ! ঘর মেশানো হুবহু মিলেছে।
                <button type="button" className="btn btn-success btn-xs ml-2" onClick={() => setCells(goalCells)}>
                  লেখাগুলো বসাও
                </button>
              </span>
            ) : (
              'চ্যালেঞ্জ: নিচের ফাঁকা গ্রিডে ঘর মিশিয়ে এই টেবিলটি বানাও'
            )}
          </p>
          <MiniTable cells={goalCells} rows={goal.rows} cols={goal.cols} headerRows={goal.headerRows} />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <Stepper label="সারি (tr)" value={rows} onMinus={() => resize(-1, 0)} onPlus={() => resize(1, 0)} />
        <Stepper label="কলাম" value={cols} onMinus={() => resize(0, -1)} onPlus={() => resize(0, 1)} />
        <Stepper label="হেডার সারি (th)" value={headerRows} onMinus={() => setHeaderRows(Math.max(0, headerRows - 1))} onPlus={() => setHeaderRows(Math.min(rows, headerRows + 1))} />
        <button type="button" className="btn btn-ghost btn-xs ml-auto" onClick={reset}>
          <RotateCcw className="size-3.5" /> রিসেট
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="mx-auto border-collapse text-sm">
          <tbody>
            {Array.from({ length: rows }, (_, r) => (
              <tr key={r}>
                {Array.from({ length: cols }, (_, c) => {
                  const k = keyOf(r, c);
                  const cell = cells[k];
                  if (!cell) return null;
                  const Tag = r < headerRows ? 'th' : 'td';
                  return (
                    <Tag
                      key={k}
                      rowSpan={cell.rs}
                      colSpan={cell.cs}
                      onClick={() => setSel(k)}
                      className={clsx(
                        'relative h-11 min-w-20 cursor-pointer border-2 px-2 text-center transition-colors',
                        k === selected ? 'border-primary bg-primary/15' : 'border-base-300 hover:bg-base-200',
                        Tag === 'th' && 'bg-base-200 font-bold',
                        (cell.rs > 1 || cell.cs > 1) && k !== selected && 'bg-secondary/10',
                      )}
                    >
                      {cell.text || <span className="text-base-content/25">({toBn(r + 1)},{toBn(c + 1)})</span>}
                      {(cell.rs > 1 || cell.cs > 1) && (
                        <span className="absolute top-0.5 right-1 font-mono text-[10px] text-secondary">
                          {cell.rs > 1 && `rs${cell.rs}`} {cell.cs > 1 && `cs${cell.cs}`}
                        </span>
                      )}
                    </Tag>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {cur ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-base-200/60 p-3">
          <input
            className="input input-sm w-36"
            value={cur.text}
            onChange={(e) => setText(e.target.value)}
            placeholder="ঘরের লেখা"
            aria-label="ঘরের লেখা"
          />
          <button type="button" className="btn btn-sm btn-primary" disabled={!canRight} onClick={() => merge('right')}>
            <ArrowRightToLine className="size-4" /> ডানে মেশাও <span className="font-mono text-xs">colspan</span>
          </button>
          <button type="button" className="btn btn-sm btn-secondary" disabled={!canDown} onClick={() => merge('down')}>
            <ArrowDownToLine className="size-4" /> নিচে মেশাও <span className="font-mono text-xs">rowspan</span>
          </button>
          <button type="button" className="btn btn-sm btn-ghost" disabled={cur.rs === 1 && cur.cs === 1} onClick={split}>
            <Scissors className="size-4" /> ভাঙো
          </button>
        </div>
      ) : (
        <p className="rounded-xl bg-base-200/60 p-3 text-sm text-base-content/60">একটি ঘরে ক্লিক করো — তারপর লেখা বসাও বা পাশের/নিচের ঘরের সাথে মেশাও।</p>
      )}

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <label className="flex items-center gap-2">
          <span>caption</span>
          <input className="input input-sm w-40" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="(ঐচ্ছিক)" />
        </label>
        <label className="flex cursor-pointer items-center gap-2">
          <input type="checkbox" className="toggle toggle-sm" checked={explain} onChange={(e) => setExplain(e.target.checked)} />
          বাদ পড়া ঘরের ব্যাখ্যা (কমেন্ট)
        </label>
      </div>

      <RowCount cells={cells} rows={rows} cols={cols} />
      <CodeBlock lang="html" code={code} title="তৈরি হওয়া HTML কোড" preview />
    </div>
  );
}

function Stepper({ label, value, onMinus, onPlus }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="text-base-content/70">{label}</span>
      <button type="button" className="btn btn-xs btn-square" onClick={onMinus} aria-label={`${label} কমাও`}>
        <Minus className="size-3" />
      </button>
      <span className="w-5 text-center font-bold">{toBn(value)}</span>
      <button type="button" className="btn btn-xs btn-square" onClick={onPlus} aria-label={`${label} বাড়াও`}>
        <Plus className="size-3" />
      </button>
    </span>
  );
}

// How many td/th each <tr> really contains — the key idea students miss with rowspan.
function RowCount({ cells, rows, cols }) {
  const counts = Array.from({ length: rows }, (_, r) => Array.from({ length: cols }, (_, c) => cells[keyOf(r, c)]).filter(Boolean).length);
  if (counts.every((n) => n === cols)) return null;
  return (
    <p className="text-sm text-base-content/70">
      প্রতি সারিতে ঘর (td/th) লিখতে হবে:{' '}
      {counts.map((n, r) => (
        <span key={r} className={clsx('badge badge-sm mx-0.5', n < cols ? 'badge-secondary' : 'badge-ghost')}>
          সারি {toBn(r + 1)}: {toBn(n)}টি
        </span>
      ))}
    </p>
  );
}

function MiniTable({ cells, rows, cols, headerRows = 0 }) {
  return (
    <table className="mx-auto border-collapse text-xs">
      <tbody>
        {Array.from({ length: rows }, (_, r) => (
          <tr key={r}>
            {Array.from({ length: cols }, (_, c) => {
              const cell = cells[keyOf(r, c)];
              if (!cell) return null;
              const Tag = r < headerRows ? 'th' : 'td';
              return (
                <Tag key={c} rowSpan={cell.rs} colSpan={cell.cs} className="border border-base-content/40 px-2 py-1 text-center">
                  {cell.text}
                </Tag>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
