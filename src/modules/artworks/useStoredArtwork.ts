import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useProgress } from '@/modules/progress/progressContext';
import {
  createEmptyArtwork,
  type ArtworkState,
} from './artwork.types';

export type ArtworkUpdater = ArtworkState | ((current: ArtworkState) => ArtworkState);

export interface StoredArtwork {
  artwork: ArtworkState;
  /** Aplica un cambio y programa el autoguardado vectorial. */
  update: (updater: ArtworkUpdater) => void;
  /** Guarda un punto de retorno antes de una acción que puede deshacerse. */
  checkpoint: () => void;
  undo: () => void;
  canUndo: boolean;
  pendingSave: boolean;
}

const SAVE_DELAY_MS = 650;
const HISTORY_LIMIT = 30;

/**
 * Estado local de una composición con autoguardado en IndexedDB.
 *
 * El guardado nunca ocurre en cada movimiento del pincel: se agrupa con un
 * pequeño retardo y se fuerza al ocultar la pestaña o desmontar la pantalla.
 * Solo se persisten datos vectoriales.
 *
 * La pantalla que usa este hook se monta de nuevo al cambiar de composición
 * (el router aplica una `key` por ruta), así que no hace falta reiniciar el
 * estado a mitad de vida del componente.
 */
export function useStoredArtwork(artworkId: string): StoredArtwork {
  const { progress, saveArtwork } = useProgress();
  const empty = useMemo(() => createEmptyArtwork(artworkId), [artworkId]);
  const stored = progress.artworks[artworkId];

  // `draft` solo existe cuando la niña ya ha tocado la composición; hasta
  // entonces se muestra lo que haya en IndexedDB, sin copiarlo en un efecto.
  const [draft, setDraft] = useState<ArtworkState | null>(null);
  const [historyLength, setHistoryLength] = useState(0);
  const [pendingSave, setPendingSave] = useState(false);

  const draftRef = useRef<ArtworkState | null>(null);
  const latestRef = useRef<ArtworkState | null>(null);
  const historyRef = useRef<ArtworkState[]>([]);
  const dirtyRef = useRef(false);
  const timerRef = useRef<number | null>(null);
  const flushRef = useRef<(() => Promise<void>) | null>(null);

  const artwork = draft ?? stored ?? empty;

  const scheduleSave = useCallback((next: ArtworkState) => {
    latestRef.current = next;
    dirtyRef.current = true;
    setPendingSave(true);

    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }

    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      void flushRef.current?.();
    }, SAVE_DELAY_MS);
  }, []);

  const flush = useCallback(async () => {
    const latest = latestRef.current;
    if (!dirtyRef.current || !latest) {
      return;
    }

    dirtyRef.current = false;
    setPendingSave(false);
    await saveArtwork(latest);
  }, [saveArtwork]);

  // El temporizador y el desmontaje usan la versión más reciente de `flush`
  // sin reiniciar el temporizador en cada render.
  useEffect(() => {
    flushRef.current = flush;
  }, [flush]);

  const update = useCallback(
    (updater: ArtworkUpdater) => {
      const current = draftRef.current ?? stored ?? empty;
      const next = typeof updater === 'function' ? updater(current) : updater;
      if (next === current) {
        return;
      }

      draftRef.current = next;
      setDraft(next);
      scheduleSave(next);
    },
    [stored, empty, scheduleSave],
  );

  const checkpoint = useCallback(() => {
    const current = draftRef.current ?? stored ?? empty;
    const history = historyRef.current;
    history.push(current);
    if (history.length > HISTORY_LIMIT) {
      history.splice(0, history.length - HISTORY_LIMIT);
    }
    setHistoryLength(history.length);
  }, [stored, empty]);

  const undo = useCallback(() => {
    const history = historyRef.current;
    const previous = history.pop();
    if (!previous) {
      return;
    }

    setHistoryLength(history.length);
    draftRef.current = previous;
    setDraft(previous);
    scheduleSave(previous);
  }, [scheduleSave]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState !== 'hidden') {
        return;
      }

      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      void flushRef.current?.();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      void flushRef.current?.();
    };
  }, []);

  return {
    artwork,
    update,
    checkpoint,
    undo,
    canUndo: historyLength > 0,
    pendingSave,
  };
}
