import toast from 'react-hot-toast';
import { Download } from 'lucide-react';
import { promptInstall, useInstallState } from './install';

/** "Install app" button (menuItem: wrapped in <li> for a DaisyUI menu); hidden when installed or not installable. */
export function InstallButton({ className, menuItem }) {
  const state = useInstallState();
  if (state !== 'prompt' && state !== 'ios') return null;

  const onClick = () => {
    if (state === 'prompt') return promptInstall();
    toast('Safari-তে নিচের Share (⬆️) বোতাম চাপো, তারপর “Add to Home Screen”।', { duration: 8000, icon: '📲' });
  };

  const button = (
    <button type="button" onClick={onClick} className={className}>
      <Download className="size-4" /> অ্যাপ ইনস্টল করো
    </button>
  );
  return menuItem ? <li>{button}</li> : button;
}
