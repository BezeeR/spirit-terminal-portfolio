import { useCallback, useEffect, useRef, useState } from "react";

const BPM = 70;
const BEAT_LENGTH = 60 / BPM;
const BAR_LENGTH = BEAT_LENGTH * 4;
const SCHEDULE_INTERVAL_MS = 90;
const SCHEDULE_AHEAD_SECONDS = 0.45;
const FADE_IN_SECONDS = 2.8;
const FADE_OUT_SECONDS = 1.65;

const VOLUME_KEY = "spirit-terminal-midnight-radio-volume";
const DEFAULT_VOLUME = 0.34;

interface AudioEngine {
  context: AudioContext;
  master: GainNode;
  musicBus: GainNode;
  drumBus: GainNode;
  reverbSend: GainNode;
  delaySend: GainNode;
  noiseBuffer: AudioBuffer;
  timer: number;
  nextBarTime: number;
  barIndex: number;
}

interface Chord {
  pad: number[];
  arp: number[];
  bass: number;
  bassAccent: number;
}

interface MelodyNote {
  beat: number;
  midi: number;
  duration: number;
}

function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * Original eight-bar late-night progression centered around D minor / F major.
 * The voicings deliberately leave room between the pad, arpeggio, and bass.
 */
const CHORD_PROGRESSION: Chord[] = [
  { pad: [50, 53, 57, 60, 64], arp: [57, 60, 64, 65, 69], bass: 38, bassAccent: 45 },
  { pad: [46, 50, 53, 57, 60], arp: [53, 57, 60, 62, 65], bass: 34, bassAccent: 41 },
  { pad: [41, 45, 48, 52, 55], arp: [52, 55, 57, 60, 64], bass: 29, bassAccent: 36 },
  { pad: [48, 52, 55, 59, 62], arp: [55, 59, 62, 64, 67], bass: 36, bassAccent: 43 },
  { pad: [43, 46, 50, 53, 57], arp: [50, 53, 57, 58, 62], bass: 31, bassAccent: 38 },
  { pad: [46, 50, 53, 57, 60], arp: [53, 57, 60, 62, 65], bass: 34, bassAccent: 41 },
  { pad: [45, 48, 53, 55, 60], arp: [53, 55, 57, 60, 64], bass: 33, bassAccent: 40 },
  { pad: [48, 50, 55, 57, 62], arp: [55, 57, 60, 62, 67], bass: 36, bassAccent: 43 },
];

const ARPEGGIO_PATTERNS = [
  [0, 2, 1, -1, 3, 2, 4, -1],
  [0, 1, 3, -1, 2, 4, 3, -1],
];

const LEAD_MOTIFS: Record<number, MelodyNote[]> = {
  2: [
    { beat: 0.65, midi: 76, duration: 0.8 },
    { beat: 1.75, midi: 72, duration: 0.7 },
    { beat: 2.8, midi: 69, duration: 0.95 },
  ],
  6: [
    { beat: 0.45, midi: 72, duration: 0.65 },
    { beat: 1.35, midi: 74, duration: 0.65 },
    { beat: 2.25, midi: 69, duration: 0.75 },
    { beat: 3.15, midi: 67, duration: 0.7 },
  ],
};

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

  return 0.035 + Math.pow(value, 1.28) * 0.48;
}

