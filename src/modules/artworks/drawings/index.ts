import { getLessonCharacter, getLessonPack } from '@/modules/lessons/content';
import { LETTER_DRAWINGS } from './letterDrawings';
import { NUMBER_DRAWINGS } from './numberDrawings';
import type { DrawingTemplate } from './shapes';

export type { DrawingDetail, DrawingRegion, DrawingTemplate } from './shapes';
export { DRAWING_OUTLINE, DRAWING_VIEW_BOX } from './shapes';

/**
 * Catálogo único de láminas. Las letras mayúscula y minúscula comparten
 * lámina; los números tienen las suyas. En total, 37 dibujos.
 */
export const DRAWINGS: readonly DrawingTemplate[] = [...LETTER_DRAWINGS, ...NUMBER_DRAWINGS];

export const TOTAL_DRAWINGS = DRAWINGS.length;

const DRAWINGS_BY_ID = new Map(DRAWINGS.map((drawing) => [drawing.id, drawing]));

export function getDrawing(drawingId: string | null | undefined): DrawingTemplate | undefined {
  return drawingId ? DRAWINGS_BY_ID.get(drawingId) : undefined;
}

export function hasDrawing(drawingId: string): boolean {
  return DRAWINGS_BY_ID.has(drawingId);
}

function letterDrawingId(glyph: string): string {
  return glyph === 'ñ' || glyph === 'Ñ' ? 'letter-enye' : `letter-${glyph.toLowerCase()}`;
}

/**
 * Lámina asociada a una ficha del catálogo educativo.
 *
 * Devuelve `null` si la ficha no pertenece a un paquete conocido. La misma
 * letra en mayúscula y minúscula devuelve el mismo id, de modo que completar
 * la A y después la a no crea dos dibujos.
 */
export function drawingIdForCharacter(packId: string, characterId: string): string | null {
  const pack = getLessonPack(packId);
  const character = getLessonCharacter(packId, characterId);
  if (!pack || !character) {
    return null;
  }

  const drawingId =
    pack.scriptId === 'digits' ? `number-${character.glyph}` : letterDrawingId(character.glyph);

  return hasDrawing(drawingId) ? drawingId : null;
}
