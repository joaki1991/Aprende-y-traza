import { Component, type ErrorInfo, type ReactNode } from 'react';
import { MochiCat } from '@/components/mascots/MochiCat';
import styles from './ErrorBoundary.module.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Última red de seguridad de la interfaz. No envía datos a ningún sitio:
 * solo registra el error en la consola local durante el desarrollo.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[Aprende y Traza] Error inesperado en la interfaz.', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.fallback}>
          <div className={styles.card}>
            <MochiCat className={styles.mascot} />
            <h1>¡Se ha despeinado!</h1>
            <p>Mochi necesita un momento. Vuelve a abrir la app para seguir jugando.</p>
            <button
              type="button"
              className={styles.button}
              onClick={() => window.location.reload()}
            >
              Volver a abrir
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
