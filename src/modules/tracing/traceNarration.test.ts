import { describe, expect, it } from 'vitest';
import { getCharacterTrace } from '@/modules/lessons/traces';
import type { TraceValidationResult } from './traceValidation';
import {
  traceCompletionMessage,
  traceCongratulation,
  traceIntroInstruction,
  traceNextInstruction,
  traceRetryMessage,
  traceSuccessMessage,
} from './traceNarration';

function result(issues: TraceValidationResult['issues']): TraceValidationResult {
  return {
    accepted: false,
    issues,
    targetStrokeId: 'test',
    score: 0,
    metrics: {
      coverage: 0,
      accuracy: 0,
      direction: 0,
      startDistance: 0,
      endDistance: 0,
      startProgress: 0,
      endProgress: 0,
      lengthRatio: 0,
    },
    drawnPoints: 0,
    orderHint: null,
  };
}

describe('frases del ejercicio', () => {
  const trace = getCharacterTrace('upper-a');

  it('reutiliza la instrucción real del primer trazo y el nombre del carácter', () => {
    if (!trace) {
      throw new Error('La A debería tener trazos.');
    }

    expect(traceIntroInstruction(trace, 'A', 'la')).toBe(
      'Vamos a trazar la A. Baja desde la punta hacia la izquierda.',
    );
    expect(traceNextInstruction(trace, 1)).toContain('Vuelve arriba');
    expect(traceSuccessMessage(trace, 1)).toBe(
      '¡Muy bien! Ahora: Vuelve arriba y baja hacia la derecha.',
    );
  });

  it('explica el error concreto sin regañar', () => {
    expect(traceRetryMessage(result(['wrong-order']))).toContain('Primero toca este trazo');
    expect(traceRetryMessage(result(['start-too-far']))).toContain('punto verde');
    expect(traceRetryMessage(result(['finish-too-far']))).toContain('hasta el final');
    expect(traceRetryMessage(result(['backwards']))).toContain('sentido de la flecha');
    expect(traceRetryMessage(result(['off-path']))).toContain('Despacito');
    expect(traceRetryMessage(result(['incomplete']))).toContain('todos los puntitos');
    expect(traceRetryMessage(result(['too-short']))).toContain('Desliza el dedo');
    expect(traceRetryMessage(result([]))).toContain('Tú puedes');
  });

  it('elige el artículo correcto al celebrar letras o números', () => {
    expect(traceCompletionMessage('A', 'la')).toBe('¡Bravo! La A está preciosa.');
    expect(traceCompletionMessage('7', 'el')).toBe('¡Bravo! El 7 está genial.');
    expect(traceCongratulation('A', 'la')).toBe('¡Bravo! Has completado la A.');
    expect(traceCongratulation('7', 'el')).toBe('¡Bravo! Has completado el 7.');
  });
});
