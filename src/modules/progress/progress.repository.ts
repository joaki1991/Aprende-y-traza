import { deleteRecord, getRecord, putRecord } from '@/modules/storage/db';
import {
  PROGRESS_SCHEMA_VERSION,
  createEmptyProgress,
  type CharacterProgress,
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

export interface PracticeRecordInput {
  packId: string;
  characterId: string;
  /** Intentos que se suman; por defecto, uno. */
  attempts?: number;
  completed: boolean;
  /** Precisión global del intento, entre 0 y 1. */
  accuracy?: number;
}

function clampUnit(value: number | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0;
  }
  return Math.min(1, Math.max(0, value));
}

/** Una precisión guardada solo es válida dentro de 0–1; si no, se descarta. */
function storedAccuracy(value: number | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1) {
    return 0;
  }
  return value;
}

function safeAttempts(value: number | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 1) {
    return 1;
  }
  return Math.floor(value);
}

function normalizeCharacter(
  previous: CharacterProgress | undefined,
  packId: string,
  characterId: string,
): CharacterProgress {
  const attempts =
    typeof previous?.attempts === 'number' && Number.isFinite(previous.attempts)
      ? Math.max(0, Math.floor(previous.attempts))
      : 0;
  const starsEarned =
    typeof previous?.starsEarned === 'number' && Number.isFinite(previous.starsEarned)
      ? Math.max(0, Math.floor(previous.starsEarned))
      : 0;
  const completions =
    typeof previous?.completions === 'number' && Number.isFinite(previous.completions)
      ? Math.max(0, Math.floor(previous.completions))
      : 0;

  return {
    characterId,
    packId,
    attempts,
    starsEarned,
    bestAccuracy: storedAccuracy(previous?.bestAccuracy),
    completions,
    lastResult: previous?.lastResult,
    lastPracticedAt:
      typeof previous?.lastPracticedAt === 'number' && Number.isFinite(previous.lastPracticedAt)
        ? previous.lastPracticedAt
        : 0,
  };
}

/**
 * Registra una ronda de práctica en el progreso existente.
 *
 * Se guarda el número de intentos, si se completó la ficha, la mejor precisión
 * y la fecha. No se tocan las estrellas: su economía definitiva llega en un
 * sprint posterior.
 */
export async function recordPractice(input: PracticeRecordInput): Promise<ProgressSnapshot> {
  const current = await loadProgress();
  const previous = current.characters[input.characterId];
  const character = normalizeCharacter(previous, input.packId, input.characterId);
  const accuracy = clampUnit(input.accuracy);
  const now = Date.now();

  const updatedCharacter: CharacterProgress = {
    ...character,
    attempts: character.attempts + safeAttempts(input.attempts),
    bestAccuracy: Math.max(character.bestAccuracy, accuracy),
    completions: (character.completions ?? 0) + (input.completed ? 1 : 0),
    lastResult: input.completed ? 'completed' : 'incomplete',
    lastPracticedAt: now,
  };

  const updated: ProgressSnapshot = {
    ...current,
    characters: {
      ...current.characters,
      [input.characterId]: updatedCharacter,
    },
    updatedAt: now,
  };

  await saveProgress(updated);
  return updated;
}

export async function resetProgress(): Promise<ProgressSnapshot> {
  await deleteRecord('progress', PROGRESS_RECORD_ID);
  return createEmptyProgress();
}
