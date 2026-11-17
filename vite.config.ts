import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * La app se sirve con rutas relativas para que funcione igual en:
 * - Vite en local.
 * - Una PWA desplegada en la raíz o en un subdirectorio.
 * - El contenedor web de Capacitor en Android.
 */
export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: null,
      devOptions: {
        enabled: false,
      },
      manifest: {
        id: './',
        name: 'Aprende y Traza',
        short_name: 'Aprende',
        description: 'Aprende a trazar letras y números jugando con Mochi.',
        lang: 'es',
        dir: 'ltr',
        start_url: './',
        scope: './',
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui'],
        orientation: 'portrait',
        background_color: '#fff6fb',
        theme_color: '#ffd6e7',
        categories: ['education', 'kids'],
        icons: [
          {
            src: 'icons/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/maskable-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'icons/maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest,woff2,wav}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'es2022',
  },
});
