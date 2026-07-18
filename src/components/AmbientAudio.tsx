import { useCallback, useEffect, useRef, useState } from "react";

const BPM = 74;
const BEAT_LENGTH = 60 / BPM;
const BAR_LENGTH = BEAT_LENGTH * 4;
const SCHEDULE_INTERVAL_MS = 90;
const SCHEDULE_AHEAD_SECONDS = 0.4;

const VOLUME_KEY = "spirit-terminal-midnight-radio-volume";
const DEFAULT_VOLUME = 0.34;

interface AudioEngine {
  context: AudioContext;
  master: GainNode;
  musicBus: GainNode;
  drumBus: GainNode;
  noiseBuffer: AudioBuffer;
  timer: number;
  nextBarTime: number;
  barIndex: number;
}

interface Chord {
  notes: number[];
  bass: number;
}

/**
 * A minor-inspired progression:
 * Am9 → Fmaj7 → Cmaj7 → G6
 */
const CHORD_PROGRESSION: Chord[] = [
  {
    notes: [220, 261.63, 329.63, 392, 493.88],
    bass: 55,
  },
  {
    notes: [174.61, 220, 261.63, 329.63],
    bass: 43.65,
  },
  {
    notes: [130.81, 196, 246.94, 329.63],
    bass: 65.41,
  },
  {
    notes: [196, 246.94, 293.66, 329.63],
    bass: 49,
  },
];

const MELODY_PATTERNS = [
  [
    { beat: 1.5, frequency: 659.25 },
    { beat: 2.3, frequency: 587.33 },
    { beat: 3.4, frequency: 493.88 },
  ],
  [],
  [
    { beat: 0.8, frequency: 523.25 },
    { beat: 1.6, frequency: 493.88 },
    { beat: 2.7, frequency: 392 },
    { beat: 3.35, frequency: 440 },
  ],
  [],
];

function getSavedVolume(): number {
  if (typeof window === "undefined") {
    return DEFAULT_VOLUME;
  }

  const savedValue = window.localStorage.getItem(VOLUME_KEY);

  if (!savedValue) {
    return DEFAULT_VOLUME;
  }

  const parsedValue = Number(savedValue);

  if (!Number.isFinite(parsedValue)) {
    return DEFAULT_VOLUME;
  }

  return Math.min(1, Math.max(0, parsedValue));
}

function getMasterVolume(value: number): number {
  if (value <= 0) {
    return 0.0001;
  }

  return 0.05 + Math.pow(value, 1.25) * 0.65;
}

function createNoiseBuffer(
  context: AudioContext,
  durationSeconds = 2,
): AudioBuffer {
  const frameCount = Math.ceil(context.sampleRate * durationSeconds);
  const buffer = context.createBuffer(1, frameCount, context.sampleRate);
  const channel = buffer.getChannelData(0);

  for (let index = 0; index < frameCount; index += 1) {
    channel[index] = Math.random() * 2 - 1;
  }

  return buffer;
}

function createReverbImpulse(
  context: AudioContext,
  durationSeconds = 1.9,
  decay = 2.8,
): AudioBuffer {
  const frameCount = Math.ceil(context.sampleRate * durationSeconds);
  const impulse = context.createBuffer(2, frameCount, context.sampleRate);

  for (let channelIndex = 0; channelIndex < 2; channelIndex += 1) {
    const channel = impulse.getChannelData(channelIndex);

    for (let index = 0; index < frameCount; index += 1) {
      const envelope = Math.pow(1 - index / frameCount, decay);
      channel[index] = (Math.random() * 2 - 1) * envelope;
    }
  }

  return impulse;
}

function playRhodesChord(
  engine: AudioEngine,
  startTime: number,
  chord: Chord,
): void {
  const { context, musicBus } = engine;

  const filter = context.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1550, startTime);
  filter.Q.setValueAtTime(0.55, startTime);

  const chordGain = context.createGain();
  chordGain.gain.setValueAtTime(0.0001, startTime);
  chordGain.gain.exponentialRampToValueAtTime(0.17, startTime + 0.1);
  chordGain.gain.exponentialRampToValueAtTime(0.075, startTime + 1.1);
  chordGain.gain.exponentialRampToValueAtTime(
    0.0001,
    startTime + BAR_LENGTH * 0.94,
  );

  filter.connect(chordGain);
  chordGain.connect(musicBus);

  chord.notes.forEach((frequency, noteIndex) => {
    const sine = context.createOscillator();
    const triangle = context.createOscillator();
    const sineGain = context.createGain();
    const triangleGain = context.createGain();

    sine.type = "sine";
    triangle.type = "triangle";

    sine.frequency.setValueAtTime(frequency, startTime);
    triangle.frequency.setValueAtTime(frequency, startTime);
    triangle.detune.setValueAtTime(noteIndex % 2 === 0 ? 5 : -5, startTime);

    sineGain.gain.setValueAtTime(0.12 / chord.notes.length, startTime);
    triangleGain.gain.setValueAtTime(0.045 / chord.notes.length, startTime);

    sine.connect(sineGain);
    triangle.connect(triangleGain);
    sineGain.connect(filter);
    triangleGain.connect(filter);

    sine.start(startTime);
    triangle.start(startTime);
    sine.stop(startTime + BAR_LENGTH);
    triangle.stop(startTime + BAR_LENGTH);
  });
}