function createNoiseBuffer(
  context: AudioContext,
  durationSeconds = 1,
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
  durationSeconds = 2.35,
  decay = 3.25,
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

function connectWithReverb(
  source: AudioNode,
  engine: AudioEngine,
  reverbAmount: number,
): void {
  const send = engine.context.createGain();
  send.gain.value = reverbAmount;

  source.connect(engine.musicBus);
  source.connect(send);
  send.connect(engine.reverbSend);
}

function playPadChord(
  engine: AudioEngine,
  startTime: number,
  chord: Chord,
): void {
  const { context } = engine;
  const filter = context.createBiquadFilter();
  const chordGain = context.createGain();
  const duration = BAR_LENGTH * 0.91;

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(920, startTime);
  filter.frequency.linearRampToValueAtTime(1450, startTime + BEAT_LENGTH * 1.7);
  filter.frequency.linearRampToValueAtTime(1050, startTime + duration);
  filter.Q.setValueAtTime(0.5, startTime);

  chordGain.gain.setValueAtTime(0.0001, startTime);
  chordGain.gain.exponentialRampToValueAtTime(0.125, startTime + 0.42);
  chordGain.gain.exponentialRampToValueAtTime(0.082, startTime + BEAT_LENGTH * 1.45);
  chordGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  filter.connect(chordGain);
  connectWithReverb(chordGain, engine, 0.48);

  chord.pad.forEach((midi, noteIndex) => {
    const frequency = midiToFrequency(midi);
    const sine = context.createOscillator();
    const triangle = context.createOscillator();
    const sineGain = context.createGain();
    const triangleGain = context.createGain();

    sine.type = "sine";
    triangle.type = "triangle";

    sine.frequency.setValueAtTime(frequency, startTime);
    triangle.frequency.setValueAtTime(frequency, startTime);
    triangle.detune.setValueAtTime(noteIndex % 2 === 0 ? -4 : 4, startTime);

    sineGain.gain.setValueAtTime(0.52 / chord.pad.length, startTime);
    triangleGain.gain.setValueAtTime(0.18 / chord.pad.length, startTime);

    sine.connect(sineGain);
    triangle.connect(triangleGain);
    sineGain.connect(filter);
    triangleGain.connect(filter);

    sine.start(startTime);
    triangle.start(startTime);
    sine.stop(startTime + duration + 0.08);
    triangle.stop(startTime + duration + 0.08);
  });
}

function playArpeggioNote(
  engine: AudioEngine,
  startTime: number,
  midi: number,
  accented: boolean,
): void {
  const { context } = engine;
  const oscillator = context.createOscillator();
  const overtone = context.createOscillator();
  const overtoneGain = context.createGain();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  const duration = BEAT_LENGTH * 0.44;

  oscillator.type = "triangle";
  overtone.type = "sine";
  oscillator.frequency.setValueAtTime(midiToFrequency(midi), startTime);
  overtone.frequency.setValueAtTime(midiToFrequency(midi + 12), startTime);
  overtoneGain.gain.setValueAtTime(0.12, startTime);

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(2450, startTime);
  filter.Q.setValueAtTime(0.7, startTime);

  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(
    accented ? 0.024 : 0.017,
    startTime + 0.018,
  );
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  oscillator.connect(filter);
  overtone.connect(overtoneGain);
  overtoneGain.connect(filter);
  filter.connect(gain);
  connectWithReverb(gain, engine, 0.34);

  oscillator.start(startTime);
  overtone.start(startTime);
  oscillator.stop(startTime + duration + 0.04);
  overtone.stop(startTime + duration + 0.04);
}

function playBassNote(
  engine: AudioEngine,
  startTime: number,
  midi: number,
  duration: number,
  level = 0.058,
): void {
  const { context, musicBus } = engine;
  const fundamental = context.createOscillator();
  const harmonic = context.createOscillator();
  const harmonicGain = context.createGain();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  const frequency = midiToFrequency(midi);

  fundamental.type = "sine";
  harmonic.type = "triangle";
  fundamental.frequency.setValueAtTime(frequency, startTime);
  harmonic.frequency.setValueAtTime(frequency * 2, startTime);
  harmonicGain.gain.setValueAtTime(0.11, startTime);

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(205, startTime);
  filter.Q.setValueAtTime(0.55, startTime);

  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(level, startTime + 0.045);
  gain.gain.exponentialRampToValueAtTime(level * 0.56, startTime + duration * 0.42);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  fundamental.connect(filter);
  harmonic.connect(harmonicGain);
  harmonicGain.connect(filter);
  filter.connect(gain);
  gain.connect(musicBus);

  fundamental.start(startTime);
  harmonic.start(startTime);
  fundamental.stop(startTime + duration + 0.05);
  harmonic.stop(startTime + duration + 0.05);
}

function playLeadNote(
  engine: AudioEngine,
  startTime: number,
  midi: number,
  durationInBeats: number,
): void {
  const { context, delaySend } = engine;
  const sine = context.createOscillator();
  const triangle = context.createOscillator();
  const triangleGain = context.createGain();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  const delayAmount = context.createGain();
  const duration = durationInBeats * BEAT_LENGTH;
  const frequency = midiToFrequency(midi);

  sine.type = "sine";
  triangle.type = "triangle";
  sine.frequency.setValueAtTime(frequency, startTime);
  triangle.frequency.setValueAtTime(frequency, startTime);
  triangle.detune.setValueAtTime(5, startTime);
  triangleGain.gain.setValueAtTime(0.14, startTime);

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1850, startTime);
  filter.frequency.linearRampToValueAtTime(2550, startTime + duration * 0.55);
  filter.Q.setValueAtTime(0.65, startTime);

  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(0.027, startTime + 0.11);
  gain.gain.exponentialRampToValueAtTime(0.016, startTime + duration * 0.58);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  delayAmount.gain.setValueAtTime(0.42, startTime);

  sine.connect(filter);
  triangle.connect(triangleGain);
  triangleGain.connect(filter);
  filter.connect(gain);
  connectWithReverb(gain, engine, 0.58);
  gain.connect(delayAmount);
  delayAmount.connect(delaySend);

  sine.start(startTime);
  triangle.start(startTime);
  sine.stop(startTime + duration + 0.08);
  triangle.stop(startTime + duration + 0.08);
}

