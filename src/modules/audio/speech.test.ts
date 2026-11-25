import { describe, expect, it, vi } from 'vitest';
import {
  SPEECH_DEDUPE_MS,
  SPEECH_LANGUAGE,
  SPEECH_PITCH,
  SPEECH_RATE,
  createSpeechPlayer,
  pickSpeechVoice,
  type SpeechHost,
  type SpeechUtteranceLike,
  type SpeechVoiceLike,
} from './speech';
import { SPEECH_ENABLED_STORAGE_KEY } from './speechPreferences';

function voice(name: string, lang: string, isDefault = false): SpeechVoiceLike {
  return { name, lang, default: isDefault };
}

function createUtterance(text: string): SpeechUtteranceLike {
  return {
    text,
    lang: '',
    rate: 1,
    pitch: 1,
    volume: 1,
    voice: null,
    onend: null,
    onerror: null,
  };
}

function createHost(voices: readonly SpeechVoiceLike[]) {
  const spoken: SpeechUtteranceLike[] = [];
  const synth = {
    getVoices: () => voices,
    speak: (utterance: SpeechUtteranceLike) => {
      spoken.push(utterance);
    },
    cancel: vi.fn(),
  };
  const host: SpeechHost = { synth, createUtterance };
  return { host, spoken, synth };
}

describe('voz del dispositivo', () => {
  it('elige la voz española de España y ajusta el ritmo infantil', () => {
    const { host, spoken } = createHost([
      voice('English', 'en-US', true),
      voice('México', 'es-MX'),
      voice('España', 'es-ES'),
    ]);
    const player = createSpeechPlayer({ host, initialEnabled: true });

    expect(player.speak('Vamos a trazar la A.')).toBe(true);

    expect(spoken).toHaveLength(1);
    expect(spoken[0].text).toBe('Vamos a trazar la A.');
    expect(spoken[0].lang).toBe(SPEECH_LANGUAGE);
    expect(spoken[0].rate).toBe(SPEECH_RATE);
    expect(spoken[0].pitch).toBe(SPEECH_PITCH);
    expect(spoken[0].voice?.name).toBe('España');
    expect(player.getSnapshot()).toMatchObject({ speaking: true, available: true });
  });

  it('usa otra voz española o la predeterminada si no existe es-ES', () => {
    expect(
      pickSpeechVoice([voice('English', 'en-US', true), voice('México', 'es-MX')])?.name,
    ).toBe('México');
    expect(pickSpeechVoice([voice('English', 'en-US', true)])?.name).toBe('English');
    expect(pickSpeechVoice([])).toBeNull();
  });

  it('cancela la locución anterior y no solapa frases', () => {
    const { host, spoken, synth } = createHost([voice('España', 'es-ES')]);
    const player = createSpeechPlayer({ host, initialEnabled: true });

    player.speak('Primero.');
    player.speak('Después.');

    expect(spoken).toHaveLength(2);
    expect(spoken[0].text).toBe('Primero.');
    expect(spoken[1].text).toBe('Después.');
    expect(synth.cancel).toHaveBeenCalled();
  });

  it('no repite la misma frase en bucle, pero permite pedirla de nuevo', () => {
    let clock = 0;
    const { host, spoken } = createHost([voice('España', 'es-ES')]);
    const player = createSpeechPlayer({
      host,
      initialEnabled: true,
      now: () => clock,
    });

    expect(player.speak('Sigue los puntitos.')).toBe(true);
    clock += 100;
    expect(player.speak('Sigue los puntitos.')).toBe(false);
    expect(spoken).toHaveLength(1);

    clock += SPEECH_DEDUPE_MS;
    expect(player.speak('Sigue los puntitos.')).toBe(true);
    expect(spoken).toHaveLength(2);

    player.cancel();
    clock += 100;
    expect(player.speak('Sigue los puntitos.')).toBe(true);
    expect(spoken).toHaveLength(3);
  });

  it('respeta la preferencia de voz y la guarda', () => {
    const { host, spoken } = createHost([voice('España', 'es-ES')]);
    const player = createSpeechPlayer({ host, initialEnabled: false });

    expect(player.getSnapshot().enabled).toBe(false);
    expect(player.speak('Hola.')).toBe(false);
    expect(spoken).toHaveLength(0);

    player.setEnabled(true);
    expect(window.localStorage.getItem(SPEECH_ENABLED_STORAGE_KEY)).toBe('true');
    expect(player.speak('Hola.')).toBe(true);
    expect(spoken).toHaveLength(1);

    player.setEnabled(false);
    expect(window.localStorage.getItem(SPEECH_ENABLED_STORAGE_KEY)).toBe('false');
    player.dispose();
  });

  it('no rompe la app si el dispositivo no tiene voz', () => {
    const player = createSpeechPlayer({ host: null, initialEnabled: true });

    expect(player.getSnapshot()).toMatchObject({ available: false, speaking: false });
    expect(player.speak('Hola.')).toBe(false);
    expect(() => player.cancel()).not.toThrow();
  });

  it('termina la locución al recibir un error y permite volver a hablar', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const { host, spoken } = createHost([voice('España', 'es-ES')]);
    const player = createSpeechPlayer({ host, initialEnabled: true });

    player.speak('Hola.');
    spoken[0].onerror?.({ error: 'not-allowed' } as SpeechSynthesisErrorEvent);

    expect(player.getSnapshot().speaking).toBe(false);
    expect(info).toHaveBeenCalled();

    expect(player.speak('Otra vez.')).toBe(true);
    expect(spoken).toHaveLength(2);

    player.dispose();
    info.mockRestore();
  });

  it('marca la locución como terminada al acabar', () => {
    const { host, spoken } = createHost([voice('España', 'es-ES')]);
    const player = createSpeechPlayer({ host, initialEnabled: true });

    player.speak('Hola.');
    spoken[0].onend?.({} as SpeechSynthesisEvent);

    expect(player.getSnapshot().speaking).toBe(false);
  });
});
