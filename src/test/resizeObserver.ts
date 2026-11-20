/**
 * `ResizeObserver` de prueba.
 *
 * jsdom no implementa `ResizeObserver` ni aplica media queries, así que las
 * pruebas de orientación necesitan una forma controlada de simular el
 * redimensionado de un elemento (por ejemplo, el lienzo al girar el móvil).
 *
 * El doble conserva los observadores activos y expone `triggerResizeObservers`
 * para disparar sus callbacks cuando la prueba cambia el tamaño simulado.
 */

interface ObserverEntry {
  callback: ResizeObserverCallback;
  observer: ResizeObserver;
  targets: Set<Element>;
}

const activeObservers = new Set<ObserverEntry>();

export class ResizeObserverStub implements ResizeObserver {
  private readonly entry: ObserverEntry;

  constructor(callback: ResizeObserverCallback) {
    this.entry = {
      callback,
      observer: this,
      targets: new Set<Element>(),
    };
    activeObservers.add(this.entry);
  }

  observe(target: Element): void {
    this.entry.targets.add(target);
  }

  unobserve(target: Element): void {
    this.entry.targets.delete(target);
  }

  disconnect(): void {
    this.entry.targets.clear();
    activeObservers.delete(this.entry);
  }
}

/**
 * Simula el aviso del navegador tras un cambio de tamaño u orientación.
 * Solo notifica a los observadores que siguen observando algún elemento.
 */
export function triggerResizeObservers(): void {
  for (const entry of [...activeObservers]) {
    if (entry.targets.size === 0) {
      continue;
    }
    entry.callback([], entry.observer);
  }
}

/** Limpia observadores entre pruebas para no arrastrar estado. */
export function resetResizeObservers(): void {
  activeObservers.clear();
}
