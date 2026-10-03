import { useState } from 'react';
import { Moon, Sun } from 'lucide-react';

const getTheme = () => document.documentElement.dataset.theme || 'ictlight';

export function ThemeToggle({ className = '' }) {
  const [theme, setTheme] = useState(getTheme);

  const toggle = () => {
    const next = theme === 'ictdark' ? 'ictlight' : 'ictdark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('theme', next);
    } catch {
      /* storage unavailable */
    }
    setTheme(next);
  };

  return (
    <button type="button" onClick={toggle} className={`btn btn-ghost btn-circle ${className}`} aria-label="থিম পরিবর্তন">
      {theme === 'ictdark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </button>
  );
}