function playBassNote(
  engine: AudioEngine,
  startTime: number,
  frequency: number,
  duration = BEAT_LENGTH * 1.45,
): void {
  const { context, musicBus } = engine;

  const oscillator = context.createOscillator();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, startTime);

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(190, startTime);

  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(0.048, startTime + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(musicBus);

  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.05);
}

function playElectricKey(
  engine: AudioEngine,
  startTime: number,
  frequency: number,
): void {
  const { context, musicBus } = engine;

  const oscillator = context.createOscillator();
  const harmonic = context.createOscillator();
  const oscillatorGain = context.createGain();
  const harmonicGain = context.createGain();
  const outputGain = context.createGain();
  const filter = context.createBiquadFilter();

  oscillator.type = "sine";
  harmonic.type = "triangle";

  oscillator.frequency.setValueAtTime(frequency, startTime);
  harmonic.frequency.setValueAtTime(frequency * 2, startTime);

  oscillatorGain.gain.setValueAtTime(0.75, startTime);
  harmonicGain.gain.setValueAtTime(0.12, startTime);

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(2300, startTime);

  outputGain.gain.setValueAtTime(0.0001, startTime);
  outputGain.gain.exponentialRampToValueAtTime(0.042, startTime + 0.025);
  outputGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.9);

  oscillator.connect(oscillatorGain);
  harmonic.connect(harmonicGain);
  oscillatorGain.connect(filter);
  harmonicGain.connect(filter);
  filter.connect(outputGain);
  outputGain.connect(musicBus);

  oscillator.start(startTime);
  harmonic.start(startTime);
  oscillator.stop(startTime + 1);
  harmonic.stop(startTime + 1);
}

function playMelodyNote(
  engine: AudioEngine,
  startTime: number,
  frequency: number,
): void {
  const { context, musicBus } = engine;

  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const filter = context.createBiquadFilter();
  const delay = context.createDelay(1);
  const feedback = context.createGain();
  const delayGain = context.createGain();

  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(frequency, startTime);
  oscillator.detune.setValueAtTime(-3, startTime);

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(2100, startTime);

  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(0.03, startTime + 0.08);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.75);

  delay.delayTime.setValueAtTime(BEAT_LENGTH * 0.75, startTime);
  feedback.gain.setValueAtTime(0.18, startTime);
  delayGain.gain.setValueAtTime(0.28, startTime);

  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(musicBus);
  gain.connect(delay);
  delay.connect(delayGain);
  delayGain.connect(musicBus);
  delay.connect(feedback);
  feedback.connect(delay);

  oscillator.start(startTime);
  oscillator.stop(startTime + 0.85);
}

function playKick(engine: AudioEngine, startTime: number): void {
  const { context, drumBus } = engine;

  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(82, startTime);
  oscillator.frequency.exponentialRampToValueAtTime(48, startTime + 0.16);

  gain.gain.setValueAtTime(0.035, startTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.22);

  oscillator.connect(gain);
  gain.connect(drumBus);

  oscillator.start(startTime);
  oscillator.stop(startTime + 0.24);
}

function playRim(engine: AudioEngine, startTime: number): void {
  const { context, drumBus, noiseBuffer } = engine;

  const noise = context.createBufferSource();
  const bandpass = context.createBiquadFilter();
  const highpass = context.createBiquadFilter();
  const gain = context.createGain();

  noise.buffer = noiseBuffer;

  bandpass.type = "bandpass";
  bandpass.frequency.setValueAtTime(1750, startTime);
  bandpass.Q.setValueAtTime(1.7, startTime);

  highpass.type = "highpass";
  highpass.frequency.setValueAtTime(650, startTime);

  gain.gain.setValueAtTime(0.028, startTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.09);

  noise.connect(bandpass);
  bandpass.connect(highpass);
  highpass.connect(gain);
  gain.connect(drumBus);

  noise.start(startTime, Math.random() * 1.5, 0.1);
}

