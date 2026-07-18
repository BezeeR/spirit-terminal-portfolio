import { useCallback, useEffect, useRef, useState } from "react";

type SynthEngine = {
  context: AudioContext;
  master: GainNode;
  padOscillators: OscillatorNode[];
  bassOscillator: OscillatorNode;
  melodyBus: GainNode;
  drumBus: GainNode;
  noiseBus: GainNode;
  timer: number;
  nextStepTime: number;
  chordIndex: number;
  step: number;
  drumNoise: AudioBuffer;
  vinylSource: AudioBufferSourceNode;
};

const CHORDS = [
  [130.81, 164.81, 196, 246.94],
  [110, 130.81, 164.81, 196],
  [87.31, 110, 130.81, 164.81],
  [98, 123.47, 146.83, 174.61]
];
const BASS = [65.41, 55, 43.65, 49];
const MELODY = [392, 440, 493.88, 523.25, 587.33, 523.25, 466.16, 392];
const MAX_GAIN = 0.042;
const BPM = 82;
const EIGHTH_NOTE = 60 / BPM / 2;
const LOOKAHEAD_MS = 35;
const SCHEDULE_AHEAD_SECONDS = 0.12;

function readStoredNumber(key: string, fallback: number) {
  try {
    const value = Number(window.localStorage.getItem(key));
    return Number.isFinite(value) && value >= 0 && value <= 1 ? value : fallback;
  } catch {
    return fallback;
  }
}

function writeStoredValue(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage may be unavailable in privacy modes.
  }
}

function makeNoiseBuffer(context: AudioContext, seconds: number) {
  const buffer = context.createBuffer(1, Math.floor(context.sampleRate * seconds), context.sampleRate);
  const channel = buffer.getChannelData(0);
  for (let index = 0; index < channel.length; index += 1) {
    channel[index] = Math.random() * 2 - 1;
  }
  return buffer;
}

function makeImpulse(context: AudioContext, seconds = 1.7, decay = 3.2) {
  const impulse = context.createBuffer(2, Math.floor(context.sampleRate * seconds), context.sampleRate);
  for (let channel = 0; channel < impulse.numberOfChannels; channel += 1) {
    const data = impulse.getChannelData(channel);
    for (let index = 0; index < data.length; index += 1) {
      data[index] = (Math.random() * 2 - 1) * Math.pow(1 - index / data.length, decay);
    }
  }
  return impulse;
}

function createEngine(): SynthEngine {
  const context = new AudioContext({ latencyHint: "playback" });
  const master = context.createGain();
  const compressor = context.createDynamicsCompressor();
  const tone = context.createBiquadFilter();
  const padBus = context.createGain();
  const melodyBus = context.createGain();
  const drumBus = context.createGain();
  const noiseBus = context.createGain();
  const reverb = context.createConvolver();
  const reverbReturn = context.createGain();
  const delay = context.createDelay(1.5);
  const feedback = context.createGain();
  const delayReturn = context.createGain();

  master.gain.value = 0.0001;
  compressor.threshold.value = -25;
  compressor.knee.value = 20;
  compressor.ratio.value = 3;
  compressor.attack.value = 0.025;
  compressor.release.value = 0.55;
  tone.type = "lowpass";
  tone.frequency.value = 3450;
  tone.Q.value = 0.35;
  padBus.gain.value = 0.22;
  melodyBus.gain.value = 0.13;
  drumBus.gain.value = 0.13;
  noiseBus.gain.value = 0.012;
  reverb.buffer = makeImpulse(context);
  reverbReturn.gain.value = 0.18;
  delay.delayTime.value = 0.34;
  feedback.gain.value = 0.18;
  delayReturn.gain.value = 0.15;

  padBus.connect(tone);
  melodyBus.connect(tone);
  drumBus.connect(tone);
  noiseBus.connect(tone);
  padBus.connect(reverb);
  melodyBus.connect(reverb);
  reverb.connect(reverbReturn);
  reverbReturn.connect(tone);
  melodyBus.connect(delay);
  delay.connect(feedback);
  feedback.connect(delay);
  delay.connect(delayReturn);
  delayReturn.connect(tone);
  tone.connect(master);
  master.connect(compressor);
  compressor.connect(context.destination);

  const filterLfo = context.createOscillator();
  const filterDepth = context.createGain();
  filterLfo.type = "sine";
  filterLfo.frequency.value = 0.027;
  filterDepth.gain.value = 420;
  filterLfo.connect(filterDepth);
  filterDepth.connect(tone.frequency);
  filterLfo.start();

  const padOscillators = CHORDS[0].map((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = index % 2 ? "triangle" : "sine";
    oscillator.frequency.value = frequency;
    oscillator.detune.value = [-8, 4, -3, 7][index];
    gain.gain.value = [0.075, 0.05, 0.038, 0.025][index];
    oscillator.connect(gain);
    gain.connect(padBus);
    oscillator.start();
    return oscillator;
  });

  const bassOscillator = context.createOscillator();
  const bassFilter = context.createBiquadFilter();
  const bassGain = context.createGain();
  bassOscillator.type = "sine";
  bassOscillator.frequency.value = BASS[0];
  bassFilter.type = "lowpass";
  bassFilter.frequency.value = 165;
  bassGain.gain.value = 0.048;
  bassOscillator.connect(bassFilter);
  bassFilter.connect(bassGain);
  bassGain.connect(tone);
  bassOscillator.start();

  const vinylSource = context.createBufferSource();
  const vinylFilter = context.createBiquadFilter();
  const vinylGain = context.createGain();
  vinylSource.buffer = makeNoiseBuffer(context, 4);
  vinylSource.loop = true;
  vinylFilter.type = "bandpass";
  vinylFilter.frequency.value = 1800;
  vinylFilter.Q.value = 0.42;
  vinylGain.gain.value = 0.012;
  vinylSource.connect(vinylFilter);
  vinylFilter.connect(vinylGain);
  vinylGain.connect(noiseBus);
  vinylSource.start();

  return {
    context,
    master,
    padOscillators,
    bassOscillator,
    melodyBus,
    drumBus,
    noiseBus,
    timer: 0,
    nextStepTime: context.currentTime + 0.06,
    chordIndex: 0,
    step: 0,
    drumNoise: makeNoiseBuffer(context, 0.45),
    vinylSource
  };
}

