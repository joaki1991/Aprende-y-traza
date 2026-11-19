import type { CharacterTrace, TracePoint, TraceStroke } from '@/modules/lessons/lesson.types';
import {
  distanceToPolyline,
  nearestPointOnPolyline,
  parseViewBox,
  polylineFromPoints,
  samplePath,
} from './traceGeometry';

/**
 * Motor de validación de trazos.
 *
 * No basta con pasar cerca de la letra: cada trazo se evalúa por
 * 1. punto de inicio,
 * 2. cobertura del recorrido,
 * 3. desviación respecto a la trayectoria,
 * 4. dirección de avance y progreso,
 * 5. punto final.
 *
 * El algoritmo es geometría pura (sin DOM ni React), por lo que se puede
 * probar de forma aislada y reutilizar en mayúsculas, minúsculas y números.
 * Las tolerancias se expresan como fracción del lado menor del `viewBox`, así
 * que no dependen del tamaño real de la pantalla.
 */

export type TraceIssue =
  | 'too-short'
  | 'start-too-far'
  | 'finish-too-far'
  | 'off-path'
  | 'incomplete'
  | 'backwards'
  | 'scribble'
  | 'wrong-order';

export interface ValidationThresholds {
  /** Proporción mínima del recorrido que debe quedar cerca del dedo. */
  minCoverage: number;
  /** Proporción mínima de puntos dibujados dentro de la tolerancia. */
  minAccuracy: number;
  /** Proporción mínima de avance en el sentido correcto. */
  minDirection: number;
  /** Progreso mínimo alcanzado al final del trazo. */
  minProgress: number;
  /** Longitud máxima dibujada respecto a la longitud del trazo. */
  maxLengthRatio: number;
  /** Multiplicador de tolerancia para aceptar el punto de inicio. */
  startToleranceFactor: number;
  /** Multiplicador de tolerancia para aceptar el punto final. */
  endToleranceFactor: number;
  /** Puntos mínimos para considerar que hubo un trazo. */
  minPoints: number;
}

export const DEFAULT_TOLERANCE_RATIO = 0.11;

export const DEFAULT_THRESHOLDS: ValidationThresholds = {
  minCoverage: 0.86,
  minAccuracy: 0.72,
  minDirection: 0.7,
  minProgress: 0.82,
  maxLengthRatio: 3.4,
  startToleranceFactor: 1.5,
  endToleranceFactor: 1.8,
  minPoints: 4,
};

export interface StrokeValidationOptions {
  /** Tolerancia global; cada trazo puede sobrescribirla. */
  toleranceRatio?: number;
  thresholds?: Partial<ValidationThresholds>;
  /** Trazos que aún no toca; permite detectar que se ha dibujado otro. */
  remainingStrokes?: readonly TraceStroke[];
}

export interface TraceValidationMetrics {
  coverage: number;
  accuracy: number;
  direction: number;
  startDistance: number;
  endDistance: number;
  startProgress: number;
  endProgress: number;
  lengthRatio: number;
}

export interface TraceValidationResult {
  accepted: boolean;
  issues: TraceIssue[];
  targetStrokeId: string;
  /** Puntuación global de 0 a 1, útil para guardar la mejor precisión. */
  score: number;
  metrics: TraceValidationMetrics;
  drawnPoints: number;
  /** Número de orden del trazo que se dibujó por error, si se detectó. */
  orderHint: number | null;
}

