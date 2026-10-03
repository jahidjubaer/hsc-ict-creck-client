import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { useForm } from 'react-hook-form';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { CheckCircle2, Clock, Copy, Crown, Hourglass, Send, ShieldCheck, Smartphone } from 'lucide-react';
import { errorMessage } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { bnDate, bnNumber, daysLeft, toBn } from '@/lib/bn';
import { QueryError } from '@/components/ui/QueryError';
import { useMyPayments, usePaymentInfo, useSubmitPayment } from './queries';
import { METHOD, PLAN_NAME } from './format';

function StatusHeader({ access }) {
  if (access.kind === 'premium') {
    return (
      <p className="mt-2 text-base-content/70">
        তোমার প্রিমিয়াম চলবে <b>{bnDate(access.endsAt)}</b> পর্যন্ত ({toBn(daysLeft(access.endsAt))} দিন)। এখন নিলে নতুন মেয়াদ
        এর পরে যোগ হবে।
      </p>
    );
  }
  if (access.kind === 'trial') {
    return (
      <p className="mt-2 text-base-content/70">
        ফ্রি ট্রায়ালের আর <b>{toBn(daysLeft(access.endsAt))} দিন</b> বাকি। এখন নিলেও ট্রায়ালের দিন নষ্ট হবে না — প্যাকেজ শুরু হবে
        ট্রায়াল শেষে।
      </p>
    );
  }
  return <p className="mt-2 text-base-content/70">তোমার ফ্রি ট্রায়াল শেষ। প্যাকেজ নিয়ে সব পাঠ ও পরীক্ষা আবার খুলে দাও।</p>;
}

