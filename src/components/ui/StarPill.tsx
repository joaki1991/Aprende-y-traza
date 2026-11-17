import { StarIcon } from '@/components/icons/Icons';
import { ROUTES } from '@/app/router';
import type { ProgressStatus } from '@/modules/progress/progressContext';
import styles from './StarPill.module.css';

interface StarPillProps {
  stars: number;
  status?: ProgressStatus;
}

export function StarPill({ stars, status = 'ready' }: StarPillProps) {
  const isLoading = status === 'loading';
  const label = isLoading
    ? 'Cargando tus estrellas'
    : `${stars} ${stars === 1 ? 'estrella' : 'estrellas'}. Ver mi progreso`;

  return (
    <a className={styles.pill} href={ROUTES.progress} aria-label={label}>
      <StarIcon className={styles.icon} width="20" height="20" />
      <span className={styles.count} aria-hidden="true">
        {isLoading ? '…' : stars}
      </span>
    </a>
  );
}
