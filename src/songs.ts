import type { Clef } from './notes';

export interface Song {
  id: string;
  title: string;
  clef: Clef;
  notes: number[]; // MIDI sequence
}

// Einfache, bekannte Melodien — alle in C-Dur, Violinschlüssel-Bereich.
export const SONGS: Song[] = [
  {
    id: 'entchen',
    title: 'Alle meine Entchen',
    clef: 'treble',
    notes: [60, 62, 64, 65, 67, 67, 69, 69, 69, 69, 67, 69, 69, 69, 69, 67, 65, 65, 65, 65, 64, 64, 62, 62, 62, 62, 60],
  },
  {
    id: 'haenschen',
    title: 'Hänschen klein',
    clef: 'treble',
    notes: [67, 64, 64, 65, 62, 62, 60, 62, 64, 65, 67, 67, 67],
  },
  {
    id: 'bruder',
    title: 'Bruder Jakob',
    clef: 'treble',
    notes: [60, 62, 64, 60, 60, 62, 64, 60, 64, 65, 67, 64, 65, 67, 67, 69, 67, 65, 64, 60, 67, 69, 67, 65, 64, 60],
  },
  {
    id: 'morgen',
    title: 'Morgen kommt der Weihnachtsmann',
    clef: 'treble',
    notes: [60, 60, 67, 67, 69, 69, 67, 65, 65, 64, 64, 62, 62, 60],
  },
  {
    id: 'mary',
    title: 'Mary hatte ein kleines Lamm',
    clef: 'treble',
    notes: [64, 62, 60, 62, 64, 64, 64, 62, 62, 62, 64, 67, 67, 64, 62, 60, 62, 64, 64, 64, 64, 62, 62, 64, 62, 60],
  },
  {
    id: 'kuckuck',
    title: 'Kuckuck, Kuckuck, ruft’s aus dem Wald',
    clef: 'treble',
    notes: [67, 64, 67, 64, 65, 67, 69, 67, 65, 64, 62, 60],
  },
  {
    id: 'ode',
    title: 'Ode an die Freude',
    clef: 'treble',
    notes: [64, 64, 65, 67, 67, 65, 64, 62, 60, 60, 62, 64, 64, 62, 62],
  },
  {
    id: 'london',
    title: 'London Bridge',
    clef: 'treble',
    notes: [67, 69, 67, 65, 64, 65, 67, 62, 64, 65, 64, 65, 67, 67, 69, 67, 65, 64, 65, 67, 62, 67, 64, 60],
  },
  {
    id: 'jingle',
    title: 'Jingle Bells (Refrain)',
    clef: 'treble',
    notes: [64, 64, 64, 64, 64, 64, 64, 67, 60, 62, 64, 65, 65, 65, 65, 65, 64, 64, 64, 64, 62, 62, 64, 62, 67],
  },
  {
    id: 'fuchs',
    title: 'Fuchs, du hast die Gans gestohlen',
    clef: 'treble',
    notes: [60, 62, 64, 65, 67, 67, 67, 69, 69, 69, 69, 67, 69, 69, 69, 69, 67, 65, 65, 65, 65, 64, 64, 62, 62, 62, 62, 60],
  },
];
