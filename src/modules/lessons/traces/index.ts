import type { CharacterTrace } from '../lesson.types';
import { DIGIT_TRACES } from './digits';
import { LOWERCASE_TRACES } from './lowercase';
import { UPPERCASE_TRACES } from './uppercase';

/**
 * Registro de trazos disponibles.
 *
 * Las claves son los identificadores estables de `LessonCharacter`
 * (`upper-a`, `lower-a`, `digit-0`…). La pantalla de ejercicios consulta este
 * registro; si no hay trazo, muestra un aviso amable en lugar de romperse.
 */
const TRACES: Record<string, CharacterTrace> = {
  ...UPPERCASE_TRACES,
  ...LOWERCASE_TRACES,
  ...DIGIT_TRACES,
};

export function getCharacterTrace(characterId: string): CharacterTrace | undefined {
  return TRACES[characterId];
}

export function hasCharacterTrace(characterId: string): boolean {
  return Object.hasOwn(TRACES, characterId);
}

export function listAvailableTraceIds(): string[] {
  return Object.keys(TRACES);
}
