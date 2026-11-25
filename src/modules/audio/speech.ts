import { loadSpeechEnabled, saveSpeechEnabled } from './speechPreferences';

/**
 * Voz del dispositivo mediante `SpeechSynthesis`.
 *
 * No descarga voces ni usa servicios en la nube: solo pide al sistema una voz
 * española local y, si no existe, usa la voz predeterminada. El reproductor es
 * único para toda la app, cancela la locución anterior antes de empezar otra y
 * descarta repeticiones inmediatas para no saturar.
 *
 * Toda la responsabilidad de decidir qué texto se dice vive en las pantallas.
 * El motor de trazado no conoce la voz.
 */

export interface SpeechVoiceLike {
  name: string;
  lang: string;
  default: boolean;
  localService?: boolean;
}

export interface SpeechUtteranceLike {
  text: string;
  lang: string;
  rate: number;
  pitch: number;
  volume: number;
  voice: SpeechVoiceLike | null;
  onend: ((event: SpeechSynthesisEvent) => void) | null;
  onerror: ((event: SpeechSynthesisErrorEvent) => void) | null;
}

export interface SpeechSynthesisLike {
  getVoices(): readonly SpeechVoiceLike[];
  speak(utterance: SpeechUtteranceLike): void;
  cancel(): void;
}

/** Permite inyectar el motor del sistema en pruebas sin tocar el DOM. */
export interface SpeechHost {
  synth: SpeechSynthesisLike;
  createUtterance: (text: string) => SpeechUtteranceLike;
}

export interface SpeechSnapshot {
  /** Preferencia de la persona. */
  enabled: boolean;
  /** El dispositivo ofrece `SpeechSynthesis`. */
  available: boolean;
  /** Hay una locución en curso. */
  speaking: boolean;
}

export interface SpeakOptions {
  /** Repite el mismo texto aunque se acabe de decir. */
  force?: boolean;
}

export interface SpeechPlayer {
  getSnapshot: () => SpeechSnapshot;
  subscribe: (listener: () => void) => () => void;
  /** Devuelve `true` si la locución se ha encolado. */
  speak: (text: string, options?: SpeakOptions) => boolean;
  cancel: () => void;
  setEnabled: (enabled: boolean) => void;
  toggle: () => void;
  dispose: () => void;
}

/** Velocidad y tono pensados para una niña de cuatro años. */
export const SPEECH_RATE = 0.94;
export const SPEECH_PITCH = 1.05;
export const SPEECH_LANGUAGE = 'es-ES';

/** Evita repetir la misma frase si el motor recibe el mismo aviso dos veces. */
export const SPEECH_DEDUPE_MS = 3500;

export function getNativeSpeechHost(): SpeechHost | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const synth = window.speechSynthesis;
  if (!synth || typeof SpeechSynthesisUtterance === 'undefined') {
    return null;
  }

  return {
    synth,
    createUtterance: (text) => new SpeechSynthesisUtterance(text),
  };
}

function isSpanishVoice(voice: SpeechVoiceLike): boolean {
  return /^es([-_]|$)/i.test(voice.lang);
}

function isSpainVoice(voice: SpeechVoiceLike): boolean {
  return /^es[-_]ES/i.test(voice.lang);
}

/**
 * Prefiere una voz española de España; si no la hay, cualquier voz española y,
 * como último recurso, la voz predeterminada del sistema.
 */
export function pickSpeechVoice(
  voices: readonly SpeechVoiceLike[],
): SpeechVoiceLike | null {
  const spanish = voices.filter(isSpanishVoice);
  return (
    spanish.find(isSpainVoice) ??
    spanish[0] ??
    voices.find((voice) => voice.default) ??
    voices[0] ??
    null
  );
}

export interface CreateSpeechPlayerOptions {
  /** `null` simula un dispositivo sin voz; omitido usa el motor nativo. */
  host?: SpeechHost | null;
  /** Solo para pruebas: controla la ventana de repetición. */
  now?: () => number;
  /** Solo para pruebas: evita leer la preferencia guardada. */
  initialEnabled?: boolean;
}

