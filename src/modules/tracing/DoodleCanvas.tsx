import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { PencilIcon, TrashIcon, UndoIcon } from '@/components/icons/Icons';
import {
  DEFAULT_DOODLE_COLOR,
  DOODLE_COLORS,
  appendDoodlePoint,
  drawDoodleScene,
  drawDoodleSegment,
  drawDoodleStroke,
  toDoodlePoint,
  type CanvasSize,
  type DoodleStroke,
} from './drawing';
import styles from './DoodleCanvas.module.css';

/**
 * Lienzo de dibujo libre de Sprint 0.
 *
 * Valida la arquitectura táctil que reutilizará el motor de trazado:
 * Pointer Events, captura del puntero, coordenadas normalizadas, DPR,
 * ResizeObserver y limpieza estricta del ciclo de vida.
 */
export function DoodleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const sizeRef = useRef<CanvasSize | null>(null);
  const strokesRef = useRef<DoodleStroke[]>([]);
  const activeStrokeRef = useRef<DoodleStroke | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const clearedStrokesRef = useRef<DoodleStroke[] | null>(null);
  const colorRef = useRef<string>(DEFAULT_DOODLE_COLOR);

  const [color, setColor] = useState<string>(DEFAULT_DOODLE_COLOR);
  const [hasInk, setHasInk] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canClear, setCanClear] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const redraw = useCallback(() => {
    const context = contextRef.current;
    const size = sizeRef.current;
    if (!context || !size) {
      return;
    }

    const active = activeStrokeRef.current;
    const strokes = active ? [...strokesRef.current, active] : strokesRef.current;
    drawDoodleScene(context, strokes, size);
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

  const startStroke = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (activeStrokeRef.current) {
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
      // Algunos WebViews antiguos no permiten capturar el puntero; se sigue dibujando.
    }

    pointerIdRef.current = event.pointerId;
    clearedStrokesRef.current = null;

    const point = toDoodlePoint(
      event.clientX,
      event.clientY,
      event.currentTarget.getBoundingClientRect(),
    );
    const baseWidth = event.pointerType === 'pen' ? 7 + event.pressure * 12 : 13;
    const stroke: DoodleStroke = {
      color: colorRef.current,
      widthRatio: baseWidth / size.width,
      points: [point],
    };

    activeStrokeRef.current = stroke;
    drawDoodleStroke(context, stroke, size);
    setHasInk(true);
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
      const point = toDoodlePoint(sample.clientX, sample.clientY, rect);
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

    if (active) {
      strokesRef.current = [...strokesRef.current, active];
      setCanUndo(true);
      setCanClear(true);
    }

    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch {
      // La captura ya se había liberado.
    }
  };

  const handleUndo = () => {
    if (activeStrokeRef.current) {
      return;
    }

    if (strokesRef.current.length > 0) {
      strokesRef.current = strokesRef.current.slice(0, -1);
      setStatusMessage('Trazo deshecho.');
    } else if (clearedStrokesRef.current) {
      strokesRef.current = clearedStrokesRef.current;
      clearedStrokesRef.current = null;
      setStatusMessage('Dibujo restaurado.');
    } else {
      return;
    }

    redraw();
    const hasStrokes = strokesRef.current.length > 0;
    setHasInk(hasStrokes);
    setCanClear(hasStrokes);
    setCanUndo(hasStrokes || clearedStrokesRef.current !== null);
  };

  const handleClear = () => {
    if (activeStrokeRef.current || strokesRef.current.length === 0) {
      return;
    }

    clearedStrokesRef.current = strokesRef.current;
    strokesRef.current = [];
    redraw();
    setHasInk(false);
    setCanClear(false);
    setCanUndo(true);
    setStatusMessage('Pizarra borrada. Puedes deshacerlo.');
  };

  const selectColor = (value: string) => {
    colorRef.current = value;
    setColor(value);
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.canvasFrame}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          aria-label="Pizarra para dibujar con el dedo"
          onPointerDown={startStroke}
          onPointerMove={continueStroke}
          onPointerUp={finishStroke}
          onPointerCancel={finishStroke}
          onLostPointerCapture={finishStroke}
          onContextMenu={(event) => event.preventDefault()}
        >
          Tu navegador no puede mostrar la pizarra mágica.
        </canvas>

        {!hasInk ? (
          <div className={styles.hint} aria-hidden="true">
            <PencilIcon width="22" height="22" />
            <span>Dibuja con el dedo</span>
          </div>
        ) : null}
      </div>

      <div className={styles.toolbar}>
        <div className={styles.palette} role="group" aria-label="Elige un color">
          {DOODLE_COLORS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={[styles.color, color === option.value ? styles.colorSelected : '']
                .filter(Boolean)
                .join(' ')}
              style={{ '--swatch': option.value } as CSSProperties}
              aria-label={`Color ${option.name}`}
              aria-pressed={color === option.value}
              onClick={() => selectColor(option.value)}
            />
          ))}
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.toolButton}
            onClick={handleUndo}
            disabled={!canUndo}
            aria-label="Deshacer"
          >
            <UndoIcon width="22" height="22" />
          </button>
          <button
            type="button"
            className={styles.toolButton}
            onClick={handleClear}
            disabled={!canClear}
            aria-label="Borrar toda la pizarra"
          >
            <TrashIcon width="22" height="22" />
          </button>
        </div>
      </div>

      <p className="visually-hidden" role="status" aria-live="polite">
        {statusMessage}
      </p>
    </div>
  );
}
