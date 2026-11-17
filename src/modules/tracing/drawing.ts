/**
 * Utilidades puras del lienzo.
 *
 * Los puntos se guardan normalizados (0–1) para que un cambio de tamaño del
 * Canvas no deforme el dibujo. La conversión a píxeles ocurre al pintar.
 */

export interface DoodlePoint {
  x: number;
  y: number;
}

export interface DoodleStroke {
  color: string;
  /** Grosor relativo al ancho del lienzo, para escalar al redimensionar. */
  widthRatio: number;
  points: DoodlePoint[];
}

export interface CanvasSize {
  width: number;
  height: number;
}

export interface CanvasRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export const DOODLE_COLORS = [
  { id: 'fresa', name: 'rosa fresa', value: '#ff8fae' },
  { id: 'menta', name: 'verde menta', value: '#4fcfA6' },
  { id: 'cielo', name: 'azul cielo', value: '#58b6ea' },
  { id: 'uva', name: 'lila uva', value: '#a98ae6' },
  { id: 'sol', name: 'amarillo sol', value: '#f3c04d' },
] as const;

export type DoodleColorOption = (typeof DOODLE_COLORS)[number];

export const DEFAULT_DOODLE_COLOR: string = DOODLE_COLORS[0].value;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function toDoodlePoint(clientX: number, clientY: number, rect: CanvasRect): DoodlePoint {
  return {
    x: clamp((clientX - rect.left) / Math.max(1, rect.width), 0, 1),
    y: clamp((clientY - rect.top) / Math.max(1, rect.height), 0, 1),
  };
}

/**
 * Añade un punto si está suficientemente lejos del anterior.
 * Devuelve true cuando el trazo ha cambiado.
 */
export function appendDoodlePoint(
  stroke: DoodleStroke,
  point: DoodlePoint,
  size: CanvasSize,
  minDistancePx = 1.4,
): boolean {
  const last = stroke.points.at(-1);
  if (!last) {
    stroke.points.push(point);
    return true;
  }

  const dx = (point.x - last.x) * size.width;
  const dy = (point.y - last.y) * size.height;
  if (Math.hypot(dx, dy) < minDistancePx) {
    return false;
  }

  stroke.points.push(point);
  return true;
}

export function doodleStrokeWidth(stroke: DoodleStroke, size: CanvasSize): number {
  return Math.max(3, stroke.widthRatio * size.width);
}

export function drawDoodleDot(
  context: CanvasRenderingContext2D,
  point: DoodlePoint,
  size: CanvasSize,
  color: string,
  width: number,
): void {
  context.fillStyle = color;
  context.beginPath();
  context.arc(point.x * size.width, point.y * size.height, width / 2, 0, Math.PI * 2);
  context.fill();
}

export function drawDoodleStroke(
  context: CanvasRenderingContext2D,
  stroke: DoodleStroke,
  size: CanvasSize,
): void {
  const width = doodleStrokeWidth(stroke, size);
  const first = stroke.points[0];
  if (!first) {
    return;
  }

  if (stroke.points.length === 1) {
    drawDoodleDot(context, first, size, stroke.color, width);
    return;
  }

  context.strokeStyle = stroke.color;
  context.lineWidth = width;
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.beginPath();
  context.moveTo(first.x * size.width, first.y * size.height);

  for (const point of stroke.points.slice(1)) {
    context.lineTo(point.x * size.width, point.y * size.height);
  }

  context.stroke();
}

/** Pinta un segmento nuevo sin repintar todo el lienzo (respuesta inmediata al dedo). */
export function drawDoodleSegment(
  context: CanvasRenderingContext2D,
  stroke: DoodleStroke,
  from: DoodlePoint,
  to: DoodlePoint,
  size: CanvasSize,
): void {
  const width = doodleStrokeWidth(stroke, size);
  context.strokeStyle = stroke.color;
  context.lineWidth = width;
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.beginPath();
  context.moveTo(from.x * size.width, from.y * size.height);
  context.lineTo(to.x * size.width, to.y * size.height);
  context.stroke();
}

/** Repinta toda la escena (usado al redimensionar, deshacer o borrar). */
export function drawDoodleScene(
  context: CanvasRenderingContext2D,
  strokes: readonly DoodleStroke[],
  size: CanvasSize,
): void {
  context.clearRect(0, 0, size.width, size.height);
  for (const stroke of strokes) {
    drawDoodleStroke(context, stroke, size);
  }
}
