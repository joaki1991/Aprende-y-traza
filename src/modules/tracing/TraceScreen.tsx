import { useCallback, useEffect, useRef, useState } from 'react';
import { UndoIcon } from '@/components/icons/Icons';
import { Screen } from '@/components/layout/Screen';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { MochiCat } from '@/components/mascots/MochiCat';
import { BigActionLink } from '@/components/ui/BigActionLink';
import { NotFoundScreen } from '@/app/NotFoundScreen';
import { getLessonCharacter, getLessonPack } from '@/modules/lessons/content';
import { getCharacterTrace } from '@/modules/lessons/traces';
import type { CharacterTrace, TracePoint } from '@/modules/lessons/lesson.types';
import { drawingHref, lessonHref } from '@/app/router';
import { DrawingArtwork } from '@/modules/artworks/DrawingLayers';
import { getDrawing } from '@/modules/artworks/drawings';
import { useProgress } from '@/modules/progress/progressContext';
import {
  createTraceSession,
  resetTraceSession,
  submitTraceStroke,
  traceSessionAccuracy,
  type TraceSessionState,
} from './traceSession';
import type { TraceIssue, TraceValidationResult } from './traceValidation';
import { TraceCanvas } from './TraceCanvas';
import { TraceGuide } from './TraceGuide';
import styles from './TraceScreen.module.css';

interface TraceScreenProps {
  packId: string;
  characterId: string;
}

type FeedbackKind = 'idle' | 'success' | 'retry' | 'complete';

interface Feedback {
  kind: FeedbackKind;
  message: string;
}

const ADVANCE_DELAY_MS = 800;
const RETRY_DELAY_MS = 900;

function firstInstruction(trace: CharacterTrace, glyph: string, article: 'el' | 'la'): string {
  const stroke = trace.strokes[0];
  return stroke
    ? `Vamos a trazar ${article} ${glyph}. ${stroke.instruction}`
    : `Vamos a trazar ${article} ${glyph}.`;
}

function nextInstruction(trace: CharacterTrace, index: number): string {
  const stroke = trace.strokes[index];
  return stroke ? `Ahora: ${stroke.instruction}` : 'Sigue los puntitos.';
}

