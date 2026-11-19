import type { TracePoint } from '@/modules/lessons/lesson.types';

/**
 * Geometría de los trazos.
 *
 * Los `TraceStroke` se definen como `<path>` SVG. Para poder evaluar el trazo
 * del dedo sin depender del DOM, el motor muestrea el path en una polilínea
 * densa y trabaja siempre con coordenadas del `viewBox`. La UI convierte los
 * píxeles del puntero a ese mismo sistema, de modo que la validación no cambia
 * al redimensionar la pantalla.
 */

export interface ViewBox {
  minX: number;
  minY: number;
  width: number;
  height: number;
}

export interface ElementRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface Polyline {
  points: TracePoint[];
  /** Longitud acumulada en cada punto, en unidades del viewBox. */
  cumulative: number[];
  length: number;
}

export interface PolylineHit {
  distance: number;
  /** Índice del punto inicial del segmento más cercano. */
  index: number;
  /** Posición dentro del segmento, de 0 a 1. */
  t: number;
  /** Distancia recorrida desde el inicio, de 0 a 1. */
  progress: number;
}

export interface PolylinePoint {
  point: TracePoint;
  /** Ángulo en radianes en el sistema del viewBox (0 = derecha). */
  angle: number;
}

const DEFAULT_VIEW_BOX: ViewBox = { minX: 0, minY: 0, width: 100, height: 140 };

const PATH_TOKEN = /([a-df-z])|(-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?)/gi;

