import { deleteRecord, getRecord, putRecord } from '@/modules/storage/db';
import {
  MAX_ARTWORK_STICKERS,
  MAX_ARTWORK_STROKES,
  PLAYGROUND_ARTWORK_ID,
  createEmptyArtwork,
  type ArtworkPoint,
  type ArtworkState,
  type ArtworkStroke,
  type PlacedSticker,
} from '@/modules/artworks/artwork.types';
import { drawingIdForCharacter, hasDrawing } from '@/modules/artworks/drawings';
import { isStickerKind } from '@/modules/rewards/rewards';
import {
  PROGRESS_SCHEMA_VERSION,
  createEmptyProgress,
  type CharacterProgress,
  type PracticeResult,
  type ProgressSnapshot,
  type ProgressSchemaVersion,
} from '@/modules/progress/progress.types';

const PROGRESS_RECORD_ID = 'default';

interface ProgressRecord {
  id: typeof PROGRESS_RECORD_ID;
  data: unknown;
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

export interface PracticeRecordSummary {
  snapshot: ProgressSnapshot;
  /** Verdadero solo la primera vez que se completa la ficha. */
  starEarned: boolean;
  /** Lámina recién desbloqueada, o `null` si no había una nueva. */
  newDrawingId: string | null;
}

/**
 * Serializa las escrituras para que dos guardados simultáneos (por ejemplo,
 * terminar un trazo mientras se autoguarda un dibujo) no se pisen.
 */
let writeChain: Promise<unknown> = Promise.resolve();

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const result = writeChain.then(task, task);
  writeChain = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function safeNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function safeInteger(value: unknown): number {
  return Math.max(0, Math.floor(safeNumber(value)));
}

function clampUnit(value: unknown): number {
  return clamp(safeNumber(value), 0, 1);
}

function storedAccuracy(value: unknown): number {
  return clampUnit(value);
}

function safeAttempts(value: unknown): number {
  const attempts = safeNumber(value, 1);
  return attempts < 1 ? 1 : Math.floor(attempts);
}

function validPracticeResult(value: unknown): PracticeResult | undefined {
  return value === 'completed' || value === 'incomplete' ? value : undefined;
}

function normalizeCharacter(
  previous: Record<string, unknown> | undefined,
  packId: string,
  characterId: string,
): CharacterProgress {
  return {
    characterId,
    packId,
    attempts: safeInteger(previous?.attempts),
    starsEarned: safeInteger(previous?.starsEarned),
    bestAccuracy: storedAccuracy(previous?.bestAccuracy),
    completions: safeInteger(previous?.completions),
    lastResult: validPracticeResult(previous?.lastResult),
    lastPracticedAt: Math.max(0, safeNumber(previous?.lastPracticedAt)),
  };
}

function normalizePoint(value: unknown): ArtworkPoint | null {
  if (!isRecord(value)) {
    return null;
  }
  return {
    x: clampUnit(value.x),
    y: clampUnit(value.y),
  };
}

function normalizeStroke(value: unknown): ArtworkStroke | null {
  if (!isRecord(value) || typeof value.color !== 'string' || value.color.length === 0) {
    return null;
  }
  if (!Array.isArray(value.points)) {
    return null;
  }

  const points = value.points
    .map(normalizePoint)
    .filter((point): point is ArtworkPoint => point !== null)
    .slice(0, 600);

  if (points.length === 0) {
    return null;
  }

  return {
    color: value.color.slice(0, 32),
    widthRatio: clamp(safeNumber(value.widthRatio, 0.03), 0.004, 0.2),
    points,
  };
}

function normalizeSticker(value: unknown): PlacedSticker | null {
  if (!isRecord(value) || typeof value.id !== 'string' || value.id.length === 0) {
    return null;
  }
  if (!isStickerKind(value.kind)) {
    return null;
  }

  return {
    id: value.id.slice(0, 80),
    kind: value.kind,
    x: clampUnit(value.x),
    y: clampUnit(value.y),
    scale: clamp(safeNumber(value.scale, 0.2), 0.1, 0.45),
  };
}

function normalizeFills(value: unknown): Record<string, string> {
  if (!isRecord(value)) {
    return {};
  }

  const fills: Record<string, string> = {};
  for (const [regionId, color] of Object.entries(value)) {
    if (typeof color === 'string' && regionId.length > 0 && regionId.length <= 64) {
      fills[regionId] = color.slice(0, 32);
    }
  }
  return fills;
}

function normalizeArtwork(value: unknown, artworkId: string): ArtworkState | null {
  if (!isRecord(value)) {
    return null;
  }

  const strokes = Array.isArray(value.strokes)
    ? value.strokes
        .map(normalizeStroke)
        .filter((stroke): stroke is ArtworkStroke => stroke !== null)
        .slice(0, MAX_ARTWORK_STROKES)
    : [];

  const stickers = Array.isArray(value.stickers)
    ? value.stickers
        .map(normalizeSticker)
        .filter((sticker): sticker is PlacedSticker => sticker !== null)
        .slice(0, MAX_ARTWORK_STICKERS)
    : [];

  return {
    artworkId,
    unlockedAt: Math.max(0, safeNumber(value.unlockedAt)),
    fills: normalizeFills(value.fills),
    strokes,
    stickers,
    updatedAt: Math.max(0, safeNumber(value.updatedAt)),
  };
}

function normalizeCharacters(value: unknown): Record<string, CharacterProgress> {
  if (!isRecord(value)) {
    return {};
  }

  const characters: Record<string, CharacterProgress> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (!isRecord(entry)) {
      continue;
    }
    const packId = typeof entry.packId === 'string' ? entry.packId : '';
    const characterId = typeof entry.characterId === 'string' ? entry.characterId : key;
    if (!packId || !characterId) {
      continue;
    }
    characters[characterId] = normalizeCharacter(entry, packId, characterId);
  }
  return characters;
}

