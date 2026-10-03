import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { TimerIcon } from 'lucide-react';
import { formatClock } from '../format';

/**
 * Countdown to `deadline` (server time). `skewMs` = serverNow − clientNow at load, so a wrong device clock
 * doesn't change the time limit. Calls onExpire once.
 */
export function Timer({ deadline, skewMs = 0, onExpire }) {
  const end = new Date(deadline).getTime();
  const [left, setLeft] = useState(() => (end - (Date.now() + skewMs)) / 1000);
  const fired = useRef(false);
  const expireRef = useRef(onExpire);

  useEffect(() => {
    expireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    const tick = () => {
      const s = (end - (Date.now() + skewMs)) / 1000;
      setLeft(s);
      if (s <= 0 && !fired.current) {
        fired.current = true;
        expireRef.current?.();
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [end, skewMs]);

  return (
    <span
      className={clsx(
        'badge badge-lg gap-1.5 font-mono font-bold tabular-nums',
        left <= 60 ? 'badge-error animate-pulse' : left <= 300 ? 'badge-warning' : 'badge-ghost'
      )}
      role="timer"
      aria-label="বাকি সময়"
    >
      <TimerIcon className="size-4" /> {formatClock(left)}
    </span>
  );
}
