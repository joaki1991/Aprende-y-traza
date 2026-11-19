/**
 * Rutas internas de la aplicación.
 *
 * Se usa el hash de la URL porque:
 * - funciona sin configuración de servidor (PWA en cualquier subdirectorio),
 * - funciona dentro del WebView de Capacitor,
 * - permite que el botón Atrás de Android navegue entre pantallas.
 */
export type AppRoute =
  | { name: 'home' }
  | { name: 'learning' }
  | { name: 'lesson'; packId: string }
  | { name: 'trace'; packId: string; characterId: string }
  | { name: 'doodle' }
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

/** Convierte un hash (`#/pizarra`) en una ruta tipada. */
export function parseRoute(hash: string): AppRoute {
  const path = normalizePath(hash);

  if (path === '') {
    return { name: 'home' };
  }

  const [first, second, third] = path.split('/');

  switch (first) {
    case 'aprender':
      if (!second) {
        return { name: 'learning' };
      }
      if (third) {
        return {
          name: 'trace',
          packId: decodeURIComponent(second),
          characterId: decodeURIComponent(third),
        };
      }
      return { name: 'lesson', packId: decodeURIComponent(second) };
    case 'pizarra':
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
  return route.name;
}

function normalizePath(hash: string): string {
  const withoutHash = hash.startsWith('#') ? hash.slice(1) : hash;
  const withoutQuery = withoutHash.split('?')[0] ?? '';
  return withoutQuery.replace(/^\/+/, '').replace(/\/+$/, '');
}
