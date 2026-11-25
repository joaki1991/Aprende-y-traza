import { loadEffectsEnabled, saveEffectsEnabled } from './soundPreferences';

/**
 * Efectos de sonido sintetizados con Web Audio.
 *
 * No se usan archivos ni muestras externas: cada efecto es una pequeña
 * secuencia de notas generada en el dispositivo. Así no hay licencias que
 * revisar, no se descarga nada y los sonidos funcionan sin conexión.
 *
 * El reproductor es único para toda la app. Los efectos se encolan y nunca se
 * pisan: si la victoria está sonando, la estrella o el desbloqueo esperan su
 * turno. Los pasos sutiles se descartan cuando ya hay música de celebración.
 */

export type SoundEffect = 'victory' | 'star' | 'unlock' | 'step';

export interface SoundEffectNote {
  frequency: number;
  /** Segundos desde el inicio del efecto. */
  at: number;
  /** Duración de la nota en segundos. */
  duration: number;
  gain: number;
  type?: OscillatorType;
}

export interface SoundEffectPattern {
  duration: number;
  priority: number;
  notes: readonly SoundEffectNote[];
}

/**
 * Patrones originales en Do mayor. Las campanitas usan senos con armónicos
 * suaves para que suenen dulces, nunca estridentes.
 */
export const SOUND_EFFECTS: Record<SoundEffect, SoundEffectPattern> = {
  victory: {
    duration: 0.86,
    priority: 3,
    notes: [
      { frequency: 523.25, at: 0, duration: 0.55, gain: 0.3 },
      { frequency: 659.25, at: 0.09, duration: 0.55, gain: 0.28 },
      { frequency: 783.99, at: 0.18, duration: 0.55, gain: 0.26 },
      { frequency: 1046.5, at: 0.27, duration: 0.59, gain: 0.32 },
    ],
  },
  star: {
    duration: 0.46,
    priority: 2,
    notes: [
      { frequency: 1318.51, at: 0, duration: 0.32, gain: 0.24 },
      { frequency: 1975.53, at: 0.1, duration: 0.36, gain: 0.2 },
    ],
  },
  unlock: {
    duration: 0.72,
    priority: 2,
    notes: [
      { frequency: 783.99, at: 0, duration: 0.42, gain: 0.22 },
      { frequency: 987.77, at: 0.08, duration: 0.44, gain: 0.22 },
      { frequency: 1174.66, at: 0.16, duration: 0.46, gain: 0.22 },
      { frequency: 1567.98, at: 0.24, duration: 0.48, gain: 0.24 },
    ],
  },
  step: {
    duration: 0.14,
    priority: 1,
    notes: [{ frequency: 880, at: 0, duration: 0.12, gain: 0.14 }],
  },
};

/** Interfaz mínima de Web Audio que necesita el reproductor. */
export interface SoundAudioParam {
  value: number;
  setValueAtTime(value: number, time: number): void;
  exponentialRampToValueAtTime(value: number, time: number): void;
}

export interface SoundAudioNode {
  connect(destination: SoundAudioNode): unknown;
}

export interface SoundGainNode extends SoundAudioNode {
  gain: SoundAudioParam;
  disconnect(): void;
}

export interface SoundOscillatorNode extends SoundAudioNode {
  type: OscillatorType;
  frequency: SoundAudioParam;
  start(when: number): void;
  stop(when: number): void;
  onended: ((event: Event) => void) | null;
}

export interface SoundAudioContext {
  currentTime: number;
  state: AudioContextState;
  destination: SoundAudioNode;
  createGain(): SoundGainNode;
  createOscillator(): SoundOscillatorNode;
  resume(): Promise<void>;
  close(): Promise<void>;
}

export interface SoundEffectsSnapshot {
  /** Preferencia del usuario. */
  enabled: boolean;
  /** El navegador puede crear un contexto de audio. */
  available: boolean;
}

export interface SoundEffectsPlayer {
  getSnapshot: () => SoundEffectsSnapshot;
  subscribe: (listener: () => void) => () => void;
  play: (effect: SoundEffect) => void;
  setEnabled: (enabled: boolean) => void;
  toggle: () => void;
  /** Milisegundos que quedan de la cola de efectos. */
  remainingMs: () => number;
  dispose: () => void;
}

interface AudioWindow extends Window {
  webkitAudioContext?: typeof AudioContext;
}

const MASTER_VOLUME = 0.42;
const DUPLICATE_WINDOW_SECONDS = 0.35;
const MAX_QUEUED_SECONDS = 4;

export function createNativeAudioContext(): SoundAudioContext | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const Context = window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
  if (!Context) {
    return null;
  }

  try {
    return new Context();
  } catch {
    return null;
  }
}

