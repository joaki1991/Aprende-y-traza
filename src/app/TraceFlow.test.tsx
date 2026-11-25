import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CharacterTrace, TracePoint } from '@/modules/lessons/lesson.types';
import { getCharacterTrace } from '@/modules/lessons/traces';
import { getLessonPack } from '@/modules/lessons/content';
import { samplePath } from '@/modules/tracing/traceGeometry';
import { ProgressProvider } from '@/modules/progress/ProgressProvider';
import { loadProgress, recordPractice, saveArtwork } from '@/modules/progress/progress.repository';
import { createEmptyArtwork } from '@/modules/artworks/artwork.types';
import { DB_NAME, closeDatabase } from '@/modules/storage/db';
import { triggerResizeObservers } from '@/test/resizeObserver';
import { traceCompleteHref } from './router';
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

function loadTrace(traceId = 'upper-a'): CharacterTrace {
  const trace = getCharacterTrace(traceId);
  if (!trace) {
    throw new Error(`La ficha ${traceId} debería tener trazos registrados.`);
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
  traceId = 'upper-a',
): void {
  const stroke = loadTrace(traceId).strokes[strokeIndex];
  if (!stroke) {
    throw new Error(`No existe el trazo ${strokeIndex} de ${traceId}.`);
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

/** Toca un punto independiente (i/j) sin arrastrar. */
function drawDot(
  canvas: HTMLCanvasElement,
  strokeIndex: number,
  traceId: string,
  rect: DOMRect = canvasRect,
): void {
  const stroke = loadTrace(traceId).strokes[strokeIndex];
  if (!stroke) {
    throw new Error(`No existe el punto ${strokeIndex} de ${traceId}.`);
  }

  const touch = {
    pointerId: 1,
    pointerType: 'touch',
    isPrimary: true,
    ...toClient(stroke.start, rect),
  };

  fireEvent.pointerDown(canvas, touch);
  fireEvent.pointerUp(canvas, touch);
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

describe('flujo de trazado de la A', () => {
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

    expect(
      await screen.findByRole('heading', { level: 1, name: '¡Bravo!' }),
    ).toBeInTheDocument();
    expect(await screen.findByText(/has completado la a/i)).toBeInTheDocument();
    expect(screen.getByText('Avión')).toBeInTheDocument();
    expect(screen.getByText(/has ganado una estrella/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /colorear mi dibujo/i })).toHaveAttribute(
      'href',
      '#/pizarra/dibujo/letter-a/desde/mayusculas/upper-a',
    );
    expect(screen.getByRole('link', { name: /repetir trazado/i })).toHaveAttribute(
      'href',
      '#/aprender/mayusculas/upper-a',
    );
    expect(screen.getByRole('link', { name: /siguiente letra: b/i })).toHaveAttribute(
      'href',
      '#/aprender/mayusculas/upper-b',
    );
    expect(window.location.hash).toBe('#/aprender/mayusculas/upper-a/completado');
    expect(document.title).toBe('¡Bravo! · Aprende y Traza');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await waitFor(async () => {
      const progress = await loadProgress();
      const character = progress.characters['upper-a'];
      // Una ronda completada cuenta como un intento del ejercicio.
      expect(character?.attempts).toBe(1);
      expect(character?.completions).toBe(1);
      expect(character?.lastResult).toBe('completed');
      expect(character?.bestAccuracy).toBeGreaterThan(0.5);
      expect(character?.packId).toBe('mayusculas');
      expect(character?.starsEarned).toBe(1);
      expect(progress.stars).toBe(1);
      expect(progress.artworks['letter-a']).toBeDefined();
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

    expect(
      await screen.findByRole('heading', { level: 1, name: '¡Bravo!' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /repetir trazado/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /colorear mi dibujo/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /siguiente letra: b/i })).toBeInTheDocument();

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

describe('flujo de trazado de minúsculas y números', () => {
  it('completa la minúscula a con su bola y su línea', async () => {
    renderAt('#/aprender/minusculas');

    expect(screen.getByRole('heading', { level: 1, name: 'Minúsculas' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /trazar a, minúscula: abeja/i })).toHaveAttribute(
      'href',
      '#/aprender/minusculas/lower-a',
    );

    goTo('#/aprender/minusculas/lower-a');

    expect(await screen.findByRole('heading', { level: 1, name: 'La a' })).toBeInTheDocument();
    expect(screen.getByText(/haz una bolita/i)).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Trazo 1 de 2' })).toBeInTheDocument();

    const canvas = screen.getByLabelText(/zona para trazar la letra a/i) as HTMLCanvasElement;

    drawStroke(canvas, 0, canvasRect, 'lower-a');
    expect(await screen.findByText(/baja una línea recta a la derecha/i)).toBeInTheDocument();
    await waitForNextStroke();

    drawStroke(canvas, 1, canvasRect, 'lower-a');

    expect(
      await screen.findByRole('heading', { level: 1, name: '¡Bravo!' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/has completado la a/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /colorear mi dibujo/i })).toHaveAttribute(
      'href',
      '#/pizarra/dibujo/letter-a/desde/minusculas/lower-a',
    );

    await waitFor(async () => {
      const progress = await loadProgress();
      const character = progress.characters['lower-a'];
      expect(character?.packId).toBe('minusculas');
      expect(character?.attempts).toBe(1);
      expect(character?.completions).toBe(1);
      expect(character?.lastResult).toBe('completed');
      expect(character?.bestAccuracy).toBeGreaterThan(0.5);
    });
  });

  it('completa el número 0 con una sola vuelta cerrada', async () => {
    renderAt('#/aprender/numeros/digit-0');

    expect(await screen.findByRole('heading', { level: 1, name: 'El 0' })).toBeInTheDocument();
    const canvas = screen.getByLabelText(/zona para trazar el número 0/i) as HTMLCanvasElement;

    drawStroke(canvas, 0, canvasRect, 'digit-0');

    expect(
      await screen.findByRole('heading', { level: 1, name: '¡Bravo!' }),
    ).toBeInTheDocument();
    expect(await screen.findByText(/has completado el 0/i)).toBeInTheDocument();
    expect(screen.getByText('Donut')).toBeInTheDocument();
    expect(screen.getByText(/has ganado una estrella/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /colorear mi dibujo/i })).toHaveAttribute(
      'href',
      '#/pizarra/dibujo/number-0/desde/numeros/digit-0',
    );
    expect(screen.getByRole('link', { name: /repetir trazado/i })).toHaveAttribute(
      'href',
      '#/aprender/numeros/digit-0',
    );
    expect(screen.getByRole('link', { name: /siguiente número: 1/i })).toHaveAttribute(
      'href',
      '#/aprender/numeros/digit-1',
    );

    await waitFor(async () => {
      const progress = await loadProgress();
      const character = progress.characters['digit-0'];
      expect(character?.packId).toBe('numeros');
      expect(character?.completions).toBe(1);
      expect(character?.lastResult).toBe('completed');
      expect(progress.stars).toBe(1);
      expect(progress.artworks['number-0']).toBeDefined();
    });
  });

  it('completa la i con su línea y un toque en el punto', async () => {
    renderAt('#/aprender/minusculas/lower-i');

    expect(await screen.findByRole('heading', { level: 1, name: 'La i' })).toBeInTheDocument();
    const canvas = screen.getByLabelText(/zona para trazar la letra i/i) as HTMLCanvasElement;

    drawStroke(canvas, 0, canvasRect, 'lower-i');
    expect(await screen.findByText(/pon un puntito arriba/i)).toBeInTheDocument();
    await waitForNextStroke();

    drawDot(canvas, 1, 'lower-i');

    expect(
      await screen.findByRole('heading', { level: 1, name: '¡Bravo!' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/has completado la i/i)).toBeInTheDocument();

    await waitFor(async () => {
      const progress = await loadProgress();
      const character = progress.characters['lower-i'];
      expect(character?.completions).toBe(1);
      expect(character?.lastResult).toBe('completed');
    });
  });
});

describe('recompensas al completar fichas', () => {
  it('ofrece las tres opciones sin duplicar el dibujo al completar la minúscula de la misma letra', async () => {
    await recordPractice({
      packId: 'mayusculas',
      characterId: 'upper-a',
      completed: true,
      accuracy: 0.9,
    });

    renderAt('#/aprender/minusculas/lower-a');

    expect(await screen.findByRole('heading', { level: 1, name: 'La a' })).toBeInTheDocument();
    const canvas = screen.getByLabelText(/zona para trazar la letra a/i) as HTMLCanvasElement;

    drawStroke(canvas, 0, canvasRect, 'lower-a');
    expect(await screen.findByText(/baja una línea recta a la derecha/i)).toBeInTheDocument();
    await waitForNextStroke();

    drawStroke(canvas, 1, canvasRect, 'lower-a');
    expect(
      await screen.findByRole('heading', { level: 1, name: '¡Bravo!' }),
    ).toBeInTheDocument();

    // La lámina ya estaba desbloqueada: no se anuncia como recompensa nueva.
    expect(screen.getByText('¡Has ganado una estrella!')).toBeInTheDocument();
    expect(screen.queryByText(/un dibujo nuevo/i)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /colorear mi dibujo/i })).toHaveAttribute(
      'href',
      '#/pizarra/dibujo/letter-a/desde/minusculas/lower-a',
    );
    expect(screen.getByRole('link', { name: /repetir trazado/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /siguiente letra: b/i })).toBeInTheDocument();

    const progress = await loadProgress();
    expect(progress.stars).toBe(2);
    expect(progress.characters['lower-a']?.starsEarned).toBe(1);
    expect(Object.keys(progress.artworks)).toEqual(['letter-a']);
  });

  it('abre la lámina desbloqueada en la pizarra para colorearla', async () => {
    await recordPractice({
      packId: 'numeros',
      characterId: 'digit-0',
      completed: true,
      accuracy: 0.86,
    });

    renderAt('#/pizarra/dibujo/number-0');

    expect(
      await screen.findByRole('group', { name: /lámina para colorear: donut/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^pincel$/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: /^pintar$/i })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(screen.getByRole('group', { name: /elige un color/i })).toBeInTheDocument();
    expect(document.title).toBe('Colorear Donut · Aprende y Traza');
  });
});

describe('pantalla de finalización del trazado', () => {
  it('mantiene las tres opciones al repetir una letra ya completada sin dar otra estrella', async () => {
    await recordPractice({
      packId: 'mayusculas',
      characterId: 'upper-a',
      completed: true,
      accuracy: 0.92,
    });

    renderAt('#/aprender/mayusculas/upper-a');

    expect(await screen.findByRole('heading', { level: 1, name: 'La A' })).toBeInTheDocument();
    const canvas = screen.getByLabelText(/zona para trazar la letra a/i) as HTMLCanvasElement;

    drawStroke(canvas, 0);
    await waitForNextStroke();
    drawStroke(canvas, 1);
    await waitForNextStroke();
    drawStroke(canvas, 2);

    expect(
      await screen.findByRole('heading', { level: 1, name: '¡Bravo!' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/has completado la a/i)).toBeInTheDocument();
    expect(screen.getByText('¡Qué bien lo haces!')).toBeInTheDocument();
    expect(screen.queryByText(/has ganado una estrella/i)).not.toBeInTheDocument();
    expect(screen.getByText('Avión')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /colorear mi dibujo/i })).toHaveAttribute(
      'href',
      '#/pizarra/dibujo/letter-a/desde/mayusculas/upper-a',
    );
    expect(screen.getByRole('link', { name: /repetir trazado/i })).toHaveAttribute(
      'href',
      '#/aprender/mayusculas/upper-a',
    );
    expect(screen.getByRole('link', { name: /siguiente letra: b/i })).toHaveAttribute(
      'href',
      '#/aprender/mayusculas/upper-b',
    );

    await waitFor(async () => {
      const progress = await loadProgress();
      expect(progress.characters['upper-a']?.completions).toBe(2);
      expect(progress.characters['upper-a']?.starsEarned).toBe(1);
      expect(progress.stars).toBe(1);
    });
  });

  it('mantiene las tres opciones al repetir un número completado sin dar otra estrella', async () => {
    await recordPractice({
      packId: 'numeros',
      characterId: 'digit-0',
      completed: true,
      accuracy: 0.9,
    });

    renderAt('#/aprender/numeros/digit-0');

    expect(await screen.findByRole('heading', { level: 1, name: 'El 0' })).toBeInTheDocument();
    const canvas = screen.getByLabelText(/zona para trazar el número 0/i) as HTMLCanvasElement;

    drawStroke(canvas, 0, canvasRect, 'digit-0');

    expect(
      await screen.findByRole('heading', { level: 1, name: '¡Bravo!' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/has completado el 0/i)).toBeInTheDocument();
    expect(screen.getByText('¡Qué bien lo haces!')).toBeInTheDocument();
    expect(screen.queryByText(/has ganado una estrella/i)).not.toBeInTheDocument();
    expect(screen.getByText('Donut')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /colorear mi dibujo/i })).toHaveAttribute(
      'href',
      '#/pizarra/dibujo/number-0/desde/numeros/digit-0',
    );
    expect(screen.getByRole('link', { name: /repetir trazado/i })).toHaveAttribute(
      'href',
      '#/aprender/numeros/digit-0',
    );
    expect(screen.getByRole('link', { name: /siguiente número: 1/i })).toHaveAttribute(
      'href',
      '#/aprender/numeros/digit-1',
    );

    await waitFor(async () => {
      const progress = await loadProgress();
      expect(progress.characters['digit-0']?.completions).toBe(2);
      expect(progress.characters['digit-0']?.starsEarned).toBe(1);
      expect(progress.stars).toBe(1);
    });
  });

  it('ofrece el dibujo correcto para B, G, Ñ y 5', async () => {
    const completed = [
      { packId: 'mayusculas', characterId: 'upper-b', drawing: 'Ballena', href: 'letter-b' },
      { packId: 'mayusculas', characterId: 'upper-g', drawing: 'Gato', href: 'letter-g' },
      { packId: 'mayusculas', characterId: 'upper-ñ', drawing: 'Ñandú', href: 'letter-enye' },
      { packId: 'numeros', characterId: 'digit-5', drawing: 'Cinco globos', href: 'number-5' },
    ];

    for (const item of completed) {
      await recordPractice({
        packId: item.packId,
        characterId: item.characterId,
        completed: true,
        accuracy: 0.88,
      });
    }

    renderAt(traceCompleteHref('mayusculas', 'upper-b'));
    expect(await screen.findByText('Ballena')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /colorear mi dibujo/i })).toHaveAttribute(
      'href',
      '#/pizarra/dibujo/letter-b/desde/mayusculas/upper-b',
    );

    goTo(traceCompleteHref('mayusculas', 'upper-g'));
    expect(await screen.findByText('Gato')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /colorear mi dibujo/i })).toHaveAttribute(
      'href',
      '#/pizarra/dibujo/letter-g/desde/mayusculas/upper-g',
    );

    goTo(traceCompleteHref('mayusculas', 'upper-ñ'));
    expect(await screen.findByText('Ñandú')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /colorear mi dibujo/i })).toHaveAttribute(
      'href',
      '#/pizarra/dibujo/letter-enye/desde/mayusculas/upper-%C3%B1',
    );
    // El catálogo sigue el orden alfabético español: después de la Ñ viene la O.
    expect(screen.getByRole('link', { name: /siguiente letra: o/i })).toHaveAttribute(
      'href',
      '#/aprender/mayusculas/upper-o',
    );

    goTo(traceCompleteHref('numeros', 'digit-5'));
    expect(await screen.findByText('Cinco globos')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /colorear mi dibujo/i })).toHaveAttribute(
      'href',
      '#/pizarra/dibujo/number-5/desde/numeros/digit-5',
    );
  });

  it('recupera los colores guardados y permite volver a la celebración', async () => {
    await recordPractice({
      packId: 'mayusculas',
      characterId: 'upper-a',
      completed: true,
      accuracy: 0.93,
    });
    await saveArtwork({
      ...createEmptyArtwork('letter-a'),
      fills: { body: '#ff9fbe', window: '#cfeaff' },
    });

    renderAt(traceCompleteHref('mayusculas', 'upper-a'));

    const colorLink = await screen.findByRole('link', { name: /colorear mi dibujo/i });
    expect(colorLink).toHaveAttribute(
      'href',
      '#/pizarra/dibujo/letter-a/desde/mayusculas/upper-a',
    );

    goTo('#/pizarra/dibujo/letter-a/desde/mayusculas/upper-a');

    expect(
      await screen.findByRole('group', { name: /lámina para colorear: avión/i }),
    ).toBeInTheDocument();

    const body = document.querySelector('[data-layer="fills"] path[data-region-id="body"]');
    const windowRegion = document.querySelector(
      '[data-layer="fills"] path[data-region-id="window"]',
    );
    expect(body).toHaveAttribute('fill', '#ff9fbe');
    expect(windowRegion).toHaveAttribute('fill', '#cfeaff');

    const back = screen.getByRole('link', { name: 'Volver a la celebración' });
    expect(back).toHaveAttribute('href', '#/aprender/mayusculas/upper-a/completado');

    goTo('#/aprender/mayusculas/upper-a/completado');
    expect(
      await screen.findByRole('heading', { level: 1, name: '¡Bravo!' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /colorear mi dibujo/i })).toBeInTheDocument();
  });

  it('reinicia la sesión al repetir el trazado', async () => {
    await recordPractice({
      packId: 'mayusculas',
      characterId: 'upper-a',
      completed: true,
      accuracy: 0.91,
    });

    renderAt(traceCompleteHref('mayusculas', 'upper-a'));

    const repeatLink = await screen.findByRole('link', { name: /repetir trazado/i });
    expect(repeatLink).toHaveAttribute('href', '#/aprender/mayusculas/upper-a');

    goTo('#/aprender/mayusculas/upper-a');

    expect(await screen.findByRole('heading', { level: 1, name: 'La A' })).toBeInTheDocument();
    expect(screen.getByText(/baja desde la punta hacia la izquierda/i)).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Trazo 1 de 3' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 1, name: '¡Bravo!' })).not.toBeInTheDocument();
  });

  it('avanza al siguiente elemento con una sesión limpia', async () => {
    await recordPractice({
      packId: 'numeros',
      characterId: 'digit-5',
      completed: true,
      accuracy: 0.9,
    });

    renderAt(traceCompleteHref('numeros', 'digit-5'));

    const nextLink = await screen.findByRole('link', { name: /siguiente número: 6/i });
    expect(nextLink).toHaveAttribute('href', '#/aprender/numeros/digit-6');

    goTo('#/aprender/numeros/digit-6');

    expect(await screen.findByRole('heading', { level: 1, name: 'El 6' })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Trazo 1 de 2' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 1, name: '¡Bravo!' })).not.toBeInTheDocument();
  });

  it('ofrece volver al listado al completar el último elemento', async () => {
    await recordPractice({
      packId: 'mayusculas',
      characterId: 'upper-z',
      completed: true,
      accuracy: 0.9,
    });
    await recordPractice({
      packId: 'numeros',
      characterId: 'digit-9',
      completed: true,
      accuracy: 0.9,
    });

    renderAt(traceCompleteHref('mayusculas', 'upper-z'));

    expect(await screen.findByText('Zorro')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /siguiente letra/i })).not.toBeInTheDocument();
    expect(
      screen
        .getAllByRole('link', { name: /volver a las letras/i })
        .every((link) => link.getAttribute('href') === '#/aprender/mayusculas'),
    ).toBe(true);

    goTo(traceCompleteHref('numeros', 'digit-9'));

    expect(await screen.findByText('Nueve corazones')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /siguiente número/i })).not.toBeInTheDocument();
    expect(
      screen
        .getAllByRole('link', { name: /volver a los números/i })
        .every((link) => link.getAttribute('href') === '#/aprender/numeros'),
    ).toBe(true);
  });
});
