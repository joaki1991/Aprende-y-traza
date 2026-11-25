import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AmbientMusicProvider } from './AmbientMusicProvider';
import { createMusicPlayer } from './musicPlayer';
import { MusicToggle } from './MusicToggle';

describe('MusicToggle', () => {
  it('alterna el silencio y refleja siempre el estado real', () => {
    const player = createMusicPlayer();

    render(
      <AmbientMusicProvider player={player}>
        <MusicToggle />
      </AmbientMusicProvider>,
    );

    const button = screen.getByRole('button', { name: 'Silenciar música' });
    expect(button).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(button);

    expect(button).toHaveAccessibleName('Activar música');
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(player.getSnapshot().muted).toBe(true);

    fireEvent.click(button);

    expect(button).toHaveAccessibleName('Silenciar música');
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(player.getSnapshot().muted).toBe(false);
  });
});
