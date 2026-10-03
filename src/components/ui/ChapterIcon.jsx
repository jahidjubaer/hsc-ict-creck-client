import { Binary, Code2, Database, Globe2, Network, Terminal } from 'lucide-react';

const ICONS = { Globe2, Network, Binary, Code2, Terminal, Database };

export function ChapterIcon({ name, className = 'size-6' }) {
  const Icon = ICONS[name] || Globe2;
  return <Icon className={className} />;
}
