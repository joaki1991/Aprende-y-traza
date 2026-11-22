import { createContext, useContext } from 'react';
import type { ArtworkState } from '@/modules/artworks/artwork.types';
import type { ProgressSnapshot } from './progress.types';
import type { PracticeRecordInput, PracticeRecordSummary } from './progress.repository';
import type { ProgressSummary } from './progress.utils';

export type ProgressStatus = 'loading' | 'ready' | 'error';

export interface ProgressContextValue {
  progress: ProgressSnapshot;
  summary: ProgressSummary;
  status: ProgressStatus;
  refresh: () => void;
  /** Guarda una ronda de práctica y devuelve la recompensa obtenida. */
  recordPractice: (input: PracticeRecordInput) => Promise<PracticeRecordSummary | null>;
  /** Guarda una composición y actualiza el contexto. */
  saveArtwork: (artwork: ArtworkState) => Promise<ProgressSnapshot | null>;
}

export const ProgressContext = createContext<ProgressContextValue | undefined>(undefined);

export function useProgress(): ProgressContextValue {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error('useProgress debe usarse dentro de <ProgressProvider>.');
  }
  return context;
}
