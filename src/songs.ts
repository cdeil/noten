import type { Clef } from './notes';

export type SongCategory = 'volkslied' | 'klassik' | 'modern';
export type NoteDuration = 'w' | 'h' | 'q';

export interface SongNote {
  midi: number;
  duration: NoteDuration;
}

export interface Song {
  id: string;
  title: string;
  clef: Clef;
  category: SongCategory;
  notes: SongNote[];
  text?: string;
}

function makeSongNotes(
  midis: number[],
  { halfAt = [], wholeAt = [] }: { halfAt?: number[]; wholeAt?: number[] } = {},
): SongNote[] {
  const half = new Set(halfAt);
  const whole = new Set(wholeAt);
  return midis.map((midi, index) => ({
    midi,
    duration: whole.has(index) ? 'w' : half.has(index) ? 'h' : 'q',
  }));
}

// Mix aus Volksliedern, klassischen Melodien und bekannten modernen Themen.
// Songs can now also carry note values and optional text shown below the staff.
export const SONGS: Song[] = [
  {
    id: 'entchen',
    title: 'Alle meine Entchen',
    clef: 'treble',
    category: 'volkslied',
    notes: makeSongNotes(
      [60, 62, 64, 65, 67, 67, 69, 69, 69, 69, 67, 69, 69, 69, 69, 67, 65, 65, 65, 65, 64, 64, 62, 62, 62, 62, 60],
      { halfAt: [4, 10, 15, 20, 25], wholeAt: [26] },
    ),
    text: 'Alle meine Entchen schwimmen auf dem See.',
  },
  {
    id: 'haenschen',
    title: 'Hänschen klein',
    clef: 'treble',
    category: 'volkslied',
    notes: makeSongNotes(
      [67, 64, 64, 65, 62, 62, 60, 62, 64, 65, 67, 67, 67],
      { halfAt: [6, 12] },
    ),
    text: 'Hänschen klein ging allein in die weite Welt hinein.',
  },
  {
    id: 'bruder',
    title: 'Bruder Jakob',
    clef: 'treble',
    category: 'volkslied',
    notes: makeSongNotes(
      [60, 62, 64, 60, 60, 62, 64, 60, 64, 65, 67, 64, 65, 67, 67, 69, 67, 65, 64, 60, 67, 69, 67, 65, 64, 60],
      { halfAt: [3, 7, 10, 13, 19, 25] },
    ),
    text: 'Bruder Jakob, Bruder Jakob, schläfst du noch?',
  },
  {
    id: 'morgen',
    title: 'Morgen kommt der Weihnachtsmann',
    clef: 'treble',
    category: 'volkslied',
    notes: makeSongNotes(
      [60, 60, 67, 67, 69, 69, 67, 65, 65, 64, 64, 62, 62, 60],
      { halfAt: [6, 13] },
    ),
    text: 'Morgen kommt der Weihnachtsmann, kommt mit seinen Gaben.',
  },
  {
    id: 'mary',
    title: 'Mary hatte ein kleines Lamm',
    clef: 'treble',
    category: 'volkslied',
    notes: makeSongNotes(
      [64, 62, 60, 62, 64, 64, 64, 62, 62, 62, 64, 67, 67, 64, 62, 60, 62, 64, 64, 64, 64, 62, 62, 64, 62, 60],
      { halfAt: [6, 9, 12, 20, 25] },
    ),
    text: 'Mary hatte ein kleines Lamm, kleines Lamm, kleines Lamm.',
  },
  {
    id: 'kuckuck',
    title: 'Kuckuck, Kuckuck, ruft’s aus dem Wald',
    clef: 'treble',
    category: 'volkslied',
    notes: makeSongNotes(
      [67, 64, 67, 64, 65, 67, 69, 67, 65, 64, 62, 60],
      { halfAt: [7, 11] },
    ),
    text: 'Kuckuck, Kuckuck, ruft’s aus dem Wald.',
  },
  {
    id: 'london',
    title: 'London Bridge',
    clef: 'treble',
    category: 'volkslied',
    notes: makeSongNotes(
      [67, 69, 67, 65, 64, 65, 67, 62, 64, 65, 64, 65, 67, 67, 69, 67, 65, 64, 65, 67, 62, 67, 64, 60],
      { halfAt: [6, 13, 20, 23] },
    ),
  },
  {
    id: 'fuchs',
    title: 'Fuchs, du hast die Gans gestohlen',
    clef: 'treble',
    category: 'volkslied',
    notes: makeSongNotes(
      [60, 62, 64, 65, 67, 67, 67, 69, 69, 69, 69, 67, 69, 69, 69, 69, 67, 65, 65, 65, 65, 64, 64, 62, 62, 62, 62, 60],
      { halfAt: [6, 11, 16, 21, 26], wholeAt: [27] },
    ),
    text: 'Fuchs, du hast die Gans gestohlen, gib sie wieder her.',
  },
  {
    id: 'happy',
    title: 'Happy Birthday',
    clef: 'treble',
    category: 'volkslied',
    notes: makeSongNotes(
      [60, 60, 62, 60, 65, 64, 60, 60, 62, 60, 67, 65, 60, 60, 72, 69, 65, 64, 62, 70, 70, 69, 65, 67, 65],
      { halfAt: [5, 11, 18, 24] },
    ),
  },

  {
    id: 'ode',
    title: 'Ode an die Freude (Beethoven)',
    clef: 'treble',
    category: 'klassik',
    notes: makeSongNotes(
      [64, 64, 65, 67, 67, 65, 64, 62, 60, 60, 62, 64, 64, 62, 62],
      { halfAt: [3, 7, 12], wholeAt: [14] },
    ),
  },
  {
    id: 'fuerelise',
    title: 'Für Elise (Beethoven)',
    clef: 'treble',
    category: 'klassik',
    notes: makeSongNotes(
      [76, 75, 76, 75, 76, 71, 74, 72, 69, 60, 64, 69, 71, 64, 68, 71, 72, 64, 76, 75, 76, 75, 76, 71, 74, 72, 69],
      { halfAt: [8, 17, 26] },
    ),
  },
  {
    id: 'minuet',
    title: 'Menuett in G (Bach)',
    clef: 'treble',
    category: 'klassik',
    notes: makeSongNotes(
      [74, 67, 69, 71, 72, 74, 67, 67, 76, 72, 74, 76, 77, 76, 74, 72, 74, 67],
      { halfAt: [7, 12, 17] },
    ),
  },
  {
    id: 'nachtmusik',
    title: 'Eine kleine Nachtmusik (Mozart)',
    clef: 'treble',
    category: 'klassik',
    notes: makeSongNotes(
      [67, 62, 67, 62, 67, 62, 67, 74, 71, 67, 62, 67, 62, 67, 62, 67, 74, 71, 67],
      { halfAt: [8, 17], wholeAt: [18] },
    ),
  },

  {
    id: 'starwars',
    title: 'Star Wars (Hauptthema)',
    clef: 'treble',
    category: 'modern',
    notes: makeSongNotes(
      [67, 67, 67, 72, 79, 77, 76, 74, 84, 79, 77, 76, 74, 84, 79, 77, 76, 77, 74],
      { halfAt: [2, 8, 13, 18] },
    ),
  },
  {
    id: 'imperial',
    title: 'Imperial March (Star Wars)',
    clef: 'treble',
    category: 'modern',
    notes: makeSongNotes(
      [67, 67, 67, 63, 70, 67, 63, 70, 67, 74, 74, 74, 75, 70, 66, 63, 70, 67],
      { halfAt: [2, 8, 11, 17] },
    ),
  },
  {
    id: 'hedwig',
    title: 'Hedwigs Thema (Harry Potter)',
    clef: 'treble',
    category: 'modern',
    notes: makeSongNotes(
      [71, 76, 79, 78, 76, 83, 81, 78, 76, 79, 78, 74, 77, 71],
      { halfAt: [4, 7, 13] },
    ),
  },
  {
    id: 'pirates',
    title: 'Pirates of the Caribbean',
    clef: 'treble',
    category: 'modern',
    notes: makeSongNotes(
      [62, 65, 67, 67, 67, 69, 70, 70, 70, 72, 70, 69, 67, 65, 67, 65, 65, 67, 70, 67, 67, 65, 67, 65],
      { halfAt: [9, 15, 23] },
    ),
  },
  {
    id: 'mario',
    title: 'Super Mario Theme',
    clef: 'treble',
    category: 'modern',
    notes: makeSongNotes(
      [76, 76, 76, 72, 76, 79, 67, 72, 67, 64, 69, 71, 70, 69, 67, 76, 79, 81, 77, 79, 76, 72, 74, 71],
      { halfAt: [5, 14, 20, 23] },
    ),
  },
  {
    id: 'gameofthrones',
    title: 'Game of Thrones',
    clef: 'treble',
    category: 'modern',
    notes: makeSongNotes(
      [67, 60, 63, 65, 67, 60, 63, 65, 67, 60, 63, 65, 67, 60, 63, 65, 65, 67, 68, 67, 65, 67, 65, 67, 65],
      { halfAt: [3, 7, 11, 15, 24] },
    ),
  },
];
