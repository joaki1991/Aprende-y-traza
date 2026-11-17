export const PROGRESS_SCHEMA_VERSION = 1;

export interface CharacterProgress {
  characterId: string;
  packId: string;
  attempts: number;
  starsEarned: number;
  /** Precisión entre 0 y 1 del mejor intento. */
  bestAccuracy: number;
  lastPracticedAt: number;
}

export interface ProgressSnapshot {
  schemaVersion: typeof PROGRESS_SCHEMA_VERSION;
  /** Estrellas disponibles para desbloquear recompensas. */
  stars: number;
  characters: Record<string, CharacterProgress>;
  updatedAt: number;
}

export function createEmptyProgress(): ProgressSnapshot {
  return {
    schemaVersion: PROGRESS_SCHEMA_VERSION,
    stars: 0,
    characters: {},
    updatedAt: 0,
  };
}
