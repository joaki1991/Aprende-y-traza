import { Screen } from '@/components/layout/Screen';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { MochiCat } from '@/components/mascots/MochiCat';
import { BigActionLink } from '@/components/ui/BigActionLink';
import { LockIcon } from '@/components/icons/Icons';
import { NotFoundScreen } from '@/app/NotFoundScreen';
import { ROUTES, traceCompleteHref, type TraceOrigin } from '@/app/router';
import { ArtworkBoard } from '@/modules/artworks/ArtworkBoard';
import { PLAYGROUND_ARTWORK_ID } from '@/modules/artworks/artwork.types';
import { getDrawing } from '@/modules/artworks/drawings';
import { useProgress } from '@/modules/progress/progressContext';
import styles from './DoodleScreen.module.css';

interface DoodleScreenProps {
  /** Lámina del catálogo; si falta, se abre la pizarra libre. */
  drawingId?: string;
  /** Origen de la celebración, para que Volver regrese a ella. */
  returnToTrace?: TraceOrigin;
}

export function DoodleScreen({ drawingId, returnToTrace }: DoodleScreenProps) {
  const { progress, status } = useProgress();
  const template = drawingId ? getDrawing(drawingId) : undefined;

  if (drawingId && !template) {
    return <NotFoundScreen />;
  }

  const backHref = template
    ? returnToTrace
      ? traceCompleteHref(returnToTrace.packId, returnToTrace.characterId)
      : ROUTES.rewards
    : ROUTES.home;
  const backLabel = template
    ? returnToTrace
      ? 'Volver a la celebración'
      : 'Volver a recompensas'
    : 'Volver al inicio';
  const unlocked = !template || Boolean(progress.artworks[template.id]);

  return (
    <Screen className={styles.screen}>
      <ScreenHeader
        title={template ? template.name : 'Pizarra mágica'}
        backHref={backHref}
        backLabel={backLabel}
      />

      {status === 'loading' ? (
        <p className={styles.message}>Preparando tu pizarra…</p>
      ) : null}

      {status === 'error' ? (
        <section className={styles.panel}>
          <MochiCat className={styles.mochi} />
          <h2>No podemos abrir tus dibujos</h2>
          <p>Vuelve al inicio e inténtalo otra vez.</p>
          <BigActionLink href={ROUTES.home} accent="sky">
            Volver al inicio
          </BigActionLink>
        </section>
      ) : null}

      {status === 'ready' && !unlocked ? (
        <section className={styles.panel}>
          <span className={styles.lock} aria-hidden="true">
            <LockIcon width="30" height="30" />
          </span>
          <MochiCat className={styles.mochi} />
          <h2>Este dibujo todavía está guardado</h2>
          <p>Completa letras y números para desbloquearlo.</p>
          <BigActionLink href={ROUTES.rewards} accent="lilac">
            Ver mis recompensas
          </BigActionLink>
        </section>
      ) : null}

      {status === 'ready' && unlocked ? (
        <ArtworkBoard
          artworkId={template ? template.id : PLAYGROUND_ARTWORK_ID}
          template={template}
        />
      ) : null}
    </Screen>
  );
}
