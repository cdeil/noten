import type { NoteDuration } from './songs';

const RHYTHM_OPTIONS: Array<{ value: NoteDuration; label: string; hint: string }> = [
  { value: 'w', label: 'Ganze Note', hint: '4 Schläge' },
  { value: 'h', label: 'Halbe Note', hint: '2 Schläge' },
  { value: 'q', label: 'Viertelnote', hint: '1 Schlag' },
];

export function RhythmInput({
  onPick,
  disabled,
}: {
  onPick: (value: NoteDuration) => void;
  disabled?: boolean;
}) {
  return (
    <div className="rhythm-input" data-testid="rhythm-input">
      {RHYTHM_OPTIONS.map((option) => (
        <button
          key={option.value}
          className="choice rhythm-choice"
          disabled={disabled}
          data-testid={`rhythm-btn-${option.value}`}
          onPointerDown={(e) => {
            e.preventDefault();
            onPick(option.value);
          }}
        >
          <strong>{option.label}</strong>
          <span>{option.hint}</span>
        </button>
      ))}
    </div>
  );
}
