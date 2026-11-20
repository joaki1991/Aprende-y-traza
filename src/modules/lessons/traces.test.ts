import { describe, expect, it } from 'vitest';
import type { CharacterTrace, TracePoint, TraceStroke } from './lesson.types';
import { LESSON_PACKS, TOTAL_LESSON_CHARACTERS } from './content';
import {
  getCharacterTrace,
  hasCharacterTrace,
  listAvailableTraceIds,
} from './traces';
import { samplePath } from '../tracing/traceGeometry';
import { evaluateStroke } from '../tracing/traceValidation';
import { createTraceSession, submitTraceStroke } from '../tracing/traceSession';

/**
 * Contrato del catálogo completo de fichas.
 *
 * Las pruebas no comprueban solo que existan 64 entradas: también que cada
 * path sea trazable, que sus extremos coincidan con el modelo, que quede dentro
 * del tablero y que el motor acepte el recorrido oficial y rechace el inverso.
 */

const catalogCharacters = LESSON_PACKS.flatMap((pack) =>
  pack.characters.map((character) => ({ pack, character })),
);

const allTraces: CharacterTrace[] = catalogCharacters.map(({ character }) => {
  const trace = getCharacterTrace(character.id);
  if (!trace) {
    throw new Error(`Falta el trazo de ${character.id}`);
  }
  return trace;
});

function pointsAlong(stroke: TraceStroke, spacing = 2): TracePoint[] {
  if (stroke.kind === 'dot') {
    return [stroke.start];
  }
  return samplePath(stroke.path, spacing).points;
}

function expectFinitePoint(point: TracePoint): void {
  expect(Number.isFinite(point.x)).toBe(true);
  expect(Number.isFinite(point.y)).toBe(true);
}

