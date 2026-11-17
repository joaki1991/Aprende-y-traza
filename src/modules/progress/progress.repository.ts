import { deleteRecord, getRecord, putRecord } from '@/modules/storage/db';
import {
  PROGRESS_SCHEMA_VERSION,
  createEmptyProgress,
  type ProgressSnapshot,
} from '@/modules/progress/progress.types';

const PROGRESS_RECORD_ID = 'default';

interface ProgressRecord {
  id: typeof PROGRESS_RECORD_ID;
  data: ProgressSnapshot;
}

/**
 * Respaldo defensivo: si el almacenamiento contiene datos de una versión
 * desconocida o corruptos, se empieza de cero en lugar de romper la app.
 */
function isProgressSnapshot(value: unknown): value is ProgressSnapshot {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<ProgressSnapshot>;
  return (
    candidate.schemaVersion === PROGRESS_SCHEMA_VERSION &&
    typeof candidate.stars === 'number' &&
    Number.isFinite(candidate.stars) &&
    candidate.stars >= 0 &&
    typeof candidate.characters === 'object' &&
    candidate.characters !== null &&
    typeof candidate.updatedAt === 'number' &&
    Number.isFinite(candidate.updatedAt)
  );
}

export async function loadProgress(): Promise<ProgressSnapshot> {
  const record = await getRecord<ProgressRecord>('progress', PROGRESS_RECORD_ID);
  if (!record || !isProgressSnapshot(record.data)) {
    return createEmptyProgress();
  }

  return record.data;
}

export async function saveProgress(snapshot: ProgressSnapshot): Promise<void> {
  await putRecord<ProgressRecord>('progress', {
    id: PROGRESS_RECORD_ID,
    data: snapshot,
  });
}

/** Suma estrellas de forma segura. Se usará al completar trazos (Sprint 3). */
export async function addStars(amount: number): Promise<ProgressSnapshot> {
  const safeAmount = Math.max(0, Math.floor(amount));
  const current = await loadProgress();
  const updated: ProgressSnapshot = {
    ...current,
    stars: current.stars + safeAmount,
    updatedAt: Date.now(),
  };

  await saveProgress(updated);
  return updated;
}

export async function resetProgress(): Promise<ProgressSnapshot> {
  await deleteRecord('progress', PROGRESS_RECORD_ID);
  return createEmptyProgress();
}