function playKick(engine: AudioEngine, startTime: number): void {
  const { context, drumBus } = engine;
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(76, startTime);
  oscillator.frequency.exponentialRampToValueAtTime(44, startTime + 0.19);

  gain.gain.setValueAtTime(0.048, startTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.24);

  oscillator.connect(gain);
  gain.connect(drumBus);

  oscillator.start(startTime);
  oscillator.stop(startTime + 0.26);
}

function playMutedSnare(engine: AudioEngine, startTime: number): void {
  const { context, drumBus, noiseBuffer } = engine;
  const noise = context.createBufferSource();
  const bandpass = context.createBiquadFilter();
  const lowpass = context.createBiquadFilter();
  const noiseGain = context.createGain();
  const body = context.createOscillator();
  const bodyGain = context.createGain();

  noise.buffer = noiseBuffer;

  bandpass.type = "bandpass";
  bandpass.frequency.setValueAtTime(1450, startTime);
  bandpass.Q.setValueAtTime(0.85, startTime);

  lowpass.type = "lowpass";
  lowpass.frequency.setValueAtTime(3600, startTime);

  noiseGain.gain.setValueAtTime(0.026, startTime);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.12);

  body.type = "sine";
  body.frequency.setValueAtTime(168, startTime);
  bodyGain.gain.setValueAtTime(0.012, startTime);
  bodyGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.105);

  noise.connect(bandpass);
  bandpass.connect(lowpass);
  lowpass.connect(noiseGain);
  noiseGain.connect(drumBus);
  body.connect(bodyGain);
  bodyGain.connect(drumBus);

  noise.start(startTime, Math.random() * 0.7, 0.14);
  body.start(startTime);
  body.stop(startTime + 0.12);
}

function playHat(
  engine: AudioEngine,
  startTime: number,
  accented = false,
): void {
  const { context, drumBus, noiseBuffer } = engine;
  const noise = context.createBufferSource();
  const highpass = context.createBiquadFilter();
  const lowpass = context.createBiquadFilter();
  const gain = context.createGain();

  noise.buffer = noiseBuffer;

  highpass.type = "highpass";
  highpass.frequency.setValueAtTime(6100, startTime);
  lowpass.type = "lowpass";
  lowpass.frequency.setValueAtTime(9800, startTime);

  gain.gain.setValueAtTime(accented ? 0.009 : 0.006, startTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.045);

  noise.connect(highpass);
  highpass.connect(lowpass);
  lowpass.connect(gain);
  gain.connect(drumBus);

  noise.start(startTime, Math.random() * 0.7, 0.052);
}

function scheduleBar(
  engine: AudioEngine,
  startTime: number,
  barIndex: number,
): void {
  const progressionIndex = barIndex % CHORD_PROGRESSION.length;
  const chord = CHORD_PROGRESSION[progressionIndex];

  playPadChord(engine, startTime, chord);

  playBassNote(
    engine,
    startTime + BEAT_LENGTH * 0.08,
    chord.bass,
    BEAT_LENGTH * 1.42,
  );
  playBassNote(
    engine,
    startTime + BEAT_LENGTH * 2.7,
    chord.bassAccent,
    BEAT_LENGTH * 0.9,
    0.044,
  );

  const arpPattern = ARPEGGIO_PATTERNS[barIndex % ARPEGGIO_PATTERNS.length];

  arpPattern.forEach((noteIndex, step) => {
    if (noteIndex < 0) {
      return;
    }

    const swing = step % 2 === 1 ? BEAT_LENGTH * 0.028 : 0;
    const midi = chord.arp[noteIndex] ?? chord.arp[0];

    playArpeggioNote(
      engine,
      startTime + step * BEAT_LENGTH * 0.5 + swing,
      midi,
      step === 0 || step === 4,
    );
  });

  playKick(engine, startTime);
  playKick(engine, startTime + BEAT_LENGTH * 2.5);
  playMutedSnare(engine, startTime + BEAT_LENGTH);
  playMutedSnare(engine, startTime + BEAT_LENGTH * 3);

  const hatSteps = barIndex % 2 === 0 ? [1, 3, 6] : [1, 4, 7];

  hatSteps.forEach((step, index) => {
    const swing = step % 2 === 1 ? BEAT_LENGTH * 0.032 : 0;
    playHat(
      engine,
      startTime + step * BEAT_LENGTH * 0.5 + swing,
      index === hatSteps.length - 1,
    );
  });

  const motif = LEAD_MOTIFS[progressionIndex] ?? [];

  motif.forEach((note) => {
    playLeadNote(
      engine,
      startTime + note.beat * BEAT_LENGTH,
      note.midi,
      note.duration,
    );
  });
}

