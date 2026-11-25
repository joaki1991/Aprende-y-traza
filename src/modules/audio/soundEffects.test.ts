import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  SOUND_EFFECTS,
  createSoundEffectsPlayer,
  type SoundAudioContext,
  type SoundOscillatorNode,
} from './soundEffects';
import { EFFECTS_ENABLED_STORAGE_KEY } from './soundPreferences';

interface FakeOscillator extends SoundOscillatorNode {
  startAt: number;
  frequencies: number[];
}

function createAudioStub() {
  const oscillators: FakeOscillator[] = [];
  let currentTime = 0;

  const context: SoundAudioContext = {
    get currentTime() {
      return currentTime;
    },
    state: 'running',
    destination: { connect: () => undefined },
    createGain: () => ({
      gain: {
        value: 0,
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: () => undefined,
      disconnect: vi.fn(),
    }),
    createOscillator: () => {
      const frequencies: number[] = [];
      const oscillator: FakeOscillator = {
        type: 'sine',
        frequency: {
          value: 0,
          setValueAtTime: (value) => {
            frequencies.push(value);
          },
          exponentialRampToValueAtTime: vi.fn(),
        },
        connect: () => undefined,
        start: (when) => {
          oscillator.startAt = when;
        },
        stop: vi.fn(),
        onended: null,
        startAt: 0,
        frequencies,
      };
      oscillators.push(oscillator);
      return oscillator;
    },
    resume: () => Promise.resolve(),
    close: () => Promise.resolve(),
  };

  return {
    context,
    oscillators,
    advance(seconds: number) {
      currentTime += seconds;
    },
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('efectos de sonido', () => {
  it('mantiene la victoria entre medio segundo y dos segundos', () => {
    expect(SOUND_EFFECTS.victory.duration).toBeGreaterThanOrEqual(0.5);
    expect(SOUND_EFFECTS.victory.duration).toBeLessThanOrEqual(2);
    expect(SOUND_EFFECTS.star.duration).toBeGreaterThan(0);
    expect(SOUND_EFFECTS.unlock.duration).toBeGreaterThan(0);
  });

  it('programa la victoria y no deja que un pasito la interrumpa', () => {
    const stub = createAudioStub();
    const player = createSoundEffectsPlayer({
      createContext: () => stub.context,
      initialEnabled: true,
    });

    player.play('victory');
    expect(stub.oscillators).toHaveLength(SOUND_EFFECTS.victory.notes.length);
    expect(stub.oscillators[0].startAt).toBe(0);
    expect(player.remainingMs()).toBeGreaterThan(500);

    player.play('step');
    expect(stub.oscillators).toHaveLength(SOUND_EFFECTS.victory.notes.length);

    player.dispose();
  });

  it('encola estrella y desbloqueo sin superponerlos', () => {
    const stub = createAudioStub();
    const player = createSoundEffectsPlayer({
      createContext: () => stub.context,
      initialEnabled: true,
    });

    player.play('victory');
    const victoryNotes = stub.oscillators.length;
    stub.advance(SOUND_EFFECTS.victory.duration + 0.01);
    player.play('star');
    player.play('unlock');

    const starNotes = stub.oscillators.slice(victoryNotes, victoryNotes + 2);
    const unlockNotes = stub.oscillators.slice(victoryNotes + 2);
    expect(starNotes).toHaveLength(SOUND_EFFECTS.star.notes.length);
    expect(unlockNotes).toHaveLength(SOUND_EFFECTS.unlock.notes.length);
    expect(starNotes[0].startAt).toBeGreaterThanOrEqual(SOUND_EFFECTS.victory.duration);
    expect(unlockNotes[0].startAt).toBeGreaterThan(starNotes[0].startAt);

    player.dispose();
  });

  it('no suena si los efectos están desactivados y guarda la preferencia', () => {
    const stub = createAudioStub();
    const player = createSoundEffectsPlayer({
      createContext: () => stub.context,
      initialEnabled: true,
    });

    player.setEnabled(false);
    expect(window.localStorage.getItem(EFFECTS_ENABLED_STORAGE_KEY)).toBe('false');
    expect(player.getSnapshot().enabled).toBe(false);

    player.play('victory');
    expect(stub.oscillators).toHaveLength(0);

    player.setEnabled(true);
    player.play('victory');
    expect(stub.oscillators.length).toBe(SOUND_EFFECTS.victory.notes.length);

    player.dispose();
  });

  it('descarta la misma campanita repetida en un instante', () => {
    const stub = createAudioStub();
    const player = createSoundEffectsPlayer({
      createContext: () => stub.context,
      initialEnabled: true,
    });

    player.play('star');
    const firstCount = stub.oscillators.length;
    player.play('star');
    expect(stub.oscillators).toHaveLength(firstCount);

    player.dispose();
  });

  it('sigue funcionando si el dispositivo no ofrece Web Audio', () => {
    const player = createSoundEffectsPlayer({
      createContext: () => null,
      initialEnabled: true,
    });

    expect(() => player.play('victory')).not.toThrow();
    expect(player.getSnapshot().available).toBe(false);
    expect(player.remainingMs()).toBe(0);

    player.dispose();
  });
});
