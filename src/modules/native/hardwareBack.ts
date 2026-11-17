import { Capacitor } from '@capacitor/core';
import { ROUTES } from '@/app/router';

/**
 * Botón Atrás físico de Android.
 *
 * - Si hay historial interno (por ejemplo, estamos en una lección), vuelve a la
 *   pantalla anterior.
 * - En la portada cierra la app en lugar de dejar un WebView vacío.
 *
 * El plugin se carga de forma diferida y solo en Android para que la versión
 * web no incluya código nativo innecesario.
 */
export async function registerHardwareBack(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    const { App } = await import('@capacitor/app');

    await App.addListener('backButton', ({ canGoBack }) => {
      const hash = window.location.hash || ROUTES.home;

      if (hash !== ROUTES.home && (canGoBack || window.history.length > 1)) {
        window.history.back();
        return;
      }

      void App.exitApp();
    });
  } catch (error) {
    console.warn('[Aprende y Traza] No se pudo preparar el botón Atrás.', error);
  }
}