function runScheduler(engine: AudioEngine): void {
  const scheduleLimit = engine.context.currentTime + SCHEDULE_AHEAD_SECONDS;

  while (engine.nextBarTime < scheduleLimit) {
    scheduleBar(engine, engine.nextBarTime, engine.barIndex);
    engine.nextBarTime += BAR_LENGTH;
    engine.barIndex += 1;
  }
}

function destroyEngine(engine: AudioEngine): void {
  window.clearInterval(engine.timer);

  const now = engine.context.currentTime;
  const currentLevel = Math.max(engine.master.gain.value, 0.0001);

  engine.master.gain.cancelScheduledValues(now);
  engine.master.gain.setValueAtTime(currentLevel, now);
  engine.master.gain.exponentialRampToValueAtTime(
    0.0001,
    now + FADE_OUT_SECONDS,
  );

  window.setTimeout(() => {
    if (engine.context.state !== "closed") {
      void engine.context.close();
    }
  }, (FADE_OUT_SECONDS + 0.12) * 1000);
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
      const reverbSend = context.createGain();
      const reverbReturn = context.createGain();
      const delay = context.createDelay(1.5);
      const delayFeedback = context.createGain();
      const delayFilter = context.createBiquadFilter();
      const delaySend = context.createGain();
      const delayReturn = context.createGain();

      reverb.buffer = createReverbImpulse(context);
      reverbSend.gain.setValueAtTime(0.72, context.currentTime);
      reverbReturn.gain.setValueAtTime(0.2, context.currentTime);

      delay.delayTime.setValueAtTime(BEAT_LENGTH * 0.75, context.currentTime);
      delayFeedback.gain.setValueAtTime(0.2, context.currentTime);
      delayFilter.type = "lowpass";
      delayFilter.frequency.setValueAtTime(2600, context.currentTime);
      delaySend.gain.setValueAtTime(0.72, context.currentTime);
      delayReturn.gain.setValueAtTime(0.22, context.currentTime);

      musicBus.gain.setValueAtTime(0.82, context.currentTime);
      drumBus.gain.setValueAtTime(0.62, context.currentTime);

      compressor.threshold.setValueAtTime(-20, context.currentTime);
      compressor.knee.setValueAtTime(24, context.currentTime);
      compressor.ratio.setValueAtTime(3.2, context.currentTime);
      compressor.attack.setValueAtTime(0.012, context.currentTime);
      compressor.release.setValueAtTime(0.32, context.currentTime);

      master.gain.setValueAtTime(0.0001, context.currentTime);
      master.gain.exponentialRampToValueAtTime(
        getMasterVolume(volume),
        context.currentTime + FADE_IN_SECONDS,
      );

      musicBus.connect(master);
      drumBus.connect(master);

      reverbSend.connect(reverb);
      reverb.connect(reverbReturn);
      reverbReturn.connect(master);

      delaySend.connect(delay);
      delay.connect(delayFilter);
      delayFilter.connect(delayReturn);
      delayReturn.connect(master);
      delayFilter.connect(delayFeedback);
      delayFeedback.connect(delay);

      master.connect(compressor);
      compressor.connect(context.destination);

      const engine: AudioEngine = {
        context,
        master,
        musicBus,
        drumBus,
        reverbSend,
        delaySend,
        noiseBuffer: createNoiseBuffer(context),
        timer: 0,
        nextBarTime: context.currentTime + 0.1,
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
