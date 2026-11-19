import type { CharacterTrace, TracePoint } from '@/modules/lessons/lesson.types';
import {
  evaluateStroke,
  type StrokeValidationOptions,
  type TraceValidationResult,
} from './traceValidation';

/**
 * Estado puro de una ronda de trazado.
 *
 * La sesión es la que impone el orden: solo se evalúa el trazo actual. Si se
 * dibuja otro trazo, la validación lo detecta y la sesión no avanza.
 */
export interface TraceSessionState {
  currentStrokeIndex: number;
  completedStrokes: number;
  totalStrokes: number;
  completed: boolean;
  /** Intentos de trazo realizados en esta ronda (incluidos los fallidos). */
  attempts: number;
  strokeAttempts: number[];
  /** Puntuación de cada trazo aceptado. */
  acceptedScores: number[];
  lastResult: TraceValidationResult | null;
}

export interface TraceSubmission {
  state: TraceSessionState;
  result: TraceValidationResult | null;
}

export function createTraceSession(trace: CharacterTrace): TraceSessionState {
  const totalStrokes = trace.strokes.length;
  return {
    currentStrokeIndex: 0,
    completedStrokes: 0,
    totalStrokes,
    completed: totalStrokes === 0,
    attempts: 0,
    strokeAttempts: trace.strokes.map(() => 0),
    acceptedScores: [],
    lastResult: null,
  };
}

export function submitTraceStroke(
  state: TraceSessionState,
  trace: CharacterTrace,
  points: readonly TracePoint[],
  options: StrokeValidationOptions = {},
): TraceSubmission {
  if (state.completed) {
    return { state, result: null };
  }

  const stroke = trace.strokes[state.currentStrokeIndex];
  if (!stroke) {
    return { state, result: null };
  }

  const remainingStrokes = trace.strokes.slice(state.currentStrokeIndex + 1);
  const result = evaluateStroke(points, stroke, trace, {
    ...options,
    remainingStrokes,
  });

  const strokeAttempts = state.strokeAttempts.map((attempts, index) =>
    index === state.currentStrokeIndex ? attempts + 1 : attempts,
  );

  if (!result.accepted) {
    return {
      state: {
        ...state,
        attempts: state.attempts + 1,
        strokeAttempts,
        lastResult: result,
      },
      result,
    };
  }

  const completedStrokes = state.completedStrokes + 1;
  const currentStrokeIndex = state.currentStrokeIndex + 1;

  return {
    state: {
      ...state,
      currentStrokeIndex,
      completedStrokes,
      completed: completedStrokes >= state.totalStrokes,
      attempts: state.attempts + 1,
      strokeAttempts,
      acceptedScores: [...state.acceptedScores, result.score],
      lastResult: result,
    },
    result,
  };
}

export function resetTraceSession(trace: CharacterTrace): TraceSessionState {
  return createTraceSession(trace);
}

/** Precisión media de los trazos aceptados (0–1). */
export function traceSessionAccuracy(state: TraceSessionState): number {
  if (state.acceptedScores.length === 0) {
    return 0;
  }

  const total = state.acceptedScores.reduce((sum, score) => sum + score, 0);
  return Math.round((total / state.acceptedScores.length) * 1000) / 1000;
}
