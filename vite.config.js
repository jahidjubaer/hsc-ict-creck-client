import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

// content/ lives outside the client root, so Vite does not watch it by default; the dev lesson preview
// (/dev/lesson/…) globs it and should see lesson files added while the server runs.
const watchContent = {
  name: 'watch-content',
  apply: 'serve',
  configureServer(server) {
    server.watcher.add(fileURLToPath(new URL('../content', import.meta.url)));
  },
};

export default defineConfig({
  plugins: [react(), tailwindcss(), watchContent],
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
