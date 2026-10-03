import { useCallback, useEffect, useRef, useState } from 'react';
import { saveDraft } from './queries';

const AUTOSAVE_MS = 15_000;

/** Local answers for a running attempt, autosaved to the server so a refresh or crash loses nothing. */
export function useDraft(attempt) {
  const [draft, setDraft] = useState(() => ({
    mcq: Object.fromEntries(attempt.mcq.filter((m) => !m.locked).map((m) => [m._id, m.picked ?? null])),
    cq: Object.fromEntries(attempt.cq.map((c) => [c._id, c.parts.map((p) => p.text ?? '')])),
  }));
  const [savedAt, setSavedAt] = useState(null);
  const draftRef = useRef(draft);
  const dirty = useRef(false);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  const flush = useCallback(async () => {
    if (!dirty.current) return;
    dirty.current = false;
    try {
      await saveDraft(attempt._id, draftRef.current);
      setSavedAt(new Date());
    } catch {
      dirty.current = true; // retry on the next tick
    }
  }, [attempt._id]);

  useEffect(() => {
    const id = setInterval(flush, AUTOSAVE_MS);
    const onHide = () => document.visibilityState === 'hidden' && flush();
    document.addEventListener('visibilitychange', onHide);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onHide);
    };
  }, [flush]);

  const setMcq = useCallback((id, picked) => {
    dirty.current = true;
    setDraft((d) => ({ ...d, mcq: { ...d.mcq, [id]: d.mcq[id] === picked ? null : picked } })); // click again to clear
  }, []);

  const setCq = useCallback((id, part, text) => {
    dirty.current = true;
    setDraft((d) => ({ ...d, cq: { ...d.cq, [id]: d.cq[id].map((t, i) => (i === part ? text : t)) } }));
  }, []);

  /** Call after a successful submit so the autosave doesn't fire on a closed attempt. */
  const markClean = useCallback(() => {
    dirty.current = false;
  }, []);

  return { draft, setMcq, setCq, flush, savedAt, markClean };
}
