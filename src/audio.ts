import * as Tone from 'tone';

let synth: Tone.PolySynth | null = null;
let errorSynth: Tone.Synth | null = null;
let started = false;

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

export function playMidi(midi: number): void {
  ensureAudio();
  if (!synth) return;
  const freq = Tone.Frequency(midi, 'midi').toFrequency();
  synth.triggerAttackRelease(freq, 0.7);
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
