import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router';
import toast from 'react-hot-toast';
import { ShieldAlert } from 'lucide-react';
import { useAuthStore } from '@/store/auth';

/*
 * Content protection for the app pages. A browser cannot truly stop screenshots or screen recording, so this
 * deters and makes leaks traceable:
 * - copy / cut / right-click / drag / print / save / view-source are blocked (inputs, textareas and editors still work);
 * - the page blurs while the window is in the background or after PrintScreen (snipping tools, app switcher);
 * - a faint watermark with the signed-in student's email sits over every page.
 * Text selection stays on for students because lesson highlighting needs it; visitors can't select at all.
 */

const EDITABLE = 'input, textarea, select, [contenteditable=""], [contenteditable="true"], .cm-editor, [data-allow-copy]';
const isEditable = (el) => !!(el && el.closest?.(EDITABLE));
const BLOCKED_KEYS = new Set(['c', 'x', 'p', 's', 'u']);

function warn() {
  toast.error('কনটেন্ট কপি বা সেভ করা যাবে না', { id: 'content-guard' });
}

export function ContentGuard() {
  const user = useAuthStore((s) => s.user);
  const { pathname } = useLocation();
  const [shielded, setShielded] = useState(false);
  const off = pathname.startsWith('/admin');

  useEffect(() => {
    if (off) return;
    const root = document.documentElement;
    root.classList.add('content-guard');
    root.classList.toggle('guard-noselect', !user);

    const onCopy = (e) => {
      if (isEditable(e.target) || isEditable(document.activeElement)) return;
      e.preventDefault();
      e.clipboardData?.setData('text/plain', 'ICT Crack — কনটেন্ট কপি করা যাবে না।');
      warn();
    };
    const onMenu = (e) => {
      if (!isEditable(e.target)) e.preventDefault();
    };
    const onDrag = (e) => {
      if (!isEditable(e.target)) e.preventDefault();
    };
    const onKey = (e) => {
      const k = e.key?.toLowerCase();
      const mod = e.ctrlKey || e.metaKey;
      const devtools = k === 'f12' || (mod && e.shiftKey && ['i', 'j', 'c'].includes(k));
      if (devtools || (mod && BLOCKED_KEYS.has(k) && !(['c', 'x'].includes(k) && isEditable(e.target)))) {
        e.preventDefault();
        if (k !== 'c' && k !== 'x') warn();
      }
    };
    let timer;
    const flash = () => {
      setShielded(true);
      clearTimeout(timer);
      timer = setTimeout(() => setShielded(document.hidden || !document.hasFocus()), 2500);
    };
    const onKeyUp = (e) => {
      if (e.key !== 'PrintScreen') return;
      navigator.clipboard?.writeText('ICT Crack').catch(() => {});
      flash();
      toast.error('স্ক্রিনশট নেওয়া যাবে না', { id: 'content-guard' });
    };
    // clicking into an embedded preview (iframe) also blurs the window — that's not leaving the page
    const onBlur = () => setTimeout(() => document.activeElement?.tagName !== 'IFRAME' && setShielded(true), 0);
    const onFocus = () => setShielded(false);
    const onVisibility = () => setShielded(document.hidden);
    const onPrint = () => warn();

    document.addEventListener('copy', onCopy);
    document.addEventListener('cut', onCopy);
    document.addEventListener('contextmenu', onMenu);
    document.addEventListener('dragstart', onDrag);
    document.addEventListener('keydown', onKey);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    window.addEventListener('beforeprint', onPrint);
    return () => {
      clearTimeout(timer);
      root.classList.remove('content-guard', 'guard-noselect');
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('cut', onCopy);
      document.removeEventListener('contextmenu', onMenu);
      document.removeEventListener('dragstart', onDrag);
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('keyup', onKeyUp);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('beforeprint', onPrint);
    };
  }, [off, user]);

  useEffect(() => {
    document.documentElement.classList.toggle('shielded', shielded && !off);
  }, [shielded, off]);

  if (off) return null;
  return (
    <>
      <Watermark text={user ? [user.email, user.phone].filter(Boolean).join(' · ') : 'ICT Crack · guest'} />
      {shielded && (
        <button
          type="button"
          onClick={() => setShielded(false)}
          className="fixed inset-0 z-[200] grid place-items-center bg-base-100/40 p-6 text-center"
          aria-label="কনটেন্ট দেখাও"
        >
          <span className="card-soft max-w-xs p-6">
            <ShieldAlert className="mx-auto size-10 text-primary" />
            <span className="mt-3 block font-bold">কনটেন্ট সুরক্ষিত</span>
            <span className="mt-1 block text-sm text-base-content/65">পড়া চালিয়ে যেতে এখানে ট্যাপ করো</span>
          </span>
        </button>
      )}
    </>
  );
}

const STAMP_DAY = new Date().toLocaleDateString('en-GB');
const escapeXml = (s) => s.replace(/[<>&'"]/g, (c) => `&#${c.charCodeAt(0)};`);

/** Faint, tiled, diagonal text over the whole page; clicks pass through it. */
function Watermark({ text }) {
  const style = useMemo(() => {
    const label = escapeXml(`${text} · ${STAMP_DAY}`);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="340" height="200"><text x="170" y="100" text-anchor="middle" transform="rotate(-24 170 100)" font-family="sans-serif" font-size="13" fill="rgb(128,128,128)" fill-opacity="0.13">${label}</text></svg>`;
    return {
      backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(svg)}")`,
    };
  }, [text]);
  return <div aria-hidden="true" className="watermark pointer-events-none fixed inset-0 z-[35] print:hidden" style={style} />;
}