function CopyButton({ text, label }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} কপি হয়েছে`);
    } catch {
      toast.error('কপি করা যায়নি — হাতে লিখে নাও');
    }
  };
  return (
    <button type="button" className="btn btn-ghost btn-sm btn-square" onClick={copy} aria-label={`${label} কপি করো`}>
      <Copy className="size-4" />
    </button>
  );
}

function Steps({ method, plan }) {
  const m = METHOD[method.key];
  const action = method.type === 'merchant' ? 'Payment' : 'Send Money';
  return (
    <ol className="list-decimal space-y-1.5 pl-5 text-sm">
      <li>
        {m.name} অ্যাপ খোলো অথবা <span className="font-mono">{m.ussd}</span> ডায়াল করো।
      </li>
      <li>
        <b>{action}</b> বেছে নাও।
      </li>
      <li>
        নম্বর দাও: <span className="font-mono font-semibold">{method.number}</span>
      </li>
      <li>
        টাকার পরিমাণ: <b>৳{bnNumber(plan.price)}</b> (ঠিক এই পরিমাণ)।
      </li>
      <li>Reference থাকলে তোমার মোবাইল নম্বর লিখতে পারো (ঐচ্ছিক)।</li>
      <li>PIN দিয়ে নিশ্চিত করো। SMS-এ আসা <b>TrxID</b> নিচে লিখে জমা দাও।</li>
    </ol>
  );
}

function PaymentForm({ plan, method, onDone }) {
  const submit = useSubmitPayment();
  const user = useAuthStore((s) => s.user);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { senderNumber: user.phone ?? '', trxId: '' } });

  const onSubmit = (values) =>
    submit.mutate(
      { plan: plan.key, method: method.key, ...values },
      { onSuccess: onDone, onError: (err) => toast.error(errorMessage(err)) }
    );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <label className="block">
        <span className="mb-1 block text-sm font-medium">যে নম্বর থেকে টাকা পাঠিয়েছ</span>
        <input
          className={clsx('input w-full', errors.senderNumber && 'input-error')}
          inputMode="tel"
          autoComplete="tel"
          placeholder="01XXXXXXXXX"
          {...register('senderNumber', { required: 'নম্বরটি লেখো' })}
        />
        {errors.senderNumber && <span className="mt-1 block text-xs text-error">{errors.senderNumber.message}</span>}
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">ট্রানজেকশন আইডি (TrxID)</span>
        <input
          className={clsx('input w-full font-mono uppercase', errors.trxId && 'input-error')}
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          placeholder="যেমন 9A7B6C5D4E"
          {...register('trxId', { required: 'SMS-এ পাওয়া TrxID লেখো' })}
        />
        {errors.trxId && <span className="mt-1 block text-xs text-error">{errors.trxId.message}</span>}
      </label>
      <button className="btn btn-primary w-full" disabled={submit.isPending}>
        {submit.isPending ? <span className="loading loading-spinner loading-sm" /> : <Send className="size-4" />} জমা দাও —
        ৳{bnNumber(plan.price)}
      </button>
      <p className="flex items-start gap-1.5 text-xs text-base-content/60">
        <ShieldCheck className="mt-0.5 size-4 shrink-0" /> আমরা কখনো তোমার PIN বা OTP চাইব না। শুধু TrxID দাও।
      </p>
    </form>
  );
}

function PendingNotice({ payments }) {
  const pending = payments?.filter((p) => p.status === 'pending') ?? [];
  if (!pending.length) return null;
  return (
    <div role="status" className="alert alert-warning alert-soft">
      <Hourglass className="size-5" />
      <div>
        <p className="font-semibold">পেমেন্ট যাচাই চলছে</p>
        <p className="text-sm">
          {pending.map((p) => (
            <span key={p._id} className="mr-3 inline-block">
              {PLAN_NAME[p.plan]} · <span className="font-mono">{p.trxId}</span>
            </span>
          ))}
        </p>
        <p className="text-xs opacity-80">যাচাই হলে এই পেজে বা প্রোফাইলে আপনাআপনি দেখাবে।</p>
      </div>
    </div>
  );
}

function Submitted({ payment }) {
  return (
    <div className="card-soft mx-auto max-w-lg p-8 text-center">
      <CheckCircle2 className="mx-auto size-14 text-success" />
      <h1 className="mt-4 text-2xl font-bold">জমা হয়েছে!</h1>
      <p className="mt-2 text-base-content/70">
        TrxID <span className="font-mono font-semibold">{payment.trxId}</span> যাচাই করা হচ্ছে। সাধারণত কয়েক ঘণ্টার মধ্যে প্যাকেজ চালু
        হয়ে যায় — ততক্ষণ পড়া চালিয়ে যাও।
      </p>
      <div className="mt-6 flex justify-center gap-2">
        <Link to="/profile" className="btn btn-outline">
          <Clock className="size-4" /> স্ট্যাটাস দেখো
        </Link>
        <Link to="/dashboard" className="btn btn-primary">
          ড্যাশবোর্ড
        </Link>
      </div>
    </div>
  );
}

export default function SubscribePage() {
  const { planKey } = useParams();
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, error, refetch } = usePaymentInfo();
  const { data: payments } = useMyPayments({ enabled: user.role !== 'admin' });
  const [planSel, setPlanSel] = useState(planKey);
  const [methodSel, setMethodSel] = useState(null);
  const [done, setDone] = useState(null);

  if (user.role === 'admin') {
    return <p className="card-soft p-6 text-center">অ্যাডমিন অ্যাকাউন্টে সবকিছু খোলা — পেমেন্ট লাগে না।</p>;
  }
  if (done) return <Submitted payment={done} />;
  if (isLoading) return <div className="skeleton h-96 rounded-box" />;
  if (error) return <QueryError error={error} onRetry={refetch} />;

  const plans = data.plans;
  const plan = plans.find((p) => p.key === planSel) ?? plans.find((p) => p.popular) ?? plans[0];
  const method = data.methods.find((m) => m.key === methodSel) ?? data.methods[0];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl">
          <Crown className="size-7 text-amber-500" /> প্রিমিয়াম নাও
        </h1>
        <StatusHeader access={user.access} />
      </header>

      <PendingNotice payments={payments} />

      <section>
        <h2 className="mb-3 font-semibold">১. প্যাকেজ বেছে নাও</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {plans.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPlanSel(p.key)}
              aria-pressed={p.key === plan.key}
              className={clsx(
                'card-soft relative p-4 text-left transition',
                p.key === plan.key ? 'border-2 border-primary bg-primary/5' : 'hover:border-primary/40'
              )}
            >
              {p.popular && <span className="badge badge-primary badge-xs absolute -top-2 right-3">জনপ্রিয়</span>}
              <span className="block font-semibold">{p.name}</span>
              <span className="block text-2xl font-bold">৳{bnNumber(p.price)}</span>
              <span className="block text-xs text-success">
                {p.months > 1 ? `মাসে ৳${toBn(Math.round(p.price / p.months))}` : 'মাসিক'}
              </span>
            </button>
          ))}
        </div>
      </section>

      {data.methods.length === 0 ? (
        <div className="alert alert-info alert-soft">
          <Smartphone className="size-5" />
          <span>অনলাইন পেমেন্ট শীঘ্রই চালু হচ্ছে। এখনই নিতে চাইলে আমাদের সাথে যোগাযোগ করো।</span>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="card-soft space-y-4 p-5">
            <h2 className="font-semibold">২. টাকা পাঠাও</h2>
            {data.methods.length > 1 && (
              <div role="tablist" className="tabs tabs-box">
                {data.methods.map((m) => (
                  <button
                    key={m.key}
                    role="tab"
                    type="button"
                    className={clsx('tab flex-1', m.key === method.key && 'tab-active')}
                    onClick={() => setMethodSel(m.key)}
                  >
                    {METHOD[m.key].name}
                  </button>
                ))}
              </div>
            )}
            <div className="rounded-box border-2 p-4" style={{ borderColor: METHOD[method.key].color }}>
              <p className="text-sm font-semibold" style={{ color: METHOD[method.key].color }}>
                {METHOD[method.key].name} ({METHOD[method.key].en}) · {method.type === 'merchant' ? 'মার্চেন্ট' : 'পার্সোনাল'}
              </p>
              <div className="mt-1 flex items-center gap-1">
                <span className="font-mono text-2xl font-bold tracking-wide">{method.number}</span>
                <CopyButton text={method.number} label="নম্বর" />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-lg">
                  পরিমাণ: <b>৳{bnNumber(plan.price)}</b>
                </span>
                <CopyButton text={String(plan.price)} label="পরিমাণ" />
              </div>
            </div>
            <Steps method={method} plan={plan} />
            {data.note && <p className="text-sm text-base-content/70">{data.note}</p>}
          </section>

          <section className="card-soft space-y-4 p-5">
            <h2 className="font-semibold">৩. তথ্য জমা দাও</h2>
            <p className="text-sm text-base-content/70">
              {PLAN_NAME[plan.key]} প্যাকেজ · {METHOD[method.key].name} · ৳{bnNumber(plan.price)}
            </p>
            <PaymentForm plan={plan} method={method} onDone={setDone} />
          </section>
        </div>
      )}
    </div>
  );
}
