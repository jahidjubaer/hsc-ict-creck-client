import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { CheckCircle2, XCircle } from 'lucide-react';
import { evaluate, parse, rowsFor, show, subExpressions, variables } from './boolean';

function useExpr(src) {
  return useMemo(() => {
    if (!src.trim()) return { ast: null, error: null };
    try {
      return { ast: parse(src), error: null };
    } catch (e) {
      return { ast: null, error: e.message };
    }
  }, [src]);
}

const bit = (v) => (v ? 1 : 0);
const KEYS = ["'", '.', '+', '⊕', '(', ')'];

function ExprInput({ label, value, onChange, error }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-base-content/60">{label}</span>
      <input
        className={clsx('input w-full font-mono text-lg', error && 'input-error')}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        autoCapitalize="characters"
      />
      {error && <span className="mt-1 block text-sm text-error">{error}</span>}
    </label>
  );
}

/**
 * Boolean expression → truth table. With `compare`, shows both outputs and whether they are equivalent.
 * props: expr, compare?, steps? (show intermediate columns)
 */
export function TruthTable({ expr = "A'B + AB'", compare, steps: initSteps = false }) {
  const [src, setSrc] = useState(expr);
  const [cmp, setCmp] = useState(compare ?? '');
  const [steps, setSteps] = useState(initSteps);
  const [focus, setFocus] = useState('main');
  const main = useExpr(src);
  const other = useExpr(cmp);
  const comparing = compare !== undefined;

  const table = useMemo(() => {
    if (!main.ast || (comparing && cmp.trim() && !other.ast)) return null;
    const vars = [...new Set([...variables(main.ast), ...(other.ast ? variables(other.ast) : [])])].sort();
    if (vars.length > 4) return null;
    const cols = steps ? subExpressions(main.ast).slice(0, -1) : [];
    const rows = rowsFor(vars).map((env) => ({
      env,
      mids: cols.map((c) => evaluate(c, env)),
      y: evaluate(main.ast, env),
      z: other.ast ? evaluate(other.ast, env) : null,
    }));
    return { vars, cols, rows, equal: other.ast ? rows.every((r) => r.y === r.z) : null };
  }, [main.ast, other.ast, steps, comparing, cmp]);

  const insert = (k) => {
    if (focus === 'cmp') setCmp((s) => s + k);
    else setSrc((s) => s + k);
  };

  return (
    <div className="space-y-4">
      <div className={clsx('grid gap-3', comparing && 'sm:grid-cols-2')}>
        <div onFocusCapture={() => setFocus('main')}>
          <ExprInput label={comparing ? 'বাম পক্ষ (Y)' : 'বুলিয়ান রাশি (Y)'} value={src} onChange={setSrc} error={main.error} />
        </div>
        {comparing && (
          <div onFocusCapture={() => setFocus('cmp')}>
            <ExprInput label="ডান পক্ষ (Z)" value={cmp} onChange={setCmp} error={other.error} />
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {KEYS.map((k) => (
          <button key={k} type="button" className="btn btn-xs btn-ghost border-base-300 font-mono" onClick={() => insert(k)}>
            {k}
          </button>
        ))}
        <label className="label ml-auto cursor-pointer gap-2 text-sm">
          <input type="checkbox" className="toggle toggle-sm toggle-primary" checked={steps} onChange={(e) => setSteps(e.target.checked)} />
          ধাপগুলো দেখাও
        </label>
      </div>
      <p className="text-xs text-base-content/50">
        NOT = <code>A'</code>, AND = <code>A.B</code> বা <code>AB</code>, OR = <code>A+B</code>, XOR = <code>A⊕B</code> — চলক A থেকে D।
      </p>

      {main.ast && !table && !other.error && <p className="text-sm text-warning">সর্বোচ্চ ৪টি চলক (A–D) ব্যবহার করা যাবে।</p>}

      {table && (
        <div className="space-y-3">
          <div className="overflow-x-auto rounded-xl border border-base-300">
            <table className="table table-sm bg-base-100 text-center font-mono">
              <thead>
                <tr>
                  {table.vars.map((v) => (
                    <th key={v} className="text-center">
                      {v}
                    </th>
                  ))}
                  {table.cols.map((c, i) => (
                    <th key={i} className="text-center font-normal whitespace-nowrap text-base-content/60">
                      {show(c)}
                    </th>
                  ))}
                  <th className="text-center whitespace-nowrap text-primary">Y = {show(main.ast)}</th>
                  {other.ast && <th className="text-center whitespace-nowrap text-secondary">Z = {show(other.ast)}</th>}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((r, i) => (
                  <tr key={i} className={clsx(r.z !== null && r.y !== r.z && 'bg-error/10')}>
                    {table.vars.map((v) => (
                      <td key={v}>{bit(r.env[v])}</td>
                    ))}
                    {r.mids.map((m, j) => (
                      <td key={j} className="text-base-content/60">
                        {bit(m)}
                      </td>
                    ))}
                    <td className={clsx('font-bold', r.y && 'text-primary')}>{bit(r.y)}</td>
                    {r.z !== null && <td className={clsx('font-bold', r.z && 'text-secondary')}>{bit(r.z)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {table.equal !== null &&
            (table.equal ? (
              <p className="flex items-center gap-2 rounded-xl bg-success/10 p-3 text-sm font-semibold text-success">
                <CheckCircle2 className="size-5" /> সব সারিতে Y = Z — রাশি দুটি সমতুল্য (উপপাদ্যটি প্রমাণিত)।
              </p>
            ) : (
              <p className="flex items-center gap-2 rounded-xl bg-error/10 p-3 text-sm font-semibold text-error">
                <XCircle className="size-5" /> লাল সারিগুলোতে Y ≠ Z — রাশি দুটি সমতুল্য নয়।
              </p>
            ))}
        </div>
      )}
    </div>
  );
}
