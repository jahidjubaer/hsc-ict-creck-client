import { useState } from 'react';
import { Link } from 'react-router';
import { Check, Copy, TriangleAlert, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { QueryError } from '@/components/ui/QueryError';
import { bnDate, bnNumber, toBn } from '@/lib/bn';
import { METHOD, PLAN_NAME } from '@/features/subscription/format';
import { Empty, ListSkeleton, Pager, SearchBox, Segments } from './components';
import { useAdminAction, useAdminPayments } from './queries';

const STATUS = [
  { value: 'pending', label: 'অপেক্ষমাণ' },
  { value: 'approved', label: 'অনুমোদিত' },
  { value: 'rejected', label: 'বাতিল' },
  { value: 'all', label: 'সব' },
];
const STATUS_BADGE = { pending: 'badge-warning', approved: 'badge-success', rejected: 'badge-error' };
const STATUS_LABEL = { pending: 'পর্যালোচনা চলছে', approved: 'অনুমোদিত', rejected: 'বাতিল' };
const REASONS = [
  'এই ট্রানজেকশন আইডি আমাদের অ্যাকাউন্টে পাওয়া যায়নি',
  'টাকার পরিমাণ প্যাকেজের দামের সাথে মেলেনি',
  'প্রেরকের নম্বর ট্রানজেকশনের সাথে মেলেনি',
];

const when = (d) => bnDate(d, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

function RejectForm({ onReject, onCancel, busy }) {
  const [reason, setReason] = useState(REASONS[0]);
  const [custom, setCustom] = useState('');
  const final = reason === 'other' ? custom.trim() : reason;
  return (
    <div className="space-y-2 rounded-box bg-error/5 p-3">
      <select className="select select-sm w-full" value={reason} onChange={(e) => setReason(e.target.value)} aria-label="বাতিলের কারণ">
        {REASONS.map((r) => (
          <option key={r}>{r}</option>
        ))}
        <option value="other">অন্য কারণ…</option>
      </select>
      {reason === 'other' && (
        <input className="input input-sm w-full" value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="কারণ লেখো (শিক্ষার্থী দেখবে)" />
      )}
      <div className="flex gap-2">
        <button type="button" className="btn btn-error btn-sm" disabled={busy || final.length < 3} onClick={() => onReject(final)}>
          বাতিল নিশ্চিত করো
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>
          থাক
        </button>
      </div>
    </div>
  );
}

function PaymentCard({ p }) {
  const action = useAdminAction();
  const [mode, setMode] = useState(null); // 'approve' | 'reject'
  const u = p.user;
  const copy = () => navigator.clipboard?.writeText(p.trxId).then(() => toast.success('TrxID কপি হয়েছে'));

  return (
    <li className="card-soft space-y-3 p-4">
      <div className="flex flex-wrap items-start gap-2">
        <div className="min-w-0 flex-1">
          {u ? (
            <Link to={`/admin/users/${u._id}`} className="link-hover font-semibold">
              {u.name}
            </Link>
          ) : (
            <span className="font-semibold">(মুছে ফেলা অ্যাকাউন্ট)</span>
          )}
          <p className="truncate text-xs text-base-content/60">
            {u?.email} {u?.phone && `· ${u.phone}`}
          </p>
        </div>
        <span className={`badge badge-soft ${STATUS_BADGE[p.status]}`}>{STATUS_LABEL[p.status]}</span>
      </div>

      <div className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
        <p>
          প্যাকেজ: <b>{PLAN_NAME[p.plan]}</b> · <b>৳{bnNumber(p.amount)}</b>
        </p>
        <p>
          মাধ্যম: <b style={{ color: METHOD[p.method]?.color }}>{METHOD[p.method]?.name}</b> → {p.payTo}
        </p>
        <p>
          প্রেরক: <span className="font-mono font-semibold">{p.senderNumber}</span>
        </p>
        <p className="flex items-center gap-1">
          TrxID: <span className="font-mono text-base font-bold">{p.trxId}</span>
          <button type="button" className="btn btn-ghost btn-xs btn-square" onClick={copy} aria-label="TrxID কপি করো">
            <Copy className="size-3.5" />
          </button>
        </p>
        <p className="text-xs text-base-content/60">জমা: {when(p.createdAt)}</p>
        {p.reviewedAt && (
          <p className="text-xs text-base-content/60">
            {p.status === 'approved' ? 'অনুমোদন' : 'বাতিল'}: {when(p.reviewedAt)} {p.reviewedBy && `· ${p.reviewedBy.name}`}
          </p>
        )}
      </div>

      {(p.hints.senderAccounts > 1 || p.hints.rejectedBefore > 0) && (
        <p className="flex items-start gap-1.5 text-xs text-warning">
          <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
          {p.hints.senderAccounts > 1 && `এই প্রেরক নম্বর থেকে ${toBn(p.hints.senderAccounts)}টি অ্যাকাউন্টের পেমেন্ট এসেছে। `}
          {p.hints.rejectedBefore > 0 && `এই শিক্ষার্থীর আগে ${toBn(p.hints.rejectedBefore)}টি পেমেন্ট বাতিল হয়েছে।`}
        </p>
      )}
      {p.status === 'approved' && p.periodEnd && (
        <p className="text-xs text-success">
          মেয়াদ দেওয়া হয়েছে: {bnDate(p.periodStart)} – {bnDate(p.periodEnd)}
        </p>
      )}
      {p.status === 'rejected' && p.rejectReason && <p className="text-xs text-error">কারণ: {p.rejectReason}</p>}

      {p.status !== 'approved' && mode === null && (
        <div className="flex gap-2">
          <button type="button" className="btn btn-success btn-sm" onClick={() => setMode('approve')}>
            <Check className="size-4" /> {p.status === 'rejected' ? 'তবুও অনুমোদন দাও' : 'অনুমোদন'}
          </button>
          {p.status === 'pending' && (
            <button type="button" className="btn btn-outline btn-error btn-sm" onClick={() => setMode('reject')}>
              <X className="size-4" /> বাতিল
            </button>
          )}
        </div>
      )}
      {mode === 'approve' && (
        <div className="flex flex-wrap items-center gap-2 rounded-box bg-success/10 p-3 text-sm">
          <span>
            {METHOD[p.method]?.name} অ্যাপে <b className="font-mono">{p.trxId}</b> · ৳{bnNumber(p.amount)} মিলিয়েছ?
          </span>
          <button
            type="button"
            className="btn btn-success btn-sm"
            disabled={action.isPending}
            onClick={() =>
              action.mutate(
                { url: `/admin/payments/${p._id}/approve` },
                { onSuccess: () => toast.success(`${u?.name ?? ''} — প্রিমিয়াম চালু হয়েছে`) }
              )
            }
          >
            হ্যাঁ, চালু করো
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setMode(null)}>
            থাক
          </button>
        </div>
      )}
      {mode === 'reject' && (
        <RejectForm
          busy={action.isPending}
          onCancel={() => setMode(null)}
          onReject={(reason) =>
            action.mutate({ url: `/admin/payments/${p._id}/reject`, body: { reason } }, { onSuccess: () => toast('বাতিল করা হলো') })
          }
        />
      )}
    </li>
  );
}

export default function PaymentsPage() {
  const [status, setStatus] = useState('pending');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading, error, refetch } = useAdminPayments({ status, q: q.trim(), page });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Segments
          value={status}
          options={STATUS}
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
        />
        <div className="ml-auto">
          <SearchBox
            value={q}
            onChange={(v) => {
              setQ(v);
              setPage(1);
            }}
            placeholder="TrxID, নম্বর, নাম বা ইমেইল"
          />
        </div>
      </div>
      {status === 'pending' && (
        <p className="text-sm text-base-content/60">
          পুরোনোটা আগে। বিকাশ/নগদ অ্যাপের লেনদেন তালিকায় TrxID, পরিমাণ ও প্রেরকের নম্বর মিলিয়ে তারপর অনুমোদন দাও।
        </p>
      )}
      {isLoading ? (
        <ListSkeleton />
      ) : error ? (
        <QueryError error={error} onRetry={refetch} />
      ) : data.payments.length === 0 ? (
        <Empty>{status === 'pending' ? 'কোনো পেমেন্ট অপেক্ষায় নেই 🎉' : 'কিছু পাওয়া যায়নি'}</Empty>
      ) : (
        <>
          <ul className="space-y-3">
            {data.payments.map((p) => (
              <PaymentCard key={p._id} p={p} />
            ))}
          </ul>
          <Pager page={page} total={data.total} pageSize={data.pageSize} onPage={setPage} />
        </>
      )}
    </div>
  );
}
