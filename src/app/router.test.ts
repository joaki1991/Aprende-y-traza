import { describe, expect, it } from 'vitest';
import { ROUTES, lessonHref, parseRoute, routeKey } from './router';

describe('parseRoute', () => {
  it('interpreta la portada con hash vacío o raíz', () => {
    expect(parseRoute('')).toEqual({ name: 'home' });
    expect(parseRoute('#/')).toEqual({ name: 'home' });
  });

  it('reconoce todas las pantallas principales', () => {
    expect(parseRoute('#/aprender')).toEqual({ name: 'learning' });
    expect(parseRoute('#/pizarra')).toEqual({ name: 'doodle' });
    expect(parseRoute('#/progreso')).toEqual({ name: 'progress' });
    expect(parseRoute('#/recompensas')).toEqual({ name: 'rewards' });
  });

  it('extrae y decodifica el paquete de una lección', () => {
    expect(parseRoute('#/aprender/mayusculas')).toEqual({
      name: 'lesson',
      packId: 'mayusculas',
    });
    expect(parseRoute(lessonHref('ñandú'))).toEqual({ name: 'lesson', packId: 'ñandú' });
  });

  it('tolera barras finales y parámetros de consulta', () => {
    expect(parseRoute('#/pizarra/?modo=libre')).toEqual({ name: 'doodle' });
  });

  it('devuelve una ruta segura para URLs desconocidas', () => {
    expect(parseRoute('#/secreto')).toEqual({ name: 'notFound' });
    expect(parseRoute('#/aprender/mayusculas/extra')).toMatchObject({ name: 'lesson' });
  });

  it('expone los enlaces centralizados', () => {
    expect(ROUTES.learning).toBe('#/aprender');
    expect(lessonHref('numeros')).toBe('#/aprender/numeros');
  });
});

describe('routeKey', () => {
  it('incluye el paquete para reiniciar la pantalla al cambiar de lección', () => {
    expect(routeKey({ name: 'lesson', packId: 'mayusculas' })).toBe('lesson:mayusculas');
    expect(routeKey({ name: 'home' })).toBe('home');
  });
});
