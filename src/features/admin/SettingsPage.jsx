import { useState } from 'react';
import toast from 'react-hot-toast';
import { Save } from 'lucide-react';
import { QueryError } from '@/components/ui/QueryError';
import { METHOD } from '@/features/subscription/format';
import { useAdminAction, useAdminSettings } from './queries';

function PaymentSettingsForm({ initial }) {
  const save = useAdminAction();
  const [s, setS] = useState(initial);
  const setMethod = (m, patch) => setS((old) => ({ ...old, [m]: { ...old[m], ...patch } }));

  return (
    <section className="card-soft max-w-2xl space-y-5 p-5">
      <div>
        <h2 className="font-bold">পেমেন্ট নম্বর</h2>
        <p className="text-sm text-base-content/60">শিক্ষার্থীরা এই নম্বরে টাকা পাঠাবে। পার্সোনাল হলে তারা “Send Money”, মার্চেন্ট হলে “Payment” ব্যবহার করবে।</p>
      </div>
      {['bkash', 'nagad'].map((m) => (
        <fieldset key={m} className="space-y-2 rounded-box border border-base-300 p-4">
          <legend className="px-1 font-semibold" style={{ color: METHOD[m].color }}>
            {METHOD[m].name} ({METHOD[m].en})
          </legend>
          <div className="flex flex-wrap items-end gap-3">
            <label>
              <span className="mb-1 block text-xs">নম্বর</span>
              <input
                className="input input-sm w-44 font-mono"
                inputMode="tel"
                value={s[m].number}
                onChange={(e) => setMethod(m, { number: e.target.value.trim() })}
                placeholder="01XXXXXXXXX"
              />
            </label>
            <label>
              <span className="mb-1 block text-xs">অ্যাকাউন্টের ধরন</span>
              <select className="select select-sm w-auto" value={s[m].type} onChange={(e) => setMethod(m, { type: e.target.value })}>
                <option value="personal">পার্সোনাল</option>
                <option value="merchant">মার্চেন্ট</option>
              </select>
            </label>
            <label className="label cursor-pointer gap-2 text-sm">
              <input type="checkbox" className="toggle toggle-sm toggle-success" checked={s[m].enabled} onChange={(e) => setMethod(m, { enabled: e.target.checked })} />
              {s[m].enabled ? 'চালু' : 'বন্ধ'}
            </label>
          </div>
        </fieldset>
      ))}
      <label className="block">
        <span className="mb-1 block text-sm font-medium">শিক্ষার্থীদের জন্য নোট (ঐচ্ছিক)</span>
        <input
          className="input input-sm w-full"
          value={s.note}
          onChange={(e) => setS((old) => ({ ...old, note: e.target.value }))}
          placeholder="যেমন: সমস্যা হলে WhatsApp 01XXXXXXXXX"
        />
      </label>
      <button
        type="button"
        className="btn btn-primary btn-sm"
        disabled={save.isPending}
        onClick={() => save.mutate({ method: 'put', url: '/admin/settings/payment', body: s }, { onSuccess: () => toast.success('সংরক্ষণ হয়েছে') })}
      >
        <Save className="size-4" /> সংরক্ষণ করো
      </button>
    </section>
  );
}

export default function SettingsPage() {
  const { data, isLoading, error, refetch } = useAdminSettings();
  if (isLoading) return <div className="skeleton h-64 rounded-box" />;
  if (error) return <QueryError error={error} onRetry={refetch} />;
  return <PaymentSettingsForm initial={data.payment} />;
}
