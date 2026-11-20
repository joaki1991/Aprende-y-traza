import { ROUTES } from '@/app/router';
import { GiftIcon, PaletteIcon, PencilIcon, SparkleIcon, StarIcon } from '@/components/icons/Icons';
import { Screen } from '@/components/layout/Screen';
import { MochiCat } from '@/components/mascots/MochiCat';
import { BigTile } from '@/components/ui/BigTile';
import { StarPill } from '@/components/ui/StarPill';
import { useProgress } from '@/modules/progress/progressContext';
import styles from './HomeScreen.module.css';

export function HomeScreen() {
  const { summary, status } = useProgress();

  return (
    <Screen className={styles.screen}>
      <header className={styles.topbar}>
        <span className={styles.brand}>
          <SparkleIcon width="17" height="17" />
          Aprende y Traza
        </span>
        <StarPill stars={summary.totalStars} status={status} />
      </header>

      <section className={styles.hero} aria-labelledby="home-title">
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>¡Hola, peque!</span>
          <h1 id="home-title" className={styles.title}>
            ¿Jugamos a <span>trazar</span>?
          </h1>
          <p className={styles.subtitle}>Soy Mochi y te ayudo a aprender.</p>
        </div>

        <div className={styles.mascotWrap}>
          <span className={styles.bubble} aria-hidden="true">
            ¡Vamos!
          </span>
          <MochiCat className={styles.mascot} />
        </div>
      </section>

      <section className={styles.menu} aria-label="Elige una actividad">
        <BigTile
          href={ROUTES.learning}
          label="Aprender"
          hint="Letras y números"
          accent="sky"
          icon={<PencilIcon />}
        />
        <BigTile
          href={ROUTES.doodle}
          label="Pizarra"
          hint="Dibuja libremente"
          accent="mint"
          icon={<PaletteIcon />}
        />
        <BigTile
          href={ROUTES.progress}
          label="Estrellas"
          hint="Mira tu progreso"
          accent="butter"
          icon={<StarIcon />}
        />
        <BigTile
          href={ROUTES.rewards}
          label="Sorpresas"
          hint="Gana pegatinas"
          accent="lilac"
          icon={<GiftIcon />}
        />
      </section>
    </Screen>
  );
}
