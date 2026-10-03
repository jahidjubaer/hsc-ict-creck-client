import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowLeft, CalendarPlus, Ban } from 'lucide-react';
import toast from 'react-hot-toast';
import { QueryError } from '@/components/ui/QueryError';
import { bnDate, bnNumber, toBn } from '@/lib/bn';
import { PaymentRow } from '@/features/subscription/PaymentHistory';
import { PLAN_NAME } from '@/features/subscription/format';
import { AccessBadge } from './AccessBadge';
import { useAdminAction, useAdminUser } from './queries';

const KIND_NAME = { topic: 'টপিক কুইজ', chapter: 'অধ্যায় পরীক্ষা', full: 'মডেল টেস্ট' };
const ACTION_NAME = {
  'payment.approve': 'পেমেন্ট অনুমোদন',
  'payment.reject': 'পেমেন্ট বাতিল',
  'user.extend': 'মেয়াদ বাড়ানো',
  'user.cancel': 'বাতিল/শেষ',
  'ai.review': 'AI মূল্যায়ন পর্যালোচনা',
};

function logText(l) {
  const d = l.details ?? {};
  if (l.action === 'user.extend') return `${d.kind === 'trial' ? 'ট্রায়াল' : 'প্রিমিয়াম'} +${toBn(d.days)} দিন${d.note ? ` — ${d.note}` : ''}`;
  if (l.action === 'user.cancel') return `${d.kind === 'trial' ? 'ট্রায়াল' : 'প্রিমিয়াম'} শেষ${d.note ? ` — ${d.note}` : ''}`;
  if (l.action.startsWith('payment.')) return `${d.trxId ?? ''}${d.reason ? ` — ${d.reason}` : ''}`;
  if (l.action === 'ai.review') return `${d.verdict === 'bad' ? 'খারাপ' : 'ঠিক আছে'}${d.to ? ` · নম্বর ${d.from?.join('+')} → ${d.to.join('+')}` : ''}`;
  return '';
}

function AccessActions({ user }) {
  const action = useAdminAction();
  const [kind, setKind] = useState('premium');
  const [days, setDays] = useState(30);
  const [note, setNote] = useState('');
  const [confirmCancel, setConfirmCancel] = useState(null);
  const url = `/admin/users/${user.id}`;
  const hasPremium = user.subscription?.status === 'active' && user.access.kind === 'premium';
  const inTrial = user.access.kind === 'trial';

  return (
    <section className="card-soft space-y-4 p-5">
      <h2 className="font-bold">মেয়াদ</h2>
      <div className="flex flex-wrap items-end gap-2">
        <label>
          <span className="mb-1 block text-xs">কী বাড়াবে</span>
          <select className="select select-sm" value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="premium">প্রিমিয়াম</option>
            <option value="trial">ট্রায়াল</option>
          </select>
        </label>
        <label>
          <span className="mb-1 block text-xs">দিন</span>
          <input type="number" min={1} max={800} className="input input-sm w-24" value={days} onChange={(e) => setDays(e.target.value)} />
        </label>
        <label className="min-w-40 flex-1">
          <span className="mb-1 block text-xs">নোট (ঐচ্ছিক)</span>
          <input className="input input-sm w-full" value={note} onChange={(e) => setNote(e.target.value)} placeholder="যেমন: ক্ষতিপূরণ" />
        </label>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={action.isPending || !(Number(days) >= 1)}
          onClick={() =>
            action.mutate(
              { url: `${url}/extend`, body: { kind, days: Number(days), note: note || undefined } },
              { onSuccess: () => toast.success(`${kind === 'trial' ? 'ট্রায়াল' : 'প্রিমিয়াম'} +${toBn(days)} দিন`) }
            )
          }
        >
          <CalendarPlus className="size-4" /> বাড়াও
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {hasPremium && (
          <button type="button" className="btn btn-outline btn-error btn-sm" onClick={() => setConfirmCancel('premium')}>
            <Ban className="size-4" /> প্রিমিয়াম বাতিল
          </button>
        )}
        {inTrial && !hasPremium && (
          <button type="button" className="btn btn-outline btn-error btn-sm" onClick={() => setConfirmCancel('trial')}>
            <Ban className="size-4" /> ট্রায়াল এখনই শেষ
          </button>
        )}
      </div>
      {confirmCancel && (
        <div className="flex flex-wrap items-center gap-2 rounded-box bg-error/10 p-3 text-sm">
          <span>{confirmCancel === 'premium' ? 'প্রিমিয়াম এখনই বন্ধ হবে (টাকা ফেরতের হিসাব আলাদা)।' : 'ট্রায়াল এখনই শেষ হবে।'} নিশ্চিত?</span>
          <button
            type="button"
            className="btn btn-error btn-sm"
            disabled={action.isPending}
            onClick={() =>
              action.mutate(
                { url: `${url}/cancel`, body: { kind: confirmCancel, note: note || undefined } },
                {
                  onSuccess: () => {
                    setConfirmCancel(null);
                    toast('বাতিল করা হলো');
                  },
                }
              )
            }
          >
            হ্যাঁ
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirmCancel(null)}>
            না
          </button>
        </div>
      )}
    </section>
  );
}

