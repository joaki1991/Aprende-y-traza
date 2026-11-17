import { Capacitor } from '@capacitor/core';
import { registerSW } from 'virtual:pwa-register';

/**
 * Registra el Service Worker solo en la versión web instalable.
 * En Android mediante Capacitor los archivos ya viven en el dispositivo y no
 * conviene que un Service Worker interfiera con el contenido nativo.
 */
export function registerPwa(): void {
  if (!import.meta.env.PROD || Capacitor.isNativePlatform()) {
    return;
  }

  registerSW({
    immediate: true,
    onOfflineReady() {
      console.info('[Aprende y Traza] Lista para funcionar sin conexión.');
    },
    onRegisterError(error) {
      console.warn('[Aprende y Traza] No se pudo preparar el modo offline.', error);
    },
  });
}
