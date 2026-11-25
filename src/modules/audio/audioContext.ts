import { createContext, useContext, useSyncExternalStore } from 'react';
import type {
  SoundEffect,
  SoundEffectsPlayer,
  SoundEffectsSnapshot,
} from './soundEffects';
import type { SpeakOptions, SpeechPlayer, SpeechSnapshot } from './speech';

export interface SoundEffectsValue extends SoundEffectsSnapshot {
  play: (effect: SoundEffect) => void;
  setEnabled: (enabled: boolean) => void;
  toggle: () => void;
  remainingMs: () => number;
}

export interface SpeechValue extends SpeechSnapshot {
  speak: (text: string, options?: SpeakOptions) => boolean;
  cancel: () => void;
  setEnabled: (enabled: boolean) => void;
  toggle: () => void;
}

export const SoundEffectsContext = createContext<SoundEffectsPlayer | null>(null);
export const SpeechContext = createContext<SpeechPlayer | null>(null);

export function useSoundEffects(): SoundEffectsValue {
  const player = useContext(SoundEffectsContext);
  if (!player) {
    throw new Error('useSoundEffects debe usarse dentro de <AudioProvider>.');
  }

  const snapshot = useSyncExternalStore(player.subscribe, player.getSnapshot, player.getSnapshot);

  return {
    ...snapshot,
    play: player.play,
    setEnabled: player.setEnabled,
    toggle: player.toggle,
    remainingMs: player.remainingMs,
  };
}

export function useSpeech(): SpeechValue {
  const player = useContext(SpeechContext);
  if (!player) {
    throw new Error('useSpeech debe usarse dentro de <AudioProvider>.');
  }

  const snapshot = useSyncExternalStore(player.subscribe, player.getSnapshot, player.getSnapshot);

  return {
    ...snapshot,
    speak: player.speak,
    cancel: player.cancel,
    setEnabled: player.setEnabled,
    toggle: player.toggle,
  };
}
