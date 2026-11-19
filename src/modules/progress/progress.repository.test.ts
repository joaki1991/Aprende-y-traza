import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DB_NAME, closeDatabase, putRecord } from '@/modules/storage/db';
import { createEmptyProgress } from './progress.types';
import {
  addStars,
  loadProgress,
  recordPractice,
  resetProgress,
  saveProgress,
} from './progress.repository';

async function deleteTestDatabase(): Promise<void> {
  await closeDatabase();
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error ?? new Error('No se pudo borrar la base.'));
    request.onblocked = () => resolve();
  });
}

describe('progress.repository', () => {
  beforeEach(deleteTestDatabase);
  afterEach(deleteTestDatabase);

  it('devuelve un progreso vacío la primera vez', async () => {
    await expect(loadProgress()).resolves.toEqual(createEmptyProgress());
  });

  it('guarda y recupera el progreso', async () => {
    const snapshot = {
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

  it('reinicia el progreso', async () => {
    await addStars(4);
    await expect(resetProgress()).resolves.toEqual(createEmptyProgress());
    await expect(loadProgress()).resolves.toEqual(createEmptyProgress());
  });

  it('ignora datos corruptos o de una versión desconocida', async () => {
    await putRecord('progress', {
      id: 'default',
      data: { schemaVersion: 99, stars: 'muchas', characters: null },
    });

    await expect(loadProgress()).resolves.toEqual(createEmptyProgress());
  });

  it('registra una ronda completada con intentos, precisión y fecha', async () => {
    const before = Date.now();
    const snapshot = await recordPractice({
      packId: 'mayusculas',
      characterId: 'upper-a',
      completed: true,
      accuracy: 0.87,
    });

    const character = snapshot.characters['upper-a'];
    expect(character).toMatchObject({
      packId: 'mayusculas',
      characterId: 'upper-a',
      attempts: 1,
      completions: 1,
      bestAccuracy: 0.87,
      lastResult: 'completed',
      starsEarned: 0,
    });
    expect(character?.lastPracticedAt).toBeGreaterThanOrEqual(before);
    expect(snapshot.updatedAt).toBeGreaterThanOrEqual(before);

    const stored = await loadProgress();
    expect(stored.characters['upper-a']).toEqual(character);
  });

  it('acumula intentos fallidos sin completar la ficha', async () => {
    await recordPractice({
      packId: 'mayusculas',
      characterId: 'upper-a',
      completed: false,
      accuracy: 0.4,
    });
    const snapshot = await recordPractice({
      packId: 'mayusculas',
      characterId: 'upper-a',
      attempts: 2,
      completed: false,
      accuracy: 0.62,
    });

    const character = snapshot.characters['upper-a'];
    expect(character?.attempts).toBe(3);
    expect(character?.completions).toBe(0);
    expect(character?.lastResult).toBe('incomplete');
    expect(character?.bestAccuracy).toBe(0.62);
  });

  it('conserva la mejor precisión al fallar después de acertar', async () => {
    await recordPractice({
      packId: 'mayusculas',
      characterId: 'upper-a',
      completed: true,
      accuracy: 0.91,
    });
    const snapshot = await recordPractice({
      packId: 'mayusculas',
      characterId: 'upper-a',
      completed: false,
      accuracy: 0.35,
    });

    const character = snapshot.characters['upper-a'];
    expect(character?.bestAccuracy).toBe(0.91);
    expect(character?.lastResult).toBe('incomplete');
    expect(character?.completions).toBe(1);
  });

  it('no modifica las estrellas ni otros caracteres al practicar', async () => {
    await addStars(5);
    const seeded = await recordPractice({
      packId: 'numeros',
      characterId: 'digit-1',
      completed: true,
      accuracy: 0.7,
    });
    expect(seeded.characters['digit-1']?.completions).toBe(1);

    const snapshot = await recordPractice({
      packId: 'mayusculas',
      characterId: 'upper-a',
      completed: true,
      accuracy: 0.8,
    });

    expect(snapshot.stars).toBe(5);
    expect(snapshot.characters['digit-1']).toEqual(seeded.characters['digit-1']);
    expect(snapshot.characters['upper-a']?.completions).toBe(1);
  });

  it('normaliza datos antiguos o corruptos de un carácter', async () => {
    await saveProgress({
      ...createEmptyProgress(),
      characters: {
        'upper-a': {
          characterId: 'upper-a',
          packId: 'mayusculas',
          attempts: -4,
          starsEarned: Number.NaN,
          bestAccuracy: 4,
          lastPracticedAt: Number.POSITIVE_INFINITY,
        },
      },
    });

    const snapshot = await recordPractice({
      packId: 'mayusculas',
      characterId: 'upper-a',
      completed: false,
      accuracy: -2,
    });

    expect(snapshot.characters['upper-a']).toMatchObject({
      attempts: 1,
      starsEarned: 0,
      completions: 0,
      bestAccuracy: 0,
      lastResult: 'incomplete',
    });
    expect(Number.isFinite(snapshot.characters['upper-a']?.lastPracticedAt)).toBe(true);
  });
});
