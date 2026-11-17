import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  cleanup();
  window.location.hash = '';
});

Object.defineProperty(window, 'scrollTo', {
  configurable: true,
  value: vi.fn(),
});

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (typeof window.ResizeObserver === 'undefined') {
  Object.defineProperty(window, 'ResizeObserver', {
    configurable: true,
    value: ResizeObserverStub,
  });
}
