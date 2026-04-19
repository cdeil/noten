import type { Clef } from './notes';

export type SongCategory = 'volkslied' | 'klassik' | 'modern';

export interface Song {
  id: string;
  title: string;
  clef: Clef;
  category: SongCategory;
  notes: number[]; // MIDI sequence
}

// Mix aus Volksliedern, klassischen Melodien und bekannten modernen Themen.
// Im "Lied"-Modus wird ein Lied zufaellig ausgewählt; der Titel wird erst am
// Ende angezeigt, damit der Schueler die Melodie selbst erkennen kann.
export const SONGS: Song[] = [
  // ---- Volkslieder / Kinderlieder ----
  {
    id: 'entchen', title: 'Alle meine Entchen', clef: 'treble', category: 'volkslied',
    notes: [60, 62, 64, 65, 67, 67, 69, 69, 69, 69, 67, 69, 69, 69, 69, 67, 65, 65, 65, 65, 64, 64, 62, 62, 62, 62, 60],
  },
  {
    id: 'haenschen', title: 'Hänschen klein', clef: 'treble', category: 'volkslied',
    notes: [67, 64, 64, 65, 62, 62, 60, 62, 64, 65, 67, 67, 67],
  },
  {
    id: 'bruder', title: 'Bruder Jakob', clef: 'treble', category: 'volkslied',
    notes: [60, 62, 64, 60, 60, 62, 64, 60, 64, 65, 67, 64, 65, 67, 67, 69, 67, 65, 64, 60, 67, 69, 67, 65, 64, 60],
  },
  {
    id: 'morgen', title: 'Morgen kommt der Weihnachtsmann', clef: 'treble', category: 'volkslied',
    notes: [60, 60, 67, 67, 69, 69, 67, 65, 65, 64, 64, 62, 62, 60],
  },
  {
    id: 'mary', title: 'Mary hatte ein kleines Lamm', clef: 'treble', category: 'volkslied',
    notes: [64, 62, 60, 62, 64, 64, 64, 62, 62, 62, 64, 67, 67, 64, 62, 60, 62, 64, 64, 64, 64, 62, 62, 64, 62, 60],
  },
  {
    id: 'kuckuck', title: 'Kuckuck, Kuckuck, ruft’s aus dem Wald', clef: 'treble', category: 'volkslied',
    notes: [67, 64, 67, 64, 65, 67, 69, 67, 65, 64, 62, 60],
  },
  {
    id: 'london', title: 'London Bridge', clef: 'treble', category: 'volkslied',
    notes: [67, 69, 67, 65, 64, 65, 67, 62, 64, 65, 64, 65, 67, 67, 69, 67, 65, 64, 65, 67, 62, 67, 64, 60],
  },
  {
    id: 'fuchs', title: 'Fuchs, du hast die Gans gestohlen', clef: 'treble', category: 'volkslied',
    notes: [60, 62, 64, 65, 67, 67, 67, 69, 69, 69, 69, 67, 69, 69, 69, 69, 67, 65, 65, 65, 65, 64, 64, 62, 62, 62, 62, 60],
  },
  {
    id: 'happy', title: 'Happy Birthday', clef: 'treble', category: 'volkslied',
    notes: [60, 60, 62, 60, 65, 64, 60, 60, 62, 60, 67, 65, 60, 60, 72, 69, 65, 64, 62, 70, 70, 69, 65, 67, 65],
  },

  // ---- Klassik ----
  {
    id: 'ode', title: 'Ode an die Freude (Beethoven)', clef: 'treble', category: 'klassik',
    notes: [64, 64, 65, 67, 67, 65, 64, 62, 60, 60, 62, 64, 64, 62, 62],
  },
  {
    id: 'fuerelise', title: 'Für Elise (Beethoven)', clef: 'treble', category: 'klassik',
    notes: [76, 75, 76, 75, 76, 71, 74, 72, 69, 60, 64, 69, 71, 64, 68, 71, 72, 64, 76, 75, 76, 75, 76, 71, 74, 72, 69],
  },
  {
    id: 'minuet', title: 'Menuett in G (Bach)', clef: 'treble', category: 'klassik',
    notes: [74, 67, 69, 71, 72, 74, 67, 67, 76, 72, 74, 76, 77, 76, 74, 72, 74, 67],
  },
  {
    id: 'nachtmusik', title: 'Eine kleine Nachtmusik (Mozart)', clef: 'treble', category: 'klassik',
    notes: [67, 62, 67, 62, 67, 62, 67, 74, 71, 67, 62, 67, 62, 67, 62, 67, 74, 71, 67],
  },

  // ---- Modern / Filmmusik ----
  {
    id: 'starwars', title: 'Star Wars (Hauptthema)', clef: 'treble', category: 'modern',
    notes: [67, 67, 67, 72, 79, 77, 76, 74, 84, 79, 77, 76, 74, 84, 79, 77, 76, 77, 74],
  },
  {
    id: 'imperial', title: 'Imperial March (Star Wars)', clef: 'treble', category: 'modern',
    notes: [67, 67, 67, 63, 70, 67, 63, 70, 67, 74, 74, 74, 75, 70, 66, 63, 70, 67],
  },
  {
    id: 'hedwig', title: 'Hedwigs Thema (Harry Potter)', clef: 'treble', category: 'modern',
    notes: [71, 76, 79, 78, 76, 83, 81, 78, 76, 79, 78, 74, 77, 71],
  },
  {
    id: 'pirates', title: 'Pirates of the Caribbean', clef: 'treble', category: 'modern',
    notes: [62, 65, 67, 67, 67, 69, 70, 70, 70, 72, 70, 69, 67, 65, 67, 65, 65, 67, 70, 67, 67, 65, 67, 65],
  },
  {
    id: 'mario', title: 'Super Mario Theme', clef: 'treble', category: 'modern',
    notes: [76, 76, 76, 72, 76, 79, 67, 72, 67, 64, 69, 71, 70, 69, 67, 76, 79, 81, 77, 79, 76, 72, 74, 71],
  },
  {
    id: 'gameofthrones', title: 'Game of Thrones', clef: 'treble', category: 'modern',
    notes: [67, 60, 63, 65, 67, 60, 63, 65, 67, 60, 63, 65, 67, 60, 63, 65, 65, 67, 68, 67, 65, 67, 65, 67, 65],
  },
];
