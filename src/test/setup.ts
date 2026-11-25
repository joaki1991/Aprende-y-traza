import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import { resetResizeObservers, ResizeObserverStub } from './resizeObserver';

afterEach(() => {
  cleanup();
  resetResizeObservers();
  window.localStorage.clear();
  window.location.hash = '';
});

Object.defineProperty(window, 'scrollTo', {
  configurable: true,
  value: vi.fn(),
});

if (typeof window.ResizeObserver === 'undefined') {
  Object.defineProperty(window, 'ResizeObserver', {
    configurable: true,
    value: ResizeObserverStub,
  });
}

/**
 * jsdom no implementa Canvas 2D. Se ofrece un contexto mínimo para que las
 * pantallas que contienen un lienzo puedan montarse sin ruido en consola.
 * Las pruebas que necesitan comprobar el dibujo sustituyen este doble por uno
 * propio y controlan el tamaño del canvas.
 */
function createCanvasContextStub(): CanvasRenderingContext2D {
  const noop = () => undefined;
  return {
    canvas: null,
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    lineCap: 'round',
    lineJoin: 'round',
    clearRect: noop,
    setTransform: noop,
    beginPath: noop,
    arc: noop,
    fill: noop,
    stroke: noop,
    moveTo: noop,
    lineTo: noop,
  } as unknown as CanvasRenderingContext2D;
}

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  configurable: true,
  value: () => createCanvasContextStub(),
});

/**
 * jsdom no implementa la reproducción de audio. Se silencia con un doble
 * inofensivo; las pruebas de música inyectan su propio reproductor.
 */
Object.defineProperty(HTMLMediaElement.prototype, 'play', {
  configurable: true,
  value: vi.fn(() => Promise.resolve()),
});

Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
  configurable: true,
  value: vi.fn(),
});
