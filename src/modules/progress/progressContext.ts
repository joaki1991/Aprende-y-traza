import { createContext, useContext } from 'react';
import type { ProgressSnapshot } from './progress.types';
import type { PracticeRecordInput } from './progress.repository';
import type { ProgressSummary } from './progress.utils';

export type ProgressStatus = 'loading' | 'ready' | 'error';

export interface ProgressContextValue {
  progress: ProgressSnapshot;
  summary: ProgressSummary;
  status: ProgressStatus;
  refresh: () => void;
  /** Guarda una ronda de práctica en IndexedDB y actualiza el contexto. */
  recordPractice: (input: PracticeRecordInput) => Promise<void>;
}

export const ProgressContext = createContext<ProgressContextValue | undefined>(undefined);

export function useProgress(): ProgressContextValue {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error('useProgress debe usarse dentro de <ProgressProvider>.');
  }
  return context;
}
