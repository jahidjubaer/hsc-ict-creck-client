import { useEffect, useLayoutEffect } from 'react';
import { useLocation } from 'react-router';

/*
 * Page titles, descriptions, canonical links and share tags. Search engines run the app, so updating <head> here is
 * enough for them; Facebook/WhatsApp don't run JS — middleware.js gives them the same tags for lesson pages.
 */

export const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://hsc-ict-creck-client.vercel.app';
const BRAND = 'ICT Crack';
const DEFAULT_DESCRIPTION =
  'HSC ICT শেখো সহজে — NCTB বই অনুযায়ী অধ্যায়ভিত্তিক ইন্টারঅ্যাকটিভ পাঠ ও ল্যাব, আলাদা MCQ ও সৃজনশীল পরীক্ষা, AI মূল্যায়ন ও মডেল টেস্ট। প্রতিটি অধ্যায়ের প্রথম টপিক ফ্রি।';

const PAGES = {
  '/': { title: `${BRAND} — HSC ICT শেখো সহজে`, raw: true },
  '/pricing': { title: 'প্যাকেজ ও মূল্য', description: 'ICT Crack-এর প্যাকেজ: ১ মাস ৳৯০ থেকে। নতুন অ্যাকাউন্টে ১৫ দিন সব ফিচার ফ্রি — bKash/Nagad-এ পেমেন্ট।' },
  '/learn': {
    title: 'HSC ICT — সব অধ্যায়',
    description: 'HSC ICT-র ৬টি অধ্যায়ের ৬১টি টপিক — ইন্টারঅ্যাকটিভ পাঠ, ল্যাব ও কুইজ। প্রতিটি অধ্যায়ের প্রথম টপিক লগইন ছাড়াই ফ্রি।',
  },
  '/exams': {
    title: 'পরীক্ষা কেন্দ্র — MCQ ও সৃজনশীল',
    description: 'HSC ICT-র টপিক, অধ্যায় ও পূর্ণাঙ্গ MCQ ও সৃজনশীল পরীক্ষা — ফ্রি টপিকে লগইন ছাড়াই পরীক্ষা দাও।',
  },
  '/login': { title: 'লগইন' },
  '/register': { title: 'ফ্রি অ্যাকাউন্ট খোলো', description: 'ICT Crack-এ ফ্রি অ্যাকাউন্ট খোলো — ১৫ দিন সব অধ্যায়, পরীক্ষা ও AI মূল্যায়ন ফ্রি।' },
};
// Personal pages: useful only signed in, so search engines should not list them.
const PRIVATE = /^\/(dashboard|plan|leaderboard|badges|profile|subscribe|admin|practice|exams\/(attempts|mistakes))(\/|$)/;

function setTag(selector, create, value) {
  let el = document.head.querySelector(selector);
  if (value == null) return el?.remove();
  if (!el) {
    el = document.createElement(create.tag);
    Object.entries(create.attrs).forEach(([k, v]) => el.setAttribute(k, v));
    document.head.appendChild(el);
  }
  el.setAttribute(create.tag === 'link' ? 'href' : 'content', value);
}
const meta = (name, value) => setTag(`meta[name="${name}"]`, { tag: 'meta', attrs: { name } }, value);
const prop = (property, value) => setTag(`meta[property="${property}"]`, { tag: 'meta', attrs: { property } }, value);

/** title: page name (the brand is appended unless raw); path defaults to the current one. */
export function applySeo({ title, raw, description = DEFAULT_DESCRIPTION, path = window.location.pathname, noindex = false }) {
  const full = !title ? `${BRAND} — HSC ICT শেখো সহজে` : raw ? title : `${title} | ${BRAND}`;
  const url = SITE_URL + (path === '/' ? '/' : path.replace(/\/$/, ''));
  document.title = full;
  meta('description', description);
  meta('robots', noindex ? 'noindex, nofollow' : null);
  setTag('link[rel="canonical"]', { tag: 'link', attrs: { rel: 'canonical' } }, noindex ? null : url);
  prop('og:title', full);
  prop('og:description', description);
  prop('og:url', url);
  meta('twitter:title', full);
  meta('twitter:description', description);
}

/** Per-route defaults; a layout effect so it runs before the page's own useSeo (passive effects run later). */
export function SeoDefaults() {
  const { pathname } = useLocation();
  useLayoutEffect(() => {
    const page = PAGES[pathname.replace(/(.)\/$/, '$1')];
    applySeo(page ?? { noindex: PRIVATE.test(pathname) });
  }, [pathname]);
  return null;
}

/** Page-specific tags once its data has loaded (skips while title is empty). */
export function useSeo({ title, description, noindex }) {
  useEffect(() => {
    if (title) applySeo({ title, description: description || undefined, noindex });
  }, [title, description, noindex]);
}
