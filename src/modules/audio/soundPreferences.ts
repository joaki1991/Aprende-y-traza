/**
 * Preferencia de efectos de sonido.
 *
 * Igual que la música, es un ajuste diminuto y síncrono: vive en
 * `localStorage` y no toca IndexedDB ni el progreso educativo.
 */

export const EFFECTS_ENABLED_STORAGE_KEY = 'aprende-y-traza.effects.enabled';

function storage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function loadEffectsEnabled(): boolean {
  try {
    const stored = storage()?.getItem(EFFECTS_ENABLED_STORAGE_KEY);
    return stored === null || stored === undefined ? true : stored === 'true';
  } catch {
    return true;
  }
}

export function saveEffectsEnabled(enabled: boolean): void {
  try {
    storage()?.setItem(EFFECTS_ENABLED_STORAGE_KEY, enabled ? 'true' : 'false');
  } catch {
    // Si el almacenamiento está bloqueado, dura lo que dure la sesión.
  }
}
