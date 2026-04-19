import { NoteStaff } from './NoteStaff';
import { ensureAudio, playMidi } from './audio';
import { germanShortName, midiToNaturalPitch, type Clef } from './notes';

interface Props {
  clef: Clef;
}

// Reference notes per clef (Violin: c¹, g¹, c² · Bass: großes F, kleines f, c¹)
const REFERENCES: Record<Clef, number[]> = {
  treble: [72, 67, 60], // c'', g', c'  (top to bottom on screen)
  bass:   [60, 53, 41], // c', f, ,F
};

export function OrientationPanel({ clef }: Props) {
  const refs = REFERENCES[clef];
  return (
    <aside className="orient-panel" data-testid="orient-panel">
      <div className="orient-title">Orientierung</div>
      {refs.map((m) => {
        const p = midiToNaturalPitch(m, clef);
        const short = germanShortName(m);
        return (
          <button
            key={m}
            className="orient-item"
            onPointerDown={async (e) => { e.preventDefault(); await ensureAudio(); playMidi(m); }}
            data-testid={`orient-ref-${m}`}
            title="Anhören"
          >
            <NoteStaff clef={clef} vexKey={p.vexKey} width={130} height={110} />
            <div className="orient-label">{short}</div>
          </button>
        );
      })}
    </aside>
  );
}
