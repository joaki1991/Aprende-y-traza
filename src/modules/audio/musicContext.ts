import { createContext, useContext, useSyncExternalStore } from 'react';
import type { MusicPlayer, MusicSnapshot } from './musicPlayer';

export interface AmbientMusicValue extends MusicSnapshot {
  setMuted: (muted: boolean) => void;
  toggle: () => void;
}

export const MusicPlayerContext = createContext<MusicPlayer | null>(null);

export function useAmbientMusic(): AmbientMusicValue {
  const player = useContext(MusicPlayerContext);
  if (!player) {
    throw new Error('useAmbientMusic debe usarse dentro de <AmbientMusicProvider>.');
  }

  const snapshot = useSyncExternalStore(player.subscribe, player.getSnapshot, player.getSnapshot);

  return {
    ...snapshot,
    setMuted: player.setMuted,
    toggle: player.toggle,
  };
}
