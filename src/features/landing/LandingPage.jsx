import { Link } from 'react-router';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Bot,
  CalendarCheck,
  CheckCircle2,
  Flame,
  Headphones,
  ListChecks,
  MousePointerClick,
  ScrollText,
  Trophy,
} from 'lucide-react';
import { CHAPTERS } from '@/data/syllabus';
import { ChapterIcon } from '@/components/ui/ChapterIcon';
import { toBn } from '@/lib/bn';

const FEATURES = [
  { icon: MousePointerClick, title: 'ইন্টারঅ্যাকটিভ পাঠ', text: 'লজিক গেট সিমুলেটর, লাইভ HTML এডিটর, SQL প্লেগ্রাউন্ড, সংখ্যা রূপান্তরের ধাপে ধাপে সমাধান।' },
  { icon: Headphones, title: 'অডিও লেসন', text: 'বাসে, হাঁটতে হাঁটতে — প্রতিটি টপিক শুনে শুনে শেখো।' },
  { icon: ListChecks, title: 'টপিকভিত্তিক MCQ ও CQ', text: 'প্রতিটি টপিক শেষে ছোট পরীক্ষা, প্রতিটি অপশনের ব্যাখ্যাসহ।' },
  { icon: Bot, title: 'AI দিয়ে সৃজনশীল মূল্যায়ন', text: 'তোমার লেখা CQ উত্তর বোর্ডের মানবণ্টন অনুযায়ী মূল্যায়ন ও পরামর্শ।' },
  { icon: ScrollText, title: 'বিগত বছরের বোর্ড প্রশ্ন', text: 'বোর্ড ও সালভিত্তিক প্রশ্ন, পূর্ণাঙ্গ মডেল টেস্ট — আসল পরীক্ষার মতো টাইমারসহ।' },
  { icon: CalendarCheck, title: 'মাসিক স্টাডি প্ল্যান', text: 'পরীক্ষার তারিখ দাও, আমরা দিনভিত্তিক পরিকল্পনা বানিয়ে দেব।' },
  { icon: Flame, title: 'ডেইলি স্ট্রিক ও ব্যাজ', text: 'প্রতিদিন পড়লে স্ট্রিক বাড়বে, ভালো স্কোরে মিলবে ব্যাজ।' },
  { icon: Trophy, title: 'লিডারবোর্ড', text: 'সারা দেশের শিক্ষার্থীদের সাথে সাপ্তাহিক প্রতিযোগিতা।' },
];

const STEPS = [
  { n: 1, title: 'টপিক পড়ো ও শোনো', text: 'সহজ বাংলায় ব্যাখ্যা, চিত্র ও উদাহরণ।' },
  { n: 2, title: 'টপিক কুইজ', text: 'MCQ + CQ দিয়ে সাথে সাথে যাচাই।' },
  { n: 3, title: 'অধ্যায় পরীক্ষা', text: 'পুরো অধ্যায়ের বোর্ড-মানের পরীক্ষা।' },
  { n: 4, title: 'ফুল মডেল টেস্ট', text: 'পুরো বইয়ের উপর বোর্ড প্রশ্নের আদলে।' },
];

