import type { CharacterTrace, TraceStroke } from '../lesson.types';

/**
 * Trazos de los números del 0 al 9.
 *
 * Convención de coordenadas: `viewBox="0 0 100 140"`, cuerpo de y=16 a y=122.
 * Cada número tiene su propia geometría y su orden de escritura; no se
 * reutilizan letras escaladas. Los bucles usan arcos elípticos para que las
 * curvas de 0, 3, 6, 8 y 9 sean suaves y verificables.
 */

const VIEW_BOX = '0 0 100 140';

function trace(characterId: string, strokes: readonly TraceStroke[]): CharacterTrace {
  return { characterId, viewBox: VIEW_BOX, strokes };
}

export const DIGIT_TRACES: Record<string, CharacterTrace> = {
  'digit-0': trace('digit-0', [
    {
      id: 'digit-0-round',
      order: 1,
      path: 'M50 18 A28 51 0 0 0 50 120 A28 51 0 0 0 50 18',
      label: 'Vuelta del cero',
      instruction: 'Da una vuelta redonda, sin parar.',
      start: { x: 50, y: 18 },
      end: { x: 50, y: 18 },
      direction: 'counter-clockwise',
    },
  ]),

  'digit-1': trace('digit-1', [
    {
      id: 'digit-1-line',
      order: 1,
      path: 'M34 34 L52 16 L52 122',
      label: 'Línea del uno',
      instruction: 'Sube una rayita y baja una línea recta.',
      start: { x: 34, y: 34 },
      end: { x: 52, y: 122 },
      direction: 'down',
    },
  ]),

  'digit-2': trace('digit-2', [
    {
      id: 'digit-2-curve',
      order: 1,
      path: 'M26 42 C26 18 48 10 64 18 C80 26 78 48 64 62 L24 122 L78 122',
      label: 'Curva y base del dos',
      instruction: 'Sube, da la vuelta, baja en diagonal y cruza abajo.',
      start: { x: 26, y: 42 },
      end: { x: 78, y: 122 },
      direction: 'curve',
    },
  ]),

  'digit-3': trace('digit-3', [
    {
      id: 'digit-3-curves',
      order: 1,
      path: 'M28 32 C36 14 66 12 74 30 C80 44 68 60 52 66 C70 70 80 88 72 104 C64 120 38 120 26 104',
      label: 'Dos barrigas del tres',
      instruction: 'Haz dos barriguitas hacia la derecha.',
      start: { x: 28, y: 32 },
      end: { x: 26, y: 104 },
      direction: 'curve',
    },
  ]),

  'digit-4': trace('digit-4', [
    {
      id: 'digit-4-diagonal',
      order: 1,
      path: 'M62 16 L24 86 L80 86',
      label: 'Diagonal y cruce del cuatro',
      instruction: 'Baja en diagonal y cruza a la derecha.',
      start: { x: 62, y: 16 },
      end: { x: 80, y: 86 },
      direction: 'curve',
    },
    {
      id: 'digit-4-stem',
      order: 2,
      path: 'M62 16 L62 122',
      label: 'Línea del cuatro',
      instruction: 'Baja una línea recta.',
      start: { x: 62, y: 16 },
      end: { x: 62, y: 122 },
      direction: 'down',
    },
  ]),

  'digit-5': trace('digit-5', [
    {
      id: 'digit-5-curve',
      order: 1,
      path: 'M72 16 L32 16 L28 60 C48 52 76 58 78 82 C80 108 52 122 28 108',
      label: 'Barra y barriga del cinco',
      instruction: 'Cruza arriba, baja y haz una barriguita.',
      start: { x: 72, y: 16 },
      end: { x: 28, y: 108 },
      direction: 'curve',
    },
  ]),

  'digit-6': trace('digit-6', [
    {
      id: 'digit-6-stem',
      order: 1,
      path: 'M70 20 C52 14 34 32 34 52 C34 60 40 64 52 66',
      label: 'Curva del seis',
      instruction: 'Baja en curva hasta la bolita.',
      start: { x: 70, y: 20 },
      end: { x: 52, y: 66 },
      direction: 'curve',
    },
    {
      id: 'digit-6-bowl',
      order: 2,
      path: 'M52 66 A24 28 0 0 0 52 122 A24 28 0 0 0 52 66',
      label: 'Bolita del seis',
      instruction: 'Haz una bolita abajo.',
      start: { x: 52, y: 66 },
      end: { x: 52, y: 66 },
      direction: 'counter-clockwise',
    },
  ]),

  'digit-7': trace('digit-7', [
    {
      id: 'digit-7-top',
      order: 1,
      path: 'M24 16 L76 16',
      label: 'Línea de arriba',
      instruction: 'Cruza una línea arriba.',
      start: { x: 24, y: 16 },
      end: { x: 76, y: 16 },
      direction: 'right',
    },
    {
      id: 'digit-7-diagonal',
      order: 2,
      path: 'M76 16 L42 122',
      label: 'Diagonal del siete',
      instruction: 'Baja en diagonal.',
      start: { x: 76, y: 16 },
      end: { x: 42, y: 122 },
      direction: 'down',
    },
  ]),

  'digit-8': trace('digit-8', [
    {
      id: 'digit-8-loops',
      order: 1,
      path: 'M50 16 C32 16 26 30 26 42 C26 54 34 62 50 66 C66 70 74 78 74 92 C74 108 64 122 50 122 C36 122 26 108 26 92 C26 78 34 70 50 66 C66 62 74 54 74 42 C74 30 68 16 50 16',
      label: 'Dos bolitas del ocho',
      instruction: 'Haz dos bolitas, una encima de otra.',
      start: { x: 50, y: 16 },
      end: { x: 50, y: 16 },
      direction: 'curve',
    },
  ]),

  'digit-9': trace('digit-9', [
    {
      id: 'digit-9-bowl',
      order: 1,
      path: 'M50 24 A24 26 0 0 1 50 76 A24 26 0 0 1 50 24',
      label: 'Bolita del nueve',
      instruction: 'Haz una bolita arriba.',
      start: { x: 50, y: 24 },
      end: { x: 50, y: 24 },
      direction: 'clockwise',
    },
    {
      id: 'digit-9-stem',
      order: 2,
      path: 'M74 50 L74 100 C74 116 58 124 40 118',
      label: 'Línea del nueve',
      instruction: 'Baja una línea con un ganchito.',
      start: { x: 74, y: 50 },
      end: { x: 40, y: 118 },
      direction: 'curve',
    },
  ]),
};
