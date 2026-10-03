import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { Highlighter as HighlighterIcon, Trash2 } from 'lucide-react';
import { highlightSupported } from './highlightSupport';

// Student highlights drawn with the CSS Custom Highlight API: no DOM changes, so React re-renders,
// step reveals and narration never break them. Each highlight is { block, start, end, text, color }
// where start/end are character offsets in that block's text; `text` lets us re-find it if the block
// text shifts (e.g. an example's steps are revealed above it).
const HIGHLIGHT_COLORS = ['yellow', 'green', 'blue', 'pink'];
const SWATCH = { yellow: 'bg-yellow-300', green: 'bg-green-300', blue: 'bg-sky-300', pink: 'bg-pink-300' };
const HIGHLIGHTABLE = new Set(['heading', 'md', 'definition', 'callout', 'example', 'keyPoints']);

const blockEl = (container, i) => container.querySelector(`[data-block="${i}"]`);

function offsetIn(el, node, offset) {
  const r = document.createRange();
  r.selectNodeContents(el);
  r.setEnd(node, offset);
  return r.toString().length;
}

function rangeIn(el, start, end) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  let pos = 0;
  let started = false;
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const len = node.data.length;
    if (!started && start < pos + len) {
      range.setStart(node, start - pos);
      started = true;
    }
    if (started && end <= pos + len) {
      range.setEnd(node, end - pos);
      return range;
    }
    pos += len;
  }
  return null;
}

/** Where a saved highlight is now: its stored offsets, or the nearest occurrence of its text. */
function locate(el, h) {
  const full = el.textContent;
  if (full.slice(h.start, h.end) === h.text) return [h.start, h.end];
  let best = -1;
  for (let i = full.indexOf(h.text); i !== -1; i = full.indexOf(h.text, i + 1)) {
    if (best === -1 || Math.abs(i - h.start) < Math.abs(best - h.start)) best = i;
  }
  return best === -1 ? null : [best, best + h.text.length];
}

function caretAt(x, y) {
  if (document.caretPositionFromPoint) {
    const p = document.caretPositionFromPoint(x, y);
    return p && { node: p.offsetNode, offset: p.offset };
  }
  const r = document.caretRangeFromPoint?.(x, y);
  return r && { node: r.startContainer, offset: r.startOffset };
}

/**
 * Adds select-to-highlight to the lesson inside `containerRef` (blocks rendered with data-block/data-type).
 * `highlights` is the saved list; `onChange(list)` persists a new list.
 */
