/**
 * Preferencia de silencio de la música ambiental.
 *
 * Se usa `localStorage` a propósito: es una preferencia pequeña, síncrona y
 * disponible antes de montar React. El progreso educativo sigue viviendo en
 * IndexedDB y no se toca.
 */

export const MUSIC_MUTED_STORAGE_KEY = 'aprende-y-traza.music.muted';

function storage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    // Navegadores con almacenamiento bloqueado (modo privado estricto).
    return null;
  }
}

export function loadMusicMuted(): boolean {
  try {
    return storage()?.getItem(MUSIC_MUTED_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function saveMusicMuted(muted: boolean): void {
  try {
    storage()?.setItem(MUSIC_MUTED_STORAGE_KEY, muted ? 'true' : 'false');
  } catch {
    // Si no se puede guardar, la preferencia dura lo que dure la sesión.
  }
}
