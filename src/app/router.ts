/**
 * Rutas internas de la aplicación.
 *
 * Se usa el hash de la URL porque:
 * - funciona sin configuración de servidor (PWA en cualquier subdirectorio),
 * - funciona dentro del WebView de Capacitor,
 * - permite que el botón Atrás de Android navegue entre pantallas.
 */
export interface TraceOrigin {
  packId: string;
  characterId: string;
}

export type AppRoute =
  | { name: 'home' }
  | { name: 'learning' }
  | { name: 'lesson'; packId: string }
  | { name: 'trace'; packId: string; characterId: string }
  | { name: 'traceComplete'; packId: string; characterId: string }
  | { name: 'doodle' }
  | { name: 'coloring'; drawingId: string; returnTrace?: TraceOrigin }
  | { name: 'progress' }
  | { name: 'rewards' }
  | { name: 'notFound' };

export const ROUTES = {
  home: '#/',
  learning: '#/aprender',
  doodle: '#/pizarra',
  progress: '#/progreso',
  rewards: '#/recompensas',
} as const;

export function lessonHref(packId: string): string {
  return `#/aprender/${encodeURIComponent(packId)}`;
}

export function characterHref(packId: string, characterId: string): string {
  return `${lessonHref(packId)}/${encodeURIComponent(characterId)}`;
}

/** Pantalla de celebración al completar una ficha. */
export function traceCompleteHref(packId: string, characterId: string): string {
  return `${characterHref(packId, characterId)}/completado`;
}

/**
 * Abre la pizarra con la plantilla de un dibujo desbloqueado.
 *
 * `returnTrace` conserva el origen para que el botón Volver regrese a la
 * pantalla de finalización en lugar de perder el contexto.
 */
export function drawingHref(drawingId: string, returnTrace?: TraceOrigin): string {
  const base = `${ROUTES.doodle}/dibujo/${encodeURIComponent(drawingId)}`;
  return returnTrace
    ? `${base}/desde/${encodeURIComponent(returnTrace.packId)}/${encodeURIComponent(
        returnTrace.characterId,
      )}`
    : base;
}

/** Convierte un hash (`#/pizarra`) en una ruta tipada. */
export function parseRoute(hash: string): AppRoute {
  const path = normalizePath(hash);

  if (path === '') {
    return { name: 'home' };
  }

  const [first, second, third, fourth, fifth, sixth] = path.split('/');

  switch (first) {
    case 'aprender':
      if (!second) {
        return { name: 'learning' };
      }
      if (third) {
        if (fourth === 'completado') {
          return {
            name: 'traceComplete',
            packId: decodeURIComponent(second),
            characterId: decodeURIComponent(third),
          };
        }
        return {
          name: 'trace',
          packId: decodeURIComponent(second),
          characterId: decodeURIComponent(third),
        };
      }
      return { name: 'lesson', packId: decodeURIComponent(second) };
    case 'pizarra':
      if (second === 'dibujo' && third) {
        if (fourth === 'desde' && fifth && sixth) {
          return {
            name: 'coloring',
            drawingId: decodeURIComponent(third),
            returnTrace: {
              packId: decodeURIComponent(fifth),
              characterId: decodeURIComponent(sixth),
            },
          };
        }
        return { name: 'coloring', drawingId: decodeURIComponent(third) };
      }
      return { name: 'doodle' };
    case 'progreso':
      return { name: 'progress' };
    case 'recompensas':
      return { name: 'rewards' };
    default:
      return { name: 'notFound' };
  }
}

/** Clave estable para reiniciar animaciones o hacer scroll al cambiar de pantalla. */
export function routeKey(route: AppRoute): string {
  if (route.name === 'lesson') {
    return `lesson:${route.packId}`;
  }
  if (route.name === 'trace') {
    return `trace:${route.packId}:${route.characterId}`;
  }
  if (route.name === 'traceComplete') {
    return `trace-complete:${route.packId}:${route.characterId}`;
  }
  if (route.name === 'coloring') {
    return `coloring:${route.drawingId}`;
  }
  return route.name;
}

function normalizePath(hash: string): string {
  const withoutHash = hash.startsWith('#') ? hash.slice(1) : hash;
  const withoutQuery = withoutHash.split('?')[0] ?? '';
  return withoutQuery.replace(/^\/+/, '').replace(/\/+$/, '');
}
