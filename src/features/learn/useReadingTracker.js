import { useEffect, useRef, useState } from 'react';
import { sendHeartbeat } from './queries';

const PING_MS = 30_000;
const IDLE_MS = 120_000;

/**
 * Tracks how far the student has scrolled through `articleRef` and how long they actively read.
 * Sends a heartbeat every 30s (only while the tab is visible and the user was active recently)
 * and once more on leave. Returns the live read percentage for the progress bar.
 */
export function useReadingTracker(topicId, articleRef) {
  const [percent, setPercent] = useState(0);
  const maxPct = useRef(0);
  const lastActive = useRef(0);
  const pendingSec = useRef(0);
  const lastTick = useRef(0);

  useEffect(() => {
    if (!topicId) return undefined;
    maxPct.current = 0;
    pendingSec.current = 0;
    lastTick.current = Date.now();
    lastActive.current = Date.now();

    const onScroll = () => {
      const el = articleRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight * 0.6;
      const pct = total <= 0 ? 100 : Math.min(100, Math.max(0, (-rect.top / total) * 100));
      setPercent(pct);
      maxPct.current = Math.max(maxPct.current, pct);
    };
    const markActive = () => {
      lastActive.current = Date.now();
    };

    // Accumulate active seconds once per second.
    const tick = setInterval(() => {
      const now = Date.now();
      if (document.visibilityState === 'visible' && now - lastActive.current < IDLE_MS) {
        pendingSec.current += (now - lastTick.current) / 1000;
      }
      lastTick.current = now;
    }, 1000);

    const flush = () => {
      const seconds = Math.min(300, Math.round(pendingSec.current));
      pendingSec.current = 0;
      if (seconds < 5 && maxPct.current < 1) return;
      sendHeartbeat(topicId, { readPercent: Math.round(maxPct.current), seconds }).catch(() => {});
    };
    const ping = setInterval(flush, PING_MS);
    const onHide = () => document.visibilityState === 'hidden' && flush();

    window.addEventListener('scroll', onScroll, { passive: true });
    ['scroll', 'pointerdown', 'keydown', 'touchstart'].forEach((e) => window.addEventListener(e, markActive, { passive: true }));
    document.addEventListener('visibilitychange', onHide);
    onScroll();

    return () => {
      clearInterval(tick);
      clearInterval(ping);
      flush();
      window.removeEventListener('scroll', onScroll);
      ['scroll', 'pointerdown', 'keydown', 'touchstart'].forEach((e) => window.removeEventListener(e, markActive));
      document.removeEventListener('visibilitychange', onHide);
    };
  }, [topicId, articleRef]);

  return percent;
}
