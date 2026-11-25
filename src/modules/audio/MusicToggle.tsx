import { VolumeIcon, VolumeOffIcon } from '@/components/icons/Icons';
import { useAmbientMusic } from './musicContext';
import styles from './MusicToggle.module.css';

/**
 * Botón global de silencio. Vive fuera del router para estar disponible en
 * todas las pantallas y refleja siempre la preferencia y el estado real.
 */
export function MusicToggle() {
  const { muted, unavailable, toggle } = useAmbientMusic();
  const label = unavailable
    ? 'Música no disponible'
    : muted
      ? 'Activar música'
      : 'Silenciar música';
  const iconOff = muted || unavailable;

  return (
    <button
      type="button"
      className={styles.toggle}
      data-state={muted ? 'muted' : 'on'}
      data-unavailable={unavailable ? 'true' : 'false'}
      aria-label={label}
      aria-pressed={!muted}
      title={label}
      onClick={toggle}
    >
      {iconOff ? (
        <VolumeOffIcon width="23" height="23" />
      ) : (
        <VolumeIcon width="23" height="23" />
      )}
    </button>
  );
}
