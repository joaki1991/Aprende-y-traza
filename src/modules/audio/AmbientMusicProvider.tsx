import { useEffect, useState, type ReactNode } from 'react';
import { createMusicPlayer, type MusicPlayer } from './musicPlayer';
import { MusicPlayerContext } from './musicContext';

/**
 * Un único reproductor para toda la aplicación.
 *
 * El proveedor vive por encima del router, así que navegar entre pantallas no
 * desmonta el audio ni reinicia la canción. En pruebas se puede inyectar un
 * reproductor propio sin tocar la producción.
 */

interface AmbientMusicProviderProps {
  children: ReactNode;
  /** Solo para pruebas: permite observar el reproductor. */
  player?: MusicPlayer;
}

export function AmbientMusicProvider({ children, player }: AmbientMusicProviderProps) {
  const [activePlayer] = useState<MusicPlayer>(() => player ?? createMusicPlayer());

  useEffect(() => {
    return activePlayer.attach();
  }, [activePlayer]);

  return (
    <MusicPlayerContext.Provider value={activePlayer}>{children}</MusicPlayerContext.Provider>
  );
}