function normalizeArtworks(value: unknown): Record<string, ArtworkState> {
  if (!isRecord(value)) {
    return {};
  }

  const artworks: Record<string, ArtworkState> = {};
  for (const [artworkId, entry] of Object.entries(value)) {
    if (!hasDrawing(artworkId) && artworkId !== PLAYGROUND_ARTWORK_ID) {
      continue;
    }
    const artwork = normalizeArtwork(entry, artworkId);
    if (artwork) {
      artworks[artworkId] = artwork;
    }
  }
  return artworks;
}

/**
 * Migración v1 → v2 no destructiva.
 *
 * Las fichas ya completadas antes del Sprint 3 conservan su progreso y
 * desbloquean la lámina correspondiente. Las estrellas se nivelan con el
 * número de fichas completadas para no castigar a quien ya había practicado.
 */
function migrateFromV1(raw: Record<string, unknown>): ProgressSnapshot {
  const characters = normalizeCharacters(raw.characters);
  const artworks: Record<string, ArtworkState> = {};
  let completedCharacters = 0;

  for (const character of Object.values(characters)) {
    if ((character.completions ?? 0) <= 0) {
      continue;
    }

    completedCharacters += 1;
    character.starsEarned = Math.max(character.starsEarned, 1);

    const drawingId = drawingIdForCharacter(character.packId, character.characterId);
    if (!drawingId || artworks[drawingId]) {
      continue;
    }

    const unlockedAt =
      character.lastPracticedAt > 0 ? character.lastPracticedAt : Date.now();
    artworks[drawingId] = createEmptyArtwork(drawingId, unlockedAt);
  }

  return {
    schemaVersion: PROGRESS_SCHEMA_VERSION,
    stars: Math.max(safeInteger(raw.stars), completedCharacters),
    characters,
    artworks,
    updatedAt: Math.max(0, safeNumber(raw.updatedAt)),
  };
}

function normalizeV2(raw: Record<string, unknown>): ProgressSnapshot {
  return {
    schemaVersion: PROGRESS_SCHEMA_VERSION,
    stars: safeInteger(raw.stars),
    characters: normalizeCharacters(raw.characters),
    artworks: normalizeArtworks(raw.artworks),
    updatedAt: Math.max(0, safeNumber(raw.updatedAt)),
  };
}

function parseProgress(data: unknown): ProgressSnapshot {
  if (!isRecord(data)) {
    return createEmptyProgress();
  }

  const version = data.schemaVersion as ProgressSchemaVersion | undefined;
  if (version === 1) {
    return migrateFromV1(data);
  }
  if (version === PROGRESS_SCHEMA_VERSION) {
    return normalizeV2(data);
  }

  // Versión desconocida o corrupta: se empieza de cero sin romper la app.
  return createEmptyProgress();
}

export async function loadProgress(): Promise<ProgressSnapshot> {
  const record = await getRecord<ProgressRecord>('progress', PROGRESS_RECORD_ID);
  if (!record) {
    return createEmptyProgress();
  }
  return parseProgress(record.data);
}

