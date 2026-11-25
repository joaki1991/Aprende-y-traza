import { useEffect, useState, type ReactNode } from 'react';
import { SoundEffectsContext, SpeechContext } from './audioContext';
import { createSoundEffectsPlayer, type SoundEffectsPlayer } from './soundEffects';
import { createSpeechPlayer, type SpeechPlayer } from './speech';

/**
 * Proveedor único de efectos y voz.
 *
 * Vive por encima del router: la música de recompensa sigue sonando aunque la
 * pantalla de trazado se sustituya por la de celebración. Los reproductores se
 * crean una sola vez y se pueden inyectar en pruebas.
 */

interface AudioProviderProps {
  children: ReactNode;
  /** Solo para pruebas: permite observar los efectos. */
  effects?: SoundEffectsPlayer;
  /** Solo para pruebas: permite observar la voz. */
  speech?: SpeechPlayer;
}

export function AudioProvider({ children, effects, speech }: AudioProviderProps) {
  const [effectsPlayer] = useState<SoundEffectsPlayer>(
    () => effects ?? createSoundEffectsPlayer(),
  );
  const [speechPlayer] = useState<SpeechPlayer>(() => speech ?? createSpeechPlayer());

  useEffect(() => {
    // Al desmontar la app se corta la locución en curso; el reproductor sigue
    // siendo reutilizable, así que no se destruye (StrictMode monta dos veces).
    return () => {
      speechPlayer.cancel();
    };
  }, [speechPlayer]);

  return (
    <SoundEffectsContext.Provider value={effectsPlayer}>
      <SpeechContext.Provider value={speechPlayer}>{children}</SpeechContext.Provider>
    </SoundEffectsContext.Provider>
  );
}