export function Highlighter({ containerRef, highlights, onChange }) {
  const [menu, setMenu] = useState(null); // { x, y, mode: 'new', pending } | { x, y, mode: 'edit', index }
  const located = useRef([]); // [{ index, block, start, end }] current positions of saved highlights

  // Paint highlights; repaint when the lesson DOM changes.
  useEffect(() => {
    const container = containerRef.current;
    if (!highlightSupported || !container) return undefined;
    let timer;
    const paint = () => {
      const groups = Object.fromEntries(HIGHLIGHT_COLORS.map((c) => [c, []]));
      located.current = [];
      highlights.forEach((h, index) => {
        const el = blockEl(container, h.block);
        const at = el && locate(el, h);
        const range = at && rangeIn(el, at[0], at[1]);
        if (!range) return;
        groups[h.color]?.push(range);
        located.current.push({ index, block: h.block, start: at[0], end: at[1] });
      });
      for (const c of HIGHLIGHT_COLORS) CSS.highlights.set(`hl-${c}`, new Highlight(...groups[c]));
    };
    paint();
    const observer = new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(paint, 120);
    });
    observer.observe(container, { childList: true, subtree: true, characterData: true });
    return () => {
      observer.disconnect();
      clearTimeout(timer);
      for (const c of HIGHLIGHT_COLORS) CSS.highlights.delete(`hl-${c}`);
    };
  }, [containerRef, highlights]);

  // Offer the colour menu when the student selects text inside one highlightable block.
  useEffect(() => {
    if (!highlightSupported) return undefined;
    let timer;
    const onSelection = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const container = containerRef.current;
        const sel = document.getSelection();
        if (!container || !sel || sel.isCollapsed || !sel.rangeCount) {
          setMenu((m) => (m?.mode === 'new' ? null : m));
          return;
        }
        const range = sel.getRangeAt(0);
        const startBlock = range.startContainer.parentElement?.closest('[data-block]');
        const endBlock = range.endContainer.parentElement?.closest('[data-block]');
        const text = range.toString();
        if (!startBlock || startBlock !== endBlock || !container.contains(startBlock)) return setMenu(null);
        if (!HIGHLIGHTABLE.has(startBlock.dataset.type) || !text.trim() || text.length > 1000) return setMenu(null);
        const start = offsetIn(startBlock, range.startContainer, range.startOffset);
        const rect = range.getBoundingClientRect();
        setMenu({
          mode: 'new',
          x: rect.left + rect.width / 2,
          y: rect.top,
          pending: { block: Number(startBlock.dataset.block), start, end: start + text.length, text },
        });
      }, 200);
    };
    document.addEventListener('selectionchange', onSelection);
    return () => {
      document.removeEventListener('selectionchange', onSelection);
      clearTimeout(timer);
    };
  }, [containerRef]);

  // Tap an existing highlight to recolour or delete it.
  useEffect(() => {
    const container = containerRef.current;
    if (!highlightSupported || !container) return undefined;
    const onClick = (e) => {
      if (!document.getSelection()?.isCollapsed) return;
      const caret = caretAt(e.clientX, e.clientY);
      const el = caret?.node?.parentElement?.closest('[data-block]');
      if (!el) return;
      const off = offsetIn(el, caret.node, caret.offset);
      const hit = located.current.find((h) => h.block === Number(el.dataset.block) && off >= h.start && off < h.end);
      if (hit) setMenu({ mode: 'edit', index: hit.index, x: e.clientX, y: e.clientY - 8 });
    };
    container.addEventListener('click', onClick);
    return () => container.removeEventListener('click', onClick);
  }, [containerRef]);

  // Close on scroll (the text moves away from the fixed menu) or on a tap elsewhere.
  const toolbar = useRef(null);
  useEffect(() => {
    if (!menu) return undefined;
    const close = () => setMenu(null);
    const outside = (e) => !toolbar.current?.contains(e.target) && close();
    window.addEventListener('scroll', close, { passive: true });
    document.addEventListener('pointerdown', outside);
    return () => {
      window.removeEventListener('scroll', close);
      document.removeEventListener('pointerdown', outside);
    };
  }, [menu]);

  if (!highlightSupported || !menu) return null;

  const apply = (color) => {
    if (menu.mode === 'new') {
      const h = { ...menu.pending, color };
      // a new highlight replaces any it overlaps in the same block
      const overlaps = new Set(
        located.current.filter((l) => l.block === h.block && l.start < h.end && h.start < l.end).map((l) => l.index),
      );
      onChange([...highlights.filter((_, i) => !overlaps.has(i)), h]);
      document.getSelection()?.removeAllRanges();
    } else {
      onChange(highlights.map((h, i) => (i === menu.index ? { ...h, color } : h)));
    }
    setMenu(null);
  };
  const remove = () => {
    onChange(highlights.filter((_, i) => i !== menu.index));
    setMenu(null);
  };

  return (
    <div
      ref={toolbar}
      role="toolbar"
      aria-label="হাইলাইট"
      className="fixed z-50 flex -translate-x-1/2 -translate-y-full items-center gap-1 rounded-full border border-base-300 bg-base-100 p-1.5 shadow-lg"
      style={{ left: Math.min(Math.max(menu.x, 110), window.innerWidth - 110), top: Math.max(menu.y - 8, 60) }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <HighlighterIcon className="mx-1 size-4 text-base-content/60" />
      {HIGHLIGHT_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => apply(c)}
          className={clsx('size-7 rounded-full border-2 border-base-100 ring-1 ring-base-300 transition-transform hover:scale-110', SWATCH[c])}
          aria-label={`${c} রঙে হাইলাইট`}
        />
      ))}
      {menu.mode === 'edit' && (
        <button type="button" onClick={remove} className="btn btn-ghost btn-sm btn-circle text-error" aria-label="হাইলাইট মুছে ফেলো">
          <Trash2 className="size-4" />
        </button>
      )}
    </div>
  );
}
