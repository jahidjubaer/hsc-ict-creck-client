// Offline support shared by auth and lessons. The service worker (vite.config.js) caches /api/chapters…
// responses in LESSON_CACHE; the last signed-in user is kept here so the app opens without a network.

export const LESSON_CACHE = 'ict-lessons';
const USER_KEY = 'ict-offline-user';

export function rememberUser(user) {
  try {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    /* storage blocked: offline sign-in just won't be available */
  }
}

export function savedUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY)) || null;
  } catch {
    return null;
  }
}

/** On logout: forget the user and their cached lessons (they include highlights and notes). */
export async function forgetOfflineData() {
  try {
    localStorage.removeItem(USER_KEY);
  } catch {
    /* ignore */
  }
  if ('caches' in window) await caches.delete(LESSON_CACHE).catch(() => {});
}

/** True when an axios error means "no network" rather than an answer from the server. */
export const isNetworkError = (err) => !err?.response;

/** Downloads every topic of a chapter (fetchTopic(slug) → request) so the service worker caches them. */
export async function saveChapterOffline(fetchTopic, topics, onProgress) {
  let done = 0;
  let failed = 0;
  for (const t of topics) {
    try {
      await fetchTopic(t.slug);
    } catch {
      failed++;
    }
    onProgress?.(++done, topics.length);
  }
  return { saved: done - failed, failed };
}

/** Which topics of a chapter are already in the offline cache (by request URL). */
export async function cachedTopicSlugs(chapterSlug) {
  if (!('caches' in window)) return new Set();
  const cache = await caches.open(LESSON_CACHE);
  const prefix = `/api/chapters/${chapterSlug}/topics/`;
  const keys = await cache.keys();
  return new Set(keys.map((r) => new URL(r.url).pathname).filter((p) => p.startsWith(prefix)).map((p) => p.slice(prefix.length)));
}
