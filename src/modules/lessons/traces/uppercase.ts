import type { CharacterTrace } from '../lesson.types';

/**
 * Trazos de las mayúsculas.
 *
 * Solo la A está disponible en el Sprint 1 como prueba integral del motor.
 * El resto se irá añadiendo en sprints posteriores sin tocar la interfaz:
 * basta con registrar aquí su `CharacterTrace`.
 *
 * Convención de coordenadas: `viewBox="0 0 100 140"`, origen arriba a la
 * izquierda. Los puntos de inicio y fin deben coincidir con los extremos del
 * `path` para que la validación sea coherente.
 */

const APEX_Y = 16;
const BASE_Y = 122;
const CROSSBAR_Y = 88;

const LEFT_FOOT_X = 20;
const RIGHT_FOOT_X = 80;
const CROSSBAR_LEFT_X = 29.6;
const CROSSBAR_RIGHT_X = 70.4;

export const UPPERCASE_TRACES: Record<string, CharacterTrace> = {
  'upper-a': {
    characterId: 'upper-a',
    viewBox: '0 0 100 140',
    strokes: [
      {
        id: 'upper-a-left',
        order: 1,
        path: `M50 ${APEX_Y} L${LEFT_FOOT_X} ${BASE_Y}`,
        label: 'Diagonal izquierda',
        instruction: 'Baja desde la punta hacia la izquierda.',
        start: { x: 50, y: APEX_Y },
        end: { x: LEFT_FOOT_X, y: BASE_Y },
        direction: 'down',
        tolerance: 0.11,
      },
      {
        id: 'upper-a-right',
        order: 2,
        path: `M50 ${APEX_Y} L${RIGHT_FOOT_X} ${BASE_Y}`,
        label: 'Diagonal derecha',
        instruction: 'Vuelve arriba y baja hacia la derecha.',
        start: { x: 50, y: APEX_Y },
        end: { x: RIGHT_FOOT_X, y: BASE_Y },
        direction: 'down',
        tolerance: 0.11,
      },
      {
        id: 'upper-a-crossbar',
        order: 3,
        path: `M${CROSSBAR_LEFT_X} ${CROSSBAR_Y} L${CROSSBAR_RIGHT_X} ${CROSSBAR_Y}`,
        label: 'Línea del medio',
        instruction: 'Cruza una línea en el medio, de izquierda a derecha.',
        start: { x: CROSSBAR_LEFT_X, y: CROSSBAR_Y },
        end: { x: CROSSBAR_RIGHT_X, y: CROSSBAR_Y },
        direction: 'right',
        tolerance: 0.12,
      },
    ],
  },
};
