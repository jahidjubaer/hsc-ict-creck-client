import { Bot } from 'lucide-react';

/** Full-screen wait state while the server grades (AI grading of CQs can take a few seconds). */
export function GradingOverlay({ withCq }) {
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-base-100/85 backdrop-blur-sm" role="status" aria-live="polite">
      <div className="flex max-w-xs flex-col items-center gap-3 text-center">
        <span className="grid size-16 place-items-center rounded-2xl bg-primary/10">
          <Bot className="size-8 animate-bounce text-primary" />
        </span>
        <p className="text-lg font-bold">{withCq ? 'AI পরীক্ষক তোমার খাতা দেখছে…' : 'ফলাফল তৈরি হচ্ছে…'}</p>
        {withCq && <p className="text-sm text-base-content/60">সৃজনশীল উত্তর মূল্যায়নে কয়েক সেকেন্ড লাগতে পারে।</p>}
        <span className="loading loading-dots loading-md text-primary" />
      </div>
    </div>
  );
}
