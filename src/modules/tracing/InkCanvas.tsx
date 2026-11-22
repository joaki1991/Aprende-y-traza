import {
  useCallback,
  useEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import {
  appendDoodlePoint,
  drawDoodleScene,
  drawDoodleSegment,
  drawDoodleStroke,
  toDoodlePoint,
  type CanvasSize,
  type DoodlePoint,
  type DoodleStroke,
} from './drawing';
import styles from './InkCanvas.module.css';

interface InkCanvasProps {
  /** Trazos ya confirmados, en coordenadas normalizadas. */
  strokes: readonly DoodleStroke[];
  color: string;
  /** Grosor en píxeles del tablero; se guarda como proporción. */
  brushWidth: number;
  enabled?: boolean;
  resetKey?: number;
  ariaLabel: string;
  onChange: (strokes: DoodleStroke[]) => void;
}

/**
 * Lienzo de tinta transparente reutilizado por la pizarra libre y por el modo
 * de colorear. Pinta solo el segmento nuevo y guarda los puntos normalizados
 * para que un giro de pantalla no deforme el dibujo.
 */
export function InkCanvas({
  strokes,
  color,
  brushWidth,
  enabled = true,
  resetKey,
  ariaLabel,
  onChange,
}: InkCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const sizeRef = useRef<CanvasSize | null>(null);
  const strokesRef = useRef<readonly DoodleStroke[]>(strokes);
  const activeStrokeRef = useRef<DoodleStroke | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const enabledRef = useRef(enabled);
  const colorRef = useRef(color);
  const widthRef = useRef(brushWidth);

  useEffect(() => {
    enabledRef.current = enabled;
    colorRef.current = color;
    widthRef.current = brushWidth;
  }, [enabled, color, brushWidth]);

  const redraw = useCallback(() => {
    const context = contextRef.current;
    const size = sizeRef.current;
    if (!context || !size) {
      return;
    }

    const active = activeStrokeRef.current;
    const scene = active ? [...strokesRef.current, active] : strokesRef.current;
    drawDoodleScene(context, scene, size);
  }, []);

  useEffect(() => {
    strokesRef.current = strokes;
    redraw();
  }, [strokes, redraw]);

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
    activeStrokeRef.current = null;
    pointerIdRef.current = null;
    redraw();
  }, [resetKey, redraw]);

  const startStroke = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!enabledRef.current || activeStrokeRef.current) {
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

    pointerIdRef.current = event.pointerId;
    const point = toDoodlePoint(
      event.clientX,
      event.clientY,
      event.currentTarget.getBoundingClientRect(),
    );
    const stroke: DoodleStroke = {
      color: colorRef.current,
      widthRatio: widthRef.current / Math.max(1, size.width),
      points: [point],
    };

    activeStrokeRef.current = stroke;
    drawDoodleStroke(context, stroke, size);
  };

  const continueStroke = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const active = activeStrokeRef.current;
    if (!active || pointerIdRef.current !== event.pointerId) {
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
      const point: DoodlePoint = toDoodlePoint(sample.clientX, sample.clientY, rect);
      const previous = active.points.at(-1);
      if (appendDoodlePoint(active, point, size) && previous) {
        drawDoodleSegment(context, active, previous, point, size);
      }
    }
  };

  const finishStroke = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (pointerIdRef.current !== event.pointerId) {
      return;
    }

    const active = activeStrokeRef.current;
    activeStrokeRef.current = null;
    pointerIdRef.current = null;

    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch {
      // La captura ya se había liberado.
    }

    if (active) {
      const next = [...strokesRef.current, active];
      strokesRef.current = next;
      onChange(next);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      className={styles.canvas}
      aria-label={ariaLabel}
      data-enabled={enabled ? 'true' : 'false'}
      onPointerDown={startStroke}
      onPointerMove={continueStroke}
      onPointerUp={finishStroke}
      onPointerCancel={finishStroke}
      onLostPointerCapture={finishStroke}
      onContextMenu={(event) => event.preventDefault()}
    >
      Tu navegador no puede mostrar la pizarra mágica.
    </canvas>
  );
}