const FAQ = [
  { q: 'ফ্রি ট্রায়ালে কী কী পাব?', a: 'রেজিস্ট্রেশনের পর ১৫ দিন সব ফিচার সম্পূর্ণ ফ্রি — কোনো কার্ড বা পেমেন্ট লাগবে না।' },
  { q: 'কনটেন্ট কি NCTB বই অনুযায়ী?', a: 'হ্যাঁ। একাদশ-দ্বাদশ শ্রেণির NCTB ICT বই অনুসরণ করে প্রতিটি অধ্যায় ও টপিক সাজানো, সাথে বোর্ড পরীক্ষার গুরুত্বপূর্ণ বিষয়।' },
  { q: 'মোবাইলে ব্যবহার করা যাবে?', a: 'অবশ্যই। পুরো ওয়েবসাইট মোবাইলের জন্য অপটিমাইজ করা।' },
  { q: 'AI মূল্যায়ন কতটা নির্ভরযোগ্য?', a: 'প্রতিটি প্রশ্নের মডেল উত্তর ও মানবণ্টন ধরে AI মূল্যায়ন করে। এটি অনুশীলনের জন্য সহায়ক — চূড়ান্ত নম্বর নয়।' },
];

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.5 },
};

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div className="absolute -top-40 left-1/2 h-96 w-[48rem] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 md:py-24 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="badge badge-lg gap-2 border-primary/30 bg-primary/10 text-primary">
              <span className="size-2 animate-pulse rounded-full bg-primary" /> HSC ২০২৬-২৭ ব্যাচের জন্য
            </span>
            <h1 className="mt-5 text-4xl leading-tight font-bold sm:text-5xl lg:text-6xl">
              HSC ICT শেখো <span className="text-gradient">মজায় মজায়</span>, A+ নিশ্চিত করো
            </h1>
            <p className="mt-5 max-w-xl text-lg text-base-content/70">
              অধ্যায়ভিত্তিক ইন্টারঅ্যাকটিভ পাঠ, অডিও লেসন, টপিক কুইজ, AI-মূল্যায়িত সৃজনশীল প্রশ্ন, বোর্ড প্রশ্ন ও মডেল টেস্ট —
              সব এক জায়গায়, সম্পূর্ণ বাংলায়।
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register" className="btn btn-primary btn-lg gap-2 shadow-lg shadow-primary/30">
                ১৫ দিন ফ্রি শুরু করো <ArrowRight className="size-5" />
              </Link>
              <a href="#chapters" className="btn btn-ghost btn-lg">
                সিলেবাস দেখো
              </a>
            </div>
            <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-base-content/70">
              {['কার্ড লাগবে না', 'NCTB সিলেবাস', 'মোবাইল ফ্রেন্ডলি'].map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-success" /> {t}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative"
          >
            <HeroPreview />
          </motion.div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-y border-base-300 bg-base-200/60">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-8 text-center md:grid-cols-4">
          {[
            ['৬টি', 'অধ্যায়'],
            ['৫০+', 'ইন্টারঅ্যাকটিভ টপিক'],
            ['১০০০+', 'MCQ ও CQ'],
            ['১০+', 'বছরের বোর্ড প্রশ্ন'],
          ].map(([v, l]) => (
            <div key={l}>
              <p className="text-gradient text-3xl font-bold">{v}</p>
              <p className="text-sm text-base-content/60">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Chapters */}
      <section id="chapters" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20">
        <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">পুরো সিলেবাস, অধ্যায় ধরে ধরে</h2>
          <p className="mt-3 text-base-content/70">
            সবচেয়ে গুরুত্বপূর্ণ অধ্যায় ৩, ৪, ৫ ও ৬ — এগুলোতে আছে সবচেয়ে বেশি ইন্টারঅ্যাকটিভ ল্যাব ও অনুশীলন।
          </p>
        </motion.div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CHAPTERS.map((ch, i) => (
            <motion.article
              key={ch.slug}
              {...fadeUp}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="card-soft group relative overflow-hidden p-6 transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${ch.color}`} />
              <div className="flex items-start justify-between">
                <div className={`grid size-12 place-items-center rounded-2xl bg-gradient-to-br ${ch.color} text-white shadow-lg`}>
                  <ChapterIcon name={ch.icon} />
                </div>
                {ch.priority && <span className="badge badge-accent badge-sm font-semibold">অতি গুরুত্বপূর্ণ</span>}
              </div>
              <p className="mt-4 text-sm font-medium text-base-content/50">অধ্যায় {toBn(ch.number)}</p>
              <h3 className="mt-1 text-lg leading-snug font-bold">{ch.title}</h3>
              <p className="mt-2 text-sm text-base-content/70">{ch.blurb}</p>
            </motion.article>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-base-200/60 py-20">
        <div className="mx-auto max-w-7xl px-4">
          <motion.h2 {...fadeUp} className="text-center text-3xl font-bold sm:text-4xl">
            কীভাবে শিখবে?
          </motion.h2>
          <ol className="mt-12 grid gap-5 md:grid-cols-4">
            {STEPS.map((s) => (
              <motion.li key={s.n} {...fadeUp} className="card-soft relative p-6">
                <span className="grid size-10 place-items-center rounded-full bg-primary text-lg font-bold text-primary-content">
                  {toBn(s.n)}
                </span>
                <h3 className="mt-4 font-bold">{s.title}</h3>
                <p className="mt-1 text-sm text-base-content/70">{s.text}</p>
              </motion.li>
            ))}
          </ol>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20">
        <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">যা যা পাচ্ছো</h2>
          <p className="mt-3 text-base-content/70">শুধু পড়া নয় — শেখা, অনুশীলন, মূল্যায়ন আর অনুপ্রেরণা একসাথে।</p>
        </motion.div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <motion.div key={title} {...fadeUp} className="card-soft p-6">
              <Icon className="size-8 text-primary" />
              <h3 className="mt-4 font-bold">{title}</h3>
              <p className="mt-1 text-sm text-base-content/70">{text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-4 pb-20">
        <h2 className="text-center text-3xl font-bold">সচরাচর জিজ্ঞাসা</h2>
        <div className="mt-8 space-y-3">
          {FAQ.map((f, i) => (
            <div key={f.q} className="collapse-arrow collapse card-soft">
              <input type="radio" name="faq" defaultChecked={i === 0} />
              <div className="collapse-title font-semibold">{f.q}</div>
              <div className="collapse-content text-base-content/70">{f.a}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-20">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary to-secondary p-10 text-center text-primary-content shadow-2xl sm:p-14">
          <h2 className="text-3xl font-bold sm:text-4xl">আজই শুরু করো — প্রথম ১৫ দিন ফ্রি</h2>
          <p className="mx-auto mt-3 max-w-xl opacity-90">প্রতিদিন মাত্র ৩০ মিনিট। পরীক্ষার আগে পুরো সিলেবাস শেষ, আত্মবিশ্বাস নিয়ে হলে যাও।</p>
          <Link to="/register" className="btn btn-lg mt-8 border-none bg-white text-primary hover:bg-white/90">
            ফ্রি অ্যাকাউন্ট খোলো <ArrowRight className="size-5" />
          </Link>
        </div>
      </section>
    </>
  );
}

/** Decorative mock of a lesson + quiz card for the hero. */
function HeroPreview() {
  return (
    <div className="relative mx-auto max-w-md">
      <div className="card-soft p-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <span className="badge badge-primary badge-soft">অধ্যায় ৩ · লজিক গেট</span>
          <span className="flex items-center gap-1 text-sm text-base-content/60">
            <Headphones className="size-4" /> ৪:২০
          </span>
        </div>
        <h3 className="mt-3 text-lg font-bold">NAND গেট — সার্বজনীন গেট</h3>
        <div className="mt-4 grid grid-cols-3 gap-2 font-mono text-sm">
          {[
            ['A', 'B', 'Y'],
            ['0', '0', '1'],
            ['0', '1', '1'],
            ['1', '0', '1'],
            ['1', '1', '0'],
          ].map((row, r) =>
            row.map((c, i) => (
              <span
                key={`${r}-${i}`}
                className={`rounded-lg py-1 text-center ${r === 0 ? 'bg-base-300 font-bold' : i === 2 ? 'bg-primary/15 font-semibold text-primary' : 'bg-base-200'}`}
              >
                {c}
              </span>
            ))
          )}
        </div>
        <div className="mt-5 rounded-xl border border-base-300 p-4">
          <p className="text-sm font-semibold">কুইজ: NAND গেটের আউটপুট কখন 0?</p>
          <div className="mt-3 space-y-2 text-sm">
            <div className="rounded-lg border border-base-300 px-3 py-2">ক) যেকোনো একটি ইনপুট 1 হলে</div>
            <div className="flex items-center justify-between rounded-lg border border-success bg-success/10 px-3 py-2 font-medium">
              খ) সকল ইনপুট 1 হলে <CheckCircle2 className="size-4 text-success" />
            </div>
          </div>
        </div>
      </div>
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="card-soft absolute -top-5 -right-4 flex items-center gap-2 px-3 py-2 shadow-xl"
      >
        <Flame className="size-5 text-orange-500" />
        <span className="text-sm font-bold">১২ দিনের স্ট্রিক!</span>
      </motion.div>
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 3.5, repeat: Infinity }}
        className="card-soft absolute -bottom-5 -left-4 flex items-center gap-2 px-3 py-2 shadow-xl"
      >
        <Trophy className="size-5 text-amber-500" />
        <span className="text-sm font-bold">সাপ্তাহিক র‍্যাংক #৩</span>
      </motion.div>
    </div>
  );
}
