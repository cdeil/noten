export type Clef = 'treble' | 'bass';
export type Mode = 'treble' | 'bass' | 'mixed';

export interface Pitch {
  midi: number;
  clef: Clef;
  vexKey: string;
  accidental?: '#' | 'b';
  german: string;
  pitchClass: number;
}

const NATURAL_NAMES: Record<number, string> = {
  0: 'C', 2: 'D', 4: 'E', 5: 'F', 7: 'G', 9: 'A', 11: 'H',
};
const NATURAL_VEX: Record<number, string> = {
  0: 'c', 2: 'd', 4: 'e', 5: 'f', 7: 'g', 9: 'a', 11: 'b',
};

export const ACCEPTED_NAMES: Record<number, string[]> = {
  0: ['C'],
  1: ['Cis', 'Des'],
  2: ['D'],
  3: ['Dis', 'Es'],
  4: ['E'],
  5: ['F'],
  6: ['Fis', 'Ges'],
  7: ['G'],
  8: ['Gis', 'As'],
  9: ['A'],
  10: ['Ais', 'B'],
  11: ['H'],
};

export const BUTTON_LABELS: { label: string; pitchClass: number; isAccidental: boolean }[] = [
  { label: 'C',   pitchClass: 0,  isAccidental: false },
  { label: 'Cis', pitchClass: 1,  isAccidental: true },
  { label: 'D',   pitchClass: 2,  isAccidental: false },
  { label: 'Es',  pitchClass: 3,  isAccidental: true },
  { label: 'E',   pitchClass: 4,  isAccidental: false },
  { label: 'F',   pitchClass: 5,  isAccidental: false },
  { label: 'Fis', pitchClass: 6,  isAccidental: true },
  { label: 'G',   pitchClass: 7,  isAccidental: false },
  { label: 'As',  pitchClass: 8,  isAccidental: true },
  { label: 'A',   pitchClass: 9,  isAccidental: false },
  { label: 'B',   pitchClass: 10, isAccidental: true },
  { label: 'H',   pitchClass: 11, isAccidental: false },
];

function midiToPitch(midi: number, clef: Clef, withAccidentals: boolean, rng: () => number): Pitch {
  const pitchClass = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;

  if (NATURAL_NAMES[pitchClass]) {
    return {
      midi, clef, pitchClass,
      vexKey: `${NATURAL_VEX[pitchClass]}/${octave}`,
      german: NATURAL_NAMES[pitchClass],
    };
  }
  if (!withAccidentals) {
    return midiToPitch(midi - 1, clef, withAccidentals, rng);
  }
  const useSharp = rng() < 0.5;
  if (useSharp) {
    const lowerPc = pitchClass - 1;
    return {
      midi, clef, pitchClass,
      vexKey: `${NATURAL_VEX[lowerPc]}/${octave}`,
      accidental: '#',
      german: ACCEPTED_NAMES[pitchClass][0],
    };
  }
  const upperPc = pitchClass + 1;
  return {
    midi, clef, pitchClass,
    vexKey: `${NATURAL_VEX[upperPc]}/${octave}`,
    accidental: 'b',
    german: ACCEPTED_NAMES[pitchClass][1],
  };
}

const TREBLE_RANGE: [number, number] = [60, 81];
const BASS_RANGE: [number, number] = [40, 60];

export function randomPitch(mode: Mode, withAccidentals: boolean, prevMidi?: number): Pitch {
  const rng = Math.random;
  let clef: Clef;
  if (mode === 'mixed') clef = rng() < 0.5 ? 'treble' : 'bass';
  else clef = mode;
  const [lo, hi] = clef === 'treble' ? TREBLE_RANGE : BASS_RANGE;

  for (let tries = 0; tries < 30; tries++) {
    const midi = lo + Math.floor(rng() * (hi - lo + 1));
    const pc = ((midi % 12) + 12) % 12;
    const isAccidental = !(pc in NATURAL_NAMES);
    if (!withAccidentals && isAccidental) continue;
    if (midi === prevMidi) continue;
    return midiToPitch(midi, clef, withAccidentals, rng);
  }
  return midiToPitch(lo, clef, withAccidentals, rng);
}

export function isCorrect(pitch: Pitch, pitchClass: number): boolean {
  return pitch.pitchClass === pitchClass;
}
