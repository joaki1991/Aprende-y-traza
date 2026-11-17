import { describe, expect, it } from 'vitest';
import {
  LESSON_PACKS,
  TOTAL_LESSON_CHARACTERS,
  getLessonCharacter,
  getLessonPack,
} from './content';

describe('contenidos educativos', () => {
  it('incluye mayúsculas, minúsculas y números', () => {
    expect(LESSON_PACKS.map((pack) => pack.id)).toEqual(['mayusculas', 'minusculas', 'numeros']);
    expect(getLessonPack('mayusculas')?.characters).toHaveLength(27);
    expect(getLessonPack('minusculas')?.characters).toHaveLength(27);
    expect(getLessonPack('numeros')?.characters).toHaveLength(10);
    expect(TOTAL_LESSON_CHARACTERS).toBe(64);
  });

  it('tiene identificadores únicos y ordenados', () => {
    const ids = LESSON_PACKS.flatMap((pack) => pack.characters.map((character) => character.id));
    expect(new Set(ids).size).toBe(ids.length);

    for (const pack of LESSON_PACKS) {
      pack.characters.forEach((character, index) => {
        expect(character.order).toBe(index + 1);
      });
    }
  });

  it('incluye la Ñ en ambos alfabetos y palabras de ejemplo', () => {
    expect(getLessonCharacter('mayusculas', 'upper-ñ')?.glyph).toBe('Ñ');
    expect(getLessonCharacter('minusculas', 'lower-ñ')?.glyph).toBe('ñ');
    expect(getLessonCharacter('mayusculas', 'upper-a')?.exampleWord).toBe('Abeja');
    expect(
      LESSON_PACKS.flatMap((pack) => pack.characters).every(
        (character) => character.exampleWord.length > 0,
      ),
    ).toBe(true);
  });

  it('devuelve undefined para identificadores desconocidos', () => {
    expect(getLessonPack('cursiva')).toBeUndefined();
    expect(getLessonCharacter('numeros', 'digit-99')).toBeUndefined();
  });
});
