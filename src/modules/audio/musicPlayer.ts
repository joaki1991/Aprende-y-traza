import { loadMusicMuted, saveMusicMuted } from './musicPreferences';

/**
 * Reproductor único de música ambiental.
 *
 * No importa React ni conoce ninguna pantalla. El proveedor lo monta una sola
 * vez y comparte el mismo `HTMLAudioElement` con toda la app, de modo que
 * cambiar de ruta no reinicia la canción.
 */

/** Archivo local servido desde `public/audio/music/`. */
export const MUSIC_SOURCE = `${import.meta.env.BASE_URL}audio/music/background-music.mp3`;

/** Volumen moderado para una app infantil. */
export const MUSIC_VOLUME = 0.24;

export interface MusicSnapshot {
  /** Preferencia del usuario: true si ha silenciado la música. */
  muted: boolean;
  /** Estado real del elemento de audio en este instante. */
  playing: boolean;
  /** El archivo no existe o el navegador no puede decodificarlo. */
  unavailable: boolean;
}

export interface MusicPlayer {
  getSnapshot: () => MusicSnapshot;
  subscribe: (listener: () => void) => () => void;
  /** Conecta la reproducción automática y la visibilidad. Devuelve el cleanup. */
  attach: () => () => void;
  setMuted: (muted: boolean) => void;
  toggle: () => void;
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

export function createMusicPlayer(): MusicPlayer {
  const listeners = new Set<() => void>();

  let audio: HTMLAudioElement | null = null;
  let muted = loadMusicMuted();
  let unavailable = false;
  let snapshot: MusicSnapshot = { muted, playing: false, unavailable };

  let attached = false;
  let detachVisibility: (() => void) | null = null;
  let unlockBound = false;

  const notify = (patch: Partial<MusicSnapshot>) => {
    const next: MusicSnapshot = { ...snapshot, ...patch };
    if (
      next.muted === snapshot.muted &&
      next.playing === snapshot.playing &&
      next.unavailable === snapshot.unavailable
    ) {
      return;
    }
    snapshot = next;
    for (const listener of listeners) {
      listener();
    }
  };

  function unbindUnlockGesture(): void {
    if (!unlockBound) {
      return;
    }
    unlockBound = false;
    document.removeEventListener('pointerdown', handleFirstGesture);
    document.removeEventListener('keydown', handleFirstGesture);
  }

  const ensureAudio = (): HTMLAudioElement | null => {
    if (audio) {
      return audio;
    }
    if (typeof Audio === 'undefined') {
      unavailable = true;
      notify({ unavailable: true });
      return null;
    }

    try {
      const element = new Audio();
      element.src = MUSIC_SOURCE;
      element.loop = true;
      element.preload = 'auto';
      element.volume = MUSIC_VOLUME;

      element.addEventListener('playing', () => notify({ playing: true }));
      element.addEventListener('pause', () => notify({ playing: false }));
      element.addEventListener('ended', () => notify({ playing: false }));
      element.addEventListener('error', () => {
        // Archivo ausente o formato no soportado: la app sigue funcionando.
        unavailable = true;
        notify({ playing: false, unavailable: true });
        console.info('[Aprende y Traza] La música ambiental no está disponible.');
      });

      audio = element;
      return element;
    } catch {
      unavailable = true;
      notify({ unavailable: true });
      return null;
    }
  };

  function handleFirstGesture(): void {
    unbindUnlockGesture();
    attemptPlay();
  }

  /**
   * Los navegadores móviles pueden bloquear el audio automático. En ese caso
   * se espera al primer toque o tecla real del usuario, sin mostrar errores.
   */
  function bindUnlockGesture(): void {
    if (unlockBound || muted || unavailable || typeof document === 'undefined') {
      return;
    }
    unlockBound = true;
    document.addEventListener('pointerdown', handleFirstGesture, { passive: true });
    document.addEventListener('keydown', handleFirstGesture);
  }

  function attemptPlay(): void {
    if (muted || unavailable) {
      return;
    }

    const element = ensureAudio();
    if (!element) {
      return;
    }

    try {
      const result: unknown = element.play();
      if (result instanceof Promise) {
        void result.catch((error: unknown) => {
          if (isAbortError(error)) {
            // Un pause inmediato cancela el play; no es un bloqueo real.
            return;
          }
          bindUnlockGesture();
        });
      }
    } catch {
      bindUnlockGesture();
    }
  }

  const setMuted = (nextMuted: boolean) => {
    if (nextMuted === muted) {
      if (!nextMuted) {
        attemptPlay();
      }
      return;
    }

    muted = nextMuted;
    saveMusicMuted(nextMuted);
    notify({ muted: nextMuted });

    if (nextMuted) {
      unbindUnlockGesture();
      audio?.pause();
      return;
    }

    attemptPlay();
  };

  const attach = () => {
    if (attached || typeof document === 'undefined') {
      return () => undefined;
    }

    attached = true;

    const onVisibilityChange = () => {
      if (document.hidden) {
        audio?.pause();
        return;
      }
      attemptPlay();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    detachVisibility = () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };

    attemptPlay();

    return () => {
      attached = false;
      detachVisibility?.();
      detachVisibility = null;
      unbindUnlockGesture();
      audio?.pause();
    };
  };

  return {
    getSnapshot: () => snapshot,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    attach,
    setMuted,
    toggle: () => setMuted(!muted),
  };
}
