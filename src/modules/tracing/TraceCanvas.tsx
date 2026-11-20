import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import type { CharacterTrace, TracePoint } from '@/modules/lessons/lesson.types';
import { parseViewBox, toViewBoxPoint } from './traceGeometry';
import styles from './TraceCanvas.module.css';

interface TraceCanvasProps {
  trace: CharacterTrace;
  glyph: string;
  disabled?: boolean;
  /** Al cambiar, se limpia el lienzo (nuevo trazo o repetición). */
  resetKey: number;
  onStrokeEnd: (points: TracePoint[]) => void;
}

interface CanvasSize {
  width: number;
  height: number;
}

const INK_COLOR = '#8a63d2';
const MIN_POINT_DISTANCE_PX = 1.2;

/**
 * Lienzo de tinta del ejercicio de trazado.
 *
 * Guarda los puntos en coordenadas del `viewBox` del carácter, no en píxeles.
 * Así el trazo, la validación y el redimensionado comparten un único sistema
 * de referencia. La guía SVG se dibuja debajo y este canvas solo contiene la
 * tinta del dedo.
 */
export function TraceCanvas({
  trace,
  glyph,
  disabled = false,
  resetKey,
  onStrokeEnd,
}: TraceCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const sizeRef = useRef<CanvasSize | null>(null);
  const activePointsRef = useRef<TracePoint[]>([]);
  const pointerIdRef = useRef<number | null>(null);
  const disabledRef = useRef(disabled);
  const viewBox = useMemo(() => parseViewBox(trace.viewBox), [trace.viewBox]);

  useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

  const toPixels = useCallback(
    (point: TracePoint, size: CanvasSize) => {
      return {
        x: ((point.x - viewBox.minX) / viewBox.width) * size.width,
        y: ((point.y - viewBox.minY) / viewBox.height) * size.height,
      };
    },
    [viewBox],
  );

  const broadWidth = useCallback((size: CanvasSize) => {
    return Math.min(18, Math.max(9, size.width * 0.04));
  }, []);

  const drawDot = useCallback(
    (context: CanvasRenderingContext2D, point: TracePoint, size: CanvasSize) => {
      const pixel = toPixels(point, size);
      const width = broadWidth(size);
      context.fillStyle = INK_COLOR;
      context.beginPath();
      context.arc(pixel.x, pixel.y, width / 2, 0, Math.PI * 2);
      context.fill();
    },
    [broadWidth, toPixels],
  );

  const drawSegment = useCallback(
    (
      context: CanvasRenderingContext2D,
      from: TracePoint,
      to: TracePoint,
      size: CanvasSize,
    ) => {
      const start = toPixels(from, size);
      const end = toPixels(to, size);
      context.strokeStyle = INK_COLOR;
      context.lineWidth = broadWidth(size);
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.beginPath();
      context.moveTo(start.x, start.y);
      context.lineTo(end.x, end.y);
      context.stroke();
    },
    [broadWidth, toPixels],
  );

  const redraw = useCallback(() => {
    const context = contextRef.current;
    const size = sizeRef.current;
    if (!context || !size) {
      return;
    }

    context.clearRect(0, 0, size.width, size.height);
    const points = activePointsRef.current;
    const first = points[0];
    if (!first) {
      return;
    }

    if (points.length === 1) {
      drawDot(context, first, size);
      return;
    }

    for (let index = 1; index < points.length; index += 1) {
      const from = points[index - 1];
      const to = points[index];
      if (from && to) {
        drawSegment(context, from, to, size);
      }
    }
  }, [drawDot, drawSegment]);

  const clearInk = useCallback(() => {
    const context = contextRef.current;
    const size = sizeRef.current;
    if (context && size) {
      context.clearRect(0, 0, size.width, size.height);
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) {
      return;
    }

    contextRef.current = context;
    let animationFrame = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        return;
      }

      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      const deviceWidth = Math.round(rect.width * dpr);
      const deviceHeight = Math.round(rect.height * dpr);

      if (canvas.width !== deviceWidth || canvas.height !== deviceHeight) {
        canvas.width = deviceWidth;
        canvas.height = deviceHeight;
      }

      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      sizeRef.current = { width: rect.width, height: rect.height };
      redraw();
    };

    const scheduleResize = () => {
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(resize);
    };

    const observer =
      typeof ResizeObserver === 'function' ? new ResizeObserver(scheduleResize) : null;

    if (observer) {
      observer.observe(canvas);
    } else {
      window.addEventListener('resize', scheduleResize);
    }

    resize();

    return () => {
      cancelAnimationFrame(animationFrame);
      observer?.disconnect();
      window.removeEventListener('resize', scheduleResize);
      contextRef.current = null;
      sizeRef.current = null;
    };
  }, [redraw]);

  useEffect(() => {
    activePointsRef.current = [];
    pointerIdRef.current = null;
    clearInk();
  }, [resetKey, clearInk]);

  const startStroke = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (disabledRef.current || pointerIdRef.current !== null) {
      return;
    }
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }

    const context = contextRef.current;
    const size = sizeRef.current;
    if (!context || !size) {
      return;
    }

    event.preventDefault();
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Algunos WebViews antiguos no permiten capturar el puntero.
    }

    const point = toViewBoxPoint(
      event.clientX,
      event.clientY,
      event.currentTarget.getBoundingClientRect(),
      viewBox,
    );

    pointerIdRef.current = event.pointerId;
    activePointsRef.current = [point];
    drawDot(context, point, size);
  };

  const continueStroke = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (pointerIdRef.current !== event.pointerId) {
      return;
    }

    const context = contextRef.current;
    const size = sizeRef.current;
    if (!context || !size) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const nativeEvents =
      typeof event.nativeEvent.getCoalescedEvents === 'function'
        ? event.nativeEvent.getCoalescedEvents()
        : [];
    const samples = nativeEvents.length > 0 ? nativeEvents : [event.nativeEvent];

    for (const sample of samples) {
      const point = toViewBoxPoint(sample.clientX, sample.clientY, rect, viewBox);
      const previous = activePointsRef.current.at(-1);
      if (!previous) {
        activePointsRef.current.push(point);
        drawDot(context, point, size);
        continue;
      }

      const dx = ((point.x - previous.x) / viewBox.width) * size.width;
      const dy = ((point.y - previous.y) / viewBox.height) * size.height;
      if (Math.hypot(dx, dy) < MIN_POINT_DISTANCE_PX) {
        continue;
      }

      activePointsRef.current.push(point);
      drawSegment(context, previous, point, size);
    }
  };

  const finishStroke = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (pointerIdRef.current !== event.pointerId) {
      return;
    }

    const points = activePointsRef.current;
    pointerIdRef.current = null;

    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch {
      // La captura ya se había liberado.
    }

    onStrokeEnd(points);
  };

  const cancelStroke = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (pointerIdRef.current !== event.pointerId) {
      return;
    }

    pointerIdRef.current = null;
    activePointsRef.current = [];
    clearInk();

    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch {
      // La captura ya se había liberado.
    }
  };

  return (
    <canvas
      ref={canvasRef}
      className={styles.canvas}
      aria-label={
        /^\d$/.test(glyph)
          ? `Zona para trazar el número ${glyph} con el dedo`
          : `Zona para trazar la letra ${glyph} con el dedo`
      }
      onPointerDown={startStroke}
      onPointerMove={continueStroke}
      onPointerUp={finishStroke}
      onPointerCancel={cancelStroke}
      onLostPointerCapture={cancelStroke}
      onContextMenu={(event) => event.preventDefault()}
    >
      Tu navegador no puede mostrar el ejercicio de trazado.
    </canvas>
  );
}
