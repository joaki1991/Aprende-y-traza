import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Configuración base de Capacitor.
 * El proyecto nativo vive en `android/` y se regenera/sincroniza con `npm run android:sync`.
 */
const config: CapacitorConfig = {
  appId: 'com.aprendeytraza.app',
  appName: 'Aprende y Traza',
  webDir: 'dist',
  backgroundColor: '#fff6fb',
  server: {
    androidScheme: 'https',
  },
  android: {
    backgroundColor: '#fff6fb',
    allowMixedContent: false,
  },
};

export default config;
