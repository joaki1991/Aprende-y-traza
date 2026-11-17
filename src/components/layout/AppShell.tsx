import type { ReactNode } from 'react';
import { CloudIcon } from '@/components/icons/Icons';
import styles from './AppShell.module.css';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className={styles.shell}>
      <div className={styles.decorations} aria-hidden="true">
        <svg className={`${styles.cloud} ${styles.cloudOne}`} viewBox="0 0 120 56">
          <path
            d="M28 47h65a16 16 0 0 0 2-31.8A25 25 0 0 0 46 10 21 21 0 0 0 28 47Z"
            fill="#ffffff"
            opacity="0.62"
          />
        </svg>
        <svg className={`${styles.cloud} ${styles.cloudTwo}`} viewBox="0 0 120 56">
          <path
            d="M28 47h65a16 16 0 0 0 2-31.8A25 25 0 0 0 46 10 21 21 0 0 0 28 47Z"
            fill="#ffffff"
            opacity="0.42"
          />
        </svg>
        <span className={`${styles.sparkle} ${styles.sparkleOne}`}>✦</span>
        <span className={`${styles.sparkle} ${styles.sparkleTwo}`}>✦</span>
        <span className={`${styles.sparkle} ${styles.sparkleThree}`}>✦</span>
      </div>

      <main className={styles.content}>{children}</main>

      <footer className={styles.footer}>
        <CloudIcon width="17" height="17" />
        <span>Sin anuncios · Funciona sin internet</span>
      </footer>
    </div>
  );
}
