import { HomeIcon } from '@/components/icons/Icons';
import { Screen } from '@/components/layout/Screen';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { MochiCat } from '@/components/mascots/MochiCat';
import { BigActionLink } from '@/components/ui/BigActionLink';
import { ROUTES } from '@/app/router';
import styles from './NotFoundScreen.module.css';

export function NotFoundScreen() {
  return (
    <Screen>
      <ScreenHeader title="¡Ups!" backHref={ROUTES.home} backLabel="Volver al inicio" />
      <section className={styles.card}>
        <MochiCat className={styles.mascot} />
        <h2>Mochi no encuentra esta página</h2>
        <p>Vuelve al inicio para seguir jugando.</p>
        <BigActionLink href={ROUTES.home} accent="lilac" icon={<HomeIcon />}>
          Volver al inicio
        </BigActionLink>
      </section>
    </Screen>
  );
}