function scheduleKick(engine: SynthEngine, time: number, volume = 0.42) {
  const oscillator = engine.context.createOscillator();
  const gain = engine.context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(105, time);
  oscillator.frequency.exponentialRampToValueAtTime(44, time + 0.13);
  gain.gain.setValueAtTime(volume, time);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.23);
  oscillator.connect(gain);
  gain.connect(engine.drumBus);
  oscillator.start(time);
  oscillator.stop(time + 0.25);
}

function scheduleNoiseHit(engine: SynthEngine, time: number, type: "snare" | "hat", open = false) {
  const source = engine.context.createBufferSource();
  const filter = engine.context.createBiquadFilter();
  const gain = engine.context.createGain();
  source.buffer = engine.drumNoise;
  filter.type = "highpass";
  filter.frequency.value = type === "snare" ? 1150 : 5600;
  const peak = type === "snare" ? 0.14 : open ? 0.042 : 0.027;
  const length = type === "snare" ? 0.16 : open ? 0.12 : 0.045;
  gain.gain.setValueAtTime(peak, time);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + length);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(engine.drumBus);
  source.start(time);
  source.stop(time + length + 0.02);
}

function scheduleKey(engine: SynthEngine, time: number, frequency: number, soft = false) {
  const oscillator = engine.context.createOscillator();
  const overtone = engine.context.createOscillator();
  const filter = engine.context.createBiquadFilter();
  const gain = engine.context.createGain();
  oscillator.type = "triangle";
  overtone.type = "sine";
  oscillator.frequency.value = frequency;
  oscillator.detune.value = -7;
  overtone.frequency.value = frequency * 2;
  filter.type = "lowpass";
  filter.frequency.value = soft ? 1050 : 1450;
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(soft ? 0.026 : 0.045, time + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.95);
  oscillator.connect(filter);
  overtone.connect(filter);
  filter.connect(gain);
  gain.connect(engine.melodyBus);
  oscillator.start(time);
  overtone.start(time);
  oscillator.stop(time + 1);
  overtone.stop(time + 1);
}

function scheduleStep(engine: SynthEngine, step: number, time: number) {
  const position = step % 16;
  if (position === 0) {
    engine.chordIndex = (engine.chordIndex + 1) % CHORDS.length;
    engine.padOscillators.forEach((oscillator, index) => {
      oscillator.frequency.cancelScheduledValues(time);
      oscillator.frequency.exponentialRampToValueAtTime(CHORDS[engine.chordIndex][index], time + 1.8);
    });
    engine.bassOscillator.frequency.cancelScheduledValues(time);
    engine.bassOscillator.frequency.exponentialRampToValueAtTime(BASS[engine.chordIndex], time + 1.8);
  }

  if (position === 0 || position === 8) scheduleKick(engine, time, position === 0 ? 0.4 : 0.31);
  if (position === 11) scheduleKick(engine, time, 0.12);
  if (position === 4 || position === 12) scheduleNoiseHit(engine, time, "snare");
  if (position % 2 === 0) scheduleNoiseHit(engine, time, "hat", position === 14);
  if ([1, 5, 9, 13].includes(position)) {
    const melodyIndex = (engine.chordIndex * 2 + Math.floor(position / 4)) % MELODY.length;
    scheduleKey(engine, time, MELODY[melodyIndex] * (position === 13 ? 0.5 : 1), position === 9);
  }
}

