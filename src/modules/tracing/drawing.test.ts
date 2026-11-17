import { describe, expect, it } from 'vitest';
import {
  DOODLE_COLORS,
  appendDoodlePoint,
  doodleStrokeWidth,
  toDoodlePoint,
  type DoodleStroke,
} from './drawing';

const size = { width: 300, height: 400 };

function strokeWith(points: DoodleStroke['points']): DoodleStroke {
  return { color: DOODLE_COLORS[0].value, widthRatio: 0.04, points };
}

describe('coordenadas del lienzo', () => {
  it('convierte coordenadas del puntero a valores normalizados', () => {
    expect(toDoodlePoint(150, 200, { left: 0, top: 0, width: 300, height: 400 })).toEqual({
      x: 0.5,
      y: 0.5,
    });
  });

  it('recorta los puntos que se salen del lienzo', () => {
    const point = toDoodlePoint(-50, 900, { left: 10, top: 10, width: 200, height: 100 });
    expect(point).toEqual({ x: 0, y: 1 });
  });
});

describe('trazos del lienzo', () => {
  it('añade el primer punto siempre', () => {
    const stroke = strokeWith([]);
    expect(appendDoodlePoint(stroke, { x: 0.2, y: 0.3 }, size)).toBe(true);
    expect(stroke.points).toEqual([{ x: 0.2, y: 0.3 }]);
  });

  it('descarta puntos demasiado cercanos para ahorrar memoria', () => {
    const stroke = strokeWith([{ x: 0.5, y: 0.5 }]);
    expect(appendDoodlePoint(stroke, { x: 0.5001, y: 0.5 }, size)).toBe(false);
    expect(appendDoodlePoint(stroke, { x: 0.55, y: 0.5 }, size)).toBe(true);
    expect(stroke.points).toHaveLength(2);
  });

  it('mantiene un grosor mínimo legible', () => {
    const stroke = strokeWith([{ x: 0, y: 0 }]);
    expect(doodleStrokeWidth(stroke, size)).toBe(12);
    expect(doodleStrokeWidth({ ...stroke, widthRatio: 0.001 }, size)).toBe(3);
  });

  it('define una paleta pastel válida y sin duplicados', () => {
    expect(DOODLE_COLORS).toHaveLength(5);
    expect(new Set(DOODLE_COLORS.map((color) => color.value)).size).toBe(DOODLE_COLORS.length);
    expect(DOODLE_COLORS.every((color) => /^#[0-9a-f]{6}$/i.test(color.value))).toBe(true);
  });
});
