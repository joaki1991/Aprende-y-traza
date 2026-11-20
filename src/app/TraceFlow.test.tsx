import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CharacterTrace, TracePoint } from '@/modules/lessons/lesson.types';
import { getCharacterTrace } from '@/modules/lessons/traces';
import { getLessonPack } from '@/modules/lessons/content';
import { samplePath } from '@/modules/tracing/traceGeometry';
import { ProgressProvider } from '@/modules/progress/ProgressProvider';
import { loadProgress } from '@/modules/progress/progress.repository';
import { DB_NAME, closeDatabase } from '@/modules/storage/db';
import { triggerResizeObservers } from '@/test/resizeObserver';
import { App } from './App';

/**
 * Prueba de integración del flujo real:
 * Aprender → Mayúsculas → A → ejercicio → completar → IndexedDB.
 *
 * jsdom no implementa Canvas 2D ni Pointer Events completos, así que se
 * sustituyen por dobles mínimos. El componente, los eventos, la sesión y la
 * validación son los de producción.
 */

class PointerEventPolyfill extends MouseEvent {
  readonly pointerId: number;
  readonly pointerType: string;

  constructor(type: string, init: PointerEventInit = {}) {
    super(type, init);
    this.pointerId = init.pointerId ?? 1;
    this.pointerType = init.pointerType ?? 'touch';
  }
}

if (typeof window.PointerEvent === 'undefined') {
  Object.defineProperty(window, 'PointerEvent', {
    configurable: true,
    value: PointerEventPolyfill,
  });
}

const PORTRAIT_RECT = {
  x: 0,
  y: 0,
  left: 0,
  top: 0,
  width: 340,
  height: 476,
  right: 340,
  bottom: 476,
  toJSON: () => ({}),
} as DOMRect;

/** Tablero en horizontal: conserva la proporción 5:7 del viewBox. */
const LANDSCAPE_RECT = {
  x: 0,
  y: 0,
  left: 0,
  top: 0,
  width: 250,
  height: 350,
  right: 250,
  bottom: 350,
  toJSON: () => ({}),
} as DOMRect;

let canvasRect: DOMRect = PORTRAIT_RECT;

function setCanvasRect(rect: DOMRect): void {
  canvasRect = rect;
}

const contextStub = {
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 0,
  lineCap: 'round',
  lineJoin: 'round',
  clearRect: vi.fn(),
  setTransform: vi.fn(),
  beginPath: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
};

async function deleteTestDatabase(): Promise<void> {
  await closeDatabase();
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error ?? new Error('No se pudo borrar la base.'));
    request.onblocked = () => resolve();
  });
}

function loadTrace(): CharacterTrace {
  const trace = getCharacterTrace('upper-a');
  if (!trace) {
    throw new Error('La A mayúscula debería tener trazos registrados.');
  }
  return trace;
}

/** Convierte coordenadas del viewBox a píxeles del canvas simulado. */
function toClient(
  point: TracePoint,
  rect: DOMRect,
): { clientX: number; clientY: number } {
  return {
    clientX: rect.left + (point.x / 100) * rect.width,
    clientY: rect.top + (point.y / 140) * rect.height,
  };
}

function drawStroke(
  canvas: HTMLCanvasElement,
  strokeIndex: number,
  rect: DOMRect = canvasRect,
): void {
  const stroke = loadTrace().strokes[strokeIndex];
  if (!stroke) {
    throw new Error(`No existe el trazo ${strokeIndex}.`);
  }

  const points = samplePath(stroke.path, 4).points;
  const first = points[0];
  const last = points.at(-1);
  if (!first || !last) {
    throw new Error('El trazo no tiene puntos.');
  }

  fireEvent.pointerDown(canvas, {
    pointerId: 1,
    pointerType: 'touch',
    isPrimary: true,
    ...toClient(first, rect),
  });

  for (const point of points.slice(1)) {
    fireEvent.pointerMove(canvas, {
      pointerId: 1,
      pointerType: 'touch',
      isPrimary: true,
      ...toClient(point, rect),
    });
  }

  fireEvent.pointerUp(canvas, {
    pointerId: 1,
    pointerType: 'touch',
    isPrimary: true,
    ...toClient(last, rect),
  });
}

function renderAt(hash: string) {
  window.location.hash = hash;
  return render(
    <ProgressProvider>
      <App />
    </ProgressProvider>,
  );
}

