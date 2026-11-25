import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CharacterTrace, TracePoint } from '@/modules/lessons/lesson.types';
import { getCharacterTrace } from '@/modules/lessons/traces';
import { samplePath } from '@/modules/tracing/traceGeometry';
import { ProgressProvider } from '@/modules/progress/ProgressProvider';
import { DB_NAME, closeDatabase } from '@/modules/storage/db';
import { AudioProvider } from '@/modules/audio/AudioProvider';
import {
  createFakeEffectsPlayer,
  createFakeSpeechPlayer,
} from '@/test/audioPlayers';
import { TraceScreen } from './TraceScreen';

/**
 * Integración entre el ejercicio real y los motores de audio.
 *
 * El trazado, la sesión y la validación son los de producción. Los
 * reproductores se sustituyen por dobles observables para comprobar qué se
 * dice y qué suena en cada momento.
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

const CANVAS_RECT = {
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
    throw new Error('La ficha A debería tener trazos registrados.');
  }
  return trace;
}

function toClient(point: TracePoint): { clientX: number; clientY: number } {
  return {
    clientX: CANVAS_RECT.left + (point.x / 100) * CANVAS_RECT.width,
    clientY: CANVAS_RECT.top + (point.y / 140) * CANVAS_RECT.height,
  };
}

function drawStroke(canvas: HTMLCanvasElement, strokeIndex: number): void {
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
    ...toClient(first),
  });

  for (const point of points.slice(1)) {
    fireEvent.pointerMove(canvas, {
      pointerId: 1,
      pointerType: 'touch',
      isPrimary: true,
      ...toClient(point),
    });
  }

  fireEvent.pointerUp(canvas, {
    pointerId: 1,
    pointerType: 'touch',
    isPrimary: true,
    ...toClient(last),
  });
}

function renderTrace() {
  const effects = createFakeEffectsPlayer();
  const speech = createFakeSpeechPlayer();

  render(
    <ProgressProvider>
      <AudioProvider effects={effects.player} speech={speech.player}>
        <TraceScreen packId="mayusculas" characterId="upper-a" />
      </AudioProvider>
    </ProgressProvider>,
  );

  const canvas = screen.getByLabelText(/zona para trazar la letra a/i) as HTMLCanvasElement;
  return { canvas, effects, speech };
}

async function waitForNextStroke(): Promise<void> {
  await act(async () => {
    await new Promise((resolve) => {
      setTimeout(resolve, 850);
    });
  });
}

beforeEach(async () => {
  await deleteTestDatabase();
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
    () => contextStub as unknown as CanvasRenderingContext2D,
  );
  vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockImplementation(
    () => CANVAS_RECT,
  );
  contextStub.clearRect.mockClear();
  contextStub.stroke.mockClear();
});

afterEach(async () => {
  await deleteTestDatabase();
  vi.restoreAllMocks();
});

describe('audio del ejercicio de trazado', () => {
  it('anuncia la letra y la primera instrucción al entrar', () => {
    const { speech } = renderTrace();

    expect(speech.spoken[0]).toContain('Vamos a trazar la A');
    expect(speech.spoken[0]).toContain('Baja desde la punta hacia la izquierda');
  });

  it('suena un pasito y lee la siguiente instrucción solo al acertar', async () => {
    const { canvas, effects, speech } = renderTrace();

    drawStroke(canvas, 0);

    expect(effects.played).toEqual(['step']);
    expect(speech.spoken.at(-1)).toContain('¡Muy bien!');
    expect(speech.spoken.at(-1)).toContain('Vuelve arriba y baja hacia la derecha');

    await waitForNextStroke();
  });

  it('no suena ni avanza si el trazo es incorrecto', async () => {
    const { canvas, effects, speech } = renderTrace();

    drawStroke(canvas, 1);

    expect(effects.played).toEqual([]);
    expect(speech.spoken.at(-1)).toContain('Primero toca este trazo');
    expect(screen.queryByRole('heading', { name: '¡Bravo!' })).not.toBeInTheDocument();

    await waitForNextStroke();
  });

  it('celebra solo al completar y encadena estrella y desbloqueo', async () => {
    const { canvas, effects, speech } = renderTrace();

    drawStroke(canvas, 0);
    await waitForNextStroke();
    drawStroke(canvas, 1);
    await waitForNextStroke();
    drawStroke(canvas, 2);

    expect(effects.played).toContain('victory');
    expect(speech.cancel).toHaveBeenCalled();

    await waitFor(() => {
      expect(effects.played).toContain('star');
      expect(effects.played).toContain('unlock');
    });
    expect(effects.played.indexOf('victory')).toBeLessThan(effects.played.indexOf('star'));
  });
});