export async function saveProgress(snapshot: ProgressSnapshot): Promise<void> {
  await putRecord<ProgressRecord>('progress', {
    id: PROGRESS_RECORD_ID,
    data: snapshot,
  });
}

/** Suma estrellas de forma segura. La economía no gasta estrellas. */
export async function addStars(amount: number): Promise<ProgressSnapshot> {
  const safeAmount = Math.max(0, Math.floor(amount));

  return enqueue(async () => {
    const current = await loadProgress();
    const updated: ProgressSnapshot = {
      ...current,
      stars: current.stars + safeAmount,
      updatedAt: Date.now(),
    };
    await saveProgress(updated);
    return updated;
  });
}

/**
 * Registra una ronda de práctica.
 *
 * La primera vez que se completa una ficha se concede exactamente una estrella
 * y se desbloquea su lámina. Repetir la ficha no vuelve a conceder nada.
 */
export async function recordPractice(input: PracticeRecordInput): Promise<PracticeRecordSummary> {
  return enqueue(async () => {
    const current = await loadProgress();
    const previous = current.characters[input.characterId];
    const character = normalizeCharacter(
      previous as unknown as Record<string, unknown> | undefined,
      input.packId,
      input.characterId,
    );
    const accuracy = clampUnit(input.accuracy);
    const now = Date.now();
    const previousCompletions = character.completions ?? 0;
    const firstCompletion = input.completed && previousCompletions === 0;
    const starEarned = firstCompletion && character.starsEarned < 1;

    const updatedCharacter: CharacterProgress = {
      ...character,
      attempts: character.attempts + safeAttempts(input.attempts),
      starsEarned: starEarned ? 1 : character.starsEarned,
      bestAccuracy: Math.max(character.bestAccuracy, accuracy),
      completions: previousCompletions + (input.completed ? 1 : 0),
      lastResult: input.completed ? 'completed' : 'incomplete',
      lastPracticedAt: now,
    };

    let artworks = current.artworks;
    let newDrawingId: string | null = null;

    if (firstCompletion) {
      const drawingId = drawingIdForCharacter(input.packId, input.characterId);
      if (drawingId && !current.artworks[drawingId]) {
        artworks = {
          ...current.artworks,
          [drawingId]: createEmptyArtwork(drawingId, now),
        };
        newDrawingId = drawingId;
      }
    }

    const updated: ProgressSnapshot = {
      ...current,
      stars: current.stars + (starEarned ? 1 : 0),
      characters: {
        ...current.characters,
        [input.characterId]: updatedCharacter,
      },
      artworks,
      updatedAt: now,
    };

    await saveProgress(updated);
    return { snapshot: updated, starEarned, newDrawingId };
  });
}

/**
 * Guarda una composición (dibujo del catálogo o pizarra libre).
 *
 * Solo se almacenan datos vectoriales: colores por región, trazos normalizados
 * y pegatinas. El autoguardado llama a esta función tras cada acción cerrada,
 * nunca en cada movimiento del pincel.
 */
export async function saveArtwork(artwork: ArtworkState): Promise<ProgressSnapshot> {
  return enqueue(async () => {
    if (!hasDrawing(artwork.artworkId) && artwork.artworkId !== PLAYGROUND_ARTWORK_ID) {
      throw new Error(`La composición ${artwork.artworkId} no existe.`);
    }

    const current = await loadProgress();
    const existing = current.artworks[artwork.artworkId];

    // Una lámina del catálogo solo se puede guardar si ya se desbloqueó.
    if (artwork.artworkId !== PLAYGROUND_ARTWORK_ID && !existing) {
      throw new Error(`La composición ${artwork.artworkId} todavía está bloqueada.`);
    }

    const normalized = normalizeArtwork(artwork, artwork.artworkId);

    if (!normalized) {
      throw new Error('La composición no es válida.');
    }

    const now = Date.now();
    const next: ArtworkState = {
      ...normalized,
      unlockedAt: existing?.unlockedAt ?? normalized.unlockedAt,
      updatedAt: now,
    };

    const updated: ProgressSnapshot = {
      ...current,
      artworks: {
        ...current.artworks,
        [next.artworkId]: next,
      },
      updatedAt: now,
    };

    await saveProgress(updated);
    return updated;
  });
}

export async function resetProgress(): Promise<ProgressSnapshot> {
  return enqueue(async () => {
    await deleteRecord('progress', PROGRESS_RECORD_ID);
    return createEmptyProgress();
  });
}
