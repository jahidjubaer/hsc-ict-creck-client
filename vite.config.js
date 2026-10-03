import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// content/ lives outside the client root, so Vite does not watch it by default; the dev lesson preview
// (/dev/lesson/…) globs it and should see lesson files added while the server runs.
const watchContent = {
  name: 'watch-content',
  apply: 'serve',
  configureServer(server) {
    server.watcher.add(fileURLToPath(new URL('../content', import.meta.url)));
  },
};

// Preload the regular Bangla font file: every page's text needs it, and CSS would otherwise discover it late.
const preloadBanglaFont = {
  name: 'preload-bangla-font',
  apply: 'build',
  transformIndexHtml: {
    order: 'post',
    handler(_html, ctx) {
      const file = Object.keys(ctx.bundle ?? {}).find((f) => /hind-siliguri-bengali-400-normal-[\w-]+\.woff2$/.test(f));
      return file ? [{ tag: 'link', attrs: { rel: 'preload', href: `/${file}`, as: 'font', type: 'font/woff2', crossorigin: '' }, injectTo: 'head' }] : [];
    },
  },
};

// Installable app + offline use. The whole app (~1 MB gzipped) is precached so every page and lab opens offline;
// lessons are cached as they are opened (or with "save chapter offline") and served from cache when the network fails.
const pwa = VitePWA({
  registerType: 'prompt', // a new version waits for the student's OK, so an open page never loses its code chunks
  includeAssets: ['favicon.svg', 'favicon.ico', 'apple-touch-icon-180x180.png'],
  manifest: {
    name: 'ICT Crack — HSC ICT',
    short_name: 'ICT Crack',
    description: 'HSC ICT শেখো সহজে — ইন্টারঅ্যাকটিভ পাঠ, ল্যাব, MCQ ও সৃজনশীল প্রশ্ন।',
    lang: 'bn',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#5b5bd6',
    icons: [
      { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
      { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
      { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  },
  workbox: {
    // fonts: only the Bangla/Latin text faces up front; code-font and other subsets are cached when first used
    globPatterns: ['**/*.{js,css,html,svg,png,ico,wasm}', '**/hind-siliguri-{bengali,latin}-*.woff2'],
    globIgnores: ['**/Admin*.js', '**/AiReviewPage*.js', '**/Question{s,Edit}*.js'],
    maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
    navigateFallback: '/index.html',
    navigateFallbackDenylist: [/^\/api\//],
    cleanupOutdatedCaches: true,
    runtimeCaching: [
      {
        // chapter list, chapter pages and lessons (same URLs the app requests; name shared with src/lib/offline.js)
        urlPattern: ({ url, request }) => request.method === 'GET' && /^\/api\/chapters(\/|$)/.test(url.pathname),
        handler: 'NetworkFirst',
        options: {
          cacheName: 'ict-lessons',
          networkTimeoutSeconds: 8,
          cacheableResponse: { statuses: [200] },
          matchOptions: { ignoreVary: true },
          expiration: { maxEntries: 150 },
        },
      },
      {
        urlPattern: ({ url }) => url.pathname.endsWith('.woff2'),
        handler: 'CacheFirst',
        options: { cacheName: 'fonts', expiration: { maxEntries: 30 } },
      },
    ],
  },
});

export default defineConfig({
  plugins: [react(), tailwindcss(), watchContent, preloadBanglaFont, pwa],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    host: '127.0.0.1',
    port: Number(process.env.VITE_PORT) || 5180,
    strictPort: true,
    proxy: { '/api': process.env.API_PROXY || 'http://localhost:5000' }, // overridable for side-by-side test servers
  },
});
