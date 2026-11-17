import type { ReactNode } from 'react';
import { ArrowLeftIcon } from '@/components/icons/Icons';
import styles from './ScreenHeader.module.css';

interface ScreenHeaderProps {
  title: string;
  backHref: string;
  backLabel?: string;
  trailing?: ReactNode;
}

export function ScreenHeader({
  title,
  backHref,
  backLabel = 'Volver',
  trailing,
}: ScreenHeaderProps) {
  return (
    <header className={styles.header}>
      <a className={styles.back} href={backHref} aria-label={backLabel}>
        <ArrowLeftIcon width="26" height="26" />
      </a>
      <h1 className={styles.title}>{title}</h1>
      <div className={styles.trailing}>{trailing}</div>
    </header>
  );
}