export default function UserDetail() {
  const { id } = useParams();
  const { data, isLoading, error, refetch } = useAdminUser(id);
  if (isLoading) return <div className="skeleton h-64 rounded-box" />;
  if (error) return <QueryError error={error} onRetry={refetch} />;
  const { user, payments, attempts, logs } = data;

  return (
    <div className="space-y-4">
      <Link to="/admin/users" className="btn btn-ghost btn-sm">
        <ArrowLeft className="size-4" /> ইউজার তালিকা
      </Link>
      <div className="grid gap-4 lg:grid-cols-3">
        <section className="card-soft space-y-2 p-5">
          <h1 className="text-xl font-bold">{user.name}</h1>
          <p className="text-sm text-base-content/70">{user.email}</p>
          {user.phone && <p className="text-sm">📱 {user.phone}</p>}
          {(user.college || user.district) && <p className="text-sm text-base-content/70">{[user.college, user.district].filter(Boolean).join(', ')}</p>}
          <AccessBadge access={user.access} long />
          <dl className="grid grid-cols-2 gap-1 pt-2 text-sm">
            <dt className="text-base-content/60">প্যাকেজ</dt>
            <dd>{user.subscription?.plan && user.subscription.plan !== 'none' ? PLAN_NAME[user.subscription.plan] : '—'}</dd>
            <dt className="text-base-content/60">ট্রায়াল শেষ</dt>
            <dd>{bnDate(user.trialEndsAt)}</dd>
            <dt className="text-base-content/60">XP · স্ট্রিক</dt>
            <dd>
              {bnNumber(user.xp)} · {toBn(user.streak?.current ?? 0)} দিন
            </dd>
            <dt className="text-base-content/60">যোগদান</dt>
            <dd>{bnDate(user.createdAt)}</dd>
            <dt className="text-base-content/60">শেষ লগইন</dt>
            <dd>{user.lastLoginAt ? bnDate(user.lastLoginAt) : '—'}</dd>
          </dl>
          {attempts.length > 0 && (
            <ul className="border-t border-base-300 pt-2 text-sm">
              {attempts.map((a) => (
                <li key={a._id}>
                  {KIND_NAME[a._id]}: {toBn(a.n)}টি, গড় {toBn(Math.round(a.avg))}%
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="space-y-4 lg:col-span-2">
          {user.role !== 'admin' && <AccessActions user={user} />}
          <section className="card-soft p-5">
            <h2 className="font-bold">পেমেন্ট</h2>
            {payments.length ? (
              <ul className="divide-y divide-base-300">
                {payments.map((p) => (
                  <PaymentRow key={p._id} p={p} />
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-base-content/60">কোনো পেমেন্ট নেই</p>
            )}
          </section>
          <section className="card-soft p-5">
            <h2 className="font-bold">অ্যাডমিন লগ</h2>
            {logs.length ? (
              <ul className="mt-2 space-y-1.5 text-sm">
                {logs.map((l) => (
                  <li key={l._id} className="flex flex-wrap gap-x-2">
                    <span className="text-base-content/55">{bnDate(l.createdAt, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</span>
                    <b>{ACTION_NAME[l.action] ?? l.action}</b>
                    <span>{logText(l)}</span>
                    <span className="text-base-content/55">— {l.admin?.name}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-base-content/60">এখনো কিছু নেই</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
