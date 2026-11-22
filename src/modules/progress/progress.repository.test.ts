import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DB_NAME, closeDatabase, putRecord } from '@/modules/storage/db';
import { PLAYGROUND_ARTWORK_ID, createEmptyArtwork } from '@/modules/artworks/artwork.types';
import type { ArtworkState, PlacedSticker } from '@/modules/artworks/artwork.types';
import { PROGRESS_SCHEMA_VERSION, createEmptyProgress } from './progress.types';
import {
  addStars,
  loadProgress,
  recordPractice,
  resetProgress,
  saveArtwork,
  saveProgress,
} from './progress.repository';
import type { ProgressSnapshot } from './progress.types';

async function deleteTestDatabase(): Promise<void> {
  await closeDatabase();
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error ?? new Error('No se pudo borrar la base.'));
    request.onblocked = () => resolve();
  });
}

function completeA(): Promise<Awaited<ReturnType<typeof recordPractice>>> {
  return recordPractice({
    packId: 'mayusculas',
    characterId: 'upper-a',
    completed: true,
    accuracy: 0.9,
  });
}

describe('progress.repository', () => {
  beforeEach(deleteTestDatabase);
  afterEach(deleteTestDatabase);

  it('devuelve un progreso vacío la primera vez', async () => {
    await expect(loadProgress()).resolves.toEqual(createEmptyProgress());
  });

  it('guarda y recupera el progreso', async () => {
    const snapshot: ProgressSnapshot = {
      ...createEmptyProgress(),
      stars: 7,
      updatedAt: 1234,
    };

    await saveProgress(snapshot);
    await expect(loadProgress()).resolves.toEqual(snapshot);
  });

  it('suma estrellas de forma segura y redondea hacia abajo', async () => {
    await addStars(2);
    await addStars(1.9);
    await addStars(-5);

    const progress = await loadProgress();
    expect(progress.stars).toBe(3);
    expect(progress.updatedAt).toBeGreaterThan(0);
  });

  it('reinicia el progreso y los dibujos guardados', async () => {
    await completeA();
    await expect(resetProgress()).resolves.toEqual(createEmptyProgress());
    await expect(loadProgress()).resolves.toEqual(createEmptyProgress());
  });

  it('ignora datos corruptos o de una versión desconocida', async () => {
    await putRecord('progress', {
      id: 'default',
      data: { schemaVersion: 99, stars: 'muchas', characters: null, artworks: null },
    });

    await expect(loadProgress()).resolves.toEqual(createEmptyProgress());
  });

  it('registra una ronda completada con intentos, precisión y fecha', async () => {
    const before = Date.now();
    const { snapshot, starEarned, newDrawingId } = await completeA();

    const character = snapshot.characters['upper-a'];
    expect(character).toMatchObject({
      packId: 'mayusculas',
      characterId: 'upper-a',
      attempts: 1,
      completions: 1,
      bestAccuracy: 0.9,
      lastResult: 'completed',
      starsEarned: 1,
    });
    expect(character?.lastPracticedAt).toBeGreaterThanOrEqual(before);
    expect(snapshot.updatedAt).toBeGreaterThanOrEqual(before);
    expect(starEarned).toBe(true);
    expect(newDrawingId).toBe('letter-a');

    const stored = await loadProgress();
    expect(stored.characters['upper-a']).toEqual(character);
    expect(stored.artworks['letter-a']).toBeDefined();
    expect(stored.stars).toBe(1);
  });

  it('concede una sola estrella y un solo dibujo al repetir la ficha', async () => {
    const first = await completeA();
    expect(first.starEarned).toBe(true);
    expect(first.newDrawingId).toBe('letter-a');

    const second = await completeA();
    expect(second.starEarned).toBe(false);
    expect(second.newDrawingId).toBeNull();
    expect(second.snapshot.stars).toBe(1);
    expect(second.snapshot.characters['upper-a']?.completions).toBe(2);
    expect(second.snapshot.characters['upper-a']?.starsEarned).toBe(1);
    expect(Object.keys(second.snapshot.artworks)).toEqual(['letter-a']);
  });

  it('no concede nada al fallar ni al completar después de fallar dos veces', async () => {
    const failed = await recordPractice({
      packId: 'mayusculas',
      characterId: 'upper-b',
      completed: false,
      accuracy: 0.3,
    });
    expect(failed.starEarned).toBe(false);
    expect(failed.newDrawingId).toBeNull();
    expect(failed.snapshot.stars).toBe(0);
    expect(failed.snapshot.artworks).toEqual({});

    const completed = await recordPractice({
      packId: 'mayusculas',
      characterId: 'upper-b',
      attempts: 2,
      completed: true,
      accuracy: 0.8,
    });
    expect(completed.starEarned).toBe(true);
    expect(completed.newDrawingId).toBe('letter-b');
    expect(completed.snapshot.stars).toBe(1);
    expect(completed.snapshot.characters['upper-b']?.attempts).toBe(3);
  });

  it('comparte la lámina entre mayúscula y minúscula de la misma letra', async () => {
    await completeA();
    const lower = await recordPractice({
      packId: 'minusculas',
      characterId: 'lower-a',
      completed: true,
      accuracy: 0.8,
    });

    expect(lower.starEarned).toBe(true);
    expect(lower.newDrawingId).toBeNull();
    expect(lower.snapshot.stars).toBe(2);
    expect(Object.keys(lower.snapshot.artworks)).toEqual(['letter-a']);
    expect(lower.snapshot.characters['lower-a']?.starsEarned).toBe(1);
  });

  it('usa la lámina de la Ñ y las de los números', async () => {
    const enye = await recordPractice({
      packId: 'mayusculas',
      characterId: 'upper-ñ',
      completed: true,
      accuracy: 0.7,
    });
    expect(enye.newDrawingId).toBe('letter-enye');

    const digit = await recordPractice({
      packId: 'numeros',
      characterId: 'digit-7',
      completed: true,
      accuracy: 0.75,
    });
    expect(digit.newDrawingId).toBe('number-7');
    expect(digit.snapshot.stars).toBe(2);
  });

  it('acumula intentos fallidos sin completar la ficha', async () => {
    await recordPractice({
      packId: 'mayusculas',
      characterId: 'upper-c',
      completed: false,
      accuracy: 0.4,
    });
    const { snapshot } = await recordPractice({
      packId: 'mayusculas',
      characterId: 'upper-c',
      attempts: 2,
      completed: false,
      accuracy: 0.62,
    });

    const character = snapshot.characters['upper-c'];
    expect(character?.attempts).toBe(3);
    expect(character?.completions).toBe(0);
    expect(character?.lastResult).toBe('incomplete');
    expect(character?.bestAccuracy).toBe(0.62);
    expect(character?.starsEarned).toBe(0);
  });

  it('conserva la mejor precisión al fallar después de acertar', async () => {
    await recordPractice({
      packId: 'mayusculas',
      characterId: 'upper-d',
      completed: true,
      accuracy: 0.91,
    });
    const { snapshot } = await recordPractice({
      packId: 'mayusculas',
      characterId: 'upper-d',
      completed: false,
      accuracy: 0.35,
    });

    const character = snapshot.characters['upper-d'];
    expect(character?.bestAccuracy).toBe(0.91);
    expect(character?.lastResult).toBe('incomplete');
    expect(character?.completions).toBe(1);
    expect(character?.starsEarned).toBe(1);
  });

  it('conserva las estrellas y las fichas previas al practicar otra', async () => {
    await addStars(5);
    const seeded = await recordPractice({
      packId: 'numeros',
      characterId: 'digit-1',
      completed: true,
      accuracy: 0.7,
    });
    expect(seeded.snapshot.stars).toBe(6);

    const { snapshot } = await recordPractice({
      packId: 'mayusculas',
      characterId: 'upper-e',
      completed: true,
      accuracy: 0.8,
    });

    expect(snapshot.stars).toBe(7);
    expect(snapshot.characters['digit-1']).toEqual(seeded.snapshot.characters['digit-1']);
    expect(snapshot.characters['upper-e']?.completions).toBe(1);
  });

  it('normaliza datos antiguos o corruptos de un carácter', async () => {
    await saveProgress({
      ...createEmptyProgress(),
      characters: {
        'upper-f': {
          characterId: 'upper-f',
          packId: 'mayusculas',
          attempts: -4,
          starsEarned: Number.NaN,
          bestAccuracy: 4,
          lastPracticedAt: Number.POSITIVE_INFINITY,
        },
      },
    });

    const { snapshot } = await recordPractice({
      packId: 'mayusculas',
      characterId: 'upper-f',
      completed: false,
      accuracy: -2,
    });

    expect(snapshot.characters['upper-f']).toMatchObject({
      attempts: 1,
      starsEarned: 0,
      completions: 0,
      bestAccuracy: 1,
      lastResult: 'incomplete',
    });
    expect(Number.isFinite(snapshot.characters['upper-f']?.lastPracticedAt)).toBe(true);
  });

  it('migra v1 conservando fichas y desbloqueando sus láminas', async () => {
    const practicedAt = 1700000000000;
    await putRecord('progress', {
      id: 'default',
      data: {
        schemaVersion: 1,
        stars: 1,
        characters: {
          'upper-a': {
            characterId: 'upper-a',
            packId: 'mayusculas',
            attempts: 3,
            starsEarned: 0,
            bestAccuracy: 0.72,
            completions: 1,
            lastResult: 'completed',
            lastPracticedAt: practicedAt,
          },
          'upper-b': {
            characterId: 'upper-b',
            packId: 'mayusculas',
            attempts: 2,
            starsEarned: 0,
            bestAccuracy: 0.4,
            completions: 0,
            lastResult: 'incomplete',
            lastPracticedAt: practicedAt,
          },
        },
        updatedAt: practicedAt,
      },
    });

    const progress = await loadProgress();
    expect(progress.schemaVersion).toBe(PROGRESS_SCHEMA_VERSION);
    expect(progress.stars).toBe(1);
    expect(progress.characters['upper-a']).toMatchObject({ attempts: 3, starsEarned: 1 });
    expect(progress.characters['upper-b']).toMatchObject({ attempts: 2, starsEarned: 0 });
    expect(progress.artworks['letter-a']).toMatchObject({
      artworkId: 'letter-a',
      unlockedAt: practicedAt,
      fills: {},
      strokes: [],
      stickers: [],
    });
    expect(progress.artworks['letter-b']).toBeUndefined();
  });

  it('nivela las estrellas de v1 al número de fichas completadas', async () => {
    await putRecord('progress', {
      id: 'default',
      data: {
        schemaVersion: 1,
        stars: 0,
        characters: {
          'upper-a': {
            characterId: 'upper-a',
            packId: 'mayusculas',
            attempts: 1,
            completions: 1,
            lastPracticedAt: 1,
          },
          'digit-2': {
            characterId: 'digit-2',
            packId: 'numeros',
            attempts: 1,
            completions: 1,
            lastPracticedAt: 1,
          },
        },
        updatedAt: 1,
      },
    });

    const progress = await loadProgress();
    expect(progress.stars).toBe(2);
    expect(Object.keys(progress.artworks).sort()).toEqual(['letter-a', 'number-2']);
  });

  it('guarda una composición vectorial del catálogo y conserva su desbloqueo', async () => {
    const { snapshot } = await completeA();
    const unlockedAt = snapshot.artworks['letter-a']?.unlockedAt ?? 0;

    const artwork: ArtworkState = {
      ...createEmptyArtwork('letter-a', 999),
      fills: { body: '#ff6fa5' },
      strokes: [
        { color: '#4a3a48', widthRatio: 0.03, points: [{ x: 0.1, y: 0.2 }, { x: 0.4, y: 0.5 }] },
      ],
      stickers: [{ id: 'sticker-1', kind: 'star', x: 0.3, y: 0.4, scale: 0.2 }],
    };

    const updated = await saveArtwork(artwork);
    expect(updated.artworks['letter-a']?.fills).toEqual({ body: '#ff6fa5' });
    expect(updated.artworks['letter-a']?.unlockedAt).toBe(unlockedAt);
    expect(updated.artworks['letter-a']?.updatedAt).toBeGreaterThan(0);

    const stored = await loadProgress();
    expect(stored.artworks['letter-a']?.stickers).toEqual(artwork.stickers);
    expect(stored.stars).toBe(1);
  });

  it('guarda la pizarra libre sin necesidad de desbloqueo', async () => {
    const updated = await saveArtwork({
      ...createEmptyArtwork(PLAYGROUND_ARTWORK_ID),
      fills: { libre: '#ffd23f' },
    });

    expect(updated.artworks[PLAYGROUND_ARTWORK_ID]?.fills).toEqual({ libre: '#ffd23f' });
  });

  it('rechaza guardar una lámina bloqueada o inexistente', async () => {
    await expect(saveArtwork(createEmptyArtwork('letter-z'))).rejects.toThrow(/bloqueada/);
    await expect(saveArtwork(createEmptyArtwork('letter-inventada'))).rejects.toThrow(/no existe/);
  });

  it('normaliza trazos y pegatinas corruptos al guardar', async () => {
    const { snapshot } = await completeA();
    const unlockedAt = snapshot.artworks['letter-a']?.unlockedAt ?? 0;

    const stickers: PlacedSticker[] = [
      { id: 'ok', kind: 'star', x: 2, y: -1, scale: 9 },
      // Dato corrupto: un tipo de pegatina que no existe debe descartarse.
      { id: 'malo', kind: 'inventada' as PlacedSticker['kind'], x: 0.5, y: 0.5, scale: 0.2 },
    ];

    const updated = await saveArtwork({
      ...createEmptyArtwork('letter-a', unlockedAt),
      strokes: [
        { color: '#ff6fa5', widthRatio: 9, points: [{ x: 4, y: -2 }, { x: 0.5, y: 0.5 }] },
        { color: '', widthRatio: 0.02, points: [{ x: 0.1, y: 0.1 }] },
      ],
      stickers,
    });

    const saved = updated.artworks['letter-a'];
    expect(saved?.strokes).toHaveLength(1);
    expect(saved?.strokes[0]).toMatchObject({ color: '#ff6fa5', widthRatio: 0.2 });
    expect(saved?.strokes[0]?.points).toEqual([
      { x: 1, y: 0 },
      { x: 0.5, y: 0.5 },
    ]);
    expect(saved?.stickers).toEqual([{ id: 'ok', kind: 'star', x: 1, y: 0, scale: 0.45 }]);
  });
});
