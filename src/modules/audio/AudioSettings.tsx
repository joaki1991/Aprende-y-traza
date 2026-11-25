import { useEffect, useRef, useState, type ReactNode } from 'react';
import { MusicIcon, SettingsIcon, SpeechIcon, VolumeIcon } from '@/components/icons/Icons';
import { useSoundEffects, useSpeech } from './audioContext';
import { useAmbientMusic } from './musicContext';
import styles from './AudioSettings.module.css';

interface SoundSwitchProps {
  icon: ReactNode;
  label: string;
  description: string;
  checked: boolean;
  unavailable?: boolean;
  onChange: () => void;
}

function SoundSwitch({
  icon,
  label,
  description,
  checked,
  unavailable = false,
  onChange,
}: SoundSwitchProps) {
  return (
    <div className={styles.row} data-off={checked ? 'false' : 'true'}>
      <span className={styles.rowIcon} aria-hidden="true">
        {icon}
      </span>
      <div className={styles.rowCopy}>
        <strong>{label}</strong>
        <span>{unavailable ? 'No disponible en este dispositivo.' : description}</span>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        className={styles.switch}
        data-on={checked ? 'true' : 'false'}
        disabled={unavailable}
        onClick={onChange}
      >
        <span className={styles.knob} aria-hidden="true" />
      </button>
    </div>
  );
}

/**
 * Ajustes de sonido accesibles desde cualquier pantalla.
 *
 * El botón de música del Sprint 6 sigue funcionando tal cual. Este panel añade
 * los interruptores independientes de efectos y voz sin cambiar la portada ni
 * la distribución principal.
 */
export function AudioSettings() {
  const music = useAmbientMusic();
  const effects = useSoundEffects();
  const speech = useSpeech();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    panelRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className={styles.open}
        aria-label="Ajustes de sonido"
        aria-expanded={open}
        aria-controls="audio-settings-panel"
        title="Ajustes de sonido"
        onClick={() => setOpen((value) => !value)}
      >
        <SettingsIcon width="23" height="23" />
      </button>

      {open ? (
        <div
          className={styles.backdrop}
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) {
              setOpen(false);
            }
          }}
        >
          <div
            id="audio-settings-panel"
            className={styles.panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="audio-settings-title"
            tabIndex={-1}
            ref={panelRef}
          >
            <header className={styles.header}>
              <span className={styles.headerIcon} aria-hidden="true">
                <SettingsIcon width="24" height="24" />
              </span>
              <div>
                <h2 id="audio-settings-title">Sonido</h2>
                <p>Elige lo que quieres oír.</p>
              </div>
            </header>

            <div className={styles.rows}>
              <SoundSwitch
                icon={<MusicIcon width="24" height="24" />}
                label="Música"
                description="Una melodía suave de fondo."
                checked={!music.muted}
                unavailable={music.unavailable}
                onChange={music.toggle}
              />
              <SoundSwitch
                icon={<VolumeIcon width="24" height="24" />}
                label="Efectos"
                description="Campanitas al acertar y celebrar."
                checked={effects.enabled}
                unavailable={!effects.available}
                onChange={effects.toggle}
              />
              <SoundSwitch
                icon={<SpeechIcon width="24" height="24" />}
                label="Voz"
                description="Mochi te lee las instrucciones."
                checked={speech.enabled}
                unavailable={!speech.available}
                onChange={speech.toggle}
              />
            </div>

            <p className={styles.note}>Puedes cambiarlo cuando quieras.</p>

            <button type="button" className={styles.done} onClick={() => setOpen(false)}>
              Listo
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
