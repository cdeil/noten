import { useState } from 'react';
import type { GameSettings } from './Game';
import type { Mode } from './notes';

export function Settings({ onStart }: { onStart: (s: GameSettings) => void }) {
  const [mode, setMode] = useState<Mode>('treble');
  const [withAccidentals, setWithAccidentals] = useState(false);
  const [total, setTotal] = useState(30);

  return (
    <div className="settings" data-testid="settings">
      <h1>🎼 Notenlesen lernen</h1>
      <p className="subtitle">Wähle deine Übung</p>

      <section>
        <h2>Schlüssel</h2>
        <div className="choice-row">
          <ChoiceButton testid="mode-treble" active={mode === 'treble'} onClick={() => setMode('treble')}>
            Violinschlüssel
          </ChoiceButton>
          <ChoiceButton testid="mode-bass" active={mode === 'bass'} onClick={() => setMode('bass')}>
            Bassschlüssel
          </ChoiceButton>
          <ChoiceButton testid="mode-mixed" active={mode === 'mixed'} onClick={() => setMode('mixed')}>
            Gemischt
          </ChoiceButton>
        </div>
      </section>

      <section>
        <h2>Vorzeichen</h2>
        <div className="choice-row">
          <ChoiceButton testid="acc-off" active={!withAccidentals} onClick={() => setWithAccidentals(false)}>
            Nur Stammtöne
          </ChoiceButton>
          <ChoiceButton testid="acc-on" active={withAccidentals} onClick={() => setWithAccidentals(true)}>
            Mit ♯ und ♭
          </ChoiceButton>
        </div>
      </section>

      <section>
        <h2>Runde</h2>
        <div className="choice-row">
          {[10, 20, 30, 0].map((n) => (
            <ChoiceButton
              key={n}
              testid={`total-${n}`}
              active={total === n}
              onClick={() => setTotal(n)}
            >
              {n === 0 ? '∞ Endlos' : `${n} Noten`}
            </ChoiceButton>
          ))}
        </div>
      </section>

      <button
        className="start-btn"
        data-testid="start-btn"
        onClick={() => onStart({ mode, withAccidentals, total })}
      >
        ▶ Los geht&apos;s!
      </button>
    </div>
  );
}

function ChoiceButton({
  active, onClick, children, testid,
}: { active: boolean; onClick: () => void; children: React.ReactNode; testid: string }) {
  return (
    <button
      className={`choice ${active ? 'active' : ''}`}
      onClick={onClick}
      data-testid={testid}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}
