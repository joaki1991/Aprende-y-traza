/**
 * Constructores de formas SVG para las láminas de colorear.
 *
 * Cada forma devuelve un atributo `d` cerrado (con `Z`) para que pueda
 * rellenarse y detectarse con el dedo como una región independiente.
 * Las coordenadas viven en un `viewBox` de 400 × 400.
 */

export const DRAWING_VIEW_BOX = '0 0 400 400';

/** Trazo oscuro común a todas las láminas. */
export const DRAWING_OUTLINE = '#4a3a48';

export interface DrawingRegion {
  /** Identificador estable dentro de la lámina (`wing`, `body`…). */
  id: string;
  /** Path cerrado y rellenable. */
  d: string;
}

export interface DrawingDetail {
  d: string;
  fill?: string;
  stroke?: string;
  width?: number;
  opacity?: number;
}

export interface DrawingTemplate {
  /** `letter-a`, `letter-enye`, `number-0`… */
  id: string;
  kind: 'letter' | 'number';
  glyph: string;
  name: string;
  /** Regiones cerradas que la niña puede pintar por separado. */
  regions: readonly DrawingRegion[];
  /** Ojos, caritas y adornos; nunca se rellenan con el cubo. */
  details?: readonly DrawingDetail[];
}

export function ellipsePath(cx: number, cy: number, rx: number, ry: number): string {
  return (
    `M${cx - rx} ${cy} ` +
    `A${rx} ${ry} 0 1 0 ${cx + rx} ${cy} ` +
    `A${rx} ${ry} 0 1 0 ${cx - rx} ${cy} Z`
  );
}

export function circlePath(cx: number, cy: number, r: number): string {
  return ellipsePath(cx, cy, r, r);
}

/** Anillo con hueco real: el círculo interior se dibuja en sentido contrario. */
export function ringPath(cx: number, cy: number, outer: number, inner: number): string {
  return (
    `M${cx - outer} ${cy} ` +
    `A${outer} ${outer} 0 1 0 ${cx + outer} ${cy} ` +
    `A${outer} ${outer} 0 1 0 ${cx - outer} ${cy} Z ` +
    `M${cx - inner} ${cy} ` +
    `A${inner} ${inner} 0 1 1 ${cx + inner} ${cy} ` +
    `A${inner} ${inner} 0 1 1 ${cx - inner} ${cy} Z`
  );
}

export function roundRectPath(
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): string {
  const r = Math.min(radius, width / 2, height / 2);
  return (
    `M${x + r} ${y} H${x + width - r} ` +
    `A${r} ${r} 0 0 1 ${x + width} ${y + r} ` +
    `V${y + height - r} ` +
    `A${r} ${r} 0 0 1 ${x + width - r} ${y + height} ` +
    `H${x + r} ` +
    `A${r} ${r} 0 0 1 ${x} ${y + height - r} ` +
    `V${y + r} ` +
    `A${r} ${r} 0 0 1 ${x + r} ${y} Z`
  );
}

export function polygonPath(points: ReadonlyArray<readonly [number, number]>): string {
  const [first, ...rest] = points;
  if (!first) {
    return '';
  }
  return `M${first[0]} ${first[1]} ${rest.map(([x, y]) => `L${x} ${y}`).join(' ')} Z`;
}

export function starPath(
  cx: number,
  cy: number,
  outer: number,
  inner: number,
  points = 5,
): string {
  const coordinates: string[] = [];
  for (let index = 0; index < points * 2; index += 1) {
    const radius = index % 2 === 0 ? outer : inner;
    const angle = (Math.PI / points) * index - Math.PI / 2;
    coordinates.push(
      `${(cx + Math.cos(angle) * radius).toFixed(2)} ${(
        cy +
        Math.sin(angle) * radius
      ).toFixed(2)}`,
    );
  }
  return `M${coordinates.join(' L')} Z`;
}

export function heartPath(cx: number, cy: number, size: number): string {
  return (
    `M${cx} ${cy + size * 0.85} ` +
    `C${cx - size * 1.15} ${cy - size * 0.05} ${cx - size * 0.6} ${cy - size * 1.05} ${cx} ${cy - size * 0.3} ` +
    `C${cx + size * 0.6} ${cy - size * 1.05} ${cx + size * 1.15} ${cy - size * 0.05} ${cx} ${cy + size * 0.85} Z`
  );
}

/** Gota de agua, lágrima o chorro. */
export function dropPath(cx: number, cy: number, radius: number): string {
  return (
    `M${cx} ${cy - radius * 1.5} ` +
    `C${cx + radius * 0.95} ${cy - radius * 0.15} ${cx + radius * 0.95} ${cy + radius * 0.85} ${cx} ${cy + radius * 0.95} ` +
    `C${cx - radius * 0.95} ${cy + radius * 0.85} ${cx - radius * 0.95} ${cy - radius * 0.15} ${cx} ${cy - radius * 1.5} Z`
  );
}

