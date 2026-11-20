import { StarIcon } from '@/components/icons/Icons';
import { Screen } from '@/components/layout/Screen';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { MochiCat } from '@/components/mascots/MochiCat';
import { ROUTES } from '@/app/router';
import { LESSON_PACKS } from '@/modules/lessons/content';
import { useProgress } from '@/modules/progress/progressContext';
import styles from './ProgressScreen.module.css';

export function ProgressScreen() {
  const { summary, status, refresh } = useProgress();
  const isLoading = status === 'loading';

  return (
    <Screen className={styles.screen}>
      <ScreenHeader title="Mis estrellas" backHref={ROUTES.home} backLabel="Volver al inicio" />

      <section className={styles.starCard} aria-label="Estrellas conseguidas">
        <span className={styles.starBadge} aria-hidden="true">
          <StarIcon width="52" height="52" />
        </span>
        <div className={styles.starCopy}>
          <span className={styles.starLabel}>Estrellas</span>
          <span className={styles.starCount}>{isLoading ? '…' : summary.totalStars}</span>
        </div>
        <span className={styles.sparkle} aria-hidden="true">
          ✦
        </span>
        <span className={`${styles.sparkle} ${styles.sparkleTwo}`} aria-hidden="true">
          ✦
        </span>
      </section>

      {status === 'error' ? (
        <aside className={styles.errorCard} role="alert">
          <p>No pudimos cargar tu progreso, pero puedes seguir jugando.</p>
          <button type="button" className={styles.retry} onClick={refresh}>
            Reintentar
          </button>
        </aside>
      ) : null}

      <section className={styles.pathSection} aria-labelledby="progress-path-title">
        <h2 id="progress-path-title" className={styles.sectionTitle}>
          Tu camino
        </h2>

        <div className={styles.pathList}>
          {LESSON_PACKS.map((pack) => {
            const practiced = summary.practicedByPack[pack.id] ?? 0;
            const total = pack.characters.length;
            const percentage = total > 0 ? Math.round((practiced / total) * 100) : 0;

            return (
              <div className={`${styles.packRow} ${styles[pack.accent]}`} key={pack.id}>
                <span className={styles.packBadge} aria-hidden="true">
                  {pack.badge}
                </span>
                <div className={styles.packInfo}>
                  <div className={styles.packTop}>
                    <span className={styles.packTitle}>{pack.title}</span>
                    <span className={styles.packCount}>
                      {practiced}/{total}
                    </span>
                  </div>
                  <div
                    className={styles.track}
                    role="progressbar"
                    aria-label={`Progreso de ${pack.title}`}
                    aria-valuemin={0}
                    aria-valuemax={total}
                    aria-valuenow={practiced}
                  >
                    <span className={styles.fill} style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <aside className={styles.tip}>
        <MochiCat className={styles.tipMascot} />
        <p>
          {summary.totalStars === 0
            ? 'Cuando termines tus primeros trazos, aquí aparecerán tus estrellas.'
            : '¡Qué bien lo estás haciendo! Cada trazo te hace más fuerte.'}
        </p>
      </aside>
    </Screen>
  );
}
