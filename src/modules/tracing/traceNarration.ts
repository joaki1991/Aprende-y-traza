import type { CharacterTrace } from '@/modules/lessons/lesson.types';
import type { TraceIssue, TraceValidationResult } from './traceValidation';

/**
 * Frases del acompañamiento de Mochi.
 *
 * Son la única fuente de las instrucciones habladas y escritas del ejercicio:
 * la pantalla las muestra y la voz las lee sin duplicar textos ni lógica.
 */

export function traceIntroInstruction(
  trace: CharacterTrace,
  glyph: string,
  article: 'el' | 'la',
): string {
  const stroke = trace.strokes[0];
  return stroke
    ? `Vamos a trazar ${article} ${glyph}. ${stroke.instruction}`
    : `Vamos a trazar ${article} ${glyph}.`;
}

export function traceNextInstruction(trace: CharacterTrace, index: number): string {
  const stroke = trace.strokes[index];
  return stroke ? `Ahora: ${stroke.instruction}` : 'Sigue los puntitos.';
}

export function traceSuccessMessage(trace: CharacterTrace, index: number): string {
  return `¡Muy bien! ${traceNextInstruction(trace, index)}`;
}

export function traceRetryMessage(result: TraceValidationResult): string {
  const issues = new Set<TraceIssue>(result.issues);

  if (issues.has('wrong-order')) {
    return '¡Casi! Primero toca este trazo. Sigue la flecha rosa.';
  }
  if (issues.has('start-too-far')) {
    return '¡Casi! Empieza en el punto verde.';
  }
  if (issues.has('finish-too-far')) {
    return '¡Casi! Sigue los puntitos hasta el final.';
  }
  if (issues.has('backwards')) {
    return '¡Casi! Ve en el sentido de la flecha.';
  }
  if (issues.has('off-path') || issues.has('scribble')) {
    return '¡Casi! Despacito, siguiendo los puntitos.';
  }
  if (issues.has('incomplete')) {
    return '¡Casi! Recorre todos los puntitos.';
  }
  if (issues.has('too-short')) {
    return '¡Casi! Desliza el dedo por el caminito.';
  }
  return '¡Casi! Prueba otra vez. Tú puedes.';
}

export function traceCompletionMessage(glyph: string, article: 'el' | 'la'): string {
  return article === 'el'
    ? `¡Bravo! El ${glyph} está genial.`
    : `¡Bravo! La ${glyph} está preciosa.`;
}

/** Felicitación que se lee al llegar a la pantalla de celebración. */
export function traceCongratulation(glyph: string, article: 'el' | 'la'): string {
  return article === 'el'
    ? `¡Bravo! Has completado el ${glyph}.`
    : `¡Bravo! Has completado la ${glyph}.`;
}
