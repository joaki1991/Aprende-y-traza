import { describe, expect, it } from 'vitest';
import type { CharacterTrace, TracePoint, TraceStroke } from '@/modules/lessons/lesson.types';
import { getCharacterTrace } from '@/modules/lessons/traces';
import { samplePath, toViewBoxPoint } from './traceGeometry';
import { evaluateStroke, type TraceValidationResult } from './traceValidation';

function loadTrace(): CharacterTrace {
  const trace = getCharacterTrace('upper-a');
  if (!trace) {
    throw new Error('La A mayúscula debería tener trazos registrados.');
  }
  return trace;
}

const trace = loadTrace();

function strokeAt(index: number): TraceStroke {
  const stroke = trace.strokes[index];
  if (!stroke) {
    throw new Error(`No existe el trazo ${index}.`);
  }
  return stroke;
}

/** Puntos a lo largo del recorrido oficial, entre dos proporciones. */
function pointsAlong(stroke: TraceStroke, from = 0, to = 1): TracePoint[] {
  const polyline = samplePath(stroke.path, 2);
  return polyline.points.filter((_, index) => {
    const ratio = (polyline.cumulative[index] ?? 0) / Math.max(1, polyline.length);
    return ratio >= from - 1e-6 && ratio <= to + 1e-6;
  });
}

function shift(points: readonly TracePoint[], dx: number, dy: number): TracePoint[] {
  return points.map((point) => ({ x: point.x + dx, y: point.y + dy }));
}

function evaluate(index: number, points: readonly TracePoint[]): TraceValidationResult {
  const stroke = strokeAt(index);
  return evaluateStroke(points, stroke, trace, {
    remainingStrokes: trace.strokes.slice(index + 1),
  });
}

describe('validación de trazos', () => {
  it('acepta los tres trazos de la A dibujados en orden', () => {
    for (let index = 0; index < trace.strokes.length; index += 1) {
      const result = evaluate(index, pointsAlong(strokeAt(index)));
      expect(result.accepted, `trazo ${index + 1}: ${result.issues.join(', ')}`).toBe(true);
      expect(result.issues).toEqual([]);
      expect(result.metrics.coverage).toBeGreaterThan(0.95);
      expect(result.metrics.direction).toBeGreaterThan(0.9);
    }
  });

  it('rechaza un trazo invertido', () => {
    const inverted = [...pointsAlong(strokeAt(0))].reverse();
    const result = evaluate(0, inverted);

    expect(result.accepted).toBe(false);
    expect(result.issues).toContain('start-too-far');
    expect(result.issues.some((issue) => issue === 'backwards' || issue === 'incomplete')).toBe(
      true,
    );
  });

  it('rechaza un inicio fuera de tolerancia', () => {
    const result = evaluate(0, pointsAlong(strokeAt(0), 0.28, 1));

    expect(result.accepted).toBe(false);
    expect(result.issues).toContain('start-too-far');
    expect(result.metrics.startDistance).toBeGreaterThan(10);
  });

  it('rechaza un final fuera de tolerancia', () => {
    const result = evaluate(0, pointsAlong(strokeAt(0), 0, 0.68));

    expect(result.accepted).toBe(false);
    expect(result.issues).toContain('finish-too-far');
    expect(result.metrics.endDistance).toBeGreaterThan(10);
  });

  it('rechaza un recorrido incompleto', () => {
    const result = evaluate(1, pointsAlong(strokeAt(1), 0, 0.35));

    expect(result.accepted).toBe(false);
    expect(result.issues).toContain('incomplete');
    expect(result.metrics.coverage).toBeLessThan(0.6);
  });

  it('rechaza una desviación excesiva', () => {
    const deviated = shift(pointsAlong(strokeAt(0)), 26, 0);
    const result = evaluate(0, deviated);

    expect(result.accepted).toBe(false);
    expect(result.issues).toContain('off-path');
    expect(result.metrics.accuracy).toBeLessThan(0.2);
  });

  it('rechaza un trazo demasiado corto', () => {
    const result = evaluate(0, pointsAlong(strokeAt(0)).slice(0, 2));

    expect(result.accepted).toBe(false);
    expect(result.issues).toContain('too-short');
  });

  it('detecta que se ha dibujado el trazo siguiente', () => {
    const result = evaluate(0, pointsAlong(strokeAt(1)));

    expect(result.accepted).toBe(false);
    expect(result.issues).toContain('wrong-order');
    expect(result.orderHint).toBe(2);
  });

  it('no aprueba un garabato que recorre la letra de cualquier manera', () => {
    const scribble: TracePoint[] = [];
    for (let index = 0; index <= 40; index += 1) {
      scribble.push({
        x: index % 2 === 0 ? 16 : 84,
        y: 14 + index * 2.7,
      });
    }

    const result = evaluate(0, scribble);
    expect(result.accepted).toBe(false);
    expect(
      result.issues.some((issue) =>
        ['scribble', 'off-path', 'incomplete', 'backwards'].includes(issue),
      ),
    ).toBe(true);
  });

  it('da el mismo resultado en pantallas de distinto tamaño y orientación', () => {
    const source = pointsAlong(strokeAt(2));
    const sizes = [
      { left: 0, top: 0, width: 340, height: 476 },
      { left: 24, top: 12, width: 680, height: 952 },
      // Tablero horizontal y tablet: misma proporción 5:7, distinto tamaño.
      { left: 0, top: 0, width: 250, height: 350 },
      { left: 40, top: 8, width: 900, height: 1260 },
    ];
    const viewBox = { minX: 0, minY: 0, width: 100, height: 140 };

    for (const rect of sizes) {
      const screenPoints = source.map((point) =>
        toViewBoxPoint(
          rect.left + (point.x / 100) * rect.width,
          rect.top + (point.y / 140) * rect.height,
          rect,
          viewBox,
        ),
      );
      const result = evaluate(2, screenPoints);
      expect(result.accepted, JSON.stringify(result.issues)).toBe(true);
      expect(result.metrics.coverage).toBeGreaterThan(0.95);
    }
  });

  it('mantiene las tolerancias en coordenadas del viewBox al girar', () => {
    // Un desplazamiento pequeño en píxeles equivale a más unidades del viewBox
    // en un tablero pequeño. La tolerancia debe seguir siendo la misma fracción.
    const source = pointsAlong(strokeAt(0));
    const landscape = { left: 0, top: 0, width: 250, height: 350 };
    const viewBox = { minX: 0, minY: 0, width: 100, height: 140 };

    const accepted = source.map((point) =>
      toViewBoxPoint(
        (point.x / 100) * landscape.width,
        (point.y / 140) * landscape.height,
        landscape,
        viewBox,
      ),
    );
    expect(evaluate(0, accepted).accepted).toBe(true);

    // Desviar 12 unidades del viewBox supera la tolerancia de la A (11 % del
    // lado menor = 11) con independencia del tamaño de pantalla.
    const deviated = accepted.map((point) => ({ x: point.x + 12, y: point.y }));
    const result = evaluate(0, deviated);
    expect(result.accepted).toBe(false);
    expect(result.metrics.accuracy).toBeLessThan(0.5);
  });
});

