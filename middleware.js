// Vercel Routing Middleware. Facebook, WhatsApp, Messenger, Telegram etc. don't run JavaScript, so a shared lesson
// link would preview with the site-wide title. For those bots only, chapter and topic pages get their own title and
// description written into the HTML. Everyone else goes straight to the app.

export const config = { matcher: ['/learn/:path*'] };

const API = 'https://hsc-ict-creck-server.vercel.app/api';
const SHARE_BOTS =
  /facebookexternalhit|facebot|whatsapp|twitterbot|telegrambot|slackbot|linkedinbot|discordbot|pinterest|skypeuripreview|redditbot|viber|embedly|quora link preview|vkshare/i;

const bn = (n) => String(n).replace(/[0-9]/g, (d) => '০১২৩৪৫৬৭৮৯'[d]);
const next = () => new Response(null, { headers: { 'x-middleware-next': '1' } });
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

async function pageInfo(chapterSlug, topicSlug) {
  const res = await fetch(`${API}/chapters/${encodeURIComponent(chapterSlug)}`);
  if (!res.ok) return null;
  const { chapter, topics } = await res.json();
  if (!topicSlug) return { title: `অধ্যায় ${bn(chapter.number)}: ${chapter.title} — HSC ICT | ICT Crack`, description: chapter.blurb };
  const topic = topics.find((t) => t.slug === topicSlug);
  if (!topic) return null;
  return {
    title: `${topic.title} — HSC ICT | ICT Crack`,
    description: topic.summary || `অধ্যায় ${bn(chapter.number)}: ${chapter.title}`,
  };
}

/** Replaces the content of a meta tag (by name or property) and the <title> in the app shell. */
export function fillHead(html, { title, description, url }) {
  const set = (attr, key, value) => html.replace(new RegExp(`(<meta ${attr}="${key}" content=")[^"]*(")`), `$1${esc(value)}$2`);
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`);
  html = set('name', 'description', description);
  html = set('property', 'og:title', title);
  html = set('property', 'og:description', description);
  html = html.replace('<meta property="og:type"', `<meta property="og:url" content="${esc(url)}" />\n    <meta property="og:type"`);
  return html;
}

export default async function middleware(request) {
  if (!SHARE_BOTS.test(request.headers.get('user-agent') || '')) return next();
  try {
    const url = new URL(request.url);
    const [, , chapterSlug, topicSlug] = url.pathname.split('/');
    if (!chapterSlug) return next();
    const info = await pageInfo(chapterSlug, topicSlug);
    if (!info) return next();
    const shell = await fetch(new URL('/index.html', url));
    if (!shell.ok) return next();
    const html = fillHead(await shell.text(), { ...info, url: `${url.origin}${url.pathname}` });
    return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=0, s-maxage=3600' } });
  } catch {
    return next();
  }
}
