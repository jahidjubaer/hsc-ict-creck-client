import { Link } from 'react-router';
import { Receipt } from 'lucide-react';
import { bnDate, bnNumber } from '@/lib/bn';
import { QueryError } from '@/components/ui/QueryError';
import { useMyPayments } from './queries';
import { METHOD, PLAN_NAME, paymentStatus } from './format';

export function PaymentRow({ p }) {
  const st = paymentStatus(p);
  return (
    <li className="space-y-1 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold">{PLAN_NAME[p.plan]} · ৳{bnNumber(p.amount)}</span>
        <span className={`badge badge-soft badge-sm ${st.cls}`}>{st.label}</span>
        <span className="ml-auto text-xs text-base-content/55">{bnDate(p.createdAt)}</span>
      </div>
      <p className="text-xs text-base-content/60">
        {METHOD[p.method]?.name} · {p.senderNumber} · TrxID <span className="font-mono">{p.trxId}</span>
      </p>
      {p.status === 'approved' && p.periodEnd && (
        <p className="text-xs text-base-content/60">
          মেয়াদ: {bnDate(p.periodStart)} – {bnDate(p.periodEnd)}
        </p>
      )}
      {p.status === 'pending' && <p className="text-xs text-base-content/60">সাধারণত কয়েক ঘণ্টার মধ্যে যাচাই করা হয়।</p>}
      {p.status === 'rejected' && p.rejectReason && <p className="text-xs text-error">কারণ: {p.rejectReason}</p>}
    </li>
  );
}

export function PaymentHistory() {
  const { data, isLoading, error, refetch } = useMyPayments();
  return (
    <section className="card-soft p-6">
      <h2 className="flex items-center gap-2 text-lg font-bold">
        <Receipt className="size-5" /> পেমেন্ট হিস্ট্রি
      </h2>
      {isLoading ? (
        <div className="skeleton mt-4 h-20" />
      ) : error ? (
        <QueryError error={error} onRetry={refetch} />
      ) : data.length === 0 ? (
        <p className="mt-3 text-sm text-base-content/60">
          এখনো কোনো পেমেন্ট নেই।{' '}
          <Link to="/subscribe" className="link link-primary">
            প্যাকেজ দেখো
          </Link>
        </p>
      ) : (
        <ul className="mt-2 divide-y divide-base-300">
          {data.map((p) => (
            <PaymentRow key={p._id} p={p} />
          ))}
        </ul>
      )}
    </section>
  );
}
