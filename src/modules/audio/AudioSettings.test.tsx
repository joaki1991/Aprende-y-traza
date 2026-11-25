import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AmbientMusicProvider } from './AmbientMusicProvider';
import { AudioProvider } from './AudioProvider';
import { AudioSettings } from './AudioSettings';
import { EFFECTS_ENABLED_STORAGE_KEY } from './soundPreferences';
import { SPEECH_ENABLED_STORAGE_KEY } from './speechPreferences';
import {
  createFakeEffectsPlayer,
  createFakeMusicPlayer,
  createFakeSpeechPlayer,
} from '@/test/audioPlayers';

function renderSettings(
  effects = createFakeEffectsPlayer(),
  speech = createFakeSpeechPlayer(),
  music = createFakeMusicPlayer(),
) {
  render(
    <AmbientMusicProvider player={music.player}>
      <AudioProvider effects={effects.player} speech={speech.player}>
        <AudioSettings />
      </AudioProvider>
    </AmbientMusicProvider>,
  );

  return { effects, speech, music };
}

describe('Ajustes de sonido', () => {
  it('muestra interruptores independientes de música, efectos y voz', () => {
    renderSettings();

    fireEvent.click(screen.getByRole('button', { name: 'Ajustes de sonido' }));

    expect(screen.getByRole('dialog', { name: 'Sonido' })).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Música' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(screen.getByRole('switch', { name: 'Efectos' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(screen.getByRole('switch', { name: 'Voz' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('guarda cada preferencia por separado', () => {
    const { effects, speech, music } = renderSettings();
    fireEvent.click(screen.getByRole('button', { name: 'Ajustes de sonido' }));

    fireEvent.click(screen.getByRole('switch', { name: 'Efectos' }));
    expect(screen.getByRole('switch', { name: 'Efectos' })).toHaveAttribute(
      'aria-checked',
      'false',
    );
    expect(window.localStorage.getItem(EFFECTS_ENABLED_STORAGE_KEY)).toBe('false');
    expect(effects.player.getSnapshot().enabled).toBe(false);

    fireEvent.click(screen.getByRole('switch', { name: 'Voz' }));
    expect(window.localStorage.getItem(SPEECH_ENABLED_STORAGE_KEY)).toBe('false');
    expect(speech.player.getSnapshot().enabled).toBe(false);

    fireEvent.click(screen.getByRole('switch', { name: 'Música' }));
    expect(music.player.getSnapshot().muted).toBe(true);
    expect(screen.getByRole('switch', { name: 'Música' })).toHaveAttribute(
      'aria-checked',
      'false',
    );
  });

  it('mantiene la música independiente de efectos y voz', () => {
    const { effects, speech, music } = renderSettings();
    fireEvent.click(screen.getByRole('button', { name: 'Ajustes de sonido' }));

    fireEvent.click(screen.getByRole('switch', { name: 'Efectos' }));
    fireEvent.click(screen.getByRole('switch', { name: 'Voz' }));

    expect(music.player.getSnapshot().muted).toBe(false);
    expect(effects.player.getSnapshot().enabled).toBe(false);
    expect(speech.player.getSnapshot().enabled).toBe(false);
  });

  it('desactiva los controles que el dispositivo no puede ofrecer', () => {
    renderSettings(
      createFakeEffectsPlayer({ available: false }),
      createFakeSpeechPlayer({ available: false }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Ajustes de sonido' }));

    expect(screen.getByRole('switch', { name: 'Efectos' })).toBeDisabled();
    expect(screen.getByRole('switch', { name: 'Voz' })).toBeDisabled();
    expect(screen.getAllByText(/no disponible en este dispositivo/i)).toHaveLength(2);
  });

  it('se cierra con Listo, con Escape y al tocar fuera', () => {
    renderSettings();
    const open = screen.getByRole('button', { name: 'Ajustes de sonido' });

    fireEvent.click(open);
    fireEvent.click(screen.getByRole('button', { name: 'Listo' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(open);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(open);
    const dialog = screen.getByRole('dialog', { name: 'Sonido' });
    fireEvent.pointerDown(dialog.parentElement as HTMLElement);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
