import { BUTTONS_GRID, NAME_TO_PC } from './notes';

export type InputMode = 'piano' | 'buttons' | 'both';

interface Props {
  inputMode: InputMode;
  withAccidentals: boolean;
  onPick: (pitchClass: number) => void;
  disabled?: boolean;
}

// 7 white keys × 2 octaves
const WHITE_KEYS = [
  { label: 'C', pc: 0, alt: 'His' },
  { label: 'D', pc: 2 },
  { label: 'E', pc: 4, alt: 'Fes' },
  { label: 'F', pc: 5, alt: 'Eis' },
  { label: 'G', pc: 7 },
  { label: 'A', pc: 9 },
  { label: 'H', pc: 11, alt: 'Ces' },
];

const BLACK_KEYS = [
  { sharp: 'Cis', flat: 'Des', pc: 1,  after: 0 },
  { sharp: 'Dis', flat: 'Es',  pc: 3,  after: 1 },
  { sharp: 'Fis', flat: 'Ges', pc: 6,  after: 3 },
  { sharp: 'Gis', flat: 'As',  pc: 8,  after: 4 },
  { sharp: 'Ais', flat: 'B',   pc: 10, after: 5 },
];

export function InputArea({ inputMode, withAccidentals, onPick, disabled }: Props) {
  const showPiano = inputMode === 'piano' || inputMode === 'both';
  const showButtons = inputMode === 'buttons' || inputMode === 'both';
  const octaves = 2;
  const whiteCount = WHITE_KEYS.length * octaves;

  return (
    <div className="input-area" data-testid="input-area">
      {showPiano && (
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
                  {k.alt && <span className="alt-label">{k.alt}</span>}
                  <span className="key-label">{k.label}</span>
                </button>
              )),
            )}
          </div>
          <div className="piano-blacks">
            {Array.from({ length: octaves }).map((_, oct) =>
              BLACK_KEYS.map((b) => {
                const offset = oct * WHITE_KEYS.length + b.after;
                const left = `calc((100% / ${whiteCount}) * ${offset + 1} - (100% / ${whiteCount}) * 0.3)`;
                return (
                  <button
                    key={`b-${oct}-${b.sharp}`}
                    className="black-key"
                    disabled={disabled}
                    style={{ left }}
                    data-testid={`piano-black-${b.sharp}-${oct}`}
                    onPointerDown={(e) => { e.preventDefault(); onPick(b.pc); }}
                  >
                    <span className="black-sharp">{b.sharp}</span>
                    <span className="black-divider" />
                    <span className="black-flat">{b.flat}</span>
                  </button>
                );
              }),
            )}
          </div>
        </div>
      )}

      {showButtons && (
        <div
          className={`note-buttons-grid ${withAccidentals ? '' : 'naturals-only'}`}
          data-testid="note-buttons"
        >
          {BUTTONS_GRID.map((row, ri) => (
            row.map((name) => {
              const rowClass = ri === 0 ? 'sharp' : ri === 2 ? 'flat' : 'natural';
              const hidden = !withAccidentals && ri !== 1;
              return (
                <button
                  key={name}
                  className={`note-btn ${rowClass} ${hidden ? 'hidden' : ''}`}
                  disabled={disabled || hidden}
                  data-testid={`note-btn-${name}`}
                  aria-hidden={hidden}
                  onPointerDown={(e) => { e.preventDefault(); onPick(NAME_TO_PC[name]); }}
                >
                  {name}
                </button>
              );
            })
          ))}
        </div>
      )}
    </div>
  );
}
