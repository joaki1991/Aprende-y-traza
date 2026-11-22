import { useState } from 'react';
import { LockIcon, StarIcon } from '@/components/icons/Icons';
import { Screen } from '@/components/layout/Screen';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { StarPill } from '@/components/ui/StarPill';
import { drawingHref, ROUTES } from '@/app/router';
import { DrawingArtwork } from '@/modules/artworks/DrawingLayers';
import { isArtworkColored } from '@/modules/artworks/artwork.types';
import { DRAWINGS, type DrawingTemplate } from '@/modules/artworks/drawings';
import { useProgress } from '@/modules/progress/progressContext';
import { StickerArt } from './StickerArt';
import { REWARD_STICKERS, isStickerUnlocked } from './rewards';
import styles from './RewardsScreen.module.css';

type RewardsTab = 'drawings' | 'stickers';

function lockedHint(drawing: DrawingTemplate): string {
  return drawing.kind === 'number'
    ? `Completa el ${drawing.glyph}`
    : `Completa la ${drawing.glyph}`;
}

export function RewardsScreen() {
  const { progress, summary, status } = useProgress();
  const [tab, setTab] = useState<RewardsTab>('drawings');
  const stars = summary.totalStars;

  const unlockedDrawings = DRAWINGS.filter((drawing) => Boolean(progress.artworks[drawing.id]));
  const unlockedStickers = REWARD_STICKERS.filter((sticker) =>
    isStickerUnlocked(sticker, stars),
  );
  const nextSticker = REWARD_STICKERS.find((sticker) => !isStickerUnlocked(sticker, stars));

  return (
    <Screen className={styles.screen}>
      <ScreenHeader title="Recompensas" backHref={ROUTES.home} backLabel="Volver al inicio" />

      <section className={styles.banner}>
        <div className={styles.bannerCopy}>
          <h2>Tus recompensas</h2>
          <p>Colorea tus dibujos y decora la pizarra.</p>
        </div>
        <StarPill stars={stars} status={status} />
      </section>

      <div className={styles.tabs} role="tablist" aria-label="Tipos de recompensas">
        <button
          type="button"
          role="tab"
          id="tab-drawings"
          aria-selected={tab === 'drawings'}
          aria-controls="panel-drawings"
          className={`${styles.tab} ${tab === 'drawings' ? styles.tabActive : ''}`}
          onClick={() => setTab('drawings')}
        >
          Dibujos
          <span className={styles.tabCount}>
            {unlockedDrawings.length}/{DRAWINGS.length}
          </span>
        </button>
        <button
          type="button"
          role="tab"
          id="tab-stickers"
          aria-selected={tab === 'stickers'}
          aria-controls="panel-stickers"
          className={`${styles.tab} ${tab === 'stickers' ? styles.tabActive : ''}`}
          onClick={() => setTab('stickers')}
        >
          Pegatinas
          <span className={styles.tabCount}>{unlockedStickers.length}</span>
        </button>
      </div>

      {tab === 'drawings' ? (
        <section
          className={styles.panel}
          id="panel-drawings"
          role="tabpanel"
          aria-labelledby="tab-drawings"
        >
          <p className={styles.panelHint}>
            Completa una letra o un número para conseguir un dibujo nuevo.
          </p>

          <ul className={styles.drawingGrid}>
            {DRAWINGS.map((drawing) => {
              const artwork = progress.artworks[drawing.id];
              const unlocked = Boolean(artwork);
              const colored = isArtworkColored(artwork);

              if (unlocked) {
                return (
                  <li className={`${styles.drawingCard} ${styles.unlocked}`} key={drawing.id}>
                    <a
                      className={styles.drawingLink}
                      href={drawingHref(drawing.id)}
                      aria-label={`${colored ? 'Continuar' : 'Colorear'} ${drawing.name}`}
                    >
                      <span className={styles.drawingGlyph} aria-hidden="true">
                        {drawing.glyph}
                      </span>
                      <span className={styles.drawingArt} aria-hidden="true">
                        <DrawingArtwork
                          template={drawing}
                          fills={artwork?.fills}
                          strokes={artwork?.strokes}
                        />
                      </span>
                      <span className={styles.drawingName}>{drawing.name}</span>
                      <span className={styles.drawingState}>
                        {colored ? 'Continuar' : 'Colorear'}
                      </span>
                    </a>
                  </li>
                );
              }

              return (
                <li
                  className={`${styles.drawingCard} ${styles.drawingLocked}`}
                  key={drawing.id}
                  aria-label={`${drawing.name}, bloqueado. ${lockedHint(drawing)}`}
                >
                  <span className={styles.drawingGlyph} aria-hidden="true">
                    {drawing.glyph}
                  </span>
                  <span className={styles.lockBadge} aria-hidden="true">
                    <LockIcon width="14" height="14" />
                  </span>
                  <span className={styles.drawingArt} aria-hidden="true">
                    <DrawingArtwork template={drawing} silhouette />
                  </span>
                  <span className={styles.drawingName}>{drawing.name}</span>
                  <span className={styles.drawingState}>{lockedHint(drawing)}</span>
                </li>
              );
            })}
          </ul>
        </section>
      ) : (
        <section
          className={styles.panel}
          id="panel-stickers"
          role="tabpanel"
          aria-labelledby="tab-stickers"
        >
          <p className={styles.nextGoal} aria-live="polite">
            <LockIcon width="17" height="17" />
            {nextSticker ? (
              <span>
                Te faltan{' '}
                <strong>{Math.max(1, nextSticker.starsRequired - stars)}</strong>{' '}
                {nextSticker.starsRequired - stars === 1 ? 'estrella' : 'estrellas'} para{' '}
                <strong>{nextSticker.name}</strong>
              </span>
            ) : (
              <span>¡Has desbloqueado todas las pegatinas!</span>
            )}
          </p>

          <ul className={styles.grid}>
            {REWARD_STICKERS.map((sticker) => {
              const unlocked = isStickerUnlocked(sticker, stars);

              return (
                <li
                  className={`${styles.sticker} ${unlocked ? styles.unlocked : styles.locked}`}
                  key={sticker.id}
                >
                  <span className={styles.art}>
                    <StickerArt kind={sticker.id} />
                  </span>
                  <span className={styles.name}>{sticker.name}</span>
                  <span className={styles.description}>{sticker.description}</span>

                  {!unlocked ? (
                    <span className={styles.stickerLock} aria-hidden="true">
                      <LockIcon width="14" height="14" />
                      <StarIcon width="13" height="13" />
                      <span>{sticker.starsRequired}</span>
                    </span>
                  ) : null}

                  <span className="visually-hidden">
                    {unlocked
                      ? 'Desbloqueada. Puedes usarla en la pizarra'
                      : `Bloqueada. Necesitas ${sticker.starsRequired} estrellas`}
                  </span>
                </li>
              );
            })}
          </ul>

          <p className={styles.note}>
            Las estrellas se consiguen al completar letras y números. Usa tus pegatinas en la
            pizarra.
          </p>
        </section>
      )}
    </Screen>
  );
}
