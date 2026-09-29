import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string };

// Railway injects the deployed commit at build time, so every deployment can show which
// version of the click dummy it is. Locally there is no SHA, hence the "dev" fallback.
const commit = (process.env.RAILWAY_GIT_COMMIT_SHA ?? '').slice(0, 7) || 'dev';

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __COMMIT__: JSON.stringify(commit),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Agent-J',
        short_name: 'Agent-J',
        description: 'Dein persönlicher Assistent für die täglichen Todos',
        theme_color: '#2F7BF5',
        background_color: '#F4F8FD',
        display: 'standalone',
        start_url: '/',
        lang: 'de',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png}'],
        navigateFallback: '/index.html',
      },
    }),
  ],
  server: { host: true },
  preview: { host: true },
});
