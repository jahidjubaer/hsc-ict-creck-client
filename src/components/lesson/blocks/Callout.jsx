import { AlertTriangle, BookMarked, GraduationCap, Info, Lightbulb } from 'lucide-react';
import { Markdown } from '../Markdown';

const VARIANTS = {
  info: { icon: Info, cls: 'border-info/40 bg-info/8', iconCls: 'text-info', label: 'জেনে রাখো' },
  tip: { icon: Lightbulb, cls: 'border-success/40 bg-success/8', iconCls: 'text-success', label: 'টিপস' },
  warning: { icon: AlertTriangle, cls: 'border-warning/50 bg-warning/10', iconCls: 'text-warning', label: 'সাধারণ ভুল' },
  exam: { icon: GraduationCap, cls: 'border-primary/40 bg-primary/8', iconCls: 'text-primary', label: 'বোর্ড পরীক্ষায় যেভাবে আসে' },
  remember: { icon: BookMarked, cls: 'border-accent/60 bg-accent/12', iconCls: 'text-amber-600', label: 'মনে রাখো' },
};

export function Callout({ variant = 'info', title, md }) {
  const v = VARIANTS[variant] ?? VARIANTS.info;
  const Icon = v.icon;
  return (
    <aside className={`rounded-2xl border-l-4 p-4 sm:p-5 ${v.cls}`}>
      <p className="mb-2 flex items-center gap-2 font-bold">
        <Icon className={`size-5 ${v.iconCls}`} /> {title || v.label}
      </p>
      <Markdown>{md}</Markdown>
    </aside>
  );
}
