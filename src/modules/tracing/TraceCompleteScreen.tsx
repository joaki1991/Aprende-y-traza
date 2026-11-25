import { ArrowRightIcon, PaletteIcon, StarIcon, UndoIcon } from '@/components/icons/Icons';
import { Screen } from '@/components/layout/Screen';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { MochiCat } from '@/components/mascots/MochiCat';
import { BigActionLink } from '@/components/ui/BigActionLink';
import { NotFoundScreen } from '@/app/NotFoundScreen';
import { characterHref, drawingHref, lessonHref } from '@/app/router';
import { DrawingArtwork } from '@/modules/artworks/DrawingLayers';
import { drawingIdForCharacter, getDrawing } from '@/modules/artworks/drawings';
import { getLessonCharacter, getLessonPack } from '@/modules/lessons/content';
import { hasCharacterTrace } from '@/modules/lessons/traces';
import { useProgress } from '@/modules/progress/progressContext';
import styles from './TraceCompleteScreen.module.css';

interface TraceCompleteScreenProps {
  packId: string;
  characterId: string;
}

/**
 * Celebración posterior a una ronda de trazado.
 *
 * Se llega aquí solo después de completar correctamente una ficha. Las tres
 * acciones están siempre disponibles, se haya desbloqueado el dibujo en esta
 * sesión o en una anterior. Esta pantalla nunca concede estrellas ni modifica
 * el progreso: solo lee el resultado ya registrado por `recordPractice`.
 */
export function TraceCompleteScreen({ packId, characterId }: TraceCompleteScreenProps) {
  const { progress, status } = useProgress();
  const pack = getLessonPack(packId);
  const character = getLessonCharacter(packId, characterId);

  if (!pack || !character) {
    return <NotFoundScreen />;
  }

  const article = pack.scriptId === 'digits' ? 'el' : 'la';
  const listBackLabel =
    pack.scriptId === 'digits' ? 'Volver a los números' : 'Volver a las letras';
  const drawingId = drawingIdForCharacter(pack.id, character.id);
  const drawing = getDrawing(drawingId);

  const index = pack.characters.findIndex((item) => item.id === character.id);
  const nextCharacter =
    index >= 0
      ? pack.characters.slice(index + 1).find((item) => hasCharacterTrace(item.id))
      : undefined;

  const record = progress.characters[character.id];
  const firstCompletion = Boolean(
    record && (record.completions ?? 0) === 1 && record.lastResult === 'completed',
  );
  const artwork = drawingId ? progress.artworks[drawingId] : undefined;
  const drawingJustUnlocked = Boolean(
    firstCompletion && artwork && record && artwork.unlockedAt >= record.lastPracticedAt,
  );

  return (
    <Screen className={styles.screen}>
      <ScreenHeader
        title="¡Bravo!"
        backHref={lessonHref(pack.id)}
        backLabel={listBackLabel}
      />

      <section className={styles.hero} aria-label="Celebración">
        <span className={styles.sparkle} aria-hidden="true">
          ✦
        </span>
        <span className={`${styles.sparkle} ${styles.sparkleTwo}`} aria-hidden="true">
          ✦
        </span>
        <MochiCat className={styles.mochi} />
        <span className={styles.glyph} aria-hidden="true">
          {character.glyph}
        </span>
        <p className={styles.lead}>
          {article === 'el'
            ? `Has completado el ${character.glyph}.`
            : `Has completado la ${character.glyph}.`}
        </p>
        <p className={styles.reward} data-first={firstCompletion ? 'true' : 'false'}>
          {status !== 'ready' ? (
            'Guardando tu progreso…'
          ) : firstCompletion ? (
            <>
              <StarIcon width="18" height="18" />
              {drawingJustUnlocked
                ? '¡Has ganado una estrella y un dibujo nuevo!'
                : '¡Has ganado una estrella!'}
            </>
          ) : (
            '¡Qué bien lo haces!'
          )}
        </p>
      </section>

      {drawing ? (
        <section
          className={styles.drawingCard}
          aria-label={`Dibujo asociado: ${drawing.name}`}
        >
          <div className={styles.drawingArt} aria-hidden="true">
            <DrawingArtwork template={drawing} />
          </div>
          <div className={styles.drawingCopy}>
            <span>Tu dibujo</span>
            <strong>{drawing.name}</strong>
          </div>
        </section>
      ) : null}

      {drawing ? (
        <BigActionLink
          href={drawingHref(drawing.id, { packId: pack.id, characterId: character.id })}
          accent="pink"
          icon={<PaletteIcon />}
        >
          ¡Colorear mi dibujo!
        </BigActionLink>
      ) : null}

      <div className={styles.actions}>
        <a className={`${styles.secondary} ${styles.repeat}`} href={characterHref(pack.id, character.id)}>
          <UndoIcon width="20" height="20" />
          Repetir trazado
        </a>

        {nextCharacter ? (
          <a
            className={`${styles.secondary} ${styles.next}`}
            href={characterHref(pack.id, nextCharacter.id)}
            aria-label={`Siguiente ${article === 'el' ? 'número' : 'letra'}: ${nextCharacter.glyph}`}
          >
            <ArrowRightIcon width="20" height="20" />
            Siguiente
            <span className={styles.nextGlyph} aria-hidden="true">
              {nextCharacter.glyph}
            </span>
          </a>
        ) : (
          <a className={`${styles.secondary} ${styles.next}`} href={lessonHref(pack.id)}>
            {listBackLabel}
          </a>
        )}
      </div>

      <p className={styles.hint}>Puedes colorear, repetir o seguir aprendiendo.</p>
    </Screen>
  );
}
