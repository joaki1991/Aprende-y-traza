import { useCallback, useEffect, useRef, useState } from 'react';
import { UndoIcon } from '@/components/icons/Icons';
import { Screen } from '@/components/layout/Screen';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { MochiCat } from '@/components/mascots/MochiCat';
import { BigActionLink } from '@/components/ui/BigActionLink';
import { NotFoundScreen } from '@/app/NotFoundScreen';
import { getLessonCharacter, getLessonPack } from '@/modules/lessons/content';
import { getCharacterTrace } from '@/modules/lessons/traces';
import type { TracePoint } from '@/modules/lessons/lesson.types';
import { lessonHref, traceCompleteHref } from '@/app/router';
import { useProgress } from '@/modules/progress/progressContext';
import { useSoundEffects, useSpeech } from '@/modules/audio/audioContext';
import {
  createTraceSession,
  resetTraceSession,
  submitTraceStroke,
  traceSessionAccuracy,
  type TraceSessionState,
} from './traceSession';
import {
  traceCompletionMessage,
  traceIntroInstruction,
  traceNextInstruction,
  traceRetryMessage,
  traceSuccessMessage,
} from './traceNarration';
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

export function TraceScreen({ packId, characterId }: TraceScreenProps) {
  const pack = getLessonPack(packId);
  const character = getLessonCharacter(packId, characterId);
  const trace = getCharacterTrace(characterId);
  const { recordPractice } = useProgress();
  const { play: playEffect } = useSoundEffects();
  const { speak, cancel: cancelSpeech } = useSpeech();
  const article: 'el' | 'la' = pack?.scriptId === 'digits' ? 'el' : 'la';
  const introMessage =
    trace && character ? traceIntroInstruction(trace, character.glyph, article) : '';

  const [session, setSession] = useState<TraceSessionState>(() =>
    trace ? createTraceSession(trace) : createTraceSessionForEmpty(),
  );
  const [feedback, setFeedback] = useState<Feedback>(() => ({
    kind: 'idle',
    message: introMessage,
  }));
  const [locked, setLocked] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [pulseKey, setPulseKey] = useState(0);
  const timerRef = useRef<number | null>(null);
  const completionRecordedRef = useRef(false);
  const partialRecordedRef = useRef(false);
  const roundRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => clearTimer, [clearTimer]);

  useEffect(() => {
    if (!introMessage) {
      return;
    }
    speak(introMessage);
    return () => cancelSpeech();
  }, [introMessage, speak, cancelSpeech]);

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
      const message = traceRetryMessage(result);
      setLocked(true);
      setPulseKey((key) => key + 1);
      setFeedback({ kind: 'retry', message });
      speak(message);
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
      cancelSpeech();
      playEffect('victory');
      setLocked(true);
      setFeedback({
        kind: 'complete',
        message: traceCompletionMessage(character.glyph, article),
      });
      if (!completionRecordedRef.current) {
        completionRecordedRef.current = true;
        const round = roundRef.current;
        void recordPractice({
          packId: pack.id,
          characterId: character.id,
          attempts: 1,
          completed: true,
          accuracy: traceSessionAccuracy(submission.state),
        }).then((summary) => {
          // La celebración sigue sonando aunque esta pantalla se sustituya.
          if (summary?.starEarned) {
            playEffect('star');
          }
          if (summary?.newDrawingId) {
            playEffect('unlock');
          }
          // Si la niña pulsa Repetir mientras se guarda, no debe saltar a la
          // pantalla de finalización de la ronda anterior.
          if (mountedRef.current && roundRef.current === round) {
            window.location.hash = traceCompleteHref(pack.id, character.id);
          }
        });
      }
      return;
    }

    const successMessage = traceSuccessMessage(trace, submission.state.currentStrokeIndex);
    playEffect('step');
    speak(successMessage);
    setLocked(true);
    setFeedback({ kind: 'success', message: successMessage });
    timerRef.current = window.setTimeout(() => {
      setLocked(false);
      setResetKey((key) => key + 1);
      setPulseKey((key) => key + 1);
      setFeedback({
        kind: 'idle',
        message: traceNextInstruction(trace, submission.state.currentStrokeIndex),
      });
      timerRef.current = null;
    }, ADVANCE_DELAY_MS);
  };

  const handleRepeat = () => {
    clearTimer();
    recordIncompleteRound();
    roundRef.current += 1;
    completionRecordedRef.current = false;
    partialRecordedRef.current = false;
    setSession(resetTraceSession(trace));
    setFeedback({ kind: 'idle', message: introMessage });
    setLocked(false);
    setResetKey((key) => key + 1);
    setPulseKey((key) => key + 1);
    cancelSpeech();
    speak(introMessage);
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
              <p>¡Bravo! Preparando tu dibujo…</p>
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
    </Screen>
  );
}

function createTraceSessionForEmpty(): TraceSessionState {
  return createTraceSession({ characterId: '', viewBox: '0 0 100 140', strokes: [] });
}
