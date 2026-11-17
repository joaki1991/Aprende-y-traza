import type { ReactNode } from 'react';
import styles from './BigTile.module.css';

export type TileAccent = 'sky' | 'mint' | 'butter' | 'lilac';

interface BigTileProps {
  href: string;
  label: string;
  hint: string;
  accent: TileAccent;
  icon: ReactNode;
}

/** Botón grande de navegación, pensado para dedos pequeños y lectura mínima. */
export function BigTile({ href, label, hint, accent, icon }: BigTileProps) {
  return (
    <a className={`${styles.tile} ${styles[accent]}`} href={href}>
      <span className={styles.icon} aria-hidden="true">
        {icon}
      </span>
      <span className={styles.label}>{label}</span>
      <span className={styles.hint}>{hint}</span>
    </a>
  );
}