interface StrokeEvaluation {
  accepted: boolean;
  issues: TraceIssue[];
  score: number;
  metrics: TraceValidationMetrics;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function resolveTolerance(stroke: TraceStroke, options: StrokeValidationOptions, viewBoxSize: number) {
  const ratio = stroke.tolerance ?? options.toleranceRatio ?? DEFAULT_TOLERANCE_RATIO;
  return Math.max(1, ratio * viewBoxSize);
}

function evaluateAgainst(
  drawnPoints: readonly TracePoint[],
  stroke: TraceStroke,
  trace: CharacterTrace,
  options: StrokeValidationOptions,
  thresholds: ValidationThresholds,
): StrokeEvaluation {
  const issues: TraceIssue[] = [];
  const viewBox = parseViewBox(trace.viewBox);
  const tolerance = resolveTolerance(stroke, options, Math.min(viewBox.width, viewBox.height));
  const target = samplePath(stroke.path);
  const drawn = polylineFromPoints(drawnPoints);
  const first = drawnPoints[0];
  const last = drawnPoints.at(-1);
  const targetStart = target.points[0] ?? stroke.start;
  const targetEnd = target.points.at(-1) ?? stroke.end;

  if (!first || !last || drawnPoints.length < thresholds.minPoints || drawn.length < tolerance * 0.8) {
    const metrics: TraceValidationMetrics = {
      coverage: 0,
      accuracy: 0,
      direction: 0,
      startDistance: Number.POSITIVE_INFINITY,
      endDistance: Number.POSITIVE_INFINITY,
      startProgress: 0,
      endProgress: 0,
      lengthRatio: target.length > 0 ? drawn.length / target.length : 0,
    };
    return {
      accepted: false,
      issues: ['too-short'],
      score: 0,
      metrics,
    };
  }

  const startDistance = Math.hypot(first.x - targetStart.x, first.y - targetStart.y);
  const endDistance = Math.hypot(last.x - targetEnd.x, last.y - targetEnd.y);

  // Cobertura: qué parte de la polilínea oficial ha pasado cerca del dedo.
  let covered = 0;
  for (const point of target.points) {
    if (distanceToPolyline(point, drawn) <= tolerance) {
      covered += 1;
    }
  }
  const coverage = target.points.length > 0 ? covered / target.points.length : 0;

  // Precisión: qué parte del trazo del usuario se mantiene dentro del pasillo.
  let onPath = 0;
  for (const point of drawnPoints) {
    if (distanceToPolyline(point, target) <= tolerance) {
      onPath += 1;
    }
  }
  const accuracy = onPath / drawnPoints.length;

  // Dirección: el progreso sobre el recorrido debe avanzar, no retroceder.
  let forward = 0;
  let backward = 0;
  let previousProgress: number | null = null;
  let startProgress = 1;
  let endProgress = 0;

  for (const point of drawnPoints) {
    const hit = nearestPointOnPolyline(point, target);
    const progress = hit.progress;
    startProgress = Math.min(startProgress, progress);
    endProgress = Math.max(endProgress, progress);

    if (previousProgress !== null) {
      const delta = progress - previousProgress;
      if (delta > 0.01) {
        forward += 1;
      } else if (delta < -0.01) {
        backward += 1;
      }
    }
    previousProgress = progress;
  }

  const direction = forward + backward > 0 ? forward / (forward + backward) : 0;
  const lengthRatio = target.length > 0 ? drawn.length / target.length : 0;

  if (startDistance > tolerance * thresholds.startToleranceFactor) {
    issues.push('start-too-far');
  }
  if (endDistance > tolerance * thresholds.endToleranceFactor) {
    issues.push('finish-too-far');
  }
  if (coverage < thresholds.minCoverage) {
    issues.push('incomplete');
  }
  if (accuracy < thresholds.minAccuracy) {
    issues.push('off-path');
  }
  if (direction < thresholds.minDirection) {
    issues.push('backwards');
  }
  if (endProgress < thresholds.minProgress && !issues.includes('finish-too-far')) {
    issues.push('incomplete');
  }
  if (lengthRatio > thresholds.maxLengthRatio) {
    issues.push('scribble');
  }

  const score =
    0.45 * coverage + 0.35 * accuracy + 0.2 * direction;

  return {
    accepted: issues.length === 0,
    issues,
    score: round(clamp(score, 0, 1)),
    metrics: {
      coverage: round(coverage),
      accuracy: round(accuracy),
      direction: round(direction),
      startDistance: round(startDistance),
      endDistance: round(endDistance),
      startProgress: round(startProgress),
      endProgress: round(endProgress),
      lengthRatio: round(lengthRatio),
    },
  };
}

export function evaluateStroke(
  drawnPoints: readonly TracePoint[],
  stroke: TraceStroke,
  trace: CharacterTrace,
  options: StrokeValidationOptions = {},
): TraceValidationResult {
  const thresholds = { ...DEFAULT_THRESHOLDS, ...options.thresholds };
  const evaluation = evaluateAgainst(drawnPoints, stroke, trace, options, thresholds);

  let issues = evaluation.issues;
  let orderHint: number | null = null;

  if (!evaluation.accepted && options.remainingStrokes && options.remainingStrokes.length > 0) {
    for (const candidate of options.remainingStrokes) {
      if (candidate.id === stroke.id) {
        continue;
      }

      const candidateEvaluation = evaluateAgainst(
        drawnPoints,
        candidate,
        trace,
        options,
        thresholds,
      );

      if (candidateEvaluation.accepted) {
        orderHint = candidate.order;
        issues = [...issues.filter((issue) => issue !== 'wrong-order'), 'wrong-order'];
        break;
      }
    }
  }

  return {
    accepted: evaluation.accepted,
    issues,
    targetStrokeId: stroke.id,
    score: evaluation.score,
    metrics: evaluation.metrics,
    drawnPoints: drawnPoints.length,
    orderHint,
  };
}
