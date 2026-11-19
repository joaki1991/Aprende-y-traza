import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  loadProgress,
  recordPractice as recordPracticeInStorage,
  type PracticeRecordInput,
} from './progress.repository';
import { createEmptyProgress, type ProgressSnapshot } from './progress.types';
import { summarizeProgress } from './progress.utils';
import {
  ProgressContext,
  type ProgressContextValue,
  type ProgressStatus,
} from './progressContext';

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<ProgressSnapshot>(createEmptyProgress);
  const [status, setStatus] = useState<ProgressStatus>('loading');
  const [reloadToken, setReloadToken] = useState(0);

  const refresh = useCallback(() => {
    setStatus('loading');
    setReloadToken((token) => token + 1);
  }, []);

  const recordPractice = useCallback(async (input: PracticeRecordInput) => {
    try {
      const snapshot = await recordPracticeInStorage(input);
      setProgress(snapshot);
      setStatus('ready');
    } catch (error) {
      console.error('[Aprende y Traza] No se pudo guardar la práctica.', error);
    }
  }, []);

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const snapshot = await loadProgress();
        if (!active) {
          return;
        }
        setProgress(snapshot);
        setStatus('ready');
      } catch (error) {
        console.error('[Aprende y Traza] No se pudo cargar el progreso local.', error);
        if (active) {
          setStatus('error');
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [reloadToken]);

  const value = useMemo<ProgressContextValue>(
    () => ({
      progress,
      summary: summarizeProgress(progress),
      status,
      refresh,
      recordPractice,
    }),
    [progress, status, refresh, recordPractice],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}
