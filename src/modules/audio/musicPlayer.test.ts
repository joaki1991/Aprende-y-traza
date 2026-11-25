import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MUSIC_VOLUME, createMusicPlayer } from './musicPlayer';
import { MUSIC_MUTED_STORAGE_KEY } from './musicPreferences';

/**
 * Reproductor falso: imita lo justo de `HTMLAudioElement` que usa el módulo.
 * Así se prueba el ciclo completo sin descargar audio ni depender de jsdom.
 */
class FakeAudioElement extends EventTarget {
  src = '';
  loop = false;
  preload = '';
  volume = 1;
  currentTime = 0;
  paused = true;
  playCalls = 0;
  pauseCalls = 0;

  play = (): Promise<void> => {
    this.playCalls += 1;
    this.paused = false;
    this.dispatchEvent(new Event('playing'));
    return Promise.resolve();
  };

  pause = (): void => {
    this.pauseCalls += 1;
    this.paused = true;
    this.dispatchEvent(new Event('pause'));
  };
}

let created: FakeAudioElement[] = [];
let detach: (() => void) | null = null;

class AudioStub extends FakeAudioElement {
  constructor() {
    super();
    created.push(this);
  }
}

function setHidden(value: boolean): void {
  Object.defineProperty(document, 'hidden', {
    configurable: true,
    value,
  });
}

beforeEach(() => {
  created = [];
  vi.stubGlobal('Audio', AudioStub);
  setHidden(false);
});

afterEach(() => {
  detach?.();
  detach = null;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  setHidden(false);
});

describe('createMusicPlayer', () => {
  it('crea un único audio local, en bucle y con volumen moderado', () => {
    const player = createMusicPlayer();
    detach = player.attach();

    expect(created).toHaveLength(1);
    expect(created[0].loop).toBe(true);
    expect(created[0].volume).toBe(MUSIC_VOLUME);
    expect(created[0].src).toContain('audio/background-music.mp3');
    expect(player.getSnapshot()).toEqual({
      muted: false,
      playing: true,
      unavailable: false,
    });
  });

  it('silencia, guarda la preferencia y reanuda sin reiniciar la canción', () => {
    const player = createMusicPlayer();
    detach = player.attach();

    created[0].currentTime = 37;
    player.setMuted(true);

    expect(player.getSnapshot().muted).toBe(true);
    expect(player.getSnapshot().playing).toBe(false);
    expect(window.localStorage.getItem(MUSIC_MUTED_STORAGE_KEY)).toBe('true');
    expect(created[0].paused).toBe(true);

    player.setMuted(false);

    expect(player.getSnapshot().muted).toBe(false);
    expect(player.getSnapshot().playing).toBe(true);
    expect(window.localStorage.getItem(MUSIC_MUTED_STORAGE_KEY)).toBe('false');
    expect(created[0].currentTime).toBe(37);
    expect(created[0].src).toContain('audio/background-music.mp3');
    expect(created).toHaveLength(1);
  });

  it('respeta el silencio guardado al arrancar y lo reanuda al activarlo', () => {
    window.localStorage.setItem(MUSIC_MUTED_STORAGE_KEY, 'true');
    const player = createMusicPlayer();
    detach = player.attach();

    expect(player.getSnapshot().muted).toBe(true);
    expect(player.getSnapshot().playing).toBe(false);
    expect(created).toHaveLength(0);

    player.setMuted(false);

    expect(created).toHaveLength(1);
    expect(player.getSnapshot().playing).toBe(true);
  });

  it('pausa al ocultar la app y reanuda al volver sin crear otro reproductor', () => {
    const player = createMusicPlayer();
    detach = player.attach();
    expect(player.getSnapshot().playing).toBe(true);

    setHidden(true);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(player.getSnapshot().playing).toBe(false);
    expect(created[0].pauseCalls).toBe(1);

    setHidden(false);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(player.getSnapshot().playing).toBe(true);
    expect(created).toHaveLength(1);
  });

  it('espera a un gesto real si el navegador bloquea la reproducción automática', async () => {
    let attempts = 0;

    class BlockedAudio extends FakeAudioElement {
      play = (): Promise<void> => {
        attempts += 1;
        if (attempts === 1) {
          return Promise.reject(new DOMException('Bloqueado', 'NotAllowedError'));
        }
        this.paused = false;
        this.dispatchEvent(new Event('playing'));
        return Promise.resolve();
      };
    }

    vi.stubGlobal('Audio', BlockedAudio);
    const player = createMusicPlayer();
    detach = player.attach();

    await Promise.resolve();
    await Promise.resolve();
    expect(player.getSnapshot().playing).toBe(false);

    document.dispatchEvent(new Event('pointerdown'));
    await Promise.resolve();

    expect(attempts).toBe(2);
    expect(player.getSnapshot().playing).toBe(true);
  });

  it('no rompe la aplicación si el archivo de música no está disponible', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const player = createMusicPlayer();
    detach = player.attach();

    created[0].dispatchEvent(new Event('error'));

    expect(player.getSnapshot().unavailable).toBe(true);
    expect(player.getSnapshot().playing).toBe(false);
    expect(() => player.setMuted(true)).not.toThrow();
    expect(() => player.setMuted(false)).not.toThrow();
    expect(created).toHaveLength(1);
    expect(info).toHaveBeenCalled();
  });

  it('avisa a los suscriptores solo cuando cambia el estado', () => {
    const player = createMusicPlayer();
    const listener = vi.fn();
    const unsubscribe = player.subscribe(listener);

    detach = player.attach();
    expect(listener).toHaveBeenCalledTimes(1);

    player.setMuted(true);
    const calls = listener.mock.calls.length;
    player.setMuted(true);
    expect(listener).toHaveBeenCalledTimes(calls);

    unsubscribe();
    player.setMuted(false);
    expect(listener).toHaveBeenCalledTimes(calls);
  });

  it('comparte el mismo elemento aunque se conecte más de una vez', () => {
    const player = createMusicPlayer();
    detach = player.attach();
    const second = player.attach();

    expect(created).toHaveLength(1);
    second();
    expect(created[0].paused).toBe(false);
  });
});
