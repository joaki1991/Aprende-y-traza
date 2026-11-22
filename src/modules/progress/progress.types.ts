import type { ArtworkState } from '@/modules/artworks/artwork.types';

/**
 * Versión del documento de progreso.
 *
 * - v1: estrellas, fichas practicadas y nada más (Sprints 1–2).
 * - v2: añade composiciones guardadas (dibujos coloreados y pizarra libre).
 *
 * La migración v1 → v2 es no destructiva y se ejecuta al leer el registro.
 */
export const PROGRESS_SCHEMA_VERSION = 2;

export type ProgressSchemaVersion = 1 | 2;

export type PracticeResult = 'completed' | 'incomplete';

export interface CharacterProgress {
  characterId: string;
  packId: string;
  /** Intentos de trazo registrados (incluidos los que no se completaron). */
  attempts: number;
  /** Estrellas ganadas por esta ficha; 1 la primera vez que se completa. */
  starsEarned: number;
  /** Precisión entre 0 y 1 del mejor intento. */
  bestAccuracy: number;
  /** Veces que se completó la ficha entera. Opcional en datos antiguos. */
  completions?: number;
  /** Resultado del último intento. Opcional en datos antiguos. */
  lastResult?: PracticeResult;
  lastPracticedAt: number;
}

export interface ProgressSnapshot {
  schemaVersion: typeof PROGRESS_SCHEMA_VERSION;
  /** Estrellas acumuladas; nunca se gastan, solo desbloquean hitos. */
  stars: number;
  characters: Record<string, CharacterProgress>;
  /** Composiciones guardadas por id (`letter-a`, `number-0`, `playground`). */
  artworks: Record<string, ArtworkState>;
  updatedAt: number;
}

export function createEmptyProgress(): ProgressSnapshot {
  return {
    schemaVersion: PROGRESS_SCHEMA_VERSION,
    stars: 0,
    characters: {},
    artworks: {},
    updatedAt: 0,
  };
}
