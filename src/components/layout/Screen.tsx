import type { ReactNode } from 'react';
import styles from './Screen.module.css';

interface ScreenProps {
  children: ReactNode;
  className?: string;
}

/** Envoltorio común para todas las pantallas: espaciado y entrada suave. */
export function Screen({ children, className }: ScreenProps) {
  return <div className={[styles.screen, className].filter(Boolean).join(' ')}>{children}</div>;
}
