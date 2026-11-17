import { LESSON_PACKS, TOTAL_LESSON_CHARACTERS } from '@/modules/lessons/content';
import type { ProgressSnapshot } from './progress.types';

export interface ProgressSummary {
  totalStars: number;
  practicedCharacters: number;
  totalCharacters: number;
  practicedByPack: Record<string, number>;
}

/** Derivaciones puras a partir del progreso persistido. */
export function summarizeProgress(progress: ProgressSnapshot): ProgressSummary {
  const characterEntries = Object.values(progress.characters);
  const practicedByPack = Object.fromEntries(LESSON_PACKS.map((pack) => [pack.id, 0]));

  for (const character of characterEntries) {
    if (character.attempts > 0 && Object.hasOwn(practicedByPack, character.packId)) {
      practicedByPack[character.packId] = (practicedByPack[character.packId] ?? 0) + 1;
    }
  }

  return {
    totalStars: progress.stars,
    practicedCharacters: characterEntries.filter((character) => character.attempts > 0).length,
    totalCharacters: TOTAL_LESSON_CHARACTERS,
    practicedByPack,
  };
}
