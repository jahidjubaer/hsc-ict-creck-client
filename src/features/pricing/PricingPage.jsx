import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Check, Crown } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { bnNumber, toBn } from '@/lib/bn';

const INCLUDED = [
  '৬ অধ্যায়ের সব ইন্টারঅ্যাকটিভ পাঠ ও অডিও',
  'টপিক কুইজ, অধ্যায় পরীক্ষা ও মডেল টেস্ট',
  'AI দিয়ে সৃজনশীল উত্তর মূল্যায়ন',
  'বিগত বছরের বোর্ড প্রশ্ন',
  'স্টাডি প্ল্যান, স্ট্রিক, ব্যাজ ও লিডারবোর্ড',
];

export default function PricingPage() {
  const user = useAuthStore((s) => s.user);
  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: async () => (await api.get('/plans')).data.plans,
    staleTime: Infinity,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mx-auto max-w-2xl text-center">
        <Crown className="mx-auto size-10 text-amber-500" />
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">সহজ ও সাশ্রয়ী প্যাকেজ</h1>
        <p className="mt-2 text-base-content/70">
          প্রথম ১৫ দিন সম্পূর্ণ ফ্রি। এরপর বিকাশ বা নগদে পেমেন্ট করে তোমার সুবিধামতো প্যাকেজ নাও। প্রতিটি অধ্যায়ের প্রথম টপিক সবসময় ফ্রি।
        </p>
      </div>

      {isLoading ? (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-96 rounded-box" />
          ))}
        </div>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((p) => {
            const perMonth = Math.round(p.price / p.months);
            return (
              <div
                key={p.key}
                className={`card-soft relative flex flex-col p-6 ${p.popular ? 'border-2 border-primary shadow-xl lg:-translate-y-2' : ''}`}
              >
                {p.popular && <span className="badge badge-primary absolute -top-3 left-1/2 -translate-x-1/2">সবচেয়ে জনপ্রিয়</span>}
                <h2 className="text-lg font-bold">{p.name}</h2>
                <p className="mt-3">
                  <span className="text-4xl font-bold">৳{bnNumber(p.price)}</span>
                </p>
                <p className="mt-1 text-sm text-success">
                  {p.months > 1 ? `মাসে মাত্র ৳${toBn(perMonth)}` : 'যেকোনো সময় শুরু করো'}
                </p>
                <ul className="mt-6 flex-1 space-y-2 text-sm">
                  {INCLUDED.map((f) => (
                    <li key={f} className="flex gap-2">
                      <Check className="size-4 shrink-0 text-success" /> {f}
                    </li>
                  ))}
                </ul>
                {user ? (
                  <Link to={`/subscribe/${p.key}`} className={`btn mt-6 ${p.popular ? 'btn-primary' : 'btn-outline'}`}>
                    এই প্যাকেজ নাও
                  </Link>
                ) : (
                  <Link to="/register" className={`btn mt-6 ${p.popular ? 'btn-primary' : 'btn-outline'}`}>
                    ফ্রি ট্রায়াল শুরু করো
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-8 text-center text-sm text-base-content/60">
        পেমেন্ট: বিকাশ / নগদ “Send Money” → ট্রানজেকশন আইডি জমা দাও → যাচাইয়ের পর প্যাকেজ চালু হবে।
      </p>
    </div>
  );
}