function retryMessage(result: TraceValidationResult): string {
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

export function TraceScreen({ packId, characterId }: TraceScreenProps) {
  const pack = getLessonPack(packId);
  const character = getLessonCharacter(packId, characterId);
  const trace = getCharacterTrace(characterId);
  const { recordPractice } = useProgress();
  const article: 'el' | 'la' = pack?.scriptId === 'digits' ? 'el' : 'la';

  const [session, setSession] = useState<TraceSessionState>(() =>
    trace ? createTraceSession(trace) : createTraceSessionForEmpty(),
  );
  const [feedback, setFeedback] = useState<Feedback>(() => ({
    kind: 'idle',
    message: trace && character ? firstInstruction(trace, character.glyph, article) : '',
  }));
  const [locked, setLocked] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [pulseKey, setPulseKey] = useState(0);
  const timerRef = useRef<number | null>(null);
  const completionRecordedRef = useRef(false);
  const partialRecordedRef = useRef(false);
  const mountedRef = useRef(true);
  const [rewardDrawingId, setRewardDrawingId] = useState<string | null>(null);
  const rewardButtonRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (rewardDrawingId) {
      rewardButtonRef.current?.focus();
    }
  }, [rewardDrawingId]);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => clearTimer, [clearTimer]);

  if (!pack || !character) {
    return <NotFoundScreen />;
  }

  if (!trace) {
    return (
      <Screen>
        <ScreenHeader
          title={character.glyph}
          backHref={lessonHref(pack.id)}
          backLabel="Volver a las letras"
        />
        <aside className={styles.preparing}>
          <MochiCat className={styles.preparingMochi} />
          <div>
            <h2>¡Muy pronto!</h2>
            <p>
              {article === 'el'
                ? `La ficha del ${character.glyph} todavía se está preparando.`
                : `La ficha de la ${character.glyph} todavía se está preparando.`}
            </p>
          </div>
        </aside>
        <BigActionLink href={lessonHref(pack.id)} accent="sky">
          Volver a las letras
        </BigActionLink>
      </Screen>
    );
  }

  const currentStroke = trace.strokes[session.currentStrokeIndex];
  const rewardDrawing = rewardDrawingId ? getDrawing(rewardDrawingId) : undefined;
  const stepsLabel = session.completed
    ? 'Ejercicio completado'
    : `Trazo ${Math.min(session.currentStrokeIndex + 1, trace.strokes.length)} de ${
        trace.strokes.length
      }`;

  const recordIncompleteRound = () => {
    if (
      !session.completed &&
      session.completedStrokes > 0 &&
      !partialRecordedRef.current
    ) {
      partialRecordedRef.current = true;
      void recordPractice({
        packId: pack.id,
        characterId: character.id,
        attempts: 1,
        completed: false,
        accuracy: traceSessionAccuracy(session),
      });
    }
  };

  const handleStrokeEnd = (points: TracePoint[]) => {
    if (locked || session.completed || points.length === 0) {
      return;
    }

    const submission = submitTraceStroke(session, trace, points);
    const result = submission.result;
    if (!result) {
      return;
    }

    clearTimer();
    setSession(submission.state);

    if (!result.accepted) {
      setLocked(true);
      setPulseKey((key) => key + 1);
      setFeedback({ kind: 'retry', message: retryMessage(result) });
      void recordPractice({
        packId: pack.id,
        characterId: character.id,
        attempts: 1,
        completed: false,
        accuracy: result.score,
      });
      timerRef.current = window.setTimeout(() => {
        setLocked(false);
        setResetKey((key) => key + 1);
        timerRef.current = null;
      }, RETRY_DELAY_MS);
      return;
    }

    if (submission.state.completed) {
      setLocked(true);
      setFeedback({
        kind: 'complete',
        message:
          article === 'el'
            ? `¡Bravo! El ${character.glyph} está genial.`
            : `¡Bravo! La ${character.glyph} está preciosa.`,
      });
      if (!completionRecordedRef.current) {
        completionRecordedRef.current = true;
        void recordPractice({
          packId: pack.id,
          characterId: character.id,
          attempts: 1,
          completed: true,
          accuracy: traceSessionAccuracy(submission.state),
        }).then((summary) => {
          if (summary?.newDrawingId && mountedRef.current) {
            setRewardDrawingId(summary.newDrawingId);
          }
        });
      }
      return;
    }

    setLocked(true);
    setFeedback({
      kind: 'success',
      message: `¡Muy bien! ${nextInstruction(trace, submission.state.currentStrokeIndex)}`,
    });
    timerRef.current = window.setTimeout(() => {
      setLocked(false);
      setResetKey((key) => key + 1);
      setPulseKey((key) => key + 1);
      setFeedback({
        kind: 'idle',
        message: nextInstruction(trace, submission.state.currentStrokeIndex),
      });
      timerRef.current = null;
    }, ADVANCE_DELAY_MS);
  };

  const handleRepeat = () => {
    clearTimer();
    recordIncompleteRound();
    completionRecordedRef.current = false;
    partialRecordedRef.current = false;
    setSession(resetTraceSession(trace));
    setFeedback({ kind: 'idle', message: firstInstruction(trace, character.glyph, article) });
    setLocked(false);
    setResetKey((key) => key + 1);
    setPulseKey((key) => key + 1);
  };

  return (
    <Screen className={styles.screen}>
      <ScreenHeader
        title={`${article === 'el' ? 'El' : 'La'} ${character.glyph}`}
        backHref={lessonHref(pack.id)}
        backLabel="Volver a las letras"
      />

      <section className={styles.coach} aria-label="Instrucciones de Mochi">
        <MochiCat className={styles.mochi} />
        <div className={styles.bubble}>
          <strong>Mochi</strong>
          <p
            className={styles.message}
            role="status"
            aria-live="polite"
            data-kind={feedback.kind}
          >
            {feedback.message}
          </p>
        </div>
      </section>

      <ol className={styles.steps} aria-label={stepsLabel}>
        {trace.strokes.map((stroke, index) => {
          const state =
            index < session.completedStrokes
              ? 'completed'
              : index === session.currentStrokeIndex && !session.completed
                ? 'current'
                : 'pending';

          return (
            <li
              key={stroke.id}
              className={styles.step}
              data-state={state}
              aria-label={`Trazo ${index + 1}: ${stroke.label}${
                state === 'completed' ? ', completado' : ''
              }`}
            >
              {state === 'completed' ? '✓' : index + 1}
            </li>
          );
        })}
      </ol>

      <div className={styles.stage}>
        <div className={styles.board} data-feedback={feedback.kind}>
          <TraceGuide
            trace={trace}
            currentStrokeIndex={session.completed ? trace.strokes.length : session.currentStrokeIndex}
            pulseKey={pulseKey}
          />
          <TraceCanvas
            trace={trace}
            glyph={character.glyph}
            disabled={locked || session.completed}
            resetKey={resetKey}
            onStrokeEnd={handleStrokeEnd}
          />

          {session.completed ? (
            <div className={styles.celebration} role="status">
              <span className={styles.sparkle} aria-hidden="true">
                ✦
              </span>
              <span className={`${styles.sparkle} ${styles.sparkleTwo}`} aria-hidden="true">
                ✦
              </span>
              <MochiCat className={styles.celebrationMochi} />
              <h2>¡Bravo!</h2>
              <p>
                {article === 'el'
                  ? `El ${character.glyph} está genial.`
                  : `La ${character.glyph} está preciosa.`}
              </p>
              <button type="button" className={styles.again} onClick={handleRepeat}>
                Otra vez
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <p className={styles.currentHint}>
        {currentStroke ? `Trazo ${currentStroke.order}: ${currentStroke.label}` : '¡Completado!'}
      </p>

      <div className={styles.actions}>
        <button type="button" className={styles.repeat} onClick={handleRepeat}>
          <UndoIcon width="22" height="22" />
          Repetir
        </button>
        <a
          className={styles.back}
          href={lessonHref(pack.id)}
          onClick={recordIncompleteRound}
        >
          Volver
        </a>
      </div>

      {rewardDrawing ? (
        <div
          className={styles.rewardOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-drawing-title"
        >
          <div className={styles.rewardCard}>
            <span className={styles.rewardSparkle} aria-hidden="true">
              ✦
            </span>
            <span
              className={`${styles.rewardSparkle} ${styles.rewardSparkleTwo}`}
              aria-hidden="true"
            >
              ✦
            </span>
            <div className={styles.rewardArt} aria-hidden="true">
              <DrawingArtwork template={rewardDrawing} />
            </div>
            <h2 id="new-drawing-title">¡Muy bien!</h2>
            <p>
              Has conseguido un nuevo dibujo: <strong>{rewardDrawing.name}</strong>.
            </p>
            <a
              ref={rewardButtonRef}
              className={styles.rewardPrimary}
              href={drawingHref(rewardDrawing.id)}
            >
              ¡Quiero colorearlo!
            </a>
            <button
              type="button"
              className={styles.rewardSecondary}
              onClick={() => setRewardDrawingId(null)}
            >
              Seguir aprendiendo
            </button>
          </div>
        </div>
      ) : null}
    </Screen>
  );
}

function createTraceSessionForEmpty(): TraceSessionState {
  return createTraceSession({ characterId: '', viewBox: '0 0 100 140', strokes: [] });
}
