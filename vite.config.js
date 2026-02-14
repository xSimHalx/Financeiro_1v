import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEBUG_LOG = path.join(__dirname, '.cursor', 'debug.log');

// #region agent log
function logVite500(req, res, body) {
  try {
    fs.mkdirSync(path.dirname(DEBUG_LOG), { recursive: true });
    const bodyStr = body == null ? '' : (typeof body === 'string' ? body : (body.toString && body.toString()) || '');
    const payload = JSON.stringify({
      location: 'vite-500',
      message: bodyStr.slice(0, 2000),
      data: { url: req.url, status: res.statusCode },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      hypothesisId: 'H-vite'
    }) + '\n';
    fs.appendFileSync(DEBUG_LOG, payload);
  } catch (_) {}
}
// #endregion

export default defineConfig({
  server: {
    watch: {
      ignored: ['**/src-tauri/target/**', '**/target/**', '**/.git/**']
    }
  },
  plugins: [
    react(),
    {
      name: 'debug-log-500',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const origEnd = res.end.bind(res);
          res.end = function (body, ...a) {
            if (res.statusCode === 500 && req.url && (req.url.includes('db.js') || req.url.includes('ProviderDados'))) {
              logVite500(req, res, body);
            }
            return origEnd(body, ...a);
          };
          next();
        });
      }
    },
    VitePWA({
      disable: process.env.VITE_PWA_ENABLED === 'false',
      registerType: 'autoUpdate',
      workbox: {
        cacheId: 'vertexads-sync-v2',
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          // Sync e auth: sempre usar rede (NetworkOnly) - nunca cachear para evitar dados desatualizados
          { urlPattern: /\/sync(\?|$|\/)/, handler: 'NetworkOnly', method: 'GET' },
          { urlPattern: /\/sync(\?|$|\/)/, handler: 'NetworkOnly', method: 'POST' },
          { urlPattern: /\/auth\//, handler: 'NetworkOnly' }
        ]
      },
      manifest: {
        name: 'VertexAds Financeiro',
        short_name: 'VertexAds',
        description: 'Controle financeiro offline-first',
        theme_color: '#0f172a',
        background_color: '#020617',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icon.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any' },
          { src: '/icon.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': '/src'
    }
  }
});