export function createSpeechPlayer(
  options: CreateSpeechPlayerOptions = {},
): SpeechPlayer {
  const listeners = new Set<() => void>();
  const now = options.now ?? (() => Date.now());
  const host = 'host' in options ? options.host ?? null : getNativeSpeechHost();

  let enabled = options.initialEnabled ?? loadSpeechEnabled();
  let available = host !== null;
  let speaking = false;
  let disposed = false;
  let current: SpeechUtteranceLike | null = null;
  let lastText = '';
  let lastSpokenAt = Number.NEGATIVE_INFINITY;

  let snapshot: SpeechSnapshot = { enabled, available, speaking };

  const notify = () => {
    const next: SpeechSnapshot = { enabled, available, speaking };
    if (
      next.enabled === snapshot.enabled &&
      next.available === snapshot.available &&
      next.speaking === snapshot.speaking
    ) {
      return;
    }
    snapshot = next;
    for (const listener of listeners) {
      listener();
    }
  };

  const finish = (utterance: SpeechUtteranceLike) => {
    if (current !== utterance) {
      return;
    }
    current = null;
    speaking = false;
    notify();
  };

  const stopCurrent = () => {
    current = null;
    if (host) {
      try {
        host.synth.cancel();
      } catch {
        // Un motor roto no debe detener la app.
      }
    }
    if (speaking) {
      speaking = false;
      notify();
    }
  };

  const speak = (text: string, speakOptions: SpeakOptions = {}): boolean => {
    const clean = text.trim();
    if (!clean || !enabled || disposed) {
      return false;
    }
    if (!host) {
      if (available) {
        available = false;
        notify();
      }
      return false;
    }

    const timestamp = now();
    if (
      !speakOptions.force &&
      clean === lastText &&
      timestamp - lastSpokenAt < SPEECH_DEDUPE_MS
    ) {
      return false;
    }

    // Nunca se solapan dos locuciones.
    stopCurrent();

    let utterance: SpeechUtteranceLike;
    try {
      utterance = host.createUtterance(clean);
    } catch {
      available = false;
      notify();
      return false;
    }

    let voice: SpeechVoiceLike | null = null;
    try {
      voice = pickSpeechVoice(host.synth.getVoices());
    } catch {
      // Sin lista de voces se intenta la voz predeterminada del sistema.
    }

    utterance.text = clean;
    utterance.lang = SPEECH_LANGUAGE;
    utterance.rate = SPEECH_RATE;
    utterance.pitch = SPEECH_PITCH;
    utterance.volume = 1;
    utterance.voice = voice;
    utterance.onend = () => finish(utterance);
    utterance.onerror = (event) => {
      // Cancelar una locución puede disparar un error benigno.
      if (event?.error !== 'canceled' && event?.error !== 'interrupted') {
        console.info('[Aprende y Traza] La voz no ha podido hablar.');
      }
      finish(utterance);
    };

    current = utterance;
    speaking = true;
    lastText = clean;
    lastSpokenAt = timestamp;
    notify();

    try {
      host.synth.speak(utterance);
    } catch {
      current = null;
      speaking = false;
      available = false;
      notify();
      return false;
    }

    return true;
  };

  const cancel = () => {
    stopCurrent();
    // Permite repetir la misma frase cuando la persona lo pide.
    lastText = '';
    lastSpokenAt = Number.NEGATIVE_INFINITY;
  };

  const setEnabled = (nextEnabled: boolean) => {
    if (nextEnabled === enabled) {
      return;
    }
    enabled = nextEnabled;
    saveSpeechEnabled(nextEnabled);
    if (!nextEnabled) {
      stopCurrent();
    }
    notify();
  };

  return {
    getSnapshot: () => snapshot,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    speak,
    cancel,
    setEnabled,
    toggle: () => setEnabled(!enabled),
    dispose: () => {
      if (disposed) {
        return;
      }
      disposed = true;
      stopCurrent();
      listeners.clear();
    },
  };
}
