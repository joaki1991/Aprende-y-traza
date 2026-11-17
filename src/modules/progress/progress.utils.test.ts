import { describe, expect, it } from 'vitest';
import { createEmptyProgress, type ProgressSnapshot } from './progress.types';
import { summarizeProgress } from './progress.utils';

function snapshotWithCharacters(overrides: Partial<ProgressSnapshot> = {}): ProgressSnapshot {
  return {
    ...createEmptyProgress(),
    stars: 4,
    characters: {
      'upper-a': {
        characterId: 'upper-a',
        packId: 'mayusculas',
        attempts: 2,
        starsEarned: 3,
        bestAccuracy: 0.8,
        lastPracticedAt: 10,
      },
      'digit-3': {
        characterId: 'digit-3',
        packId: 'numeros',
        attempts: 1,
        starsEarned: 1,
        bestAccuracy: 0.9,
        lastPracticedAt: 20,
      },
      'lower-z': {
        characterId: 'lower-z',
        packId: 'minusculas',
        attempts: 0,
        starsEarned: 0,
        bestAccuracy: 0,
        lastPracticedAt: 0,
      },
    },
    ...overrides,
  };
}

describe('summarizeProgress', () => {
  it('cuenta estrellas y caracteres practicados con al menos un intento', () => {
    const summary = summarizeProgress(snapshotWithCharacters());
    expect(summary.totalStars).toBe(4);
    expect(summary.practicedCharacters).toBe(2);
    expect(summary.totalCharacters).toBe(64);
    expect(summary.practicedByPack).toEqual({
      mayusculas: 1,
      minusculas: 0,
      numeros: 1,
    });
  });

  it('empieza en cero con un progreso vacío', () => {
    const summary = summarizeProgress(createEmptyProgress());
    expect(summary.totalStars).toBe(0);
    expect(summary.practicedCharacters).toBe(0);
    expect(summary.practicedByPack).toEqual({
      mayusculas: 0,
      minusculas: 0,
      numeros: 0,
    });
  });

  it('ignora paquetes desconocidos para no contaminar el resumen', () => {
    const snapshot = snapshotWithCharacters();
    snapshot.characters['upper-x'] = {
      characterId: 'upper-x',
      packId: '__proto__',
      attempts: 3,
      starsEarned: 3,
      bestAccuracy: 1,
      lastPracticedAt: 1,
    };

    const summary = summarizeProgress(snapshot);
    expect(summary.practicedCharacters).toBe(3);
    expect(summary.practicedByPack).toEqual({
      mayusculas: 1,
      minusculas: 0,
      numeros: 1,
    });
  });
});
