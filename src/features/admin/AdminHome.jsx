import { Link } from 'react-router';
import { Bot, Crown, Hourglass, UserPlus, Users, Wallet } from 'lucide-react';
import { QueryError } from '@/components/ui/QueryError';
import { bnNumber, toBn } from '@/lib/bn';
import { useAdminStats } from './queries';

function Stat({ icon: Icon, label, value, sub, to, tone = 'text-primary' }) {
  const body = (
    <div className="card-soft h-full p-4 transition hover:border-primary/40">
      <Icon className={`size-5 ${tone}`} />
      <p className="mt-2 text-2xl font-bold">{value}</p>
      <p className="text-sm text-base-content/70">{label}</p>
      {sub && <p className="mt-1 text-xs text-base-content/55">{sub}</p>}
    </div>
  );
  return to ? <Link to={to}>{body}</Link> : body;
}

export default function AdminHome() {
  const { data: s, isLoading, error, refetch } = useAdminStats();
  if (isLoading) return <div className="skeleton h-48 rounded-box" />;
  if (error) return <QueryError error={error} onRetry={refetch} />;

  return (
    <div className="space-y-6">
      {s.pendingPayments > 0 && (
        <Link to="/admin/payments" className="alert alert-warning alert-soft">
          <Hourglass className="size-5" />
          <span>
            <b>{toBn(s.pendingPayments)}টি পেমেন্ট</b> যাচাইয়ের অপেক্ষায় — বিকাশ/নগদ অ্যাপে TrxID মিলিয়ে অনুমোদন দাও।
          </span>
        </Link>
      )}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={Wallet} label="এ মাসের আয়" value={`৳${bnNumber(s.revenueMonth)}`} sub={`${toBn(s.paymentsMonth)}টি অনুমোদিত পেমেন্ট`} tone="text-success" />
        <Stat icon={Users} label="মোট শিক্ষার্থী" value={bnNumber(s.users)} to="/admin/users" />
        <Stat icon={UserPlus} label="গত ৭ দিনে নতুন" value={bnNumber(s.newUsersWeek)} to="/admin/users" />
        <Stat icon={Hourglass} label="অপেক্ষমাণ পেমেন্ট" value={bnNumber(s.pendingPayments)} to="/admin/payments" tone="text-warning" />
        <Stat icon={Crown} label="প্রিমিয়াম" value={bnNumber(s.premium)} to="/admin/users?filter=premium" tone="text-amber-500" />
        <Stat icon={Users} label="ট্রায়ালে" value={bnNumber(s.trial)} to="/admin/users?filter=trial" tone="text-info" />
        <Stat icon={Users} label="মেয়াদ শেষ" value={bnNumber(s.expired)} to="/admin/users?filter=expired" tone="text-error" />
        <Stat
          icon={Bot}
          label="AI মূল্যায়ন (৭ দিন)"
          value={bnNumber(s.ai.week)}
          sub={`${toBn(s.ai.unreviewed)} দেখা বাকি · ${toBn(s.ai.bad)} খারাপ`}
          to="/admin/ai"
          tone="text-secondary"
        />
      </div>
    </div>
  );
}