function goTo(hash: string): void {
  window.location.hash = hash;
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

/** Espera al breve bloqueo de feedback entre trazos. */
async function waitForNextStroke(): Promise<void> {
  await act(async () => {
    await new Promise((resolve) => {
      setTimeout(resolve, 850);
    });
  });
}

/**
 * Simula el giro del dispositivo: cambia el rectángulo del lienzo y avisa al
 * `ResizeObserver` como haría el navegador.
 */
async function rotateCanvasTo(rect: DOMRect): Promise<void> {
  setCanvasRect(rect);
  await act(async () => {
    triggerResizeObservers();
    await new Promise((resolve) => {
      setTimeout(resolve, 40);
    });
  });
}

describe('flujo de trazado de la A', () => {
  beforeEach(async () => {
    await deleteTestDatabase();
    setCanvasRect(PORTRAIT_RECT);
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
      () => contextStub as unknown as CanvasRenderingContext2D,
    );
    vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockImplementation(
      () => canvasRect,
    );
    contextStub.clearRect.mockClear();
    contextStub.stroke.mockClear();
  });

  afterEach(async () => {
    await deleteTestDatabase();
  });

  it('permite entrar desde Mayúsculas y completar los tres trazos', async () => {
    renderAt('#/aprender/mayusculas');

    expect(screen.getByRole('heading', { level: 1, name: 'Mayúsculas' })).toBeInTheDocument();
    const characterLink = screen.getByRole('link', { name: /trazar a, mayúscula: abeja/i });
    expect(characterLink).toHaveAttribute('href', '#/aprender/mayusculas/upper-a');
    expect(screen.getByRole('link', { name: 'Trazar la A' })).toHaveAttribute(
      'href',
      '#/aprender/mayusculas/upper-a',
    );

    goTo('#/aprender/mayusculas/upper-a');

    expect(await screen.findByRole('heading', { level: 1, name: 'La A' })).toBeInTheDocument();
    expect(screen.getByText(/baja desde la punta hacia la izquierda/i)).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Trazo 1 de 3' })).toBeInTheDocument();

    const canvas = screen.getByLabelText(/zona para trazar la letra a/i) as HTMLCanvasElement;

    drawStroke(canvas, 0);
    expect(await screen.findByText(/vuelve arriba y baja hacia la derecha/i)).toBeInTheDocument();
    await waitForNextStroke();

    drawStroke(canvas, 1);
    expect(await screen.findByText(/cruza una línea en el medio/i)).toBeInTheDocument();
    await waitForNextStroke();

    drawStroke(canvas, 2);

    expect(await screen.findByRole('heading', { name: '¡Bravo!' })).toBeInTheDocument();
    expect(screen.getAllByText(/la a está preciosa/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /otra vez/i })).toBeInTheDocument();

    await waitFor(async () => {
      const progress = await loadProgress();
      const character = progress.characters['upper-a'];
      // Una ronda completada cuenta como un intento del ejercicio.
      expect(character?.attempts).toBe(1);
      expect(character?.completions).toBe(1);
      expect(character?.lastResult).toBe('completed');
      expect(character?.bestAccuracy).toBeGreaterThan(0.5);
      expect(character?.packId).toBe('mayusculas');
    });
  });

  it('registra el intento fallido y no completa al saltarse el primer trazo', async () => {
    renderAt('#/aprender/mayusculas/upper-a');

    expect(await screen.findByRole('heading', { level: 1, name: 'La A' })).toBeInTheDocument();
    const canvas = screen.getByLabelText(/zona para trazar la letra a/i) as HTMLCanvasElement;

    drawStroke(canvas, 1);

    expect(await screen.findByText(/primero toca este trazo/i)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '¡Bravo!' })).not.toBeInTheDocument();

    await waitFor(async () => {
      const progress = await loadProgress();
      const character = progress.characters['upper-a'];
      expect(character?.attempts).toBe(1);
      expect(character?.completions).toBe(0);
      expect(character?.lastResult).toBe('incomplete');
    });

    const pack = getLessonPack('mayusculas');
    expect(pack?.characters[0]?.id).toBe('upper-a');
  });

  it('conserva la ronda y completa la A después de girar a horizontal', async () => {
    renderAt('#/aprender/mayusculas/upper-a');

    expect(await screen.findByRole('heading', { level: 1, name: 'La A' })).toBeInTheDocument();
    const canvas = screen.getByLabelText(/zona para trazar la letra a/i) as HTMLCanvasElement;

    drawStroke(canvas, 0);
    expect(await screen.findByText(/vuelve arriba y baja hacia la derecha/i)).toBeInTheDocument();
    await waitForNextStroke();

    await rotateCanvasTo(LANDSCAPE_RECT);
    expect(screen.getByRole('list', { name: 'Trazo 2 de 3' })).toBeInTheDocument();

    drawStroke(canvas, 1, LANDSCAPE_RECT);
    expect(await screen.findByText(/cruza una línea en el medio/i)).toBeInTheDocument();
    await waitForNextStroke();

    drawStroke(canvas, 2, LANDSCAPE_RECT);

    expect(await screen.findByRole('heading', { name: '¡Bravo!' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /otra vez/i })).toBeInTheDocument();

    await waitFor(async () => {
      const progress = await loadProgress();
      const character = progress.characters['upper-a'];
      expect(character?.attempts).toBe(1);
      expect(character?.completions).toBe(1);
      expect(character?.lastResult).toBe('completed');
      expect(character?.bestAccuracy).toBeGreaterThan(0.5);
    });
  });

  it('sigue rechazando un trazo fuera de orden después de girar', async () => {
    renderAt('#/aprender/mayusculas/upper-a');

    expect(await screen.findByRole('heading', { level: 1, name: 'La A' })).toBeInTheDocument();
    const canvas = screen.getByLabelText(/zona para trazar la letra a/i) as HTMLCanvasElement;

    drawStroke(canvas, 0);
    expect(await screen.findByText(/vuelve arriba y baja hacia la derecha/i)).toBeInTheDocument();
    await waitForNextStroke();

    await rotateCanvasTo(LANDSCAPE_RECT);

    // La línea del medio es el tercer trazo, no el segundo.
    drawStroke(canvas, 2, LANDSCAPE_RECT);

    expect(await screen.findByText(/primero toca este trazo/i)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '¡Bravo!' })).not.toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Trazo 2 de 3' })).toBeInTheDocument();

    await waitFor(async () => {
      const progress = await loadProgress();
      const character = progress.characters['upper-a'];
      expect(character?.completions).toBe(0);
      expect(character?.lastResult).toBe('incomplete');
    });
  });
});
