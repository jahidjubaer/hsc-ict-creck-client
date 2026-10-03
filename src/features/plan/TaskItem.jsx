import { Link } from 'react-router';
import clsx from 'clsx';
import { BookOpen, CheckCircle2, Circle, ClipboardList, FileCheck2, NotebookTabs, PenLine, PlayCircle, RotateCcw, Trophy } from 'lucide-react';
import { toBn } from '@/lib/bn';
import { useStartAttempt } from '@/features/exam/queries';
import { usePlanAction } from './queries';

const KIND = {
  read: { icon: BookOpen, label: 'পড়া', tone: 'text-primary bg-primary/10' },
  quiz: { icon: ClipboardList, label: 'কুইজ', tone: 'text-secondary bg-secondary/10' },
  'chapter-test': { icon: FileCheck2, label: 'অধ্যায় MCQ পরীক্ষা', tone: 'text-accent-content bg-accent/20' },
  'chapter-cq': { icon: PenLine, label: 'অধ্যায় সৃজনশীল পরীক্ষা', tone: 'text-secondary bg-secondary/10' },
  'model-test': { icon: Trophy, label: 'মডেল টেস্ট', tone: 'text-amber-600 bg-amber-500/10' },
  revise: { icon: RotateCcw, label: 'রিভিশন', tone: 'text-info bg-info/10' },
  mistakes: { icon: NotebookTabs, label: 'ভুলের খাতা', tone: 'text-error bg-error/10' },
};
const MANUAL = new Set(['revise', 'mistakes']);

/** Where a task's "শুরু করো" goes: a page link, or a test that has to be started via the API. */
function useTaskAction(task) {
  const start = useStartAttempt();
  switch (task.kind) {
    case 'read':
      return { to: `/learn/${task.chapterSlug}/${task.topicSlug}` };
    case 'quiz':
      return { onClick: () => start.mutate({ kind: 'topic', topicId: task.topic }), busy: start.isPending };
    case 'chapter-test':
      return { onClick: () => start.mutate({ kind: 'chapter-mcq', chapterId: task.chapter }), busy: start.isPending };
    case 'chapter-cq':
      return { onClick: () => start.mutate({ kind: 'chapter-cq', chapterId: task.chapter }), busy: start.isPending };
    case 'model-test':
      return { onClick: () => start.mutate({ kind: 'full' }), busy: start.isPending };
    case 'mistakes':
      return { to: '/exams/mistakes' };
    default:
      return { to: task.chapterSlug ? `/learn/${task.chapterSlug}` : '/learn' };
  }
}

export function TaskItem({ task, actionable = true }) {
  const k = KIND[task.kind];
  const Icon = k.icon;
  const tick = usePlanAction();
  const action = useTaskAction(task);
  const manual = MANUAL.has(task.kind);

  const check = manual ? (
    <button
      type="button"
      className="shrink-0"
      onClick={() => tick.mutate({ method: 'patch', url: `/plan/tasks/${task._id}`, body: { done: !task.done } })}
      disabled={tick.isPending}
      aria-label={task.done ? 'টিক তুলে দাও' : 'শেষ হয়েছে বলে টিক দাও'}
    >
      {task.done ? <CheckCircle2 className="size-6 text-success" /> : <Circle className="size-6 text-base-content/30 hover:text-success" />}
    </button>
  ) : (
    <span className="shrink-0 tooltip tooltip-right" data-tip={task.done ? 'হয়ে গেছে' : 'শেষ করলে নিজে থেকেই টিক হবে'}>
      {task.done ? <CheckCircle2 className="size-6 text-success" /> : <Circle className="size-6 text-base-content/20" />}
    </span>
  );

  const go =
    actionable && !task.done ? (
      action.to ? (
        <Link to={action.to} className="btn btn-ghost btn-sm btn-square" aria-label="শুরু করো">
          <PlayCircle className="size-5 text-primary" />
        </Link>
      ) : (
        <button type="button" className="btn btn-ghost btn-sm btn-square" onClick={action.onClick} disabled={action.busy} aria-label="শুরু করো">
          {action.busy ? <span className="loading loading-spinner loading-xs" /> : <PlayCircle className="size-5 text-primary" />}
        </button>
      )
    ) : null;

  return (
    <li className={clsx('flex items-center gap-3 py-2.5', task.done && 'opacity-60')}>
      {check}
      <span className={clsx('grid size-8 shrink-0 place-items-center rounded-lg', k.tone)}>
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className={clsx('text-sm font-medium', task.done && 'line-through')}>{task.title}</p>
        <p className="text-xs text-base-content/55">
          {k.label}
          {task.chapterNumber && !['chapter-test', 'chapter-cq'].includes(task.kind) ? ` · অধ্যায় ${toBn(task.chapterNumber)}` : ''} · {toBn(task.minutes)} মিনিট
        </p>
      </div>
      {go}
    </li>
  );
}