function playHat(
  engine: AudioEngine,
  startTime: number,
  accented = false,
): void {
  const { context, drumBus, noiseBuffer } = engine;

  const noise = context.createBufferSource();
  const highpass = context.createBiquadFilter();
  const gain = context.createGain();

  noise.buffer = noiseBuffer;

  highpass.type = "highpass";
  highpass.frequency.setValueAtTime(6200, startTime);

  gain.gain.setValueAtTime(accented ? 0.009 : 0.005, startTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.045);

  noise.connect(highpass);
  highpass.connect(gain);
  gain.connect(drumBus);

  noise.start(startTime, Math.random() * 1.5, 0.05);
}

function playVinylCrackle(engine: AudioEngine, startTime: number): void {
  const { context, drumBus, noiseBuffer } = engine;

  const noise = context.createBufferSource();
  const highpass = context.createBiquadFilter();
  const gain = context.createGain();

  noise.buffer = noiseBuffer;

  highpass.type = "highpass";
  highpass.frequency.setValueAtTime(3200, startTime);

  gain.gain.setValueAtTime(0.0035, startTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.035);

  noise.connect(highpass);
  highpass.connect(gain);
  gain.connect(drumBus);

  noise.start(startTime, Math.random() * 1.5, 0.04);
}

function scheduleBar(
  engine: AudioEngine,
  startTime: number,
  barIndex: number,
): void {
  const progressionIndex = barIndex % CHORD_PROGRESSION.length;
  const chord = CHORD_PROGRESSION[progressionIndex];

  playRhodesChord(engine, startTime, chord);

  playBassNote(engine, startTime + BEAT_LENGTH * 0.05, chord.bass);
  playBassNote(
    engine,
    startTime + BEAT_LENGTH * 2.5,
    chord.bass * 1.5,
    BEAT_LENGTH,
  );

  playElectricKey(
    engine,
    startTime + BEAT_LENGTH * 0.2,
    chord.notes[1] ?? chord.notes[0],
  );

  playElectricKey(
    engine,
    startTime + BEAT_LENGTH * 2.65,
    chord.notes[2] ?? chord.notes[0],
  );

  playKick(engine, startTime);
  playKick(engine, startTime + BEAT_LENGTH * 2.75);

  playRim(engine, startTime + BEAT_LENGTH);
  playRim(engine, startTime + BEAT_LENGTH * 3);

  for (let step = 0; step < 8; step += 1) {
    const swing = step % 2 === 1 ? BEAT_LENGTH * 0.055 : 0;

    playHat(
      engine,
      startTime + BEAT_LENGTH * 0.5 * step + swing,
      step === 3 || step === 7,
    );
  }

  const melody = MELODY_PATTERNS[progressionIndex];

  melody.forEach((note) => {
    playMelodyNote(engine, startTime + note.beat * BEAT_LENGTH, note.frequency);
  });

  playVinylCrackle(engine, startTime + BEAT_LENGTH * 0.65);
  playVinylCrackle(engine, startTime + BEAT_LENGTH * 2.2);
}

function runScheduler(engine: AudioEngine): void {
  const scheduleLimit =
    engine.context.currentTime + SCHEDULE_AHEAD_SECONDS;

  while (engine.nextBarTime < scheduleLimit) {
    scheduleBar(engine, engine.nextBarTime, engine.barIndex);
    engine.nextBarTime += BAR_LENGTH;
    engine.barIndex += 1;
  }
}

function destroyEngine(engine: AudioEngine): void {
  window.clearInterval(engine.timer);

  const now = engine.context.currentTime;

  engine.master.gain.cancelScheduledValues(now);
  engine.master.gain.setValueAtTime(
    Math.max(engine.master.gain.value, 0.0001),
    now,
  );
  engine.master.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

  window.setTimeout(() => {
    if (engine.context.state !== "closed") {
      void engine.context.close();
    }
  }, 420);
}