describe('puntos independientes de la i y la j', () => {
  const lowerI = getCharacterTrace('lower-i');
  const lowerJ = getCharacterTrace('lower-j');

  if (!lowerI || !lowerJ) {
    throw new Error('Las minúsculas i y j deberían tener trazos registrados.');
  }

  const iDot = lowerI.strokes[1];
  const jDot = lowerJ.strokes[1];
  const iStem = lowerI.strokes[0];

  if (!iDot || !jDot || !iStem) {
    throw new Error('La i y la j deberían tener línea y punto.');
  }

  it('acepta un toque justo en el punto de la i', () => {
    const result = evaluateStroke([{ x: 50, y: 48 }], iDot, lowerI);

    expect(result.accepted).toBe(true);
    expect(result.issues).toEqual([]);
    expect(result.metrics.direction).toBe(1);
  });

  it('acepta un toque pequeño y algo movedizo', () => {
    const result = evaluateStroke(
      [
        { x: 51, y: 49 },
        { x: 53, y: 50 },
      ],
      iDot,
      lowerI,
    );

    expect(result.accepted, result.issues.join(', ')).toBe(true);
  });

  it('rechaza un toque lejos del punto', () => {
    const result = evaluateStroke([{ x: 70, y: 48 }], iDot, lowerI);

    expect(result.accepted).toBe(false);
    expect(result.issues).toContain('start-too-far');
    expect(result.issues).toContain('off-path');
  });

  it('rechaza un garabato largo sobre el punto', () => {
    const scratch: TracePoint[] = [];
    for (let index = 0; index <= 20; index += 1) {
      scratch.push({ x: 50 + index * 1.6, y: 48 });
    }

    const result = evaluateStroke(scratch, iDot, lowerI);

    expect(result.accepted).toBe(false);
    expect(result.issues).toContain('scribble');
  });

  it('no confunde la línea de la i con su punto', () => {
    const result = evaluateStroke(pointsAlong(iStem), iDot, lowerI);

    expect(result.accepted).toBe(false);
    expect(result.issues).toContain('off-path');
  });

  it('detecta que el punto de la i se ha dibujado antes de la línea', () => {
    const result = evaluateStroke([{ x: 50, y: 48 }], iStem, lowerI, {
      remainingStrokes: [iDot],
    });

    expect(result.accepted).toBe(false);
    expect(result.issues).toContain('wrong-order');
    expect(result.orderHint).toBe(2);
  });

  it('valida el punto de la j en su propia posición', () => {
    const accepted = evaluateStroke([{ x: 58, y: 48 }], jDot, lowerJ);
    expect(accepted.accepted).toBe(true);
    expect(accepted.metrics.startDistance).toBe(0);

    const far = evaluateStroke([{ x: 30, y: 48 }], jDot, lowerJ);
    expect(far.accepted).toBe(false);
    expect(far.issues).toContain('start-too-far');
  });
});
