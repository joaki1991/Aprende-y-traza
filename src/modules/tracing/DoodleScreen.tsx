import { Screen } from '@/components/layout/Screen';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { ROUTES } from '@/app/router';
import { DoodleCanvas } from './DoodleCanvas';
import styles from './DoodleScreen.module.css';

export function DoodleScreen() {
  return (
    <Screen className={styles.screen}>
      <ScreenHeader title="Pizarra mágica" backHref={ROUTES.home} backLabel="Volver al inicio" />
      <DoodleCanvas />
    </Screen>
  );
}
