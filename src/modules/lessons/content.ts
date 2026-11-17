import type { LessonCharacter, LessonPack } from './lesson.types';

const UPPERCASE_WORDS: ReadonlyArray<readonly [string, string]> = [
  ['A', 'Abeja'],
  ['B', 'Ballena'],
  ['C', 'Conejo'],
  ['D', 'Delfín'],
  ['E', 'Estrella'],
  ['F', 'Flor'],
  ['G', 'Gato'],
  ['H', 'Helado'],
  ['I', 'Iguana'],
  ['J', 'Jirafa'],
  ['K', 'Koala'],
  ['L', 'Luna'],
  ['M', 'Mariposa'],
  ['N', 'Nube'],
  ['Ñ', 'Ñandú'],
  ['O', 'Oso'],
  ['P', 'Pingüino'],
  ['Q', 'Queso'],
  ['R', 'Ratón'],
  ['S', 'Sol'],
  ['T', 'Tortuga'],
  ['U', 'Uva'],
  ['V', 'Vaca'],
  ['W', 'Wombat'],
  ['X', 'Xilófono'],
  ['Y', 'Yate'],
  ['Z', 'Zanahoria'],
];

const DIGIT_WORDS: ReadonlyArray<readonly [string, string]> = [
  ['0', 'Cero'],
  ['1', 'Uno'],
  ['2', 'Dos'],
  ['3', 'Tres'],
  ['4', 'Cuatro'],
  ['5', 'Cinco'],
  ['6', 'Seis'],
  ['7', 'Siete'],
  ['8', 'Ocho'],
  ['9', 'Nueve'],
];

function buildLetters(
  prefix: string,
  kind: 'mayúscula' | 'minúscula',
  words: ReadonlyArray<readonly [string, string]>,
): LessonCharacter[] {
  return words.map(([glyph, exampleWord], index) => ({
    id: `${prefix}-${glyph.toLowerCase()}`,
    glyph,
    spokenName: `${glyph}, ${kind}`,
    exampleWord,
    order: index + 1,
  }));
}

function buildDigits(): LessonCharacter[] {
  return DIGIT_WORDS.map(([glyph, exampleWord], index) => ({
    id: `digit-${glyph}`,
    glyph,
    spokenName: `Número ${exampleWord}`,
    exampleWord,
    order: index + 1,
  }));
}

export const LESSON_PACKS: readonly LessonPack[] = [
  {
    id: 'mayusculas',
    scriptId: 'latin-uppercase',
    title: 'Mayúsculas',
    badge: 'ABC',
    description: 'Letras grandes',
    accent: 'sky',
    characters: buildLetters('upper', 'mayúscula', UPPERCASE_WORDS),
  },
  {
    id: 'minusculas',
    scriptId: 'latin-lowercase',
    title: 'Minúsculas',
    badge: 'abc',
    description: 'Letras pequeñitas',
    accent: 'mint',
    characters: buildLetters(
      'lower',
      'minúscula',
      UPPERCASE_WORDS.map(([glyph, word]) => [glyph.toLocaleLowerCase('es'), word] as const),
    ),
  },
  {
    id: 'numeros',
    scriptId: 'digits',
    title: 'Números',
    badge: '123',
    description: 'Del 0 al 9',
    accent: 'butter',
    characters: buildDigits(),
  },
];

export const TOTAL_LESSON_CHARACTERS = LESSON_PACKS.reduce(
  (total, pack) => total + pack.characters.length,
  0,
);

export function getLessonPack(packId: string): LessonPack | undefined {
  return LESSON_PACKS.find((pack) => pack.id === packId);
}

export function getLessonCharacter(
  packId: string,
  characterId: string,
): LessonCharacter | undefined {
  return getLessonPack(packId)?.characters.find((character) => character.id === characterId);
}
