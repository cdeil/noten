import * as Tone from 'tone';

let synth: Tone.PolySynth | null = null;
let errorSynth: Tone.Synth | null = null;
let metronomeSynth: Tone.Synth | null = null;
let drumSynth: Tone.MembraneSynth | null = null;
let lastMetronomeAt = 0;
let started = false;

export type PianoPlaybackMode = 'overlap' | 'replace';

function makeSynths() {
  if (!synth) {
    synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.005, decay: 0.2, sustain: 0.25, release: 0.9 },
    }).toDestination();
    synth.volume.value = -6;
  }
  if (!errorSynth) {
    errorSynth = new Tone.Synth({
      oscillator: { type: 'square' },
      envelope: { attack: 0.01, decay: 0.18, sustain: 0, release: 0.1 },
    }).toDestination();
    errorSynth.volume.value = -14;
  }
  if (!metronomeSynth) {
    metronomeSynth = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.05 },
    }).toDestination();
    metronomeSynth.volume.value = -10;
  }
  if (!drumSynth) {
    drumSynth = new Tone.MembraneSynth({
      pitchDecay: 0.015,
      octaves: 4,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.02 },
    }).toDestination();
    drumSynth.volume.value = -4;
  }
}

// Synchronous: must be called inside a user-gesture handler (pointerdown/click).
// Avoids losing the gesture across an `await` boundary which silences audio on Safari.
export function ensureAudio(): void {
  if (!started) {
    void Tone.start();
    const ctx = Tone.getContext().rawContext as AudioContext;
    if (ctx && ctx.state !== 'running') void ctx.resume();
    started = true;
  }
  makeSynths();
}

export function playMidi(midi: number, durationSeconds = 0.7, playbackMode: PianoPlaybackMode = 'overlap'): void {
  ensureAudio();
  if (!synth) return;
  const freq = Tone.Frequency(midi, 'midi').toFrequency();
  const when = Tone.now();
  if (playbackMode === 'replace') synth.releaseAll(when);
  synth.triggerAttackRelease(freq, durationSeconds, playbackMode === 'replace' ? when + 0.002 : when);
}

export function playError(): void {
  ensureAudio();
  if (!errorSynth) return;
  errorSynth.triggerAttackRelease(110, 0.15);
}

export function playCheer(): void {
  ensureAudio();
  if (!synth) return;
  const notes = [72, 76, 79, 84];
  notes.forEach((m, i) => {
    const freq = Tone.Frequency(m, 'midi').toFrequency();
    synth!.triggerAttackRelease(freq, 0.25, Tone.now() + i * 0.12);
  });
}

export function playMetronomeClick(accent = false): void {
  ensureAudio();
  if (!metronomeSynth) return;
  const when = Math.max(Tone.now(), lastMetronomeAt + 0.001);
  lastMetronomeAt = when;
  metronomeSynth.triggerAttackRelease(accent ? 1568 : 1046, 0.05, when);
}

export function playDrumHit(): void {
  ensureAudio();
  if (!drumSynth) return;
  drumSynth.triggerAttackRelease('C1', 0.06);
}
