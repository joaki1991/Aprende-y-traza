import type { CharacterTrace, TraceStroke } from '../lesson.types';

/**
 * Trazos de las 27 minúsculas españolas.
 *
 * Convención de coordenadas: `viewBox="0 0 100 140"`.
 * - Altura de x: y=62.
 * - Línea base: y=122.
 * - Ascendentes: hasta y=16.
 * - Descendentes: hasta y=136.
 *
 * La geometría es propia de cada letra: no se escala la mayúscula. Los puntos
 * de i/j usan `kind: 'dot'` para que la validación espere un toque y no un
 * recorrido.
 */

const VIEW_BOX = '0 0 100 140';

function trace(characterId: string, strokes: readonly TraceStroke[]): CharacterTrace {
  return { characterId, viewBox: VIEW_BOX, strokes };
}

export const LOWERCASE_TRACES: Record<string, CharacterTrace> = {
  'lower-a': trace('lower-a', [
    {
      id: 'lower-a-bowl',
      order: 1,
      path: 'M52 62 A24 30 0 0 0 52 122 A24 30 0 0 0 52 62',
      label: 'Bola de la a',
      instruction: 'Haz una bolita.',
      start: { x: 52, y: 62 },
      end: { x: 52, y: 62 },
      direction: 'counter-clockwise',
    },
    {
      id: 'lower-a-stem',
      order: 2,
      path: 'M76 62 L76 122',
      label: 'Línea de la a',
      instruction: 'Baja una línea recta a la derecha.',
      start: { x: 76, y: 62 },
      end: { x: 76, y: 122 },
      direction: 'down',
    },
  ]),

  'lower-b': trace('lower-b', [
    {
      id: 'lower-b-stem',
      order: 1,
      path: 'M28 16 L28 122',
      label: 'Línea larga',
      instruction: 'Baja una línea larga.',
      start: { x: 28, y: 16 },
      end: { x: 28, y: 122 },
      direction: 'down',
    },
    {
      id: 'lower-b-bowl',
      order: 2,
      path: 'M28 62 A24 30 0 0 1 28 122',
      label: 'Bola de la b',
      instruction: 'Haz una bolita abajo.',
      start: { x: 28, y: 62 },
      end: { x: 28, y: 122 },
      direction: 'curve',
    },
  ]),

  'lower-c': trace('lower-c', [
    {
      id: 'lower-c-curve',
      order: 1,
      path: 'M72 76 A26 30 0 1 0 72 108',
      label: 'Curva de la c',
      instruction: 'Haz una curva abierta.',
      start: { x: 72, y: 76 },
      end: { x: 72, y: 108 },
      direction: 'counter-clockwise',
    },
  ]),

  'lower-d': trace('lower-d', [
    {
      id: 'lower-d-bowl',
      order: 1,
      path: 'M72 62 A24 30 0 0 0 72 122',
      label: 'Bola de la d',
      instruction: 'Haz una bolita.',
      start: { x: 72, y: 62 },
      end: { x: 72, y: 122 },
      direction: 'curve',
    },
    {
      id: 'lower-d-stem',
      order: 2,
      path: 'M72 16 L72 122',
      label: 'Línea larga',
      instruction: 'Baja una línea larga a la derecha.',
      start: { x: 72, y: 16 },
      end: { x: 72, y: 122 },
      direction: 'down',
    },
  ]),

  'lower-e': trace('lower-e', [
    {
      id: 'lower-e-loop',
      order: 1,
      path: 'M74 90 L34 90 C26 90 24 78 30 70 C38 60 58 60 68 70 C78 80 76 98 66 110 C56 122 36 120 28 110',
      label: 'Lazo de la e',
      instruction: 'Haz un lazo con una rayita en el medio.',
      start: { x: 74, y: 90 },
      end: { x: 28, y: 110 },
      direction: 'curve',
    },
  ]),

  'lower-f': trace('lower-f', [
    {
      id: 'lower-f-hook',
      order: 1,
      path: 'M64 22 C50 12 36 22 36 42 L36 122',
      label: 'Línea con gancho',
      instruction: 'Sube, dobla y baja.',
      start: { x: 64, y: 22 },
      end: { x: 36, y: 122 },
      direction: 'curve',
    },
    {
      id: 'lower-f-crossbar',
      order: 2,
      path: 'M22 62 L58 62',
      label: 'Línea del medio',
      instruction: 'Cruza una línea en el medio.',
      start: { x: 22, y: 62 },
      end: { x: 58, y: 62 },
      direction: 'right',
    },
  ]),

  'lower-g': trace('lower-g', [
    {
      id: 'lower-g-bowl',
      order: 1,
      path: 'M52 62 A24 30 0 0 0 52 122 A24 30 0 0 0 52 62',
      label: 'Bola de la g',
      instruction: 'Haz una bolita.',
      start: { x: 52, y: 62 },
      end: { x: 52, y: 62 },
      direction: 'counter-clockwise',
    },
    {
      id: 'lower-g-tail',
      order: 2,
      path: 'M76 92 L76 124 C76 134 58 138 38 132',
      label: 'Ganchito de la g',
      instruction: 'Baja y termina con un ganchito.',
      start: { x: 76, y: 92 },
      end: { x: 38, y: 132 },
      direction: 'curve',
    },
  ]),

  'lower-h': trace('lower-h', [
    {
      id: 'lower-h-stem',
      order: 1,
      path: 'M28 16 L28 122',
      label: 'Línea larga',
      instruction: 'Baja una línea larga.',
      start: { x: 28, y: 16 },
      end: { x: 28, y: 122 },
      direction: 'down',
    },
    {
      id: 'lower-h-arch',
      order: 2,
      path: 'M28 86 C30 68 46 60 58 68 C68 75 70 94 70 122',
      label: 'Arco de la h',
      instruction: 'Sube y baja un arco.',
      start: { x: 28, y: 86 },
      end: { x: 70, y: 122 },
      direction: 'curve',
    },
  ]),

  'lower-i': trace('lower-i', [
    {
      id: 'lower-i-stem',
      order: 1,
      path: 'M50 62 L50 122',
      label: 'Línea de la i',
      instruction: 'Baja una línea recta.',
      start: { x: 50, y: 62 },
      end: { x: 50, y: 122 },
      direction: 'down',
    },
    {
      id: 'lower-i-dot',
      order: 2,
      path: 'M50 48 L50 48',
      label: 'Punto de la i',
      instruction: 'Pon un puntito arriba.',
      start: { x: 50, y: 48 },
      end: { x: 50, y: 48 },
      direction: 'down',
      kind: 'dot',
    },
  ]),

  'lower-j': trace('lower-j', [
    {
      id: 'lower-j-hook',
      order: 1,
      path: 'M58 62 L58 124 C58 136 42 138 34 128',
      label: 'Línea con gancho',
      instruction: 'Baja y termina con un ganchito.',
      start: { x: 58, y: 62 },
      end: { x: 34, y: 128 },
      direction: 'curve',
    },
    {
      id: 'lower-j-dot',
      order: 2,
      path: 'M58 48 L58 48',
      label: 'Punto de la j',
      instruction: 'Pon un puntito arriba.',
      start: { x: 58, y: 48 },
      end: { x: 58, y: 48 },
      direction: 'down',
      kind: 'dot',
    },
  ]),

  'lower-k': trace('lower-k', [
    {
      id: 'lower-k-stem',
      order: 1,
      path: 'M30 16 L30 122',
      label: 'Línea larga',
      instruction: 'Sube una línea larga y baja.',
      start: { x: 30, y: 16 },
      end: { x: 30, y: 122 },
      direction: 'down',
    },
    {
      id: 'lower-k-arm',
      order: 2,
      path: 'M66 62 L30 94',
      label: 'Brazo de la k',
      instruction: 'Baja una diagonal al medio.',
      start: { x: 66, y: 62 },
      end: { x: 30, y: 94 },
      direction: 'down',
    },
    {
      id: 'lower-k-leg',
      order: 3,
      path: 'M32 90 L66 122',
      label: 'Pata de la k',
      instruction: 'Baja otra diagonal a la derecha.',
      start: { x: 32, y: 90 },
      end: { x: 66, y: 122 },
      direction: 'down',
    },
  ]),

  'lower-l': trace('lower-l', [
    {
      id: 'lower-l-stem',
      order: 1,
      path: 'M50 16 L50 122',
      label: 'Línea larga',
      instruction: 'Sube una línea larga y baja.',
      start: { x: 50, y: 16 },
      end: { x: 50, y: 122 },
      direction: 'down',
    },
  ]),

  'lower-m': trace('lower-m', [
    {
      id: 'lower-m-stem',
      order: 1,
      path: 'M20 62 L20 122',
      label: 'Línea izquierda',
      instruction: 'Baja una línea recta.',
      start: { x: 20, y: 62 },
      end: { x: 20, y: 122 },
      direction: 'down',
    },
    {
      id: 'lower-m-first-arch',
      order: 2,
      path: 'M20 86 C20 68 34 60 46 70 C52 76 52 98 52 122',
      label: 'Primer arco',
      instruction: 'Sube y baja un arco.',
      start: { x: 20, y: 86 },
      end: { x: 52, y: 122 },
      direction: 'curve',
    },
    {
      id: 'lower-m-second-arch',
      order: 3,
      path: 'M52 86 C52 68 64 60 72 70 C78 78 78 98 78 122',
      label: 'Segundo arco',
      instruction: 'Sube y baja otro arco.',
      start: { x: 52, y: 86 },
      end: { x: 78, y: 122 },
      direction: 'curve',
    },
  ]),

  'lower-n': trace('lower-n', [
    {
      id: 'lower-n-stem',
      order: 1,
      path: 'M26 62 L26 122',
      label: 'Línea izquierda',
      instruction: 'Baja una línea recta.',
      start: { x: 26, y: 62 },
      end: { x: 26, y: 122 },
      direction: 'down',
    },
    {
      id: 'lower-n-arch',
      order: 2,
      path: 'M26 86 C30 66 46 58 58 68 C68 76 70 94 70 122',
      label: 'Arco de la n',
      instruction: 'Sube y baja un arco.',
      start: { x: 26, y: 86 },
      end: { x: 70, y: 122 },
      direction: 'curve',
    },
  ]),

  'lower-ñ': trace('lower-ñ', [
    {
      id: 'lower-ñ-stem',
      order: 1,
      path: 'M26 62 L26 122',
      label: 'Línea izquierda',
      instruction: 'Baja una línea recta.',
      start: { x: 26, y: 62 },
      end: { x: 26, y: 122 },
      direction: 'down',
    },
    {
      id: 'lower-ñ-arch',
      order: 2,
      path: 'M26 86 C30 66 46 58 58 68 C68 76 70 94 70 122',
      label: 'Arco de la ñ',
      instruction: 'Sube y baja un arco.',
      start: { x: 26, y: 86 },
      end: { x: 70, y: 122 },
      direction: 'curve',
    },
    {
      id: 'lower-ñ-tilde',
      order: 3,
      path: 'M32 50 C38 43 46 55 54 49 C58 46 62 47 66 50',
      label: 'Virgulilla',
      instruction: 'Haz una ola pequeña arriba.',
      start: { x: 32, y: 50 },
      end: { x: 66, y: 50 },
      direction: 'curve',
    },
  ]),

  'lower-o': trace('lower-o', [
    {
      id: 'lower-o-round',
      order: 1,
      path: 'M50 62 A24 30 0 0 0 50 122 A24 30 0 0 0 50 62',
      label: 'Bola de la o',
      instruction: 'Haz una bolita redonda.',
      start: { x: 50, y: 62 },
      end: { x: 50, y: 62 },
      direction: 'counter-clockwise',
    },
  ]),

  'lower-p': trace('lower-p', [
    {
      id: 'lower-p-stem',
      order: 1,
      path: 'M28 62 L28 136',
      label: 'Línea larga',
      instruction: 'Baja una línea larga.',
      start: { x: 28, y: 62 },
      end: { x: 28, y: 136 },
      direction: 'down',
    },
    {
      id: 'lower-p-bowl',
      order: 2,
      path: 'M28 62 A24 30 0 0 1 28 122',
      label: 'Bola de la p',
      instruction: 'Haz una bolita arriba.',
      start: { x: 28, y: 62 },
      end: { x: 28, y: 122 },
      direction: 'curve',
    },
  ]),

  'lower-q': trace('lower-q', [
    {
      id: 'lower-q-bowl',
      order: 1,
      path: 'M72 62 A24 30 0 0 0 72 122',
      label: 'Bola de la q',
      instruction: 'Haz una bolita.',
      start: { x: 72, y: 62 },
      end: { x: 72, y: 122 },
      direction: 'curve',
    },
    {
      id: 'lower-q-stem',
      order: 2,
      path: 'M72 62 L72 136',
      label: 'Línea larga',
      instruction: 'Baja una línea larga a la derecha.',
      start: { x: 72, y: 62 },
      end: { x: 72, y: 136 },
      direction: 'down',
    },
  ]),

  'lower-r': trace('lower-r', [
    {
      id: 'lower-r-stem',
      order: 1,
      path: 'M30 62 L30 122',
      label: 'Línea de la r',
      instruction: 'Baja una línea recta.',
      start: { x: 30, y: 62 },
      end: { x: 30, y: 122 },
      direction: 'down',
    },
    {
      id: 'lower-r-shoulder',
      order: 2,
      path: 'M30 86 C30 68 44 58 62 64',
      label: 'Hombro de la r',
      instruction: 'Haz un hombro pequeñito.',
      start: { x: 30, y: 86 },
      end: { x: 62, y: 64 },
      direction: 'curve',
    },
  ]),

  'lower-s': trace('lower-s', [
    {
      id: 'lower-s-curve',
      order: 1,
      path: 'M68 72 C62 60 38 58 30 70 C22 82 38 90 50 92 C64 95 72 106 64 114 C54 124 34 122 26 110',
      label: 'Serpiente de la s',
      instruction: 'Dibuja una serpiente pequeña.',
      start: { x: 68, y: 72 },
      end: { x: 26, y: 110 },
      direction: 'curve',
    },
  ]),

  'lower-t': trace('lower-t', [
    {
      id: 'lower-t-stem',
      order: 1,
      path: 'M46 30 L46 110 C46 120 54 124 62 120',
      label: 'Línea con ganchito',
      instruction: 'Baja una línea con un ganchito.',
      start: { x: 46, y: 30 },
      end: { x: 62, y: 120 },
      direction: 'curve',
    },
    {
      id: 'lower-t-crossbar',
      order: 2,
      path: 'M30 62 L64 62',
      label: 'Línea del medio',
      instruction: 'Cruza una línea en el medio.',
      start: { x: 30, y: 62 },
      end: { x: 64, y: 62 },
      direction: 'right',
    },
  ]),

  'lower-u': trace('lower-u', [
    {
      id: 'lower-u-curve',
      order: 1,
      path: 'M26 62 L26 98 C26 116 74 116 74 98 L74 62',
      label: 'Curva de la u',
      instruction: 'Baja, da la vuelta y sube.',
      start: { x: 26, y: 62 },
      end: { x: 74, y: 62 },
      direction: 'curve',
    },
  ]),

  'lower-v': trace('lower-v', [
    {
      id: 'lower-v-curve',
      order: 1,
      path: 'M26 62 L50 122 L74 62',
      label: 'Pico de la v',
      instruction: 'Baja y sube.',
      start: { x: 26, y: 62 },
      end: { x: 74, y: 62 },
      direction: 'curve',
    },
  ]),

  'lower-w': trace('lower-w', [
    {
      id: 'lower-w-curve',
      order: 1,
      path: 'M20 62 L32 122 L50 76 L68 122 L80 62',
      label: 'Picos de la w',
      instruction: 'Baja y sube, baja y sube.',
      start: { x: 20, y: 62 },
      end: { x: 80, y: 62 },
      direction: 'curve',
    },
  ]),

  'lower-x': trace('lower-x', [
    {
      id: 'lower-x-first',
      order: 1,
      path: 'M26 62 L74 122',
      label: 'Primera diagonal',
      instruction: 'Baja una diagonal.',
      start: { x: 26, y: 62 },
      end: { x: 74, y: 122 },
      direction: 'down',
    },
    {
      id: 'lower-x-second',
      order: 2,
      path: 'M74 62 L26 122',
      label: 'Segunda diagonal',
      instruction: 'Cruza con otra diagonal.',
      start: { x: 74, y: 62 },
      end: { x: 26, y: 122 },
      direction: 'down',
    },
  ]),

  'lower-y': trace('lower-y', [
    {
      id: 'lower-y-left',
      order: 1,
      path: 'M26 62 L52 108',
      label: 'Diagonal izquierda',
      instruction: 'Baja una diagonal.',
      start: { x: 26, y: 62 },
      end: { x: 52, y: 108 },
      direction: 'down',
    },
    {
      id: 'lower-y-tail',
      order: 2,
      path: 'M74 62 L48 116 C42 128 32 134 24 132',
      label: 'Rabo de la y',
      instruction: 'Baja desde arriba y termina en un rabito.',
      start: { x: 74, y: 62 },
      end: { x: 24, y: 132 },
      direction: 'curve',
    },
  ]),

  'lower-z': trace('lower-z', [
    {
      id: 'lower-z-zigzag',
      order: 1,
      path: 'M28 62 L72 62 L28 122 L72 122',
      label: 'Zigzag de la z',
      instruction: 'Cruza, baja en diagonal y cruza abajo.',
      start: { x: 28, y: 62 },
      end: { x: 72, y: 122 },
      direction: 'curve',
    },
  ]),
};
