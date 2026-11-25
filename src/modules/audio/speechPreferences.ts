/**
 * Preferencia de voz.
 *
 * Independiente de la música y de los efectos. Se guarda en `localStorage`
 * para poder leerla antes de montar React y no bloquear la interfaz.
 */

export const SPEECH_ENABLED_STORAGE_KEY = 'aprende-y-traza.speech.enabled';

function storage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function loadSpeechEnabled(): boolean {
  try {
    const stored = storage()?.getItem(SPEECH_ENABLED_STORAGE_KEY);
    return stored === null || stored === undefined ? true : stored === 'true';
  } catch {
    return true;
  }
}

export function saveSpeechEnabled(enabled: boolean): void {
  try {
    storage()?.setItem(SPEECH_ENABLED_STORAGE_KEY, enabled ? 'true' : 'false');
  } catch {
    // Si el almacenamiento está bloqueado, dura lo que dure la sesión.
  }
}