export function AmbientAudio() {
  const engineRef = useRef<AudioEngine | null>(null);

  const [enabled, setEnabled] = useState(false);
  const [volume, setVolume] = useState(getSavedVolume);
  const [audioError, setAudioError] = useState<string | null>(null);

  const updateVolume = useCallback((nextVolume: number) => {
    const safeVolume = Math.min(1, Math.max(0, nextVolume));

    setVolume(safeVolume);
    window.localStorage.setItem(VOLUME_KEY, String(safeVolume));

    const engine = engineRef.current;

    if (!engine) {
      return;
    }

    const now = engine.context.currentTime;
    const target = getMasterVolume(safeVolume);

    engine.master.gain.cancelScheduledValues(now);
    engine.master.gain.setTargetAtTime(target, now, 0.08);
  }, []);

  const stopAudio = useCallback(() => {
    const engine = engineRef.current;

    if (engine) {
      destroyEngine(engine);
      engineRef.current = null;
    }

    setEnabled(false);
  }, []);

  const startAudio = useCallback(async () => {
    try {
      setAudioError(null);

      const AudioContextConstructor: typeof AudioContext | undefined =
        window.AudioContext ??
        (window as Window & {
          webkitAudioContext?: typeof AudioContext;
        }).webkitAudioContext;

      if (!AudioContextConstructor) {
        throw new Error("This browser does not support Web Audio.");
      }

      if (engineRef.current) {
        destroyEngine(engineRef.current);
        engineRef.current = null;
      }

      const context = new AudioContextConstructor();

      if (context.state === "suspended") {
        await context.resume();
      }

      const master = context.createGain();
      const musicBus = context.createGain();
      const drumBus = context.createGain();
      const compressor = context.createDynamicsCompressor();
      const reverb = context.createConvolver();
      const reverbGain = context.createGain();

      reverb.buffer = createReverbImpulse(context);
      reverbGain.gain.setValueAtTime(0.17, context.currentTime);
      musicBus.gain.setValueAtTime(0.88, context.currentTime);
      drumBus.gain.setValueAtTime(0.72, context.currentTime);

      compressor.threshold.setValueAtTime(-18, context.currentTime);
      compressor.knee.setValueAtTime(20, context.currentTime);
      compressor.ratio.setValueAtTime(4, context.currentTime);
      compressor.attack.setValueAtTime(0.008, context.currentTime);
      compressor.release.setValueAtTime(0.24, context.currentTime);

      master.gain.setValueAtTime(0.0001, context.currentTime);
      master.gain.exponentialRampToValueAtTime(
        getMasterVolume(volume),
        context.currentTime + 1.1,
      );

      musicBus.connect(master);
      musicBus.connect(reverb);
      reverb.connect(reverbGain);
      reverbGain.connect(master);
      drumBus.connect(master);
      master.connect(compressor);
      compressor.connect(context.destination);

      const engine: AudioEngine = {
        context,
        master,
        musicBus,
        drumBus,
        noiseBuffer: createNoiseBuffer(context),
        timer: 0,
        nextBarTime: context.currentTime + 0.08,
        barIndex: 0,
      };

      engine.timer = window.setInterval(() => {
        runScheduler(engine);
      }, SCHEDULE_INTERVAL_MS);

      engineRef.current = engine;
      runScheduler(engine);
      setEnabled(true);
    } catch (error) {
      console.error("Unable to start Midnight Radio:", error);

      const message =
        error instanceof Error ? error.message : "Audio could not be started.";

      setAudioError(message);
      setEnabled(false);
    }
  }, [volume]);

  const toggle = useCallback(() => {
    if (enabled) {
      stopAudio();
      return;
    }

    void startAudio();
  }, [enabled, startAudio, stopAudio]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const engine = engineRef.current;

      if (!engine) {
        return;
      }

      if (document.hidden) {
        void engine.context.suspend();
      } else if (enabled) {
        void engine.context.resume();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled]);

  useEffect(() => {
    return () => {
      const engine = engineRef.current;

      if (engine) {
        window.clearInterval(engine.timer);

        if (engine.context.state !== "closed") {
          void engine.context.close();
        }

        engineRef.current = null;
      }
    };
  }, []);

  return (
    <div
      className={`audio-control${enabled ? " playing" : ""}${
        audioError ? " audio-error" : ""
      }`}
    >
      <button
        type="button"
        onClick={toggle}
        aria-pressed={enabled}
        aria-label={
          enabled
            ? "Pause Midnight Radio background music"
            : "Play Midnight Radio background music"
        }
      >
        <span className="audio-icon" aria-hidden="true">
          {enabled ? "Ⅱ" : "▶"}
        </span>

        <span className="audio-label">
          <b>MIDNIGHT RADIO</b>
          <small>
            {audioError
              ? "Audio unavailable — click to retry"
              : enabled
                ? "Late-night coding mix playing"
                : "Play late-night coding mix"}
          </small>
        </span>

        <span className="audio-meter" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
          <i />
        </span>
      </button>

      <label title="Background music volume">
        <span className="sr-only">Background music volume</span>

        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          onChange={(event) => {
            setAudioError(null);
            updateVolume(Number(event.currentTarget.value));
          }}
          aria-label="Background music volume"
        />
      </label>
    </div>
  );
}

export default AmbientAudio;
