export type Clef = 'treble' | 'bass';
export type Difficulty = 'normal' | 'hard';

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
export const NATURAL_LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'H'];

// All 21 button names (3 rows × 7 cols) → pitch class
export const NAME_TO_PC: Record<string, number> = {
  // sharps
  Cis: 1, Dis: 3, Eis: 5, Fis: 6, Gis: 8, Ais: 10, His: 0,
  // naturals
  C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, H: 11,
  // flats
  Ces: 11, Des: 1, Es: 3, Fes: 4, Ges: 6, As: 8, B: 10,
};

// Layout for the 3-row buttons grid (sharps / naturals / flats).
export const BUTTONS_GRID: string[][] = [
  ['Cis', 'Dis', 'Eis', 'Fis', 'Gis', 'Ais', 'His'],
  ['C',   'D',   'E',   'F',   'G',   'A',   'H'],
  ['Ces', 'Des', 'Es',  'Fes', 'Ges', 'As',  'B'],
];

export function pitchClassFromName(name: string): number | undefined {
  return NAME_TO_PC[name];
}

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
      german: ['', 'Cis', '', 'Dis', '', '', 'Fis', '', 'Gis', '', 'Ais', ''][pitchClass],
    };
  }
  const upperPc = pitchClass + 1;
  return {
    midi, clef, pitchClass,
    vexKey: `${NATURAL_VEX[upperPc]}/${octave}`,
    accidental: 'b',
    german: ['', 'Des', '', 'Es', '', '', 'Ges', '', 'As', '', 'B', ''][pitchClass],
  };
}

// Public helper: convert raw midi to a Pitch in C major / no accidentals (used for songs).
export function midiToNaturalPitch(midi: number, clef: Clef): Pitch {
  return midiToPitch(midi, clef, false, Math.random);
}

const RANGES: Record<Clef, Record<Difficulty, [number, number]>> = {
  treble: {
    normal: [60, 81],   // C4..A5
    hard:   [55, 86],   // G3..D6 (Hilfslinien oben/unten)
  },
  bass: {
    normal: [40, 60],   // E2..C4
    hard:   [33, 65],   // A1..F4
  },
};

export interface RandomOpts {
  clef: Clef;
  difficulty: Difficulty;
  withAccidentals: boolean;
  prevMidi?: number;
}

export function randomPitch({ clef, difficulty, withAccidentals, prevMidi }: RandomOpts): Pitch {
  const rng = Math.random;
  const [lo, hi] = RANGES[clef][difficulty];
  const wantBigJump = difficulty === 'hard' && prevMidi !== undefined && rng() < 0.6;

  for (let tries = 0; tries < 40; tries++) {
    const midi = lo + Math.floor(rng() * (hi - lo + 1));
    const pc = ((midi % 12) + 12) % 12;
    const isAccidental = !(pc in NATURAL_NAMES);
    if (!withAccidentals && isAccidental) continue;
    if (midi === prevMidi) continue;
    if (wantBigJump && Math.abs(midi - (prevMidi as number)) < 7) continue;
    return midiToPitch(midi, clef, withAccidentals, rng);
  }
  return midiToPitch(lo, clef, withAccidentals, rng);
}

export function isCorrect(pitch: Pitch, pitchClass: number): boolean {
  return pitch.pitchClass === pitchClass;
}

// German octave name with article-less label.
// Examples: "eingestrichenes c", "kleines f", "großes C", "Kontra-C".
export function germanOctaveName(midi: number): string {
  const pc = ((midi % 12) + 12) % 12;
  const letter = NATURAL_NAMES[pc] ?? '?';
  const octave = Math.floor(midi / 12) - 1;
  const lower = letter.toLowerCase();
  const upper = letter;
  switch (octave) {
    case 6: return `dreigestrichenes ${lower}`;
    case 5: return `zweigestrichenes ${lower}`;
    case 4: return `eingestrichenes ${lower}`;
    case 3: return `kleines ${lower}`;
    case 2: return `großes ${upper}`;
    case 1: return `Kontra-${upper}`;
    default: return upper;
  }
}