describe('catálogo de trazos', () => {
  it('cubre exactamente los 64 caracteres de contenido', () => {
    expect(TOTAL_LESSON_CHARACTERS).toBe(64);
    expect(listAvailableTraceIds()).toHaveLength(64);

    for (const { character } of catalogCharacters) {
      expect(hasCharacterTrace(character.id), character.id).toBe(true);
      const trace = getCharacterTrace(character.id);
      expect(trace?.characterId).toBe(character.id);
      expect(trace?.strokes.length).toBeGreaterThan(0);
    }
  });

  it('incluye 27 mayúsculas, 27 minúsculas y 10 números sin duplicados', () => {
    const upper = allTraces.filter((trace) => trace.characterId.startsWith('upper-'));
    const lower = allTraces.filter((trace) => trace.characterId.startsWith('lower-'));
    const digits = allTraces.filter((trace) => trace.characterId.startsWith('digit-'));

    expect(upper).toHaveLength(27);
    expect(lower).toHaveLength(27);
    expect(digits).toHaveLength(10);
    expect(new Set(allTraces.map((trace) => trace.characterId)).size).toBe(64);
  });

  it('usa el mismo tablero 5:7 y trazos ordenados de uno en uno', () => {
    for (const trace of allTraces) {
      expect(trace.viewBox, trace.characterId).toBe('0 0 100 140');
      const strokeIds = new Set<string>();

      trace.strokes.forEach((stroke, index) => {
        expect(stroke.order, `${trace.characterId}/${stroke.id}`).toBe(index + 1);
        expect(strokeIds.has(stroke.id), `${trace.characterId}/${stroke.id}`).toBe(false);
        strokeIds.add(stroke.id);
        expect(stroke.path.trim().startsWith('M')).toBe(true);
        expectFinitePoint(stroke.start);
        expectFinitePoint(stroke.end);
        expect(stroke.label.length).toBeGreaterThan(0);
        expect(stroke.instruction.length).toBeGreaterThan(0);
      });
    }
  });

  it('tiene identificadores de trazo únicos en todo el catálogo', () => {
    const ids = allTraces.flatMap((trace) => trace.strokes.map((stroke) => stroke.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('no encadena subcaminos: cada trazo se dibuja de una vez', () => {
    // El muestreador conecta subcaminos, así que un segundo `M` crearía un
    // salto invisible que la niña no podría seguir.
    for (const trace of allTraces) {
      for (const stroke of trace.strokes) {
        const moves = stroke.path.match(/[Mm]/g) ?? [];
        expect(moves.length, `${trace.characterId}/${stroke.id}`).toBe(1);
      }
    }
  });

  it('declara tolerancias coherentes y solo en trazos normales', () => {
    for (const trace of allTraces) {
      for (const stroke of trace.strokes) {
        if (stroke.tolerance === undefined) {
          continue;
        }
        expect(stroke.tolerance, `${trace.characterId}/${stroke.id}`).toBeGreaterThanOrEqual(0.08);
        expect(stroke.tolerance, `${trace.characterId}/${stroke.id}`).toBeLessThanOrEqual(0.15);
        expect(stroke.kind ?? 'stroke').toBe('stroke');
      }
    }
  });

  it('mantiene los extremos del path y la geometría dentro del tablero', () => {
    for (const trace of allTraces) {
      for (const stroke of trace.strokes) {
        const sample = samplePath(stroke.path, 1.5);
        expect(sample.points.length, `${trace.characterId}/${stroke.id}`).toBeGreaterThan(0);

        const first = sample.points[0];
        const last = sample.points.at(-1);
        expect(first?.x, `${trace.characterId}/${stroke.id} inicio x`).toBeCloseTo(stroke.start.x, 2);
        expect(first?.y, `${trace.characterId}/${stroke.id} inicio y`).toBeCloseTo(stroke.start.y, 2);
        expect(last?.x, `${trace.characterId}/${stroke.id} fin x`).toBeCloseTo(stroke.end.x, 2);
        expect(last?.y, `${trace.characterId}/${stroke.id} fin y`).toBeCloseTo(stroke.end.y, 2);

        if (stroke.kind === 'dot') {
          expect(sample.length).toBeCloseTo(0, 5);
          continue;
        }
        expect(sample.length, `${trace.characterId}/${stroke.id}`).toBeGreaterThan(2);

        for (const point of sample.points) {
          expectFinitePoint(point);
          expect(point.x, `${trace.characterId}/${stroke.id} x`).toBeGreaterThanOrEqual(-0.5);
          expect(point.x, `${trace.characterId}/${stroke.id} x`).toBeLessThanOrEqual(100.5);
          expect(point.y, `${trace.characterId}/${stroke.id} y`).toBeGreaterThanOrEqual(-0.5);
          expect(point.y, `${trace.characterId}/${stroke.id} y`).toBeLessThanOrEqual(140.5);
        }
      }
    }
  });

  it('conserva exactamente la ficha de la A aprobada en el Sprint 1', () => {
    const a = getCharacterTrace('upper-a');
    expect(a?.strokes.map((stroke) => stroke.path)).toEqual([
      'M50 16 L20 122',
      'M50 16 L80 122',
      'M29.6 88 L70.4 88',
    ]);
    expect(a?.strokes.map((stroke) => stroke.label)).toEqual([
      'Diagonal izquierda',
      'Diagonal derecha',
      'Línea del medio',
    ]);
    expect(a?.strokes.map((stroke) => stroke.order)).toEqual([1, 2, 3]);
  });

  it('construye la Ñ con el cuerpo de la N y una virgulilla final', () => {
    const n = getCharacterTrace('upper-n');
    const enye = getCharacterTrace('upper-ñ');
    expect(n?.strokes).toHaveLength(3);
    expect(enye?.strokes).toHaveLength(4);
    expect(enye?.strokes.slice(0, 3).map((stroke) => stroke.label)).toEqual(
      n?.strokes.map((stroke) => stroke.label),
    );
    expect(enye?.strokes[3]?.label).toBe('Virgulilla');
    expect(enye?.strokes[3]?.order).toBe(4);

    const lowerEnye = getCharacterTrace('lower-ñ');
    expect(lowerEnye?.strokes.at(-1)?.label).toBe('Virgulilla');
  });

  it('usa puntos independientes en la i y la j', () => {
    const dots = allTraces.flatMap((trace) =>
      trace.strokes.filter((stroke) => stroke.kind === 'dot').map((stroke) => stroke.id),
    );
    expect(dots.sort()).toEqual(['lower-i-dot', 'lower-j-dot']);

    for (const trace of [getCharacterTrace('lower-i'), getCharacterTrace('lower-j')]) {
      expect(trace?.strokes).toHaveLength(2);
      expect(trace?.strokes[1]?.kind).toBe('dot');
      expect(trace?.strokes[1]?.start).toEqual(trace?.strokes[1]?.end);
    }
  });

  it('usa arcos en las figuras redondas y letras curvas', () => {
    for (const id of ['upper-o', 'lower-o', 'digit-0', 'upper-c', 'digit-9']) {
      const trace = getCharacterTrace(id);
      expect(trace?.strokes.some((stroke) => stroke.path.includes('A')), id).toBe(true);
    }
  });
});

describe('trazabilidad de todas las fichas', () => {
  it('acepta el recorrido oficial de cada trazo y completa la ficha', () => {
    for (const trace of allTraces) {
      let session = createTraceSession(trace);

      for (let index = 0; index < trace.strokes.length; index += 1) {
        const stroke = trace.strokes[index];
        if (!stroke) {
          throw new Error(`Trazo ${index} inexistente en ${trace.characterId}`);
        }
        const submission = submitTraceStroke(session, trace, pointsAlong(stroke));
        expect(
          submission.result?.accepted,
          `${trace.characterId}/${stroke.id}: ${submission.result?.issues.join(', ')}`,
        ).toBe(true);
        session = submission.state;
      }

      expect(session.completed, trace.characterId).toBe(true);
      expect(session.completedStrokes).toBe(trace.strokes.length);
    }
  });

  it('rechaza el recorrido inverso de cualquier trazo con recorrido', () => {
    for (const trace of allTraces) {
      for (const stroke of trace.strokes) {
        if (stroke.kind === 'dot') {
          continue;
        }
        const reversed = [...pointsAlong(stroke)].reverse();
        const result = evaluateStroke(reversed, stroke, trace);
        expect(
          result.accepted,
          `${trace.characterId}/${stroke.id} no debería aceptarse al revés`,
        ).toBe(false);
      }
    }
  });

  it('detecta el salto al último trazo en las fichas de varios pasos', () => {
    for (const trace of allTraces) {
      if (trace.strokes.length < 2) {
        continue;
      }
      const first = trace.strokes[0];
      const last = trace.strokes.at(-1);
      if (!first || !last) {
        continue;
      }

      const result = evaluateStroke(pointsAlong(last), first, trace, {
        remainingStrokes: trace.strokes.slice(1),
      });
      expect(
        result.accepted,
        `${trace.characterId}: el último trazo no debe valer como primero`,
      ).toBe(false);
    }
  });

  it('rechaza un garabato vertical en todas las fichas', () => {
    const scribble: TracePoint[] = [];
    for (let index = 0; index <= 40; index += 1) {
      scribble.push({ x: index % 2 === 0 ? 16 : 84, y: 14 + index * 2.7 });
    }

    for (const trace of allTraces) {
      const first = trace.strokes[0];
      if (!first) {
        continue;
      }
      const result = evaluateStroke(scribble, first, trace);
      expect(result.accepted, `${trace.characterId} aceptó un garabato`).toBe(false);
    }
  });
});
