import { useEffect } from 'react';
import { NoteStaff } from './NoteStaff';
import { ensureAudio, playMidi } from './audio';
import { germanOctaveName, midiToNaturalPitch, type Clef } from './notes';

interface Props {
  clef: Clef;
  onContinue: () => void;
}

// Reference notes per clef.
const REFERENCES: Record<Clef, number[]> = {
  treble: [60, 67, 72], // c¹, g¹, c²
  bass:   [53, 60, 41], // F (kleines f), c¹, großes F
};

export function OrientationIntro({ clef, onContinue }: Props) {
  useEffect(() => { void ensureAudio(); }, []);

  const refs = REFERENCES[clef];

  const playAll = async () => {
    await ensureAudio();
    refs.forEach((m, i) => setTimeout(() => playMidi(m), i * 600));
  };

  return (
    <div className="intro" data-testid="orientation-intro">
      <h1>Orientierungstöne</h1>
      <p className="subtitle">
        {clef === 'treble' ? 'Im Violinschlüssel' : 'Im Bassschlüssel'} helfen dir diese Töne:
      </p>
      <div className="ref-row">
        {refs.map((m) => {
          const p = midiToNaturalPitch(m, clef);
          const name = germanOctaveName(m);
          return (
            <div key={m} className="ref-item">
              <NoteStaff clef={clef} vexKey={p.vexKey} width={220} height={180} label={name} />
              <button
                className="link-btn"
                onClick={async () => { await ensureAudio(); playMidi(m); }}
                data-testid={`ref-play-${m}`}
              >
                ▶ Anhören
              </button>
            </div>
          );
        })}
      </div>
      <div className="intro-actions">
        <button className="link-btn" onClick={playAll}>♪ Alle anhören</button>
        <button className="start-btn" onClick={onContinue} data-testid="intro-continue">
          Weiter
        </button>
      </div>
    </div>
  );
}
