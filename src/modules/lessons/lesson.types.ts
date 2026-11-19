/**
 * Modelo de contenidos educativos.
 *
 * Los paquetes de lecciones son datos puros: no conocen React ni el motor de
 * dibujo. Así se pueden añadir nuevos alfabetos (por ejemplo, cursiva o
 * pictogramas) sin tocar la interfaz.
 */

export type LessonScriptId = 'latin-uppercase' | 'latin-lowercase' | 'digits';

export type PackAccent = 'sky' | 'mint' | 'butter';

export interface LessonCharacter {
  /** Identificador estable; se usa también como clave de progreso. */
  id: string;
  /** Carácter que se muestra y se trazará. */
  glyph: string;
  /** Nombre accesible del carácter (por ejemplo, «A mayúscula»). */
  spokenName: string;
  /** Palabra de ejemplo para asociar sonido y letra. */
  exampleWord: string;
  /** Posición dentro del paquete, empezando en 1. */
  order: number;
}

export interface LessonPack {
  id: string;
  scriptId: LessonScriptId;
  title: string;
  badge: string;
  description: string;
  accent: PackAccent;
  characters: readonly LessonCharacter[];
}

export interface TracePoint {
  x: number;
  y: number;
}

export type StrokeDirection =
  | 'down'
  | 'up'
  | 'left'
  | 'right'
  | 'clockwise'
  | 'counter-clockwise'
  | 'curve';

/**
 * Recorrido SVG de un trazo.
 * Las coordenadas se expresan en el sistema del `viewBox` del carácter.
 * El motor de trazado consume este modelo sin conocer React ni Canvas.
 */
export interface TraceStroke {
  id: string;
  order: number;
  /** Atributo `d` de un <path> SVG. Admite M/L/H/V/C/S/Q/T/Z. */
  path: string;
  /** Pista corta para el adulto o el audio futuro. */
  label: string;
  /** Instrucción sencilla para la niña, mostrada junto a Mochi. */
  instruction: string;
  start: TracePoint;
  end: TracePoint;
  direction: StrokeDirection;
  /**
   * Radio de tolerancia como fracción del lado menor del `viewBox`.
   * Si se omite, el motor usa `DEFAULT_TOLERANCE_RATIO`.
   */
  tolerance?: number;
}

export interface CharacterTrace {
  characterId: string;
  /** Por convención: `0 0 100 140`. */
  viewBox: string;
  strokes: readonly TraceStroke[];
}
