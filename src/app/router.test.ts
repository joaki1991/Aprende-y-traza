import { describe, expect, it } from 'vitest';
import { ROUTES, characterHref, drawingHref, lessonHref, parseRoute, routeKey } from './router';

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

  it('interpreta la ficha de un carácter', () => {
    expect(parseRoute('#/aprender/mayusculas/upper-a')).toEqual({
      name: 'trace',
      packId: 'mayusculas',
      characterId: 'upper-a',
    });
    expect(parseRoute(characterHref('mayusculas', 'upper-a'))).toEqual({
      name: 'trace',
      packId: 'mayusculas',
      characterId: 'upper-a',
    });
  });

  it('abre la pizarra con la plantilla de un dibujo', () => {
    expect(parseRoute(drawingHref('letter-a'))).toEqual({
      name: 'coloring',
      drawingId: 'letter-a',
    });
    expect(parseRoute('#/pizarra/dibujo/number-7')).toEqual({
      name: 'coloring',
      drawingId: 'number-7',
    });
  });

  it('mantiene la pizarra libre si falta el dibujo', () => {
    expect(parseRoute('#/pizarra/dibujo')).toEqual({ name: 'doodle' });
    expect(parseRoute('#/pizarra/dibujo/')).toEqual({ name: 'doodle' });
  });

  it('devuelve una ruta segura para URLs desconocidas', () => {
    expect(parseRoute('#/secreto')).toEqual({ name: 'notFound' });
    expect(parseRoute('#/aprender/mayusculas/upper-a/extra')).toMatchObject({
      name: 'trace',
      characterId: 'upper-a',
    });
  });

  it('expone los enlaces centralizados', () => {
    expect(ROUTES.learning).toBe('#/aprender');
    expect(lessonHref('numeros')).toBe('#/aprender/numeros');
    expect(drawingHref('letter-enye')).toBe('#/pizarra/dibujo/letter-enye');
  });
});

describe('routeKey', () => {
  it('incluye el paquete para reiniciar la pantalla al cambiar de lección', () => {
    expect(routeKey({ name: 'lesson', packId: 'mayusculas' })).toBe('lesson:mayusculas');
    expect(routeKey({ name: 'trace', packId: 'mayusculas', characterId: 'upper-a' })).toBe(
      'trace:mayusculas:upper-a',
    );
    expect(routeKey({ name: 'home' })).toBe('home');
  });

  it('reinicia la pizarra al cambiar de dibujo', () => {
    expect(routeKey({ name: 'coloring', drawingId: 'letter-a' })).toBe('coloring:letter-a');
    expect(routeKey({ name: 'coloring', drawingId: 'letter-b' })).not.toBe(
      routeKey({ name: 'coloring', drawingId: 'letter-a' }),
    );
    expect(routeKey({ name: 'doodle' })).toBe('doodle');
  });
});
