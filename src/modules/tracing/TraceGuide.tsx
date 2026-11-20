import { useMemo } from 'react';
import type { CharacterTrace } from '@/modules/lessons/lesson.types';
import { parseViewBox, pointAtRatio, samplePath } from './traceGeometry';
import styles from './TraceGuide.module.css';

interface TraceGuideProps {
  trace: CharacterTrace;
  currentStrokeIndex: number;
  /** Cambia al repetir o al pedir una pista para relanzar animaciones. */
  pulseKey?: number;
}

type StrokeState = 'completed' | 'current' | 'pending';

export function TraceGuide({ trace, currentStrokeIndex, pulseKey = 0 }: TraceGuideProps) {
  const viewBox = useMemo(() => parseViewBox(trace.viewBox), [trace.viewBox]);
  const samples = useMemo(
    () => trace.strokes.map((stroke) => samplePath(stroke.path, 1.2)),
    [trace.strokes],
  );

  const currentStroke = trace.strokes[currentStrokeIndex];
  const currentSample = samples[currentStrokeIndex];
  const arrow =
    currentStroke && currentSample && currentSample.length > 0
      ? pointAtRatio(currentSample, 0.24)
      : null;
  const arrowAngle = arrow ? (arrow.angle * 180) / Math.PI : 0;

  /*
   * La guía ocupa exactamente el mismo rectángulo que el canvas. Al no
   * conservar la proporción, SVG y Canvas comparten la misma transformación
   * incluso si el borde del tablero resta algún píxel, así que la tinta del
   * dedo nunca se desplaza respecto a los puntitos.
   */
  return (
    <svg
      className={styles.guide}
      viewBox={trace.viewBox}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      {trace.strokes.map((stroke, index) => {
        const state: StrokeState =
          index < currentStrokeIndex ? 'completed' : index === currentStrokeIndex ? 'current' : 'pending';

        return (
          <g key={stroke.id}>
            <path
              className={styles.base}
              data-state={state}
              d={stroke.path}
              fill="none"
              strokeDasharray="0.8 4.6"
              strokeLinecap="round"
            />
            {state === 'completed' ? (
              <path
                className={styles.completed}
                d={stroke.path}
                fill="none"
                pathLength={1}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}
            {state === 'current' ? (
              <path
                className={styles.current}
                d={stroke.path}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}

            <circle
              className={styles.startDot}
              data-state={state}
              cx={stroke.start.x}
              cy={stroke.start.y}
              r={state === 'current' ? 4.4 : 3.2}
            />

            {state === 'current' ? (
              <circle
                key={`${pulseKey}-${stroke.id}`}
                className={styles.startRing}
                cx={stroke.start.x}
                cy={stroke.start.y}
                r="7.5"
              />
            ) : null}
          </g>
        );
      })}

      {arrow && currentStroke ? (
        <g
          key={`${pulseKey}-arrow-${currentStroke.id}`}
          className={styles.arrow}
          transform={`translate(${arrow.point.x} ${arrow.point.y}) rotate(${arrowAngle})`}
        >
          <path d="M-4 -6 L7 0 L-4 6 Z" />
        </g>
      ) : null}

      <g aria-hidden="true" opacity="0.5">
        <path
          d={`M${viewBox.minX + 12} ${viewBox.minY + viewBox.height - 9} H${
            viewBox.minX + viewBox.width - 12
          }`}
          className={styles.baseline}
        />
      </g>
    </svg>
  );
}
