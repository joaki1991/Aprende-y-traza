import { vi } from 'vitest';
import type { MusicPlayer, MusicSnapshot } from '@/modules/audio/musicPlayer';
import type {
  SoundEffect,
  SoundEffectsPlayer,
  SoundEffectsSnapshot,
} from '@/modules/audio/soundEffects';
import type { SpeechPlayer, SpeechSnapshot } from '@/modules/audio/speech';
import { saveEffectsEnabled } from '@/modules/audio/soundPreferences';
import { saveSpeechEnabled } from '@/modules/audio/speechPreferences';

/**
 * Reproductores de prueba con estado observable.
 *
 * Sustituyen a Web Audio, `HTMLAudioElement` y `SpeechSynthesis` en las pruebas
 * de interfaz. La lógica real de cada motor se prueba por separado.
 */

function createStore<T>(initial: T) {
  let snapshot = initial;
  const listeners = new Set<() => void>();

  return {
    get: () => snapshot,
    set: (next: T) => {
      snapshot = next;
      for (const listener of listeners) {
        listener();
      }
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export function createFakeMusicPlayer(initial: Partial<MusicSnapshot> = {}) {
  const store = createStore<MusicSnapshot>({
    muted: false,
    playing: true,
    unavailable: false,
    ...initial,
  });

  const player: MusicPlayer = {
    getSnapshot: store.get,
    subscribe: store.subscribe,
    attach: () => () => undefined,
    setMuted: (muted) => {
      store.set({ ...store.get(), muted, playing: !muted });
    },
    toggle: () => {
      player.setMuted(!store.get().muted);
    },
  };

  return { player, store };
}

export function createFakeEffectsPlayer(options: { enabled?: boolean; available?: boolean } = {}) {
  const store = createStore<SoundEffectsSnapshot>({
    enabled: options.enabled ?? true,
    available: options.available ?? true,
  });
  const played: SoundEffect[] = [];

  const player: SoundEffectsPlayer = {
    getSnapshot: store.get,
    subscribe: store.subscribe,
    play: (effect) => {
      if (store.get().enabled && store.get().available) {
        played.push(effect);
      }
    },
    setEnabled: (enabled) => {
      saveEffectsEnabled(enabled);
      store.set({ ...store.get(), enabled });
    },
    toggle: () => {
      player.setEnabled(!store.get().enabled);
    },
    remainingMs: () => 0,
    dispose: vi.fn(),
  };

  return { player, played, store };
}

export function createFakeSpeechPlayer(
  options: { enabled?: boolean; available?: boolean } = {},
) {
  const store = createStore<SpeechSnapshot>({
    enabled: options.enabled ?? true,
    available: options.available ?? true,
    speaking: false,
  });
  const spoken: string[] = [];
  const cancel = vi.fn(() => {
    store.set({ ...store.get(), speaking: false });
  });

  const player: SpeechPlayer = {
    getSnapshot: store.get,
    subscribe: store.subscribe,
    speak: (text) => {
      if (!store.get().enabled || !store.get().available) {
        return false;
      }
      spoken.push(text);
      store.set({ ...store.get(), speaking: true });
      return true;
    },
    cancel,
    setEnabled: (enabled) => {
      saveSpeechEnabled(enabled);
      store.set({ ...store.get(), enabled });
    },
    toggle: () => {
      player.setEnabled(!store.get().enabled);
    },
    dispose: vi.fn(),
  };

  return { player, spoken, cancel, store };
}
