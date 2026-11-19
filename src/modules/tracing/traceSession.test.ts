import { describe, expect, it } from 'vitest';
import type { CharacterTrace, TracePoint, TraceStroke } from '@/modules/lessons/lesson.types';
import { getCharacterTrace } from '@/modules/lessons/traces';
import { samplePath } from './traceGeometry';
import {
  createTraceSession,
  resetTraceSession,
  submitTraceStroke,
  traceSessionAccuracy,
  type TraceSessionState,
} from './traceSession';

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

function pointsAlong(index: number): TracePoint[] {
  return samplePath(strokeAt(index).path, 2).points;
}

function submit(state: TraceSessionState, index: number) {
  return submitTraceStroke(state, trace, pointsAlong(index));
}

describe('traceSession', () => {
  it('empieza en el primer trazo y sin intentos', () => {
    const session = createTraceSession(trace);

    expect(session.currentStrokeIndex).toBe(0);
    expect(session.completedStrokes).toBe(0);
    expect(session.totalStrokes).toBe(3);
    expect(session.completed).toBe(false);
    expect(session.attempts).toBe(0);
    expect(session.strokeAttempts).toEqual([0, 0, 0]);
    expect(session.acceptedScores).toEqual([]);
    expect(traceSessionAccuracy(session)).toBe(0);
  });

  it('avanza trazo a trazo y completa la letra en orden', () => {
    let session = createTraceSession(trace);

    const first = submit(session, 0);
    expect(first.result?.accepted).toBe(true);
    session = first.state;
    expect(session.currentStrokeIndex).toBe(1);
    expect(session.completedStrokes).toBe(1);
    expect(session.completed).toBe(false);

    const second = submit(session, 1);
    expect(second.result?.accepted).toBe(true);
    session = second.state;
    expect(session.currentStrokeIndex).toBe(2);

    const third = submit(session, 2);
    expect(third.result?.accepted).toBe(true);
    session = third.state;
    expect(session.currentStrokeIndex).toBe(3);
    expect(session.completedStrokes).toBe(3);
    expect(session.completed).toBe(true);
    expect(session.attempts).toBe(3);
    expect(session.strokeAttempts).toEqual([1, 1, 1]);
    expect(traceSessionAccuracy(session)).toBeGreaterThan(0.9);
  });

  it('no avanza si se intenta saltar un trazo', () => {
    const session = createTraceSession(trace);
    const skipped = submit(session, 1);

    expect(skipped.result?.accepted).toBe(false);
    expect(skipped.result?.issues).toContain('wrong-order');
    expect(skipped.state.currentStrokeIndex).toBe(0);
    expect(skipped.state.completedStrokes).toBe(0);
    expect(skipped.state.attempts).toBe(1);
    expect(skipped.state.strokeAttempts).toEqual([1, 0, 0]);
    expect(skipped.state.completed).toBe(false);
  });

  it('detecta el trazo equivocado también al final del ejercicio', () => {
    const afterFirst = submit(createTraceSession(trace), 0).state;
    const skipped = submit(afterFirst, 2);

    expect(skipped.result?.accepted).toBe(false);
    expect(skipped.result?.issues).toContain('wrong-order');
    expect(skipped.result?.orderHint).toBe(3);
    expect(skipped.state.currentStrokeIndex).toBe(1);
    expect(skipped.state.strokeAttempts).toEqual([1, 1, 0]);
  });

  it('permite repetir el mismo trazo después de un error', () => {
    const session = createTraceSession(trace);
    const wrongStart = pointsAlong(0).slice(20);
    const failed = submitTraceStroke(session, trace, wrongStart);

    expect(failed.result?.accepted).toBe(false);
    expect(failed.state.currentStrokeIndex).toBe(0);
    expect(failed.state.attempts).toBe(1);

    const retried = submit(failed.state, 0);
    expect(retried.result?.accepted).toBe(true);
    expect(retried.state.currentStrokeIndex).toBe(1);
    expect(retried.state.attempts).toBe(2);
    expect(retried.state.strokeAttempts).toEqual([2, 0, 0]);
  });

  it('ignora envíos cuando la letra ya está completa', () => {
    let session = createTraceSession(trace);
    session = submit(session, 0).state;
    session = submit(session, 1).state;
    session = submit(session, 2).state;
    expect(session.completed).toBe(true);

    const extra = submit(session, 0);
    expect(extra.result).toBeNull();
    expect(extra.state).toBe(session);
  });

  it('reinicia la ronda sin conservar intentos ni puntuaciones', () => {
    let session = createTraceSession(trace);
    session = submit(session, 0).state;
    const failed = submitTraceStroke(session, trace, []).state;
    expect(failed.attempts).toBe(2);
    expect(failed.completedStrokes).toBe(1);

    const reset = resetTraceSession(trace);
    expect(reset).toEqual(createTraceSession(trace));
    expect(reset.attempts).toBe(0);
    expect(reset.acceptedScores).toEqual([]);
    expect(traceSessionAccuracy(reset)).toBe(0);
  });

  it('calcula la precisión media de los trazos aceptados', () => {
    const session: TraceSessionState = {
      ...createTraceSession(trace),
      acceptedScores: [0.9, 0.8, 0.7],
    };

    expect(traceSessionAccuracy(session)).toBe(0.8);
    expect(traceSessionAccuracy({ ...session, acceptedScores: [0.3333] })).toBe(0.333);
  });
});
