import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DB_NAME, closeDatabase, putRecord } from '@/modules/storage/db';
import { createEmptyProgress } from './progress.types';
import { addStars, loadProgress, resetProgress, saveProgress } from './progress.repository';

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
});
