import type { ReactNode } from 'react';
import styles from './BigActionLink.module.css';

export type ActionAccent = 'pink' | 'mint' | 'sky' | 'lilac';

interface BigActionLinkProps {
  href: string;
  children: ReactNode;
  icon?: ReactNode;
  accent?: ActionAccent;
}

export function BigActionLink({
  href,
  children,
  icon,
  accent = 'pink',
}: BigActionLinkProps) {
  return (
    <a className={`${styles.action} ${styles[accent]}`} href={href}>
      {icon ? (
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <span>{children}</span>
    </a>
  );
}
