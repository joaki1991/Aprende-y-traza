import { ArrowRightIcon, SparkleIcon } from '@/components/icons/Icons';
import { Screen } from '@/components/layout/Screen';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { MochiCat } from '@/components/mascots/MochiCat';
import { ROUTES, lessonHref } from '@/app/router';
import { LESSON_PACKS } from '@/modules/lessons/content';
import styles from './LearningScreen.module.css';

export function LearningScreen() {
  return (
    <Screen>
      <ScreenHeader title="Aprender" backHref={ROUTES.home} backLabel="Volver al inicio" />

      <p className={styles.intro}>
        <SparkleIcon width="18" height="18" />
        Elige un mundo para descubrir sus letras.
      </p>

      <div className={styles.packs}>
        {LESSON_PACKS.map((pack) => (
          <a
            className={`${styles.pack} ${styles[pack.accent]}`}
            href={lessonHref(pack.id)}
            key={pack.id}
          >
            <span className={styles.badge} aria-hidden="true">
              {pack.badge}
            </span>
            <span className={styles.copy}>
              <span className={styles.title}>{pack.title}</span>
              <span className={styles.description}>
                {pack.description} · {pack.characters.length}{' '}
                {pack.scriptId === 'digits' ? 'números' : 'letras'}
              </span>
            </span>
            <span className={styles.arrow} aria-hidden="true">
              <ArrowRightIcon width="22" height="22" />
            </span>
          </a>
        ))}
      </div>

      <aside className={styles.note}>
        <MochiCat className={styles.noteMascot} />
        <p>Mochi está preparando juegos nuevos. ¡Muy pronto!</p>
      </aside>
    </Screen>
  );
}
