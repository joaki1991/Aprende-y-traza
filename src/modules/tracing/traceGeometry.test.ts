import { describe, expect, it } from 'vitest';
import {
  distanceToPolyline,
  nearestPointOnPolyline,
  parseViewBox,
  pointAtRatio,
  polylineFromPoints,
  samplePath,
  toViewBoxPoint,
} from './traceGeometry';

describe('parseViewBox', () => {
  it('lee el sistema de coordenadas del carácter', () => {
    expect(parseViewBox('0 0 100 140')).toEqual({ minX: 0, minY: 0, width: 100, height: 140 });
    expect(parseViewBox('10, 20, 80, 120')).toEqual({
      minX: 10,
      minY: 20,
      width: 80,
      height: 120,
    });
  });

  it('usa un valor seguro si el viewBox es inválido', () => {
    expect(parseViewBox('')).toEqual({ minX: 0, minY: 0, width: 100, height: 140 });
    expect(parseViewBox('0 0 0 140')).toEqual({ minX: 0, minY: 0, width: 100, height: 140 });
  });
});

describe('muestreo de paths SVG', () => {
  it('convierte una línea en una polilínea con sus extremos', () => {
    const line = samplePath('M10 20 L30 20');
    expect(line.points[0]).toEqual({ x: 10, y: 20 });
    expect(line.points.at(-1)).toEqual({ x: 30, y: 20 });
    expect(line.length).toBeCloseTo(20, 4);
  });

  it('admite comandos relativos, H, V y cierre de subcamino', () => {
    const square = samplePath('M10 10 h20 v20 h-20 Z');
    expect(square.points[0]).toEqual({ x: 10, y: 10 });
    expect(square.length).toBeCloseTo(80, 4);
    expect(square.points.at(-1)).toEqual({ x: 10, y: 10 });
  });

  it('muestrea curvas cúbicas y cuadráticas conservando los extremos', () => {
    const cubic = samplePath('M0 0 C20 40 40 40 60 0');
    expect(cubic.points[0]).toEqual({ x: 0, y: 0 });
    expect(cubic.points.at(-1)?.x).toBeCloseTo(60, 4);
    expect(cubic.points.at(-1)?.y).toBeCloseTo(0, 4);
    expect(cubic.points.length).toBeGreaterThan(10);

    const quadratic = samplePath('M0 0 Q30 40 60 0');
    expect(quadratic.points.at(-1)?.x).toBeCloseTo(60, 4);
    expect(quadratic.points.at(-1)?.y).toBeCloseTo(0, 4);
  });

  it('calcula la longitud acumulada de forma monótona', () => {
    const line = samplePath('M0 0 L100 0');
    for (let index = 1; index < line.cumulative.length; index += 1) {
      expect(line.cumulative[index]).toBeGreaterThanOrEqual(line.cumulative[index - 1] ?? 0);
    }
    expect(line.cumulative.at(-1)).toBeCloseTo(line.length, 5);
  });
});

describe('distancias y puntos de referencia', () => {
  const horizontal = polylineFromPoints([
    { x: 0, y: 0 },
    { x: 100, y: 0 },
  ]);

  it('mide la distancia mínima a la polilínea', () => {
    expect(distanceToPolyline({ x: 50, y: 10 }, horizontal)).toBeCloseTo(10, 4);
    expect(distanceToPolyline({ x: 120, y: 0 }, horizontal)).toBeCloseTo(20, 4);
  });

  it('devuelve el progreso del punto más cercano', () => {
    const hit = nearestPointOnPolyline({ x: 25, y: 4 }, horizontal);
    expect(hit.progress).toBeCloseTo(0.25, 3);
    expect(hit.distance).toBeCloseTo(4, 4);
  });

  it('obtiene punto y ángulo a una proporción del recorrido', () => {
    const sample = pointAtRatio(horizontal, 0.25);
    expect(sample.point.x).toBeCloseTo(25, 3);
    expect(sample.point.y).toBeCloseTo(0, 5);
    expect(sample.angle).toBeCloseTo(0, 5);
  });
});

describe('conversión desde píxeles', () => {
  const viewBox = { minX: 0, minY: 0, width: 100, height: 140 };

  it('convierte el mismo punto normalizado desde tamaños distintos', () => {
    const small = toViewBoxPoint(170, 238, { left: 0, top: 0, width: 340, height: 476 }, viewBox);
    const large = toViewBoxPoint(340, 476, { left: 0, top: 0, width: 680, height: 952 }, viewBox);

    expect(small).toEqual({ x: 50, y: 70 });
    expect(large).toEqual({ x: 50, y: 70 });
  });

  it('tiene en cuenta el desplazamiento del elemento', () => {
    const point = toViewBoxPoint(60, 90, { left: 10, top: 20, width: 200, height: 280 }, viewBox);
    expect(point).toEqual({ x: 25, y: 35 });
  });
});
