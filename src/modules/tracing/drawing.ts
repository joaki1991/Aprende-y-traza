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
  { id: 'rojo', name: 'rojo', value: '#e8453c' },
  { id: 'rosa', name: 'rosa', value: '#ff6fa5' },
  { id: 'rosa-claro', name: 'rosa claro', value: '#ffb3c8' },
  { id: 'naranja', name: 'naranja', value: '#ff8a3d' },
  { id: 'amarillo', name: 'amarillo', value: '#ffd23f' },
  { id: 'verde-claro', name: 'verde claro', value: '#7ed957' },
  { id: 'verde-oscuro', name: 'verde oscuro', value: '#2f9e44' },
  { id: 'azul-claro', name: 'azul claro', value: '#6fc3ff' },
  { id: 'azul-oscuro', name: 'azul oscuro', value: '#2f6fd0' },
  { id: 'turquesa', name: 'turquesa', value: '#2ec4b6' },
  { id: 'morado', name: 'morado', value: '#8e5bd6' },
  { id: 'lila', name: 'lila', value: '#c9a7f5' },
  { id: 'marron', name: 'marrón', value: '#8b5a2b' },
  { id: 'beige', name: 'beige', value: '#e8d3b0' },
  { id: 'gris', name: 'gris', value: '#9aa0a6' },
  { id: 'negro', name: 'negro', value: '#2b2b2b' },
  { id: 'blanco', name: 'blanco', value: '#ffffff' },
] as const;

export type DoodleColorOption = (typeof DOODLE_COLORS)[number];

export const DEFAULT_DOODLE_COLOR: string = DOODLE_COLORS[0].value;

/** Grosores pensados para dedos pequeños, en píxeles del tablero. */
export const DOODLE_BRUSH_SIZES = [
  { id: 'fino', name: 'fino', value: 8 },
  { id: 'medio', name: 'medio', value: 14 },
  { id: 'grueso', name: 'grueso', value: 22 },
] as const;

export type DoodleBrushOption = (typeof DOODLE_BRUSH_SIZES)[number];

export const DEFAULT_DOODLE_BRUSH: number = DOODLE_BRUSH_SIZES[1].value;

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