export function parseViewBox(value: string): ViewBox {
  const numbers = value
    .split(/[\s,]+/)
    .map((part) => Number(part))
    .filter((part) => Number.isFinite(part));

  if (numbers.length < 4) {
    return DEFAULT_VIEW_BOX;
  }

  const [minX, minY, width, height] = numbers;
  if (width === undefined || height === undefined || width <= 0 || height <= 0) {
    return DEFAULT_VIEW_BOX;
  }

  return { minX, minY, width, height };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function distance(a: TracePoint, b: TracePoint): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function lerp(a: TracePoint, b: TracePoint, t: number): TracePoint {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

/** Convierte un punto del puntero (píxeles) a coordenadas del viewBox. */
export function toViewBoxPoint(
  clientX: number,
  clientY: number,
  rect: ElementRect,
  viewBox: ViewBox,
): TracePoint {
  const normalizedX = clamp((clientX - rect.left) / Math.max(1, rect.width), 0, 1);
  const normalizedY = clamp((clientY - rect.top) / Math.max(1, rect.height), 0, 1);

  return {
    x: viewBox.minX + normalizedX * viewBox.width,
    y: viewBox.minY + normalizedY * viewBox.height,
  };
}

/**
 * Muestrea un path SVG en una polilínea.
 *
 * Soporta los comandos habituales de las letras (M/L/H/V/C/S/Q/T/Z). Los arcos
 * (`A`) no se usan todavía; si aparecieran, se ignoran en lugar de romper la app.
 * Los trazos educativos deben tener un único subcamino.
 */
export function samplePath(path: string, spacing = 1.5): Polyline {
  const points: TracePoint[] = [];
  let current: TracePoint = { x: 0, y: 0 };
  let subpathStart: TracePoint = { x: 0, y: 0 };
  let command: string | null = null;
  let previousCubicControl: TracePoint | null = null;
  let previousQuadraticControl: TracePoint | null = null;

  const tokens = Array.from(path.matchAll(PATH_TOKEN), (match) => match[0]);
  let index = 0;

  const addPoint = (point: TracePoint) => {
    const last = points.at(-1);
    if (!last || distance(last, point) > 1e-6) {
      points.push(point);
    }
  };

  const addLine = (to: TracePoint) => {
    const from = current;
    const length = distance(from, to);
    const steps = clamp(Math.ceil(length / Math.max(0.5, spacing)), 1, 240);
    for (let step = 1; step <= steps; step += 1) {
      addPoint(lerp(from, to, step / steps));
    }
    current = to;
  };

  const addCubic = (control1: TracePoint, control2: TracePoint, to: TracePoint) => {
    const from = current;
    const controlLength =
      distance(from, control1) + distance(control1, control2) + distance(control2, to);
    const steps = clamp(Math.ceil(controlLength / Math.max(0.5, spacing)), 8, 320);
    for (let step = 1; step <= steps; step += 1) {
      const t = step / steps;
      const oneMinusT = 1 - t;
      const x =
        oneMinusT ** 3 * from.x +
        3 * oneMinusT ** 2 * t * control1.x +
        3 * oneMinusT * t ** 2 * control2.x +
        t ** 3 * to.x;
      const y =
        oneMinusT ** 3 * from.y +
        3 * oneMinusT ** 2 * t * control1.y +
        3 * oneMinusT * t ** 2 * control2.y +
        t ** 3 * to.y;
      addPoint({ x, y });
    }
    current = to;
  };

  const addQuadratic = (control: TracePoint, to: TracePoint) => {
    const from = current;
    const controlLength = distance(from, control) + distance(control, to);
    const steps = clamp(Math.ceil(controlLength / Math.max(0.5, spacing)), 8, 320);
    for (let step = 1; step <= steps; step += 1) {
      const t = step / steps;
      const oneMinusT = 1 - t;
      const x = oneMinusT ** 2 * from.x + 2 * oneMinusT * t * control.x + t ** 2 * to.x;
      const y = oneMinusT ** 2 * from.y + 2 * oneMinusT * t * control.y + t ** 2 * to.y;
      addPoint({ x, y });
    }
    current = to;
  };

  const readNumber = (): number | null => {
    const token = tokens[index];
    index += 1;
    if (token === undefined) {
      return null;
    }
    const value = Number(token);
    return Number.isFinite(value) ? value : null;
  };

  while (index < tokens.length) {
    const token = tokens[index];
    if (!token) {
      break;
    }

    if (/^[a-z]$/i.test(token)) {
      // No se hace `continue`: los comandos sin argumentos (Z) deben
      // ejecutarse en esta misma vuelta.
      command = token;
      index += 1;
    }

    if (!command) {
      index += 1;
      continue;
    }

    const upper = command.toUpperCase();
    const relative = command !== upper;
    const origin = current;

    switch (upper) {
      case 'M': {
        const x = readNumber();
        const y = readNumber();
        if (x === null || y === null) {
          break;
        }
        const point = relative ? { x: origin.x + x, y: origin.y + y } : { x, y };
        current = point;
        subpathStart = point;
        addPoint(point);
        previousCubicControl = null;
        previousQuadraticControl = null;
        // Los pares siguientes a una M se interpretan como L.
        command = relative ? 'l' : 'L';
        break;
      }
      case 'L': {
        const x = readNumber();
        const y = readNumber();
        if (x === null || y === null) {
          break;
        }
        addLine(relative ? { x: origin.x + x, y: origin.y + y } : { x, y });
        previousCubicControl = null;
        previousQuadraticControl = null;
        break;
      }
      case 'H': {
        const x = readNumber();
        if (x === null) {
          break;
        }
        addLine({ x: relative ? origin.x + x : x, y: origin.y });
        previousCubicControl = null;
        previousQuadraticControl = null;
        break;
      }
      case 'V': {
        const y = readNumber();
        if (y === null) {
          break;
        }
        addLine({ x: origin.x, y: relative ? origin.y + y : y });
        previousCubicControl = null;
        previousQuadraticControl = null;
        break;
      }
      case 'C': {
        const x1 = readNumber();
        const y1 = readNumber();
        const x2 = readNumber();
        const y2 = readNumber();
        const x = readNumber();
        const y = readNumber();
        if (x1 === null || y1 === null || x2 === null || y2 === null || x === null || y === null) {
          break;
        }
        const control1 = relative ? { x: origin.x + x1, y: origin.y + y1 } : { x: x1, y: y1 };
        const control2 = relative ? { x: origin.x + x2, y: origin.y + y2 } : { x: x2, y: y2 };
        const to = relative ? { x: origin.x + x, y: origin.y + y } : { x, y };
        addCubic(control1, control2, to);
        previousCubicControl = control2;
        previousQuadraticControl = null;
        break;
      }
      case 'S': {
        const x2 = readNumber();
        const y2 = readNumber();
        const x = readNumber();
        const y = readNumber();
        if (x2 === null || y2 === null || x === null || y === null) {
          break;
        }
        const control1 = previousCubicControl
          ? { x: 2 * origin.x - previousCubicControl.x, y: 2 * origin.y - previousCubicControl.y }
          : origin;
        const control2 = relative ? { x: origin.x + x2, y: origin.y + y2 } : { x: x2, y: y2 };
        const to = relative ? { x: origin.x + x, y: origin.y + y } : { x, y };
        addCubic(control1, control2, to);
        previousCubicControl = control2;
        previousQuadraticControl = null;
        break;
      }
      case 'Q': {
        const x1 = readNumber();
        const y1 = readNumber();
        const x = readNumber();
        const y = readNumber();
        if (x1 === null || y1 === null || x === null || y === null) {
          break;
        }
        const control = relative ? { x: origin.x + x1, y: origin.y + y1 } : { x: x1, y: y1 };
        const to = relative ? { x: origin.x + x, y: origin.y + y } : { x, y };
        addQuadratic(control, to);
        previousQuadraticControl = control;
        previousCubicControl = null;
        break;
      }
      case 'T': {
        const x = readNumber();
        const y = readNumber();
        if (x === null || y === null) {
          break;
        }
        const control: TracePoint = previousQuadraticControl
          ? {
              x: 2 * origin.x - previousQuadraticControl.x,
              y: 2 * origin.y - previousQuadraticControl.y,
            }
          : origin;
        const to = relative ? { x: origin.x + x, y: origin.y + y } : { x, y };
        addQuadratic(control, to);
        previousQuadraticControl = control;
        previousCubicControl = null;
        break;
      }
      case 'Z': {
        if (distance(current, subpathStart) > 1e-6) {
          addLine(subpathStart);
        }
        current = subpathStart;
        previousCubicControl = null;
        previousQuadraticControl = null;
        command = null;
        break;
      }
      default:
        index += 1;
        break;
    }
  }

  return buildPolyline(points);
}

/** Construye una polilínea con longitudes acumuladas a partir de puntos. */
export function polylineFromPoints(points: readonly TracePoint[]): Polyline {
  return buildPolyline([...points]);
}

function buildPolyline(points: TracePoint[]): Polyline {
  const cumulative: number[] = [];
  let total = 0;

  points.forEach((point, index) => {
    if (index > 0) {
      const previous = points[index - 1];
      if (previous) {
        total += distance(previous, point);
      }
    }
    cumulative.push(total);
  });

  return { points, cumulative, length: total };
}

/** Distancia de un punto a un segmento, con su posición relativa. */
function distanceToSegment(
  point: TracePoint,
  from: TracePoint,
  to: TracePoint,
): { distance: number; t: number } {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    return { distance: distance(point, from), t: 0 };
  }

  const rawT = ((point.x - from.x) * dx + (point.y - from.y) * dy) / lengthSquared;
  const t = clamp(rawT, 0, 1);
  const projection = { x: from.x + dx * t, y: from.y + dy * t };
  return { distance: distance(point, projection), t };
}

/** Punto, segmento y progreso más cercanos de la polilínea. */
export function nearestPointOnPolyline(point: TracePoint, polyline: Polyline): PolylineHit {
  const { points, cumulative, length } = polyline;

  if (points.length === 0) {
    return { distance: Number.POSITIVE_INFINITY, index: 0, t: 0, progress: 0 };
  }

  if (points.length === 1) {
    const only = points[0];
    if (!only) {
      return { distance: Number.POSITIVE_INFINITY, index: 0, t: 0, progress: 0 };
    }
    return { distance: distance(point, only), index: 0, t: 0, progress: 0 };
  }

  let bestDistance = Number.POSITIVE_INFINITY;
  let bestIndex = 0;
  let bestT = 0;

  for (let index = 0; index < points.length - 1; index += 1) {
    const from = points[index];
    const to = points[index + 1];
    if (!from || !to) {
      continue;
    }

    const hit = distanceToSegment(point, from, to);
    if (hit.distance < bestDistance) {
      bestDistance = hit.distance;
      bestIndex = index;
      bestT = hit.t;
    }
  }

  const segmentStart = cumulative[bestIndex] ?? 0;
  const segmentEnd = cumulative[bestIndex + 1] ?? segmentStart;
  const travelled = segmentStart + (segmentEnd - segmentStart) * bestT;

  return {
    distance: bestDistance,
    index: bestIndex,
    t: bestT,
    progress: length > 0 ? clamp(travelled / length, 0, 1) : 0,
  };
}

/** Distancia mínima de un punto a la polilínea completa. */
export function distanceToPolyline(point: TracePoint, polyline: Polyline): number {
  return nearestPointOnPolyline(point, polyline).distance;
}

/** Punto y ángulo (tangente) a una proporción del recorrido. */
export function pointAtRatio(polyline: Polyline, ratio: number): PolylinePoint {
  const { points, cumulative, length } = polyline;
  const first = points[0] ?? { x: 0, y: 0 };
  const last = points.at(-1) ?? first;

  if (points.length < 2 || length <= 0) {
    return { point: first, angle: 0 };
  }

  const target = clamp(ratio, 0, 1) * length;
  let index = 0;
  while (index < cumulative.length - 2 && (cumulative[index + 1] ?? 0) < target) {
    index += 1;
  }

  const from = points[index] ?? first;
  const to = points[index + 1] ?? last;
  const start = cumulative[index] ?? 0;
  const end = cumulative[index + 1] ?? start;
  const t = end > start ? clamp((target - start) / (end - start), 0, 1) : 0;

  return {
    point: lerp(from, to, t),
    angle: Math.atan2(to.y - from.y, to.x - from.x),
  };
}
