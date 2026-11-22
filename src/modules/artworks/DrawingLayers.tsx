import type { CSSProperties } from 'react';
import type { ArtworkStroke } from './artwork.types';
import {
  DRAWING_OUTLINE,
  DRAWING_VIEW_BOX,
  type DrawingTemplate,
} from './drawings';
import styles from './DrawingLayers.module.css';

interface FillLayerProps {
  template: DrawingTemplate;
  fills: Record<string, string>;
  /** Silueta para la galería cuando el dibujo aún está bloqueado. */
  silhouette?: boolean;
  interactive?: boolean;
  onRegionTap?: (regionId: string) => void;
}

/**
 * Capa de color: una forma por región, sin contorno.
 *
 * En modo interactivo cada región recibe su propio toque, así que rellenar un
 * ala nunca cambia el color de la región vecina.
 */
export function DrawingFillLayer({
  template,
  fills,
  silhouette = false,
  interactive = false,
  onRegionTap,
}: FillLayerProps) {
  return (
    <g aria-hidden="true" data-layer="fills">
      {template.regions.map((region) => (
        <path
          key={region.id}
          d={region.d}
          data-region-id={region.id}
          fill={silhouette ? '#e5d9ff' : (fills[region.id] ?? 'transparent')}
          className={interactive ? styles.region : undefined}
          pointerEvents={interactive ? 'auto' : 'none'}
          onPointerDown={
            interactive && onRegionTap
              ? (event) => {
                  event.preventDefault();
                  onRegionTap(region.id);
                }
              : undefined
          }
        />
      ))}
    </g>
  );
}

/** Trazos libres guardados, dibujados con coordenadas del `viewBox`. */
export function DrawingStrokeLayer({ strokes }: { strokes: readonly ArtworkStroke[] }) {
  return (
    <g aria-hidden="true" data-layer="strokes">
      {strokes.map((stroke, index) => {
        const width = Math.max(2, stroke.widthRatio * 400);
        const points = stroke.points
          .map((point) => `${(point.x * 400).toFixed(1)},${(point.y * 400).toFixed(1)}`)
          .join(' ');
        const first = stroke.points[0];

        if (stroke.points.length < 2) {
          return first ? (
            <circle
              key={`stroke-${index}`}
              cx={first.x * 400}
              cy={first.y * 400}
              r={width / 2}
              fill={stroke.color}
            />
          ) : null;
        }

        return (
          <polyline
            key={`stroke-${index}`}
            points={points}
            fill="none"
            stroke={stroke.color}
            strokeWidth={width}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      })}
    </g>
  );
}

interface OutlineLayerProps {
  template: DrawingTemplate;
}

/** Capa de contornos y caritas; siempre por encima del color y del pincel. */
export function DrawingOutlineLayer({ template }: OutlineLayerProps) {
  return (
    <g aria-hidden="true" data-layer="outlines" pointerEvents="none">
      {template.regions.map((region) => (
        <path
          key={region.id}
          d={region.d}
          fill="none"
          stroke={DRAWING_OUTLINE}
          strokeWidth={9}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ))}
      {(template.details ?? []).map((detail, index) => (
        <path
          key={`detail-${index}`}
          d={detail.d}
          fill={detail.fill ?? 'none'}
          fillRule="nonzero"
          stroke={detail.stroke ?? DRAWING_OUTLINE}
          strokeWidth={detail.width ?? 7}
          strokeLinejoin="round"
          strokeLinecap="round"
          opacity={detail.opacity}
        />
      ))}
    </g>
  );
}

interface DrawingArtworkProps {
  template: DrawingTemplate;
  fills?: Record<string, string>;
  strokes?: readonly ArtworkStroke[];
  silhouette?: boolean;
  className?: string;
  style?: CSSProperties;
  ariaLabel?: string;
}

/** Miniatura completa de una lámina, con sus colores y trazos guardados. */
export function DrawingArtwork({
  template,
  fills = {},
  strokes = [],
  silhouette = false,
  className,
  style,
  ariaLabel,
}: DrawingArtworkProps) {
  return (
    <svg
      viewBox={DRAWING_VIEW_BOX}
      className={className}
      style={style}
      role="img"
      aria-label={ariaLabel ?? `${template.name}, dibujo para colorear`}
    >
      <DrawingFillLayer template={template} fills={fills} silhouette={silhouette} />
      {silhouette ? null : (
        <>
          <DrawingStrokeLayer strokes={strokes} />
          <DrawingOutlineLayer template={template} />
        </>
      )}
    </svg>
  );
}