function runScheduler(engine: SynthEngine) {
  while (engine.nextStepTime < engine.context.currentTime + SCHEDULE_AHEAD_SECONDS) {
    scheduleStep(engine, engine.step, engine.nextStepTime);
    const swing = engine.step % 2 === 0 ? 1.11 : 0.89;
    engine.nextStepTime += EIGHTH_NOTE * swing;
    engine.step += 1;
  }
}

export function AmbientAudio() {
  const engineRef = useRef<SynthEngine | null>(null);
  const suspendTimerRef = useRef<number>(0);
  const [enabled, setEnabled] = useState(false);
  const [volume, setVolume] = useState(() => readStoredNumber("portfolio-ambience-volume", 0.34));

  const setMasterGain = useCallback((nextEnabled: boolean, nextVolume = volume) => {
    const engine = engineRef.current;
    if (!engine) return;
    const now = engine.context.currentTime;
    engine.master.gain.cancelScheduledValues(now);
    engine.master.gain.setValueAtTime(Math.max(engine.master.gain.value, 0.0001), now);
    engine.master.gain.exponentialRampToValueAtTime(nextEnabled ? Math.max(nextVolume * MAX_GAIN, 0.0001) : 0.0001, now + 0.45);
  }, [volume]);

  const start = useCallback(async () => {
    window.clearTimeout(suspendTimerRef.current);
    try {
      if (!engineRef.current) engineRef.current = createEngine();
      const engine = engineRef.current;
      await engine.context.resume();
      engine.nextStepTime = Math.max(engine.nextStepTime, engine.context.currentTime + 0.05);
      if (!engine.timer) {
        runScheduler(engine);
        engine.timer = window.setInterval(() => runScheduler(engine), LOOKAHEAD_MS);
      }
      setMasterGain(true);
      setEnabled(true);
      writeStoredValue("portfolio-ambience-preference", "on");
    } catch {
      setEnabled(false);
    }
  }, [setMasterGain]);

  const stop = useCallback(() => {
    const engine = engineRef.current;
    setMasterGain(false);
    setEnabled(false);
    writeStoredValue("portfolio-ambience-preference", "off");
    if (!engine) return;
    window.clearInterval(engine.timer);
    engine.timer = 0;
    window.clearTimeout(suspendTimerRef.current);
    suspendTimerRef.current = window.setTimeout(() => void engine.context.suspend(), 520);
  }, [setMasterGain]);

  const toggle = () => enabled ? stop() : void start();
  const updateVolume = (nextVolume: number) => {
    setVolume(nextVolume);
    writeStoredValue("portfolio-ambience-volume", String(nextVolume));
    if (enabled) setMasterGain(true, nextVolume);
  };

  useEffect(() => {
    const handleVisibility = () => {
      const engine = engineRef.current;
      if (!engine || !enabled) return;
      if (document.hidden) {
        window.clearInterval(engine.timer);
        engine.timer = 0;
        void engine.context.suspend();
      } else {
        void engine.context.resume().then(() => {
          engine.nextStepTime = engine.context.currentTime + 0.06;
          engine.timer = window.setInterval(() => runScheduler(engine), LOOKAHEAD_MS);
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [enabled]);

  useEffect(() => () => {
    window.clearTimeout(suspendTimerRef.current);
    const engine = engineRef.current;
    if (!engine) return;
    window.clearInterval(engine.timer);
    try { engine.vinylSource.stop(); } catch { /* already stopped */ }
    void engine.context.close();
  }, []);

  return (
    <div className={`audio-control ${enabled ? "playing" : ""}`}>
      <button
        type="button"
        onClick={toggle}
        aria-pressed={enabled}
        aria-label={enabled ? "Mute original Midnight Radio background music" : "Play original Midnight Radio background music"}
      >
        <span className="audio-icon" aria-hidden="true">{enabled ? "▮▮" : "▶"}</span>
        <span className="audio-label"><b>MIDNIGHT RADIO</b><small>{enabled ? "ORIGINAL LOFI // ON AIR" : "ORIGINAL LOFI // PLAY"}</small></span>
        <span className="audio-meter" aria-hidden="true"><i /><i /><i /><i /></span>
      </button>
      <label title="Background music volume">
        <span className="sr-only">Background music volume</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          onChange={(event) => updateVolume(Number(event.target.value))}
          aria-label="Background music volume"
        />
      </label>
    </div>
  );
}
