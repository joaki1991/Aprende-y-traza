import { LockIcon, StarIcon } from '@/components/icons/Icons';
import { Screen } from '@/components/layout/Screen';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { StarPill } from '@/components/ui/StarPill';
import { ROUTES } from '@/app/router';
import { useProgress } from '@/modules/progress/progressContext';
import { StickerArt } from './StickerArt';
import { REWARD_STICKERS, isStickerUnlocked } from './rewards';
import styles from './RewardsScreen.module.css';

export function RewardsScreen() {
  const { summary, status } = useProgress();
  const stars = summary.totalStars;
  const nextSticker = REWARD_STICKERS.find((sticker) => !isStickerUnlocked(sticker, stars));

  return (
    <Screen className={styles.screen}>
      <ScreenHeader title="Sorpresas" backHref={ROUTES.home} backLabel="Volver al inicio" />

      <section className={styles.banner}>
        <div className={styles.bannerCopy}>
          <h2>Tus pegatinas</h2>
          <p>Consigue estrellas y desbloquea sorpresas.</p>
        </div>
        <StarPill stars={stars} status={status} />
      </section>

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
                <span className={styles.lockBadge} aria-hidden="true">
                  <LockIcon width="14" height="14" />
                  <StarIcon width="13" height="13" />
                  <span>{sticker.starsRequired}</span>
                </span>
              ) : null}

              <span className="visually-hidden">
                {unlocked
                  ? 'Desbloqueada'
                  : `Bloqueada. Necesitas ${sticker.starsRequired} estrellas`}
              </span>
            </li>
          );
        })}
      </ul>

      <p className={styles.note}>
        Las estrellas se consiguen con las fichas de trazado. ¡Muy pronto podrás ganar más!
      </p>
    </Screen>
  );
}
