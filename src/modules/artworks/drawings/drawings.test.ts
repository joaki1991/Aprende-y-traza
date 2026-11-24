import { describe, expect, it } from 'vitest';
import { LESSON_PACKS } from '@/modules/lessons/content';
import {
  DRAWINGS,
  DRAWING_VIEW_BOX,
  TOTAL_DRAWINGS,
  drawingIdForCharacter,
  getDrawing,
  hasDrawing,
} from './index';

const LETTER_GLYPHS = LESSON_PACKS.filter((pack) => pack.scriptId !== 'digits').flatMap((pack) =>
  pack.characters.map((character) => character.glyph),
);
const DIGIT_GLYPHS = LESSON_PACKS.filter((pack) => pack.scriptId === 'digits').flatMap((pack) =>
  pack.characters.map((character) => character.glyph),
);

describe('catálogo de láminas', () => {
  it('contiene exactamente 37 dibujos: 27 letras y 10 números', () => {
    expect(TOTAL_DRAWINGS).toBe(37);
    expect(DRAWINGS).toHaveLength(37);
    expect(DRAWINGS.filter((drawing) => drawing.kind === 'letter')).toHaveLength(27);
    expect(DRAWINGS.filter((drawing) => drawing.kind === 'number')).toHaveLength(10);
  });

  it('tiene identificadores únicos y estables', () => {
    const ids = DRAWINGS.map((drawing) => drawing.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain('letter-a');
    expect(ids).toContain('letter-enye');
    expect(ids).toContain('number-0');
    expect(ids).toContain('number-9');
    for (const drawing of DRAWINGS) {
      expect(drawing.id).toMatch(/^(letter|number)-[a-zñ0-9]+$/);
      expect(getDrawing(drawing.id)).toBe(drawing);
      expect(hasDrawing(drawing.id)).toBe(true);
    }
  });

  it('declara nombre y glifo legibles en todas las láminas', () => {
    for (const drawing of DRAWINGS) {
      expect(drawing.name.trim().length).toBeGreaterThan(0);
      expect(drawing.glyph.trim().length).toBeGreaterThan(0);
    }
  });

  it('usa formas cerradas como regiones pintables', () => {
    for (const drawing of DRAWINGS) {
      expect(drawing.regions.length).toBeGreaterThan(0);
      const regionIds = drawing.regions.map((region) => region.id);
      expect(new Set(regionIds).size).toBe(regionIds.length);

      for (const region of drawing.regions) {
        expect(region.d.startsWith('M')).toBe(true);
        expect(region.d).toContain('Z');
      }
    }
  });

  it('conserva un viewBox cuadrado de 400 × 400', () => {
    expect(DRAWING_VIEW_BOX).toBe('0 0 400 400');
  });

  it('mantiene las láminas importadas con varias regiones coloreables', () => {
    for (const id of [
      'letter-b',
      'letter-e',
      'letter-g',
      'letter-j',
      'letter-p',
      'letter-t',
      'letter-u',
      'letter-v',
      'letter-y',
    ]) {
      const drawing = getDrawing(id);
      if (!drawing) {
        throw new Error(`Falta la lámina importada ${id}`);
      }
      expect(drawing.regions.length).toBeGreaterThanOrEqual(3);
      expect(drawing.regions.every((region) => region.id.startsWith('part-'))).toBe(true);
    }
  });

  it('descarta identificadores que no existen', () => {
    expect(getDrawing('letter-inventada')).toBeUndefined();
    expect(getDrawing(null)).toBeUndefined();
    expect(getDrawing(undefined)).toBeUndefined();
    expect(hasDrawing('playground')).toBe(false);
  });
});

describe('relación entre fichas y láminas', () => {
  it('asigna una lámina a cada letra del catálogo', () => {
    const letterIds = new Set(
      DRAWINGS.filter((drawing) => drawing.kind === 'letter').map((drawing) => drawing.id),
    );

    for (const glyph of LETTER_GLYPHS) {
      const expectedId = glyph.toLowerCase() === 'ñ' ? 'letter-enye' : `letter-${glyph.toLowerCase()}`;
      expect(letterIds.has(expectedId)).toBe(true);
    }
    expect(letterIds.size).toBe(27);
  });

  it('comparte la lámina entre mayúscula y minúscula', () => {
    const upper = drawingIdForCharacter('mayusculas', 'upper-a');
    const lower = drawingIdForCharacter('minusculas', 'lower-a');

    expect(upper).toBe('letter-a');
    expect(lower).toBe('letter-a');
  });

  it('lleva la Ñ a la lámina propia', () => {
    expect(drawingIdForCharacter('mayusculas', 'upper-ñ')).toBe('letter-enye');
    expect(drawingIdForCharacter('minusculas', 'lower-ñ')).toBe('letter-enye');
  });

  it('asigna una lámina distinta a cada número', () => {
    for (const glyph of DIGIT_GLYPHS) {
      expect(drawingIdForCharacter('numeros', `digit-${glyph}`)).toBe(`number-${glyph}`);
    }
  });

  it('devuelve null para fichas o paquetes desconocidos', () => {
    expect(drawingIdForCharacter('mayusculas', 'upper-inventada')).toBeNull();
    expect(drawingIdForCharacter('paquete-raro', 'upper-a')).toBeNull();
  });

  it('no repite ninguna lámina entre las 37 fichas distintas', () => {
    const drawingIds = new Set<string>();

    for (const pack of LESSON_PACKS) {
      for (const character of pack.characters) {
        const drawingId = drawingIdForCharacter(pack.id, character.id);
        if (drawingId) {
          drawingIds.add(drawingId);
        }
      }
    }

    // 27 letras compartidas entre mayúscula y minúscula + 10 números.
    expect(drawingIds.size).toBe(37);
  });
});
