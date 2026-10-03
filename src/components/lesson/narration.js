// Turns lesson blocks into short speakable chunks for text-to-speech.
// A block can override with `say: "..."` or opt out with `say: false`.

function stripMarkdown(md = '') {
  return md
    .split('\n')
    .filter((line) => !/^\s*\|/.test(line)) // drop table rows
    .join('\n')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_~#>]+/g, '')
    .replace(/^\s*[-+]\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function blockText(b) {
  if (b.say === false) return '';
  if (typeof b.say === 'string') return b.say;
  switch (b.type) {
    case 'heading':
      return b.text;
    case 'md':
      return stripMarkdown(b.md);
    case 'definition':
      return `${b.term}। ${stripMarkdown(b.md)}`;
    case 'callout':
      return `${b.title ? `${b.title}। ` : ''}${stripMarkdown(b.md)}`;
    case 'keyPoints':
      return `${b.title || 'এক নজরে'}। ${b.items.map(stripMarkdown).join('। ')}`;
    case 'example':
      return b.question ? `উদাহরণ। ${stripMarkdown(b.question)}` : '';
    case 'figure':
      return b.caption || '';
    default:
      return ''; // code, widgets, quick checks are skipped
  }
}

/** Splits text at sentence boundaries into chunks <= max chars (Chrome cuts long utterances). */
function splitSentences(text, max = 180) {
  const sentences = text.match(/[^।?!.;]+[।?!.;]?/g) || [text];
  const out = [];
  let buf = '';
  for (const s of sentences) {
    if ((buf + s).length > max && buf) {
      out.push(buf.trim());
      buf = '';
    }
    buf += s;
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}

/** => [{ block: index, text }] */
export function buildNarration(blocks, title) {
  const chunks = title ? [{ block: -1, text: title }] : [];
  blocks.forEach((b, i) => {
    const t = blockText(b);
    if (t) splitSentences(t).forEach((text) => chunks.push({ block: i, text }));
  });
  return chunks;
}
