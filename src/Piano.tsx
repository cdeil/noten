import { BUTTON_LABELS } from './notes';

interface Props {
  withAccidentals: boolean;
  onPick: (pitchClass: number) => void;
  disabled?: boolean;
}

const WHITE_KEYS = [
  { label: 'C', pc: 0 },
  { label: 'D', pc: 2 },
  { label: 'E', pc: 4 },
  { label: 'F', pc: 5 },
  { label: 'G', pc: 7 },
  { label: 'A', pc: 9 },
  { label: 'H', pc: 11 },
];

const BLACK_KEYS = [
  { label: 'Cis', pc: 1, after: 0 },
  { label: 'Es',  pc: 3, after: 1 },
  { label: 'Fis', pc: 6, after: 3 },
  { label: 'As',  pc: 8, after: 4 },
  { label: 'B',   pc: 10, after: 5 },
];

export function Piano({ withAccidentals, onPick, disabled }: Props) {
  const octaves = 2;
  const whiteCount = WHITE_KEYS.length * octaves;

  return (
    <div className="piano-wrap">
      <div className="piano" data-testid="piano">
        <div className="piano-whites">
          {Array.from({ length: octaves }).map((_, oct) =>
            WHITE_KEYS.map((k) => (
              <button
                key={`w-${oct}-${k.label}`}
                className="white-key"
                disabled={disabled}
                data-testid={`piano-white-${k.label}-${oct}`}
                onPointerDown={(e) => { e.preventDefault(); onPick(k.pc); }}
              >
                <span className="key-label">{k.label}</span>
              </button>
            )),
          )}
        </div>
        {withAccidentals && (
          <div className="piano-blacks">
            {Array.from({ length: octaves }).map((_, oct) =>
              BLACK_KEYS.map((b) => {
                const offset = oct * WHITE_KEYS.length + b.after;
                const left = `calc((100% / ${whiteCount}) * ${offset + 1} - (100% / ${whiteCount}) * 0.3)`;
                return (
                  <button
                    key={`b-${oct}-${b.label}`}
                    className="black-key"
                    disabled={disabled}
                    style={{ left }}
                    data-testid={`piano-black-${b.label}-${oct}`}
                    onPointerDown={(e) => { e.preventDefault(); onPick(b.pc); }}
                  >
                    <span className="key-label-black">{b.label}</span>
                  </button>
                );
              }),
            )}
          </div>
        )}
      </div>
      <div className="note-buttons" data-testid="note-buttons">
        {BUTTON_LABELS.filter((b) => withAccidentals || !b.isAccidental).map((b) => (
          <button
            key={b.label}
            className={`note-btn ${b.isAccidental ? 'acc' : ''}`}
            disabled={disabled}
            data-testid={`note-btn-${b.label}`}
            onPointerDown={(e) => { e.preventDefault(); onPick(b.pitchClass); }}
          >
            {b.label}
          </button>
        ))}
      </div>
    </div>
  );
}