/**
 * Flor de cinco pétalos: cinco círculos solapados en un único path.
 * Con relleno `nonzero` los solapes quedan macizos.
 */
export function flowerHeadPath(cx: number, cy: number, radius: number): string {
  let path = '';
  const petalRadius = radius * 0.58;
  const distance = radius * 0.56;
  for (let index = 0; index < 5; index += 1) {
    const angle = (Math.PI * 2 * index) / 5 - Math.PI / 2;
    const px = cx + Math.cos(angle) * distance;
    const py = cy + Math.sin(angle) * distance;
    path += `${circlePath(px, py, petalRadius)} `;
  }
  return path.trim();
}

/** Rayos triangulares de un sol, todos en una sola región. */
export function sunRaysPath(
  cx: number,
  cy: number,
  inner: number,
  outer: number,
  count = 12,
): string {
  const rays: string[] = [];
  for (let index = 0; index < count; index += 1) {
    const angle = (Math.PI * 2 * index) / count;
    const halfWidth = Math.PI / count / 1.8;
    const tipX = cx + Math.cos(angle) * outer;
    const tipY = cy + Math.sin(angle) * outer;
    const leftX = cx + Math.cos(angle - halfWidth) * inner;
    const leftY = cy + Math.sin(angle - halfWidth) * inner;
    const rightX = cx + Math.cos(angle + halfWidth) * inner;
    const rightY = cy + Math.sin(angle + halfWidth) * inner;
    rays.push(
      `M${leftX.toFixed(2)} ${leftY.toFixed(2)} L${tipX.toFixed(2)} ${tipY.toFixed(
        2,
      )} L${rightX.toFixed(2)} ${rightY.toFixed(2)} Z`,
    );
  }
  return rays.join(' ');
}

/** Alas de mariposa para las láminas de números. */
export function butterflyWingsPath(cx: number, cy: number, size: number): string {
  return [
    ellipsePath(cx - size * 0.55, cy - size * 0.35, size * 0.62, size * 0.45),
    ellipsePath(cx + size * 0.55, cy - size * 0.35, size * 0.62, size * 0.45),
    ellipsePath(cx - size * 0.5, cy + size * 0.42, size * 0.5, size * 0.38),
    ellipsePath(cx + size * 0.5, cy + size * 0.42, size * 0.5, size * 0.38),
  ].join(' ');
}

/** Envoltorio de caramelo: dos triángulos a los lados. */
export function candyWrapperPath(cx: number, cy: number, size: number): string {
  return [
    polygonPath([
      [cx - size * 0.55, cy - size * 0.42],
      [cx - size * 1.05, cy - size * 0.62],
      [cx - size * 1.05, cy + size * 0.62],
      [cx - size * 0.55, cy + size * 0.42],
    ]),
    polygonPath([
      [cx + size * 0.55, cy - size * 0.42],
      [cx + size * 1.05, cy - size * 0.62],
      [cx + size * 1.05, cy + size * 0.62],
      [cx + size * 0.55, cy + size * 0.42],
    ]),
  ].join(' ');
}

/* Adornos reutilizables: no son regiones coloreables. */

export function eyeDetail(cx: number, cy: number, radius = 8): DrawingDetail {
  return { d: circlePath(cx, cy, radius), fill: DRAWING_OUTLINE };
}

export function eyeSparkle(cx: number, cy: number, radius = 3): DrawingDetail {
  return { d: circlePath(cx, cy, radius), fill: '#ffffff' };
}

export function smileDetail(cx: number, cy: number, width = 34): DrawingDetail {
  return {
    d: `M${cx - width / 2} ${cy} Q${cx} ${cy + 16} ${cx + width / 2} ${cy}`,
    stroke: DRAWING_OUTLINE,
    width: 7,
  };
}

export function blushDetail(cx: number, cy: number, rx = 16, ry = 9): DrawingDetail {
  return { d: ellipsePath(cx, cy, rx, ry), fill: '#ffb3c8', opacity: 0.75 };
}

export function faceDetails(cx: number, cy: number, gap = 32): DrawingDetail[] {
  return [
    eyeDetail(cx - gap / 2, cy),
    eyeDetail(cx + gap / 2, cy),
    eyeSparkle(cx - gap / 2 + 2, cy - 2, 2.4),
    eyeSparkle(cx + gap / 2 + 2, cy - 2, 2.4),
    smileDetail(cx, cy + 16, 26),
    blushDetail(cx - gap - 8, cy + 12, 12, 7),
    blushDetail(cx + gap + 8, cy + 12, 12, 7),
  ];
}
