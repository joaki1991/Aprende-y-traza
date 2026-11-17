import { useMemo, useSyncExternalStore } from 'react';
import { parseRoute, type AppRoute } from './router';

function subscribeToHashChange(onChange: () => void): () => void {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}

function getHashSnapshot(): string {
  return window.location.hash;
}

/** Lee la ruta actual del hash y reacciona a los cambios (incluido el botón Atrás). */
export function useAppRoute(): AppRoute {
  const hash = useSyncExternalStore(subscribeToHashChange, getHashSnapshot, () => '');
  return useMemo(() => parseRoute(hash), [hash]);
}