function isAudioAvailable(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return Boolean(window.AudioContext ?? (window as AudioWindow).webkitAudioContext);
}

export interface CreateSoundEffectsOptions {
  /** Inyectable en pruebas; en producción se usa Web Audio nativo. */
  createContext?: () => SoundAudioContext | null;
  /** Solo para pruebas: evita leer la preferencia guardada. */
  initialEnabled?: boolean;
}

export function createSoundEffectsPlayer(
  options: CreateSoundEffectsOptions = {},
): SoundEffectsPlayer {
  const listeners = new Set<() => void>();
  const createContext = options.createContext ?? createNativeAudioContext;

  let enabled = options.initialEnabled ?? loadEffectsEnabled();
  let available = Boolean(options.createContext) || isAudioAvailable();
  let snapshot: SoundEffectsSnapshot = { enabled, available };

  let context: SoundAudioContext | null = null;
  let master: SoundGainNode | null = null;
  let busyUntil = 0;
  let disposed = false;
  const lastPlayed = new Map<SoundEffect, number>();
  const activeOscillators = new Set<SoundOscillatorNode>();

  const notify = () => {
    const next: SoundEffectsSnapshot = { enabled, available };
    if (next.enabled === snapshot.enabled && next.available === snapshot.available) {
      return;
    }
    snapshot = next;
    for (const listener of listeners) {
      listener();
    }
  };

  const ensureContext = (): SoundAudioContext | null => {
    if (disposed) {
      return null;
    }
    if (context) {
      return context;
    }

    const created = createContext();
    if (!created) {
      if (available) {
        available = false;
        notify();
      }
      return null;
    }

    context = created;
    master = created.createGain();
    master.gain.value = MASTER_VOLUME;
    master.connect(created.destination);
    return context;
  };

  const stopAll = () => {
    if (!context) {
      return;
    }
    const now = context.currentTime;
    for (const oscillator of activeOscillators) {
      try {
        oscillator.stop(now);
      } catch {
        // Ya estaba detenido.
      }
    }
    activeOscillators.clear();
    busyUntil = now;
  };

  const scheduleNote = (
    audioContext: SoundAudioContext,
    destination: SoundAudioNode,
    note: SoundEffectNote,
    when: number,
  ) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = note.type ?? 'sine';
    oscillator.frequency.setValueAtTime(note.frequency, when);

    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(note.gain, when + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + note.duration);

    oscillator.connect(gain);
    gain.connect(destination);
    oscillator.start(when);
    oscillator.stop(when + note.duration + 0.02);

    activeOscillators.add(oscillator);
    oscillator.onended = () => {
      activeOscillators.delete(oscillator);
      try {
        gain.disconnect();
      } catch {
        // El nodo ya estaba desconectado.
      }
    };
  };

  const play = (effect: SoundEffect) => {
    if (!enabled || disposed) {
      return;
    }

    const audioContext = ensureContext();
    if (!audioContext || !master) {
      return;
    }

    if (audioContext.state === 'suspended') {
      void audioContext.resume().catch(() => undefined);
    }

    const now = audioContext.currentTime;
    const pattern = SOUND_EFFECTS[effect];
    const last = lastPlayed.get(effect);
    if (last !== undefined && now - last < DUPLICATE_WINDOW_SECONDS) {
      return;
    }

    const waiting = Math.max(0, busyUntil - now);
    if (waiting > MAX_QUEUED_SECONDS) {
      return;
    }
    if (pattern.priority <= 1 && waiting > 0.15) {
      // Un pasito nunca interrumpe una celebración.
      return;
    }

    lastPlayed.set(effect, now);
    const start = Math.max(now, busyUntil);

    try {
      for (const note of pattern.notes) {
        scheduleNote(audioContext, master, note, start + note.at);
      }
    } catch {
      available = false;
      notify();
      return;
    }

    busyUntil = start + pattern.duration;
  };

  const setEnabled = (nextEnabled: boolean) => {
    if (nextEnabled === enabled) {
      return;
    }
    enabled = nextEnabled;
    saveEffectsEnabled(nextEnabled);
    if (!nextEnabled) {
      stopAll();
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
    play,
    setEnabled,
    toggle: () => setEnabled(!enabled),
    remainingMs: () => {
      if (!enabled || !context) {
        return 0;
      }
      return Math.max(0, Math.round((busyUntil - context.currentTime) * 1000));
    },
    dispose: () => {
      if (disposed) {
        return;
      }
      disposed = true;
      stopAll();
      listeners.clear();
      if (context) {
        void context.close().catch(() => undefined);
        context = null;
        master = null;
      }
    },
  };
}
